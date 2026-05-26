#version 300 es

precision mediump float;

uniform sampler2D uTexture;
uniform float strength;

in vec2 vUV;
out vec4 fragColor;

void main() {
    float zoom = 1.0;
    vec2 mappedSample = (vUV - 0.5) * 2.0;

    float mag = length(mappedSample);
    vec2 calc = pow(mag,strength) * mappedSample / zoom;
    vec2 endSamplePos = (calc + 1.0) / 2.0;

    vec4 final = texture(uTexture, endSamplePos);
    bool outOfBounds = 
        endSamplePos.x < 0.0
        || endSamplePos.y < 0.0
        || endSamplePos.x > 1.0
        || endSamplePos.y > 1.0
    ;
    if(outOfBounds) final = vec4(vec3(0.05),1.0);

    fragColor = final;
}