import Renderer from "../libs/Renderer.js";
import StateMachine, { State } from "../libs/StateMachine.js";
import V3 from "../libs/V3.js";
import Color from "../libs/Color.js";
import InputManager from "../libs/InputManager.js";
import Util from "../libs/Util.js";
import EntityManager from "../libs/EntityManager.js";
import Player from "./SimplePlayer.js";

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
    directionAngle = Util.rndAng();
    targetDirectionAngle = Util.rndAng();
    searchRadius = 100;
    /**@type {StateMachine} */
    stateMachine;
    //These are filled by the EntityManager:
    /**@type {Renderer} */
    renderer;
    /**@type {InputManager} */
    inputManager;
    /**@type {EntityManager} */
    entityManager;
    constructor(renderer, inputManager) {
        let params = {
            turret: this
        };
        let moving = new State({
            name: 'moving',
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

                let foundPlayer = turret.searchForPlayer();
                if(foundPlayer) return 'targetting';

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
                turret.drawTurret();
            },
            exit(exitParams) {
                return this.params;
            }
        });
        
        let targetting = new State({
            name: 'targetting',
            params: params,
            init(initParams) {
                if(initParams) this.params = {
                    ...initParams,
                    ...this.params
                };
                this.params.currTime = 0;
            },
            exec(execParams){
                this.params.currTime++;

                /**@type {Turret} */
                let turret = this.params.turret;

                console.log(this.name);
                let foundPlayer = turret.searchForPlayer();
                if(!foundPlayer) return 'moving';
                
                let direction = foundPlayer.position.sub(turret.position);
                turret.targetDirectionAngle = direction.normalized().toAng();

                let newAngle = Util.lerp(turret.directionAngle, turret.targetDirectionAngle, 0.1);
                
                turret.directionAngle = newAngle;


                return this.name;
            },
            draw(drawParams){
                /** @type {Turret} */
                let turret = this.params.turret;
                turret.drawTurret();
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
                return 'moving';
            },
            draw(drawParams){
                let normTime = this.params.currTime / this.params.maxTime;
                
                /** @type {Turret} */
                let turret = this.params.turret;
                turret.drawTurret();
            },
            exit(exitParams) {
                return this.params;
            }
        });

        this.stateMachine = new StateMachine([moving,targetting,idle]);
        return this;
    }
    setPosition(position) {
        this.position = position;
    }
    drawTurret() {
        /** @type {Turret} */
        let turret = this;

        let turretDirection = V3.angToVec(turret.directionAngle);

        //Area
        this.renderer.fillCircle(this.position,this.searchRadius,new Color(0.2,0.2,0.2,0.2));

        //Body
        this.renderer.fillCircle(this.position,this.bodySize,this.color);

        let tipColor = Color.fromVec(this.color.toVec().scale(1.1));
        let tipStart = turret.position.add(turretDirection.scale(turret.bodySize/2));
        let tipEnd = tipStart.add(turretDirection.scale(turret.tipHeight));
        
        //Tip
        this.renderer.fillLine(tipStart,tipEnd, tipColor, turret.tipWidth);
    }
    searchForPlayer() {
        let players = this.entityManager.getEntities(Player);
        if(players.length<1) return null;

        /**@type {Player} */
        let player = players[0];

        let direction = player.position.sub(this.position);
        if(direction.mag() > this.searchRadius) return null;
        
        return player;
    }
}