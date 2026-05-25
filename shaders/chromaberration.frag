precision mediump float;

uniform sampler2D uTexture;
uniform float offset;

varying vec2 vUV;

void main() {
    vec2 offsetPos = vec2(offset,0.0);

    vec4 rCol = texture2D(uTexture,vUV +  1.0 * offsetPos);
    vec4 gCol = texture2D(uTexture,vUV);
    vec4 bCol = texture2D(uTexture,vUV -  1.0 * offsetPos);

    vec4 final = vec4(rCol.r,gCol.g,bCol.b,1.0);
    gl_FragColor = final;
}