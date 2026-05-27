#version 300 es

precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uPerlin;
uniform float strength;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 pixel = texture(uTexture,vUV);
    vec4 noise = texture(uPerlin,vUV);

    fragColor = pixel * noise * strength;
}