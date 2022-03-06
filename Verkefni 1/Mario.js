var canvas;
var gl;
var vPosition;
var program;
var bigBuffer, backgroundBuffer;
var RightMario=[];
var LeftMario=[];
var right_rotation = true;
var locColor;
var RED = vec4(1., .0, .0, 1.);
var YELLOW = vec4(1., 1., .0, 1.);
var COIN_COLOUR = vec4(222/255, 205/255, 16/255, 1.);
var GROUND_COLOUR = vec4(0, 161/255, 46/255, 1.0);
var SUN_COLOUR = vec4(242/255, 192/255, 1/255, 1.0);
var OBSTACLE_COLOUR = vec4(8/255, 115/255, 2/255, 1.0);
var GOOMBA_COLOUR = vec4(137/255, 68/255, 36/255, 1.0);
var jump_time_start;
var inAir = false;
var player_vertical_transfer = 0, player_horizontal_transfer = 0;
const jumptime = 1.0;
var sek = 0.;
var xspeed = 0., yspeed = 0.;
var deltaTime, lastTime;
var map = {};
const player_radius=0.1, coin_radius=0.07;
const coin_vertices = 15;
const jumpStrength = 3.4;  //2.4;
const border_buffer = 0.03;
const coin_buffer = 0.02;
const coin_min_timer = 5., coin_max_timer = 10.;
var coins_to_render = 0;
var coins_transform = {};
var last_coin_spawntime;
var initTime;
var possible_horizontal_coin_positions = [];
var coins_x_positions = [];
var coins_creation_times = [];
var coins_lifespan = [];
var possible_vertical_coin_positions = [];
var coins_y_positions = [];
var coins_y_offset = [];
var coin_horizontal_span, player_horizontal_span;
var coins_collected = 0;
var player_center;
var pointbar = [];
var pointbar_separation;
var scoreBoard;
var stop_excecution = false;
const obstacle_radius = 0.1;
const goomba_radius = 0.05;
var obstacle_location;
var mario_low_point = 0;
var goomba_location;
var goomba_horizontal_span;
var goomba_horizontal_transfer;
var goomba_direction;
var loss = false;


