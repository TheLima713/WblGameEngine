#version 300 es

in vec4 aPos;
in vec2 aUV;
in vec2 aUVStart;
in vec2 aUVEnd;

in vec4 aCol;
in float aType;
in float aRadius;
in float aEmission;
in float aTextureIndex;

out vec2 vUV;
out vec2 vUVStart;
out vec2 vUVEnd;

out vec4 vCol;
out float vType;
out float vRadius;
out float vEmission;
out float vTextureIndex;

void main() {
    vUV = vec2(aUV.x,1.0-aUV.y);
    vUVStart = aUVStart;
    vUVEnd = aUVEnd;
    vCol = aCol;
    vType = aType;
    vRadius = aRadius;
    vEmission = aEmission;
    vTextureIndex = aTextureIndex;

    gl_Position = aPos;
}