exports = class ClipRegion
    constructor: (@gf, @overlay) ->
        @fill = @gf.state
            shader: fs.open('fill.shader')
            colorWrite: [false, false, false, true]
            vertexbuffer:
                pointers: [
                    {name:'position', size:2}
                ]
        
        @holes = @gf.state
            shader: fs.open('holes.shader')
            colorWrite: [false, false, false, true]
            vertexbuffer:
                pointers: [
                    {name:'position', size:2}
                ]
        
        @clear = @gf.state
            shader: fs.open('clear.shader')
            colorWrite: [false, false, false, true]

        @dirty = false

    check: ->
        if @dirty and @overlay.map? and @data?
            @tessellate()
            return true
        else
            return false

    draw: (southWest, northEast, verticalSize, verticalOffset) ->
        @clear.draw()

        @fill
            .float('verticalSize', verticalSize)
            .float('verticalOffset', verticalOffset)
            .vec2('slippyBounds.southWest', southWest.x, southWest.y)
            .vec2('slippyBounds.northEast', northEast.x, northEast.y)
            .draw()
        
        @holes
            .float('verticalSize', verticalSize)
            .float('verticalOffset', verticalOffset)
            .vec2('slippyBounds.southWest', southWest.x, southWest.y)
            .vec2('slippyBounds.northEast', northEast.x, northEast.y)
            .draw()

    set: (@data) ->
        @dirty = true

    project: (coords) ->
        result = new Float32Array(coords.length*2)
        for item, i in coords
            {x,y} = @overlay.map.project({lat:item[1], lng:item[0]}, 0).divideBy(256)
            result[i*2+0] = x
            result[i*2+1] = y
        return result

    tessellateCoords: (coords) ->
        mesh = tessellate.tessellate([@project(coords)])
        vertices = new Float32Array(mesh.triangles.length*2)
        for idx, i in mesh.triangles
            vertices[i*2+0] = mesh.vertices[idx*2+0]
            vertices[i*2+1] = mesh.vertices[idx*2+1]
        return vertices

    collate: (arrays) ->
        length = 0
        for array in arrays
            length += array.length
        result = new Float32Array(length)
        offset = 0
        for array in arrays
            result.set array, offset
            offset += array.length
        return result

    tessellate: ->
        @dirty = false
        startTime = performance.now()
        fills = []
        holes = []
        if typeof @data[0][0][0] is 'number'
            regions = [@data]
        else
            regions = @data
        for region, i in regions
            fills.push @tessellateCoords(region[0])

            for i in [1...region.length]
                holes.push @tessellateCoords(region[i])

        @fill.vertices @collate(fills)
        @holes.vertices @collate(holes)
        #console.log performance.now() - startTime
