#version 300 es

precision mediump float;

uniform sampler2D uTexture;

in vec4 vCol;
in float vType;
in float vRadius;

in vec2 vUV;
out vec4 fragColor;

void main() {
    // tri
    if(vType == 0.0) {
        if(vUV.x + vUV.y > 1.0) discard;
        fragColor = vCol;
    }
    // quad
    if(vType == 1.0) {
        fragColor = vCol;
    }
    // circle
    if(vType == 2.0) {
        vec2 norm = vUV * 2.0 - 1.0;
        if(length(norm) > 1.0) discard;
        fragColor = vCol;
    }
}