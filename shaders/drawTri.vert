#version 300 es

in vec4 aPos;
in vec2 aUV;
in vec2 aUVStart;
in vec2 aUVScale;

in vec4 aCol;
in float aType;
in float aRadius;
in float aEmission;
in float aTextureIndex;

out vec4 vPos;
out vec2 vUV;
out vec2 vUVStart;
out vec2 vUVScale;

out vec4 vCol;
out float vType;
out float vRadius;
out float vEmission;
out float vTextureIndex;

void main() {
    vPos = aPos;
    vUV = vec2(aUV.x,1.0-aUV.y);
    vUVStart = aUVStart;
    vUVScale = aUVScale;
    vCol = aCol;
    vType = aType;
    vRadius = aRadius;
    vEmission = aEmission;
    vTextureIndex = aTextureIndex;

    gl_Position = vec4(vec2(aPos),0.0,1.0);
}