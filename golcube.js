// Grid size (grid will be n^2)
const n = 16;

const DEBUG = false;

let selected_face = 0;
let selected_x = 0;
let selected_y = 0;
let prev_selected_x = 0;
let prev_selected_y = 0;
let prev_selected_face = 0;

let paused = true;

let frame = 0; 
let update_speed = document.getElementById("update_speed").value;  // how many frames between grid updates?
let prev_mx = Infinity;
let prev_my = Infinity;
let mouse_down = false;

let rot_vx = 0;
let rot_vy = 0;

const canvas_ids = ["canvas_east","canvas_west","canvas_up","canvas_down","canvas_north","canvas_south"];
let canvas_textures = [null,null,null,null,null,null];

const grid_colour_back = "navy"
const grid_colour_back_lines = "blue"
const grid_colour_alive = "lime"

const grid_cells_cols = [
    "navy",
    "lime",
    "green"
]

const TAU = Math.PI*2;

let rule_set = "rules_gol";

class Grid {
    grid = [];
    redraw_required = true;

    constructor() {
        this.grid = Array2D.build(n,n,0);

        // Neighbor order: Left, Up, Right, Down (LURD)
        // [grid reference, relative rotation]
        this.neighbors = [
            [null,0],
            [null,0],
            [null,0],
            [null,0]
        ];
    }

    addNeighbor(i,neighbor, rotation) {
        this.neighbors[i] = [neighbor,rotation];
    }
    
    // Build 3n x 3n array with the neighbors correctly transformed & glued together
    buildNeighborhoodArray() {
        let s = this.grid.length

        let neighbor_matrix = Array2D.build(3*s, 3*s, 0);

        neighbor_matrix = Array2D.paste(neighbor_matrix, this.grid, s, s);
        
        const paste_coords = [
            [s, 0],
            [0, s],
            [s, 2*s],
            [2*s, s]
        ]

        for(var i = 0; i < 4; i++) {
            let n = this.neighbors[i][0].grid;
            
            if (this.neighbors[i][1] != 0)
                n = rotate2DArray(n, this.neighbors[i][1]);

            neighbor_matrix = Array2D.paste(neighbor_matrix, n, paste_coords[i][0], paste_coords[i][1]);
        }

        return neighbor_matrix;
    }

    // Core update procedure for the grid instance
    update() {

        let next_state = Array2D.build(n,n,0);

        let neighbor_matrix = this.buildNeighborhoodArray();
    
        for(var r = 0; r < n; r++) {
            for(var c = 0; c < n; c++) {
                let alive_cells = countNeighbors(neighbor_matrix, n + c, n + r, 1);

                if (rule_set == "rules_gol") {
                    // Alive cells with 2 or 3 neighbors live on
                    if (this.grid[r][c] == 1)
                        if (alive_cells == 2 || alive_cells == 3)
                            next_state[r][c] = 1;
                    
                    // Dead cells with 3 neighbors become alive
                    if (this.grid[r][c] == 0)
                        if (alive_cells == 3) 
                            next_state[r][c] = 1;

                } else if (rule_set == "rules_brian") {
                    if (this.grid[r][c] == 0 && alive_cells == 2)
                        next_state[r][c] = 1;
                    if (this.grid[r][c] == 1)
                        next_state[r][c] = 2;
                    if (this.grid[r][c] == 2)
                        next_state[r][c] = 0;
                }

                if (this.grid[r][c] != next_state[r][c])
                    this.redraw_required = true;
            }
        }

        return next_state;
    }
    
    setCell(x,y,s) {
        this.grid[y][x] = s;
    }
    
    getGrid() {
        return this.grid;
    }

}

// Count neighbors of a specific type t at coordinates x, y of a grid
function countNeighbors(grid,x,y,t) {
    let count = 0;

    for(var r = -1; r < 2; r++) {
        for(var c = -1; c < 2; c++) {
            if (!(r == 0 && c == 0))
                if (grid[y+r][x+c] == t)
                    count++;
        }
    }
    return count;
}

// Given array and angle, returns the array rotated by that angle
/* Angle arguments:      90 : Anti-clockwise
                        -90 : Clockwise
                        180 : Flip upside down 
*/
function rotate2DArray(arr, angle) {
    if (!(angle == 90 || angle == -90 || angle == 180))
        return arr;

    let ret_arr = [];
    for(var i = 0; i < arr.length; i++) {
        var row = [];
        for(var j = 0; j < arr.length; j++) {
            let x,y = null;
            
            if (angle == 180) {
                y = arr.length-1-i;
                x = arr.length-1-j;
            } else {
                x = (angle == 90 ? arr.length-1-i : i);
                y = (angle == -90 ? arr.length-1-j : j);
            }
            
            row[j] = arr[y][x]
        }
        ret_arr[i] = row;
    }

    return ret_arr;               
}

