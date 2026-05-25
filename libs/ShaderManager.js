import Color from "./Color.js";
import V3 from "./V3.js";

export default class ShaderManager {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {ImageData} */
    imageBuffer;
    /** @type {CanvasRenderingContext2D} */
    context;
    /** @type {WebGL2RenderingContext} */
    gl;
    size = new V3(0,0);
    shaders = [];
    frameBuffer;
    constructor(webGLContext, size) {  
        this.gl = webGLContext;
        this.size = size;      
        this.initGL();
    }
    setImageData(imageData) {
        this.imageBuffer = imageData;
    }
    getImageData() {
        const width = this.gl.drawingBufferWidth;
        const height = this.gl.drawingBufferHeight;
        const pixels = new Uint8Array(width * height * 4);
        
        this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        
        let imageData = new ImageData(width,height);
        for(let i = 0; i < pixels.length; i++) imageData.data[i] = pixels[i];
        return imageData;
    }
    initGL() {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        this.gl.pixelStorei(
            this.gl.UNPACK_FLIP_Y_WEBGL,
            true
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
    async loadShaders() {
        let nameList = ['tint','invert','crt','fisheye','chromaberration'];
        let paramList = [
            {
                tintColor: new Color(0,0,0.05)
            },
            {},
            {},
            {
                warp: 0.25
            },
            {
                offset: 0.005
            }
        ]
        nameList.forEach(async (name, index)=>{
            this.shaders[name] = {
                name: name,
                vs_source: await this.getShaderSource(`../shaders/${name}.vert`),
                fs_source: await this.getShaderSource(`../shaders/${name}.frag`),
                params: paramList[index]
            }
            this.shaders[name].program = this.createProgram(name);
            this.setVertexBuffer(this.shaders[name].program);
        })

        console.log(this.shaders);
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
    setAttribute(program, name, value) {
        let uniformLocation = this.gl.getUniformLocation(program,name);

        if(typeof value === 'number') {
            this.gl.uniform1f(
                uniformLocation,
                value
            );
        }
        if(value instanceof Color) {
            this.gl.uniform4f(
                uniformLocation,
                value.r,
                value.g,
                value.b,
                value.a
            );
        }
        if(value instanceof V3) {
            this.gl.uniform4f(
                uniformLocation,
                value.x,
                value.y,
                value.z,
                0
            );
        }
    }
    runShader(name, params) {
        if(!this.shaders[name]) return;
        let program = this.shaders[name].program;

        this.setImageDataBuffer(this.imageBuffer);

        this.gl.useProgram(program);
        
        let shaderParams = params;
        if(shaderParams===undefined) shaderParams = this.shaders[name].params;

        Object.entries(shaderParams).forEach(([key,value])=>{
            this.setAttribute(program,key,value);
        });

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        this.imageBuffer = this.getImageData();
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
    setVertexBuffer(program) {
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
    setImageDataBuffer(imageData) {
        let {width, height, data} = imageData;

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,         //target
            0,                          //mipmap level
            this.gl.RGBA,               //internal format
            width,                      //width
            height,                     //height
            0,                          //border
            this.gl.RGBA,               //source format
            this.gl.UNSIGNED_BYTE,      //source type
            imageData                        //pixel data
        );

    }
}