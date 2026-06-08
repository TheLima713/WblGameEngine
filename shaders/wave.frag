#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform float strength;
uniform float offset;
uniform float frequency;

in vec2 vUV;
out vec4 fragColor;

void main() {
    float shift = strength * sin(offset + frequency * (vUV.x + sin(vUV.y / 10.0)));
    vec2 shiftedPos = vec2(vUV.x + shift, vUV.y + shift);
    fragColor = texture(uTexture, shiftedPos);
}