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

import V3 from "./libs/V3.js";
import Renderer from "./libs/Renderer.js"
import InputManager from "./libs/InputManager.js";
import EntityManager from "./libs/EntityManager.js";
import Player from "./examples/SimplePlayer.js";
import Turret from "./examples/SimpleTurret.js";

console.log('Hello, world!');

let renderer = new Renderer('canvas',960,540);
let inputManager = new InputManager('canvas');
let entityManager = new EntityManager(renderer,inputManager);

let player = new Player();
let turret = new Turret();
turret.setPosition(new V3(250,100));

entityManager.addEntity(player);
entityManager.addEntity(turret);

entityManager.init();
setInterval(()=>{
    entityManager.run();
},1000/60);