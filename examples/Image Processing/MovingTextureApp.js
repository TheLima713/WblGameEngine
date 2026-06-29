import WebGLRenderer, { Texture } from "../../libs/WebGLRenderer.js";
import Counter from "../../libs/Counter.js";
import Color from "../../libs/Color.js";
import V3 from "../../libs/V3.js";

export default class MovingTextureApp {
    /** @type {WebGLRenderer} */
    webGLRenderer;
    constructor(){
        console.log('Hello, SimpleMeshRendering!');

        this.webGLRenderer = new WebGLRenderer('canvas',new V3(1920,1080,1000).scale(0.75));

        this.frameCounter = new Counter(0);

        window.addEventListener('beforeunload',()=>{
            this.main.destroy();
            this.diff.destroy();
            this.webGLRenderer.destroy();
        });
    }
    loop(dt, frame = 0) {
        let ms = Date.now()
        
        this.run();
        this.draw();

        let newDt = Date.now() - ms;
        //console.log(`FPS: ${1000 / newDt}`);

        requestAnimationFrame(()=>{
            this.loop(
                newDt,
                frame+1
            );
        });
    }
    async load(){
        await this.webGLRenderer.load();
        this.imgSize = await this.webGLRenderer.getImageSize('./images/vangogh2.jpg');

        this.main = await this.webGLRenderer.pushImageToArray('./images/vangogh2.jpg','main',4);
        
        let preBlur = this.webGLRenderer.processToTexture('edge',{
            uTexture: this.main.bindToIndex(4),
            strength: 3,
            uOrigSize: this.imgSize,
            uAltMask: 1
        });
        this.diff = this.webGLRenderer.processToTexture('blur',{
            uTexture: preBlur.bindToIndex(4),
            uKernelSize: 5
        });
        
        preBlur.destroy();
    }
    run(){
        this.frameCounter.count();
    }
    async draw(){
        let norm = (this.frameCounter.currValue / 240) % 1;
        let sign = Math.sign(Math.sin(norm));
        let wave = Math.cos(this.frameCounter.currValue / 40);
        let wave2 = Math.sin(this.frameCounter.currValue / 40);
        //wave = (1 + wave)/2;
        
        let shift = this.webGLRenderer.processToTexture('displace',{
            uTexture: this.main,
            uDisplace: this.diff,
            strength: V3.one.scale(wave).scale(0.01)
        });
        let shift2 = this.webGLRenderer.processToTexture('displace',{
            uTexture: this.main,
            uDisplace: this.diff,
            strength: V3.one.scale(wave2).scale(0.01)
        });
        let fadeOut = this.webGLRenderer.processToTexture('tint',{
            uOffset: Color.white.scale(wave)
        });
        let final = this.webGLRenderer.processToTexture('mergeTexture',{
            uTexture: shift2.bindToIndex(3),
            uScale: fadeOut.bindToIndex(4),
            uOffset: shift.bindToIndex(5),
            strength: (1-wave)
        });
        await this.webGLRenderer.pushTextureToArray(shift,'temp',6);
        this.webGLRenderer.fillRect(V3.zero,this.webGLRenderer.size,{textureName:'temp'});

        this.webGLRenderer.draw();
        shift.destroy();
        shift2.destroy();
        fadeOut.destroy();
        final.destroy();
    }
}
