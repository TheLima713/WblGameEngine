#version 300 es

in vec4 aPos;
in vec2 aUV;
in vec4 aCol;
in float aType;
in float aRadius;

out vec2 vUV;
out vec4 vCol;
out float vType;
out float vRadius;

void main() {
    vUV = aUV;
    vCol = aCol;
    vType = aType;
    vRadius = aRadius;

    gl_Position = aPos;
}