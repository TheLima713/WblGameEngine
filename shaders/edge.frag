#version 300 es

precision highp float;

uniform vec4 uResolution;
uniform vec4 uOrigSize;
uniform sampler2D uTexture;
uniform float strength;
uniform float uAltMask;

in vec2 vUV;
out vec4 fragColor;


vec4 getNbor(vec2 offset) {
    vec2 one = 1.0 / vec2(uOrigSize);

    return texture(uTexture,vUV + one * offset);
}

void main() {
    mat3x3 edgeKernelHoriz = mat3x3(
        vec3(-1.0, 0.0, 1.0),
        vec3(-2.0, 0.0, 2.0),
        vec3(-1.0, 0.0, 1.0)
    );
    mat3x3 edgeKernelVert = mat3x3(
        vec3(-1.0, -2.0, -1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(1.0, 2.0, 1.0)
    );

    vec4 pixel = texture(uTexture,vUV);
    
    vec2 accum = vec2(0.0);
    for(int j = -1; j < 2; j++) {
        for(int i = -1; i < 2; i++) {
            if(i==0 && j==0) continue;

            vec4 nbor = getNbor(vec2(i,j));

            float valDiff = length(nbor.xyz) - length(pixel.xyz);

            accum += vec2(
                valDiff * edgeKernelVert[j][i],
                valDiff * edgeKernelHoriz[j][i]
            );
        }
    }

    accum = (accum + 1.0) / 2.0;

    vec4 final = vec4(accum,0.0,1.0) * strength;

    if(uAltMask == 1.0) {
        final = vec4(accum.y,accum.x,0.0,1.0) * strength;
    }

    fragColor = final;
}