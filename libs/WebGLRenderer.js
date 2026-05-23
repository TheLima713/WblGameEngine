import Color from "./Color.js";
import V3 from "./V3.js";

export default class WebGLRenderer {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {WebGL2RenderingContext} */
    gl;
    size = new V3(0,0);
    programs = {
        drawTri: null
    };
    triBuffer = [];
    /**
     * @param {String} canvasId 
     * @param {V3} size 
     */
    constructor(canvasId, size) {
        this.size = size;

        this.canvas = document.getElementById(canvasId);
        this.canvas.width = size.x;
        this.canvas.height = size.y;

        this.gl = this.canvas.getContext('webgl2', {alpha: true});
    }
    async load() {
        this.loadBuffers();
        await this.loadDrawTriShader();
        //Set a few GL parameters

        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            this.gl.NEAREST
        );

        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            this.gl.NEAREST
        );

        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_S,
            this.gl.CLAMP_TO_EDGE
        );

        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_T,
            this.gl.CLAMP_TO_EDGE
        );
    }
    loadBuffers() {
        this.gl.bindBuffer(
            this.gl.ARRAY_BUFFER,
            this.gl.createBuffer()
        );
        this.gl.bindTexture(
            this.gl.TEXTURE_2D,
            this.gl.createTexture()
        );
    }
    async loadDrawTriShader() {
        const program = this.gl.createProgram();
        
        let vertSource = await this.getShaderSource(`../shaders/drawTri.vert`);
        let vertShader = this.compileShader(this.gl.VERTEX_SHADER,vertSource);
        this.gl.attachShader(program, vertShader);

        let fragSource = await this.getShaderSource(`../shaders/drawTri.frag`);        
        let fragShader = this.compileShader(this.gl.FRAGMENT_SHADER,fragSource);
        this.gl.attachShader(program, fragShader);
        
        this.gl.linkProgram(program);//TODO: on load or on use?
        this.programs.drawTri = program;
    }
    async getShaderSource(path) {
        let response = await fetch(path);
        if(!response.ok) {
            console.log('File not found.');
            return '';
        }
        let data = await response.text();
        return data;
    }
    compileShader(type,source) {
        var shader = this.gl.createShader(type);

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        return shader;
    }
    /**
     * 
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {V3} p3 
     * @param {Color} color 
     */
    pushTriToBuffer(p1,p2,p3,color = Color.white) {
        p1.w = 1;
        p2.w = 1;
        p3.w = 1;
        let points = [p1,p2,p3];

        let mappedPoints = points.map((point)=>{
            // map pixel position to UV space: [0,size] -> [0,1]
            let uv = point.div(this.size);
            point.u = uv.x;
            point.v = uv.y;
            
            // map pixel position to screen space: [0,size] -> [-1,+1]
            let xyz = uv.scale(2).sub(V3.one);
            point.x = xyz.x;
            point.y = xyz.y;
            point.z = 0.0;
            
            return point;
        });

        //passes the same color for each triangle vertex
        let bufferLines = mappedPoints.map((point)=>{
            return [
                point.x,
                point.y,
                point.z,
                point.w,
                point.u,
                point.v,
                color.r,
                color.g,
                color.b,
                color.a
            ];
        });
        console.log(bufferLines)

        bufferLines.forEach((line)=>{
            this.triBuffer.push(...line);
        });
    }
    sendVertexBuffer(program) {
        /*
            Each vertex has:
                aPos [-1,+1]
                    x,y,z,w
                aUV [0,1]
                    x,y
                aCol [0,1]
                    r,g,b,a
            Indexes:
                aPos: 0-3
                aUv: 4-5
                aCol: 6-9
        */

        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(this.triBuffer),
            this.gl.STATIC_DRAW
        );

        // Describe where aPos, aUV and aCol lie within the buffer
        const aPos = this.gl.getAttribLocation(program, "aPos");
        this.gl.vertexAttribPointer(
            aPos,               // memory address? idk
            4,                  // read 4 values per vertex
            this.gl.FLOAT,      // values are floats (4 bytes each)
            false,              // dont normalize
            40,                 // each vertex occupies 40 bytes (10 floats * 4 bytes)
            0                   // for each vertex, start reading at the 0th byte
        );
        this.gl.enableVertexAttribArray(aPos);

        const aUV = this.gl.getAttribLocation(program, "aUV");
        this.gl.vertexAttribPointer(
            aUV,                // memory address? idk
            2,                  // read 2 values per vertex
            this.gl.FLOAT,      // values are floats (4 bytes each)
            false,              // dont normalize
            40,                 // each vertex occupies 40 bytes (10 floats * 4 bytes)
            16                  // for each vertex, start reading at the 8th byte
        );
        this.gl.enableVertexAttribArray(aUV);
        
        const aCol = this.gl.getAttribLocation(program, "aCol");
        this.gl.vertexAttribPointer(
            aCol,               // memory address? idk
            4,                  // read 4 values per vertex
            this.gl.FLOAT,      // values are floats (4 bytes each)
            false,              // dont normalize
            40,                 // each vertex occupies 40 bytes (10 floats * 4 bytes)
            24                  // for each vertex, start reading at the 8th byte
        );
        this.gl.enableVertexAttribArray(aCol);

        this.triBuffer = [];
    }
    draw() {
        let vertexCount = this.triBuffer.length / 10;

        this.gl.useProgram(this.programs.drawTri);
        this.sendVertexBuffer(this.programs.drawTri);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertexCount);
    }
}