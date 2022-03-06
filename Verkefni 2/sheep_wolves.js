/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Wíragrindarteningur teiknaður tvisvar frá mismunandi
//     sjónarhorni til að fá víðsjónaráhrif (með gleraugum)
//
//    Hjálmtýr Hafsteinsson, febrúar 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var num_line_vertices = 24;
var num_cube_vertices = 36;

var points = [];
var colors = [];

var vBuffer, cBuffer;
var vPosition, vColor;

var movement = false;     // Do we rotate?
var spinX = -30;
var spinY = 55;
var origX;
var origY;

var world;
var sheep = new Map();
var wolfs = new Map();
var sheep_id_counter = 0;
var wolf_id_counter = 0;
let mv_poss = [[0,0,1],[0,0,-1],[0,1,0],[0,-1,0],[1,0,0],[-1,0,0]];  // move possibilities

var grid_size = 10;
var temp_grid_size = grid_size;
var starting_sheep = 10;
var temp_starting_sheep = starting_sheep;
var starting_wolfs = 10;
var temp_starting_wolfs = starting_wolfs;
var sheep_grow_up_time = 5;
var temp_sheep_grow_up_time = sheep_grow_up_time;
var sheep_birth_time = 5;
var temp_sheep_birth_time = sheep_birth_time;
var wolf_birth_food = 3;
var temp_wolf_birth_food = wolf_birth_food;
var wolf_lifetime_without_food = 15;
var temp_wolf_lifetime_without_food = wolf_lifetime_without_food;
var wolf_smell_dist = 3;
var temp_wolf_smell_dist = wolf_smell_dist;
var frames_for_timestep = 100;
var temp_frames_for_timestep = frames_for_timestep;
var frames_between_gridsteps = 30;
var temp_frames_between_gridsteps = frames_between_gridsteps;
var frames = -1;
var halt = false;

var zDist = -3.0;
var eyesep = 0.0; //0.2;

var proLoc;
var mvLoc;


// the 8 vertices of the cube
var cube_vertices = [
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ),
    vec3(  0.5,  0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 )
];

var lines = [ cube_vertices[0], cube_vertices[1], cube_vertices[1], cube_vertices[2], cube_vertices[2], cube_vertices[3], cube_vertices[3], cube_vertices[0],
              cube_vertices[4], cube_vertices[5], cube_vertices[5], cube_vertices[6], cube_vertices[6], cube_vertices[7], cube_vertices[7], cube_vertices[4],
              cube_vertices[0], cube_vertices[4], cube_vertices[1], cube_vertices[5], cube_vertices[2], cube_vertices[6], cube_vertices[3], cube_vertices[7]
            ];

function colorLines(vbuff, cbuff, color){
    for (var i = 0; i < lines.length; i++){
        vbuff.push(lines[i]);
        cbuff.push(color);
    }
}

function colorCube(vbuff, cbuff, color)
{
    quad( vbuff, cbuff, 1, 0, 3, 2, color );
    quad( vbuff, cbuff, 2, 3, 7, 6, color );
    quad( vbuff, cbuff, 3, 0, 4, 7, color );
    quad( vbuff, cbuff, 6, 5, 1, 2, color );
    quad( vbuff, cbuff, 4, 5, 6, 7, color );
    quad( vbuff, cbuff, 5, 4, 0, 1, color );
}

function quad(vbuff, cbuff, a, b, c, d, color) 
{
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        vbuff.push( cube_vertices[indices[i]] );
        cbuff.push(color);
        
    }
}

var create_new_sheep_foo = function(i, j, k, render_process, was_just_born){
    create_new_sheep(i, j, k, render_process, was_just_born);
}

