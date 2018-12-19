var vertices = [
    vec3(-0.5, -0.5,  0.5),
    vec3(-0.5,  0.5,  0.5),
    vec3(0.5,  0.5,  0.5),
    vec3(0.5, -0.5,  0.5),
    vec3(-0.5, -0.5, -0.5),
    vec3(-0.5,  0.5, -0.5),
    vec3(0.5,  0.5, -0.5),
    vec3(0.5, -0.5, -0.5)
];

var vertexColors = [
    [ 0.0, 0.0, 0.0, 1.0 ],  // black
    [ 1.0, 0.0, 0.0, 1.0 ],  // red
    [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
    [ 0.0, 1.0, 0.0, 1.0 ],  // green
    [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
    [ 1.0, 1.0, 1.0, 1.0 ],  // white
    [ 0.0, 1.0, 1.0, 1.0 ]   // cyan
];

var indices = [
    1, 0, 3,
    3, 2, 1,
    2, 3, 7,
    7, 6, 2,
    3, 0, 4,
    4, 7, 3,
    6, 5, 1,
    1, 2, 6,
    4, 5, 6,
    6, 7, 4,
    5, 4, 0,
    0, 1, 5
  ];



// Tetrahedron
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var pointsArray = [];
var subdivisionLevel = 5;

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

    createSphere();
}

function createSphere() {
    pointsArray = [];
    tetrahedron(va, vb, vc, vd, subdivisionLevel);

    gl.cullFace(gl.BACK);

    // Position
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    setIsometric(0, 0, 0);
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

function triangle(a, b, c){
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
}

function createCube(x, rotX, rotY) {
    // Position
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // Colors
    var buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Indices
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    setIsometric(x, rotX, rotY);
    render();
}

function setIsometric(x, rotX, rotY) {
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // Model matrix, (coordinates of cube in world)
    // View Matrix - 3 vectors, position (where to look from = eye), 
    //      up vector (0,1,0), 
    //      at point (center of what to look at)
    // Perspective projection matrix

    var at = vec3(x, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    var eye = vec3(0, 0, -2);

    var near = 0.001;
    var far = 1000;

    var modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = scaleCube(modelViewMatrix, 0.5);

    var projectionMatrix = translate(x, 0, 0);
    projectionMatrix = perspective(45, 1, near, far);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
}

function scaleCube(matrix, scale) {
    var mat = mat4(
        scale, 0, 0, 0,
        0, scale, 0, 0,
        0, 0, scale, 0,
        0, 0, 0, 1
        );
    return mult(matrix, mat)
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, pointsArray.length);
}