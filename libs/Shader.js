import Color from "./Color.js";
import V3 from "./V3.js";

export default class Shader {
    /** @type {WebGL2RenderingContext} */
    gl;
    /** @type {WebGLProgram} */
    program;
    /** @type {WebGLVertexArrayObject} */
    vao;

    name;
    params;

    constructor(gl, name, vertSrc, fragSrc, params = {}) {
        this.gl     = gl;
        this.name   = name;
        this.params = params;

        this.program = this._createProgram(vertSrc, fragSrc);
        this.vao     = this._createVAO();
    }

    // -------------------------
    // Static factory
    // -------------------------

    static async load(gl, name, params = {}) {
        const [vertSrc, fragSrc] = await Promise.all([
            Shader._fetch(`../shaders/${name}.vert`),
            Shader._fetch(`../shaders/${name}.frag`),
        ]);
        return new Shader(gl, name, vertSrc, fragSrc, params);
    }

    static async _fetch(path) {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Shader not found: ${path} (${res.status})`);
        return res.text();
    }

    // -------------------------
    // Run
    // -------------------------

    run(inputTexture, outputFramebuffer, overrideParams = {}) {
        const gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        // Bind input texture to unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.uniform1i(gl.getUniformLocation(this.program, 'uTexture'), 0);

        const params = { ...this.params, ...overrideParams };
        Object.entries(params).forEach(([key, value]) => this._setUniform(key, value));

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
    }

    // -------------------------
    // Private setup
    // -------------------------

    _createProgram(vertSrc, fragSrc) {
        const gl = this.gl;

        const vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertSrc);
        gl.compileShader(vert);
        if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS))
            throw new Error(`[${this.name}] Vert error: ${gl.getShaderInfoLog(vert)}`);

        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragSrc);
        gl.compileShader(frag);
        if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS))
            throw new Error(`[${this.name}] Frag error: ${gl.getShaderInfoLog(frag)}`);

        const program = gl.createProgram();
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error(`[${this.name}] Link error: ${gl.getProgramInfoLog(program)}`);

        gl.deleteShader(vert);
        gl.deleteShader(frag);

        return program;
    }

    _createVAO() {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vertices = new Float32Array([
            // x  y  u  v
            -1, -1,  0,  0,
             1, -1,  1,  0,
            -1,  1,  0,  1,
            -1,  1,  0,  1,
             1, -1,  1,  0,
             1,  1,  1,  1,
        ]);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPos = gl.getAttribLocation(this.program, 'aPos');
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(aPos);

        const aUV = gl.getAttribLocation(this.program, 'aUV');
        gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8);
        gl.enableVertexAttribArray(aUV);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vao;
    }

    _setUniform(name, value) {
        const gl  = this.gl;
        const loc = gl.getUniformLocation(this.program, name);
        if (loc === null) return;

        if (typeof value === 'number') {
            gl.uniform1f(loc, value);
        } else if (value instanceof Color) {
            gl.uniform4f(loc, value.r, value.g, value.b, value.a);
        } else if (value instanceof V3) {
            gl.uniform4f(loc, value.x, value.y, value.z, 0.0);
        }
    }

    // -------------------------
    // Cleanup
    // -------------------------

    destroy() {
        this.gl.deleteProgram(this.program);
        this.gl.deleteVertexArray(this.vao);
    }
}