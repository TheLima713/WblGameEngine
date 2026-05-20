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
import Counter from "./libs/Counter.js";
import HomingBullet from "./examples/HomingBullet.js";

console.log('Hello, world!');

let renderer = new Renderer('canvas',960,540);
let inputManager = new InputManager('canvas');
let entityManager = new EntityManager(renderer,inputManager);

let player = new Player();

let turret = new Turret();
turret.setPosition(new V3(250,100));

let turret2 = new Turret();
turret2.setPosition(new V3(550,300));
turret.setBulletType(HomingBullet);

entityManager.addEntity(player);
entityManager.addEntity(turret);
entityManager.addEntity(turret2);

entityManager.init();
setInterval(()=>{
    entityManager.run();
},1000/60);