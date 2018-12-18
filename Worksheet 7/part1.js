var pointsArray = [];
var texCoordsArray = [ ];

var numVertices = 6;

var verticeCoords = [
    //Ground
    vec3(-2, -1, -1),
    vec3(2, -1, -1),
    vec3(2, -1, -5),
    vec3(-2, -1, -1),
    vec3(2, -1, -5),
    vec3(-2, -1, -5),     
    //Red parallel
    vec3(0.25, -0.5, -1.25),
    vec3(0.75, -0.5, -1.25),
    vec3(0.75, -0.5, -1.75),
    vec3(0.25, -0.5, -1.25),
    vec3(0.75, -0.5, -1.75),
    vec3(0.25, -0.5, -1.75),
    //Red perpendicular
    vec3(-1, 0, -2.5),
    vec3(-1 , -1, -2.5),
    vec3(-1, -1, -3),
    vec3(-1, 0, -2.5),
    vec3(-1, 0, -3),
    vec3(-1, -1, -3)
];

var at = vec3(0, 0, -3);
var up = vec3(0.0, 1.0, 0.0);
var eye = vec3(6, 6, 0);

var near = 0.1;
var far = 100;
var fovy = 45;

var texSize = 64;
var numRows = 8;
var numCols = 8;


var texCoord = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 0),
    vec2(1, 1),
    vec2(0, 1),
];

var zeroTexCoord = new Array(12).fill(0,0,12)

var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;

var ground = document.createElement('img');
ground.crossorigin = 'anonymous';


function generateCheckerBoardImage() {
    myTexels = new Uint8Array(4 * texSize * texSize);    
    for ( i = 0; i < texSize; i++ ) {
        for ( j = 0; j < texSize; j++ ) {
            patchx = Math.floor(i / (texSize / numRows));
            patchy = Math.floor(j/( texSize / numCols));
            if(patchx%2 ^ patchy%2) {
                c = 255;
            } else {
                c = 0;
            }
            myTexels[ 4 * i * texSize + 4 * j] = c;
            myTexels[ 4 * i * texSize + 4 * j + 1] = c;
            myTexels[ 4 * i * texSize + 4 * j + 2] = c;
            myTexels[ 4 * i * texSize + 4 * j + 3] = 255;
        }
    }
}

function configureTexture() {
    //Ground texture
    gl.activeTexture(gl.TEXTURE0);
    textureGround = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, textureGround );
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, ground);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );

    //Red texture
    gl.activeTexture(gl.TEXTURE1);
    textureRed = gl.createTexture();
    redColor = new Uint8Array([255,0,0]);
    gl.bindTexture(gl.TEXTURE_2D, textureRed);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, redColor)
}


function createBuffers() {


    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
    

}



function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, canvas.width / canvas.height, near, far)

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);
    gl.drawArrays(gl.TRIANGLES, numVertices, (numVertices+numVertices));

    requestAnimationFrame(render);

}

ground.src = "xamp23.png";

ground.onload = function() {
    canvas = document.getElementById("c");

    //Init WebGL
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.log("Failed to get rendering context for WebGL");
        return
    }
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );

    
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    pointsArray = [].concat(verticeCoords);
    texCoordsArray = [].concat(texCoord, zeroTexCoord);

    createBuffers();
    
    configureTexture();

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    render();
    
}