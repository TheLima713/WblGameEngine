import WebGLRenderer, { Texture } from "../libs/WebGLRenderer.js";
import InputManager from "../libs/InputManager.js";
import EntityManager from "../libs/EntityManager.js";
import Counter from "../libs/Counter.js";
import V3 from "../libs/V3.js";

export default class EffectApplier {
    constructor(){
        console.log('Hello, EffectApplier!');

        this.webGLRenderer = new WebGLRenderer('canvas',new V3(1920,1080).scale(0.75));

        this.inputManager = new InputManager('canvas');
        this.frameCounter = new Counter(0);

        window.addEventListener('beforeunload',this.webGLRenderer.destroy);
        console.log(this)
    }
    async loop(dt, frame = 0) {
        let ms = Date.now()
        
        await this.run(dt,frame);
        this.draw(dt,frame);

        let newDt = Date.now() - ms;
        //console.log(`FPS: ${1000 / newDt}`);

        requestAnimationFrame(async ()=>{
            await this.loop(
                newDt,
                frame+1
            );
        });
    }
    async load(){
        const isMobile = window.matchMedia("(pointer: coarse)").matches;
        await this.webGLRenderer.load();
    }
    async run(dt,frame){
        let base = await this.webGLRenderer.pushImageToArray('../images/hsl-warp.jpeg','base', 3);

        let gray = this.webGLRenderer.processToTexture('colorScale',{
            uTexture: base.bindToIndex(3),
            uColor: V3.one.scale(.5)
        })
        await this.webGLRenderer.pushTextureToArray(gray,'gray', 4);

        let hslWave = (0.001 * frame) % 1;
        let control = this.webGLRenderer.processToTexture('tint',{
            uTexture: gray.bindToIndex(4),
            uScale: new V3(1,0,0),
            uOffset: new V3(hslWave,.75,.5)
        })
        await this.webGLRenderer.pushTextureToArray(control,'control', 5);

        let hsl = this.webGLRenderer.processToTexture('hsl',{
            uTexture: control.bindToIndex(5)
        })        
        await this.webGLRenderer.pushTextureToArray(hsl,'hsl', 6);

        base.destroy();
        gray.destroy();
        control.destroy();
        hsl.destroy();
    }
    draw(dt,frame){
        let size = new V3(16,9).scale(35);
        this.frameCounter.count();
        this.webGLRenderer.fillRect(
            new V3(0,0),
            size,
            {textureName: 'base'}
        );
        this.webGLRenderer.fillRect(
            new V3(size.x,0),
            size,
            {textureName: 'control'}
        );
        this.webGLRenderer.fillRect(
            new V3(0,size.y),
            size,
            {textureName: 'gray'}
        );
        this.webGLRenderer.fillRect(
            size,
            size,
            {textureName: 'hsl'}
        );

        this.webGLRenderer.draw();
    }
}
