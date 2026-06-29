import Color from "./Color.js";
import Shader from "./Shader.js";
import ShaderManager from "./ShaderManager.js";
import V3 from "./V3.js";

const shaderParams = {
    'blit': {},
    'crt': {
        stripWidth: 2
    },
    'edge': {
        strength: 1,
        uResolution: V3.zero
    },
    'tint': {
        uScale: Color.white,
        uOffset: Color.black
    },
    //'invert': {
    //    subColor: Color.white
    //},
    //'fisheye': {
    //    strength: 0.25
    //},
    //'chromaberration': {
    //    offset : 0.004
    //},
    //'wave': {
    //    strength: 0.01,
    //    offset : 0.004,
    //    frequency: 111
    //},
    //'perlin': {
    //    octaves: 12,
    //    offset: new V3(0,0),
    //    scale: new V3(1,1),
    //    uValueScale: 1
    //},
    //'radialWave': {
    //    uPos: new V3(0.5,0.5),
    //    uRadius: 5
    //},
    'radialDist': {
        uPos: new V3(0.5,0.5),
        uRadius: 5,
        uPadding: 0,
        uExponent: 1
    },
    'mist': {
        strength: 1.0
    },
    'displace': {
        strength: V3.one.scale(0.005),
        offset: new V3(0,0.01,0)
    },
    'blur': {
        uKernelSize: 1
    },
    'colorScale': {
        uColor: Color.white
    },
    'mergeTexture': {
        uLerp: 1
    },
    'hsl': {}
}

export default class WebGLRenderer {
    size = new V3(0,0);
    offset = new V3(0,0);
    /** @type {HTMLCanvasElement} */
    canvas;sad
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
    vertexDataSize = 22;// x y z w u v su sv eu ev r g b a Rad Typ Emi Tex nx ny nz nw
    quadTypeIndexes = {
        'tri':0,
        'quad':1,
        'circle':2
    }
    /** @type {Object.<String,Texture>} */
    textureBuffers = {};
    /** @type {Texture} */
    swapBuffer;
    textureArrayBuffer;
    textureArrayIndexes = {
        'none': -1
    };

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

    get size() {return this.size.copy() }

    //Shader Loading
    
    async load() {
        const gl = this.gl;
        await this.loadImages();
        await this.loadDrawTriShader();

        this.readTextureObj =  new Texture(gl,this.size,0);
        this.writeTextureObj = new Texture(gl,this.size,1);
        this.swapBuffer = new Texture(gl,this.size,2);
        
        gl.enable(gl.BLEND);
        gl.disable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.depthMask(true);
        
        let shaderLoadTime = Date.now();
        await this.loadShaders();
        console.log(`Shaders loaded in ${Date.now() - shaderLoadTime}ms`);
    }
    destroy() {
        this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, null);//

