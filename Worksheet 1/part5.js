var numPoints = 80;
var theta = 0.0;
var shouldGoUp = false;

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

    drawCircle(gl, program);

    render();
}

function drawCircle(gl, program) {
    points = [
        vec2(0,0) // Center of circle
    ];

    var r = 0.25;
    var noOfFans = 180;
    var anglePerFan = (2*Math.PI) / noOfFans;

    for (var i = 0; i <= noOfFans; i++) {
        var angle = anglePerFan * (i+1);
        var x = r*Math.cos(angle);
        var y = r*Math.sin(angle);
        points.push(vec2(x,y));
    }

    numPoints = points.length;

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function bounceCircle() {
    var thetaLoc = gl.getUniformLocation(program, "theta");
    
    if (shouldGoUp) {
        if (theta < 0.76) {
            theta += 0.01;
        } else {
            shouldGoUp = false;
        }
    } else {
        if (theta > -0.76) {
            theta -= 0.01;
        } else {
            shouldGoUp = true;
        }
    }

    gl.uniform1f(thetaLoc, theta);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints);
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT);

    bounceCircle();

    requestAnimFrame(render);
}