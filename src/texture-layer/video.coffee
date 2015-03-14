BaseLayer = require 'base'

exports = class TextureVideoLayer extends BaseLayer
    constructor: (@parent, params={}) ->
        @gf = @parent.gf
        @map = @parent.map
        @haveData = false
        @haveColormap = false
        @mixFactor = 0
        @time = 0

        @shaders = {
            'crossfade': @getShadersFadeFun 'crossfade'
            'dissolve': @getShadersFadeFun 'dissolve'
            'noise': @getShadersFadeFun 'noise'
            'fbm': @getShadersFadeFun 'fbm'
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
            #depthTest: true
            #depthWrite: false
            #depthFunc: 'less'
       
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
                fs.open("texfuns/tween/#{fadeFun}.shader")
                fs.open('texfuns/intensity.shader')
                fs.open('texfuns/interpolation/rect.shader')
                fs.open("texfuns/interpolation/#{name}.shader")
                fs.open('display.shader')
            ]

        for name in ['bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom']
            shaders[name] = [
                fs.open("texfuns/tween/#{fadeFun}.shader")
                fs.open('texfuns/intensity.shader')
                fs.open('texfuns/interpolation/rect.shader')
                fs.open("texfuns/interpolation/#{name}.shader")
                fs.open("texfuns/interpolation/generalBicubic.shader")
                fs.open('display.shader')
            ]

        return shaders
        
    updateBitmaps: (data) ->
        @bitmaps = data.bitmaps

        @firstFrame = @bitmaps[0]
        @lastFrame = @bitmaps[@bitmaps.length-1]

        @frame0 = @bitmaps[0]
        @frame1 = @bitmaps[1%@bitmaps.length]

        @mixFactor = 0
        @time = 0
        @texture0.dataSized @frame0.bitmap, @width, @height, 1
        @texture1.dataSized @frame1.bitmap, @width, @height, 1

        #min = max = data.bitmaps[0].bitmap[0]
        #for bitmap in data.bitmaps
        #    for value in bitmap.bitmap
        #        min = Math.min min, value
        #        max = Math.max max, value

    draw: (southWest, northEast, verticalSize, verticalOffset) ->
        if @haveData and @haveColormap
            @state
                .float('colormap', @colormap)
                .float('mixFactor', @mixFactor)
                .float('time', @time)
                .vec2('sourceSize', @texture1.width, @texture1.height)
                .sampler('source0', @texture0)
                .sampler('source1', @texture1)
                .float('minIntensity', 0)
                .float('maxIntensity', 255)
                .int('colorCount', @colorCount)
                .float('verticalSize', verticalSize)
                .float('verticalOffset', verticalOffset)
                .vec2('slippyBounds.southWest', southWest.x, southWest.y)
                .vec2('slippyBounds.northEast', northEast.x, northEast.y)

            if @fadeFun is 'noise' or @fadeFun is 'fbm'
                if @fadeParams?
                    @state
                        .float('spatialFrequency', @fadeParams.spatialFrequency ? 10)
                        .float('timeFrequency', @fadeParams.timeFrequency ? @bitmaps.length/2)
                        .float('amplitude', @fadeParams.amplitude ? 1.0)
                        .float('attack', @fadeParams.attack ? 0.25)
                    if @fadeFun is 'fbm'
                        @state
                            .float('spatialLacunarity', @fadeParams.spatialLacunarity ? 2)
                            .float('timeLacunarity', @fadeParams.timeLacunarity ? 1)
                            .float('gain', @fadeParams.gain ? 0.5)

                else
                    @state
                        .float('spatialFrequency', 10)
                        .float('timeFrequency', @bitmaps.length/2)
                        .float('amplitude', 1.0)
                        .float('attack', 0.25)
                    if @fadeFun is 'fbm'
                        @state
                            .float('spatialLacunarity', 2)
                            .float('timeLacunarity', 1)
                            .float('gain', 0.5)

            @state.draw()
   
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
                @texture0.dataSized @frame0.bitmap, @width, @height, 1

            if @frame1 isnt frame1
                @frame1 = frame1
                @texture1.dataSized @frame1.bitmap, @width, @height, 1

            @time = (time - @firstFrame.time)/(@lastFrame.time - @firstFrame.time)

    setInterpolation: (@interpolationName) ->
        @parent.dirty = true
        @shader.source @shaders[@fadeFun][@interpolationName]

    setFadeFun: (@fadeFun, params) ->
        @fadeParams = params
        @parent.dirty = true
        @shader.source @shaders[@fadeFun][@interpolationName]
