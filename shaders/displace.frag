#version 300 es

precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uDisplace;

uniform float strength;
uniform vec4 offset;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 noise = texture(uDisplace,vUV);
    vec2 shift = vec2((noise + offset) * strength);
    
    vec4 final = texture(uTexture,vUV + shift);

    fragColor = final;
}