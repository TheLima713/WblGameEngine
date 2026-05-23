precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main() {
    float stripWidth = 3.0;
    vec4 base = texture2D(uTexture, vUV);
    float strip = mod(gl_FragCoord.y,2.0 * stripWidth);

    vec4 final = base;
    if(strip < stripWidth) {
        final = vec4(0.0,0.0,0.0,1.0);
    }
    gl_FragColor = final;
}