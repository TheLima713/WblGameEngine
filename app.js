/*
resources i need to gamedev:
libs/manager objs:
- &audio
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
import GLRenderer from "./libs/ShaderManager.js";
import Color from "./libs/Color.js";
import ShaderManager from "./libs/ShaderManager.js";

console.log('Hello, world!');

let SM = new ShaderManager('gl-canvas',new V3(1920,1080).scale(0.5));
await SM.loadShaders();

let renderer = new Renderer('canvas',new V3(960,540));
let inputManager = new InputManager('canvas');
let entityManager = new EntityManager(renderer,inputManager);
let frameCounter = new Counter(0);

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
    frameCounter.count();

    entityManager.run();
    //entityManager.renderer.postProcess(frameCounter.currValue);
    let imgData = entityManager.renderer.getImageData();
    SM.runShader('crt', imgData);
    SM.runShader('tint', SM.getImageData());
},1000/60);
