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

    void main(){
        float intensityScalar = texture2DInterp(source, vTexcoord, sourceSize).r;
        float intensity = mix(minIntensity, maxIntensity, intensityScalar);
        vec4 color = colorFun(intensity);
        gl_FragColor = vec4(gammasRGB(color.rgb)*color.a, color.a);
    }
