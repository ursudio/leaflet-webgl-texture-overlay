if window.WebGLRenderingContext?
    vendors = ['WEBKIT', 'MOZ', 'MS', 'O']
    vendorRe = /^WEBKIT_(.*)|MOZ_(.*)|MS_(.*)|O_(.*)/

    getExtension = WebGLRenderingContext.prototype.getExtension
    WebGLRenderingContext.prototype.getExtension = (name) ->
        match = name.match vendorRe
        if match != null
            name = match[1]

        extobj = getExtension.call @, name
        if extobj == null
            for vendor in vendors
                extobj = getExtension.call @, vendor + '_' + name
                if extobj != null
                    return extobj
            return null
        else
            return extobj

    getSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions
    WebGLRenderingContext.prototype.getSupportedExtensions = ->
        supported = getSupportedExtensions.call @
        result = []

        for extension in supported
            match = extension.match vendorRe
            if match != null
                extension = match[1]

            if extension not in result
                result.push extension

        return result

shims = require 'shims'
textureFloat = require 'texture-float'
texture = require 'texture'
matrix = require 'matrix'
vector = require 'vector'

State = require 'state'
VertexBuffer = require 'vertexbuffer'
{Shader, ShaderProxy} = require 'shader'
framebuffer = require 'framebuffer'

exports = class WebGLFramework
    constructor: (params={}) ->
        debug = params.debug ? false
        delete params.debug
        
        perf = params.perf ? false
        delete params.perf

        @canvas = params.canvas ? document.createElement('canvas')
        delete params.canvas

        @gl = @getContext 'webgl', params

        if not @gl?
            @gl = @getContext 'experimental-webgl'

        if not @gl?
            throw new Error 'WebGL is not supported'

        @textureFloat = textureFloat(@gl)
        
        # might be slower than manual pointer handling
        #if @haveExtension('OES_vertex_array_object')
        #    @vao = @gl.getExtension('OES_vertex_array_object')
        #else
        #    @vao = null
        @vao = null

        if window.WebGLPerfContext? and perf
            console.log 'webgl perf context enabled'
            @gl = new WebGLPerfContext.create @gl
        else if window.WebGLDebugUtils? and debug
            console.log 'webgl debug enabled'
            @gl = WebGLDebugUtils.makeDebugContext @gl, (err, funcName, args) ->
                throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName

        @currentVertexBuffer = null
        @currentShader = null
        @currentFramebuffer = null
        @currentState = null

        @maxAttribs = @gl.getParameter @gl.MAX_VERTEX_ATTRIBS
        @vertexUnits = for i in [0...@maxAttribs]
            {enabled:false, pointer:null, location:i}

        @lineWidth = 1

        @quadVertices = @vertexbuffer
            pointers: [
                {name:'position', size:2}
            ]
            vertices: [
                -1, -1,  1, -1,  1,  1,
                -1,  1, -1, -1,  1,  1,
            ]

        @blit = @state
            shader: fs.open('blit.shader')

    haveExtension: (search) ->
        for name in @gl.getSupportedExtensions()
            if name.indexOf(search) >= 0
                return true
        return false

    getContext: (name, params) ->
        try
            return @canvas.getContext(name, params)
        catch error
            return null

    state: (params) -> new State(@, params)
    vertexbuffer: (params) -> new VertexBuffer(@, params)
    framebuffer: (params) ->
        if params.type?
            if params.type == '2d'
                new framebuffer.Framebuffer2D(@, params)
            else if params.type == 'cube'
                new framebuffer.FramebufferCube(@, params)
            else
                throw new Error('unknown framebuffer type: ' + params.type)

        else
            new framebuffer.Framebuffer2D(@, params)

    shader: (params) -> new Shader(@, params)
    shaderProxy: (shader) -> new ShaderProxy(shader)

    mat4: (view) -> new matrix.Mat4(view)
    mat3: (view) -> new matrix.Mat3(view)
    vec3: (x, y, z) -> new vector.Vec3(x,y,z)

    clearColor: (r, g, b, a) ->
        @gl.clearColor(r, g, b, a)
        @gl.clear(@gl.COLOR_BUFFER_BIT)
        return @
    
    clearDepth: (value=1) ->
        @gl.clearDepth value
        @gl.clear @gl.DEPTH_BUFFER_BIT
        return @

    frameStart: ->
        if fullscreen.element()?
            factor = 1
        else
            factor = 2
            
        if @canvas.offsetWidth*factor != @canvas.width
            @canvas.width = @canvas.offsetWidth*factor
        
        if @canvas.offsetHeight*factor != @canvas.height
            @canvas.height = @canvas.offsetHeight*factor

        if @gl.performance?
            @gl.performance.start()
        return @

    frameEnd: ->
        if @gl.performance?
            @gl.performance.stop()
        return @
    
    texture2D: (params) ->
        return new texture.Texture2D @, params
    
    textureCube: (params) ->
        return new texture.TextureCube @, params

    getExtension: (name) ->
        @gl.getExtension name

    htmlColor2Vec: (value) ->
        r = parseInt(value[...2], 16)/255
        g = parseInt(value[2...4], 16)/255
        b = parseInt(value[4...], 16)/255
        return {r:r, g:g, b:b}
