#version 300 es

precision mediump float;

uniform vec4 uResolution;
uniform sampler2D uTexture;
uniform sampler2D uScale;
uniform sampler2D uOffset;
uniform float strength;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 pixel = texture(uTexture,vUV);
    vec4 scale = texture(uScale,vUV);
    vec4 offset = texture(uOffset,vUV);

    vec4 final = pixel * scale + offset * strength;
    
    fragColor = final;
}