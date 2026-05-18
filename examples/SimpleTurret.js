import Renderer from "../libs/Renderer.js";
import StateMachine, { State } from "../libs/StateMachine.js";
import V3 from "../libs/V3.js";
import Color from "../libs/Color.js";
import InputManager from "../libs/InputManager.js";
import Util from "../libs/Util.js";

/**
 * @param {Renderer} renderer 
 * @param {InputManager} inputManager 
 * @returns 
 */
export default class Turret {
    color = Color.gray;
    bodySize = 20;
    tipWidth = 15;
    tipHeight = 20;
    position = new V3(120,120);
    directionAngle = Math.random() * 6.283;
    targetDirectionAngle = Math.random() * 6.283;
    currState;
    stateMachine;
    constructor(renderer, inputManager) {
        let params = {
            turret: this,
            renderer: renderer,
            inputManager: inputManager
        };
        let searching = new State({
            name: 'searching',
            params: params,
            init(initParams) {
                if(initParams) this.params = {
                    ...initParams,
                    ...this.params
                };
                this.params.currTime = 0;
                this.params.maxTime = 100 + Math.floor(50 * Math.random());
            },
            exec(execParams){
                this.params.currTime++;

                /**@type {Turret} */
                let turret = this.params.turret;

                let newAngle = Util.lerp(turret.directionAngle, turret.targetDirectionAngle, 0.1);
                
                if(Math.abs(turret.directionAngle - newAngle) < 0.05) return 'idle';
                else turret.directionAngle = newAngle;


                if(this.params.currTime<=this.params.maxTime) return this.name;
                return 'idle';
            },
            draw(drawParams){
                let normTime = this.params.currTime / this.params.maxTime;
                
                /** @type {Turret} */
                let turret = this.params.turret;
                turret.drawTurret(renderer);
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
                this.params.maxTime = 100;
            },
            exec(execParams){
                this.params.currTime++;

                if(this.params.currTime<=this.params.maxTime) return this.name;

                /** @type {Turret} */
                let turret = this.params.turret;
                
                turret.targetDirectionAngle = Math.random() * 6.283;
                return 'searching';
            },
            /**
             * @param {Renderer} renderer 
             * @param {*} drawParams 
             */
            draw(drawParams){
                let normTime = this.params.currTime / this.params.maxTime;
                
                /** @type {Turret} */
                let turret = this.params.turret;
                turret.drawTurret(renderer);
            },
            exit(exitParams) {
                return this.params;
            }
        });

        this.stateMachine = new StateMachine([searching,idle]);
        this.currState = searching;
        return this;
    }
    setPosition(pos) {
        this.position = pos;
    }
    drawTurret(renderer) {
        /** @type {Turret} */
        let turret = this;
        let tipColor = Color.fromVec(this.color.toVec().scale(1.1));

        let turretDirection = V3.angToVec(turret.directionAngle);

        renderer.fillCircle(this.position,this.bodySize,this.color);

        let tipStart = turret.position.add(turretDirection.scale(turret.bodySize/2));
        let tipEnd = tipStart.add(turretDirection.scale(turret.tipHeight));
        
        renderer.fillLine(tipStart,tipEnd, tipColor, turret.tipWidth);
        
        //let tipStart2 = turret.position.add(turret.targetDirection.scale(turret.bodySize/2));
        //let tipEnd2 = tipStart.add(turret.targetDirection.scale(turret.tipHeight * 2));
        //renderer.fillLine(tipStart2,tipEnd2, Color.white, turret.tipWidth / 2);
    }
}