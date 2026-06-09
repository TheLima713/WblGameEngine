/*
resources i need to gamedev:
libs/manager objs:
- &audio
- >Scene
*/

import V3 from "./libs/V3.js";
import WebGLRenderer from "./libs/WebGLRenderer.js";
import InputManager from "./libs/InputManager.js";
import Mesh, { TrailObject } from "./libs/Mesh.js";
import Color from "./libs/Color.js";
import Util from "./libs/Util.js";
import Counter from "./libs/Counter.js";

console.log('Hello, world!');

let screenSize = new V3(1920,1080).scale(0.75);
let webGLRenderer = new WebGLRenderer('canvas',screenSize);
await webGLRenderer.load();
let inputManager = new InputManager('canvas');
var frameCounter = new Counter(0);

var camera = V3.zero;
camera.z = -1000;

let mesh = Mesh.genSphere(webGLRenderer,new V3(310,110,200),150);
mesh.textureName = 'mimir'


let trailObj3 = new TrailObject(webGLRenderer);

trailObj3.genMesh(
    new V3(125,120,110),
    300,
    16,
    (x)=>{
        return Math.abs(
            22 * (
            (Math.sin(4*x))
            + (Math.sin(4*x))
            )
        )
    },// radiusFn
    () => { return 0.2 },// followStrFn
    (head) => {
        let waveScale = 1
        return head.front.add(head.up.scl(waveScale)).scl(1/waveScale)
    }//getNextDirFn
)
trailObj3.remeshFromLayers();
trailObj3.fullMesh.textureName = 'fih'

setInterval(()=>{
    frameCounter.count();

    if(inputManager.keyboard['w']) camera = camera.add(new V3(0,-1,0));
    if(inputManager.keyboard['s']) camera = camera.add(new V3(0,1,0));
    if(inputManager.keyboard['d']) camera = camera.add(new V3(-1,0,0));
    if(inputManager.keyboard['a']) camera = camera.add(new V3(1,0,0));
    if(inputManager.keyboard['e']) camera = camera.add(new V3(0,0,-1));
    if(inputManager.keyboard['q']) camera = camera.add(new V3(0,0,1));
    
    if(inputManager.keyboard['g']) mesh.rot(1, 'X');
    if(inputManager.keyboard['t']) mesh.rot(-1, 'X');
    if(inputManager.keyboard['h']) mesh.rot(1, 'Y');
    if(inputManager.keyboard['f']) mesh.rot(-1, 'Y');
    if(inputManager.keyboard['y']) mesh.rot(1, 'Z');
    if(inputManager.keyboard['r']) mesh.rot(-1, 'Z');

    mesh.rot(-1, 'Y');
    trailObj3.run(1000/60);

    webGLRenderer.fill();
    mesh.draw(camera);
    trailObj3.draw(camera);
    webGLRenderer.draw();
},1000/60);

window.addEventListener('beforeunload',webGLRenderer.destroy);

// Persio Quests:
// - Shader pra recortar um layer da mesh 3d e mostrar o 'interior'
// - Tesselation
// - Shader node editor
// - Peixes movendo distorcendo por Perlin
// - Sombra dinamica com normal map
// - Reflexo dagua