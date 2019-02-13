/* 
 * A basic L-System renderer.
 */

// Classes
class Lsys {
    
    // Handy-dandy constructor.
    constructor(name, axiom, grammar, mov_step, rot_step, max_depth, pax, pay) {
        this.name = name;
        this.axiom = axiom.slice();
        this.stack = axiom.slice();
        this.stack.reverse();
        this.grammar = grammar;
        this.mov_step = mov_step;
        this.rot_step = rot_step;
        this.max_depth = max_depth;
        this.depth = 0;
        this.pax = pax;
        this.pay = pay;
    }
    
    // Function to check for more.
    hasNext() {
        return this.stack.length > 0;
    }
    
    // Function to get next command.
    getNext() {
        while (this.stack.length > 0) {
            // Fetch first element.
            const c = this.stack.pop();
            // If this is the step char, step.
            if (c === '^') {
                this.depth = this.depth - 1;
                continue;
            }
            // If at maximum depth, skip expansion.
            if (this.depth >= this.max_depth) {
                return c;
            }
            // If no expansion, replace and stop!
            if (!this.grammar.has(c)) {
                return c;
            }
            // There is an expansion, continue.
            let expansion = this.grammar.get(c);
            // Increment the depth counter.
            this.depth += 1;
            // Push step token (Only if not at end).
            if (this.stack.length > 0) {
                this.stack.push('^');
            }
            // Loop through expansion and push to stack.
            for (var i = expansion.length - 1; i > -1; i--) {
                this.stack.push(expansion[i]);
            }
        }
    }
}

// Constants
const systems = [
    /*
    new Lsys(
            'tree',
            'a'.split(''),
            new Map([
                ['a', 'b[+a]-a'.split('')],
                ['b', 'bb'.split('')]
            ]),
            10,
            45 * (Math.PI / 180),
            8
    ),
    */
    new Lsys(
            'Sierpiński Triangle',
            'a-b-b'.split(''),
            new Map([
                ['a', 'a-b+a+b-a'.split('')],
                ['b', 'bb'.split('')]
            ]),
            10,
            120 * (Math.PI / 180),
            8,
            0.1,
            0.9
    ),
    new Lsys(
            'Koch Triangle',
            'a'.split(''),
            new Map([
                ['a', 'a+a-a-a+a'.split('')]
            ]),
            10,
            90 * (Math.PI / 180),
            8,
            0.1,
            0.1
    ),
    new Lsys(
            'Koch Square',
            'a-a-a-a'.split(''),
            new Map([
                ['a', 'aa-a-a-a-a-a+a'.split('')]
            ]),
            10,
            90 * (Math.PI / 180),
            8,
            0.1,
            0.1
    )
];

// The globals.
var keymap;
var canvas;
var gfx;
var rot;
var x, y;
var lsys;
var index;

// Add key listeners.
document.addEventListener("keyup", onKeyUp, false);
document.addEventListener("keydown", onKeyDown, false);

// The game initiator.
$(document).ready(function () {
    // Set the index
    index = 0;
    // Set the L-System
    select(index);
    // Setup the game.
    setup();
    // Add the runner.
    setInterval(run, 0);
});

// Function to select an l-system.
function select(index) {
    // Adjust the index.
    index %= systems.length;
    // Get the lsys to copy.
    let temp = systems[index];
    // Make a new lsys instance.
    lsys = new Lsys(temp.name, temp.axiom, temp.grammar, temp.mov_step, temp.rot_step, temp.max_depth, temp.pax, temp.pay);
    // Log
    console.log(lsys);
    // Set Title.
    $("#lsys-title").text("L-System: " + lsys.name);
}

// Function to draw a line.
function move(step) {
    let nx = x + step * Math.cos(rot);
    let ny = y + step * Math.sin(rot);
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
    // Increment the index if space key.
    if (e.keyCode === 32) {
        index++;
        index %= systems.length;
        select(index);
        reset();
    }
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
    canvas = document.getElementById("lsys-canvas");
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
    x = canvas.width * lsys.pax;
    y = canvas.height * lsys.pay;
    // Reset rotation.
    rot = 0;
    // Clear the canvas.
    gfx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to run the game.
function run() {
    // Loop through axiom.
    if (lsys.hasNext()) {
        // Get next command.
        const c = lsys.getNext();
        // Handle draw stuff.
        switch (c) {
            case '+':
                rot += lsys.rot_step;
                break;
            case '-':
                rot -= lsys.rot_step;
                break;
            default:
                move(lsys.mov_step);
                break;
        }
    }
}
