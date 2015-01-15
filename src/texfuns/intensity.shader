fragment:
    float textureIntensity(sampler2D source, vec2 coord){
        vec2 packedIntensity = texture2D(source, coord).rg;
        float intensityScalar = packedIntensity.r/255.0 + packedIntensity.g;
        return intensityScalar;
    }

