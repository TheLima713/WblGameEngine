#version 300 es

precision mediump float;

uniform sampler2D uTexture;
uniform vec4 uResolution;
uniform vec4 uPos;
uniform float uRadius;
uniform float uWidth;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec2 ratio = normalize(vec2(uResolution));

    vec2 dir = vUV * ratio - vec2(uPos) * ratio;

    vec2 ringCenter = normalize(dir) * uRadius;
    vec2 ringDir = dir - ringCenter;

    vec2 pos = vUV;

    if(length(ringDir) < uWidth) {
        float val = 1.0 - length(ringDir) / uWidth;
        pos = vUV + ringDir * val;
    }
    fragColor = texture(uTexture, pos);
}