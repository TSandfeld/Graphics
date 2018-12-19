var numPoints = 0;
var points = [];
var triangles = [];
var triCount = 0;
var chosenColor;
var colors = [];
var triColors = [];

window.onload = function() {
    canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.log("Failed to get rendering context for WebGL");
        return
    }
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    chosenColor = [0.0, 0.0, 0.0, 1.0]; // Black
}

var isPointMode = true;
var isTriangleMode = false;

function togglePointMode() {
    isPointMode = true;
    isTriangleMode = false;

    triCount = 0;
}

function toggleTriangleMode() {
    isPointMode = false;
    isTriangleMode = true;

    triCount = 0;
}

function canvasClicked() {
    const mouseRect = event.target.getBoundingClientRect()
    const x = event.clientX - mouseRect.left/2 - 5; // 5 is radius/2, where radius = pointSize/2 in shader
    const y = event.clientY - mouseRect.top;
    
    const xCanvas = -1 + 2*x/canvas.width;
    const yCanvas = -1 + 2*(canvas.height-y)/canvas.height;
    
    if (isTriangleMode) {
        triCount++;
    }

    points.push([xCanvas,yCanvas]);
    colors.push(chosenColor);
    if (isTriangleMode && triCount == 3) {
        for (var i = 0; i < 3; i++) {
            var p = points.pop();
            triangles.push(p);

            var c = colors.pop();
            triColors.push(c);
        }

        triCount = 0;
    }
    
    numPoints++;
    renderPoints();
}

function colorMenuClicked() {
    var colorPalette = [
        vec4(0.0, 0.0, 0.0, 1.0),  // black
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(1.0, 1.0, 0.0, 1.0),  // yellow
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
        vec4(1.0, 0.0, 1.0, 1.0),  // magenta
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 1.0, 1.0, 1.0),  // white
        vec4(0.3921, 0.5843, 0.9294, 1.0) // cornflower
      ];

    var m = document.getElementById("colorMenu");
    chosenColor = colorPalette[m.selectedIndex];
}

function clearCanvas() {
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    numPoints = 0;

    // Clear points array
    points = [];

    // Clear triangles array
    triangles = [];

    // Clear colors array
    colors = [];
    triColors = [];
}

function renderPoints() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (points.length > 0) {
        drawElements(colors, points);

        renderOnlyPoints();
    }


    if (triangles.length > 0) {
        drawElements(triColors, triangles);

        renderTriangles();
    }
}

function drawElements(colors, elements) {
    setColorOfElement(colors);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(elements), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function setColorOfElement(c) {
    var buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(c), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}

function renderTriangles() {
    gl.drawArrays(gl.TRIANGLES, 0, triangles.length);
}

function renderOnlyPoints() {
    gl.drawArrays(gl.POINTS, 0, points.length);
}