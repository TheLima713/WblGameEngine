#version 300 es

precision mediump float;

uniform sampler2D uTexture;
uniform float stripWidth;

in vec2 vUV;
out vec4 fragColor;

// Função auxiliar para converter HUE para RGB
vec3 hue2rgb(float hue) {
    float r = abs(hue * 6.0 - 3.0) - 1.0;
    float g = 2.0 - abs(hue * 6.0 - 2.0);
    float b = 2.0 - abs(hue * 6.0 - 4.0);
    return clamp(vec3(r, g, b), 0.0, 1.0);
}

// Converte HSL (vec3) para RGBA (vec4)
vec4 hsl2rgb(vec4 hsl) {
    vec3 rgb = hue2rgb(hsl.x);
    float c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
    vec3 finalColor = (rgb - 0.5) * c + hsl.z;
    return vec4(finalColor, 1.0);
}

void main() {
    vec4 base = texture(uTexture, vUV);

    vec4 final = hsl2rgb(base);
    fragColor = final;
}