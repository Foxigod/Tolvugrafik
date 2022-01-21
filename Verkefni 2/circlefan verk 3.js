/////////////////////////////////////////////////////////////////
//    S�nid�mi � T�lvugraf�k
//     Teikna n�lgun � hring sem TRIANGLE_FAN
//
//    Hj�lmt�r Hafsteinsson, jan�ar 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// numCirclePoints er fj�ldi punkta � hringnum
// Heildarfj�ldi punkta er tveimur meiri (mi�punktur + fyrsti punktur kemur tvisvar)
var numCirclePoints = 4;       

var radius = 0.4;
var center = vec2(0, 0);

var points = [];

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	// Create the circle
    // points.push( center );
    // createCirclePoints( center, radius, numCirclePoints );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 816, gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    document.getElementById("slider").onchange = function(event) {
        numCirclePoints = event.target.value;
        render();
    };
    
    render();
}


// Create the points of the circle
function createCirclePoints( cent, rad, k )
{
    points.push( center );
    var dAngle = 2*Math.PI/k;
    for( i=k; i>=0; i-- ) {
    	a = i*dAngle;
    	var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
    	points.push(p);
    }
}

function render() {
    
    points = [];
    createCirclePoints(center, radius, numCirclePoints);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    gl.clear( gl.COLOR_BUFFER_BIT );
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    // Draw circle using Triangle Fan
    gl.drawArrays( gl.TRIANGLE_FAN, 0, +numCirclePoints+2 );  // numCirclePoints+2 verður stundum strengja-samlagning
    //console.log(numCirclePoints+2);
    // console.log(+numCirclePoints+2);
    // gl.drawArrays( gl.TRIANGLE_FAN, 0, numCirclePoints+2 );

    window.requestAnimFrame(render);
}
