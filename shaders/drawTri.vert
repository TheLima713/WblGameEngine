#version 300 es

in vec4 aPos;
in vec2 aUV;
in vec4 aCol;
in float aType;
in float aRadius;
in float aEmission;
in float aTextureIndex;

out vec2 vUV;
out vec4 vCol;
out float vType;
out float vRadius;
out float vEmission;
out float vTextureIndex;

void main() {
    vUV = aUV;
    vCol = aCol;
    vType = aType;
    vRadius = aRadius;
    vEmission = aEmission;
    vTextureIndex = aTextureIndex;

    gl_Position = aPos;
}