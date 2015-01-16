fragment:
    uniform sampler2D source;
    float textureIntensity(vec2 coord){
        vec2 packedIntensity = texture2D(source, coord).rg;
        return (packedIntensity.r + packedIntensity.g*256.0)/257.0;
    }