// Update method which processes all the grids
function updateGrids() {
    let next_grids = [];

    faces.forEach((face) => {
        let next_grid_state = face.update();
        next_grids.push(next_grid_state);
    });

    for(var i = 0; i < next_grids.length; i++) {
        faces[i].grid = next_grids[i];
    }
}


/////////////////////
// INITIALIZATIONS //
/////////////////////

let north   = new Grid();
let west    = new Grid();
let south   = new Grid();
let east    = new Grid();
let up      = new Grid();
let down    = new Grid();

const faces = [east,west,up,down,north,south];


// Define each face's neighbors (rotations calculated by hand, there's probably a nicer way to do this)
const A =  90;  // anti-clockwise
const C = -90;  // clockwise
const F = 180;  // flip

north.addNeighbor(0, west,      0 );
north.addNeighbor(1, up,        0 );
north.addNeighbor(2, east,      0 );
north.addNeighbor(3, down,      0 );

east.addNeighbor(0, north,      0 );
east.addNeighbor(1, up,         C );
east.addNeighbor(2, south,      0 );
east.addNeighbor(3, down,       A );    

south.addNeighbor(0, east,      0 );
south.addNeighbor(1, up,        F );
south.addNeighbor(2, west,      0 );
south.addNeighbor(3, down,      F );

west.addNeighbor(0, south,      0 );
west.addNeighbor(1, up,         A );
west.addNeighbor(2, north,      0 );
west.addNeighbor(3, down,       C );

up.addNeighbor(0, west,         C );
up.addNeighbor(1, south,        F );
up.addNeighbor(2, east,         A );
up.addNeighbor(3, north,        0 );

down.addNeighbor(0, west,       A );
down.addNeighbor(1, north,      0 );
down.addNeighbor(2, east,       C );
down.addNeighbor(3, south,      F );

// test the cube sides in 2D
// TODO: don't draw sides that aren't visible
//       current solution: lazy drawing (each grid has a redraw flag)

let size = 400;
function drawGrids2D() {
    for(var i = 0; i < faces.length; i++) {
        const canvas = document.getElementById(canvas_ids[i]);
        const ctx = canvas.getContext('2d');

        if (!(ctx.canvas.width == size && ctx.canvas.height == size)) {
            ctx.canvas.width = size;
            ctx.canvas.height = size;
        }


        if (faces[i].redraw_required) {
            if (DEBUG)
                console.log('redraw face ' + canvas_ids[i]);

            ctx.fillStyle = grid_colour_back;
            ctx.fillRect(0, 0, size, size);
            ctx.lineWidth = 1;
            
            for(var y = 0; y < n; y++) {
                for(var x = 0; x < n; x++) {
                    var cell = faces[i].getGrid()[y][x];
                    ctx.fillStyle = grid_cells_cols[cell];
                    ctx.strokeStyle = grid_colour_back_lines;

                    if (faces[i].getGrid()[y][x] > 0) {
                        ctx.fillRect(x / n * size, y / n * size, size/n, size/n);
                    } else {
                        ctx.strokeRect(x / n * size, y / n * size, size/n, size/n);
                    }
                }
            }
            faces[i].redraw_required = false;
        }

        // Selection highlighter
        if (canvas_ids[i] == canvas_ids[selected_face]) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.strokeRect(selected_x / n * size, selected_y / n * size, size/n, size/n);
        }

        // Initialize the canvas texture
        if (canvas_textures[i] == null) {
            canvas_textures[i] = new THREE.CanvasTexture(ctx.canvas);
            canvas_textures[i].magFilter = THREE.NearestFilter;
        }
    }
}

drawGrids2D();

//////////////
// 3D STUFF //
//////////////

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000);

const renderer = new THREE.WebGLRenderer({antialias: false});
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.domElement.style.position = 'absolute';
renderer.domElement.style.left = 0;
renderer.domElement.style.top = 0;

document.body.appendChild(renderer.domElement);
const materials = [
    new THREE.MeshStandardMaterial({map: canvas_textures[0]}), // East
    new THREE.MeshStandardMaterial({map: canvas_textures[1]}), // West
    new THREE.MeshStandardMaterial({map: canvas_textures[2]}), // Up
    new THREE.MeshStandardMaterial({map: canvas_textures[3]}), // Down
    new THREE.MeshStandardMaterial({map: canvas_textures[4]}), // North
    new THREE.MeshStandardMaterial({map: canvas_textures[5]})  // South
];

const geometry = new THREE.BoxGeometry();
const cube = new THREE.Mesh( geometry, materials );
scene.add( cube );


const amblight = new THREE.AmbientLight(0xffffff,1);
scene.add(amblight);


cube.rotation.y = Math.PI/4;
cube.rotation.x = Math.PI/6;
camera.position.z = 2;

