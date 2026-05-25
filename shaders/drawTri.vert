attribute vec4 aPos;
attribute vec2 aUV;
attribute vec4 aCol;
attribute float aType;
attribute float aRadius;

varying vec2 vUV;
varying vec4 vCol;
varying float vType;
varying float vRadius;

void main() {
    vUV = aUV;
    vCol = aCol;
    vType = aType;
    vRadius = aRadius;

    gl_Position = aPos;
}