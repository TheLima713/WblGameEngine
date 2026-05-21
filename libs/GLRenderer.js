import Color from "./Color.js";
import V3 from "./V3.js";

export default class GLRenderer {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    context;
    /** @type {WebGL2RenderingContext} */
    gl;
    size = new V3(0,0);
    offset = new V3(0,0);
    constructor(canvasId, size) {
        this.canvas = document.getElementById(canvasId);
        this.size = size;
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.gl = this.canvas.getContext('webgl2', {alpha: true});
        console.log(this.gl)
    }
    compileShader(type, source) {
        var shader = this.gl.createShader(type);

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        return shader;
    }
    fill(color = Color.black) {
        this.gl.clearColor(color.r, color.g, color.b, color.a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
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

        point1 = point1.div(this.size);
        point2 = point2.div(this.size);
        point3 = point3.div(this.size);

        let vertices = [
            point1.x, point1.y,
            point2.x, point2.y,
            point3.x, point3.y
        ];
        let buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER,vertices,this.gl.STATIC_DRAW);

        const vsSource = `
            attribute vec2 aPosition;

            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision mediump float;
            uniform vec4 uColor;

            void main() {
                gl_FragColor = uColor;
            }
        `;

        let vs = this.compileShader(this.gl.VERTEX_SHADER,vsSource);
        let fs = this.compileShader(this.gl.FRAGMENT_SHADER,fsSource);

        let program = this.gl.createProgram();

        this.gl.attachShader(program,this.gl.VERTEX_SHADER,vs);
        this.gl.attachShader(program,this.gl.FRAGMENT_SHADER,fs);
        
        this.gl.linkProgram(program);
        this.gl.useProgram(program);

        const positionLocation = this.gl.getAttribLocation(program, "aPosition");
        this.gl.vertexAttribPointer(
            positionLocation,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(posLoc);
        
        const colorLocation = this.gl.getUniformLocation(program, "uColor");
        this.gl.uniform4f(colorLoc, color.r, color.g, color.b, color.a);

        this.gl.drawArrays(this.gl.TRIANGLES,0,3);
    }
}