var create_new_wolf_foo = function(i, j, k, render_process, was_just_born){
    create_new_wolf(i, j, k, render_process, was_just_born);
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.15, 0.15, 0.15, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    var vbuff = [];
    var cbuff = [];

    colorLines(vbuff, cbuff, vec4(1.0, 0.3, 0.8, 1.0));  // Outlines, num_line_vertices
    colorLines(vbuff, cbuff, vec4(1.0, 1.0, 1.0, 1.0));  // Sheep Outlines, num_line_vertices
    colorLines(vbuff, cbuff, vec4(0.0, 0.0, 0.0, 1.0));  // Wolf Outlines, num_line_vertices
    colorCube(vbuff, cbuff, vec4(0.8, 0.8, 0.8, 1.0));  // Sheep, num_cube_vertices
    colorCube(vbuff, cbuff, vec4(0.4, 0.4, 0.4, 0.4));  // Wolf, num_cube_vertices


    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cbuff), gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    // gl.bufferData( gl.ARRAY_BUFFER, num_line_vertices*3*4 + 2*num_cube_vertices*7*4, gl.STATIC_DRAW );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vbuff), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "wireColor" );
    
    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    document.getElementById("grid_density").onchange = function(event) {
        temp_grid_size = parseFloat(event.target.value);
        console.log("temp_grid_size: " + temp_grid_size);
    };
    document.getElementById("starting_sheep").onchange = function(event) {
        temp_starting_sheep = parseFloat(event.target.value);
        console.log("temp_starting_sheep: " + temp_starting_sheep);
    };
    document.getElementById("starting_wolves").onchange = function(event) {
        temp_starting_wolfs = parseFloat(event.target.value);
        console.log("temp_starting_wolfs: " + temp_starting_wolfs);
    };
    document.getElementById("sheep_grow_up_time").onchange = function(event) {
        temp_sheep_grow_up_time = parseFloat(event.target.value);
        console.log("temp_sheep_grow_up_time: " + temp_sheep_grow_up_time);
    };
    document.getElementById("sheep_birth_time").onchange = function(event) {
        temp_sheep_birth_time = parseFloat(event.target.value);
        console.log("temp_sheep_birth_time: " + temp_sheep_birth_time);
    };
    document.getElementById("wolf_birth_food").onchange = function(event) {
        temp_wolf_birth_food = parseFloat(event.target.value);
        console.log("temp_wolf_birth_food: " + temp_wolf_birth_food);
    };
    document.getElementById("wolf_lifetime_without_food").onchange = function(event) {
        temp_wolf_lifetime_without_food = parseFloat(event.target.value);
        console.log("temp_wolf_lifetime_without_food: " + temp_wolf_lifetime_without_food);
    };
    document.getElementById("wolf_smell_dist").onchange = function(event) {
        temp_wolf_smell_dist = parseFloat(event.target.value);
        wolf_smell_dist = temp_wolf_smell_dist;
        console.log("temp_wolf_smell_dist: " + temp_wolf_smell_dist);
    };
    document.getElementById("frames_for_timestep").onchange = function(event) {
        temp_frames_for_timestep = parseFloat(event.target.value);
        frames_for_timestep = temp_frames_for_timestep;
        console.log("temp_frames_for_timestep: " + temp_frames_for_timestep);
    };
    document.getElementById("frames_between_gridsteps").onchange = function(event) {
        temp_frames_between_gridsteps = parseFloat(event.target.value);
        frames_between_gridsteps = temp_frames_between_gridsteps;
        console.log("temp_frames_between_gridsteps: " + temp_frames_between_gridsteps);
    };
    document.getElementById("spawn_sheep").onclick = function(event) {
        console.log("Spawn Sheep clicked");
        Spawn_n_amount_of_foo(create_new_sheep, 1, true, false);
    };
    document.getElementById("spawn_wolf").onclick = function(event) {
        console.log("Spawn Wolf clicked");
        Spawn_n_amount_of_foo(create_new_wolf, 1, true, false);
    };
    
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
    	    spinY = ( spinY - (origX - e.offsetX) ) % 360;
            spinX = ( spinX - (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zDist += 0.1;
                break;
            case 40:	// niður ör
                zDist -= 0.1;
                break;
            case 32:    // Spacebar
                halt = !halt;
                break;
         }
    }  );  

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.1;
         } else {
             zDist -= 0.1;
         }
    }  );  

    world = new World(grid_size);
    Spawn_n_amount_of_foo(create_new_sheep_foo, starting_sheep, true, true);
    Spawn_n_amount_of_foo(create_new_wolf_foo, starting_wolfs, true, true);

    document.getElementById("reset").onclick = function(event) {
        console.log("Restart initiated");

        grid_size = temp_grid_size;
        starting_sheep = temp_starting_sheep;
        starting_wolfs = temp_starting_wolfs;
        sheep_grow_up_time = temp_sheep_grow_up_time;
        sheep_birth_time = temp_sheep_birth_time;
        wolf_birth_food = temp_wolf_birth_food;
        wolf_lifetime_without_food = temp_wolf_lifetime_without_food;
        wolf_smell_dist = temp_wolf_smell_dist;
        frames_for_timestep = temp_frames_for_timestep;
        frames_between_gridsteps = temp_frames_between_gridsteps;
        frames = -1;

        // console.log(grid_size);
        // console.log(starting_sheep);
        // console.log(starting_wolfs);
        // console.log(sheep_grow_up_time);
        // console.log(sheep_birth_time);
        // console.log(wolf_birth_food);
        // console.log(wolf_lifetime_without_food);
        // console.log(wolf_smell_dist);
        // console.log(frames_for_timestep);
        // console.log(frames_between_gridsteps);
        // console.log(frames);

        world = new World(grid_size);
        sheep = new Map();
        wolfs = new Map();
        Spawn_n_amount_of_foo(create_new_sheep_foo, starting_sheep, true, true);
        Spawn_n_amount_of_foo(create_new_wolf_foo, starting_wolfs, true, true);
        sheep_id_counter = 0;
        wolf_id_counter = 0;
    };
    render();
}

