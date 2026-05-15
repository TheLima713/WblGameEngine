import Renderer from "../libs/Renderer.js";
import StateMachine, { State } from "../libs/StateMachine.js";
import V3 from "../libs/V3.js";
import Color from "../libs/Color.js";

/**
 * @param {Renderer} screen 
 * @returns 
 */
export default function generateDropletSM(screen) {
        
    let spawning = new State({
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
            
            return 'idle';
        },
        /**
         * @param {Renderer} renderer 
         * @param {*} drawParams 
         */
        draw(drawParams){
            let normTime = this.params.currTime / this.params.maxTime;
            this.renderer.fill();
            this.renderer.fillCircle(this.params.drawPos,15 * normTime,Color.red);
        }
    });
    let idle = new State({
        name: 'idle',
        renderer: screen,
        params: {
            currTime: 0,
            maxTime: 500,
            drawPos: new V3(200,200)
        },
        init(initParams) {
            this.params.currTime = 0;
        },
        exec(execParams){
            this.params.currTime++;
            if(this.params.currTime<=this.params.maxTime) return this.name;

            return 'dying';
        },
        /**
         * @param {Renderer} renderer 
         * @param {*} drawParams 
         */
        draw(drawParams){
            let normTime = this.params.currTime/this.params.maxTime;
            let waveRadius = (1+0.25 * Math.sin(normTime * 25))

            this.renderer.fill();
            this.renderer.fillCircle(this.params.drawPos,15 * waveRadius,Color.green);
        }
    });
    let dying = new State({
        name: 'dying',
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

            return '';
        },
        /**
         * @param {Renderer} renderer 
         * @param {*} drawParams 
         */
        draw(drawParams){
            let normTime = this.params.currTime/this.params.maxTime;
            let waveRadius = (1+Math.sin(normTime * 5))

            this.renderer.fill();
            this.renderer.fillCircle(this.params.drawPos,15 * waveRadius,Color.blue);
        }
    });

    return new StateMachine([spawning,idle,dying]);
}