let rotating_cube = false; // cube is currently being rotated by dragging the background

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();


//////////////////
// UPDATE STUFF //
//////////////////

function update() {
    frame++;

    if (!paused && frame % update_speed == 0) {
        updateGrids();
    }

    update_speed = 61 - document.getElementById('update_speed').value;

    if (cube.rotation.x + rot_vx < Math.PI/2 && cube.rotation.x + rot_vx > -Math.PI/2)
        cube.rotation.x += rot_vx;
    cube.rotation.y += rot_vy;

    rot_vx = lerp(rot_vx, 0, .2);
    rot_vy = lerp(rot_vy, 0, .2);

    drawGrids2D();
    canvas_textures.forEach((canvas) => canvas.needsUpdate = true);

	// update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children );

    if (!rotating_cube && intersects[0] != null) {
        prev_selected_face = selected_face;
        prev_selected_x = selected_x;
        prev_selected_y = selected_y;

	    selected_face = Math.floor(intersects[0].faceIndex/2);
        selected_x = Math.floor(intersects[0].uv.x * n);
        selected_y = (n-1) - Math.floor(intersects[0].uv.y * n);

        if (prev_selected_x != selected_x || prev_selected_y != selected_y) 
            faces[selected_face].redraw_required = true;

        if (prev_selected_face != selected_face && prev_selected_face != null)
            faces[prev_selected_face].redraw_required = true;
    } else {
        if (selected_face != null)
            faces[selected_face].redraw_required = true;
        selected_face = null;
        selected_x = 0;
        selected_y = 0;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(update);  
}
update();


function clearCube(reset_cam) {
    faces.forEach(face => {

        face.grid = Array2D.fill(face.grid, 0);
        face.redraw_required = true;
    })

    if (reset_cam) {
        cube.rotation.y = Math.PI/4;
        cube.rotation.x = Math.PI/6;
        camera.position.z = 2;
    }
}


///////////////
// LISTENERS //
///////////////

window.addEventListener('mousedown', e => {
    mouse_down = true;
    if (!rotating_cube && selected_face != null) {
        faces[selected_face].setCell(selected_x,selected_y,1);
        faces[selected_face].redraw_required = true;
        drawGrids2D();
    }
});

window.addEventListener('mouseup', e => {
    mouse_down = false;
    rotating_cube = false;
});


window.addEventListener('mousemove', e => {
    if (selected_face == null) {
        if (prev_mx != Infinity && mouse_down && e.y > 60) {
            let dx = e.x - prev_mx;
            let dy = e.y - prev_my;

            rot_vx = dy * .005;
            rot_vy = dx * .005;

            cube.rotation.x = (cube.rotation.x) % (TAU);
            cube.rotation.y = (cube.rotation.y) % (TAU);
            
            rotating_cube = true;
        }
    } else if (mouse_down) {
        faces[selected_face].setCell(selected_x,selected_y,1);
        faces[selected_face].redraw_required = true;
        drawGrids2D();
    }
        

    prev_mx = e.x;
    prev_my = e.y;
});

window.addEventListener( 'pointermove', e => {
    pointer.x = ( e.x/ window.innerWidth ) * 2 - 1;
    pointer.y = - ((e.y)/ window.innerHeight ) * 2 + 1;
});

// https://stackoverflow.com/questions/20290402/three-js-resizing-canvas
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

document.getElementById('playbutton').addEventListener("click", e => {
    pause_unpause();
});

// document.getElementById('stepbutton').addEventListener("click", e => {
//     frame = 0;
//     paused = false;
//     updateGrids();
//     drawGrids2D();
//     paused = true;
// });

document.getElementById('clearbutton').addEventListener("click", e => {
    clearCube(false);
});

const rule_sets_combobox = document.getElementById('rule_sets');

rule_sets_combobox.addEventListener("change", e => {
    rule_set = rule_sets_combobox.options[rule_sets_combobox.selectedIndex].value;
    clearCube(true);
    pause();
});

window.addEventListener('keydown', (event) => {
    const keyName = event.key;
  
    if (keyName === ' ') {
      pause_unpause();
      return;
    }
  });

window.addEventListener('wheel', e => {
    cube.position.z = clamp(cube.position.z - .0025 * e.deltaY, -.5, 1);
});


////////////////////
// MISC FUNCTIONS //
////////////////////

function lerp (start, end, step){
    return (1-step)*start+step*end
}

function clamp (x, a, b){
    return Math.max(a, Math.min(x, b));
}

function pause_unpause() {
    (paused ? unpause() : pause());
}

function pause() {
    paused = true;
    document.getElementById('playbutton').innerHTML = "Play";
}

function unpause() {
    paused = false;
    document.getElementById('playbutton').innerHTML = "Pause";
    frame = update_speed - 1;
}