window.onload = function init() {
    initTime = Date.now();
    datenow = initTime;
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    // gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    gl.clearColor( 2/255, 165/255, 194/255, 1.0 );
    const horizontal_span_without_buffer = canvas.width/canvas.height;
    const horizontal_span = canvas.width/canvas.height -border_buffer;
    coin_horizontal_span = horizontal_span -coin_radius; //canvas.width/canvas.height*(1 -coin_radius -border_buffer);
    player_horizontal_span = horizontal_span -player_radius; //canvas.width/canvas.height*(1 -player_radius -border_buffer);
    goomba_horizontal_span = horizontal_span -goomba_radius;

    // vertical_span := 1 by definition
    var point_bar_length = 0.1;
    var point_bar_width = 0.02;
    pointbar_separation = 1.5*point_bar_width;
    pointbar = [
        vec2(-horizontal_span, 1-border_buffer),
        vec2(-horizontal_span, 1-border_buffer-point_bar_length),
        vec2(-horizontal_span+point_bar_width, 1-border_buffer-point_bar_length),
        vec2(-horizontal_span+point_bar_width, 1-border_buffer)
    ];

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vertices = [
        vec2( -0.1, -0.9 ),
        vec2( -0.1, -0.86 ),
        vec2(  0.1, -0.86 ),
        vec2(  0.1, -0.9 ) 
    ];
    player_center = vec2(0, -.85);
    createMario(cent=player_center, rad=player_radius, start_angle=Math.PI/2, verts=RightMario, no_of_verticies=3);
    createMario(cent=player_center, rad=player_radius, start_angle=-Math.PI/2, verts=LeftMario, no_of_verticies=3);
    for (i = 0; i < RightMario.length; i++){
        mario_low_point = Math.min(mario_low_point, RightMario[i][1]);
    }
    var backround_vertices = [];
    backround_vertices.push(vec4(-horizontal_span_without_buffer, mario_low_point, 0., 0.));
    backround_vertices.push(GROUND_COLOUR);
    backround_vertices.push(vec4(-horizontal_span_without_buffer, -1., 0., 0.));
    backround_vertices.push(GROUND_COLOUR);
    backround_vertices.push(vec4(horizontal_span_without_buffer, -1., 0., 0.));
    backround_vertices.push(GROUND_COLOUR);
    backround_vertices.push(vec4(horizontal_span_without_buffer, mario_low_point, 0., 0.));
    backround_vertices.push(GROUND_COLOUR);
    backround_vertices.push(vec4(horizontal_span_without_buffer, 1., 0., 0.));
    backround_vertices.push(SUN_COLOUR);
    backround_vertices.push(vec4(horizontal_span_without_buffer - 0.2, 1., 0., 0.));
    backround_vertices.push(SUN_COLOUR);
    backround_vertices.push(vec4(horizontal_span_without_buffer, 0.8, 0., 0.));
    backround_vertices.push(SUN_COLOUR);
    console.log(backround_vertices);
    console.log(flatten(backround_vertices));

    var obstacle = [];
    createObstacle(obstacle, horizontal_span);
    for (i = 0; i < obstacle.length; i++){
        backround_vertices.push(obstacle[i]);
        backround_vertices.push(OBSTACLE_COLOUR);
    }

    var goomba_vertices = [];
    createGoomba(goomba_vertices);
    
    // Load the data into the GPU
    bigBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bigBuffer );
    // Load: Mario, coin, pointbar, obstacle, goomba.
    gl.bufferData( gl.ARRAY_BUFFER, 6*2*4 + (coin_vertices+2)*2*4 + 4*2*4 + 4*2*4 + 4*2*4, gl.DYNAMIC_DRAW );
    Coin = [vec2(.0, .0)];
    createCoin(vec2(.0, .0), rad=coin_radius, start_angle=0, verts=Coin, no_of_verticies=coin_vertices-1)
    right_rotation = false;
    gl.bufferSubData(gl.ARRAY_BUFFER, right_rotation ? 0:RightMario.length*8, flatten(right_rotation ? RightMario:LeftMario));
    right_rotation = true;
    gl.bufferSubData(gl.ARRAY_BUFFER, right_rotation ? 0:RightMario.length*8, flatten(right_rotation ? RightMario:LeftMario));
    
    gl.bufferSubData(gl.ARRAY_BUFFER, 6*8 + 0*(coin_vertices+2)*2*4, flatten(Coin));
    gl.bufferSubData(gl.ARRAY_BUFFER, 6*8 + 1*(coin_vertices+2)*2*4, flatten(pointbar));
    gl.bufferSubData(gl.ARRAY_BUFFER, 6*8 + 1*(coin_vertices+2)*2*4 + pointbar.length*2*4, flatten(goomba_vertices));

    backgroundBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, backgroundBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, backround_vertices.length*4*4, gl.DYNAMIC_DRAW); // flatten(backround_vertices), gl.DYNAMIC_DRAW); // backround_vertices.length*(4+2)*4, gl.DYNAMIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(backround_vertices));
    back_vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer( back_vPosition, 2, gl.FLOAT, false, (4+4)*4, 0);
    gl.enableVertexAttribArray( back_vPosition);
    back_vColour = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer( back_vColour, 4, gl.FLOAT, false, (4+4)*4, 4*4);
    gl.enableVertexAttribArray( back_vColour);
    gl.disableVertexAttribArray( back_vPosition);
    gl.disableVertexAttribArray( back_vColour);
    gl.bindBuffer( gl.ARRAY_BUFFER, bigBuffer);

    temp = -coin_horizontal_span;
    coinslots = Math.floor(2*coin_horizontal_span/(2*coin_radius+coin_buffer));
    coinseparation = 2*coin_horizontal_span/coinslots;
    for (i = 0; i < coinslots; i++){
        possible_horizontal_coin_positions.push(-coin_horizontal_span+i*coinseparation);
    }
    for (i = 0; i < 2; i++){
        possible_vertical_coin_positions.push(-i*coinseparation);
    }

    createNewCoin();

    
    // Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // var map = {}; // You could also use an array
    onkeydown = onkeyup = function(e){  // Curtesey of StackOverflow
        e = e || event; // to deal with IE
        map[e.keyCode] = e.type == 'keydown';
    }

    scoreBoard = document.getElementById("score_div_score");

    lastTime = Date.now();
    locColor = gl.getUniformLocation( program, "rcolor" );
    locTime = gl.getUniformLocation( program, "delta_jump_time" );
    locAbsTime = gl.getUniformLocation( program, "time" );
    locCoinX = gl.getUniformLocation( program, "coin_x_pos");
    locCoinY = gl.getUniformLocation( program, "coin_y_pos");
    locisCoin = gl.getUniformLocation( program, "isCoin");
    locplayer_vertical_transfer = gl.getUniformLocation( program, "player_vertical_transfer");
    locplayer_horizontal_transfer = gl.getUniformLocation( program, "player_horizontal_transfer");

    locisScore = gl.getUniformLocation( program, "isScore");
    locPointBarShift = gl.getUniformLocation( program, "point_bar_shift");

    locisPlayer = gl.getUniformLocation( program, "isPlayer");
    locisBackground = gl.getUniformLocation( program, "isBackground");
    locisGoomba = gl.getUniformLocation( program, "isGoomba");
    
    locgoomba_horizontal_transfer = gl.getUniformLocation( program, "goomba_horizontal_transfer");

    gl.uniform1i( locisCoin, false);
    render();
}

