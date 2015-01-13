import json, sys, jickle, os, array

infilename = sys.argv[1]
outfilename = os.path.splitext(infilename)[0] + '.jickle'

data = json.loads(open(infilename).read())
data['bitmap'] = array.array('B', data['bitmap'])
data = jickle.dumps(data)
open(outfilename, 'wb').write(data)
