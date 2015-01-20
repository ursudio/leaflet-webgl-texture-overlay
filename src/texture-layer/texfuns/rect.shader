fragment:
    vec4 texture2DRect(vec2 coord, vec2 size){
        return vec4(textureIntensity((coord+0.5)/size));
    }
