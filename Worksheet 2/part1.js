var numPoints;
var points = [];

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


    points = [ [1,1], [1,0], [0,0] ];
    renderPoints();
}

function canvasClicked() {
    const mouseRect = event.target.getBoundingClientRect()
    const x = event.clientX - mouseRect.left/2 - 5; // 5 is radius/2, where radius = pointSize/2 in shader
    const y = event.clientY - mouseRect.top;

    const xCanvas = -1 + 2*x/canvas.width;
    const yCanvas = -1 + 2*(canvas.height-y)/canvas.height;

    points.push([xCanvas,yCanvas]);
    renderPoints();
}

function renderPoints() {
    numPoints = points.length;

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, numPoints);
}