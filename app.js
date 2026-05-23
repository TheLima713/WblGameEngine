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

let ms = 0;

entityManager.init();
setInterval(()=>{
    frameCounter.count();

    let beforeExec = Date.now();

    entityManager.run();
    
    let afterExec = Date.now();

    //entityManager.renderer.postProcess(frameCounter.currValue);
    SM.setImageData(renderer.getImageData());
    SM.runShader(
        'tint',
        {
            tintColor: new Color(0,0,0.05)
        }
    );
    SM.runShader(
        'chromaberration',
        {
            offset: 5 / renderer.size.x
        }
    );
    SM.runShader('crt');
    SM.runShader(
        'fisheye',
        {
            warp: 0.25
        }
    );
    
    renderer.setImageData(SM.getImageData());
    
    let afterPost = Date.now();

    //console.log(`Exec time: ${afterExec - beforeExec}ms  |  Post time: ${afterPost - afterExec}ms`);
},1000/60);
