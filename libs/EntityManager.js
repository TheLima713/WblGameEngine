import InputManager from "./InputManager.js";
import Renderer from "./Renderer.js";

export default class EntityManager {
    entities;
    /**@type {Renderer} */
    renderer;
    /**@type {InputManager} */
    inputManager;
    constructor(renderer,inputManager) {
        this.entities = [];
        this.renderer = renderer;
        this.inputManager = inputManager;
    }
    /**
     * 
     * @param {Array} entities 
     */
    addEntities(entities, addAtStart = false) {
        entities.forEach((entity)=>{
            entity.renderer = this.renderer;
            entity.inputManager = this.inputManager;
            entity.entityManager = this;
            if(addAtStart) this.entities.unshift(entity);
            else this.entities.push(entity);
        })
    }
    getEntities(type) {
        let entities = this.entities.filter((entity)=>{
            return entity instanceof type
        })
        return entities;
    }
    init(initParams) {
        this.entities.forEach((entity)=>{
            entity.stateMachine.init(initParams);
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
    setRendererOffset(offset) {
        this.renderer.setOffset(offset);
    }
}