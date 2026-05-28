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
    
    vec4 pixel = texture(uTexture,vUV + shift);
    vec4 waterSpot = pixel * (1.0 + length(shift));//mix(pixel,vec4(1.0),length(shift));

    vec4 final = pixel;

    fragColor = final;
}