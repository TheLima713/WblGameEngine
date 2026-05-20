import Renderer from "../libs/Renderer.js";
import StateMachine, { State } from "../libs/StateMachine.js";
import V3 from "../libs/V3.js";
import Color from "../libs/Color.js";
import InputManager from "../libs/InputManager.js";
import Util from "../libs/Util.js";
import EntityManager from "../libs/EntityManager.js";
import Player from "./SimplePlayer.js";
import Counter from "../libs/Counter.js";
import Bullet from "./SimpleBullet.js";

/**
 * @param {Renderer} renderer 
 * @param {InputManager} inputManager 
 * @returns 
 */
export default class Turret {
    color = new Color(0.1,0.5,0.9);
    bodySize = 20;
    tipWidth = 15;
    tipHeight = 20;

    position = new V3(120,120);
    direction = V3.normToTrig(Math.random());
    targetDirection = V3.normToTrig(Math.random());

    idleTimer = new Counter(100);
    shootTimer = new Counter(300);
    
    bulletType = Bullet;

    searchRadius = 200;
    /**@type {StateMachine} */
    stateMachine;
    //These are filled by the EntityManager:
    /**@type {Renderer} */
    renderer;
    /**@type {InputManager} */
    inputManager;
    /**@type {EntityManager} */
    entityManager;
    constructor() {
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

                /**@type {Turret} */
                let turret = this.params.turret;
                let rndIdleTime = 100 + Math.floor(50 * Math.random());
                turret.idleTimer = new Counter(rndIdleTime);
                turret.shootTimer.reset();
            },
            exec(execParams){
                /**@type {Turret} */
                let turret = this.params.turret;

                turret.idleTimer.count();

                let foundPlayer = turret.searchForPlayer();
                if(foundPlayer) return 'targetting';

                let newDirection = turret.direction.lerp(turret.targetDirection,0.1).normalized();

                if(newDirection.dot(turret.targetDirection)>0.9) return 'idle';
                else turret.direction = newDirection;

                if(!turret.idleTimer.over()) return this.name;
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

                /**@type {Turret} */
                let turret = this.params.turret;
                turret.shootTimer.reset();
            },
            exec(execParams){
                /**@type {Turret} */
                let turret = this.params.turret;
                
                turret.shootTimer.count();

                let foundPlayer = turret.searchForPlayer();
                if(!foundPlayer) return 'moving';
                
                //Follow player
                let newDirection = foundPlayer.position.sub(turret.position).normalized();
                turret.targetDirection = newDirection;
                turret.direction = turret.direction.lerp(turret.targetDirection,0.1).normalized();

                //Shoot player
                if(turret.shootTimer.over()) {
                    turret.shootBullet();
                    turret.shootTimer.reset();
                }

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
                /** @type {Turret} */
                let turret = this.params.turret;
                turret.shootTimer.reset();
                turret.idleTimer.reset();
            },
            exec(execParams){
                /** @type {Turret} */
                let turret = this.params.turret;
                turret.idleTimer.count();

                let foundPlayer = turret.searchForPlayer();
                if(foundPlayer) return 'targetting';

                if(!turret.idleTimer.over()) return this.name;
                
                turret.targetDirection = V3.normToTrig(Math.random());
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
    }
    setPosition(position) {
        this.position = position;
    }
    drawTurret() {
        //Area
        this.renderer.fillCircle(this.position,this.searchRadius,new Color(0.3,0.3,0.3,0.3));

        //Body
        this.renderer.fillCircle(this.position,this.bodySize,this.color);

        //Tip
        let tipColor = Color.fromVec(this.color.toVec().scale(1.1));
        let tipStart = this.position.add(this.direction.scale(this.bodySize/2));

        let tipEnd = tipStart.add(this.direction.scale(this.tipHeight));

        let shouldRecoil = this.stateMachine.currState.name === 'targetting';
        let tipRecoil = 0.25 - Math.min(this.shootTimer.progress(),0.25);
        if(shouldRecoil) tipEnd = tipEnd.sub(this.direction.scale(tipRecoil * this.tipHeight));
        
        
        this.renderer.fillLine(tipStart,tipEnd, tipColor, this.tipWidth);
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
    followAim(position,strength = 0.1, margin = 0.1) {
        let newDirection = position.sub(turret.position);
        turret.targetDirection = newDirection.normalized();
        turret.direction = turret.direction.lerp(turret.targetDirection,strength).normalized();
    }
    shootBullet() {
        let newBullet = new this.bulletType(this.position, this.direction);
        let player = this.entityManager.getEntities(Player)[0];
        
        if(newBullet.setTarget) newBullet.setTarget(player);
        
        newBullet.owner = this;
        newBullet.stateMachine.init();

        this.entityManager.addEntity(newBullet);
    }
    setBulletType(type) {
        this.bulletType = type;
    }
}
