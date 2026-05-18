/*
resources i need to gamedev:
libs/manager objs:
- &audio
- &draw
- &color
- &vector math
- input listener
- input mapping
 - reference to focus object
- >state machine
- >animation
- >Scene
*/

import Renderer from "./libs/Renderer.js"
import generateDropletSM from "./examples/Droplet.js"
import InputManager from "./libs/InputManager.js";
import StateMachine, { State } from "./libs/StateMachine.js";
import V3 from "./libs/V3.js";
import Color from "./libs/Color.js";
import Player from "./examples/SimplePlayer.js";
import Turret from "./examples/SimpleTurret.js";

console.log('Hello, world!')

let inputManager = new InputManager(document.getElementById('canvas'));
let renderer = new Renderer('canvas',960,540);

let player = new Player(renderer,inputManager);
player.stateMachine.init();

let turret = new Turret(renderer,inputManager);
turret.setPosition(new V3(250,100));
turret.stateMachine.init();

let machines = [
    player.stateMachine,
    turret.stateMachine,
];

let timer = 0;

loop();
function loop() {
    //Exec
    machines.forEach((machine)=>{
        machine.run();
    })

    //Clear
    machines = machines.filter(machine=>machine.currState!==null);

    //Input
    timer++;
    if(inputManager.keyboard['k'] && timer>100) {
        timer = 0;

        let newMachine = generateDropletSM({
            drawPos: new V3(0,0),
            renderer: renderer,
            inputManager: inputManager
        });
        newMachine.init();
        machines.push(newMachine);
    }
    
    //Draw
    renderer.fill();
    machines.forEach((machine)=>{
        machine.draw();
    })

    //Loop
    setTimeout(loop,1000/60);
}
