/*
resources i need to gamedev:
libs/manager objs:
- &audio
- >Scene
*/

import V3 from "./libs/V3.js";
import WebGLRenderer from "./libs/WebGLRenderer.js";
import InputManager from "./libs/InputManager.js";
import Mesh, { Quad, TrailObject } from "./libs/Mesh.js";
import Color from "./libs/Color.js";
import Util from "./libs/Util.js";
import Counter from "./libs/Counter.js";

console.log('Hello, world!');

let screenSize = new V3(1920,1080,1000).scale(0.75);
let webGLRenderer = new WebGLRenderer('canvas',screenSize);
await webGLRenderer.load();
let inputManager = new InputManager('canvas');
var frameCounter = new Counter(0);

var camera = V3.zero;
camera.z = -1000;

let mesh = Mesh.genSphere(webGLRenderer,new V3(310,110,150),150,null,32);
mesh.textureName = 'mimir'


//let trailObj3 = new TrailObject(webGLRenderer);

//trailObj3.genMesh(
//    new V3(125,120,110),
//    300,
//    16,
//    (x)=>{
//        return Math.abs(
//            22 * (
//            (Math.sin(4*x))
//            + (Math.sin(4*x))
//            )
//        )
//    },// radiusFn
//    () => { return 0.2 },// followStrFn
//    (head) => {
//        let waveScale = 1
//        return head.front.add(head.up.scl(waveScale)).scl(1/waveScale)
//    }//getNextDirFn
//)
//trailObj3.remeshFromLayers();
//trailObj3.fullMesh.textureName = 'fih'

console.log(new Quad(
    [
        new V3(0,0),
        new V3(0,1),
        new V3(1,0),
        new V3(1,1)
    ],
    {
        color: Color.red
    }
).getNormals())

let ms = 0;

setInterval(()=>{
    let temptime = Date.now();

    frameCounter.count();

    if(inputManager.keyboard['w']) camera = camera.add(V3.UP);
    if(inputManager.keyboard['s']) camera = camera.add(V3.DOWN);
    if(inputManager.keyboard['d']) camera = camera.add(V3.RIGHT);
    if(inputManager.keyboard['a']) camera = camera.add(V3.LEFT);
    if(inputManager.keyboard['e']) camera = camera.add(V3.BACK);
    if(inputManager.keyboard['q']) camera = camera.add(V3.FRONT);
    
    if(inputManager.keyboard['g']) mesh.rot(1, 'X');
    if(inputManager.keyboard['t']) mesh.rot(-1, 'X');
    if(inputManager.keyboard['h']) mesh.rot(1, 'Y');
    if(inputManager.keyboard['f']) mesh.rot(-1, 'Y');
    if(inputManager.keyboard['y']) mesh.rot(1, 'Z');
    if(inputManager.keyboard['r']) mesh.rot(-1, 'Z');

    mesh.rot(0.1, 'Y');

    webGLRenderer.fill();
    mesh.draw(camera);
    webGLRenderer.draw();

    ms += Date.now() - temptime;
    //console.log(ms/frameCounter.currValue)
},1000/60);

window.addEventListener('beforeunload',webGLRenderer.destroy);

// Persio Quests:
// - Shader pra recortar um layer da mesh 3d e mostrar o 'interior'
// - Tesselation
// - Shader node editor
// - Peixes movendo distorcendo por Perlin
// - Sombra dinamica com normal map
// - Reflexo dagua