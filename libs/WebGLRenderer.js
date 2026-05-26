import Color from "./Color.js";
import Shader from "./Shader.js";
import ShaderManager from "./ShaderManager.js";
import V3 from "./V3.js";

export default class WebGLRenderer {
    size = new V3(0,0);
    offset = new V3(0,0);
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {WebGL2RenderingContext} */
    gl;
    shaders = {};
    programs = {
        drawTri: null
    };
    shaderExecutionBuffer = [];//expects {name:string,params:{...}}

    /** @type {WebGLVertexArrayObject} */
    drawVertexArray;
    /** @type {WebGLBuffer} Stores the data for each point */
    glVertexBuffer;
    glTextureBuffer;
    /** Stores the location of each attribute from the buffer */
    attributeLocations = [];

    // local vertex for the geometry points
    vertexBuffer = [];
    vertexDataSize = 12;// x y z w u v r g b a R T
    quadTypeIndexes = {
        'tri':0,
        'quad':1,
        'circle':2
    }

    /** @type {WebGLFramebuffer} */
    writeBuffer;
    /** @type {WebGLFramebuffer} */
    readBuffer;
    /** @type {WebGLTexture} */
    writeTexture;
    /** @type {WebGLTexture} */
    readTexture;

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

        this.shaderManager = new ShaderManager(this.gl,size);
    }

    get size() {return this.size.copy() }

    //Shader Loading
    
    async load() {
        await this.loadDrawTriShader();
        this.setReadBuffer();
        this.setWriteTexture();

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        await this.loadShaders();
    }
    async loadShaders() {
        const shaderParams = {
            'blit': {},
            'crt': {
                stripWidth: 2
            },
            'tint': {
                tintColor: new Color(0.0,0.0,0.1,0.05)
            },
            'invert': {
                subColor: Color.white
            },
            'fisheye': {
                strength: 0.25
            },
            'chromaberration': {
                offset : 0.004
            },
            'wave': {
                strength: 0.01,
                offset : 0.004,
                frequency: 111
            },
            'offset': {
                offset : new V3(0,0.001,0)
            },
            'perlin': {
                octaves: 12,
                offset: new V3(0,0),
                scale: new V3(1,1)
            },
            'radialWave': {
                uPos: this.size.scale(0.5),
                uRadius: 5
            }
        }
        const shaders = await Promise.all(
            Object.entries(shaderParams).map(async ([key,value])=>{
                let shader = await Shader.load(this.gl,key, value);
                return shader;
            })
        )
        shaders.forEach((shader)=>{this.shaders[shader.name] = shader});
    }
    async loadDrawTriShader() {
        const gl = this.gl;

        const program = gl.createProgram();
        
        //Compile and bind shaders

        const vertShader = await this.compileShader(gl.VERTEX_SHADER,`../shaders/drawTri.vert`);
        const fragShader = await this.compileShader(gl.FRAGMENT_SHADER,`../shaders/drawTri.frag`);

        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        
        gl.linkProgram(program);
        
        this.drawVertexArray = gl.createVertexArray();
        gl.bindVertexArray(this.drawVertexArray);

        //Bind buffers

        this.glVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glVertexBuffer);

        //TODO: see if its needed
        this.glTextureBuffer = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, this.glTextureBuffer);
        
        // texture params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        const aPosLoc = this.addVertexAttribute(program,'aPos',4,0);
        const aColLoc = this.addVertexAttribute(program,'aCol',4,4);
        const aUVLoc = this.addVertexAttribute(program,'aUV',2,8);
        const aRadiusLoc = this.addVertexAttribute(program,'aRadius',1,10);
        const aTypeLoc = this.addVertexAttribute(program,'aType',1,11);
        this.attributeLocations = [
            aPosLoc,
            aColLoc,
            aUVLoc,
            aRadiusLoc,
            aTypeLoc
        ];

        this.programs.drawTri = program;

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
    }
    async compileShader(type,path) {
        const shader = this.gl.createShader(type);
        const source = await this.getShaderSource(path);

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        return shader;
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
    setReadBuffer(data) {
        const gl = this.gl;

        this.readTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.readTexture);
        
        // texture params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.size.x,
            this.size.y,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );

        this.readBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.readBuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.readTexture,
            0
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    setWriteTexture() {
        const gl = this.gl;

        this.writeTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.writeTexture);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.size.x,
            this.size.y,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );

        // texture params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        this.writeBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.writeBuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.writeTexture,
            0
        );
    }
    addVertexAttribute(program,name,size,offset) {
        const aAtribLoc = this.gl.getAttribLocation(program, name);
        this.gl.vertexAttribPointer(
            aAtribLoc,                     // memory address? idk
            size,                       // read this many values per vertex
            this.gl.FLOAT,              // values are floats (4 bytes each)
            false,                      // dont normalize
            4 * this.vertexDataSize,    // each vertex occupies this size, in bytes
            4 * offset                  // for each vertex, start reading at this byte
        );
        this.gl.enableVertexAttribArray(aAtribLoc);
        return aAtribLoc;
    }

    // Drawing

    fill(color = Color.black) {
        this.pushQuadToBuffer(
            new V3(0,this.size.y),
            V3.zero,
            new V3(this.size.x,0),
            this.size.copy(),
            'quad',
            color
        );
    }
    /**
     * 
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {Color} color 
     * @param {Number} width 
     * @param {Number} endWidth 
     */
    fillLine(p1,p2,color = Color.white, width = 1, endWidth = null) {
        if(endWidth===null) endWidth = width;

        let direction = p2.sub(p1).normalized();
        let rotDirection = new V3(-direction.y,direction.x);

        let point1 = p1.add(rotDirection.scale(width/2));
        let point2 = p1.add(rotDirection.scale(-width/2));
        let point3 = p2.add(rotDirection.scale(endWidth/2));
        let point4 = p2.add(rotDirection.scale(-endWidth/2));

        this.pushQuadToBuffer(
            point1,
            point2,
            point3,
            point4,
            'quad',
            color
        );
    }
    /**
     * 
     * @param {V3} center 
     * @param {Number} radius 
     * @param {Color} color 
     */
    fillCircle(center,radius,color = Color.white) {
        let p1 = center.add(new V3(radius,-radius));
        let p2 = center.add(new V3(-radius,-radius));
        let p3 = center.add(new V3(-radius,radius));
        let p4 = center.add(new V3(radius,radius));

        this.pushQuadToBuffer(p1,p2,p3,p4,'circle',color);
    }
    /**
     * 
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {V3} p3 
     * @param {V3} p4 
     * @param {Color} color 
     */
    fillTriangle(p1,p2,p3,color = Color.white) {
        this.pushQuadToBuffer(p1,p2,p3,V3.zero,'tri',color);
    }
    /**
     * 
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {V3} p3 
     * @param {V3} p4 
     * @param {Color} color 
     */
    fillRect(point,size,color = Color.white) {
        let start = point;
        let end = point.add(size);

        this.pushQuadToBuffer(
            new V3(start.x,end.y),
            start,
            new V3(end.x,start.y),
            end,
            'tri',
            color
        );
    }
    /**
     * 
     * @param {V3} center 
     * @param {V3} size 
     * @param {V3} direction 
     * @param {Color} color 
     */
    fillAimedRect(center,size,direction,color = Color.white) {
        direction = direction.normalized();
        let heightDir = direction.scale(size.y);

        let rotDirection = new V3(direction.y,-direction.x);
        let widthDir = rotDirection.scale(size.x);

        let p1 = center.add(widthDir).sub(heightDir);
        let p2 = center.sub(widthDir).sub(heightDir);
        let p3 = center.sub(widthDir).add(heightDir);
        let p4 = center.add(widthDir).add(heightDir);

        this.pushQuadToBuffer(
            p1,p2,p3,p4,
            'quad',
            color
        );
    }
    /**
     * 
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {V3} p3 
     * @param {V3} p4 
     * @param {Color} color 
     */
    pushQuadToBuffer(p1,p2,p3,p4,type,color = Color.white) {
        let cornerRadius = 0.0;
        let typeIndex = this.quadTypeIndexes[type];
        //assume p1 is the initial tip, of UV [0,0]
        let points = [p1,p2,p3,p4];
        let UVs = [
            new V3(0,0),
            new V3(0,1),
            new V3(1,1),
            new V3(1,0)
        ]
        let topTriIndexes = [0,1,2];
        let bottomTriIndexes = [3,0,2];

        let mappedPoints = points.map((point, index)=>{
            // map pixel position to UV space: [0,size] -> [0,1]
            let uv = UVs[index];
            point.u = uv.x;
            point.v = uv.y;
            
            // map pixel position to screen space: [0,size] -> [-1,+1]
            let xyz = point.div(this.size).scale(2).sub(V3.one).mult(new V3(1,-1));
            point.x = xyz.x;
            point.y = xyz.y;
            point.z = 0.0;
            point.w = 1.0;
            
            return point;
        });

        //passes the same color for each triangle vertex
        let bufferLines = mappedPoints.map((point)=>{
            return [
                point.x,
                point.y,
                point.z,
                point.w,
                color.r,
                color.g,
                color.b,
                color.a,
                point.u,
                point.v,
                cornerRadius,
                typeIndex
            ];
        });

        topTriIndexes.forEach((index)=>{
            this.vertexBuffer.push(...bufferLines[index]);
        });
        bottomTriIndexes.forEach((index)=>{
            this.vertexBuffer.push(...bufferLines[index]);
        });
    }
    getVertexData(index) {
        let vertexCount = this.vertexBuffer.length / this.vertexDataSize;
        index = (index + vertexCount) % vertexCount;
        
        let start = index * this.vertexDataSize;
        let end = (index+1) * this.vertexDataSize;

        let output = this.vertexBuffer.slice(start,end);
        return output;
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
            new Float32Array(this.vertexBuffer),
            this.gl.STATIC_DRAW
        );

        this.vertexBuffer = [];
    }

    //Shader calling

    draw() {
        const gl = this.gl;

        let vertexCount = this.vertexBuffer.length / this.vertexDataSize;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.writeBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.programs.drawTri);
        gl.bindVertexArray(this.drawVertexArray);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glVertexBuffer);

        this.sendVertexBuffer(this.programs.drawTri);
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        [this.readBuffer, this.writeBuffer] = [this.writeBuffer, this.readBuffer];
        [this.readTexture, this.writeTexture] = [this.writeTexture, this.readTexture];
    }
    postProcess(frame) {
        let chromaWarp = (Math.sin(frame / 30)) * 0.002;
        //let off = 0.001 * (frame % 15);
        //let waveOffset = frame / 30 + Math.sin(frame / 50) + 1;

        this.runShader('tint',{tintColor: Color.white.scale(0.3)})
        this.runShader('chromaberration',{offset: chromaWarp});
        this.runShader('crt', {stripWidth: 2});
        this.runShader('perlin',{
            offset: new V3(frame, 0).div(this.size),
            scale: new V3(2,2),
            octaves: 12
        })

        this.shaderExecutionBuffer.forEach((exec)=>{
            this.runShader(exec.name,exec.params);
        })
        this.shaderExecutionBuffer = [];

        this.runShader('blit',{},true);
    }
    requestPostProcessing(shaderName,shaderParams) {
        this.shaderExecutionBuffer.push({
            name: shaderName,
            params: shaderParams
        });
    }
    runShader(name, params = {}, isFinal = false) {
        /** @type {Shader} */
        const shader = this.shaders[name];
        params.uResolution = this.size;
        shader.run(this.readTexture, isFinal ? null : this.writeBuffer, params);
        
        [this.readBuffer, this.writeBuffer] = [this.writeBuffer, this.readBuffer];
        [this.readTexture, this.writeTexture] = [this.writeTexture, this.readTexture];
    }

    // Variables and helpers

    setOffset(offset) {
        this.offset = offset;
    }
    getScreenPosition(position) {
        return position.add(this.offset)
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
}