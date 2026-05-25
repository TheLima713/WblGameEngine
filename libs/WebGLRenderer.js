import Color from "./Color.js";
import ShaderManager from "./ShaderManager.js";
import V3 from "./V3.js";

export default class WebGLRenderer {
    size = new V3(0,0);
    offset = new V3(0,0);
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {WebGL2RenderingContext} */
    gl;
    /** @type {ShaderManager} */
    shaderManager; 
    programs = {
        drawTri: null
    };

    /** @type {WebGLVertexArrayObject} */
    drawVertexArray;
    glVertexBuffer;
    glTextureBuffer;

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
        
        this.bindBuffers();
        await this.loadDrawTriShader();
        //await this.shaderManager.loadShaders();

        this.createWriteBuffer();

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
        
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
    }
    createWriteBuffer() {
        const gl = this.gl;

        this.writeTexture = gl.createTexture();
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

        this.writeBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.writeBuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.writeTexture,
            0
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    bindBuffers() {
        this.glVertexBuffer = this.gl.createBuffer();
        this.glTextureBuffer = this.gl.createTexture();
        this.gl.bindBuffer(
            this.gl.ARRAY_BUFFER,
            this.glVertexBuffer
        );
        this.gl.bindTexture(
            this.gl.TEXTURE_2D,
            this.glTextureBuffer
        );
    }
    async loadDrawTriShader() {
        const gl = this.gl;

        const program = gl.createProgram();
        
        let vertSource = await this.getShaderSource(`../shaders/drawTri.vert`);
        let vertShader = this.compileShader(gl.VERTEX_SHADER,vertSource);
        gl.attachShader(program, vertShader);

        let fragSource = await this.getShaderSource(`../shaders/drawTri.frag`);        
        let fragShader = this.compileShader(gl.FRAGMENT_SHADER,fragSource);
        gl.attachShader(program, fragShader);
        
        gl.linkProgram(program);
        
        this.drawVertexArray = gl.createVertexArray();
        gl.bindVertexArray(this.drawVertexArray);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glVertexBuffer);

        this.addVertexAttribute(program,'aPos',4,0);
        this.addVertexAttribute(program,'aCol',4,4);
        this.addVertexAttribute(program,'aUV',2,8);
        this.addVertexAttribute(program,'aRadius',1,10);
        this.addVertexAttribute(program,'aType',1,11);

        this.programs.drawTri = program;

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
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
            new V3(0,1),
            new V3(0,0),
            new V3(1,0),
            new V3(1,1)
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

    //Shader calling

    draw() {
        const gl = this.gl;

        let vertexCount = this.vertexBuffer.length / this.vertexDataSize;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.programs.drawTri);
        gl.bindVertexArray(this.drawVertexArray);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glVertexBuffer);

        this.sendVertexBuffer(this.programs.drawTri);
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
    addVertexAttribute(program,name,size,offset) {
        const aAtrib = this.gl.getAttribLocation(program, name);
        this.gl.vertexAttribPointer(
            aAtrib,                     // memory address? idk
            size,                       // read this many values per vertex
            this.gl.FLOAT,              // values are floats (4 bytes each)
            false,                      // dont normalize
            4 * this.vertexDataSize,    // each vertex occupies this size, in bytes
            4 * offset                  // for each vertex, start reading at this byte
        );
        this.gl.enableVertexAttribArray(aAtrib);
    }
    postProcess() {
        //this.shaderManager.runShader('crt', this.writeTexture);
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