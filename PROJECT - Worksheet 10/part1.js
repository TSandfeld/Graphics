var at = vec3(0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var eye = vec3(0, 1, 4);

var near = 0.001;
var far = 1000;
var fovy = 65;
var aspect;

var theta = 0.0;

var light = vec3(0, 0, 1);

var cubemap = ['textures/cm_left.png',    // POSITIVE_X
               'textures/cm_right.png',   // NEGATIVE_X
               'textures/cm_top.png',     // POSITIVE_Y
               'textures/cm_bottom.png',  // NEGATIVE_Y
               'textures/cm_back.png',    // POSITIVE_Z
               'textures/cm_front.png'];  // NEGATIVE_Z

var imageCount = cubemap.length;
var images = new Array(imageCount);

// Tetrahedron
var va = vec3(0.0, 0.0, 1.0);
var vb = vec3(0.0, 0.942809, -0.333333);
var vc = vec3(-0.816497, -0.471405, -0.333333);
var vd = vec3(0.816497, -0.471405, -0.333333);


  
var pointsArray = [];
var subdivisionLevel = 5;

var texture;
var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;

var program;

var loadCount = 0;
window.onload = function() {
    initGLAndSetViewPort();
    
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
    for (var i = 0; i < imageCount; i++) {
        images[i] = document.createElement("img");
        images[i].crossOrigin = "anonymous";
        images[i].onload = loadImage;
        images[i].src = cubemap[i];
    }
}

function loadImage() {
    loadCount++;

    if (loadCount == imageCount) {
        createObject();
    }
}

function createObject() {
    pointsArray = [];
    theta = 0;
    aspect = canvas.width / canvas.height;
    tetrahedron(va, vb, vc, vd, subdivisionLevel);

    setView();
    initBuffersAndPointers();
    configureTexture();
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
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.cullFace(gl.BACK);
}

function initBuffersAndPointers() {
    // Position
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Normals
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vNormals = gl.getAttribLocation(program, "vNormals");
    gl.vertexAttribPointer(vNormals, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormals);
}

function configureTexture() {
    texture = gl.createTexture();

    let MAP_COORDS = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ]

    gl.bindTexture( gl.TEXTURE_CUBE_MAP, texture );
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR );

    for (var i = 0; i < MAP_COORDS.length; i++) {
        gl.bindTexture( gl.TEXTURE_CUBE_MAP, texture );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D( MAP_COORDS[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i] );
    }

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
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
        var ab = normalize(mix(a, b, 0.5));
        var ac = normalize(mix(a, c, 0.5));
        var bc = normalize(mix(b, c, 0.5));
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

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    requestAnimFrame(render);
}