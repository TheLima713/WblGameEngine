import V3 from "../libs/V3.js";
import Color from "../libs/Color.js";
import StateMachine, { State } from "../libs/StateMachine.js";
import Renderer from "../libs/Renderer.js";
import InputManager from "../libs/InputManager.js";
import EntityManager from "../libs/EntityManager.js";
import Counter from "../libs/Counter.js";
import Bullet from "./SimpleBullet.js";
import Turret from "./SimpleTurret.js";
import WebGLRenderer from "../libs/WebGLRenderer.js";

/**
 * @param {Renderer} renderer 
 * @param {InputManager} inputManager 
 * @returns 
 */
export default class Player {
    color = new Color(0.7,0.3,0.2);
    drawTextureName = 'gamer';
    radius = 50;
    
    /**@type {MobilePlayerUI} */
    mobileUI;
    spawnPoint = new V3(150,420);
    position = this.spawnPoint;
    direction = new V3(0,1);
    speed = V3.one.scale(10);
    
    inputLocked = true;
    
    waveTimer = new Counter(500);
    spawnTimer = new Counter(50);
    frozenTimer = new Counter(100);
    shootTimer = new Counter(50);
    dyingTimer = new Counter(50);

    /**@type {StateMachine} */
    stateMachine;

    //These are filled by the EntityManager:
    /**@type {WebGLRenderer} */
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
                
                if(initParams.isMobile) player.mobileUI = new MobilePlayerUI(player.renderer,player.inputManager);
            },
            exec(execParams){
                /** @type {Player} */
                let player = this.params.player;
                player.drawTextureName = 'gamer';
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
                player.drawTextureName = 'gamer';
                
                player.shootTimer.count();
                player.waveTimer.count();

                // PC Input handling

                /** @type {InputManager} */
                let IM = player.inputManager;
                        
                if(IM.keyboard['r']) {
                    player.position = this.spawnPoint;
                    return 'spawning';
                }

                player.handleMovement();

                let shouldShoot = (
                    IM.mouse.leftClick
                    || player.mobileUI?.getShootInput()
                ) && player.shootTimer.over()
                ;
                if(shouldShoot) {
                    player.shootBullet();
                    player.shootTimer.reset(-15);
                }
                if(player.shootTimer.progress()<0) {
                    let off = 0.003 * Math.sin(player.shootTimer.progress() * 30);
                    player.renderer.requestPostProcessing(
                        'displace',
                        {
                            offset: new V3(off,0,0)
                        }
                    )
                }

                return this.name;
            },
            draw(drawParams){
                /** @type {Player} */
                let player = this.params.player;

                let normTime = player.waveTimer.progress();
                let waveRadius = (1+0.05 * Math.sin(normTime * 15))
                
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
                player.drawTextureName = 'hurt';
                
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

        if(this.mobileUI) {
            let moveInput = this.mobileUI?.getMoveInput();
            if(moveInput.moved) {
                moveDirection = moveInput.direction;
                this.direction = moveDirection;
            }
            let aimInput = this.mobileUI?.getAimInput();
            if(aimInput.aimed) {
                this.direction = aimInput.direction;
            }
        }
        //console.log(moveInput.moved,aimInput.aimed,moveInput.direction,aimInput.direction)

        this.position = this.position.add(moveDirection.mult(this.speed));
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
        return this;
    }
    hit() {
        this.stateMachine.swap('frozen');
    }
    draw(size = this.radius, color = this.color, offset = new V3(0,0)) {

        //Tip

        let tipPosition = this.position.add(this.direction.scale(size));
        let tipRadius = size * 0.5;
        let tipColor = Color.fromVec(color.toVec().scale(0.8));

        this.renderer.fillCircle(tipPosition.add(offset),tipRadius,Color.white.scale(0.5));

        //Ring
        
        this.renderer.fillCircle(this.position.add(offset),size * 1.1,color);

        let facingLeft = this.direction.x < 0;
        let textureDirection = facingLeft ? this.direction.scale(size).rot(-90,'Z') : this.direction.scale(size).rot(90,'Z');

        // Body

        this.renderer.fillAimedCircle(
            this.position.add(offset),
            textureDirection,
            color,
            this.drawTextureName
        );

        if(this.mobileUI) this.mobileUI.draw();
    }
    shootBullet() {
        let newBullet = new Bullet(this.position, this.direction);
        
        newBullet.owner = this;
        newBullet.setTargetType(Turret);
        newBullet.stateMachine.init();

        this.entityManager.addEntities([newBullet],true);
    }
}

class MobilePlayerUI {
    /**@type {Renderer} */
    renderer;
    /**@type {InputManager} */
    inputManager;

    offColor = Color.white.scale(0.1);
    onColor = Color.white.scale(0.4);

    joystickCenter = new V3(200,600);
    joystickRadius = 125;

    joystickAimRadius = 75;

    joystickPosition = new V3(200,600);
    joystickButtonRadius = 25;
    
    shootButtonPosition = new V3(1200,600);
    shootButtonRadius = 50;

    holdingInput = false;

    constructor(renderer,inputManager) {
        this.renderer = renderer;
        this.inputManager = inputManager;
    }
    getMoveInput() {
        const touch = this.inputManager.touch;
        this.joystickPosition = this.joystickCenter;
        if(!touch.touching) {
            this.holdingInput = false;
            return {
                moved: false,
                direction: V3.zero
            };
        }

        var direction = touch.position.sub(this.joystickCenter);

        if(direction.mag()>this.joystickRadius && this.holdingInput===false) {
            //outside input
            return {
                moved: false,
                direction: V3.zero
            };
        }
        else this.holdingInput = true;

        if(direction.mag()<this.joystickAimRadius) {
            //only aiming, not moving
            return {
                moved: false,
                direction: V3.zero
            };
        }

        var maxJoystickDistance = Math.min(this.joystickRadius, direction.mag());

        this.joystickPosition = this.joystickCenter.add(direction.normalized().scale(maxJoystickDistance));
        
        return {
            moved: true,
            direction: direction.normalized()
        };
    }
    getAimInput() {
        const touch = this.inputManager.touch;
        if(!touch.touching) {
            this.holdingInput = false;
            this.joystickPosition = this.joystickCenter;
            return {
                aimed: false,
                direction: V3.zero
            };
        }

        var direction = touch.position.sub(this.joystickCenter);

        if(direction.mag()>this.joystickRadius && this.holdingInput===false) {
            //outside input
            return {
                moved: false,
                direction: V3.zero
            };
        }
        else this.holdingInput = true;

        var maxJoystickDistance = Math.min(this.joystickRadius, direction.mag());

        this.joystickPosition = this.joystickCenter.add(direction.normalized().scale(maxJoystickDistance));
        
        return {
            aimed: true,
            direction: direction.normalized()
        };
    }
    getShootInput() {
        const touch = this.inputManager.touch;
        if(!touch.touching) return false;

        var distance = touch.position.sub(this.shootButtonPosition).mag();
        let withinButton = distance < this.shootButtonRadius;
        
        return withinButton;
    }
    draw() {
        this.renderer.fillCircle(
            this.joystickCenter,
            this.joystickRadius,
            this.offColor
        );
        this.renderer.fillCircle(
            this.joystickPosition,
            this.joystickButtonRadius,
            this.onColor
        );
        this.renderer.fillCircle(
            this.shootButtonPosition,
            this.shootButtonRadius,
            this.onColor
        );
    }
}