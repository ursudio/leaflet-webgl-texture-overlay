BaseLayer = require 'base'

exports = class TextureFadeLayer extends BaseLayer
    constructor: (@parent, params={}) ->
        @gf = @parent.gf
        @map = @parent.map
        @haveData = false
        @haveColormap = false
        @fadeFactor = 0

        @shaders = {
            'crossfade': @getShadersFadeFun 'crossfade'
            'dissolve': @getShadersFadeFun 'dissolve'
        }
        @fadeFun = 'crossfade'
        @interpolationName = 'bell'
        @shader = @gf.shader(@shaders[@fadeFun][@interpolationName])
        
        @state = @gf.state
            shader: @shader
            vertexbuffer:
                pointers: [
                    {name:'position', size:2}
                    {name:'texcoord', size:2}
                ]
       
        @texture1 = @gf.texture2D
            width: 1
            height: 1
            filter: 'nearest'
            repeat: 'clamp'
        
        @texture2 = @gf.texture2D
            width: 1
            height: 1
            filter: 'nearest'
            repeat: 'clamp'

        if params.colormap?
            @setColormap params.colormap

        if params.data?
            @setData params.data

        if params.interpolation?
            if params.fadeFun?
                @fadeFun = params.fadeFun

            @setInterpolation params.interpolation

        else if params.fadeFun?
            @setFadeFun params.fadeFun
    
    getShadersFadeFun: (fadeFun) ->
        shaders = {}

        for name in ['nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic', 'hex-nearest', 'hex-linear', 'hex-smoothstep']
            shaders[name] = [
                fs.open("texfuns/#{fadeFun}.shader")
                fs.open('texfuns/intensity-fade.shader')
                fs.open('texfuns/rect.shader')
                fs.open("texfuns/#{name}.shader")
                fs.open('display.shader')
            ]

        for name in ['bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom']
            shaders[name] = [
                fs.open("texfuns/#{fadeFun}.shader")
                fs.open('texfuns/intensity-fade.shader')
                fs.open('texfuns/rect.shader')
                fs.open("texfuns/#{name}.shader")
                fs.open("texfuns/generalBicubic.shader")
                fs.open('display.shader')
            ]

        return shaders
        
    updateBitmaps: (data) ->
        min = max = data.bitmaps[0][0]
        for item in data.bitmaps[0]
            min = Math.min(item, min)
            max = Math.max(item, max)
        
        for item in data.bitmaps[1]
            min = Math.min(item, min)
            max = Math.max(item, max)

        @minIntensity = min
        @maxIntensity = max

        range = max-min
        bitmap = new Uint8Array(data.width*data.height*4)
        shortView = new Uint16Array(bitmap.buffer)
        for intensity, i in data.bitmaps[0]
            intensity = (intensity-min)/range
            intensity = intensity * 65535
            shortView[i*2] = intensity
        @texture1.dataSized bitmap, data.width, data.height
        
        bitmap = new Uint8Array(data.width*data.height*4)
        shortView = new Uint16Array(bitmap.buffer)
        for intensity, i in data.bitmaps[1]
            intensity = (intensity-min)/range
            intensity = intensity * 65535
            shortView[i*2] = intensity
        @texture2.dataSized bitmap, data.width, data.height

    draw: (southWest, northEast, verticalSize, verticalOffset) ->
        if @haveData and @haveColormap
            @state
                .float('colormap', @colormap)
                .float('fadeFactor', @fadeFactor)
                .vec2('sourceSize', @texture1.width, @texture1.height)
                .sampler('source1', @texture1)
                .sampler('source2', @texture2)
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
        @updateBitmaps(data)

        @haveData = true
        
    setFadeFactor: (@fadeFactor) ->
        @parent.dirty = true
    
    setInterpolation: (@interpolationName) ->
        @parent.dirty = true
        @shader.source @shaders[@fadeFun][@interpolationName]

    setFadeFun: (@fadeFun) ->
        @parent.dirty = true
        @shader.source @shaders[@fadeFun][@interpolationName]