function strikeThrough(text){  // Curtesey of u/laggingreflex of SO: https://stackoverflow.com/a/53836006
    text = text.toString();
    return text
      .split('')
      .map(char => char + '\u0336')
      .join('')
}

function processKeys()
{
    speed_increase = 1.6;
    if (map[37] || map[65]){  // vinstri
        right_rotation = false;
        if (!inAir){
            xspeed -= speed_increase*deltaTime;
        }
    }
    if (map[39] || map[68]){  // hægri
        right_rotation = true;
        if (!inAir){
            xspeed += speed_increase*deltaTime;
        }
    }
    if (map[38] || map[32] || map[87]){  // upp eða bilslá
        if (!inAir){
            jump_time_start = Date.now();
            inAir = true;
            yspeed = jumpStrength;
        }
    }
    
    player_horizontal_transfer += xspeed*deltaTime;
    if (xspeed > 0 && player_horizontal_transfer > player_horizontal_span){ // Going right ->
        xspeed = 0;
        player_horizontal_transfer = player_horizontal_span;
    }
    else if (xspeed < 0 && player_horizontal_transfer < -player_horizontal_span){
        xspeed = 0;
        player_horizontal_transfer = -player_horizontal_span;
    }
    
    if (!inAir){
        xspeed *= (1-deltaTime*1.6);  //0.97;  // Not framerate invariant. TODO: Make framerate invariant.
    }
    if (Math.abs(xspeed) < 0.0001) xspeed=0.;
}

function createObstacle(obstacle, horizontal_span){
    obstacle_location = vec4((Math.random()*2*horizontal_span-horizontal_span)*0.8, mario_low_point+obstacle_radius, 0.0, 0.0);
    while (Math.abs(obstacle_location[0]-player_center[0]) < (obstacle_radius+player_radius)*1.1 ){
        obstacle_location[0] += Math.sign(obstacle_location[0])*0.1;
    }
    var temp_0 = vec4(-obstacle_radius, -obstacle_radius, 0.0, 0.0);
    var temp_1 = vec4(-obstacle_radius, obstacle_radius, 0.0, 0.0);
    var temp_2 = vec4(obstacle_radius, obstacle_radius, 0.0, 0.0);
    var temp_3 = vec4(obstacle_radius, -obstacle_radius, 0.0, 0.0);
    obstacle.push(add(obstacle_location, temp_0));
    obstacle.push(add(obstacle_location, temp_1));
    obstacle.push(add(obstacle_location, temp_2));
    obstacle.push(add(obstacle_location, temp_3));
}

function createGoomba(goomba_vertices){
    goomba_direction = Math.sign(obstacle_location[0]);
    goomba_location = vec2(-goomba_direction*goomba_horizontal_span, mario_low_point+goomba_radius);
    goomba_location = vec2(0, mario_low_point+goomba_radius);
    goomba_horizontal_transfer = -goomba_direction*goomba_horizontal_span;
    var temp_0 = vec2(-goomba_radius, -goomba_radius);
    var temp_1 = vec2(-goomba_radius, goomba_radius);
    var temp_2 = vec2(goomba_radius, goomba_radius);
    var temp_3 = vec2(goomba_radius, -goomba_radius);
    goomba_vertices.push(add(goomba_location, temp_0));
    goomba_vertices.push(add(goomba_location, temp_1));
    goomba_vertices.push(add(goomba_location, temp_2));
    goomba_vertices.push(add(goomba_location, temp_3));
}

function createNewCoin()
{
    if (coinslots <= coins_to_render) return;
    last_coin_spawntime = datenow;
    var new_coin_x_index = Math.floor(Math.random()*(coinslots-coins_to_render))
    coins_to_render++;
    var new_coin_x_pos = possible_horizontal_coin_positions[new_coin_x_index];
    var new_coin_lifespan = coin_min_timer + Math.random()*(coin_max_timer-coin_min_timer);
    coins_y_positions.push(possible_vertical_coin_positions[Math.floor(Math.random()*possible_vertical_coin_positions.length)]);
    coins_y_offset.push(0.);
    coins_x_positions.push(new_coin_x_pos);
    coins_creation_times.push(Date.now());
    coins_lifespan.push(new_coin_lifespan);
    possible_horizontal_coin_positions.splice(new_coin_x_index, 1);
}

