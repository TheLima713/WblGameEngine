precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main() {
    vec4 base = texture2D(uTexture, vUV);
    vec4 white = vec4(1.0,1.0,1.0,1.0); 
    gl_FragColor = vec4(
        1.0 - base.rgb,
        base.a
    );
}