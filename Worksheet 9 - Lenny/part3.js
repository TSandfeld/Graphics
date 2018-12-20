var near = 0.1;
var far = 1000;
var fovy = 65;
var aspect = 1

var at = vec3(0, 0, -3);
var eye = vec3(0, 0, 1);
var up = vec3(0, 1, 0);

var light = vec3(0.0, 2.0, -2.0);

var positions = [
    vec3(-2, -1, -1),
    vec3(2, -1, -1),
    vec3(2, -1, -5),
    vec3(-2, -1, -1),
    vec3(2, -1, -5),
    vec3(-2, -1, -5)
];

var textureCoords = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 0),
    vec2(1, 1),
    vec2(0, 1)
];


var normals = new Array(6).fill(vec3(0, 0, 0));


var viewMatrix = lookAt(eye, at, up);
var depthViewMatrix = lookAt(light, at, up);

var projectionMatrix = perspective(fovy, aspect, near, far);
shadowProjectionMatrix = mat4();
shadowProjectionMatrix[3][3] = 0;
shadowProjectionMatrix[3][1] = -1 / light[1];

var teapotMoving = true;
var pointLightMoving = true;
var phi = 0;
var theta = 0;

var program;
var gProgram;
var depthProgram;

var teapotVariables;
var groundVariables;
var depthVariables;

var colorTexture;
var depthTexture;
var framebuffer;

function switchTeapot(){
    teapotMoving = !teapotMoving;
};

function switchLight(){
    pointLightMoving = !pointLightMoving;
};
    
var groundImage = document.createElement('img');
groundImage.src = 'xamp23.png';

function loadTeapotFile(name) {
    var xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    xhr.open('GET', name, false);
    xhr.send(null);
    
    return xhr.status == okStatus ? xhr.responseText : null;
};


function initTeapot() {      
    teapotFile = loadTeapotFile('teapot.obj');
    teapot = new OBJDoc('teapot.obj');
    teapot.parse(teapotFile, 0.25, false);

    for (var i = 0; i < teapot.objects[0].faces.length; i++) {
        face = teapot.objects[0].faces[i];
        for (var j = 0; j < 3; j++) {
            vertex = teapot.vertices[face.vIndices[j]];
            normal = teapot.normals[face.nIndices[j]];
            positions.push(vec3(vertex.x, vertex.y, vertex.z));
            normals.push(vec3(normal.x, normal.y, normal.z));
            textureCoords.push(vec3(0, 0, 0));
        }
    }
}


function initTeapotDataBuffers() {
    teapotVariables = {
        attrPos: {
            location: gl.getAttribLocation(program, 'attrPos'),
            buffer: gl.createBuffer()
        },
        attrTex: {
            location: gl.getAttribLocation(program, 'attrTex'),
            buffer: gl.createBuffer()
        },
        uniformMV: gl.getUniformLocation(program, 'uniformMV'),
        uniformProjection: gl.getUniformLocation(program, 'uniformProjection'),
        uniformTex: gl.getUniformLocation(program, 'uniformTex'),
        uniformShadow: gl.getUniformLocation(program, 'uniformShadow'),
        uniformDepthMVP: gl.getUniformLocation(program, 'uniformDepthMVP')
    };
}

function initGroundDataBuffers() {
    groundVariables = {
        attrPosModel: {
            location: gl.getAttribLocation(groundProgram, 'attrPosModel'),
            buffer: gl.createBuffer()
        },
        attrNormalModel: {
            location: gl.getAttribLocation(groundProgram, 'attrNormalModel'),
            buffer: gl.createBuffer()
        },
        uniformMV: gl.getUniformLocation(groundProgram, 'uniformMV'),
        uniformProjection: gl.getUniformLocation(groundProgram, 'uniformProjection'),
        uniformNormal: gl.getUniformLocation(groundProgram, 'uniformNormal'),
        uniformLight: gl.getUniformLocation(groundProgram, 'uniformLight')
    }
}

function initDepthDataBuffers() {
    depthVariables = {
        attrPos: {
            location: gl.getAttribLocation(depthProgram, 'attrPos'),
            buffer: gl.createBuffer()
        },
        uniformMV: gl.getUniformLocation(depthProgram, 'uniformMV'),
        uniformProjection: gl.getUniformLocation(depthProgram, 'uniformProjection')
    }
}

