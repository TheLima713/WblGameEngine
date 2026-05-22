import Color from "./Color.js";
import V3 from "./V3.js";

export default class ShaderManager {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    context;
    /** @type {WebGL2RenderingContext} */
    gl;
    size = new V3(0,0);
    shaders = [];
    constructor(canvasId, size) {
        this.canvas = document.getElementById(canvasId);
        this.size = size;
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.gl = this.canvas.getContext('webgl2', {alpha: true});
    }
    getImageData() {
        const width = this.gl.drawingBufferWidth;
        const height = this.gl.drawingBufferHeight;
        const pixels = new Uint8Array(width * height * 4);
        
        this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        
        return {
            width: width,
            height: height,
            data: pixels
        };
    }
    async loadShaders() {
        this.shaders['tint'] = {
            name: 'tint',
            vs_source: await this.getShaderSource('../shaders/tint.vert'),
            fs_source: await this.getShaderSource('../shaders/tint.frag')
        }
        this.shaders['invert'] = {
            name: 'invert',
            vs_source: await this.getShaderSource('../shaders/invert.vert'),
            fs_source: await this.getShaderSource('../shaders/invert.frag')
        }
        this.shaders['crt'] = {
            name: 'crt',
            vs_source: await this.getShaderSource('../shaders/crt.vert'),
            fs_source: await this.getShaderSource('../shaders/crt.frag')
        }
        console.log(this.shaders)
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
    runShader(name, imageData) {
        let program = this.createProgram(name);
        this.createParameters(program);
        this.gl.useProgram(program);
        this.addImageBuffer(imageData);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    compileShader(type,source) {
        var shader = this.gl.createShader(type);

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        return shader;
    }
    createProgram(name) {
        let shaderInfo = this.shaders[name];
        let vs = this.compileShader(this.gl.VERTEX_SHADER,shaderInfo.vs_source);
        let fs = this.compileShader(this.gl.FRAGMENT_SHADER,shaderInfo.fs_source);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);

        this.gl.linkProgram(program);
        return program;
    }
    /**
     * 
     * @param {WebGLProgram} program 
     */
    createParameters(program) {
        //Set UV texture's triangles' positions
        //aPos is in WordlSpace ( [-1,1] ) and aUV is in UVSpace ( [0,1] )

        let vertices = new Float32Array([
            // x y (aPos)     u v (aUV)
            
            //tri 1
            -1, -1,   0, 0,
            1, -1,   1, 0,
            -1,  1,   0, 1,

            //tri 2
            -1, 1,   0, 1,
            1, -1,   1, 0,
            1, 1,   1, 1,
        ]);

        const buffer = this.gl.createBuffer();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            vertices,
            this.gl.STATIC_DRAW
        );

        // Describe where aPos and aUV lie within the buffer
        const aPos = this.gl.getAttribLocation(program, "aPos");
        this.gl.vertexAttribPointer(
            aPos,               // memory address? idk
            2,                  // read 2 values per vertex
            this.gl.FLOAT,      // values are floats (4 bytes each)
            false,              // dont normalize
            16,                 // each vertex occupies 16 bytes (4 floats * 4 bytes)
            0                   // for each vertex, start reading at the 0th byte
        );
        this.gl.enableVertexAttribArray(aPos);

        const aUV = this.gl.getAttribLocation(program, "aUV");
        this.gl.vertexAttribPointer(
            aUV,        // memory address? idk
            2,          // read 2 values per vertex
            this.gl.FLOAT,   // values are floats (4 bytes each)
            false,      // dont normalize
            16,         // each vertex occupies 16 bytes (4 floats * 4 bytes)
            8           // for each vertex, start reading at the 8th byte
        );
        this.gl.enableVertexAttribArray(aUV);
    }
    /**
     * 
     * @param {ImageData} imageData 
     * @param {String} name 
     */
    addImageBuffer(imageData) {
        let {width, height, data} = imageData;

        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                
        this.gl.pixelStorei(
            this.gl.UNPACK_FLIP_Y_WEBGL,
            true
        );
        
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,         //target
            0,                          //mipmap level
            this.gl.RGBA,               //internal format
            width,                      //width
            height,                     //height
            0,                          //border
            this.gl.RGBA,               //source format
            this.gl.UNSIGNED_BYTE,      //source type
            data                        //pixel data
        );

        //Parameters ? idk
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
}