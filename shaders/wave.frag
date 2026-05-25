precision mediump float;

uniform sampler2D uTexture;
uniform float strength;
uniform float offset;
uniform float frequency;

varying vec2 vUV;

void main() {
    float shift = strength * sin(offset + frequency * (vUV.x + sin(vUV.y / 10.0)));
    vec2 shiftedPos = vec2(vUV.x + shift, vUV.y + shift);
    gl_FragColor = texture2D(uTexture, shiftedPos);
}