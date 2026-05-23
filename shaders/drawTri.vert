attribute vec4 aPos;
attribute vec2 aUV;
attribute vec4 aCol;

varying vec2 vUV;
varying vec4 vCol;

void main() {
    vUV = aUV;
    vCol = aCol;

    gl_Position = aPos;
}