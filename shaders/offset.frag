precision mediump float;

uniform sampler2D uTexture;
uniform vec3 offset;

varying vec2 vUV;

void main() {
    vec4 base = texture2D(uTexture, vUV + vec2(offset));
    gl_FragColor = vec4(base);
}