#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform vec4 uResolution;
uniform vec4 uPos;
uniform float uRadius;
uniform float uPadding;
uniform float uExponent;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec2 ratio = normalize(vec2(uResolution));
    vec2 dir = vUV * ratio - vec2(uPos) * ratio;
    float dist = 1.0 - clamp((length(dir) - uPadding)/uRadius,0.0,1.0);
    fragColor = vec4(vec3(pow(dist,uExponent)),1.0);
}