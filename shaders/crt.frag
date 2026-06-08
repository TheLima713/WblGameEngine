#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform float stripWidth;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 base = texture(uTexture, vUV);
    float strip = mod(gl_FragCoord.y,2.0 * stripWidth);

    vec4 final = base;
    if(strip < stripWidth) {
        final = vec4(0.0,0.0,0.0,1.0);
    }
    fragColor = final;
}