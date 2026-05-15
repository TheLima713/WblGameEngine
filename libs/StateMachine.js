export default class StateMachine {
    states = [];
    constructor(states, initialStateIndex = 0, stateChangeCallback = ()=>{}) {
        this.states = states;
        this.currState = states[initialStateIndex];
        this.stateChangeCallback = stateChangeCallback;
    }
    init(params) {
        this.currState.init(params);
        this.run(params);
    }
    run(params) {
        let nextState = this.currState.exec(params);
        
        if(nextState==='') {
            this.stateChangeCallback(this.currState,null,params);
            return;
        }

        if(nextState!==this.currState.name) this.swap(nextState);
        
        this.draw(params);
        setTimeout(()=>{
            this.run(params);
        },1000/60);
    }
    draw(params) {
        this.currState.draw(params);
    }
    swap(stateName) {
        let nextState = this.states.find(state=>state.name === stateName);
        
        let params = this.currState.exit();
        this.stateChangeCallback(this.currState,nextState,params);
        this.currState = nextState;
        this.currState.init(params);
    }
}

export class State {
    constructor({
        name,
        params,
        init = ()=>{},
        exec = ()=>{},
        exit = ()=>{},
        draw = ()=>{},
        renderer
    } = {}) {
        this.name = name;
        this.params = params;
        this.init = init.bind(this);
        this.exec = exec.bind(this);
        this.exit = exit.bind(this);
        this.draw = draw.bind(this);
        this.renderer = renderer;
        return this;
    }
}