class Sheep{
    constructor(i, j, k){
        this.i = i;
        this.j = j;
        this.k = k;
        this.old_i = i;
        this.old_j = j;
        this.old_k = k;
        this.adult = false;
        this.timesteps_until_adult = Math.floor(sheep_grow_up_time*(.5+Math.random()));
        this.timesteps_until_birth = Math.floor(sheep_birth_time*(.5+Math.random()));
        this.timesteps_since_birth = 0;
        this.birth_now = false;
        this.was_just_born = true;
        this.render_process = true;
        // this.have_I_rendered_before = false;
    }
    get_coords(){
        return [this.i, this.j, this.k];
    }
    get_interpolated_coords(inter){
        return [this.i*inter + (1-inter)*this.old_i, this.j*inter + (1-inter)*this.old_j, this.k*inter + (1-inter)*this.old_k];
    }
    update_olds(){
        this.old_i = this.i;
        this.old_j = this.j;
        this.old_k = this.k;
    }
    check_if_dead(id_of_this_sheep){
        if (world.get_grid_space(this.i, this.j, this.k) == 2){
            sheep.delete(id_of_this_sheep);
            return true;
        }
        return false;
    }
    will_I_die(){
        if (world.get_grid_space(this.i, this.j, this.k) == 2){
            return true;
        }
        return false;
    }
    get_translation_matrix(inter){
        var temp_matrix = translate(this.get_interpolated_coords(inter));
        if (this.will_I_die()){
            temp_matrix = mult(temp_matrix, scalem(0.3 + 0.7*(1-inter), 0.3 + 0.7*(1-inter), 0.3 + 0.7*(1-inter)));
        }
        if (!this.have_I_rendered_before){
            temp_matrix = mult(temp_matrix, scalem(inter, inter, inter));
        }
        return temp_matrix;
    }
    move(id_of_this_sheep){
        this.render_process = true;
        if (this.was_just_born){
            this.was_just_born = false;
            return;
        }
        this.have_I_rendered_before = true;
        if (this.adult){
            this.timesteps_since_birth++;
            if (this.timesteps_since_birth == this.timesteps_until_birth){
                this.birth_now = true;
                this.timesteps_since_birth = 0;
            }
        } else {
            this.timesteps_until_adult--;
            this.adult = this.timesteps_until_adult == 0;
        }
        var empties = [];
        var prioritize = [];
        this.check_if_dead(id_of_this_sheep);
        for (var i = 0; i < mv_poss.length; i++){
            var grid_space = world.get_grid_space(
                (this.i + mv_poss[i][0] + grid_size)%(grid_size), 
                (this.j + mv_poss[i][1] + grid_size)%(grid_size),
                (this.k + mv_poss[i][2] + grid_size)%(grid_size)
            );
            var opposite_space = world.get_grid_space(
                (this.i - mv_poss[i][0] + grid_size)%(grid_size), 
                (this.j - mv_poss[i][1] + grid_size)%(grid_size),
                (this.k - mv_poss[i][2] + grid_size)%(grid_size)
            );
            if (grid_space == 0){
                empties.push(i);
            } else if (grid_space == 2  &&  opposite_space == 0){
                prioritize.push(i+1-2*(i%2));
            }
        }
        if (prioritize.length > 0){
            var rand = Math.floor(Math.random()*prioritize.length);
            world.set_grid_space(this.i, this.j, this.k, 0);
            this.i = (this.i + mv_poss[prioritize[rand]][0] + grid_size)%(grid_size);
            this.j = (this.j + mv_poss[prioritize[rand]][1] + grid_size)%(grid_size);
            this.k = (this.k + mv_poss[prioritize[rand]][2] + grid_size)%(grid_size);
            world.set_grid_space(this.i, this.j, this.k, 1);
        }
        else if (empties.length > 0){
            var rand = Math.floor(Math.random()*empties.length);
            world.set_grid_space(this.i, this.j, this.k, 0);
            this.i = (this.i + mv_poss[empties[rand]][0] + grid_size)%(grid_size);
            this.j = (this.j + mv_poss[empties[rand]][1] + grid_size)%(grid_size);
            this.k = (this.k + mv_poss[empties[rand]][2] + grid_size)%(grid_size);
            world.set_grid_space(this.i, this.j, this.k, 1);
        }
        if (this.birth_now){
            this.birth_now = false;
            empties = [];
            for (var i = 0; i < mv_poss.length; i++){
                var grid_space = world.get_grid_space(
                    (this.i + mv_poss[i][0] + grid_size)%(grid_size), 
                    (this.j + mv_poss[i][1] + grid_size)%(grid_size),
                    (this.k + mv_poss[i][2] + grid_size)%(grid_size)
                );
                if (grid_space == 0){
                    empties.push(i);
                }
            }
            if (empties.length > 0){
                var rand = Math.floor(Math.random()*empties.length);
                var new_sheep_i = (this.i + mv_poss[empties[rand]][0] + grid_size)%(grid_size);
                var new_sheep_j = (this.j + mv_poss[empties[rand]][1] + grid_size)%(grid_size);
                var new_sheep_k = (this.k + mv_poss[empties[rand]][2] + grid_size)%(grid_size);
                world.set_grid_space(new_sheep_i, new_sheep_j, new_sheep_k, 1);
                create_new_sheep(new_sheep_i, new_sheep_j, new_sheep_k, true, true);
            }
        }
    }
}

