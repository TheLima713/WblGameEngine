#version 300 es

precision mediump float;

uniform sampler2D uTexture;
uniform mediump sampler2DArray uTextureArray;

in vec2 vUV;
in vec4 vCol;
in float vType;
in float vRadius;
in float vEmission;
in float vTextureIndex;

out vec4 fragColor;

void main() {
    vec4 textureArrayColor = texture(uTextureArray,vec3(vUV,vTextureIndex));
    // tri
    if(vType == 0.0) {
        if(vUV.x + vUV.y > 1.0) discard;
    }
    // quad
    if(vType == 1.0) {
    }
    // circle
    if(vType == 2.0) {
        vec2 norm = vUV * 2.0 - 1.0;
        if(length(norm) > 1.0) discard;
    }
    //textured quad
    fragColor = vCol;
    if(vTextureIndex>=0.0) fragColor = textureArrayColor;
}