export default class EntityManager {
    entities;
    renderer;
    inputManager;
    constructor(renderer,inputManager) {
        this.entities = [];
        this.renderer = renderer;
        this.inputManager = inputManager;
    }
    addEntity(entity) {
        entity.renderer = this.renderer;
        entity.inputManager = this.inputManager;
        this.entities.push(entity);
    }
    getEntity(type,name) {
        let entity = this.entities.find((entity)=>{
            return entity instanceof type && entity.name === name
        })
        return entity;
    }
    init() {
        this.entities.forEach((entity)=>{
            entity.stateMachine.init();
        })
    }
    run() {
        //Exec
        this.entities.forEach((entity)=>{
            entity.stateMachine.run();
        })    
        //Clear
        this.entities = this.entities.filter(entity=>entity.stateMachine.currState!==null);    
        //Draw
        this.renderer.fill();
        this.entities.forEach((entity)=>{
            entity.stateMachine.draw();
        })
    }
}