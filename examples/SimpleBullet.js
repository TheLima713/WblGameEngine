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
    velocity = 3;
    radius = 5;
    color = Color.yellow;

    targetType = Player;

    lifeTimer = new Counter(275);
    dyingTimer = new Counter(25);
    trailTimer = new Counter(3);

    trailPositions = [];
    trailLengthMax = 15;

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
                bullet.trailTimer.count();

                if(bullet.trailTimer.over()) {
                    bullet.trailPositions.push(bullet.position);
                    if(bullet.trailPositions.length>bullet.trailLengthMax) bullet.trailPositions.shift();
                    bullet.trailTimer.reset();
                }
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

                //Trail
                let trailColor = Color.fromVec(bullet.color.toVec().scale(0.5));
                let prevTrailPos = bullet.trailPositions[0]
                for(let i=0;i<bullet.trailPositions.length-1;i++) {
                    let nextTrailPos = bullet.trailPositions[i+1];
                    let trailWidth = bullet.radius * i / bullet.trailPositions.length;
                    bullet.renderer.fillLine(prevTrailPos,nextTrailPos,trailColor,trailWidth);
                    prevTrailPos = nextTrailPos;
                }
                        
                //Bullet
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
                let spreadDistance = 20;
                for(let i=0;i<shardCount;i++) {
                    let shardDirection = V3.normToTrig(i/shardCount);
                    let shardOffset = spreadDistance * bullet.dyingTimer.progress();
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
            
            target.hit();
            targetsHit.push(target);
        })
        return targetsHit;
    }
    move() {
        this.position = this.position.add(this.direction.scale(this.velocity));
    }
    setTargetType(type) {
        this.targetType = type;
    }
}
