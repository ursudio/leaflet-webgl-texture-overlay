exports.Texture = class Texture

class ConcreteTexture extends exports.Texture
    constructor: (@gf, params={}) ->
        @gl = @gf.gl
        @handle = @gl.createTexture()
        @channels = @gl[(params.channels ? 'rgba').toUpperCase()]
        @bind()

        if typeof params.type == 'string'
            @type = @gl[(params.type ? 'unsigned_byte').toUpperCase()]
        else
            @type = params.type ? @gl.UNSIGNED_BYTE

        filter = params.filter ? 'nearest'
        if typeof filter == 'string'
            @[filter]()
        else
            @minify = @gl[filter.minify.toUpperCase()] ? @gl.LINEAR
            @magnify = @gl[filter.magnify.toUpperCase()] ? @gl.LINEAR
            @gl.texParameteri @target, @gl.TEXTURE_MAG_FILTER, @magnify
            @gl.texParameteri @target, @gl.TEXTURE_MIN_FILTER, @minify

        clamp = params.clamp ? 'edge'
        if typeof clamp == 'string'
            @[clamp]()
        else
            if clamp.s == 'edge'
                sClamp = @gl.CLAMP_TO_EDGE
            else if clamp.s == 'repeat'
                sClamp = @gl.REPEAT
            else
                throw new Error('unknown S clamp mode: ' + clamp.s)
            
            if clamp.t == 'edge'
                tClamp = @gl.CLAMP_TO_EDGE
            else if clamp.t == 'repeat'
                tClamp = @gl.REPEAT
            else
                throw new Error('unknown T clamp mode: ' + clamp.t)

            @gl.texParameteri @target, @gl.TEXTURE_WRAP_S, sClamp
            @gl.texParameteri @target, @gl.TEXTURE_WRAP_T, tClamp

    destroy: ->
        @gl.deleteTexture @handle
    
    generateMipmap: ->
        @mipmapped = true
        @bind()
        @gl.generateMipmap(@target)
        return @
    
    anisotropy: ->
        @anisotropic = true
        ext = @gl.getExtension 'EXT_texture_filter_anisotropic'
        if ext
            max = @gl.getParameter ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT
            @gl.texParameterf @target, ext.TEXTURE_MAX_ANISOTROPY_EXT, max
    
    linear: ->
        @bind()

        @gl.texParameteri @target, @gl.TEXTURE_MAG_FILTER, @gl.LINEAR
        @gl.texParameteri @target, @gl.TEXTURE_MIN_FILTER, @gl.LINEAR
        return @
    
    nearest: ->
        @bind()

        @gl.texParameteri @target, @gl.TEXTURE_MAG_FILTER, @gl.NEAREST
        @gl.texParameteri @target, @gl.TEXTURE_MIN_FILTER, @gl.NEAREST
        return @
    
    repeat: ->
        @bind()

        @gl.texParameteri @target, @gl.TEXTURE_WRAP_S, @gl.REPEAT
        @gl.texParameteri @target, @gl.TEXTURE_WRAP_T, @gl.REPEAT
        return @
    
    edge: ->
        @bind()

        @gl.texParameteri @target, @gl.TEXTURE_WRAP_S, @gl.CLAMP_TO_EDGE
        @gl.texParameteri @target, @gl.TEXTURE_WRAP_T, @gl.CLAMP_TO_EDGE
        return @
    
    bind: (unit=0) ->
        @gl.activeTexture @gl.TEXTURE0+unit
        @gl.bindTexture @target, @handle
        return @

class CubeSide extends exports.Texture
    constructor: (@handle, @target) ->

exports.TextureCube = class TextureCube extends ConcreteTexture
    constructor: (@gf, params={}) ->
        @target = @gf.gl.TEXTURE_CUBE_MAP
        super(@gf, params)
        @negativeX = new CubeSide(@handle, @gl.TEXTURE_CUBE_MAP_NEGATIVE_X)
        @negativeY = new CubeSide(@handle, @gl.TEXTURE_CUBE_MAP_NEGATIVE_Y)
        @negativeZ = new CubeSide(@handle, @gl.TEXTURE_CUBE_MAP_NEGATIVE_Z)
        @positiveX = new CubeSide(@handle, @gl.TEXTURE_CUBE_MAP_POSITIVE_X)
        @positiveY = new CubeSide(@handle, @gl.TEXTURE_CUBE_MAP_POSITIVE_Y)
        @positiveZ = new CubeSide(@handle, @gl.TEXTURE_CUBE_MAP_POSITIVE_Z)

        @size params.size
        
        if @minify in [@gl.NEAREST_MIPMAP_NEAREST, @gl.LINEAR_MIPMAP_NEAREST, @gl.NEAREST_MIPMAP_LINEAR, @gl.LINEAR_MIPMAP_LINEAR]
            @generateMipmap()

    size: (@size) ->
        @bind()
        @gl.texImage2D @gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, @channels, @size, @size, 0, @channels, @type, null
        @gl.texImage2D @gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, @channels, @size, @size, 0, @channels, @type, null
        @gl.texImage2D @gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, @channels, @size, @size, 0, @channels, @type, null
        @gl.texImage2D @gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, @channels, @size, @size, 0, @channels, @type, null
        @gl.texImage2D @gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, @channels, @size, @size, 0, @channels, @type, null
        @gl.texImage2D @gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, @channels, @size, @size, 0, @channels, @type, null

        return @
    
    dataSized: (data, side, @size) ->
        @bind()
        @gl.texImage2D @[side].target, 0, @channels, @size, @size, 0, @channels, @type, data
        return @

exports.Texture2D = class Texture2D extends ConcreteTexture
    constructor: (@gf, params={}) ->
        @target = @gf.gl.TEXTURE_2D
        super(@gf, params)

        if params.data instanceof Image
            @dataImage params.data
        else if params.width? and params.height?
            if params.data?
                @dataSized params.data, params.width, params.height
            else
                @size params.width, params.height

        if @minify in [@gl.NEAREST_MIPMAP_NEAREST, @gl.LINEAR_MIPMAP_NEAREST, @gl.NEAREST_MIPMAP_LINEAR, @gl.LINEAR_MIPMAP_LINEAR]
            @generateMipmap()

    loadImage: (url) ->
        image = new Image()
        image.onload = =>
            @dataImage image
        image.src = url

    dataImage: (data) ->
        @bind()

        @width = data.width
        @height = data.height
        @gl.texImage2D @target, 0, @channels, @channels, @type, data
        return @
    
    dataSized: (data, width, height, unpackAlignment=1) ->
        @bind()

        @width = width
        @height = height

        @gl.pixelStorei @gl.UNPACK_ALIGNMENT, unpackAlignment
        @gl.texImage2D @target, 0, @channels, @width, @height, 0, @channels, @type, data
        return @

    size: (@width, @height) ->
        @bind()
        @gl.texImage2D @target, 0, @channels, @width, @height, 0, @channels, @type, null
        return @
    
    draw: (scale=1) ->
        @gf.blit
            .float('scale', scale)
            .sampler('source', @)
            .draw()
