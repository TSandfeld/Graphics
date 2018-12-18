var pointsArray = [];
var texCoordsArray = [ ];
var theta = 0;

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
    vec3(-1, -1, -2.5),
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
var aspect = 1;


var light = vec3(0.0, 2.0, -2.0);
var m = mat4();

m[3][3] = 0.0;
m[3][1] = -1.0/light[1];


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

modelViewMatrix = lookAt(eye, at, up);
projectionMatrix = perspective(fovy, aspect, near, far)

var ground = document.createElement('img');
ground.crossorigin = 'anonymous';


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

    //Shadow texture
    gl.activeTexture(gl.TEXTURE2);
    textureBlack = gl.createTexture();
    blackColor = new Uint8Array([0,0,0]);
    gl.bindTexture(gl.TEXTURE_2D, textureBlack);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, blackColor)
    
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
    theta += 0.01;
    if (theta > 2*Math.PI) {
        theta -= 2*Math.PI;
    }

    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    light[0] = Math.sin(theta)*2;
    light[2] = Math.cos(theta)*2-2;

    sModelViewMatrix = mult(modelViewMatrix, translate(light[0], light[1]-1, light[2]));
    sModelViewMatrix = mult(sModelViewMatrix, m);
    sModelViewMatrix = mult(sModelViewMatrix, translate(-light[0], -(light[1]-1), -light[2]));
    
    //Draw ground
    gl.uniform1i(textureLoc, 0);
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    //Draw shadows
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(sModelViewMatrix));
    gl.uniform1i(textureLoc, 2);
    gl.drawArrays(gl.TRIANGLES, numVertices, numVertices*2);

    //Draw red rectangles
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniform1i(textureLoc, 1);
    gl.drawArrays(gl.TRIANGLES, numVertices, numVertices*2);
   
   
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
    textureLoc = gl.getUniformLocation(program, 'texture');

    render();
    
}