function create_new_sheep(i, j, k, render_process, was_just_born){
    var new_sheep = new Sheep(i, j, k);
    new_sheep.render_process = render_process;
    new_sheep.was_just_born = was_just_born;
    sheep.set(sheep_id_counter++, new_sheep);
}

class Wolf{
    constructor(i, j, k){
        this.i = i;
        this.j = j;
        this.k = k;
        this.old_i = this.i;
        this.old_j = this.j;
        this.old_k = this.k;
        // this.adult = false;
        // this.timesteps_until_adult = Math.floor(sheep_grow_up_time*(.5+Math.random()));
        this.foods_until_birth = Math.floor(wolf_birth_food*(.5+Math.random()));
        this.foods_eaten = 0;
        this.time_since_meal = 0;
        this.have_I_rendered_before = false;
        this.was_just_born = true;
        this.render_process = true;
    }
    get_coords(){
        return [this.i, this.j, this.k];
    }
    get_interpolated_coords(inter){
        return [this.i*inter + (1-inter)*this.old_i, this.j*inter + (1-inter)*this.old_j, this.k*inter + (1-inter)*this.old_k];
    }
    update_olds(){
        this.old_i = this.i;
        this.old_j = this.j;
        this.old_k = this.k;
    }
    check_if_dead(id_of_this_wolf){
        if (this.will_I_die()){
            world.set_grid_space(this.i, this.j, this.k, 0);
            wolfs.delete(id_of_this_wolf);
            return true;
        }
        return false;
    }
    will_I_die(){
        if (this.time_since_meal >= wolf_lifetime_without_food-1){
            return true;
        }
        return false;
    }
    get_translation_matrix(inter){
        var temp_matrix = translate(this.get_interpolated_coords(inter));
        if (this.will_I_die()){
            temp_matrix = mult(temp_matrix, scalem(1-inter, 1-inter, 1-inter));
        }
        if (!this.have_I_rendered_before){
            temp_matrix = mult(temp_matrix, scalem(inter, inter, inter));
        }
        return temp_matrix;
    }
    move(id_of_this_wolf){
        this.render_process = true;
        if (this.was_just_born) {
            this.was_just_born = false;
            return;
        }
        this.have_I_rendered_before = true;
        this.time_since_meal++;
        var prioritize = [];
        var empties = [];
        for (var n = 1; n <= wolf_smell_dist; n++){
            if (prioritize.length > 0) break;
            for (var i = 0; i < mv_poss.length; i++){
                var grid_space = world.get_grid_space(
                    (this.i + n*mv_poss[i][0] + grid_size)%(grid_size), 
                    (this.j + n*mv_poss[i][1] + grid_size)%(grid_size),
                    (this.k + n*mv_poss[i][2] + grid_size)%(grid_size)
                );
                var base_grid_space = world.get_grid_space(
                    (this.i + mv_poss[i][0] + grid_size)%(grid_size), 
                    (this.j + mv_poss[i][1] + grid_size)%(grid_size),
                    (this.k + mv_poss[i][2] + grid_size)%(grid_size)
                );
                if (grid_space == 1  &&  base_grid_space != 2){
                    prioritize.push(i);
                }
                else if (n == 1 && grid_space == 0) empties.push(i);
            }
        }
        if (prioritize.length > 0){
            var rand = Math.floor(Math.random()*prioritize.length);
            world.set_grid_space(this.i, this.j, this.k, 0);
            var grid_space = world.get_grid_space(
                (this.i + mv_poss[prioritize[rand]][0] + grid_size)%(grid_size), 
                (this.j + mv_poss[prioritize[rand]][1] + grid_size)%(grid_size),
                (this.k + mv_poss[prioritize[rand]][2] + grid_size)%(grid_size)
            );
            if (grid_space == 1){
                this.time_since_meal = 0;
                this.foods_eaten = (this.foods_eaten + 1)%this.foods_until_birth;
                if (this.foods_eaten == 0){
                    world.set_grid_space(this.i, this.j, this.k, 2);
                    // wolfs.push(new Wolf(this.i, this.j, this.k));
                    create_new_wolf(this.i, this.j, this.k, true, true);
                }
            }
            if (this.time_since_meal >= wolf_lifetime_without_food){
                // wolfs.splice(index_of_this_wolf, 1);
                wolfs.delete(id_of_this_wolf);
            } else {
                this.i = (this.i + mv_poss[prioritize[rand]][0] + grid_size)%(grid_size);
                this.j = (this.j + mv_poss[prioritize[rand]][1] + grid_size)%(grid_size);
                this.k = (this.k + mv_poss[prioritize[rand]][2] + grid_size)%(grid_size);
                world.set_grid_space(this.i, this.j, this.k, 2);
            }
        }
        else if (empties.length > 0){
            var rand = Math.floor(Math.random()*empties.length);
            world.set_grid_space(this.i, this.j, this.k, 0);
            if (this.time_since_meal >= wolf_lifetime_without_food){
                // wolfs.splice(index_of_this_wolf, 1);
                wolfs.delete(id_of_this_wolf);
            } else {
                this.i = (this.i + mv_poss[empties[rand]][0] + grid_size)%(grid_size);
                this.j = (this.j + mv_poss[empties[rand]][1] + grid_size)%(grid_size);
                this.k = (this.k + mv_poss[empties[rand]][2] + grid_size)%(grid_size);
                world.set_grid_space(this.i, this.j, this.k, 2);
            }
        }

        if (this.time_since_meal >= wolf_lifetime_without_food){
            // wolfs.splice(index_of_this_wolf, 1);
            world.set_grid_space(this.i, this.j, this.k, 0);
            wolfs.delete(id_of_this_wolf);
        }
    }
}

