var at = vec3(0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var eye = vec3(0, 1, 2);

var near = 0.001;
var far = 1000;
var fovy = 65;
var aspect;

var theta = 0.0;

var light = vec3(0, 0, 1);

// Tetrahedron
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);
  
var pointsArray = [];
var subdivisionLevel = 5;

var texture;
var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;

var program;

var image = document.createElement('img');
image.crossOrigin = "anonymous";
image.src = "earth.jpg";

image.onload = function() {
    initGLAndSetViewPort();
    
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
    createObject();
}

function createObject() {
    pointsArray = [];
    theta = 0;
    aspect = canvas.width / canvas.height;
    tetrahedron(va, vb, vc, vd, subdivisionLevel);

    setView();
    initBuffersAndPointers();
    configureTexture( image );
    render();
}

function initGLAndSetViewPort() {
    canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.log("Failed to get rendering context for WebGL");
        return
    }

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.cullFace(gl.BACK);
}

function multiplyMatrixByVector(M, v) {
    var Mv = [];
    for (var i = 0; i < v.length; i++) {
        var sum = 0;
        for (var j = 0; j < v.length; j++) {
            sum += M[j][i] * v[i];
        }
        Mv.push(sum);
    }
    // AND MY
    return Mv;
}

function initBuffersAndPointers() {
    // Position
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Camera eye
    var cameraEye = gl.getUniformLocation(program, "vCameraEye");
    var projEye = normalize(multiplyMatrixByVector(projectionMatrix, eye));
    gl.uniform3fv(cameraEye, flatten(projEye));
}

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    // Camera light
    var cameraLight = gl.getUniformLocation(program, "vCameraLight");
    var projLight = normalize(multiplyMatrixByVector(projectionMatrix, light));
    gl.uniform3fv(cameraLight, flatten(projLight));
}

function setView() {
    // Model matrix, (coordinates of cube in world)
    // View Matrix - 3 vectors, position (where to look from = eye), 
    //      up vector (0,1,0), 
    //      at point (center of what to look at)
    // Perspective projection matrix

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
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
}

function render() {
    theta += 0.01;
    
    eye[0] = Math.sin(theta) * 2;
    eye[2] = Math.cos(theta) * 2;
    modelViewMatrix = lookAt(eye, at, up);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    requestAnimFrame(render);
}