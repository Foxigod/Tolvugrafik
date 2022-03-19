/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Hvert horn teningsins er með tiltekinn lit og hann
//      blandast við lit hinna hornanna yfir hverja hlið
//
//    Hjálmtýr Hafsteinsson, febrúar 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];
var pointsArray = [];
var normalsArray = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -5.0;

var fovy = 50.0;
var near = 0.2;
var far = 100.0;

// var va = vec4(0.0, 0.0, -1.0,1);
// var vb = vec4(0.0, 0.942809, 0.333333, 1);
// var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
// var vd = vec4(0.816497, -0.471405, 0.333333,1);
    
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

// var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var index = 0;

var matrixLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "rotation" );

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    projectionMatrix = perspective( fovy, 1.0, near, far );


    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY - (e.offsetX - origX) ) % 360;
            spinX = ( spinX - (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    // var vertexColors = [
    //     [ 0.0, 0.0, 0.0, 1.0 ],  // black
    //     [ 1.0, 0.0, 0.0, 1.0 ],  // red
    //     [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
    //     [ 0.0, 1.0, 0.0, 1.0 ],  // green
    //     [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    //     [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
    //     [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
    //     [ 1.0, 1.0, 1.0, 1.0 ]   // white
    // ];

    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    triangle(vertices[a], vertices[b], vertices[c]);
    triangle(vertices[a], vertices[c], vertices[d]);

    // var indices = [ a, b, c, a, c, d ];

    // for ( var i = 0; i < indices.length; ++i ) {
    //     points.push( vertices[indices[i]] );
    //     colors.push( vertexColors[indices[i]] );
    
    //     // for solid colored faces use 
    //     //colors.push(vertexColors[a]);
        
    // }
}

function triangle(a, b, c) {

    var t1 = subtract(b, a);
    var t2 = subtract(c, a);
    var normal = normalize(cross(t2, t1));
    normal = vec4(normal);

    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    
    pointsArray.push(a);
    pointsArray.push(b);      
    pointsArray.push(c);

    index += 3;
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // var mv = mat4();
    // mv = mult( mv, rotateX(spinX) );
    // mv = mult( mv, rotateY(spinY) );

    modelViewMatrix = lookAt( vec3(0.0, 0.0, zDist), at, up );
    modelViewMatrix = mult( modelViewMatrix, rotate( spinY, [0, 1, 0] ) );
    modelViewMatrix = mult( modelViewMatrix, rotate( spinX, [1, 0, 0] ) );

    // normal matrix only really need if there is nonuniform scaling
    // it's here for generality but since there is
    // no scaling in this example we could just use modelView matrix in shaders
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    // gl.uniformMatrix4fv(matrixLoc, false, flatten(mv));
    
    gl.drawArrays( gl.TRIANGLES, 0, index );

    requestAnimFrame( render );
}

