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

console.log('Hello, world!')

let screen = new Renderer('canvas',960,540);

let redState = new State({
    name: 'spawning',
    renderer: screen,
    params: {
        currTime: 0,
        maxTime: 100,
        drawPos: new V3(200,200)
    },
    init(initParams) {
        this.params.currTime = 0;
    },
    exec(execParams){
        this.params.currTime++;
        if(this.params.currTime<=this.params.maxTime) return this.name;
        
        return 'blinker';
    },
    /**
     * @param {Renderer} renderer 
     * @param {*} drawParams 
     */
    draw(drawParams){
        let normTime = this.params.currTime / this.params.maxTime;
        this.renderer.fillCircle(this.params.drawPos,15 * normTime,Color.red);
    }
})

let blueState = new State({
    name: 'blinker',
    renderer: screen,
    params: {
        currTime: 0,
        maxTime: 50,
        drawPos: new V3(200,200)
    },
    init(initParams) {
        this.params.currTime = 0;
    },
    exec(execParams){
        this.params.currTime++;
        if(this.params.currTime<=this.params.maxTime) return this.name;

        return 'drifter';
    },
    /**
     * @param {Renderer} renderer 
     * @param {*} drawParams 
     */
    draw(drawParams){
        let normTime = this.params.currTime/this.params.maxTime;
        let waveRadius = (1+Math.sin(normTime * 5))

        this.renderer.fillCircle(this.params.drawPos,15 * waveRadius,Color.blue);
    }
})

let greenState = new State({
    name: 'drifter',
    renderer: screen,
    params: {
        currTime: 0,
        maxTime: 150,
        drawPos: new V3(200,200)
    },
    init(initParams) {
        this.params.currTime = 0;
    },
    exec(execParams){
        this.params.currTime++;
        if(this.params.currTime<=this.params.maxTime) return this.name;

        return 'grower';
    },
    /**
     * @param {Renderer} renderer 
     * @param {*} drawParams 
     */
    draw(drawParams){
        let normTime = this.params.currTime/this.params.maxTime;
        let circlingPosition = V3.normToTrig(normTime)
        .add(new V3(
            0,
            -1
        ))
        .scale(100)
        .add(this.params.drawPos)
        ;
        this.renderer.fill();
        this.renderer.fillCircle(circlingPosition,15,Color.green);
    }
})

let machine1 = new StateMachine([redState,blueState,greenState]);
machine1.init();