function deleteAndCheckLastCoin(i){
    // console.log("Deleting coin...");
    coins_to_render--;
    possible_horizontal_coin_positions.push(coins_x_positions[i]);
    coins_x_positions[i] = coins_x_positions[coins_to_render];
    coins_x_positions.splice(coins_to_render, 1);
    coins_y_positions[i] = coins_y_positions[coins_to_render];
    coins_y_positions.splice(coins_to_render, 1);
    coins_creation_times[i] = coins_creation_times[coins_to_render];
    coins_creation_times.splice(coins_to_render, 1);
    coins_lifespan[i] = coins_lifespan[coins_to_render];
    coins_lifespan.splice(coins_to_render, 1);
    if (i >= coins_to_render) return;
    if ((datenow - coins_creation_times[i])/1000. > coins_lifespan[i]) deleteAndCheckLastCoin(i);
}

function processCoins()
{
    gl.uniform1i( locisCoin, true);
    for (i = 0; i < coins_to_render; i++){
        if ((datenow - coins_creation_times[i])/1000. > coins_lifespan[i]){
            deleteAndCheckLastCoin(i);
        }
        if (i >= coins_to_render) break;
        coins_y_offset[i] = Math.sin((datenow-coins_creation_times[i])/1000.*1.5)*.1;
        
        // DONE: collision detection
        var player = add(player_center, vec2(player_horizontal_transfer, player_vertical_transfer));
        var current_coin = vec2(coins_x_positions[i], coins_y_positions[i] + coins_y_offset[i]);
        if (length(add(player, negate(current_coin))) < coin_radius+player_radius){
            coins_collected++;
            scoreBoard.innerHTML = coins_collected >= 10 ? coins_collected + ", You Win" : coins_collected;
            if (coins_collected >= 10) stop_excecution = true;  // Not really needed but signifies that the game is won when 10 points are achieved.
            deleteAndCheckLastCoin(i);
            console.log("Score: "+coins_collected);
        }
        
        if (i >= coins_to_render) break;
        coins_y_offset[i] = Math.sin((datenow-coins_creation_times[i])/1000.*1.5)*.1;
        gl.uniform1f( locCoinX, coins_x_positions[i]);
        gl.uniform1f( locCoinY, coins_y_positions[i] + coins_y_offset[i]);
        gl.drawArrays( gl.TRIANGLE_FAN, 6 + 0*coin_vertices, coin_vertices+2);
    }
    if ((datenow-last_coin_spawntime)/1000. > 5){
        createNewCoin();
    }
    gl.uniform1i( locisCoin, false);
}

function processJump()
{
    yspeed -= deltaTime*jumpStrength*2;
    player_vertical_transfer += yspeed*deltaTime;
    if (player_vertical_transfer <= 0){
        yspeed = 0;
        player_vertical_transfer = 0;
        inAir = false;
    }
    if (player_horizontal_transfer + player_center[0] > obstacle_location[0] - obstacle_radius - player_radius 
        && player_horizontal_transfer + player_center[0] < obstacle_location[0] + obstacle_radius + player_radius
        && player_vertical_transfer < 2*obstacle_radius){
        
        // if "timelike"
        if (Math.abs(player_center[0] + player_horizontal_transfer - (obstacle_location[0])) < Math.abs(player_center[1] + player_vertical_transfer - (obstacle_location[1]))){
            console.log("timelike");
            player_vertical_transfer = 2*obstacle_radius;
            yspeed = 0;
            inAir = false;
        } // else "spacelike"
        else if (player_center[0] + player_horizontal_transfer < obstacle_location[0]){ // from left
            console.log("spacelike from left");
            player_horizontal_transfer = obstacle_location[0] - obstacle_radius - player_radius - player_center[0];
            xspeed = Math.min(0, xspeed);
        }
        else{  // from right
            console.log("spacelike from right");
            player_horizontal_transfer = obstacle_location[0] + obstacle_radius + player_radius - player_center[0];
            xspeed = Math.max(0, xspeed);
        }
    }
    
    gl.uniform1f( locplayer_vertical_transfer, player_vertical_transfer );
    gl.uniform1f( locplayer_horizontal_transfer, player_horizontal_transfer );
}

