precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main() {
    vec2 offset = vec2(0.002,0.0);
    vec4 base = texture2D(uTexture, vUV);

    vec4 left = texture2D(uTexture, vUV - offset);
    vec4 middle = texture2D(uTexture, vUV);
    vec4 right = texture2D(uTexture, vUV + offset);

    vec4 final = vec4(left.r,middle.g,right.b,1.0);
    gl_FragColor = final;
}