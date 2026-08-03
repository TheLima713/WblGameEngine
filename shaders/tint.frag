#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform vec4 uScale;
uniform vec4 uOffset;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 base = texture(uTexture, vUV);
    vec4 pixel = fract((base * uScale) + uOffset);

    fragColor = pixel;
}