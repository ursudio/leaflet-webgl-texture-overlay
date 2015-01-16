import json, sys, jickle, os, array, random

outfilename = 'twolayer.jickle'

data = json.loads(open('footprint-area-delta.json').read())
data2 = json.loads(open('human-population.json').read())

bitmap1 = data.pop('bitmap')
bitmap2 = data2.pop('bitmap')

data['bitmaps'] = [
    array.array('B', bitmap1),
    array.array('B', bitmap2),
]
data = jickle.dumps(data)
open(outfilename, 'wb').write(data)
