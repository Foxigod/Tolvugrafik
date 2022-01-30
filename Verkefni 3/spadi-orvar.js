/////////////////////////////////////////////////////////////////
//    S�nid�mi � T�lvugraf�k
//     S�nir notkun � lyklabor�satbur�um til a� hreyfa spa�a
//
//    Hj�lmt�r Hafsteinsson, jan�ar 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;
var RightMario=[];
var LeftMario=[];
var right_rotation = true;
var locColor;
var RED = vec4(1., .0, .0, 1.);
var YELLOW = vec4(1., 1., .0, 1.);
var jump_time_start;
var jumping = false;
const jumptime = 1.0;
var sek = 0.;
var xspeed = 0.;
var deltaTime, lastTime;
var map = {};


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vertices = [
        vec2( -0.1, -0.9 ),
        vec2( -0.1, -0.86 ),
        vec2(  0.1, -0.86 ),
        vec2(  0.1, -0.9 ) 
    ];
    center = vec2(0, -.85)
    createMario(cent=center, rad=0.1, start_angle=Math.PI/2, verts=RightMario, no_of_verticies=3);
    createMario(cent=center, rad=0.1, start_angle=-Math.PI/2, verts=LeftMario, no_of_verticies=3);
    
    
    // Load the data into the GPU
    var bufferMario = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferMario );
    gl.bufferData( gl.ARRAY_BUFFER, Float32Concat(flatten(RightMario), flatten(LeftMario)), gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // var map = {}; // You could also use an array
    onkeydown = onkeyup = function(e){
        e = e || event; // to deal with IE
        map[e.keyCode] = e.type == 'keydown';
        /* insert conditional here */
    }
    // Event listener for keyboard
    // window.addEventListener("keydown", function(e){
    //     xmove = 0.0;
    //     switch( e.keyCode ) {
    //         case 37:	// vinstri �r
    //             if (right_rotation){
    //                 right_rotation = false;
    //             }else if (!jumping){
    //                 xmove = -0.04;
    //             }
    //             break;
    //         case 39:	// h�gri �r
    //             if (!right_rotation){
    //                 right_rotation = true;
    //             }else if (!jumping){
    //                 xmove = 0.04;
    //             }
    //             break;
    //         case 38:  // Arrow up
    //         case 32:  // Spacebar
    //             if (!jumping){
    //                 jump_time_start = Date.now();
    //                 jumping = true;
    //             }
    //             break;
    //         default:
    //             xmove = 0.0;
    //     }
    //     if (xmove != 0.0){
    //         for(i=0; i<RightMario.length; i++) {
    //             RightMario[i][0] += xmove;
    //             LeftMario[i][0] += xmove;
    //         }
    //     }
        

    //     gl.bufferSubData(gl.ARRAY_BUFFER, right_rotation ? 0:RightMario.length*8, flatten(right_rotation ? RightMario:LeftMario));
    // } );

    lastTime = Date.now();
    locColor = gl.getUniformLocation( program, "rcolor" );
    locTime = gl.getUniformLocation( program, "delta_jump_time" );
    render();
}

function processKeys()
{
    speed_increase = 1.6;
    if (map[37]){  // vinstri
        right_rotation = false;
        if (!jumping){
            xspeed -= speed_increase*deltaTime;
        }
    }
    if (map[39]){  // hægri
        right_rotation = true;
        if (!jumping){
            xspeed += speed_increase*deltaTime;
        }
    }
    if (map[38] || map[32]){  // upp eða bilslá
        if (!jumping){
            jump_time_start = Date.now();
            jumping = true;
        }
    }
    for(i=0; i<RightMario.length; i++){
        RightMario[i][0] += xspeed*deltaTime;
        LeftMario[i][0] += xspeed*deltaTime;
    }
    if (!jumping){
        xspeed *= 0.97;  // Not framerate invariant. TODO: Make framerate invariant.
    }
    if (Math.abs(xspeed) < 0.0001) xspeed=0.;

    gl.bufferSubData(gl.ARRAY_BUFFER, right_rotation ? 0:RightMario.length*8, flatten(right_rotation ? RightMario:LeftMario));
}

function Float32Concat(first, second)
{
    var firstLength = first.length,
        result = new Float32Array(firstLength + second.length);

    result.set(first);
    result.set(second, firstLength);

    return result;
}

function createMario( cent, rad, start_angle, verts, no_of_verticies)
{
    //verts = [];
    //var start_angle = Math.random()*2*Math.PI;
    // Angle er btw í ranga átt.
    var dAngle = (no_of_verticies-1)*Math.PI/3;
    for( i=no_of_verticies-1; i>=0; i-- ) {
    	a = i*dAngle + start_angle;
    	var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
    	verts.push(p);
    }
}

function render() {
    datenow = Date.now();
    deltaTime = (datenow - lastTime)/1000.;
    lastTime = datenow;
    processKeys();
    gl.clear( gl.COLOR_BUFFER_BIT );
    if (jumping){
        sek = (Date.now() - jump_time_start)/1000;
        if (sek > jumptime){
            jumping = false;
            sek = 0;
        }
    }   
    gl.uniform1f( locTime, sek );
    gl.uniform4fv( locColor, flatten(RED) );
    gl.drawArrays( gl.TRIANGLES, right_rotation ? 0:3, right_rotation ? 3:3 );
    
    window.requestAnimFrame(render);
}
