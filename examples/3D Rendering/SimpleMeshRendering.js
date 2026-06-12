import WebGLRenderer from "/libs/WebGLRenderer.js";
import InputManager from "/libs/InputManager.js";
import Counter from "/libs/Counter.js";
import V3 from "/libs/V3.js";
import Mesh from "/libs/Mesh.js";
import BlenderObjectProcessor from "../../libs/BlenderObjectProcessor.js";
import Color from "../../libs/Color.js";

export default class SimpleMeshRendering {
    /** @type {WebGLRenderer} */
    webGLRenderer;

    moveScale = 5;
    moveKeys = ['w','a','s','d','q','e']
    rotateKeys = ['t','f','g','h','r','y']
    moveMap = {
        'w': V3.UP,
        's': V3.DOWN,
        'd': V3.RIGHT,
        'a': V3.LEFT,
        'e': V3.BACK,
        'q': V3.FRONT
    }
    rotateMap = {
        'g': [1,'X'],
        't': [-1,'X'],
        'h': [1,'Y'],
        'f': [-1,'Y'],
        'y': [1,'Z'],
        'r': [-1,'Z']
    }
    constructor(){
        console.log('Hello, SimpleMeshRendering!');

        this.webGLRenderer = new WebGLRenderer('canvas',new V3(1920,1080,100).scale(0.75));

        this.inputManager = new InputManager('canvas');
        this.frameCounter = new Counter(0);

        this.camera = V3.zero;
        this.camera.z = -1000;
        
        
        this.bop = new BlenderObjectProcessor(this.webGLRenderer);
        
        //this.mesh = Mesh.genSphere(this.webGLRenderer,new V3(310,110,150),150,null,12);
        //this.mesh.textureName = 'mimir'
        
        window.addEventListener('beforeunload',this.webGLRenderer.destroy);
    }
    async load(){
        await this.webGLRenderer.load();
        this.mesh = await this.bop.translateObjFileToMesh('/data/objs/bee');

        if(this.mesh===null) {
            console.log(`Failed to load object.`);
            return;
        }
        this.mesh.move(new V3(0,0,100));
        this.mesh.scale(V3.one.scale(100));
    }
    run(){
        this.frameCounter.count();
        
        let moveInput = this.moveKeys.map((key)=>{
            if(this.inputManager.keyboard[key]) return this.moveMap[key];
            else return V3.zero;
        }).reduce((prev,curr)=>{
            return prev.add(curr);
        }).scale(this.moveScale);

        this.mesh.move(moveInput);
        this.rotateKeys.forEach((key)=>{
            if(this.inputManager.keyboard[key]) this.mesh.rot(...this.rotateMap[key]);
        })
    }
    draw(){

        this.mesh?.draw(this.camera);
        //this.mesh.drawPoints(this.camera);
        this.webGLRenderer.draw();
    }
}
