exports = class TextureLayer
    constructor: (@gf, params) ->
        @texture = @gf.texture2D
            width: 1
            height: 1

        @texture.loadImage(params.url)

        @state = @gf.state
            shader: fs.open('display.shader')

    draw: (southWest, northEast, verticalSize, verticalOffset) ->
        @state
            .sampler('source', @texture)
            .float('verticalSize', verticalSize)
            .float('verticalOffset', verticalOffset)
            .vec2('slippyBounds.southWest', southWest.x, southWest.y)
            .vec2('slippyBounds.northEast', northEast.x, northEast.y)
            .draw()
