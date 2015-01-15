varying vec2 vTexcoord;

vertex:
    attribute vec2 position, texcoord;
    uniform float verticalSize, verticalOffset;
    
    struct SlippyBounds{
        vec2 southWest, northEast;
    };
    uniform SlippyBounds slippyBounds;

    void main(){
        vTexcoord = texcoord;
        vec2 pos = position;

        pos = linstepOpen(slippyBounds.southWest, slippyBounds.northEast, pos)*2.0-1.0;

        pos = vec2(
            pos.x,
            pos.y*verticalSize + verticalOffset
        );

        gl_Position = vec4(pos, 0, 1);
    }

fragment:
    uniform sampler2D source;
    uniform vec2 sourceSize;

    uniform float colormap[18*5];
    uniform float minIntensity;
    uniform float maxIntensity;
                
    float fade(vec3 range, float value){
        return clamp(
            linstep(range.x, range.y, value) - linstep(range.y, range.z, value),
        0.0, 1.0);
    }
    
    vec4 colorFun(float intensity){
        vec4 result = vec4(0.0);
        for(int i=1; i<15; i++){
            float r = colormap[i*5+0];
            float g = colormap[i*5+1];
            float b = colormap[i*5+2];
            float a = colormap[i*5+3];
            vec3 color = degammasRGB(vec3(r,g,b));

            float left = colormap[(i-1)*5+4];
            float center = colormap[i*5+4];
            float right = colormap[(i+1)*5+4];

            result += fade(vec3(left, center, right), intensity) * vec4(color, a);
        }
        return result;
    }
   
    /*
    vec4 texture2DRect(sampler2D source, vec2 coord, vec2 size){
        vec2 packedIntensity = texture2D(source, (coord+0.5)/size).rg;
        float intensityScalar = packedIntensity.r/255.0 + packedIntensity.g;
        return vec4(intensityScalar);
    }
    
    vec4 texture2DInterp(sampler2D source, vec2 coord, vec2 size){
        return texture2DRect(source, floor(coord*size), size);
    }
    */

    vec4 textureHex(sampler2D source, vec2 coord, vec2 size){
        coord.x *= (size.x+0.5)/size.x;
        float xoff = abs(1.0-mod(coord.y*size.y+0.5, 2.0));
        coord.x -= (xoff*0.5)/size.x;
        
        vec2 f = fract(coord*size+0.5);
        //f.x = 1.0-f.x;
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

        float tRight = texture2D(source, right).g;
        float tBottom = texture2D(source, bottom).g;
        float tDiag = texture2D(source, diag).g;

        //return vec4(vec3(even)*bc, 0);
        //return vec4(bc, 0);
        //return tRight*bc.x + tBottom*bc.y + tDiag*bc.z;

        //bc = smoothstep(0.0, 1.0, bc);
        //bc /= bc.x+bc.y+bc.z;

        float result = mix(tRight, tBottom, step(bc.x, bc.y));
        result = mix(tDiag, result, step(bc.z, max(bc.x, bc.y)));
        return vec4(result);

        return vec4(tRight*bc.x + tBottom*bc.y + tDiag*bc.z);
        //return texture2D(source, coord);
        //return vec4(xoff);
    }

    void main(){
        float intensityScalar = texture2DInterp(source, vTexcoord, sourceSize).r;
        float intensity = mix(minIntensity, maxIntensity, intensityScalar);
        vec4 color = colorFun(intensity);
        gl_FragColor = vec4(gammasRGB(color.rgb)*color.a, color.a);
        //gl_FragColor = vec4(vec3(intensityScalar), 1);
        //gl_FragColor = vec4(gammasRGB(intensityScalar.rgb), 1);
    }
