precision mediump float;

uniform sampler2D uTexture;
uniform float offset;

varying vec2 vUV;

void main() {
    vec2 offsetPos = vec2(offset,0.0);
    vec4 base = texture2D(uTexture, vUV);

    vec4 left = texture2D(uTexture, vUV - offsetPos);
    vec4 middle = texture2D(uTexture, vUV);
    vec4 right = texture2D(uTexture, vUV + offsetPos);

    vec4 final = vec4(left.r,middle.g,right.b,1.0);
    gl_FragColor = final;
}