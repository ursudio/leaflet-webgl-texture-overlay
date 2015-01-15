fragment:
    vec4 texture2DRect(sampler2D source, vec2 coord, vec2 size){
        return vec4(textureIntensity(source, (coord+0.5)/size));
        //vec2 packedIntensity = texture2D(source, (coord+0.5)/size).rg;
        //float intensityScalar = packedIntensity.r/255.0 + packedIntensity.g;
        //return vec4(intensityScalar);
    }
