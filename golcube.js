// Grid size (grid will be n^2)
const n = 16;

class Grid {
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

                // Alive cells with 2 or 3 neighbors live on
                if (this.grid[r][c] == 1)
                    if (alive_cells == 2 || alive_cells == 3)
                        next_state[r][c] = 1;
                
                // Dead cells with 3 neighbors become alive
                if (this.grid[r][c] == 0)
                    if (alive_cells == 3)
                        next_state[r][c] = 1;
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

const faces = [north,east,south,west,up,down];
const canvas_ids = ["canvas_north","canvas_east","canvas_south","canvas_west","canvas_up","canvas_down"];
let canvas_textures = [null,null,null,null,null,null];


// Define each face's neighbors (rotations calculated by hand, there's probably a nicer way to do this)
const A = 90;   // anti-clockwise
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

// glider
north.setCell(3,7,1);
north.setCell(4,7,1);
north.setCell(5,7,1);
north.setCell(5,6,1);
north.setCell(4,5,1);

// glider
south.setCell(3,7,1);
south.setCell(4,7,1);
south.setCell(5,7,1);
south.setCell(5,6,1);
south.setCell(4,5,1);

east.setCell(7,5,1);
east.setCell(7,4,1);
east.setCell(7,6,1);

west.setCell(3,3,1);
west.setCell(3,4,1);
west.setCell(4,4,1);
west.setCell(4,6,1);
west.setCell(5,4,1);

// test the cube sides in 2D
// TODO: don't draw sides that aren't visible

function drawGrids2D() {
    let size = 400;

    for(var i = 0; i < faces.length; i++) {
        const canvas = document.getElementById(canvas_ids[i]);
        const ctx = canvas.getContext('2d');

        if (!(ctx.canvas.width == size && ctx.canvas.height == size)) {
            ctx.canvas.width = size;
            ctx.canvas.height = size;
        }

        ctx.fillStyle = 'white'
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'dodgerblue';

        for(var y = 0; y < n; y++) {
            for(var x = 0; x < n; x++) {
                if (faces[i].getGrid()[y][x] == 1) {
                    ctx.fillRect(x / n * size, y / n * size, size/n, size/n);
                } else {
                    ctx.strokeRect(x / n * size, y / n * size, size/n, size/n);
                }
            }
        }

        if (canvas_textures[i] == null) {
            canvas_textures[i] = new THREE.CanvasTexture(ctx.canvas);
        }


        ctx.canvas.hidden = true;
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
document.body.appendChild(renderer.domElement);

const materials = [
    new THREE.MeshBasicMaterial({map: canvas_textures[1]}), // East
    new THREE.MeshBasicMaterial({map: canvas_textures[3]}), // West
    new THREE.MeshBasicMaterial({map: canvas_textures[4]}), // Up
    new THREE.MeshBasicMaterial({map: canvas_textures[5]}), // Down
    new THREE.MeshBasicMaterial({map: canvas_textures[0]}), // North
    new THREE.MeshBasicMaterial({map: canvas_textures[2]})  // South
];

const geometry = new THREE.BoxGeometry();
const cube = new THREE.Mesh( geometry, materials );
scene.add( cube );

cube.rotation.y = Math.PI/4;
cube.rotation.x = Math.PI/6;

camera.position.z = 2;

//////////////////
// UPDATE STUFF //
//////////////////

let frame = 0; 
let update_speed = 15;  // how many frames between grid updates?
let prev_mx = Infinity;
let prev_my = Infinity;
let mouse_down = false;

const TAU = 2*Math.PI;


let rot_vx = 0;
let rot_vy = 0;

var update = function(){
    frame++;

    if (frame % update_speed == 0) {
        updateGrids();
    }

    update_speed = document.getElementById('update_speed').value;

    
    cube.rotation.x += rot_vx;
    cube.rotation.y += rot_vy;

    rot_vx = lerp(rot_vx, 0, .2);
    rot_vy = lerp(rot_vy, 0, .2);

    drawGrids2D();
    canvas_textures.forEach((canvas) => canvas.needsUpdate = true);

    renderer.render(scene, camera);
    requestAnimationFrame(update);  
}
update();


window.addEventListener('mousedown', e => {
    mouse_down = true;
});

window.addEventListener('mouseup', e => {
    mouse_down = false;
});


window.addEventListener('mousemove', e => {
    if (prev_mx != Infinity && mouse_down) {
        let dx = e.x - prev_mx;
        let dy = e.y - prev_my;

        rot_vx = dy * .005;
        rot_vy = dx * .005;

        cube.rotation.x = (cube.rotation.x) % (TAU);
        cube.rotation.y = (cube.rotation.y) % (TAU);
        
    }

    prev_mx = e.x;
    prev_my = e.y;
});

// https://stackoverflow.com/questions/20290402/three-js-resizing-canvas
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function lerp (start, end, step){
    return (1-step)*start+step*end
}