function processGoomba(){
    gl.uniform1i( locisGoomba, true);
    goomba_horizontal_transfer += deltaTime*goomba_direction*0.2;
    if (Math.abs(goomba_location[0] + goomba_horizontal_transfer) > goomba_horizontal_span){
        goomba_horizontal_transfer = goomba_direction*goomba_horizontal_span - goomba_location[0];
        goomba_direction *= -1;
    }
    if (Math.abs(goomba_location[0] + goomba_horizontal_transfer - obstacle_location[0]) < goomba_radius + obstacle_radius){
        goomba_direction *= -1;
        goomba_horizontal_transfer = obstacle_location[0] + goomba_direction*(obstacle_radius + goomba_radius) - goomba_location[0];
    }
    var player = add(player_center, vec2(player_horizontal_transfer, player_vertical_transfer));
    var goomba = add(goomba_location, vec2(goomba_horizontal_transfer, 0.));
    if (length(add(player, negate(goomba))) < goomba_radius + player_radius*0.7){
        scoreBoard.innerHTML = strikeThrough(coins_collected) + ", You Lose";
        loss = true;
    }
    gl.uniform1f( locgoomba_horizontal_transfer, goomba_horizontal_transfer);
    gl.uniform4fv( locColor, flatten(GOOMBA_COLOUR) );
    gl.drawArrays(gl.TRIANGLE_FAN, 6+(coin_vertices+2)+pointbar.length, 4);
    gl.uniform1i( locisGoomba, false);
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
    // Angle er btw í ranga átt.
    var dAngle = 2*Math.PI/(no_of_verticies);  // (no_of_verticies-1)*Math.PI/3;
    for( i=no_of_verticies-1; i>=0; i-- ) {
    	a = i*dAngle + start_angle;
    	var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
    	verts.push(p);
    }
}

function createCoin( cent, rad, start_angle, verts, no_of_verticies)
{
    // Angle er btw í ranga átt.
    var dAngle = 2*Math.PI/(no_of_verticies-1);  // (no_of_verticies-1)*Math.PI/3;
    for( i=no_of_verticies-1; i>=0; i-- ) {
    	a = i*dAngle + start_angle;
    	var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
    	verts.push(p);
    }
}

function renderPoints(){
    gl.uniform1i(locisScore, true);
    gl.uniform4fv(locColor, flatten(COIN_COLOUR));
    for (i = 0; i < coins_collected; i++){
        gl.uniform1f(locPointBarShift, (i+.5*Math.max(Math.floor((i)/5),0))*pointbar_separation);
        gl.drawArrays(gl.TRIANGLE_FAN, 6+(coin_vertices+2), 4);  // 6 Mario_vertices, + total_coin_vertices, 4 bar_vertices
        gl.bufferSubData(gl.ARRAY_BUFFER, 6*8 + 0*coin_vertices*2*4, flatten(Coin));
    }
    gl.uniform1i(locisScore, false);
}

function renderBackground(){
    gl.uniform1i( locisBackground, true);
    
    gl.disableVertexAttribArray( vPosition );
    gl.bindBuffer( gl.ARRAY_BUFFER, backgroundBuffer);
    
    gl.vertexAttribPointer( back_vPosition, 2, gl.FLOAT, false, (4+4)*4, 0);
    gl.vertexAttribPointer( back_vColour, 4, gl.FLOAT, false, (4+4)*4, 4*4);

    gl.enableVertexAttribArray( back_vPosition);
    gl.enableVertexAttribArray( back_vColour);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);  // Grass
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 3);  // Sun
    gl.drawArrays(gl.TRIANGLE_FAN, 7, 4);  // Obstacle
    gl.disableVertexAttribArray( back_vPosition);
    gl.disableVertexAttribArray( back_vColour);
    gl.bindBuffer( gl.ARRAY_BUFFER, bigBuffer);

    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    gl.uniform1i( locisBackground, false);
    


}

function render() {
    datenow = Date.now();
    deltaTime = (datenow - lastTime)/1000.;
    lastTime = datenow;
    processKeys();
    processJump();
    gl.clear( gl.COLOR_BUFFER_BIT );
    renderBackground();
    
    
    gl.uniform1f( locTime, sek );
    gl.uniform4fv( locColor, flatten(RED) );
    gl.uniform1i( locisPlayer, true);
    gl.drawArrays( gl.TRIANGLES, right_rotation ? 0:3, right_rotation ? 3:3 );
    gl.uniform1i( locisPlayer, false);
    gl.uniform1f( locAbsTime, (datenow-initTime)/1000. );
    //console.log([datenow/1000., coins_transform[0][2]]);
    gl.uniform4fv( locColor, flatten(COIN_COLOUR) );  // YELLOW  
    processCoins();
    processGoomba();
    renderPoints();
    
    if (stop_excecution) throw "Excecution stopped, You win";
    if (loss) throw "Excecution stopped, You lose";
    window.requestAnimFrame(render);
}