function create_new_wolf(i, j, k, render_process, was_just_born){
    var new_wolf = new Wolf(i, j, k);
    new_wolf.render_process = render_process;
    new_wolf.was_just_born = was_just_born;
    wolfs.set(wolf_id_counter++, new_wolf);
}

function Spawn_n_amount_of_foo(create_new_foo, N, render_process, was_just_born){
    for (var n = 0; n < N; n++){
        var i = Math.floor(Math.random()*grid_size);
        var j = Math.floor(Math.random()*grid_size);
        var k = Math.floor(Math.random()*grid_size);
        if (true){  //  (world.empty_spaces > 0){
            RetryLoop:
            for (var ii = 0; ii < grid_size; ii++){
                for (var jj = 0; jj < grid_size; jj++){
                    for (var kk = 0; kk < grid_size; kk++){
                        if (world.get_grid_space((i+ii)%grid_size, (j+jj)%grid_size, (k+kk)%grid_size) == 0){
                            world.set_grid_space((i+ii)%grid_size, (j+jj)%grid_size, (k+kk)%grid_size);
                            // wolfs.push(new Wolf((i+ii)%grid_size, (j+jj)%grid_size, (k+kk)%grid_size));
                            create_new_foo((i+ii)%grid_size, (j+jj)%grid_size, (k+kk)%grid_size, render_process, was_just_born);
                            break RetryLoop;
                        }
                    }
                }
            }
        }
    }
}