function createTextureForDepth() {
    colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
 
    gl.activeTexture(gl.TEXTURE3);
    depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function bindBuffersForTeapot() {
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVariables.attrPos.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVariables.attrTex.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
 
}

function bindBuffersForGround() {
    gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrPosModel.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrNormalModel.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
}

function bindBuffersForDepth() {
    gl.bindBuffer(gl.ARRAY_BUFFER, depthVariables.attrPos.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
}

function createTextures(gl, groundImage) {
    gl.activeTexture(gl.TEXTURE0);
    var groundTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, groundTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, groundImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.activeTexture(gl.TEXTURE2);
    var blackTexture = gl.createTexture();
    var blackImage = new Uint8Array([0, 0, 0, 200]);
    gl.bindTexture(gl.TEXTURE_2D, blackTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blackImage);

    
}

function createRMatrix(V, P) {
    return mat4(
        1-2*V[0]*V[0],-2*V[0]*V[1], -2*V[0]*V[2], 2*(dot(P, V))*V[0],
        -2*V[0]*V[1], 1-2*V[1]*V[1],-2*V[1]*V[2], 2*(dot(P, V))*V[1],
        -2*V[0]*V[2], -2*V[1]*V[2], 1-2*V[2]*V[2], 2*(dot(P, V))*V[2],
        0, 0, 0, 1);
}

function matrixVectorMult(A, x) {
    var res = [];
    for (var i = 0; i < x.length; i++) {
        var sum = 0;
        for (var j = 0; j < x.length; j++) {
            sum += A[j][i] * x[i];
        }
        res.push(sum);
    }
    return res;
}


window.onload = function () {    
    canvas = document.getElementById( "c" );

    gl = WebGLUtils.setupWebGL(canvas, { alpha: false, stencil: true });
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    initTeapot();
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gProgram = initShaders( gl, "vertex-shader-g", "fragment-shader-g" );
    depthProgram = initShaders( gl, "vertex-shader-d", "fragment-shader-d" );
    
    //Viewport
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    depthTextureExt = gl.getExtension("WEBKIT_WEBGL_depth_texture") || gl.getExtension("WEBGL_depth_texture");
    size = 512;

    createTextureForDepth();

    // Setup shader and buffer data
    gl.useProgram(program);
    initTeapotDataBuffers();
    bindBuffersForTeapot();
 
    gl.useProgram(gProgram);
    initGroundDataBuffers();
    bindBuffersForGround();
    
    gl.uniformMatrix4fv(groundVariables.uniformProjection, false, flatten(projectionMatrix));

    gl.useProgram(depthProgram);

    initDepthDataBuffers();
    bindBuffersForDepth();

    createTextures(gl, groundImage);
    gl.useProgram(program);
    gl.uniformMatrix4fv(teapotVariables.uniformProjection, false, flatten(projectionMatrix));
    
    //Vertex on the planar reflector's surface. We use the first vertex in positions array. 
    P = positions[0];
    //Vector perpendicular to the plane.
    //To find this we need to find the cross product of two vectors from points on the plane. 
    //We use positions[0] and two other abritrary points on the plane to find the vectors.
    v01 = subtract(positions[1], positions[0]);
    v02 = subtract(positions[2], positions[0]);
    this.console.log(v01);
    V = normalize(cross(v01, v02));
    this.console.log(V)
    //Create the R matrix
    R = createRMatrix(V, P);
    this.console.log(R);
    

    requestAnimationFrame(function render() {
        if(teapotMoving) {
            phi += 0.05
        } else {
            phi += 0;
        }

        if(pointLightMoving) {
            theta += 0.01
        } else {
            theta += 0;
        }
        
        light[0] = Math.sin(theta)*2;
        light[2] = Math.cos(theta)*2 - 2;
        
        depthViewMatrix = lookAt(light, at, up);
        
        var teapotModelMatrix = translate(0, - 0.75 - 0.25 * Math.sin(phi), -3);
        var teapotModelViewMatrix = mult(viewMatrix, teapotModelMatrix);
        
        var shadowMatrix = mult(viewMatrix, translate(light[0], light[1] - 1.001, light[2]));
        shadowMatrix = mult(shadowMatrix, shadowProjectionMatrix);
        shadowMatrix = mult(shadowMatrix, translate(-light[0], -(light[1] - 1.001), -light[2]));
        shadowMatrix = mult(shadowMatrix, teapotModelMatrix);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, size, size);
        gl.colorMask(false, false, false, false);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.colorMask(true, true, true, true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.depthFunc(gl.LESS);
        gl.useProgram(gProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrPosModel.buffer);
        gl.enableVertexAttribArray(groundVariables.attrPosModel.location);
        gl.vertexAttribPointer(groundVariables.attrPosModel.location, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrNormalModel.buffer);
        gl.enableVertexAttribArray(groundVariables.attrNormalModel.location);
        gl.vertexAttribPointer(groundVariables.attrNormalModel.location, 3, gl.FLOAT, false, 0, 0);
    
        gl.uniformMatrix4fv(groundVariables.uniformNormal, false, flatten(transpose(inverse4(teapotModelViewMatrix))));

        gl.uniformMatrix4fv(groundVariables.uniformMV, false, flatten(teapotModelViewMatrix));
        gl.uniform3fv(groundVariables.uniformLight, flatten(light));
        
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        // Enable STENCIL
        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc( gl.ALWAYS, 1, 0xFF );
        gl.stencilOp( gl.KEEP, gl.KEEP, gl.REPLACE );
        gl.stencilMask( 0xFF );
        gl.depthMask( false );
        gl.colorMask(false, false, false, false);
        gl.clear( gl.STENCIL_BUFFER_BIT );

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVariables.attrPos.buffer);
        gl.enableVertexAttribArray(teapotVariables.attrPos.location);
        gl.vertexAttribPointer(teapotVariables.attrPos.location, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVariables.attrTex.buffer);
        gl.enableVertexAttribArray(teapotVariables.attrTex.location);
        gl.vertexAttribPointer(teapotVariables.attrTex.location, 2, gl.FLOAT, false, 0, 0);    

        gl.depthFunc(gl.LESS);
        gl.uniformMatrix4fv(teapotVariables.uniformMV, false, flatten(viewMatrix));
        gl.uniform1i(teapotVariables.uniformTex, 0);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.uniform1i(teapotVariables.uniformShadow, 3);
        gl.uniformMatrix4fv(teapotVariables.uniformDepthMVP, false, flatten(mult(projectionMatrix, depthViewMatrix)));
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.stencilFunc( gl.EQUAL, 1, 0xFF );
        gl.stencilMask( 0x00 );
        gl.depthMask( true );
        gl.colorMask(true, true, true, true);
        
        gl.useProgram(gProgram);    
        gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrPosModel.buffer);
        gl.enableVertexAttribArray(groundVariables.attrPosModel.location);
        gl.vertexAttribPointer(groundVariables.attrPosModel.location, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrNormalModel.buffer);
        gl.enableVertexAttribArray(groundVariables.attrNormalModel.location);
        gl.vertexAttribPointer(groundVariables.attrNormalModel.location, 3, gl.FLOAT, false, 0, 0);
    
        gl.uniformMatrix4fv(groundVariables.uniformMV, false, flatten(mult(mult(viewMatrix, R), teapotModelMatrix)));
        lightR4 = matrixVectorMult(R, vec4(light[0], light[1], light[2], 1));
        lightR = vec3(lightR4[0], lightR4[1], lightR4[2]);
        gl.uniform3fv(groundVariables.u_light_world, flatten(lightR));
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        //Disable stencil
        gl.disable(gl.STENCIL_TEST);
        gl.useProgram(program);  
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVariables.attrPos.buffer);
        gl.enableVertexAttribArray(teapotVariables.attrPos.location);
        gl.vertexAttribPointer(teapotVariables.attrPos.location, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVariables.attrTex.buffer);
        gl.enableVertexAttribArray(teapotVariables.attrTex.location);
        gl.vertexAttribPointer(teapotVariables.attrTex.location, 2, gl.FLOAT, false, 0, 0);  

        gl.uniformMatrix4fv(teapotVariables.uniformMV, false, flatten(viewMatrix));
        gl.uniform1i(teapotVariables.uniformTex, 0);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.uniform1i(teapotVariables.uniformShadow, 3);
        gl.uniformMatrix4fv(teapotVariables.uniformDepthMVP, false, flatten(mult(projectionMatrix, depthViewMatrix)));

        gl.drawArrays(gl.TRIANGLES, 0, 6);
       
        
        requestAnimationFrame(render);
    })
}