        this.readTextureObj.destroy();
        this.writeTextureObj.destroy();
        this.swapBuffer.destroy();
        this.gl.deleteTexture(this.textureArrayBuffer);
    }
    async loadImages() {
        this.initTextureArray(this.size,8);
        //this.textureBuffers['hurt-doggo'] = await Texture.fromPath(this.gl,'./images/doggo.png');
        //this.textureBuffers['gamer-doggo'] = await Texture.fromPath(this.gl,'./images/gamer.webp');
        
        await this.pushImageToArray('./images/mimir.jpeg','mimir',0);
        await this.pushImageToArray('./images/gamer.webp','gamer',1);
        await this.pushImageToArray('./images/fih.jpg','fih',2);
        //await this.pushImageToArray('./images/crazy.webp','angry',3);
        //await this.pushImageToArray('./images/lost.webp','lost',4);
        //await this.pushImageToArray('./images/tired.jpg','tired',5);
    }
    async loadShaders() {
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
        gl.useProgram(program);
        
        this.drawVertexArray = gl.createVertexArray();
        gl.bindVertexArray(this.drawVertexArray);

        //Bind buffers

        this.glVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glVertexBuffer);

        gl.activeTexture(gl.TEXTURE3);//
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textureArrayBuffer);//
        const uTextureArrayLoc = gl.getUniformLocation(program,'uTextureArray');//
        gl.uniform1i(uTextureArrayLoc,3);//
        
        const aPosLoc = this.addVertexAttribute(program,'aPos',4,0);
        
        const aUVLoc = this.addVertexAttribute(program,'aUV',2,4);
        const aUVStartLoc = this.addVertexAttribute(program,'aUVStart',2,6);
        const aUVScaleLoc = this.addVertexAttribute(program,'aUVScale',2,8);

        const aColLoc = this.addVertexAttribute(program,'aCol',4,10);
        const aRadiusLoc = this.addVertexAttribute(program,'aRadius',1,14);
        const aTypeLoc = this.addVertexAttribute(program,'aType',1,15);
        const aEmissionLoc = this.addVertexAttribute(program,'aEmission',1,16);
        const aTextureIndexLoc = this.addVertexAttribute(program,'aTextureIndex',1,17);
        const aNormalLoc = this.addVertexAttribute(program,'aNormal',4,18);

        this.attributeLocations = [
            aPosLoc,
            aColLoc,
            aUVLoc,
            aUVStartLoc,
            aUVScaleLoc,
            aRadiusLoc,
            aTypeLoc,
            aEmissionLoc,
            aTextureIndexLoc,
            aNormalLoc
        ];

        this.programs.drawTri = program;

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);//

        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        
        gl.useProgram(null);
    }
    async compileShader(type,path) {
        const gl = this.gl;

        const shader = gl.createShader(type);
        const source = await this.getShaderSource(path);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

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
    pushTextureBuffer(name) {
        if(this.textureBuffers[name]) this.textureBuffers[name].destroy();

        const currLength = Object.keys(this.textureBuffers).length;
        const texture = new Texture(this.gl,this.size,name,currLength + 3);//jump over read/write/swap buffers
        this.textureBuffers[name] = texture;
        
        return texture;
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
    initTextureArray(size, length = 8) {
        const gl = this.gl;
        this.textureArraySize = size;

        const zeroData = new Uint8Array(size.x * size.y * length * 4); 

        this.textureArrayBuffer = gl.createTexture();
        gl.activeTexture(gl.TEXTURE3);//
        gl.bindTexture(gl.TEXTURE_2D_ARRAY,this.textureArrayBuffer);
        
        gl.texImage3D(
            gl.TEXTURE_2D_ARRAY,

            0,

            gl.RGBA8,

            size.x,
            size.y,
            length,

            0,

            gl.RGBA,
            gl.UNSIGNED_BYTE,

            zeroData
        );

        gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

        gl.bindTexture(gl.TEXTURE_2D_ARRAY,null);
    }
    async pushImageToArray(path,name,index = null) {
        const gl = this.gl;

        if(index===null) index = Object.keys(this.textureArrayIndexes).length;

        var imageData = await new Promise((resolve,reject)=>{
            const image = new Image();
            image.onload = () => {
                resolve(image);
            };
            image.src = path;
        })
        const size = new V3(imageData.width,imageData.height);

        if(!size.equals(this.textureArraySize)) {
            imageData = this.scaleImage(imageData,this.textureArraySize);
            console.log(`Re-scaled image "${name}" from [${size.x + ',' + size.y}] to [${this.textureArraySize.x + ',' + this.textureArraySize.y}]`);
        }

        let tex = new Texture(gl,this.textureArraySize,index);
        tex.setData(imageData);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textureArrayBuffer);
        
        gl.texSubImage3D(
            gl.TEXTURE_2D_ARRAY,

            0,

            0,0,index,

            this.textureArraySize.x,
            this.textureArraySize.y,
            1,

            gl.RGBA,
            gl.UNSIGNED_BYTE,

            imageData
        );
        
        this.textureArrayIndexes[name] = index;

        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
        return tex;
    }
    /**
     * 
     * @param {Texture} texture 
     * @param {Number} index 
     */
    async pushTextureToArray(texture,name,index) {
        const gl = this.gl;
        
        const size = texture.size;

        if(!size.equals(this.textureArraySize)) {
            texture.imageData = this.scaleImage(texture.imageData,this.textureArraySize);
            console.log(`Re-scaled image "${name}" from [${size.x + ',' + size.y}] to [${this.textureArraySize.x + ',' + this.textureArraySize.y}]`);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER,texture.buffer);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textureArrayBuffer);
        
        gl.copyTexSubImage3D(
            gl.TEXTURE_2D_ARRAY,

            0,

            0,0,index,
            0,0,
            this.textureArraySize.x,
            this.textureArraySize.y
        );
        
        this.textureArrayIndexes[name] = index;

        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    }
    scaleImage(image,size) {
        const canvas = document.createElement('canvas');
        canvas.width = size.x;
        canvas.height = size.y;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            image,
            0, 0,
            size.x, size.y
        );

        return canvas;
    }

    // Drawing

    fill(
        params = {
            color: Color.black,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0,
            width: 1,
            endWidth: null
        }
    ) {
        this.pushQuadToBuffer(
            V3.zero,
            new V3(0,this.size.y,0),
            new V3(this.size.x,this.size.y,0),
            new V3(this.size.x,0,0),
            'quad',
            params
        );
    }
    /**
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {*} params 
     */
    fillLine(p1,p2,
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0,
            width: 1,
            endWidth: null
        }
    ) {
        if(params.endWidth===null || params.endWidth===undefined) params.endWidth = params.width;

        let direction = p2.sub(p1).normalized();
        let rotDirection = new V3(-direction.y,direction.x);

        let point2 = p1.add(rotDirection.scale(params.width/2));
        let point1 = p1.add(rotDirection.scale(-params.width/2));
        let point3 = p2.add(rotDirection.scale(params.endWidth/2));
        let point4 = p2.add(rotDirection.scale(-params.endWidth/2));

        this.pushQuadToBuffer(
            point1,
            point2,
            point3,
            point4,
            'quad',
            params
        );
    }
    /**
     * 
     * @param {V3} center 
     * @param {Number} radius 
     * @param {*} params 
     */
    fillCircle(
        center,radius,
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0
        }
    ) {
        let p1 = center.add(new V3(radius,-radius));
        let p2 = center.add(new V3(-radius,-radius));
        let p3 = center.add(new V3(-radius,radius));
        let p4 = center.add(new V3(radius,radius));

        this.pushQuadToBuffer(p2,p3,p4,p1,'circle',params);
    }
    /**
     * 
     * @param {V3} center 
     * @param {V3} radius 
     * @param {*} params 
     */
    fillAimedCircle(
        center,radius,
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0
        }
    ) {
        let diagonal = radius.add(new V3(-radius.y,radius.x));
        let diagonal90 = new V3(-diagonal.y,diagonal.x);

        let p1 = center.sub(diagonal90);
        let p2 = center.sub(diagonal);
        let p3 = center.add(diagonal90);
        let p4 = center.add(diagonal);

        this.pushQuadToBuffer(
            p1,p2,p3,p4,
            'circle',
            params
        );
    }
    /**
     * 
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {V3} p3 
     * @param {V3} p4 
     * @param {*} params 
     */
    fillTriangle(
        p1,p2,p3,
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0,
            normal: V3.FRONT
        }
    ) {
        this.pushQuadToBuffer(p1,p2,p3,p3.copy(),'quad',params);
    }
    /**
     * @param {V3} point 
     * @param {V3} size 
     * @param {*} params 
     */
    fillRect(
        point,
        size,
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0
        }
    ) {
        let start = point;
        let end = start.add(size);

        this.pushQuadToBuffer(
            start,
            new V3(start.x,end.y),
            end,
            new V3(end.x,start.y),
            'quad',
            params
        );
    }
    /**
     * 
     * @param {V3} center 
     * @param {V3} size 
     * @param {V3} direction 
     * @param {*} params 
     */
    fillAimedRect(
        center,
        size,
        direction,
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0
        }
    ) {
        direction = direction.normalized();
        let heightDir = direction.scale(size.y);

        let rotDirection = new V3(direction.y,-direction.x);
        let widthDir = rotDirection.scale(size.x);

        let p1 = center.add(widthDir).sub(heightDir);
        let p2 = center.sub(widthDir).sub(heightDir);
        let p3 = center.sub(widthDir).add(heightDir);
        let p4 = center.add(widthDir).add(heightDir);

        this.pushQuadToBuffer(
            p4,p1,p2,p3,
            'quad',
            params
        );
    }
    /**
     * 
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {V3} p3 
     * @param {V3} p4 
     * @param {*} params 
     */
    pushQuadToBuffer(
        p1,p2,p3,p4,
        type,
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0,
            normals: [V3.FRONT,V3.FRONT,V3.FRONT,V3.FRONT],
            uvs: [V3.zero,new V3(0,1),V3.one,new V3(1,0)]
        }
    ) {
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null,
            emission: 0,
            cornerRadius: 0,
            normals: [V3.FRONT,V3.FRONT,V3.FRONT,V3.FRONT],
            uvs: [V3.zero,new V3(0,1),V3.one,new V3(1,0)],
            ...params
        };

        const typeIndex = this.quadTypeIndexes[type];
        
        let textureIndex = this.textureArrayIndexes[params.textureName];
        if(textureIndex===undefined) {
            throw new Error(`Texture ${params.textureName} not found.`);
            textureIndex = -1;
        }

        //assume p1 is the initial tip, of UV [0,0]
        let points = [p1,p2,p3,p4];

        //let UVs = [V3.zero,new V3(0,1),V3.one,new V3(1,0)];
        let topTriIndexes = [0,1,2];
        let bottomTriIndexes = [3,0,2];

        let mappedPoints = points.map((point, index)=>{
            // map pixel position to UV space: [0,size] -> [0,1]
            let uv = params.uvs[index];
            point.u = uv.x;
            point.v = uv.y;
            point.su = params.UVStart.x;
            point.sv = params.UVStart.y;
            point.eu = params.UVScale.x;
            point.ev = params.UVScale.y;
            
            // map pixel position to screen space: [0,size] -> [-1,+1]
            let xyz = point.div(this.size).scale(2).sub(V3.one).mult(new V3(1,-1,1));
            point.x = xyz.x;
            point.y = xyz.y;
            point.z = xyz.z;
            point.w = 1.0;

            point.nx = params.normals[index].x;
            point.ny = params.normals[index].y;
            point.nz = params.normals[index].z;
            point.nw = 1;
            
            return point;
        });

        //passes the same color for each triangle vertex
        let bufferLines = mappedPoints.map((point,index)=>{
            return [
                point.x,
                point.y,
                point.z,
                point.w,
                point.u,
                point.v,
                point.su,
                point.sv,
                point.eu,
                point.ev,
                params.color.r,
                params.color.g,
                params.color.b,
                params.color.a,
                params.cornerRadius,
                typeIndex,
                params.emission,
                textureIndex,
                point.nx,
                point.ny,
                point.nz,
                point.nw
            ];
        });

        topTriIndexes.forEach((index)=>{
            this.vertexBuffer.push(bufferLines[index]);
        });
        bottomTriIndexes.forEach((index)=>{
            this.vertexBuffer.push(bufferLines[index]);
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
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(this.vertexBuffer.flat()),
            this.gl.STATIC_DRAW
        );

        this.vertexBuffer = [];
    }

    //Shader calling

    draw() {
        const gl = this.gl;

        let vertexCount = this.vertexBuffer.flat().length / this.vertexDataSize;
        
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY,this.textureArrayBuffer);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.writeTextureObj.buffer);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.programs.drawTri);
        gl.bindVertexArray(this.drawVertexArray);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glVertexBuffer);

        this.sendVertexBuffer(this.programs.drawTri);
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        [this.writeTextureObj, this.readTextureObj] = [this.readTextureObj, this.writeTextureObj];
        
        this.runShader('blit',{},true);
    }
    postProcess(frame) {
        this.shaderExecutionBuffer.forEach((exec)=>{
            if(exec.function) exec.function();
            else this.runShader(exec.name,exec.params);
        })
        this.shaderExecutionBuffer = [];
        this.runShader('blit',{},true);
    }
    requestPostProcessing(shaderName,shaderParams, fn = ()=>{}) {
        this.shaderExecutionBuffer.push({
            name: shaderName,
            params: shaderParams,
            function: fn
        });
    }
    runShader(name, params = {}, isFinal = false) {
        /** @type {Shader} */
        const shader = this.shaders[name];
        if(shader===undefined) {
            console.log(`Shader ${name} not found.`);
            return;
        }

        params.uResolution = this.size;
        shader.run(this.readTextureObj.texture, isFinal ? null : this.writeTextureObj.buffer, params);
        
        [this.writeTextureObj, this.readTextureObj] = [this.readTextureObj, this.writeTextureObj];
    }
    processToTexture(shaderName, params = {}) {
        let output = new Texture(this.gl,this.size,0);
        
        /** @type {Shader} */
        const shader = this.shaders[shaderName];
        params.uResolution = this.size;
        shader.run(this.swapBuffer.texture, output.buffer, params);
        return output;
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
    async getImageSize(path) {
        const gl = this.gl;

        var imageData = await new Promise((resolve,reject)=>{
            const image = new Image();
            image.onload = () => {
                resolve(image);
            };
            image.src = path;
        })
        const size = new V3(imageData.width,imageData.height);
        return size;
    }

    // Custom shader sequences
    applyWaterDistortion(frame,octaves = 3,strength = 0.01, color = new Color(0.1,0.3,0.8)) {
        const waterColor = color;
        // Wave shader
            // 1. Displacement through Perlin gradient map
        let perlinBuffer = this.processToTexture('perlin',{
            offset: new V3(frame,0).div(this.size),
            octaves: octaves,
            uValueScale: 1
        });
        let edgeBuffer = this.processToTexture('edge',{
            uTexture: perlinBuffer.bindToIndex(3),
            strength: 12
        });
        let blurBuffer = this.processToTexture('blur',{
            uTexture: edgeBuffer.bindToIndex(3),
            uKernelSize: 5
        });

            // 2. Wave edge through looping Perlin edge
        let perlinBuffer2 = this.processToTexture('perlin',{
            offset: new V3(frame / 2,frame).div(this.size),
            scale: new V3(1.5,1.5).invert(),
            octaves: octaves,
            uValueScale: 12
        });

        let edgeBuffer2 = this.processToTexture('edge',{
            uTexture: perlinBuffer2.bindToIndex(3),
            strength: 1
        });

        let blurBuffer2 = this.processToTexture('blur',{
            uTexture: edgeBuffer2.bindToIndex(3),
            uKernelSize: 2
        });

        let scaleBuffer2 = this.processToTexture('colorScale',{
            uTexture: blurBuffer2.bindToIndex(3),
            uColor: Color.white.scale(1)
        });

        let dummyBuffer = this.processToTexture('tint',{
            uOffset: Color.white
        });

        // 3. Unify

        let tintBuffer = this.processToTexture('tint',{
            uTexture: perlinBuffer.bindToIndex(3),
            uScale: Color.white,
            uOffset: waterColor
        });

        this.runShader('tint',{
            uScale: Color.white,
            uOffset: Color.white.scale(0.1)
        });

        this.runShader('mist',{
            uNoise: tintBuffer.bindToIndex(4),
            strength: 1.5
        });
        
        this.runShader('mergeTexture',{
            uTexture: this.readTextureObj,
            uScale: dummyBuffer.bindToIndex(3),
            uOffset: scaleBuffer2.bindToIndex(4),
            strength: 0.25
        })

        this.runShader('displace',{
            uDisplace: blurBuffer.bindToIndex(4),
            strength: V3.one.scale(strength)
        });
        blurBuffer.destroy();

        this.runShader('blit',{
            uTexture: this.readTextureObj
        });
        
        edgeBuffer.destroy();
        perlinBuffer2.destroy();
        edgeBuffer2.destroy();
        blurBuffer2.destroy();
        perlinBuffer.destroy();
        tintBuffer.destroy();
        dummyBuffer.destroy();
        scaleBuffer2.destroy();
    }
    applyPsychodelicDistortion(frame,strength = 0.01, opacity = 0.1) {
        let perlin = this.processToTexture('perlin',{
            offset: V3.zero,
            octaves: 4,
            uValueScale: 4,
            uValueOffset: frame / 240
        });
        let tuneChannels = this.processToTexture('tint',{
            uTexture: perlin.bindToIndex(3),
            uScale: new Color(1,0,0),
            uOffset: new Color(0,1,0.5)
        });
        let hsl = this.processToTexture('hsl',{
            uTexture: tuneChannels.bindToIndex(3)
        })
        let tint = this.processToTexture('tint',{
            uTexture: hsl.bindToIndex(3),
            uScale: Color.white.scale(opacity),
            uOffset: Color.white.scale(1-opacity)
        })
        
        this.runShader('tint',{
            uOffset: Color.white.scale(0.2)
        });

        this.runShader('displace',{
            uDisplace: perlin,
            strength: strength
        });

        this.runShader('mist',{
            uNoise: tint.bindToIndex(3)
        });

        perlin.destroy();
        tuneChannels.destroy();
        hsl.destroy();
        tint.destroy();
    }
    doggoJumpscare(frame) {
        let wave = (Math.sin(frame));

        let fadeOut = this.processToTexture('tint',{
            uOffset: Color.white.scale(wave)
        });

        let shifted = this.processToTexture('mergeTexture',{
            uTexture: this.readTextureObj,
            uScale: fadeOut.bindToIndex(3),
            uOffset: this.textureBuffers['hurt-doggo'].bindToIndex(4),
            strength: (1-wave)
        })
        this.runShader('blit',{
            uTexture: shifted
        })
        fadeOut.destroy();
        shifted.destroy();
    }
    cloudEffect(frame) {
        let rad1 = 0.25;
        let padd1 = rad1 * 0.2;

        let circle = this.processToTexture('radialDist',{
            uPos: new V3(0.5,0.5),
            uRadius: rad1,
            uPadding: padd1,
            uExponent: 1
        });
        let circle2 = this.processToTexture('radialDist',{
            uPos: new V3(0.3,0.4),
            uRadius: rad1 * 0.5,
            uPadding: padd1,
            uExponent: 1
        });
        let circleEnd = this.processToTexture('mergeTexture',{
            uTexture: circle.bindToIndex(3),
            uScale: circle.bindToIndex(3),
            uOffset: circle2.bindToIndex(4),
            strength: 1
        });

        let perlin = this.processToTexture('perlin',{
            octaves: 6,
            scale: new V3(4,6),
            offset: new V3(0.3,frame / 240),
            uValueScale: 0.5,
            uValueOffset: 0.3
        });

        let cloud = this.processToTexture('mist',{
            uTexture: circleEnd.bindToIndex(3),
            uNoise: perlin.bindToIndex(4)
        });

        this.runShader('blit',{uTexture: cloud});

        circle.destroy();
        circle2.destroy();
        circleEnd.destroy();
        perlin.destroy();
        cloud.destroy();
    }
}

