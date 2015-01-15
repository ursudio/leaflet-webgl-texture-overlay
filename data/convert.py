import json, sys, jickle, os, array, random

infilename = sys.argv[1]
outfilename = os.path.splitext(infilename)[0] + '.jickle'

data = json.loads(open(infilename).read())
print data.keys()
#data['bitmap'] = array.array('B', data['bitmap'])
test = [random.randint(0,255) for _ in range(8*8)]
data['bitmap'] = array.array('B', test)
data['width'] = 8
data['height'] = 8
data = jickle.dumps(data)
open(outfilename, 'wb').write(data)
