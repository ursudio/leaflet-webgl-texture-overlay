BaseLayer = require 'base'

exports = class TextureFadeLayer extends BaseLayer
    constructor: (@parent, params={}) ->
        @gf = @parent.gf
        @map = @parent.map
        @haveData = false
        @haveColormap = false
        @mixFactor = 0

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
       
        @texture0 = @gf.texture2D
            channels: 'luminance'
            width: 1
            height: 1
            filter: 'nearest'
            repeat: 'clamp'
        
        @texture1 = @gf.texture2D
            channels: 'luminance'
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
                fs.open('texfuns/intensity-video.shader')
                fs.open('texfuns/rect.shader')
                fs.open("texfuns/#{name}.shader")
                fs.open('display.shader')
            ]

        for name in ['bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom']
            shaders[name] = [
                fs.open("texfuns/#{fadeFun}.shader")
                fs.open('texfuns/intensity-video.shader')
                fs.open('texfuns/rect.shader')
                fs.open("texfuns/#{name}.shader")
                fs.open("texfuns/generalBicubic.shader")
                fs.open('display.shader')
            ]

        return shaders
        
    updateBitmaps: (data) ->
        @bitmaps = data.bitmaps

        @frame0 = @bitmaps[0]
        @frame1 = @bitmaps[1]

        @mixFactor = 0
        @texture0.dataSized @frame0.bitmap, @width, @height
        @texture1.dataSized @frame1.bitmap, @width, @height

    draw: (southWest, northEast, verticalSize, verticalOffset) ->
        if @haveData and @haveColormap
            @state
                .float('colormap', @colormap)
                .float('mixFactor', @mixFactor)
                .vec2('sourceSize', @texture1.width, @texture1.height)
                .sampler('source0', @texture0)
                .sampler('source1', @texture1)
                .float('minIntensity', 0)
                .float('maxIntensity', 255)
                .float('verticalSize', verticalSize)
                .float('verticalOffset', verticalOffset)
                .vec2('slippyBounds.southWest', southWest.x, southWest.y)
                .vec2('slippyBounds.northEast', northEast.x, northEast.y)
                .draw()
   
    ## public interface ##
    setData: (data) ->
        @parent.dirty = true
        
        @width = data.width
        @height = data.height
        
        @projection = proj4(
            new proj4.Proj(data.projection)
            new proj4.Proj('WGS84')
        )

        @bounds = data.bounds

        @tessellate(data)
        @updateBitmaps(data)

        @haveData = true

    setTime: (time) ->
        if @bitmaps?
            @parent.dirty = true

            if time < @bitmaps[0].time
                frame0 = @bitmaps[0]
                frame1 = @bitmaps[1]
            else if time > @bitmaps[@bitmaps.length-1].time
                frame0 = @bitmaps[@bitmaps.length-2]
                frame1 = @bitmaps[@bitmaps.length-1]
            else
                for i in [0...@bitmaps.length-1]
                    frame0 = @bitmaps[i]
                    frame1 = @bitmaps[i+1]
                    if time >= frame0.time and time <= frame1.time
                        break

            @mixFactor = (time - frame0.time)/(frame1.time-frame0.time)

            if @frame0 isnt frame0
                @frame0 = frame0
                @texture0.dataSized @frame0.bitmap, @width, @height

            if @frame1 isnt frame1
                @frame1 = frame1
                @texture1.dataSized @frame1.bitmap, @width, @height
    
    setInterpolation: (@interpolationName) ->
        @parent.dirty = true
        @shader.source @shaders[@fadeFun][@interpolationName]

    setFadeFun: (@fadeFun) ->
        @parent.dirty = true
        @shader.source @shaders[@fadeFun][@interpolationName]
