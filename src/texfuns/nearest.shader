fragment:
    vec4 texture2DInterp(sampler2D source, vec2 coord, vec2 size){
        return texture2DRect(source, floor(coord*size), size);
    }
