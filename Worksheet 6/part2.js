var vertices = [
    vec4(-4, -1,  -1, 1.0),
    vec4(4,  -1,  -1, 1.0),
    vec4(4,  -1,  -21, 1.0),
    vec4(-4, -1,  -21, 1.0)
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

var indices = [
  0, 1,
  1, 2,
  2, 3,
  3, 0
]

var texCoord = [
  vec2(-1,5, 0.0),
  vec2(2.5, 0.0),
  vec2(2.5, 10.0),
  vec2(-1.5, 10.0)
]

var texSize = 64;
var numRows = 8;
var numCols = 8;
var myTexels = new Uint8Array(4*texSize*texSize);

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var program;

var chosenWrap;
var chosenMinFilt;
var chosenFilt;

window.onload = function() {
    initGLAndSetViewPort();

    chosenWrap = gl.REPEAT;
    chosenFilt = gl.NEAREST;
    chosenMinFilt = gl.NEAREST_MIPMAP_NEAREST;
    document.getElementById("wrapRepeat").checked = true;
    document.getElementById("filterMipmap").checked = true;

    createObject();
}

function setMode(element) {
    console.log(element.value);
    var val = element.value;
    if (val == "Repeat") {
        chosenWrap = gl.REPEAT;
    } else if (val == "Clamp") {
        chosenWrap = gl.CLAMP_TO_EDGE;
    }else if (val == "Nearest") {
        chosenFilt = gl.NEAREST;
        chosenMinFilt = gl.NEAREST;
    } else if (val == "Linear") {
        chosenFilt = gl.LINEAR;
        chosenMinFilt = gl.LINEAR;
    } else if (val == "Mipmap") {
        chosenFilt = gl.NEAREST;
        chosenMinFilt = gl.NEAREST_MIPMAP_NEAREST;
    }
    clearAndRedraw();
}

function clearAndRedraw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    myTexels = new Uint8Array(4*texSize*texSize);
    pointsArray = [];
    colorsArray = [];
    texCoordsArray = [];

    createObject();
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
}

function createObject() {

    generateTexels();
    quad(1, 0, 3, 2);

    // Color
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Position
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Texture
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    bindTexture();

    setIsometric();
    render();
}

function bindTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);

    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, chosenMinFilt);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, chosenFilt);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, chosenWrap);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, chosenWrap);
}

function generateTexels() {
  for (var i = 0; i < texSize; ++i) {
    for (var j = 0; j < texSize; ++j) {
      var patchx = Math.floor(i/(texSize/numRows));
      var patchy = Math.floor(j/(texSize/numCols));
      var c = (patchx%2 !== patchy%2 ? 255 : 0);

      myTexels[4*i*texSize+4*j] =c;
      myTexels[4*i*texSize+4*j+1] = c;
      myTexels[4*i*texSize+4*j+2] = c;
      myTexels[4*i*texSize+4*j+3] = 255;
    }
  }

}


function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[3]);
}

function setIsometric() {
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // Model matrix, (coordinates of cube in world)
    // View Matrix - 3 vectors, position (where to look from = eye),
    //      up vector (0,1,0),
    //      at point (center of what to look at)
    // Perspective projection matrix

    var at = vec3(0, -1, -11);
    var eye = vec3(0, 2, 2);
    var up = vec3(0, 1, 0);

    var near = 0.001;
    var far = 1000;

    var modelViewMatrix = lookAt(eye, at, up);

    var projectionMatrix = perspective(90, 1, near, far);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, 6 );
}