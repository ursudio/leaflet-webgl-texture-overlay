varying vec2 texcoord;

vertex:
    attribute vec2 position;
    uniform float verticalSize, verticalOffset;

    void main(){
        texcoord = position*0.5+0.5;

        vec2 pos = vec2(
            position.x,
            position.y*verticalSize + verticalOffset
        );

        gl_Position = vec4(pos, 0, 1);
    }

fragment:
    struct SlippyBounds{
        vec2 southWest, northEast;
    };
    uniform SlippyBounds slippyBounds;
            
    vec2 slippyUVToSphereUV(vec2 texcoord){
        vec2 normalizedCoord = texcoord*2.0-1.0;
        float t = 1.0 - atan(exp(-PI*normalizedCoord.y))/PIH;

        return vec2(mod(texcoord.s, 1.0), t);
    }

    vec2 sphereUVToSlippyUV(vec2 texcoord){
        vec2 normalizedCoord = texcoord*2.0-1.0;
        float lat = PIH*normalizedCoord.y;
        float t = log(
            (1.0 + sin(lat)) /
            (1.0 - sin(lat))
        )/(4.0*PI) + 0.5;

        return vec2(texcoord.s, t);
    }

    uniform sampler2D source;

    void main(){
        vec2 slippyCoord = mix(slippyBounds.southWest, slippyBounds.northEast, texcoord);
        vec2 sphereCoord = slippyUVToSphereUV(slippyCoord);
        vec3 color = texture2D(source, sphereCoord).rgb;
        gl_FragColor = vec4(color*0.4, 0.4);
    }
