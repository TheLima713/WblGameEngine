precision mediump float;

uniform sampler2D uTexture;
uniform vec4 tintColor;

varying vec2 vUV;

void main() {
    vec4 base = texture2D(uTexture, vUV);
    gl_FragColor = base + tintColor;
}