vertex:
    attribute vec2 position;

    void main(){
        gl_Position = vec4(position, 0, 1);
    }

fragment:
    void main(){
        gl_FragColor = vec4(0, 0, 0, 0);
    }
