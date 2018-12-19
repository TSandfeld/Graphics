var at = vec3(0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var eye = vec3(0, 0, -2);

var near = 0.001;
var far = 1000;

// Tetrahedron
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var pointsArray = [];
var normalsArray = [];
var subdivisionLevel = 3;

var lightDirection = vec4(0.0, 0.0, -1.0, 0.0);

var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;

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
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    createSphere();
}

function createSphere() {
    pointsArray = [];
    normalsArray = [];
    theta = 0;
    tetrahedron(va, vb, vc, vd, subdivisionLevel);

    gl.cullFace(gl.BACK);

    // Position
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Normal
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    setView();
    render();
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function decrementSubdivision() {
    if (subdivisionLevel > 0) {
        subdivisionLevel--;
    }
    createSphere();
    setLevelText();
}

function incrementSubdivision() {
    subdivisionLevel++;
    createSphere();
    setLevelText();
}

function setLevelText() {
    document.getElementById("level").innerHTML = "Subdivision level = " + subdivisionLevel;
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);
        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle(a, b, c);
    }
}

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
}

var modelViewMatrix;
function setView() {

    // Model matrix, (coordinates of cube in world)
    // View Matrix - 3 vectors, position (where to look from = eye), 
    //      up vector (0,1,0), 
    //      at point (center of what to look at)
    // Perspective projection matrix

    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = scaleObject(modelViewMatrix, 0.5);

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
}

function scaleObject(matrix, scale) {
    var mat = mat4(
        scale, 0, 0, 0,
        0, scale, 0, 0,
        0, 0, scale, 0,
        0, 0, 0, 1
        );
    return mult(matrix, mat)
}

var radius = 1;
var theta = 0.5;
var phi = 0.5;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta += 0.01;

    eye = vec3(
        radius*Math.sin(theta)*Math.cos(phi),
        0, 
        radius*Math.cos(theta)
    );

    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = scaleObject(modelViewMatrix, 0.5);

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    requestAnimFrame(render);
}