import Color from "./Color.js";
import V3 from "./V3.js";


export default class Renderer {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    context;
    width;
    height;
    constructor(canvasId, width, height) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
    }
    /**
     * 
     * @param {V3} point 
     * @param {Color} color 
     */
    fillCircle(point,radius = 1, color = Color.white) {
        this.context.beginPath();
        this.context.arc(point.x, point.y, radius, 0, 2 * Math.PI); 
        this.context.fillStyle = color.toHex();
        this.context.fill();
    }
    /**
     * 
     * @param {V3} point1 
     * @param {V3} point2 
     * @param {Color} color 
     */
    fillRect(point1,size,color = Color.white) {
        this.context.fillStyle = color.toHex();
        this.context.fillRect(point1.x,point1.y,size.x,size.y);
    }
    fill(color = Color.black) {
        this.context.fillStyle = color.toHex();
        this.context.fillRect(0,0,this.width,this.height);
    }
    /**
     * 
     * @param {V3} point1 
     * @param {V3} point2 
     * @param {V3} point3 
     * @param {Color} color 
     */
    fillTriangle(point1,point2,point3,color = Color.white) {
        this.context.fillStyle = color.toHex();
        this.context.strokeStyle = color.toHex();
        this.context.beginPath();
        
        this.context.moveTo(point1.x,point1.y);
        this.context.lineTo(point2.x,point2.y);
        this.context.lineTo(point3.x,point3.y);
        this.context.lineTo(point1.x,point1.y);
        
        this.context.fill();
    }
    fillLine(point1,point2,color = Color.white, width = 1) {
        this.context.lineWidth = width;
        this.context.strokeStyle = color.toHex();
        this.context.beginPath();

        this.context.moveTo(point1.x,point1.y);
        this.context.lineTo(point2.x,point2.y);
        
        this.context.stroke();
        this.context.lineWidth = 1;
    }
}