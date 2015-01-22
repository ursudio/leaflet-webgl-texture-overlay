fragment:
    uniform float mixFactor;
    uniform sampler2D source0, source1;
    float textureIntensity(vec2 coord, vec2 size){
        float intensity0 = texture2D(source0, coord).r;
        float intensity1 = texture2D(source1, coord).r;
        return fadeFun(intensity0, intensity1, mixFactor, coord, size);
    }

