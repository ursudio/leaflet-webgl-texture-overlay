typecode =
    string          : 0
    object          : 1
    list            : 2

    int8            : 3
    int8array       : 4

    int16           : 5
    int16array      : 6

    int32           : 7
    int32array      : 8

    int64           : 9
    int64array      : 10

    float16         : 11
    float16array    : 12

    float32         : 13
    float32array    : 14

    float64         : 15
    float64array    : 16

    uint8           : 17
    uint8array      : 18

    uint16          : 19
    uint16array     : 20

    uint32          : 21
    uint32array     : 22

    uint64          : 23
    uint64array     : 24

class Reader
    constructor: (@buffer) ->
        @view = new DataView(buffer)
        @offset = 0
    
    string: ->
        length = @uint32()
        result = ''
        for i in [0...length]
            result += String.fromCharCode(@uint8())
        return decodeURIComponent(escape(result))

    object: ->
        count = @uint32()
        result = {}
        for _ in [0...count]
            key = @string()
            value = @decode()
            result[key] = value
        return result

    list: ->
        count = @uint32()
        for i in [0...count]
            @decode()

    uint8: ->
        value = @view.getUint8(@offset, true)
        @offset += 1
        return value
    
    uint8array: ->
        length = @uint32()
        value = new Uint8Array(@buffer, @offset, length)
        @offset += length
        return value

    int8: ->
        value = @view.getInt8(@offset, true)
        @offset += 1
        return value
    
    int8array: ->
        length = @uint32()
        value = new Int8Array(@buffer, @offset, length)
        @offset += length
        return value

    uint16: ->
        value = @view.getUint16(@offset, true)
        @offset += 2
        return value
    
    uint16array: ->
        length = @uint32()
        padding = @offset % 2
        @offset += padding
        value = new Uint16Array(@buffer, @offset, length)
        @offset += length*2
        return value
    
    int16: ->
        value = @view.getInt16(@offset, true)
        @offset += 2
        return value
    
    int16array: ->
        length = @uint32()
        padding = @offset % 2
        @offset += padding
        value = new Int16Array(@buffer, @offset, length)
        @offset += length*2
        return value
    
    uint32: ->
        value = @view.getUint32(@offset, true)
        @offset += 4
        return value
    
    uint32array: ->
        length = @uint32()
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Uint32Array(@buffer, @offset, length)
        @offset += length*4
        return value

    int32: ->
        value = @view.getInt32(@offset, true)
        @offset += 4
        return value

    int32array: ->
        length = @uint32()
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Int32Array(@buffer, @offset, length)
        @offset += length*4
        return value
    
    uint64: ->
        value = @view.getUint64(@offset, true)
        @offset += 8
        return value
    
    uint64array: ->
        length = @uint32()
        padding = (8 - (@offset % 8))%8
        @offset += padding
        value = new Uint64Array(@buffer, @offset, length)
        @offset += length*8
        return value
    
    int64: ->
        value = @view.getInt64(@offset, true)
        @offset += 8
        return value
    
    int64array: ->
        length = @uint32()
        padding = (8 - (@offset % 8))%8
        @offset += padding
        value = new Int64Array(@buffer, @offset, length)
        @offset += length*8
        return value
    
    float32: ->
        value = @view.getFloat32(@offset, true)
        @offset += 4
        return value

    float32array: ->
        length = @uint32()
        padding = (4 - (@offset % 4))%4
        @offset += padding
        value = new Float32Array(@buffer, @offset, length)
        @offset += length*4
        return value
    
    float64: ->
        value = @view.getFloat64(@offset, true)
        @offset += 8
        return value
    
    float64array: ->
        length = @uint32()
        padding = (8 - (@offset % 8))%8
        @offset += padding
        value = new Float64Array(@buffer, @offset, length)
        @offset += length*8
        return value

    decode: ->
        type = @uint8()
        switch type
            when typecode.string then @string()
            when typecode.object then @object()
            when typecode.list then @list()

            when typecode.int8 then @int8()
            when typecode.int8array then @int8array()
            when typecode.uint8 then @uint8()
            when typecode.uint8array then @uint8array()

            when typecode.int16 then @int16()
            when typecode.int16array then @int16array()
            when typecode.uint16 then @int16()
            when typecode.uint16array then @int16array()
            
            when typecode.int32 then @int32()
            when typecode.int32array then @int32array()
            when typecode.uint32 then @int32()
            when typecode.uint32array then @int32array()
            
            when typecode.int64 then @int64()
            when typecode.int64array then @int64array()
            when typecode.uint64 then @int64()
            when typecode.uint64array then @int64array()
            
            when typecode.float32 then @float32()
            when typecode.float32array then @float32array()
            
            when typecode.float64 then @float64()
            when typecode.float64array then @float64array()

            else
                throw 'unknown type: ' + type

window.JICKLE =
    parse: (buffer) ->
        reader = new Reader(buffer)
        return reader.decode()

###
xhr = new XMLHttpRequest()
xhr.open 'GET', 'data.bin', true
xhr.responseType = 'arraybuffer'
xhr.onload = ->
    console.log decode(xhr.response)
xhr.send()
###