export class Texture {
    /** @type {WebGL2RenderingContext} */
    gl;
    index;
    /** @type {WebGLTexture} */
    texture;
    /** @type {WebGLFramebuffer} */
    buffer;
    /** @type {WebGLRenderbuffer} */
    depthBuffer;
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {V3} size 
     * @param {Number} index 
     */
    constructor(gl, size, index = 0) {
        this.gl = gl;
        this.size = size;
        this.index = index;
        
        this.texture = gl.createTexture();
        this.buffer = gl.createFramebuffer();

        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        // texture params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            size.x,
            size.y,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.texture,
            0
        );

        this.depthBuffer = gl.createRenderbuffer();

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);

        gl.renderbufferStorage(
            gl.RENDERBUFFER,
            gl.DEPTH_COMPONENT16,
            size.x,
            size.y
        );

        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            this.depthBuffer
        );
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
    static async fromPath(gl, url) {
        const imageData = await new Promise((resolve,reject)=>{
            const image = new Image();
            image.onload = () => {
                resolve(image);
            };
            image.src = url;
        })
        const size = new V3(imageData.width,imageData.height);

        const texture = new Texture(gl,size);
        texture.setData(imageData);

        return texture;
    }
    bindToIndex(index) {
        this.index = index;

        this.gl.activeTexture(this.gl.TEXTURE0 + index);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        return this;
    }
    setData(image) {
        const gl = this.gl;
        this.imageData = image;
    
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.texImage2D(
            gl.TEXTURE_2D, 
            0, 
            gl.RGBA, 
            gl.RGBA, 
            gl.UNSIGNED_BYTE,
            image
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    destroy() {
        this.gl.deleteTexture(this.texture);
        this.gl.deleteFramebuffer(this.buffer);
        this.gl.deleteRenderbuffer(this.depthBuffer);
    }
}