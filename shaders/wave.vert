attribute vec2 aPos;
attribute vec2 aUV;

varying vec2 vUV;

void main() {
    vUV = vec2(aUV.x, 1.0 - aUV.y);

    gl_Position = vec4(aPos,0.0,1.0);
}