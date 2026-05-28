#version 300 es

precision mediump float;

uniform vec4 uResolution;
uniform sampler2D uTexture;
uniform vec4 uColor;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 pixel = texture(uTexture,vUV);
    vec4 final = length(pixel.xyz) * uColor;
    
    fragColor = vec4(final.xyz,pixel.a);
}