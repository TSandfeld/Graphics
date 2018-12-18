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
    0, 1,
    1, 2,
    2, 3,
    0, 3,

    4, 5,
    5, 6,
    6, 7,
    4, 7,

    3, 7,
    2, 6,

    1, 5,
    0, 4,

];

var numVertices  = indices.length;

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

    createCube(-0.5, 30, 45);
    createCube(0.0, 0, 0);
    createCube(0.5, 0, 40);
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
    modelViewMatrix = mult(modelViewMatrix, rotateX(rotX));
    modelViewMatrix = mult(modelViewMatrix, rotateY(rotY));
    modelViewMatrix = scaleCube(modelViewMatrix, 0.3);

    var projectionMatrix = perspective(45, 1, near, far);
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
    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
}