/* 
 * A basic etch-e-sketch.
 */

// Constants
const unit = 10;

// The globals.
var keymap;
var canvas;
var gfx;
var x, y;

// Add key listeners.
document.addEventListener("keyup", onKeyUp, false);
document.addEventListener("keydown", onKeyDown, false);

// The game initiator.
$(document).ready(function () {
    // Setup the game.
    setup();
    // Add the runner.
    setInterval(run, 10);
});

// Function to draw a line.
function move(dx, dy) {
    let nx = x + dx;
    let ny = y + dy;
    gfx.beginPath();
    gfx.lineWidth = "1";
    gfx.moveTo(x, y);
    gfx.lineTo(nx, ny);
    gfx.stroke();
    x = nx;
    y = ny;
}

// Function to handle key ups.
function onKeyUp(e) {
    // Set the keymap state.
    keymap[e.keyCode] = false;
}

function onKeyDown(e) {
    // Set the keymap state.
    keymap[e.keyCode] = true;
}

// Function to setup the game.
function setup() {
    // Create the keymap.
    keymap = new Array(128);
    // Fill the keymap.
    keymap.fill(false);
    // Get the canvas.
    canvas = document.getElementById("etch-canvas");
    // Resize
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = canvas.offsetWidth * 4;
    canvas.height = canvas.offsetWidth * 4;
    // Get the gfx.
    gfx = canvas.getContext("2d");
    // Reset
    reset();
}

// Function to reset the game.
function reset() {
    // Get positions.
    x = canvas.width / 2;
    y = canvas.height / 2;
    // Clear the canvas.
    gfx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to run the game.
function run() {
    // Deltas
    let dx = 0;
    let dy = 0;
    
    // Left
    if (keymap[37] || keymap[65]) {
        dx -= unit;
    }
    
    // Up
    if (keymap[38] || keymap[87]) {
        dy -= unit;
    }
    
    // Right
    if (keymap[39] === true || keymap[68] === true) {
        dx += unit;
    }
    
    // Down
    if (keymap[40] === true || keymap[83] === true) {
        dy += unit;
    }
    
    // Draw line if deltas non-zero.
    if (dx !== 0 || dy !== 0) {
        move(dx, dy);
    }
    
    // Reset
    if (keymap[32] === true) { // Space
        reset();
    }
}