class World{
    constructor(n){
        this.n = n;
        this.world = [];
        this.empty_spaces = n*n*n;
        for (var i = 0; i < n; i++){
            this.world.push([]);
            for (var j = 0; j < n; j++){
                this.world[i].push([]);
                for (var k = 0; k < n; k++){
                    this.world[i][j].push(0);  // 0 defines an empty grid-space.
                }
            }
        }
    }
    get_grid_space(i, j, k){
        return this.world[i][j][k];
    }
    set_grid_space(i, j, k, value){
        this.empty_spaces += this.world[i][j][k] != 0 ? -1 : 0 + value != 0 ? 1 : 0;
        this.world[i][j][k] = value;
    }
    get_empty_spaces(){
        return this.empty_spaces;
    }
    print_count(){
        console.log(this.empty_spaces);
        var count_arr = [0,0,0];
        for (var i = 0; i < this.n; i++){
            for (var j = 0; j < this.n; j++){
                for (var k = 0; k < this.n; k++){
                    count_arr[this.world[i][j][k]]++;
                }
            }
        }
        console.log(count_arr);
    }
}

function sigmoid(x){
    return 1/(1+Math.exp(-x));
}

function render()
{
    // world.print_count();
    frames++;
    frames = frames % (frames_for_timestep + frames_between_gridsteps);
    var update_timestep = frames == 0;
    var pause = frames == frames_for_timestep;
    var time = (frames/frames_for_timestep-0.5)*10;
    var interpolation_factor = sigmoid(time);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Vinstra auga...
    var mv = lookAt( vec3(0.0-eyesep/2.0, 0.0, zDist*0.8),
                      vec3(0.0, 0.0, zDist+2.0),
                      vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, mult( rotateX(spinX), rotateY(spinY) ) );

    // Vinstri mynd er í rauðu...
    // gl.uniform4fv( colorLoc, vec4(1.0, 0.0, 0.0, 1.0) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.LINES, 0, num_line_vertices );

    // mv_cube = mult(mv, translate(-1/grid_size*(grid_size-1)/2, -1/grid_size*(grid_size-1)/2, -1/grid_size*(grid_size-1)/2 ));
    // mv_cube = mult(mv_cube, scalem(1/grid_size, 1/grid_size, 1/grid_size))
    mv_cube = mult(mv, scalem(1/grid_size, 1/grid_size, 1/grid_size))
    mv_cube = mult(mv_cube, translate(-1*(grid_size-1)/2, -1*(grid_size-1)/2, -1*(grid_size-1)/2 ));

    // console.log(translate(sheep[0].get_coords()));
    for (var [key, value] of sheep.entries()){
        if (update_timestep  && !halt) value.move(key);
        if (pause  &&  !halt) {
            value.update_olds();
            if (value.check_if_dead(key)) continue;
        }
        if (!value.render_process) continue;
        // mv_sheep = mult(mv_sheep, translate(value.get_interpolated_coords(interpolation_factor)));
        mv_sheep = mult(mv_cube, value.get_translation_matrix(interpolation_factor));
        mv_sheep = mult(mv_sheep, scalem(.99, .99, .99));  // To circumvent line segment interference in canvas (graphical artifact).
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv_sheep));
        gl.drawArrays( gl.TRIANGLES, 3*num_line_vertices, num_cube_vertices);
        gl.drawArrays( gl.LINES, num_line_vertices, num_line_vertices );
    }
    for (var [key, value] of wolfs.entries()){
        if (update_timestep  &&  !halt) value.move(key);
        if (pause  &&  !halt) {
            value.update_olds();
            if (value.check_if_dead(key)) continue;
        }
        if (!value.render_process) continue;
        // mv_wolf = mult(mv_cube, translate(value.get_interpolated_coords(interpolation_factor)));
        mv_wolf = mult(mv_cube, value.get_translation_matrix(interpolation_factor));
        mv_wolf = mult(mv_wolf, scalem(.99, .99, .99));
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv_wolf));
        gl.drawArrays( gl.TRIANGLES, 3*num_line_vertices+num_cube_vertices, num_cube_vertices);
        gl.drawArrays( gl.LINES, 2*num_line_vertices, num_line_vertices );
    }
    
    if (halt && frames != 1) frames--;
    requestAnimFrame( render );
}
