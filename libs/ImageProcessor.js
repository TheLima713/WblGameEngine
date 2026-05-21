import Color from "./Color.js";
import Renderer from "./Renderer.js";
import V3 from "./V3.js";

export default class ImageProcessor {
    /** @type {Renderer} */
    renderer;
    size = new V3(0,0);
    data = [];
    constructor(renderer, size) {
        this.renderer = renderer;
        this.size = size;
        //this.gridLoop((pos)=>{
        //    this.setPixel(pos,Color.black);
        //});
    }
    copy() {
        let out = new ImageProcessor(this.renderer,this.size);
        return out;
    }
    gridLoop(fn,end = this.size, start = new V3(0,0)) {
        for(let y = start.y; y < end.y; y++) {
            for(let x = start.x; x < end.x; x++) {
                fn(new V3(x,y));
            }
        }
    }
    /**
     * 
     * @param {V3} position 
     * @param {Color} color 
     * @returns 
     */
    setPixel(position,color) {
        let {x,y} = position;
        
        if(x < 0) return;
        if(y < 0) return;
        if(x > this.size.x) return;
        if(y > this.size.y) return;

        let index = y * this.size.x + x;
        this.data[4 * index + 0] = color.r * 255;
        this.data[4 * index + 1] = color.g * 255;
        this.data[4 * index + 2] = color.b * 255;
        this.data[4 * index + 3] = color.a * 255;
        return;
    }
    getPixel(position) {
        let {x,y} = position;
        let color = Color.white;

        if(x < 0) return color;
        if(y < 0) return color;
        if(x > this.size.x) return color;
        if(y > this.size.y) return color;

        let index = y * this.size.x + x;
        color.r = this.data[4 * index + 0] / 255;
        color.g = this.data[4 * index + 1] / 255;
        color.b = this.data[4 * index + 2] / 255;
        color.a = this.data[4 * index + 3] / 255;
        return color;
    }
    /**
     * 
     * @param {ImageData} imgData 
     * @returns 
     */
    static fromImageData(renderer,imgData) {
        let {width,height,data} = imgData;
        let image = new ImageProcessor(renderer,new V3(width,height));
        image.data = data;
        return image;
    }
    toImageData() {
        let imgData = new ImageData(this.size.x,this.size.y);
        for(let i = 0; i < this.data.length; i++) imgData.data[i] = this.data[i];
        return imgData;
    }
    invert() {
        let out = this.copy()
        this.gridLoop((/** @type {V3} */pos)=>{
            out.setPixel(pos,this.getPixel(pos).invert());
        });
        return out;
    }
    pixelate(frame) {
        let out = this.copy()
        this.gridLoop((/** @type {V3} */pos)=>{
            let roundPos = pos
                .scale(1/4).floor()
                .scale(4).floor()
            ;
            let inverted = this.getPixel(roundPos);
            out.setPixel(pos,inverted);
        });
        return out;
    }
    /**
     * 
     * @param {Color} color 
     */
    addTint(frame,color) {
        let out = this.copy()
        this.gridLoop((/** @type {V3} */pos)=>{
            let base = this.getPixel(pos);
            let newColor = base.toVec()
                .lerp(color.toVec(),color.a)
                .clamp(new V3(1,1,1))
                .toColor()
            ;
            out.setPixel(pos,newColor);
        });
        return out;
    }
    CRT(frame, size = 2) {
        let out = this.copy()
        this.gridLoop((/** @type {V3} */pos)=>{
            let strip = Math.floor(pos.y / size)
            if(strip % 2) out.setPixel(pos,Color.black);
            else out.setPixel(pos,this.getPixel(pos))
        });
        return out;
    }
    wavy(frame) {
        let out = this.copy()
        this.gridLoop((/** @type {V3} */pos)=>{
            let waveSpeed = 0.1;
            let wavePhase = waveSpeed * (frame + pos.y);
            let offset = 10 * Math.cos(wavePhase);
            
            let newPos = pos.add(V3.RIGHT.scale(offset)).floor();
            out.setPixel(pos,this.getPixel(newPos));
        });
        return out;
    }
}