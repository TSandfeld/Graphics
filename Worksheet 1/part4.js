var numPoints = 6;
var theta = 0.0;

window.onload = init;

function init() {
    canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.log("Failed to get rendering context for WebGL");
        return
    }
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    drawQuadraliteral(gl, program);
    colorQuadraliteralIn(gl, program);

    render();
}

function drawQuadraliteral(gl, program) {
    points = [ 
        vec2(-0.5,0), vec2(0,-0.5), vec2(0.5,0), 
        vec2(-0.5,0), vec2(0,0.5), vec2(0.5,0)
    ];

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function colorQuadraliteralIn(gl, program) {
    colors = [ vec4(1.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0),
        vec4(1.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0)
    ];

    var buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}

function spinQuadraliteral() {
    var thetaLoc = gl.getUniformLocation(program, "theta");
    theta += 0.01;
    gl.uniform1f(thetaLoc, theta);
    gl.drawArrays(gl.TRIANGLES, 0, numPoints);
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT);

    spinQuadraliteral(gl)

    requestAnimFrame(render);
}