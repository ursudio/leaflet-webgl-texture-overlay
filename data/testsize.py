import zlib, json, sys, struct

data = json.loads(open(sys.argv[1]).read())['bitmap']

print 'json bitmap length', len(json.dumps(data))/1024.0
print 'json compressed bitmap length', len(zlib.compress(json.dumps(data), 9))/1024.0

low = high = float(data[0])
for value in data:
    low = min(value, low)
    high = max(value, high)

result = []
for value in data:
    value = (value-low)/(high-low)
    value = int(round(255*value))
    result.append(value)
result = struct.pack('%iB' % len(result), *result)
print 'byte bitmap length', len(result)/1024.0
print 'byte compressed bitmap length', len(zlib.compress(result, 9))/1024.0

result = []
for value in data:
    value = (value-low)/(high-low)
    value = int(round(65535*value))
    result.append(value)
result = struct.pack('%iH' % len(result), *result)
print 'short bitmap length', len(result)/1024.0
print 'short compressed bitmap length', len(zlib.compress(result, 9))/1024.0
