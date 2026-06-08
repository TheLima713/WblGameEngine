#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uNoise;
uniform float strength;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 pixel = texture(uTexture,vUV);
    vec4 noise = texture(uNoise,vUV);

    fragColor = pixel * noise * strength;
}