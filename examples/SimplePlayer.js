import V3 from "../libs/V3.js";
import Color from "../libs/Color.js";
import StateMachine, { State } from "../libs/StateMachine.js";
import Renderer from "../libs/Renderer.js";
import InputManager from "../libs/InputManager.js";
import EntityManager from "../libs/EntityManager.js";
import Counter from "../libs/Counter.js";
import Bullet from "./SimpleBullet.js";
import Turret from "./SimpleTurret.js";

/**
 * @param {Renderer} renderer 
 * @param {InputManager} inputManager 
 * @returns 
 */
export default class Player {
    color = new Color(0.9,0.2,0.1);
    radius = 15;
    
    spawnPoint = new V3(120,120);
    position = this.spawnPoint;
    direction = new V3(0,1);
    
    inputLocked = true;
    
    waveTimer = new Counter(500);
    spawnTimer = new Counter(50);
    frozenTimer = new Counter(150);
    shootTimer = new Counter(50);
    dyingTimer = new Counter(50);

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
            player: this
        };
        let spawning = new State({
            name: 'spawning',
            params: params,
            init(initParams) {
                if(initParams) this.params = {
                    ...initParams,
                    ...this.params
                };
                /** @type {Player} */
                let player = this.params.player;
                player.spawnTimer.reset();
            },
            exec(execParams){
                /** @type {Player} */
                let player = this.params.player;
                player.spawnTimer.count();
                if(!player.spawnTimer.over()) return this.name;
                return 'idle';
            },
            draw(drawParams){
                /** @type {Player} */
                let player = this.params.player;

                let normTime = player.spawnTimer.progress()
                let spawningColor = Color.fromVec(player.color.toVec().scale(0.5));

                player.draw(player.radius * normTime,spawningColor);
            }
        });
        let idle = new State({
            name: 'idle',
            init(initParams) {
                this.params = initParams;

                /** @type {Player} */
                let player = this.params.player;
                player.shootTimer.reset();
                player.waveTimer.reset();
            },
            exec(execParams){
                /** @type {Player} */
                let player = this.params.player;
                
                player.shootTimer.count();
                player.waveTimer.count();

                /** @type {InputManager} */
                let IM = player.inputManager;
                        
                if(IM.keyboard['r']) {
                    player.position = this.spawnPoint;
                    return 'spawning';
                }

                player.handleMovement();

                if(IM.mouse.leftClick && player.shootTimer.over()) {
                    player.shootBullet();
                    player.shootTimer.reset();
                }

                return this.name;
            },
            draw(drawParams){
                /** @type {Player} */
                let player = this.params.player;

                let normTime = player.waveTimer.progress();
                let waveRadius = (1+0.25 * Math.sin(normTime * 15))
                
                player.draw(player.radius * waveRadius,player.color);
            }
        });
        let frozen = new State({
            name: 'frozen',
            init(initParams) {
                this.params = initParams;
                
                /** @type {Player} */
                let player = this.params.player;
                player.frozenTimer.reset();
            },
            exec(execParams){
                /** @type {Player} */
                let player = this.params.player;
                
                player.frozenTimer.count();
                if(!player.frozenTimer.over()) return this.name;

                player.inputLocked = false;
                return 'idle';
            },
            draw(drawParams){
                /** @type {Player} */
                let player = this.params.player;
                let normTime = player.frozenTimer.progress();

                let shiverSpeed = (1-normTime)**2;
                let shiverOffset = new V3(Math.sin(shiverSpeed * 200),0)
                    .scale(3);

                let freezingColor = Color.fromVec(
                    new V3(0,1,1)
                    .lerp(
                        player.color.toVec(),
                        1-shiverSpeed
                    )
                );

                player.draw(player.radius,freezingColor,shiverOffset);
            }
        });
        let dying = new State({
            name: 'dying',
            init(initParams) {
                this.params = initParams;
                /** @type {Player} */
                let player = this.params.player;
                player.dyingTimer.reset();
            },
            exec(execParams){
                /** @type {Player} */
                let player = this.params.player;
                player.dyingTimer.count();
                if(!player.dyingTimer.over()) return this.name;
                
                return '';
            },
            draw(drawParams){
                /** @type {Player} */
                let player = this.params.player;
                let normTime = player.dyingTimer.progress();
                let waveRadius = (1+Math.sin(normTime * 5))

                let dyingColor = Color.fromVec(player.color.toVec(),0.5);

                player.draw(player.radius * waveRadius,dyingColor);
            },
            exit(exitParams) {
                return this.params;
            }
        });
        this.stateMachine = new StateMachine([spawning,idle,frozen,dying]);
    }
    handleMovement() {
        //Aiming
        let mousePosition = this.inputManager.mouse.position;
        let screenPosition = this.renderer.getScreenPosition(this.position);
        let newDirection = mousePosition.sub(screenPosition).normalized();
        this.direction = newDirection;

        //Moving
        let moveDirection = new V3(0,0);
        ['w','a','s','d'].forEach(key=>{
            if(this.inputManager.keyboard[key]) moveDirection = moveDirection.add(this.mapInputToDir(key));
        })
        moveDirection = moveDirection.normalized();
        this.position = this.position.add(moveDirection.scale(5));
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
    setPosition(position) {
        this.position = position;
    }
    hit() {
        this.stateMachine.swap('frozen');
    }
    draw(size = this.radius, color = this.color, offset = new V3(0,0)) {
        //Tip
        let tipPosition = this.position.add(this.direction.scale(size));
        let tipRadius = size * 0.5;
        let tipColor = Color.fromVec(color.toVec().scale(0.8));
        this.renderer.fillCircle(tipPosition.add(offset),tipRadius,tipColor);

        //Body
        this.renderer.fillCircle(this.position.add(offset),size,color);
    }
    shootBullet() {
        let newBullet = new Bullet(this.position, this.direction);
        
        newBullet.owner = this;
        newBullet.setTargetType(Turret);
        newBullet.stateMachine.init();

        this.entityManager.addEntity(newBullet);
    }
}