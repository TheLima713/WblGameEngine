#version 300 es

in vec4 aPos;
out vec4 vPos;

in vec2 aUV;
out vec2 vUV;

in vec4 aNormal;
out vec4 vNormal;

in vec2 aUVStart;
out vec2 vUVStart;

in vec2 aUVScale;
out vec2 vUVScale;

in vec4 aCol;
out vec4 vCol;

in float aType;
out float vType;

in float aRadius;
out float vRadius;

in float aEmission;
out float vEmission;

in float aTextureIndex;
out float vTextureIndex;

void main() {
    vPos = aPos;
    vUV = vec2(aUV.x,1.0-aUV.y);
    vNormal = aNormal * vec4(-1.0,-1.0,1.0,1.0);
    vUVStart = aUVStart;
    vUVScale = aUVScale;

    vCol = aCol;
    vType = aType;
    vRadius = aRadius;
    vEmission = aEmission;
    vTextureIndex = aTextureIndex;

    gl_Position = aPos;
}