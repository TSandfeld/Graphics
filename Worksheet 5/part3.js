
var gl;
var program;

var eye = vec3(0.0, 600.0, 300.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var canvas;

window.onload = function() { 

    canvas = document.getElementById('c');

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) {
        return;
    }

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    a_Position = gl.getAttribLocation(program, 'a_Position');
    a_Color = gl.getAttribLocation(program, 'a_Color');
    u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');


    var model = initVertexBuffers();

    var projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 5000.0);
    
    var viewMatrix = lookAt(eye, at, up);

    var viewProjMatrix = mult(projectionMatrix, viewMatrix);

    readOBJFile('teapot.obj', model, 60, true);

    var tick = function() { 
        render(viewProjMatrix, model);
        requestAnimationFrame(tick);
      };
    tick();
}

// Create an buffer object and perform an initial configuration
function initVertexBuffers() {
    var o = new Object(); // Utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(a_Position, 3, gl.FLOAT); 
    o.colorBuffer = createEmptyArrayBuffer(a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(a_attribute, num, type) {
    var buffer =  gl.createBuffer();  // Create a buffer object
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment
  
    return buffer;
}

// Read a file
function readOBJFile(fileName, model, scale, reverse) {
    var request = new XMLHttpRequest();
  
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status !== 404) {
        onReadOBJFile(request.responseText, fileName, model, scale, reverse);
      }
    }
    request.open('GET', fileName, true); // Create a request to acquire the file
    request.send();                      // Send the request
}

var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// OBJ File has been read
function onReadOBJFile(fileString, fileName, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
      g_objDoc = null; 
      g_drawingInfo = null;
      console.log("OBJ file parsing error.");
      return;
    }
    g_objDoc = objDoc;
}

// Coordinate transformation matrix
var g_modelMatrix = mat4();
var g_mvpMatrix = mat4();

// render function
function render(viewProjMatrix, model) {
  if (g_objDoc != null && g_objDoc.isMTLComplete()){ // OBJ and all MTLs are available
    g_drawingInfo = onReadComplete(model, g_objDoc);
    g_objDoc = null;
  }

  if (!g_drawingInfo) return;   

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

  // rotate the object
  g_modelMatrix = mult(g_modelMatrix, rotate(1, [0, 1, 0]));

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix = viewProjMatrix;
  g_mvpMatrix = mult(g_mvpMatrix, g_modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, flatten(g_mvpMatrix));

  // Draw
  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

// OBJ File has been read compreatly
function onReadComplete(model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();
  
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
  
    return drawingInfo;
}
