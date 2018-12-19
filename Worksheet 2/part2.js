var numPoints;
var points = [];
var chosenColor;
var colors = [];

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


function canvasClicked() {
    const mouseRect = event.target.getBoundingClientRect()
    const x = event.clientX - mouseRect.left/2 - 5; // 5 is radius/2, where radius = pointSize/2 in shader
    const y = event.clientY - mouseRect.top;
    
    const xCanvas = -1 + 2*x/canvas.width;
    const yCanvas = -1 + 2*(canvas.height-y)/canvas.height;
    
    colors.push(chosenColor);
    points.push([xCanvas,yCanvas]);
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

    // Clear points array
    points = [];

    // Clear colors array
    colors = [];
}

function renderPoints() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    setColorOfElement();

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}


function setColorOfElement() {
    var buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}

function render() {
  gl.drawArrays(gl.POINTS, 0, points.length);
}