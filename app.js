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

import V3 from "./libs/V3.js"
import Mesh from "./libs/Mesh.js"
import Color from "./libs/Color.js"
import Renderer from "./libs/Renderer.js"
import StateMachine, { State } from "./libs/StateMachine.js"
import generateDropletSM from "./examples/Droplet.js"

console.log('Hello, world!')

let screen = new Renderer('canvas',960,540);

let machine1 = generateDropletSM(screen);
machine1.stateChangeCallback = (curr,next,data)=>{
    console.log(curr,next,data);
}
machine1.init();