#version 300 es

precision mediump float;

uniform sampler2D uTexture;
uniform vec4 offset;
uniform vec4 tintColor;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 base = texture(uTexture, vUV + vec2(offset));
    fragColor = base + tintColor;
}