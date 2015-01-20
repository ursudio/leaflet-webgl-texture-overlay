fragment:
    vec4 texture2DInterp(vec2 coord, vec2 size){
        coord.x *= (size.x+0.5)/size.x;
        float xoff = abs(1.0-mod(coord.y*size.y+0.5, 2.0));
        coord.x -= (xoff*0.5)/size.x;
        
        vec2 f = fract(coord*size+0.5);
        float even = step(1.0, mod(coord.y*size.y+0.5, 2.0));
        f.x = mix(1.0-f.x, f.x, even);
        float side = step(1.0, f.x+f.y);

        vec3 bc = vec3(
            mix(
                f.xy,
                1.0-f.yx,
                side
            ),
            fract(abs(f.x+f.y-1.0))
        );

        vec2 c = floor(coord*size-0.5);

        vec2 right = mix(
            c,
            c+vec2(1, 0),
            even
        )/size;

        vec2 bottom = mix(
            c+vec2(1),
            c+vec2(0, 1),
            even
        )/size;

        vec2 diag = mix(
            c+mix(vec2(1,0), vec2(0,1), side),
            c+vec2(side),
            even
        )/size;

        float tRight = textureIntensity(right);
        float tBottom = textureIntensity(bottom);
        float tDiag = textureIntensity(diag);

        bc = smoothstep(0.0, 1.0, bc);
        bc /= bc.x+bc.y+bc.z;

        return vec4(tRight*bc.x + tBottom*bc.y + tDiag*bc.z);
    }
