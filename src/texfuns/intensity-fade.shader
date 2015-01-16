fragment:
    uniform float fadeFactor;
    uniform sampler2D source1, source2;
    float textureIntensity(vec2 coord){
        vec2 packedIntensity1 = texture2D(source1, coord).rg;
        float intensity1 = (packedIntensity1.r + packedIntensity1.g*256.0)/257.0;
        
        vec2 packedIntensity2 = texture2D(source2, coord).rg;
        float intensity2 = (packedIntensity2.r + packedIntensity2.g*256.0)/257.0;

        return fadeFun(intensity1, intensity2, fadeFactor, coord);
    }

