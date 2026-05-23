precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main() {
    float zoom = 1.0;
    float warp = 0.5;
    vec2 mappedSample = (vUV - 0.5) * 2.0;

    float mag = length(mappedSample);
    vec2 calc = pow(mag,warp) * mappedSample / zoom;
    vec2 endSamplePos = (calc + 1.0) / 2.0;

    vec4 final = texture2D(uTexture, endSamplePos);
    //if(mag > 1.0 + warp) final = vec4(vec3(0.01),1.0);

    gl_FragColor = final;
}