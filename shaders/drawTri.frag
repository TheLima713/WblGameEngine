precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;
varying vec4 vCol;

void main() {
    vec4 rgColor = vec4(vUV,0.0,0.0);
    gl_FragColor = vCol;
    //gl_FragColor = rgColor;
    //gl_FragColor = texture2D(uTexture, vUV);
}