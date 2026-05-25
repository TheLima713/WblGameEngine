precision mediump float;

uniform sampler2D uTexture;
uniform vec4 subColor;

varying vec2 vUV;

void main() {
    vec4 base = texture2D(uTexture, vUV);
    vec3 final = abs(subColor.rgb - base.rgb);
    gl_FragColor = vec4(
        final,
        base.a
    );
}