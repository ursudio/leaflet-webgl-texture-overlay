fragment:
    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    float fadeFun(float a, float b, float f, vec2 coord){
        float r1 = rand(coord);
        float r2 = rand(coord+3.0);
        r1 = min(r1, r2);
        r2 = max(r1, r2);
        f = linstep(r1, r2, f);
        return mix(a, b, f);
    }
