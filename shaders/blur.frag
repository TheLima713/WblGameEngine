#version 300 es

precision mediump float;

uniform vec4 uResolution;
uniform sampler2D uTexture;
uniform float uKernelSize;

in vec2 vUV;
out vec4 fragColor;


vec4 getNbor(vec2 offset) {
    vec2 one = 1.0 / vec2(uResolution);

    return texture(uTexture,vUV + one * offset);
}

void main() {
    int iuks = int(uKernelSize);
    int kernelLength = (iuks * 2 + 1);

    vec4 pixel = texture(uTexture,vUV);
    
    vec4 accum = vec4(0.0);
    for(int j = -iuks; j <= iuks; j++) {
        for(int i = -iuks; i <= iuks; i++) {
            vec4 nbor = getNbor(vec2(i,j));
            float dist = float(abs(i) + abs(j));

            accum += nbor;
        }
    }

    vec4 final = accum / pow(float(kernelLength),2.0);

    fragColor = final;
}