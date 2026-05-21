import Color from "./Color.js";
import V3 from "./V3.js";
import ImageProcessor from "./ImageProcessor.js"

export default class Renderer {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    context;
    /** @type {WebGL2RenderingContext} */
    gl;
    size = new V3(0,0);
    offset = new V3(0,0);
    /**
     * 
     * @param {String} canvasId 
     * @param {V3} size 
     */
    constructor(canvasId, size) {
        this.canvas = document.getElementById(canvasId);
        this.size = size;
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.context = this.canvas.getContext('2d',{ willReadFrequently: true });
        this.gl = this.canvas.getContext('webgl2', {alpha: true});
    }
    /**
     * 
     * @param {V3} point 
     * @param {Color} color 
     */
    fillCircle(point,radius = 1, color = Color.white) {
        point = point.add(this.offset);

        this.context.beginPath();
        this.context.arc(point.x, point.y, radius, 0, 2 * Math.PI); 
        this.context.fillStyle = color.toHex();
        this.context.fill();
    }
    /**
     * 
     * @param {V3} point 
     * @param {Color} color 
     */
    drawCircle(point,radius = 1, color = Color.white) {
        point = point.add(this.offset);

        this.context.beginPath();
        this.context.arc(point.x, point.y, radius, 0, 2 * Math.PI); 
        this.context.strokeStyle = color.toHex();
        this.context.stroke();
    }
    /**
     * 
     * @param {V3} point1 
     * @param {V3} point2 
     * @param {Color} color 
     */
    fillRect(point1,size,color = Color.white) {
        point1 = point1.add(this.offset);

        this.context.fillStyle = color.toHex();
        this.context.fillRect(point1.x,point1.y,size.x,size.y);
    }
    fill(color = Color.black) {
        this.context.fillStyle = color.toHex();
        this.context.fillRect(0,0,this.size.x,this.size.y);
    }
    /**
     * 
     * @param {V3} point1 
     * @param {V3} point2 
     * @param {V3} point3 
     * @param {Color} color 
     */
    fillTriangle(point1,point2,point3,color = Color.white) {
        point1 = point1.add(this.offset);
        point2 = point2.add(this.offset);
        point3 = point3.add(this.offset);

        this.context.fillStyle = color.toHex();
        this.context.beginPath();
        
        this.context.moveTo(point1.x,point1.y);
        this.context.lineTo(point2.x,point2.y);
        this.context.lineTo(point3.x,point3.y);
        this.context.lineTo(point1.x,point1.y);
        
        this.context.fill();
    }
    /**
     * 
     * @param {V3} point1 
     * @param {V3} point2 
     * @param {V3} point3 
     * @param {Color} color 
     */
    drawTriangle(point1,point2,point3,color = Color.white) {
        point1 = point1.add(this.offset);
        point2 = point2.add(this.offset);
        point3 = point3.add(this.offset);

        this.context.strokeStyle = color.toHex();
        this.context.beginPath();
        
        this.context.moveTo(point1.x,point1.y);
        this.context.lineTo(point2.x,point2.y);
        this.context.lineTo(point3.x,point3.y);
        this.context.lineTo(point1.x,point1.y);
        
        this.context.stroke();
    }
    fillLine(point1,point2,color = Color.white, width = 1) {
        point1 = point1.add(this.offset);
        point2 = point2.add(this.offset);

        this.context.lineWidth = width;
        this.context.strokeStyle = color.toHex();
        this.context.beginPath();

        this.context.moveTo(point1.x,point1.y);
        this.context.lineTo(point2.x,point2.y);
        
        this.context.stroke();
        this.context.lineWidth = 1;
    }
    setOffset(offset) {
        this.offset = offset;
    }
    getScreenPosition(position) {
        return position.add(this.offset)
    }
    postProcess(frame) {
        let imageData = this.context.getImageData(0,0,this.size.x,this.size.y);
        let img = ImageProcessor.fromImageData(this,imageData);

        img = img.pixelate(frame);
        //let effectIndex = Math.floor(frame / 123) % 5;
        //console.log(effectIndex)
        //switch(effectIndex) {
        //    case 0:
        //        img = img.pixelate(frame);
        //        break;
        //    case 1:
        //        img = img.invert(frame);
        //        break;
        //    case 2:
        //        img = img.addTint(frame,new Color(0.4,0.2,0.0,0.5));
        //        break;
        //    case 3:
        //        img = img.CRT(frame);
        //        break;
        //    case 4:
        //        img = img.wavy(frame);
        //        break;
        //}
        this.context.putImageData(img.toImageData(),0,0);
    }
}