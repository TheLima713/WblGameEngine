#version 300 es

in vec4 aPos;
in vec2 aUV;

out vec2 vUV;

void main() {
    vUV = aUV;

    gl_Position = aPos;
}