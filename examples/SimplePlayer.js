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
export default class Player {
    color = Color.red;
    radius = 15;
    position = new V3(120,120);
    direction = new V3(0,1);
    inputLocked = true;
    currState;
    stateMachine;
    constructor(renderer, inputManager) {
        let params = {
            player: this,
            renderer: renderer,
            inputManager: inputManager
        };
        let spawning = new State({
            name: 'spawning',
            params: params,
            init(initParams) {
                if(initParams) this.params = {
                    ...initParams,
                    ...this.params
                };
                this.params.currTime = 0;
                this.params.maxTime = 100;
                this.params.radius = 15;
            },
            exec(execParams){
                this.params.currTime++;
                if(this.params.currTime<=this.params.maxTime) return this.name;
                return 'idle';
            },
            draw(drawParams){
                let normTime = this.params.currTime / this.params.maxTime;
                
                /** @type {Player} */
                let player = this.params.player;
                let spawningColor = Color.fromVec(player.color.toVec(),0.5);

                this.params.renderer.fillCircle(player.position,player.radius * normTime,spawningColor);
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
                this.params.maxTime = 500;
                this.params.debounceTimer = 0;
            },
            exec(execParams){
                this.params.currTime++;
                this.params.debounceTimer++;

                /** @type {InputManager} */
                let IM = this.params.inputManager;
                /** @type {Player} */
                let player = this.params.player;
                
                player.handleInput(IM);

                if(IM.keyboard['f']) {
                    player.inputLocked = true;
                    return 'frozen';
                }

                return this.name;
            },
            /**
             * @param {Renderer} renderer 
             * @param {*} drawParams 
             */
            draw(drawParams){
                let normTime = this.params.currTime/this.params.maxTime;
                let waveRadius = (1+0.25 * Math.sin(normTime * 15))
                
                /** @type {Player} */
                let player = this.params.player;

                this.params.renderer.fillCircle(player.position,player.radius * waveRadius,player.color);
            },
            exit(exitParams) {
                return this.params;
            }
        });
        let frozen = new State({
            name: 'frozen',
            init(initParams) {
                this.params = initParams;
                this.params.currTime = 0;
                this.params.maxTime = 300;
            },
            exec(execParams){
                /** @type {InputManager} */
                let IM = this.params.inputManager;
                /** @type {Player} */
                let player = this.params.player;
                
                this.params.currTime++;
                if(this.params.currTime <= this.params.maxTime) return this.name;

                player.inputLocked = false;
                return 'idle';
            },
            /**
             * @param {Renderer} renderer 
             * @param {*} drawParams 
             */
            draw(drawParams){
                let normTime = this.params.currTime/this.params.maxTime;

                /** @type {Player} */
                let player = this.params.player;

                let freezingColor = Color.fromVec(
                    new V3(0,1,1)
                    .lerp(
                        player.color.toVec(),
                        normTime
                    )
                );

                let shiverSpeed = (1-normTime)**2;
                let shiverOffset = new V3(Math.sin(shiverSpeed * 200),0)
                    .scale(3);

                this.params.renderer.fillCircle(player.position.add(shiverOffset),player.radius,freezingColor);
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

                /** @type {Player} */
                let player = this.params.player;
                let dyingColor = Color.fromVec(player.color.toVec(),0.5);

                this.params.renderer.fillCircle(player.position,player.radius * waveRadius,dyingColor);
            },
            exit(exitParams) {
                return this.params;
            }
        });
        this.stateMachine = new StateMachine([spawning,idle,frozen,dying]);
        this.currState = spawning;
        return this;
    }
    /**
     * 
     * @param {InputManager} inputManager 
     */
    handleInput(inputManager) {
        let kb = inputManager.keyboard;
        let targetDirection = new V3(0,0);
        ['w','a','s','d'].forEach(key=>{
            if(inputManager.keyboard[key]) targetDirection = targetDirection.add(this.mapInputToDir(key));
        })
        targetDirection = targetDirection.normalized();

        if(this.direction.equals(targetDirection)) this.move();
        else this.direction = targetDirection;
    }
    mapInputToDir(input) {
        switch(input) {
            case 'w': return new V3(0,-1);
            case 'a': return new V3(-1,0);
            case 's': return new V3(0,1);
            case 'd': return new V3(1,0);
        }
        return new V3(0,0);
    }
    move() {
        //console.log(this.direction,this.position.add(this.direction.scale(5)))
        this.position = this.position.add(this.direction.scale(5));
    }
}