exports = class BaseLayer
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
        if data.length > 18
            throw new Error("Color map is too long, maximum of 18 entries allowed")

        @parent.dirty = true
        @colormap = new Float32Array(18 * 5)
        @colorCount = data.length

        for color, i in data
            @colormap[i*5+0] = (color.r ? 0)/255
            @colormap[i*5+1] = (color.g ? 0)/255
            @colormap[i*5+2] = (color.b ? 0)/255
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
       

