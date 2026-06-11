import WebGLRenderer from "../libs/WebGLRenderer.js";
import InputManager from "../libs/InputManager.js";
import EntityManager from "../libs/EntityManager.js";
import Counter from "../libs/Counter.js";
import Player from "./SimplePlayer.js";
import Turret from "./SimpleTurret.js";
import HomingBullet from "./HomingBullet.js";
import V3 from "../libs/V3.js";

export default class SimpleGame {
    constructor(){
        console.log('Hello, SimpleGame!');

        this.webGLRenderer = new WebGLRenderer('canvas',new V3(1920,1080).scale(0.75));

        this.inputManager = new InputManager('canvas');
        this.entityManager = new EntityManager(this.webGLRenderer,this.inputManager);
        this.frameCounter = new Counter(0);

        let player = new Player();
        let turret = new Turret().setPosition(new V3(450,100));
        let turret2 = new Turret().setPosition(new V3(850,400)).setBulletType(HomingBullet);

        this.entityManager.addEntities([turret,turret2,player]);

        window.addEventListener('beforeunload',this.webGLRenderer.destroy);
        console.log(this)
    }
    async load(){
        await this.webGLRenderer.load();
        
        const isMobile = window.matchMedia("(pointer: coarse)").matches;
        this.entityManager.init({isMobile: isMobile});
    }
    run(){
        this.frameCounter.count();
        this.entityManager.run();
    }
    draw(){
        this.webGLRenderer.draw();
        this.webGLRenderer.postProcess(this.frameCounter.currValue);
    }
}
