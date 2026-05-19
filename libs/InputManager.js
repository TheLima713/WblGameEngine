import V3 from "./V3.js";

export default class InputManager {
    source;
    // assumes leftClick = touch
    mouse = {
        position: new V3(0,0),
        leftClick: false,
        middleClick: false,
        rightClick: false,
        scrollDelta: 0
    };
    keyboard = {
        'up': false
        //...
    }
    /**
     * @param {Node} source 
     */
    constructor(sourceId, onInputCallback = ()=>{}) {
        this.source = document.getElementById(sourceId);
        this.onInputCallback = onInputCallback;

        this.source.addEventListener('contextmenu',(event)=>{event.preventDefault()});
        this.source.addEventListener('mousemove',(event)=>{
            var rect = event.target.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            
            this.mouse.position = new V3(x,y);
            
            this.onInput(event);
        });
        this.source.addEventListener('mousedown',(event)=>{
            if(event.button===0) this.mouse.leftClick = true;
            if(event.button===1) this.mouse.middleClick = true;
            if(event.button===2) this.mouse.rightClick = true;
            event.preventDefault();
            
            this.onInput(event);
        });
        this.source.addEventListener('mouseup',(event)=>{
            if(event.button===0) this.mouse.leftClick = false;
            if(event.button===1) this.mouse.middleClick = false;
            if(event.button===2) this.mouse.rightClick = false;
            
            this.onInput(event);
        });

        this.source.addEventListener('wheel',(event)=>{
            this.mouse.scrollDelta = event.wheelDelta;
            
            this.onInput(event);
        })
        
        this.source.addEventListener('touchstart',(event)=>{
            event.preventDefault();

            var rect = event.target.getBoundingClientRect();
            var x = event.changedTouches[0].clientX - rect.left;
            var y = event.changedTouches[0].clientY - rect.top;
            
            this.mouse.leftClick = true;
            this.mouse.position = new V3(x,y);
            
            this.onInput(event);
        });
        this.source.addEventListener('touchmove',(event)=>{
            event.preventDefault();
            
            var rect = event.target.getBoundingClientRect();
            var x = event.changedTouches[0].clientX - rect.left;
            var y = event.changedTouches[0].clientY - rect.top;
            
            this.mouse.position = new V3(x,y);
            
            this.onInput(event);
        });
        this.source.addEventListener('touchend',(event)=>{
            event.preventDefault();
            
            var rect = event.target.getBoundingClientRect();
            var x = event.changedTouches[0].clientX - rect.left;
            var y = event.changedTouches[0].clientY - rect.top;
            
            this.mouse.leftClick = false;
            this.mouse.position = new V3(x,y);
            
            this.onInput(event);
        });

        window.addEventListener('keydown',(event)=>{
            this.keyboard[event.key] = true;
            
            this.onInput(event);
        });
        window.addEventListener('keyup',(event)=>{
            this.keyboard[event.key] = false;

            this.onInput(event);
        });
    }
    onInput(event) {
        this.onInputCallback(event.type, this.mouse,this.keyboard);
    }
}