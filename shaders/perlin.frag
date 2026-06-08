#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform vec4 offset;
uniform vec4 scale;
uniform float octaves;
uniform float uValueScale;
uniform float uValueOffset;

in vec2 vUV;
out vec4 fragColor;

// Interpolation for perlin
vec2 fade(vec2 t)
{
    return t * t * t *
        (t * (t * 6.0 - 15.0) + 10.0);
}

float rand(vec2 p) {
    return fract(
        sin(
            dot(
                p,
                vec2(12.9898,78.233)
            )
        )
        * 43758.5453123
    );
}

vec2 angToVec(float ang) {
    return vec2(
        cos(ang),
        sin(ang)
    );
}

vec2 getGradient(vec2 gridPoint) {
    float angle = 6.283 * rand(gridPoint);
    return angToVec(angle);
}

float getGradientDot(vec2 gridPoint, vec2 fracPoint) {
    vec2 grad = getGradient(gridPoint);
    vec2 diff = fracPoint - gridPoint;
    return dot(diff, grad);
}

float getOctaveValue(vec2 fracPoint) {
    vec2 floorPoint = floor(fracPoint);
    vec2 normPoint = fracPoint - floorPoint;
    vec2 ceilPoint = ceil(fracPoint);

    vec2 point00 = floorPoint;
    vec2 point01 = vec2(floorPoint.x, ceilPoint.y);
    vec2 point10 = vec2(ceilPoint.x, floorPoint.y);
    vec2 point11 = ceilPoint;

    float dot00 = getGradientDot(point00, fracPoint);
    float dot01 = getGradientDot(point01, fracPoint);
    float dot10 = getGradientDot(point10, fracPoint);
    float dot11 = getGradientDot(point11, fracPoint);

    vec2 f = fade(normPoint);
    float dot0 = mix(dot00, dot10, f.x);//smoothstep(dot00,dot10,normPoint.x);
    float dot1 = mix(dot01, dot11, f.x);

    float dot = mix(dot0, dot1, f.y);

    return dot;
}

float getPerlinValue(vec2 fracPoint, float octaves, vec2 scale, vec2 offset) {
    
    float value = 0.0;

    float octFrequency = 1.0;
    float octScale = 1.0;
    for(float i = 1.0; i <= octaves; i++) {
        vec2 pos = octFrequency * (fracPoint * scale + offset);
        
        value += getOctaveValue(pos) * (octScale);
        octFrequency *= 2.0;
        octScale /= 2.0;
    }
    return value;
}

void main() {

    vec2 offset = vec2(offset.x, 1.0 - offset.y);

    vec2 centered = vUV * 2.0 - 1.0;
    float val = getPerlinValue(
        centered,
        octaves,
        vec2(scale),
        offset
    );
    float map = (val + 1.0) / 2.0;
    map = fract(map * uValueScale + uValueOffset);
    
    vec4 final = vec4(vec3(map), 1.0);
    fragColor = final;
}