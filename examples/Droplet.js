import Renderer from "../libs/Renderer.js";
import StateMachine, { State } from "../libs/StateMachine.js";
import V3 from "../libs/V3.js";
import Color from "../libs/Color.js";
import InputManager from "../libs/InputManager.js";

/**
 * @param {Renderer} renderer 
 * @param {InputManager} inputManager 
 * @returns 
 */
export default function generateDropletSM(params) {
    let spawning = new State({
        name: 'spawning',
        params: params,
        init(initParams) {
            if(initParams) this.params = initParams;
            this.params.currTime = 0;
            this.params.maxTime = 100;
            this.params.radius = 15;
            this.params.debounceTimer = 0;
            this.params.debounceTimerMax = 50;
        },
        exec(execParams){
            this.params.currTime++;

            this.params.drawPos = this.params.inputManager.mouse.position.copy();

            if(this.params.currTime<=this.params.maxTime) return this.name;
            
            return 'idle';
        },
        /**
         * @param {*} drawParams 
         */
        draw(drawParams){
            let normTime = this.params.currTime / this.params.maxTime;
            
            this.params.renderer.fillCircle(this.params.drawPos,this.params.radius * normTime,Color.red);
        },
        exit(exitParams) {
            return this.params;
        }
    });
    let idle = new State({
        name: 'idle',
        init(initParams) {
            this.params = initParams;
            this.params.currTime = 0;
            this.params.debounceTimer = 0;
        },
        exec(execParams){
            /** @type {InputManager} */
            let IM = this.params.inputManager;
            
            this.params.currTime++;
            this.params.debounceTimer++;

            let dist = this.params.drawPos
                .sub(IM.mouse.position)
                .mag()
            ;
            
            let shouldFollow = IM.mouse.leftClick
                && dist < 50
                && this.params.debounceTimer > this.params.debounceTimerMax
            ;
            let shouldDie = IM.mouse.rightClick
                && dist < 50
                && this.params.debounceTimer > this.params.debounceTimerMax
            ;
            if(shouldFollow) return 'following';
            if(shouldDie) return 'dying';

            return this.name;
        },
        /**
         * @param {Renderer} renderer 
         * @param {*} drawParams 
         */
        draw(drawParams){
            let normTime = this.params.currTime/this.params.maxTime;
            let waveRadius = (1+0.25 * Math.sin(normTime * 15))

            this.params.renderer.fillCircle(this.params.drawPos,this.params.radius * waveRadius,Color.green);
        },
        exit(exitParams) {
            return this.params;
        }
    });
    let following = new State({
        name: 'following',
        init(initParams) {
            this.params = initParams;
            this.params.currTime = 0;
            this.params.debounceTimer = 0;
        },
        exec(execParams){
            /** @type {InputManager} */
            let IM = this.params.inputManager;
            
            this.params.debounceTimer++;
            
            //follow mouse
            this.params.drawPos = this.params.drawPos.lerp(IM.mouse.position,0.1);
            
            let dist = this.params.drawPos
                .sub(IM.mouse.position)
                .mag()
            ;
            let shouldIdle = IM.mouse.leftClick
                && dist < 50
                && this.params.debounceTimer > this.params.debounceTimerMax
            ;
            if(shouldIdle) return 'idle';

            return this.name;
        },
        /**
         * @param {Renderer} renderer 
         * @param {*} drawParams 
         */
        draw(drawParams){
            let normTime = this.params.currTime/this.params.maxTime;
            let waveRadius = (1+0.25 * Math.sin(normTime * 25))

            this.params.renderer.fillCircle(this.params.drawPos,this.params.radius,Color.yellow);
        },
        exit(exitParams) {
            return this.params;
        }
    });
    let dying = new State({
        name: 'dying',
        init(initParams) {
            this.params = initParams;
            this.params.currTime = 0;
            this.params.debounceTimer = 0;
            this.params.maxTime = 50;
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

            this.params.renderer.fillCircle(this.params.drawPos,this.params.radius * waveRadius,Color.blue);
        },
        exit(exitParams) {
            return this.params;
        }
    });

    return new StateMachine([spawning,idle,following,dying]);
}