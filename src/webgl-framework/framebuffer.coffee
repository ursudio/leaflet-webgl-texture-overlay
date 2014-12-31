texture = require 'texture'

exports.Framebuffer = class Framebuffer
    constructor: (@gf, params={}) ->
        @gl = @gf.gl
        @buffer = @gl.createFramebuffer()

    generateMipmap: ->
        @colorTexture.generateMipmap()

    anisotropy: ->
        @colorTexture.anisotropy()
    
    bind: (unit=0) ->
        @colorTexture.bind unit
    
    check: ->
        result = @gl.checkFramebufferStatus @gl.FRAMEBUFFER
        switch result
            when @gl.FRAMEBUFFER_UNSUPPORTED
                throw 'Framebuffer is unsupported'
            when @gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
                throw 'Framebuffer incomplete attachment'
            when @gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS
                throw 'Framebuffer incomplete dimensions'
            when @gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT
                throw 'Framebuffer incomplete missing attachment'
        return @
    
    unuse: ->
        if @gf.currentFramebuffer?
            @gf.currentFramebuffer = null
            @gl.bindFramebuffer @gl.FRAMEBUFFER, null
        return @
    
exports.Framebuffer2D = class Framebuffer extends exports.Framebuffer
    constructor: (@gf, params={}) ->
        super(@gf, params)
        if params.color?
            if params.color instanceof texture.Texture
                @color params.color
                @ownColor = false
            else
                @color @gf.texture2D params.color
                @ownColor = true
        else
            @ownColor = false

    color: (@colorTexture) ->
        @use()
        @gl.framebufferTexture2D @gl.FRAMEBUFFER, @gl.COLOR_ATTACHMENT0, @colorTexture.target, @colorTexture.handle, 0
        @check()
        @unuse()
        return @
    
    use: ->
        if @gf.currentFramebuffer isnt @
            @gf.currentFramebuffer = @
            @gl.bindFramebuffer @gl.FRAMEBUFFER, @buffer
        return @

    viewport: (width, height) ->
        width ?= @colorTexture.width
        height ?= @colorTexture.height
        @gl.viewport 0, 0, width, height
    
    destroy: ->
        @gl.deleteFramebuffer @buffer
        if @ownColor
            @color.destroy()

        return @

exports.FramebufferCube = class FramebufferCube extends exports.Framebuffer
    constructor: (@gf, params) ->
        super(@gf, params)

        @negativeX = new exports.Framebuffer2D(@gf)
        @negativeY = new exports.Framebuffer2D(@gf)
        @negativeZ = new exports.Framebuffer2D(@gf)
        @positiveX = new exports.Framebuffer2D(@gf)
        @positiveY = new exports.Framebuffer2D(@gf)
        @positiveZ = new exports.Framebuffer2D(@gf)

        @currentSide = @negativeX
        
        color = params.color
        if color?
            if params.color instanceof texture.Texture
                @color params.color
            else
                @color @gf.textureCube params.color

    color: (@colorTexture) ->
        @negativeX.color(@colorTexture.negativeX)
        @negativeY.color(@colorTexture.negativeY)
        @negativeZ.color(@colorTexture.negativeZ)
        @positiveX.color(@colorTexture.positiveX)
        @positiveY.color(@colorTexture.positiveY)
        @positiveZ.color(@colorTexture.positiveZ)

    destroy: ->
        @negativeX.destroy()
        @negativeY.destroy()
        @negativeZ.destroy()
        @positiveX.destroy()
        @positiveY.destroy()
        @positiveZ.destroy()

    cubeSide: (name) ->
        @currentSide = @[name]

    use: ->
        @currentSide.use()
    
    viewport: (width, height) ->
        width ?= @colorTexture.size
        height ?= @colorTexture.size
        @gl.viewport 0, 0, width, height
    
