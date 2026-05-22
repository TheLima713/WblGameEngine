precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main() {
    vec4 base = texture2D(uTexture, vUV);
    float strip = mod(gl_FragCoord.y,4.0);

    vec4 final = base;
    if(strip < 2.0) {
        final = vec4(0.0,0.0,0.0,1.0);
    }
    gl_FragColor = final;
}