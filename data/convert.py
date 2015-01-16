import json, sys, jickle, os, array, random

infilename = sys.argv[1]
outfilename = os.path.splitext(infilename)[0] + '.jickle'

data = json.loads(open(infilename).read())
print data.keys()
data['bitmap'] = array.array('B', data['bitmap'])
data = jickle.dumps(data)
open(outfilename, 'wb').write(data)
