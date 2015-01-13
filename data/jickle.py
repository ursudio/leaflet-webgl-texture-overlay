import struct, array

class typecode:
    string          = 0
    object          = 1
    list            = 2

    int8            = 3
    int8array       = 4

    int16           = 5
    int16array      = 6

    int32           = 7
    int32array      = 8

    int64           = 9
    int64array      = 10

    float16         = 11
    float16array    = 12

    float32         = 13
    float32array    = 14

    float64         = 15
    float64array    = 16
    
    uint8           = 17
    uint8array      = 18

    uint16          = 19
    uint16array     = 20

    uint32          = 21
    uint32array     = 22

    uint64          = 23
    uint64array     = 24

def encodeType(type):
    return struct.pack('<B', type)

def encodeLength(value):
    return struct.pack('<I', value)

def encodeTypeLength(type, length):
    return encodeType(type) + encodeLength(length)

def encodeString(data, bare=False):
    if isinstance(data, unicode):
        data = data.encode('utf-8')

    if bare:
        return encodeLength(len(data)) + data
    else:
        return encodeTypeLength(typecode.string, len(data)) + data

def encodeObject(data, offset):
    content = encodeTypeLength(typecode.object, len(data))
    offset += len(content)
    for key, value in data.items():
        key = encodeString(key, True)
        offset += len(key)
        content += key
        value = dumps(value, offset)
        offset += len(value)
        content += value
    return content

def encodeList(data, offset):
    content = encodeTypeLength(typecode.list, len(data))
    offset += len(content)
    for value in data:
        value = dumps(value, offset)
        offset += len(value)
        content += value
    return content

def encodeInt(data):
    return (
        encodeType(typecode.int32) +
        struct.pack('<i', data)
    )

def encodeDouble(data):
    return (
        encodeType(typecode.float64) +
        struct.pack('<d', data)
    )

def encodeArray(data, offset):
    l = len(data)
    offset += 5
    if data.typecode == 'c':
        content = encodeTypeLength(typecode.int8array, l)
        content += struct.pack('<%ic' % l, *data)
    elif data.typecode == 'b':
        content = encodeTypeLength(typecode.int8array, l)
        content += struct.pack('<%ib' % l, *data)
    elif data.typecode == 'B':
        content = encodeTypeLength(typecode.uint8array, l)
        content += struct.pack('<%iB' % l, *data)
    elif data.typecode == 'h':
        content = encodeTypeLength(typecode.int16array, l)
        padding = offset % 2
        content += struct.pack('<%ix%ih' % (padding, l), *data)
    elif data.typecode == 'H':
        content = encodeTypeLength(typecode.uint16array, l)
        padding = offset % 2
        content += struct.pack('<%ix%iH' % (padding, l), *data)
    elif data.typecode == 'i':
        content = encodeTypeLength(typecode.int32array, l)
        padding = (4 - (offset%4))%4
        content += struct.pack('<%ix%ii' % (padding, l), *data)
    elif data.typecode == 'I':
        content = encodeTypeLength(typecode.uint32array, l)
        padding = (4 - (offset%4))%4
        content += struct.pack('<%ix%iI' % (padding, l), *data)
    elif data.typecode == 'f':
        content = encodeTypeLength(typecode.float32array, l)
        padding = (4 - (offset%4))%4
        content += struct.pack('<%ix%if' % (padding, l), *data)
    elif data.typecode == 'd':
        content = encodeTypeLength(typecode.float64array, l)
        padding = (8 - (offset%8))%8
        content += struct.pack('<%ix%id' % (padding, l), *data)
    else:
        raise Exception('unsupported array type: ' + data.typecode)

    return content

def dumps(data, offset=0):
    if isinstance(data, basestring):
        return encodeString(data)
    if isinstance(data, dict):
        return encodeObject(data, offset)
    elif isinstance(data, list):
        return encodeList(data, offset)
    elif isinstance(data, int):
        return encodeInt(data)
    elif isinstance(data, float):
        return encodeDouble(data)
    elif isinstance(data, array.array):
        return encodeArray(data, offset)

'''
#open('data.bin', 'wb').write(encode(123))
#open('data.bin', 'wb').write(encode('asdf'))
#open('data.bin', 'wb').write(encode({'asdf':123}))
#open('data.bin', 'wb').write(encode([1,2,3]))
#open('data.bin', 'wb').write(encode([1,2,{'asdf':123}]))
open('data.bin', 'wb').write(encode({
    'foo1': array.array('b', [1,2,3]),
    'foo2': array.array('i', [4,5,6]),
    'foo3': array.array('f', [7,8,9]),
    'foo4': array.array('d', [7,8,9]),
    'substructure': [
        'asdf',
        123,
        456.0,
    ]
}))
'''
