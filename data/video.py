import json, sys, jickle, os, array, random

#data = json.loads(open('bitmap-human-population-all-years.json').read())
data = json.loads(open('bitmap-annual-precipitation-all-years.json').read())

bitmaps = []
for time, bitmap in sorted((int(key), value) for key, value in data.pop('yearbitmaps').items()):
    bitmaps.append({
        'time': time,
        'bitmap': array.array('B', bitmap)
    })

data['bitmaps'] = bitmaps
data = jickle.dumps(data)
open('annual-precipitation-video.jickle', 'wb').write(data)
