import Color from "../libs/Color.js";
import StateMachine, { State } from "../libs/StateMachine.js";
import Renderer from "../libs/Renderer.js";
import InputManager from "../libs/InputManager.js";
import EntityManager from "../libs/EntityManager.js";
import Counter from "../libs/Counter.js";
import V3 from "../libs/V3.js";
import Player from "./SimplePlayer.js";

export default class Bullet {
    position = new V3(0,0);
    direction = new V3(0,0);
    velocity = 5;
    radius = 4;
    color = Color.yellow;

    targetType = Player;

    lifeTimer = new Counter(75);
    dyingTimer = new Counter(25);

    /**@type {StateMachine} */
    stateMachine;
    //These are filled by the EntityManager:
    /**@type {Renderer} */
    renderer;
    /**@type {InputManager} */
    inputManager;
    /**@type {EntityManager} */
    entityManager;
    constructor(position,direction) {
        this.position = position;
        this.direction = direction;
        
        let params = {
            bullet: this
        };
        let moving = new State({
            name: 'moving',
            params: params,
            init(initParams) {
                if(initParams) this.params = {
                    ...initParams,
                    ...this.params
                };
            },
            exec(execParams){
                /**@type {Bullet} */
                let bullet = this.params.bullet;
                bullet.lifeTimer.count();

                //Move
                bullet.move();
                
                //Collide
                let hitList = bullet.checkCollisions();
                if(hitList.length>0) return 'dying';

                //Fade out
                if(bullet.lifeTimer.over()) return 'dying';

                return 'moving';
            },
            draw(drawParams){
                /** @type {Bullet} */
                let bullet = this.params.bullet;
                bullet.renderer.fillCircle(bullet.position, bullet.radius,bullet.color);
            }
        });
        let dying = new State({
            name: 'dying',
            params: params,
            init(initParams) {
                if(initParams) this.params = {
                    ...initParams,
                    ...this.params
                };
            },
            exec(execParams){
                /**@type {Bullet} */
                let bullet = this.params.bullet;
                bullet.dyingTimer.count();

                if(bullet.dyingTimer.over()) return '';
                return 'dying';
            },
            draw(drawParams){
                /** @type {Bullet} */
                let bullet = this.params.bullet;

                let normTime = bullet.dyingTimer.progress();
                let waveRadius = 1-normTime;

                bullet.renderer.fillCircle(bullet.position, bullet.radius * waveRadius,bullet.color);

                let shardCount = 6;
                for(let i=0;i<shardCount;i++) {
                    let shardDirection = V3.normToTrig(i/shardCount);
                    let shardOffset = 15 * bullet.dyingTimer.progress();
                    let shardPosition = bullet.position.add(shardDirection.scale(shardOffset))
                    bullet.renderer.fillCircle(shardPosition,5 * waveRadius,bullet.color);
                }
            }
        });
        this.stateMachine = new StateMachine([moving,dying]);
    }
    checkCollisions() {
        let targets = this.entityManager.getEntities(this.targetType);
        let targetsHit = []
        targets.forEach((target)=>{
            let diff = target.position.sub(this.position);
            let sizeSum = target.radius + this.radius;
            if(diff.mag() >= sizeSum) return;
            
            target.freeze();
            targetsHit.push(target);
        })
        return targetsHit;
    }
    move() {
        this.position = this.position.add(this.direction.scale(this.velocity));
    }
}