vendors = [null, 'webkit', 'apple', 'moz', 'o', 'xv', 'ms', 'khtml', 'atsc', 'wap', 'prince', 'ah', 'hp', 'ro', 'rim', 'tc']

vendorName = (name, vendor) ->
    if vendor == null
        return name
    else
        return vendor + name[0].toUpperCase() + name.substr(1)

getAttribName = (obj, name) ->
    for vendor in vendors
        attrib_name = vendorName(name, vendor)
        attrib = obj[attrib_name]
        if attrib?
            return attrib_name
   
getAttrib = (obj, name, def) ->
    if obj
        for vendor in vendors
            attrib_name = vendorName(name, vendor)
            attrib = obj[attrib_name]
            if attrib?
                return attrib
    return def

window.performance = getAttrib(window, 'performance')

if not window.performance?
    window.performance = {}

window.performance.now = getAttrib(window.performance, 'now')

if not window.performance.now?
    startTime = Date.now()
    window.performance.now = ->
        return Date.now() - startTime

window.requestAnimationFrame = getAttrib window, 'requestAnimationFrame', (callback) ->
    setTimeout callback, 1000/60

window.fullscreen =
    enabled: getAttrib(document, 'fullScreenEnabled') ? getAttrib(document, 'fullscreenEnabled')

    element: ->
        getAttrib(document, 'fullScreenElement') ? getAttrib(document, 'fullscreenElement')
        
    exit: ->
        name = (
            getAttribName(document, 'exitFullScreen') ?
            getAttribName(document, 'exitFullscreen') ?
            getAttribName(document, 'cancelFullScreen') ?
            getAttribName(document, 'cancelFullscreen')
        )
        if name?
            document[name]()

    request: (element) ->
        name = getAttribName(element, 'requestFullScreen') ? getAttribName(element, 'requestFullscreen')
        if name?
            element[name]()
            
    addEventListener: (callback) ->
        onChange = (event) ->
            event.entered = fullscreen.element()?
            callback event

        document.addEventListener 'fullscreenchange', onChange
        for vendor in vendors[1..]
            document.addEventListener vendor + 'fullscreenchange', onChange

        return

fullscreen.addEventListener (event) ->
    element = event.target
    if event.entered
        element.className += ' fullscreen'
    else
        element.className = element.className.replace(' fullscreen', '').replace('fullscreen', '')

