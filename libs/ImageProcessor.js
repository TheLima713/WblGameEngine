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
    inBounds(pos) {
        if(pos.x < 0) return false;
        if(pos.y < 0) return false;
        if(pos.x >= this.size.x) return false;
        if(pos.y >= this.size.y) return false;
        return true;
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
     * @param {V3} position 
     * @param {Color} color 
     * @returns 
     */
    setPixel(position,color) {
        let {x,y} = position;
        
        if(!this.inBounds(position)) return;

        let index = y * this.size.x + x;
        this.data[4 * index + 0] = color.r * 255;
        this.data[4 * index + 1] = color.g * 255;
        this.data[4 * index + 2] = color.b * 255;
        this.data[4 * index + 3] = color.a * 255;
        return;
    }
    /**
     * @param {V3} position 
     * @returns {Color}
     */
    getPixel(position) {
        let {x,y} = position;

        let color = Color.white;
        if(!this.inBounds(position)) return color;

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
        let out = this.copy();
        this.gridLoop((/** @type {V3} */pos)=>{
            out.setPixel(pos,Color.white.sub(this.getPixel(pos)));
        });
        return out;
    }
    pixelate(frame, size = 2) {
        let out = this.copy();
        this.gridLoop((/** @type {V3} */pos)=>{
            let roundPos = pos
                .scale(1/size).floor()
                .scale(size).floor()
            ;
            let pixel = this.getPixel(roundPos);
            out.setPixel(pos,pixel);
        });
        return out;
    }
    CRTelate(frame, size = 6) {
        let out = this.copy();
        this.gridLoop((/** @type {V3} */pos)=>{
            let roundPos = pos
                .scale(1/size).floor()
                .scale(size).floor()
            ;
            let pixel = this.getPixel((pos.y % 2) ? pos : roundPos);
            out.setPixel(pos,pixel);
        });
        return out;
    }
    /**
     * 
     * @param {Color} color 
     */
    addTint(frame,color) {
        let out = this.copy();
        this.gridLoop((/** @type {V3} */pos)=>{
            let base = this.getPixel(pos);
            let newColor = base
                .lerp(color,color.a)
                .clamp(new V3(1,1,1))
            ;
            out.setPixel(pos,newColor);
        });
        return out;
    }
    CRT(frame, stripWidth = 2, gapWidth = 1) {
        let out = this.copy();
        let wrap = gapWidth + stripWidth;
        this.gridLoop((/** @type {V3} */pos)=>{
            let strip = Math.floor(pos.y / wrap);
            if((pos.y % wrap) >= stripWidth) out.setPixel(pos,Color.black);
            else out.setPixel(pos,this.getPixel(pos))
        });
        return out;
    }
    wavy(frame) {
        let out = this.copy();
        this.gridLoop((/** @type {V3} */pos)=>{
            let waveSpeed = 0.1;
            let wavePhase = waveSpeed * (frame + pos.y);
            let offset = 10 * Math.cos(wavePhase);
            
            let newPos = pos.add(V3.RIGHT.scale(offset)).floor();
            out.setPixel(pos,this.getPixel(newPos));
        });
        return out;
    }
    bloom(frame) {
        let out = this.copy();
        let nborRange = new V3(5,5);
        this.gridLoop((/** @type {V3} */pos)=>{
            let currPixel = this.getPixel(pos);
            let nborBloom = Color.black;
            //path 1: spread its color | path 2: receive neighboring colors (averaging)
            this.gridLoop(
                (/** @type {V3} */nborPos)=>{
                    let nborPixel = this.getPixel(nborPos);
                    if(nborPixel.mag() < 0.25) return;
                    nborBloom = nborBloom.add(nborPixel);
                },
                pos.add(nborRange),
                pos.sub(nborRange)
            );
            let newColor = currPixel.add(nborBloom.scale(1/nborRange.mag()**2));
            
            out.setPixel(pos,newColor);
        });
        return out;
    }
    edge(frame,diff = 0.5) {
        let grayScale = this.colorScale(frame);
        let out = grayScale.copy();

        let edgeMatrix = [
            [new V3(-1,-1),new V3(0,-2),new V3(1,-1)],
            [new V3(-2,0),new V3(0,0),new V3(2,0)],
            [new V3(-1,1),new V3(0,2),new V3(1,1)]
        ];
        this.gridLoop((/** @type {V3} */pos)=>{
            let pixel = grayScale.getPixel(pos);
            var cummulated = Color.black;
            this.gridLoop(
                (/** @type {V3} */diffPos)=>{
                    let nborPixel = grayScale.getPixel(pos.add(diffPos));

                    let diffValue = nborPixel.sub(pixel).abs().mag();

                    let matrixIndex = diffPos.add(new V3(1,1));
                    let edgeValue = edgeMatrix[matrixIndex.y][matrixIndex.x].scale(diffValue);
                    
                    cummulated = cummulated.add(edgeValue);
                },
                new V3(1,1),
                new V3(-1,-1)
            );

            let newPixel = cummulated.abs();
            out.setPixel(pos,newPixel);
        });
        return out;
    }
    colorScale(frame, color = Color.white) {
        let out = this.copy();
        this.gridLoop((/** @type {V3} */pos)=>{
            let avgValue = this.getPixel(pos).sum() / 3;
            let newPixel = color.scale(avgValue);
            out.setPixel(pos,newPixel);
        });
        return out;
    }
    fillRect(start,end,color) {
        this.gridLoop(
            (/** @type {V3} */pos)=>{
                this.setPixel(pos,color);
            },
            end,
            start
        );
    }
    getAvgColor(start,end) {
        let buffer = Color.black;
        this.gridLoop(
            (/** @type {V3} */pos)=>{
                buffer = buffer.add(this.getPixel(pos));
            },
            end,
            start
        );
        let size = end.sub(start);
        let count = size.x * size.y;
        let avg = buffer.scale(1/count);
        return avg;
    }
    pixelByAvg(frame, size = 2) {
        let out = this.copy();
        let scaledSize = this.size.scale(1/size);
        this.gridLoop(
            (/** @type {V3} */scaledPos)=>{
                let start = scaledPos.scale(size);
                let end = scaledPos.add(V3.one).scale(size);

                let avgPixel = this.getAvgColor(
                    start,
                    end
                );
                out.fillRect(start,end,avgPixel);
            },
            scaledSize
        );
        return out;
    }
    fishEye(frame, warp = 2, zoom = 0) {
        let out = this.copy();
        
        //zoom > 1: weird view inversions
        //warp < -1: screen gone

        //warp = -1.75; zoom = 1.75; //inside out screen :o

        this.gridLoop(
            (/** @type {V3} */pos)=>{
                let center = this.size.scale(0.5);
                let dist = pos.sub(center);
                let normDist = dist.div(center);
                let shrinkPos = pos.add(dist.scale(normDist.mag()**warp - zoom)).floor();

                let newPixel = this.getPixel(shrinkPos);
                if(!this.inBounds(shrinkPos)) newPixel = Color.gray;
                out.setPixel(pos,newPixel);
            }
        );
        return out;
    }
    chromaticAberration(frame) {
        let out = this.copy();
        let shift = 3;
        this.gridLoop(
            (/** @type {V3} */pos)=>{
                let nborLeft = this.getPixel(pos.add(V3.LEFT.scale(shift)));
                let pixel = this.getPixel(pos);
                let nborRight = this.getPixel(pos.add(V3.RIGHT.scale(shift)));
                
                let newPixel = new Color(nborRight.r,pixel.g,nborLeft.b);
                out.setPixel(pos,newPixel);
            }
        );
        return out;
    }
}