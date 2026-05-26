/*
resources i need to gamedev:
libs/manager objs:
- &audio
- >Scene
*/

import V3 from "./libs/V3.js";
import WebGLRenderer from "./libs/WebGLRenderer.js";
import InputManager from "./libs/InputManager.js";
import EntityManager from "./libs/EntityManager.js";
import Counter from "./libs/Counter.js";

import Player from "./examples/SimplePlayer.js";
import Turret from "./examples/SimpleTurret.js";
import HomingBullet from "./examples/HomingBullet.js";

console.log('Hello, world!');

let webGLRenderer = new WebGLRenderer('canvas',new V3(1920,1080).scale(0.5));
await webGLRenderer.load();

let inputManager = new InputManager('canvas');
let entityManager = new EntityManager(webGLRenderer,inputManager);
let frameCounter = new Counter(0);

let player = new Player();
let turret = new Turret().setPosition(new V3(250,100));
let turret2 = new Turret().setPosition(new V3(550,300)).setBulletType(HomingBullet);

entityManager.addEntities([turret,turret2,player]);

let ms = 0;

entityManager.init();
setInterval(()=>{
    frameCounter.count();

    let beforeExec = Date.now();

    entityManager.run();
    
    let afterExec = Date.now();

    webGLRenderer.draw();
    webGLRenderer.postProcess(frameCounter.currValue);
    
    let afterPost = Date.now();

    //console.log(`Exec time: ${afterExec - beforeExec}ms  |  Post time: ${afterPost - afterExec}ms`);
},1000/60);


// Persio Quests:
// - Shader pra recortar um layer da mesh 3d e mostrar o 'interior'
// - Tesselation
// - Shader node editor