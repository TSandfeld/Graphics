// Counters
var numPoints = 0;
var triCount = 0;
var circleCount = 0;

// Indices
var points = [];
var triangles = [];
var circles = [];

// Colors
var chosenColor;
var colors = [];
var triColors = [];
var circleColors = [];

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
var isCircleMode = false

function togglePointMode() {
    isPointMode = true;
    isTriangleMode = false;
    isCircleMode = false;

    triCount = 0;
    circleCount = 0;
}

function toggleTriangleMode() {
    isPointMode = false;
    isTriangleMode = true;
    isCircleMode = false;

    triCount = 0;
    circleCount = 0;
}

function toggleCircleMode() {
    isPointMode = false;
    isTriangleMode = false;
    isCircleMode = true;

    triCount = 0;
    circleCount = 0;
}

function canvasClicked() {
    const mouseRect = event.target.getBoundingClientRect()
    const x = event.clientX - mouseRect.left/2 - 5; // 5 is radius/2, where radius = pointSize/2 in shader
    const y = event.clientY - mouseRect.top;
    
    const xCanvas = -1 + 2*x/canvas.width;
    const yCanvas = -1 + 2*(canvas.height-y)/canvas.height;
    
    if (isTriangleMode) {
        triCount++;
    } else if (isCircleMode) {
        circleCount++;
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

    if (isCircleMode && circleCount == 2) {
        var _ = colors.pop();
        var centerPointColor = colors.pop();

        var secondPoint = points.pop();
        var centerPoint = points.pop();
        var radius = distanceBetweenCircles(centerPoint, secondPoint);
        drawCircle(centerPoint, radius, centerPointColor);

        circleCount = 0;
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
    triCount = 0;
    circleCount = 0;

    // Clear elements array
    points = [];
    triangles = [];
    circles = [];

    // Clear colors array
    colors = [];
    triColors = [];
    circleColors = [];
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

    if (circles.length > 0) {
        for (var i = 0; i < circles.length; i++) {
            var c = circles[i];
            var cc = circleColors[i];
            drawElements(cc, c);

            renderCircles();
        }
    }
}

function drawCircle(center, r, cColor) {
    var c = [center];
    var cc = [cColor];

    var x0 = center[0];
    var y0 = center[1];

    var noOfFans = 180;
    var anglePerFan = (2*Math.PI) / noOfFans;

    for (var i = 0; i <= noOfFans; i++) {
        var angle = anglePerFan * (i+1);
        var x = x0 + r*Math.cos(angle);
        var y = y0 + r*Math.sin(angle);
        c.push(vec2(x,y));
        cc.push(chosenColor);
    }

    circles.push(c);
    circleColors.push(cc);
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

function renderCircles() {
    gl.drawArrays(gl.TRIANGLE_FAN, 0, flatten(circles).length/circles.length);
}

function distanceBetweenCircles(c1, c2) {
    var c1x = c1[0];
    var c1y = c1[1];

    var c2x = c2[0];
    var c2y = c2[1];

    return Math.sqrt( Math.pow(c2x - c1x, 2) + Math.pow(c2y - c1y, 2) );
}