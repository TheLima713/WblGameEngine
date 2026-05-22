precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main() {
    vec4 base = texture2D(uTexture, vUV);
    vec4 tint = vec4(0.5,0.0,0.0,0.0);
    gl_FragColor = base + tint;
}