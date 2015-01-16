fragment:
    vec4 texture2DInterp(vec2 coord, vec2 size){
        return texture2DRect(floor(coord*size), size);
    }
