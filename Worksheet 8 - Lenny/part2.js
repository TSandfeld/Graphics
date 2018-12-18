var near = 0.1;
var far = 30;
var fovy = 45;
var aspect = 1

var at = vec3(0, 0, -3);
var eye = vec3(3, 3, 3);
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
var aboveViewMatrix = lookAt(vec3(1, 6, -3), at, up);
var depthViewMatrix = lookAt(light, at, up);

var projectionMatrix = perspective(fovy, aspect, near, far);
shadowProjectionMatrix = mat4();
shadowProjectionMatrix[3][3] = 0;
shadowProjectionMatrix[3][1] = -1 / light[1];

var teapotMoving = true;
var pointLightMoving = true;
var phi = 0;
var theta = 0;

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


window.onload = function () {    
    canvas = document.getElementById( "c" );

    gl = WebGLUtils.setupWebGL(canvas, { alpha: false });
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    initTeapot();
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    phongProgram = initShaders( gl, "vertex-shader-g", "fragment-shader-g" );
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
    size = Math.pow(2,9);

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

    // Setup shader and buffer data
    gl.useProgram(program);
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

    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVariables.attrPos.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVariables.attrTex.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
 
    gl.useProgram(phongProgram);
    groundVariables = {
        attrPosModel: {
            location: gl.getAttribLocation(phongProgram, 'attrPosModel'),
            buffer: gl.createBuffer()
        },
        attrNormalModel: {
            location: gl.getAttribLocation(phongProgram, 'attrNormalModel'),
            buffer: gl.createBuffer()
        },
        uniformMV: gl.getUniformLocation(phongProgram, 'uniformMV'),
        uniformProjection: gl.getUniformLocation(phongProgram, 'uniformProjection'),
        uniformNormal: gl.getUniformLocation(phongProgram, 'uniformNormal'),
        uniformLight: gl.getUniformLocation(phongProgram, 'uniformLight')
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrPosModel.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrNormalModel.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
    gl.uniformMatrix4fv(groundVariables.uniformProjection, false, flatten(projectionMatrix));

    gl.useProgram(depthProgram);

    depthInfo = {
        attrPos: {
            location: gl.getAttribLocation(depthProgram, 'attrPos'),
            buffer: gl.createBuffer()
        },
        uniformMV: gl.getUniformLocation(depthProgram, 'uniformMV'),
        uniformProjection: gl.getUniformLocation(depthProgram, 'uniformProjection')
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, depthInfo.attrPos.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    createTextures(gl, groundImage);
    gl.useProgram(program);
    gl.uniformMatrix4fv(teapotVariables.uniformProjection, false, flatten(projectionMatrix));
    
    

    requestAnimationFrame(function render() {
        if(teapotMoving) {
            phi += 0.02
        } else{
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

        gl.useProgram(depthProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, depthInfo.attrPos.buffer);
        gl.enableVertexAttribArray(depthInfo.attrPos.location);
        gl.vertexAttribPointer(depthInfo.attrPos.location, 3, gl.FLOAT, false, 0, 0);    

        gl.uniformMatrix4fv(depthInfo.uniformProjection, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(depthInfo.uniformMV, false, flatten(mult(depthViewMatrix, teapotModelMatrix)));
        
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.colorMask(true, true, true, true);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
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

        gl.depthFunc(gl.LESS);
        gl.useProgram(phongProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrPosModel.buffer);
        gl.enableVertexAttribArray(groundVariables.attrPosModel.location);
        gl.vertexAttribPointer(groundVariables.attrPosModel.location, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, groundVariables.attrNormalModel.buffer);
        gl.enableVertexAttribArray(groundVariables.attrNormalModel.location);
        gl.vertexAttribPointer(groundVariables.attrNormalModel.location, 3, gl.FLOAT, false, 0, 0);
    
        gl.uniformMatrix4fv(groundVariables.uniformMV, false, flatten(teapotModelViewMatrix));
        gl.uniformMatrix4fv(groundVariables.uniformNormal, false, flatten(transpose(inverse4(teapotModelViewMatrix))));
        gl.uniform3fv(groundVariables.uniformLight, flatten(light));
        
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        requestAnimationFrame(render);
    })
}


