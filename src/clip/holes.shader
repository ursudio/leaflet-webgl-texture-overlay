vertex:
    attribute vec2 position;
    uniform float verticalSize, verticalOffset;
    
    struct SlippyBounds{
        vec2 southWest, northEast;
    };
    uniform SlippyBounds slippyBounds;

    void main(){
        vec2 pos = position;

        pos = linstepOpen(slippyBounds.southWest, slippyBounds.northEast, pos)*2.0-1.0;

        pos = vec2(
            pos.x,
            pos.y*verticalSize + verticalOffset
        );

        gl_Position = vec4(pos, 0, 1);
    }

fragment:
    void main(){
        gl_FragColor = vec4(1, 0, 1, 0);
    }
