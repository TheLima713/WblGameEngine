#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform vec4 subColor;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec4 base = texture(uTexture, vUV);
    vec3 final = abs(subColor.rgb - base.rgb);
    fragColor = vec4(
        final,
        base.a
    );
}
