draw = (gl, {vertex, fragment}) ->
    gl.activeTexture(gl.TEXTURE0)

    program = gl.createProgram()

    vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.attachShader(program, vertexShader)
    gl.shaderSource(vertexShader, vertex)
    gl.compileShader(vertexShader)
    if not gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)
        throw gl.getShaderInfoLog(vertexShader)

    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.attachShader(program, fragmentShader)
    gl.shaderSource(fragmentShader, fragment)

    gl.compileShader(fragmentShader)
    if not gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)
        throw gl.getShaderInfoLog(fragmentShader)

    gl.linkProgram(program)
    if not gl.getProgramParameter(program, gl.LINK_STATUS)
        throw gl.getProgramInfoLog(program)
    
    gl.useProgram(program)
    vertices = new Float32Array([
         1,  1,
        -1,  1,
        -1, -1,

         1,  1,
        -1, -1,
         1, -1,
    ])

    buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    positionLoc = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
    sourceLoc = gl.getUniformLocation(program, 'source')
    if sourceLoc?
        gl.uniform1i(sourceLoc, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    gl.deleteProgram(program)
    gl.deleteBuffer(buffer)

renderable = (gl, targetType, channels) ->
    sourceTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        channels,
        2, 2,
        0,
        channels,
        targetType,
        null,
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    
    sourceFramebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, sourceFramebuffer)
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        sourceTexture,
        0
    )
    
    check = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if check != gl.FRAMEBUFFER_COMPLETE
        gl.deleteTexture(sourceTexture)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        return false

    draw gl,
        vertex: '''
            attribute vec2 position;
            void main(){
                gl_Position = vec4(position, 0, 1);
            }
        '''
        fragment: '''
            void main(){
                gl_FragColor = vec4(0.5);
            }
        '''
    gl.deleteFramebuffer(sourceFramebuffer)
    
    readbackTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, readbackTexture)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        2, 2,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    
    readbackFramebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, readbackFramebuffer)
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        readbackTexture,
        0
    )
   
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture)
    draw gl,
        vertex: '''
            varying vec2 texcoord;
            attribute vec2 position;
            void main(){
                texcoord = position*0.5+0.5;
                gl_Position = vec4(position, 0, 1);
            }
        '''
        fragment: '''
            precision highp int;
            precision highp float;
            varying vec2 texcoord;
            uniform sampler2D source;
            void main(){
                gl_FragColor = texture2D(source, texcoord);
            }
        '''

    pixels = new Uint8Array(2*2*4)
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

    gl.deleteTexture(sourceTexture)
    gl.deleteTexture(readbackTexture)
    gl.deleteFramebuffer(readbackFramebuffer)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    console.assert gl.getError() == gl.NO_ERROR

    return pixels[0] >= 126 and pixels[0] <= 128

exports = (gl) ->
    float16 = gl.getExtension('OES_texture_half_float')
    float16linear = gl.getExtension('OES_texture_half_float_linear')
    float32 = gl.getExtension('OES_texture_float')
    float32linear = gl.getExtension('OES_texture_float_linear')

    result = {}

    if float16?
        result.float16 =
            linear: float16linear?
            type: float16.HALF_FLOAT_OES
            renderable: renderable(gl, float16.HALF_FLOAT_OES, gl.RGBA)

    if float32?
        result.float32 =
            linear: float32linear?
            type: gl.FLOAT
            renderable: renderable(gl, gl.FLOAT, gl.RGBA)

    return result
