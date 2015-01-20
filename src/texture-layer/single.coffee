BaseLayer = require 'base'

exports = class TextureLayer extends BaseLayer
    constructor: (@parent, params={}) ->
        @gf = @parent.gf
        @map = @parent.map
        @haveData = false
        @haveColormap = false

        @shaders = {}

        for name in ['nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic', 'hex-nearest', 'hex-linear', 'hex-smoothstep']
            @shaders[name] = [
                fs.open('texfuns/intensity.shader')
                fs.open('texfuns/rect.shader')
                fs.open("texfuns/#{name}.shader")
                fs.open('display.shader')
            ]

        for name in ['bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom']
            @shaders[name] = [
                fs.open('texfuns/intensity.shader')
                fs.open('texfuns/rect.shader')
                fs.open("texfuns/#{name}.shader")
                fs.open("texfuns/generalBicubic.shader")
                fs.open('display.shader')
            ]

        @interpolationName = 'bell'
        @shader = @gf.shader(@shaders[@interpolationName])
        
        @state = @gf.state
            #shader: fs.open('display.shader')
            shader: @shader
            vertexbuffer:
                pointers: [
                    {name:'position', size:2}
                    {name:'texcoord', size:2}
                ]
       
        @texture = @gf.texture2D
            width: 1
            height: 1
            filter: 'nearest'
            repeat: 'clamp'

        if params.colormap?
            @setColormap params.colormap

        if params.data?
            @setData params.data

        if params.interpolation?
            @setInterpolation params.interpolation
        
    updateBitmap: (data) ->
        min = max = data.bitmap[0]
        for item in data.bitmap
            min = Math.min(item, min)
            max = Math.max(item, max)

        @minIntensity = min
        @maxIntensity = max

        range = max-min
        bitmap = new Uint8Array(data.width*data.height*4)
        shortView = new Uint16Array(bitmap.buffer)

        for intensity, i in data.bitmap
            intensity = (intensity-min)/range
            intensity = intensity * 65535
            shortView[i*2] = intensity

        @texture.dataSized bitmap, data.width, data.height

    draw: (southWest, northEast, verticalSize, verticalOffset) ->
        if @haveData and @haveColormap
            @state
                .float('colormap', @colormap)
                .vec2('sourceSize', @texture.width, @texture.height)
                .sampler('source', @texture)
                .float('minIntensity', @minIntensity)
                .float('maxIntensity', @maxIntensity)
                .float('verticalSize', verticalSize)
                .float('verticalOffset', verticalOffset)
                .vec2('slippyBounds.southWest', southWest.x, southWest.y)
                .vec2('slippyBounds.northEast', northEast.x, northEast.y)
                .draw()
   
    ## public interface ##
    setData: (data) ->
        @parent.dirty = true
        
        @projection = proj4(
            new proj4.Proj(data.projection)
            new proj4.Proj('WGS84')
        )

        @bounds = data.bounds

        @tessellate(data)
        @updateBitmap(data)

        @haveData = true
        
        #@testMarkers()
    
    setInterpolation: (@interpolationName) ->
        @parent.dirty = true
        @shader.source @shaders[@interpolationName]

