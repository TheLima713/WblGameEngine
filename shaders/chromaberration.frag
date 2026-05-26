#version 300 es

precision mediump float;

uniform sampler2D uTexture;
uniform float offset;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec2 offsetPos = vec2(offset,0.0);

    vec4 rCol = texture(uTexture,vUV +  1.0 * offsetPos);
    vec4 gCol = texture(uTexture,vUV);
    vec4 bCol = texture(uTexture,vUV -  1.0 * offsetPos);

    vec4 final = vec4(rCol.r,gCol.g,bCol.b,1.0);
    fragColor = final;
}