import Color from "./Color.js";
import V3 from "./V3.js";
import ImageProcessor from "./ImageProcessor.js"
import ShaderManager from "./ShaderManager.js";

export default class Renderer {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    context;
    /** @type {ShaderManager} */
    shaderManager;
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

        this.shaderManager = new ShaderManager('gl-'+canvasId,size);
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
        let CAOffset = Math.abs(Math.sin(frame / 20));
        CAOffset *= 5 / this.size.x;
        
        this.shaderManager.setImageData(this.getImageData());

        this.shaderManager.runShader('tint');

        this.shaderManager.runShader('chromaberration');
        this.shaderManager.runShader('crt');
        this.shaderManager.runShader('fisheye');
        
        this.setImageData(this.shaderManager.getImageData());
    }
    getImageData(flipY = false) {
        /** @type {ImageData} */
        let imgData = this.context.getImageData(0,0,this.size.x,this.size.y);
        if(!flipY) return imgData;

        let arr = [];
        let rowByteSize = 4 * imgData.width;
        for(let y = imgData.height-1; y>=0; y--) {
            arr.push(imgData.data.slice(y * rowByteSize, (y+1) * rowByteSize));
        }
        for(let i = 0; i<arr.length; i++) imgData.data[i] = arr[i];

        return imgData;
    }
    setImageData(imageData) {
        this.context.putImageData(imageData,0,0);
    }
}