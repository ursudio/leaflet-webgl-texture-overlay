class BaseLayer
    project: (s, t) ->
        b = @bounds
        x = b.left + (b.right - b.left)*s
        y = b.top + (b.bottom - b.top)*t
        [lng,lat] = @projection.forward([x,y])
        lng += 360 # avoid wrapping issues
        {x,y} = @map.project({lat:lat, lng:lng}, 0).divideBy(256)
        return {x:x-1,y:y}
    
    tessellate: (data) ->
        size = 50

        sScale = (data.width+1)/data.width
        sOffset = 0.5/data.width
        tScale = (data.height+1)/data.height
        tOffset = 0.5/data.height
        
        centroids = []
        for t in [0..size]
            t = t/size
            for s in [0..size]
                s = s/size
                {x,y} = @project(s*sScale-sOffset, t*tScale-tOffset)
                centroids.push x:x, y:y, s:s, t:t

        v = new Float32Array(Math.pow(size, 2)*3*4*2)
        o = 0
        d = size+1

        for y in [0...size]
            y0 = y*d
            y1 = (y+1)*d
            for x in [0...size]
                x0 = x
                x1 = x+1

                p0 = centroids[x0+y0]
                p1 = centroids[x1+y0]
                p2 = centroids[x0+y1]
                p3 = centroids[x1+y1]

                v[o++] = p0.x; v[o++] = p0.y; v[o++]=p0.s; v[o++]=p0.t
                v[o++] = p1.x; v[o++] = p1.y; v[o++]=p1.s; v[o++]=p1.t
                v[o++] = p2.x; v[o++] = p2.y; v[o++]=p2.s; v[o++]=p2.t
                
                v[o++] = p1.x; v[o++] = p1.y; v[o++]=p1.s; v[o++]=p1.t
                v[o++] = p2.x; v[o++] = p2.y; v[o++]=p2.s; v[o++]=p2.t
                v[o++] = p3.x; v[o++] = p3.y; v[o++]=p3.s; v[o++]=p3.t

        @state.vertices(v)
    
    setColormap: (data) ->
        @parent.dirty = true

        data = data[..]
        data.unshift data[0]
        data.push data[data.length-1]
        data[0].alpha = 0

        @colormap = new Float32Array(18*5)
        for color, i in data
            @colormap[i*5+0] = color.r/255
            @colormap[i*5+1] = color.g/255
            @colormap[i*5+2] = color.b/255
            @colormap[i*5+3] = color.alpha ? 1
            @colormap[i*5+4] = color.center

        @haveColormap = true

    testMarkers: ->
        s = 0
        t = 0
        b = @bounds
        for i in [0...@texture.width]
            for j in [0...@texture.height]
                s = i/(@texture.width-1)
                t = j/(@texture.height-1)
                x = b.left + (b.right - b.left)*s
                y = b.top + (b.bottom - b.top)*t
                [lng,lat] = @projection.forward([x,y])
                L.circleMarker({lat:lat, lng:lng}, {radius:1}).addTo(@map)
        '''
        s = 0
        t = 0
        b = @bounds
        for i in [0...@texture.width]
            for j in [0...@texture.height]
                if j % 2 == 0
                    s = i/(@texture.width-0.5)
                else
                    s = (i+0.5)/(@texture.width-0.5)
                t = j/(@texture.height-1)
                x = b.left + (b.right - b.left)*s
                y = b.top + (b.bottom - b.top)*t
                [lng,lat] = @projection.forward([x,y])
                L.circleMarker({lat:lat, lng:lng}, {radius:1}).addTo(@map)
        '''
       

exports.TextureLayer = class TextureLayer extends BaseLayer
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

exports.TextureFadeLayer = class TextureFadeLayer extends BaseLayer
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
