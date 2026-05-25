precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;
varying vec4 vCol;
varying float vType;
varying float vRadius;

void main() {
    // tri
    if(vType == 0.0) {
        if(vUV.x + vUV.y > 1.0) discard;
        gl_FragColor = vCol;
    }
    // quad
    if(vType == 1.0) {
        gl_FragColor = vCol;
    }
    // circle
    if(vType == 2.0) {
        vec2 norm = vUV * 2.0 - 1.0;
        if(length(norm) > 1.0) discard;
        gl_FragColor = vCol;
    }
}