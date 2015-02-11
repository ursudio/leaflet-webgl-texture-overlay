(function(){
var sys,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

sys = {
  modules: {},
  files: {},
  defModule: function(name, closure) {
    return this.modules[name] = {
      closure: closure,
      instance: null
    };
  },
  defFile: function(name, value) {
    return this.files[name] = value;
  },
  loadImage: function(name, callback) {
    var img;
    img = new Image();
    img.onload = function() {
      return callback(name, img);
    };
    img.onerror = function() {
      return console.error('failed to load: ' + name);
    };
    img.src = 'src' + name;
  },
  main: function() {
    return this.require('/module');

    /*
     *window.addEventListener 'load', =>
    document.addEventListener 'DOMContentLoaded', =>
        toLoad = 0
        loaded = 0
        for name, value of @files
            ext = name.split('.').pop()
            if value is undefined
                toLoad += 1
                switch ext
                    when 'png', 'jpg', 'jpeg', 'gif'
                        @loadImage name, (imageName, img) =>
                            @files[imageName] = img
                            loaded += 1
                            if loaded is toLoad
                                @require('/module').main()
        if loaded is toLoad
            @require('/module').main()
     */
  },
  abspath: function(fromName, pathName) {
    var base, baseName, path;
    if (pathName === '.') {
      pathName = '';
    }
    baseName = fromName.split('/');
    baseName.pop();
    baseName = baseName.join('/');
    if (pathName[0] === '/') {
      return pathName;
    } else {
      path = pathName.split('/');
      if (baseName === '/') {
        base = [''];
      } else {
        base = baseName.split('/');
      }
      while (base.length > 0 && path.length > 0 && path[0] === '..') {
        base.pop();
        path.shift();
      }
      if (base.length === 0 || path.length === 0 || base[0] !== '') {
        throw new Error("Invalid path: " + (base.join('/')) + "/" + (path.join('/')));
      }
      return "" + (base.join('/')) + "/" + (path.join('/'));
    }
  },
  File: (function() {
    function _Class(path) {
      this.path = path;
      this.content = sys.files[this.path];
      if (this.content == null) {
        throw Error('file does not exist: ' + this.path);
      }
    }

    _Class.prototype.read = function() {
      return this.content;
    };

    return _Class;

  })(),
  FileSystem: (function() {
    function _Class(origin) {
      this.origin = origin;
    }

    _Class.prototype.abspath = function(fromName, pathName) {
      var folders, part, path, _i, _len, _ref;
      if (pathName[0] === '/') {
        return pathName;
      } else {
        folders = fromName.split('/');
        folders.pop();
        path = [];
        _ref = pathName.split('/');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          part = _ref[_i];
          if (part === '..') {
            if (folders.length > 0) {
              folders.pop();
            } else {
              path.push(part);
            }
          } else {
            path.push(part);
          }
        }
        return folders.concat(path).join('/');
      }
    };

    _Class.prototype.listdir = function(path, _arg) {
      var directories, files, name, result, type, value, _i, _len, _ref, _ref1;
      type = _arg.type;
      path = sys.abspath(this.origin, path);
      result = [];
      _ref = sys.modules;
      for (name in _ref) {
        value = _ref[name];
        if (name.indexOf(path) === 0) {
          name = name.slice(path.length + 1).split('/')[0];
          if (__indexOf.call(result, name) < 0) {
            result.push(name);
          }
        }
      }
      _ref1 = sys.files;
      for (name in _ref1) {
        value = _ref1[name];
        if (name.indexOf(path) === 0) {
          name = name.slice(path.length + 1).split('/')[0];
          if (__indexOf.call(result, name) < 0) {
            result.push(name);
          }
        }
      }
      directories = [];
      files = [];
      for (_i = 0, _len = result.length; _i < _len; _i++) {
        name = result[_i];
        if (this.isdir(path + '/' + name)) {
          directories.push(name);
        } else {
          files.push(name);
        }
      }
      switch (type) {
        case 'directory':
          return directories;
        case 'file':
          return files;
        default:
          return result;
      }
    };

    _Class.prototype.isdir = function(path) {
      var file, module, name, value, _ref, _ref1;
      path = sys.abspath(this.origin, path);
      module = sys.modules[path];
      if (module != null) {
        return false;
      }
      file = sys.files[path];
      if (file != null) {
        return false;
      }
      _ref = sys.modules;
      for (name in _ref) {
        value = _ref[name];
        if (name.indexOf(path) === 0) {
          return true;
        }
      }
      _ref1 = sys.files;
      for (name in _ref1) {
        value = _ref1[name];
        if (name.indexOf(path) === 0) {
          return true;
        }
      }
      throw new Error('Path does not exist: ' + path);
    };

    _Class.prototype.open = function(path) {
      return new sys.File(sys.abspath(this.origin, path));
    };

    return _Class;

  })(),
  require: function(moduleName) {
    var exports, fs, module, require;
    if (moduleName != null) {
      module = this.modules[moduleName];
      if (module === void 0) {
        module = this.modules[moduleName + '/module'];
        if (module != null) {
          moduleName = moduleName + '/module';
        } else {
          throw new Error('Module not found: ' + moduleName);
        }
      }
      if (module.instance === null) {
        require = (function(_this) {
          return function(requirePath) {
            var path;
            path = _this.abspath(moduleName, requirePath);
            return _this.require(path);
          };
        })(this);
        fs = new sys.FileSystem(moduleName);
        exports = {};
        exports = module.closure(exports, require, fs);
        module.instance = exports;
      }
      return module.instance;
    } else {
      throw new Error('no module name provided');
    }
  }
};
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

sys.defModule('/module', function(exports, require, fs) {
  var WebGLFramework, WebGLTextureOverlay, layer;
  WebGLFramework = require('webgl-framework');
  layer = require('texture-layer');
  WebGLTextureOverlay = (function() {
    function WebGLTextureOverlay() {
      this.draw = __bind(this.draw, this);
      this.canvas = L.DomUtil.create('canvas', 'leaflet-webgl-texture-overlay');
      this.gf = new WebGLFramework({
        canvas: this.canvas
      });
      this.dirty = false;
      this.running = false;
      this.layers = [];
      this.interpolations = ['nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic', 'hex-nearest', 'hex-linear', 'hex-smoothstep', 'bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom'];
      this.fades = ['crossfade', 'dissolve', 'noise', 'fbm'];
    }

    WebGLTextureOverlay.prototype.onAdd = function(map) {
      var size;
      this.map = map;
      this.dirty = true;
      this.running = true;
      size = this.map.getSize();
      this.canvas.width = size.x;
      this.canvas.height = size.y;
      L.DomUtil.addClass(this.canvas, 'leaflet-zoom-animated');
      this.map.getPanes().overlayPane.appendChild(this.canvas);
      this.map.on('movestart', this.move, this);
      this.map.on('move', this.move, this);
      this.map.on('moveend', this.move, this);
      this.map.on('resize', this.resize, this);
      this.map.on('zoomanim', this.zoomanim, this);
      return requestAnimationFrame(this.draw);
    };

    WebGLTextureOverlay.prototype.addTo = function(map) {
      map.addLayer(this);
      return this;
    };

    WebGLTextureOverlay.prototype.onRemove = function(map) {
      this.running = false;
      map.getPanes().overlayPane.removeChild(this.canvas);
      this.map.off('movestart', this.move, this);
      this.map.off('move', this.move, this);
      this.map.off('moveend', this.move, this);
      this.map.off('resize', this.resize, this);
      return this.map.off('zoomanim', this.zoomanim, this);
    };

    WebGLTextureOverlay.prototype.move = function(event) {
      var topleft;
      this.dirty = true;
      topleft = this.map.containerPointToLayerPoint([0, 0]);
      return L.DomUtil.setPosition(this.canvas, topleft);
    };

    WebGLTextureOverlay.prototype.resize = function(event) {
      this.dirty = true;
      this.canvas.width = event.newSize.x;
      return this.canvas.height = event.newSize.y;
    };

    WebGLTextureOverlay.prototype.zoomanim = function(event) {
      var offset, scale;
      scale = this.map.getZoomScale(event.zoom);
      offset = this.map._getCenterOffset(event.center)._multiplyBy(-scale).subtract(this.map._getMapPanePos());
      return this.canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + (" scale(" + scale + ")");
    };

    WebGLTextureOverlay.prototype.draw = function() {
      var bounds, ne, northEast, screenNorth, screenSouth, size, southWest, sw, verticalOffset, verticalSize, zoom, _i, _len, _ref;
      if (this.dirty && this.running) {
        this.dirty = false;
        size = this.map.getSize();
        bounds = this.map.getBounds();
        zoom = this.map.getZoom();
        sw = bounds.getSouthWest();
        ne = bounds.getNorthEast();
        screenNorth = this.map.latLngToContainerPoint(ne).y / size.y;
        screenSouth = this.map.latLngToContainerPoint(sw).y / size.y;
        southWest = this.map.project(sw, 0).divideBy(256);
        northEast = this.map.project(ne, 0).divideBy(256);
        verticalSize = screenSouth - screenNorth;
        verticalOffset = 1.0 - (screenSouth + screenNorth);
        _ref = this.layers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          layer.draw(southWest, northEast, verticalSize, verticalOffset);
        }
      }
      return requestAnimationFrame(this.draw);
    };

    WebGLTextureOverlay.prototype.addLayer = function(params) {
      this.dirty = true;
      layer = new layer.Video(this, params);
      this.layers.push(layer);
      return layer;
    };

    return WebGLTextureOverlay;

  })();
  L.webglTextureOverlay = function() {
    return new WebGLTextureOverlay();
  };
  return exports;
});
sys.defModule('/texture-layer/base', function(exports, require, fs) {
  var BaseLayer;
  exports = BaseLayer = (function() {
    function BaseLayer() {}

    BaseLayer.prototype.project = function(s, t) {
      var b, lat, lng, x, y, _ref, _ref1;
      b = this.bounds;
      x = b.left + (b.right - b.left) * s;
      y = b.top + (b.bottom - b.top) * t;
      _ref = this.projection.forward([x, y]), lng = _ref[0], lat = _ref[1];
      lng += 360;
      _ref1 = this.map.project({
        lat: lat,
        lng: lng
      }, 0).divideBy(256), x = _ref1.x, y = _ref1.y;
      return {
        x: x - 1,
        y: y
      };
    };

    BaseLayer.prototype.tessellate = function(data) {
      var centroids, d, o, p0, p1, p2, p3, s, sOffset, sScale, size, t, tOffset, tScale, v, x, x0, x1, y, y0, y1, _i, _j, _k, _l, _ref;
      size = 50;
      sScale = (data.width + 1) / data.width;
      sOffset = 0.5 / data.width;
      tScale = (data.height + 1) / data.height;
      tOffset = 0.5 / data.height;
      centroids = [];
      for (t = _i = 0; 0 <= size ? _i <= size : _i >= size; t = 0 <= size ? ++_i : --_i) {
        t = t / size;
        for (s = _j = 0; 0 <= size ? _j <= size : _j >= size; s = 0 <= size ? ++_j : --_j) {
          s = s / size;
          _ref = this.project(s * sScale - sOffset, t * tScale - tOffset), x = _ref.x, y = _ref.y;
          centroids.push({
            x: x,
            y: y,
            s: s,
            t: t
          });
        }
      }
      v = new Float32Array(Math.pow(size, 2) * 3 * 4 * 2);
      o = 0;
      d = size + 1;
      for (y = _k = 0; 0 <= size ? _k < size : _k > size; y = 0 <= size ? ++_k : --_k) {
        y0 = y * d;
        y1 = (y + 1) * d;
        for (x = _l = 0; 0 <= size ? _l < size : _l > size; x = 0 <= size ? ++_l : --_l) {
          x0 = x;
          x1 = x + 1;
          p0 = centroids[x0 + y0];
          p1 = centroids[x1 + y0];
          p2 = centroids[x0 + y1];
          p3 = centroids[x1 + y1];
          v[o++] = p0.x;
          v[o++] = p0.y;
          v[o++] = p0.s;
          v[o++] = p0.t;
          v[o++] = p1.x;
          v[o++] = p1.y;
          v[o++] = p1.s;
          v[o++] = p1.t;
          v[o++] = p2.x;
          v[o++] = p2.y;
          v[o++] = p2.s;
          v[o++] = p2.t;
          v[o++] = p1.x;
          v[o++] = p1.y;
          v[o++] = p1.s;
          v[o++] = p1.t;
          v[o++] = p2.x;
          v[o++] = p2.y;
          v[o++] = p2.s;
          v[o++] = p2.t;
          v[o++] = p3.x;
          v[o++] = p3.y;
          v[o++] = p3.s;
          v[o++] = p3.t;
        }
      }
      return this.state.vertices(v);
    };

    BaseLayer.prototype.setColormap = function(data) {
      var color, i, _i, _len, _ref, extend = L.Util.extend;
      this.parent.dirty = true;
      data = data.slice();
      // deep copies of color objects
      data.unshift( extend({}, data[0]) );
      data.push( extend({}, data[data.length - 1]) );
      data[0].alpha = 0;
      // readjust centers of new color indices
      data[0].center = 0;
      data[data.length - 1].center = data.length;
      _len = data.length;
      this.colormap = new Float32Array(17 * 5);
      for (i = _i = 0; _i < _len; i = ++_i) {
        color = data[i];
        this.colormap[i * 5 + 0] = color.r / 255;
        this.colormap[i * 5 + 1] = color.g / 255;
        this.colormap[i * 5 + 2] = color.b / 255;
        this.colormap[i * 5 + 3] = (_ref = color.alpha) != null ? _ref : 1;
        this.colormap[i * 5 + 4] = color.center;
      }
      return this.haveColormap = true;
    };

    BaseLayer.prototype.testMarkers = function() {
      var b, i, j, lat, lng, s, t, x, y, _i, _j, _ref, _ref1, _ref2;
      s = 0;
      t = 0;
      b = this.bounds;
      for (i = _i = 0, _ref = this.texture.width; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        for (j = _j = 0, _ref1 = this.texture.height; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
          s = i / (this.texture.width - 1);
          t = j / (this.texture.height - 1);
          x = b.left + (b.right - b.left) * s;
          y = b.top + (b.bottom - b.top) * t;
          _ref2 = this.projection.forward([x, y]), lng = _ref2[0], lat = _ref2[1];
          L.circleMarker({
            lat: lat,
            lng: lng
          }, {
            radius: 1
          }).addTo(this.map);
        }
      }
      return 's = 0\nt = 0\nb = @bounds\nfor i in [0...@texture.width]\n    for j in [0...@texture.height]\n        if j % 2 == 0\n            s = i/(@texture.width-0.5)\n        else\n            s = (i+0.5)/(@texture.width-0.5)\n        t = j/(@texture.height-1)\n        x = b.left + (b.right - b.left)*s\n        y = b.top + (b.bottom - b.top)*t\n        [lng,lat] = @projection.forward([x,y])\n        L.circleMarker({lat:lat, lng:lng}, {radius:1}).addTo(@map)';
    };

    return BaseLayer;

  })();
  return exports;
});
sys.defFile("/texture-layer/display.shader", "#file /texture-layer/display.shader\nvarying vec2 vTexcoord;\n\nvertex:\n    attribute vec2 position, texcoord;\n    uniform float verticalSize, verticalOffset;\n    \n    struct SlippyBounds{\n        vec2 southWest, northEast;\n    };\n    uniform SlippyBounds slippyBounds;\n\n    void main(){\n        vTexcoord = texcoord;\n        vec2 pos = position;\n\n        pos = linstepOpen(slippyBounds.southWest, slippyBounds.northEast, pos)*2.0-1.0;\n\n        pos = vec2(\n            pos.x,\n            pos.y*verticalSize + verticalOffset\n        );\n\n        gl_Position = vec4(pos, 0, 1);\n    }\n\nfragment:\n    uniform vec2 sourceSize;\n\n    uniform float colormap[18*5];\n    uniform float minIntensity;\n    uniform float maxIntensity;\n                \n    float fade(vec3 range, float value){\n        return clamp(\n            linstep(range.x, range.y, value) - linstep(range.y, range.z, value),\n        0.0, 1.0);\n    }\n    \n    vec4 colorFun(float intensity){\n        vec4 result = vec4(0.0);\n        for(int i=1; i<15; i++){\n            float r = colormap[i*5+0];\n            float g = colormap[i*5+1];\n            float b = colormap[i*5+2];\n            float a = colormap[i*5+3];\n            vec3 color = degammasRGB(vec3(r,g,b));\n\n            float left = colormap[(i-1)*5+4];\n            float center = colormap[i*5+4];\n            float right = colormap[(i+1)*5+4];\n\n            result += fade(vec3(left, center, right), intensity) * vec4(color, a);\n        }\n        return result;\n    }\n   \n    void main(){\n        float intensityScalar = texture2DInterp(vTexcoord, sourceSize).r;\n        float intensity = mix(minIntensity, maxIntensity, intensityScalar);\n        vec4 color = colorFun(intensity);\n        gl_FragColor = vec4(gammasRGB(color.rgb)*color.a, color.a);\n        //gl_FragColor = vec4(vec3(intensityScalar), 1);\n    }");
sys.defModule('/texture-layer/module', function(exports, require, fs) {
  exports.Video = require('video');
  return exports;
});
sys.defFile("/texture-layer/texfuns/intensity.shader", "#file /texture-layer/texfuns/intensity.shader\nfragment:\n    uniform float mixFactor;\n    uniform sampler2D source0, source1;\n    float textureIntensity(vec2 coord, vec2 size){\n        float intensity0 = texture2D(source0, coord).r;\n        float intensity1 = texture2D(source1, coord).r;\n        return fadeFun(intensity0, intensity1, mixFactor, coord, size);\n    }\n");
sys.defFile("/texture-layer/texfuns/interpolation/bell.shader", "#file /texture-layer/texfuns/interpolation/bell.shader\nfragment:\n    float interp(float x){\n        float f = ( x / 2.0 ) * 1.5; // Converting -2 to +2 to -1.5 to +1.5\n        if( f > -1.5 && f < -0.5 ){\n            return( 0.5 * pow(f + 1.5, 2.0));\n        }\n        else if( f > -0.5 && f < 0.5 ){\n            return 3.0 / 4.0 - ( f * f );\n        }\n        else if( ( f > 0.5 && f < 1.5 ) ){\n            return( 0.5 * pow(f - 1.5, 2.0));\n        }\n        return 0.0;\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/bicubicLinear.shader", "#file /texture-layer/texfuns/interpolation/bicubicLinear.shader\nfragment:\n    float interp(float x){\n        return 1.0-linstep(0.0, 1.5, abs(x));\n    } ");
sys.defFile("/texture-layer/texfuns/interpolation/bicubicSmoothstep.shader", "#file /texture-layer/texfuns/interpolation/bicubicSmoothstep.shader\nfragment:\n    float interp(float x){\n        return 1.0-smoothstep(0.0, 1.5, abs(x));\n    } ");
sys.defFile("/texture-layer/texfuns/interpolation/bspline.shader", "#file /texture-layer/texfuns/interpolation/bspline.shader\nfragment:\n    float interp(float x){\n        float f = x;\n        if(f < 0.0){\n            f = -f;\n        }\n        if(f >= 0.0 && f <= 1.0){\n            return ( 2.0 / 3.0 ) + ( 0.5 ) * ( f* f * f ) - (f*f);\n        }\n        else if( f > 1.0 && f <= 2.0 ){\n            return 1.0 / 6.0 * pow( ( 2.0 - f  ), 3.0 );\n        }\n        return 1.0;\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/catmull-rom.shader", "#file /texture-layer/texfuns/interpolation/catmull-rom.shader\nfragment:\n    float interp(float x){\n        const float B = 0.0;\n        const float C = 0.5;\n        float f = x;\n        if( f < 0.0 ){\n            f = -f;\n        }\n        if( f < 1.0 ){\n            return ( ( 12.0 - 9.0 * B - 6.0 * C ) * ( f * f * f ) +\n                ( -18.0 + 12.0 * B + 6.0 *C ) * ( f * f ) +\n                ( 6.0 - 2.0 * B ) ) / 6.0;\n        }\n        else if( f >= 1.0 && f < 2.0 ){\n            return ( ( -B - 6.0 * C ) * ( f * f * f )\n                + ( 6.0 * B + 30.0 * C ) * ( f *f ) +\n                ( - ( 12.0 * B ) - 48.0 * C  ) * f +\n                8.0 * B + 24.0 * C)/ 6.0;\n        }\n        else{\n            return 0.0;\n        }\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/classicBicubic.shader", "#file /texture-layer/texfuns/interpolation/classicBicubic.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        vec2 f = fract(coord*size-0.5);\n        vec2 c = floor(coord*size-0.5);\n\n        vec2 st0 = ((2.0 - f) * f - 1.0) * f;\n        vec2 st1 = (3.0 * f - 5.0) * f * f + 2.0;\n        vec2 st2 = ((4.0 - 3.0 * f) * f + 1.0) * f;\n        vec2 st3 = (f - 1.0) * f * f;\n        vec4 row0 =\n            st0.s * texture2DRect(c + vec2(-1.0, -1.0), size) +\n            st1.s * texture2DRect(c + vec2(0.0, -1.0), size) +\n            st2.s * texture2DRect(c + vec2(1.0, -1.0), size) +\n            st3.s * texture2DRect(c + vec2(2.0, -1.0), size);\n        vec4 row1 =\n            st0.s * texture2DRect(c + vec2(-1.0, 0.0), size) +\n            st1.s * texture2DRect(c + vec2(0.0, 0.0), size) +\n            st2.s * texture2DRect(c + vec2(1.0, 0.0), size) +\n            st3.s * texture2DRect(c + vec2(2.0, 0.0), size);\n        vec4 row2 =\n            st0.s * texture2DRect(c + vec2(-1.0, 1.0), size) +\n            st1.s * texture2DRect(c + vec2(0.0, 1.0), size) +\n            st2.s * texture2DRect(c + vec2(1.0, 1.0), size) +\n            st3.s * texture2DRect(c + vec2(2.0, 1.0), size);\n        vec4 row3 =\n            st0.s * texture2DRect(c + vec2(-1.0, 2.0), size) +\n            st1.s * texture2DRect(c + vec2(0.0, 2.0), size) +\n            st2.s * texture2DRect(c + vec2(1.0, 2.0), size) +\n            st3.s * texture2DRect(c + vec2(2.0, 2.0), size);\n\n        return 0.25 * ((st0.t * row0) + (st1.t * row1) + (st2.t * row2) + (st3.t * row3));\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/euclidian.shader", "#file /texture-layer/texfuns/interpolation/euclidian.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        vec2 f = fract(coord*size-0.5);\n        vec2 c = floor(coord*size-0.5);\n\n        vec4 sum = vec4(0.0);\n        float denom = 0.0;\n        for(int x = -1; x <=2; x++){\n            for(int y =-1; y<= 2; y++){\n                vec4 color = texture2DRect(c + vec2(x,y), size);\n                float dist = distance(vec2(x,y), f);\n                float factor = 1.0-smoothstep(0.0, 2.0, dist);\n                sum += color * factor;\n                denom += factor;\n            }\n        }\n        return sum/denom;\n    }\n");
sys.defFile("/texture-layer/texfuns/interpolation/generalBicubic.shader", "#file /texture-layer/texfuns/interpolation/generalBicubic.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        vec2 f = fract(coord*size-0.5);\n        vec2 c = floor(coord*size-0.5);\n        vec4 sum = vec4(0.0);\n        float denom = 0.0;\n        for(int x = -1; x <=2; x++){\n            for(int y =-1; y<= 2; y++){\n                vec4 color = texture2DRect(c + vec2(x,y), size);\n                float fx  = interp(float(x) - f.x);\n                float fy = interp(float(y) - f.y);\n                sum += color * fx * fy;\n                denom += fx*fy;\n            }\n        }\n        return sum/denom;\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/hex-linear.shader", "#file /texture-layer/texfuns/interpolation/hex-linear.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        coord.x *= (size.x+0.5)/size.x;\n        float xoff = abs(1.0-mod(coord.y*size.y+0.5, 2.0));\n        coord.x -= (xoff*0.5)/size.x;\n        \n        vec2 f = fract(coord*size+0.5);\n        float even = step(1.0, mod(coord.y*size.y+0.5, 2.0));\n        f.x = mix(1.0-f.x, f.x, even);\n        float side = step(1.0, f.x+f.y);\n\n        vec3 bc = vec3(\n            mix(\n                f.xy,\n                1.0-f.yx,\n                side\n            ),\n            fract(abs(f.x+f.y-1.0))\n        );\n\n        vec2 c = floor(coord*size-0.5);\n\n        vec2 right = mix(\n            c,\n            c+vec2(1, 0),\n            even\n        )/size;\n\n        vec2 bottom = mix(\n            c+vec2(1),\n            c+vec2(0, 1),\n            even\n        )/size;\n\n        vec2 diag = mix(\n            c+mix(vec2(1,0), vec2(0,1), side),\n            c+vec2(side),\n            even\n        )/size;\n\n        float tRight = textureIntensity(right, size);\n        float tBottom = textureIntensity(bottom, size);\n        float tDiag = textureIntensity(diag, size);\n\n        return vec4(tRight*bc.x + tBottom*bc.y + tDiag*bc.z);\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/hex-nearest.shader", "#file /texture-layer/texfuns/interpolation/hex-nearest.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        coord.x *= (size.x+0.5)/size.x;\n        float xoff = abs(1.0-mod(coord.y*size.y+0.5, 2.0));\n        coord.x -= (xoff*0.5)/size.x;\n        \n        vec2 f = fract(coord*size+0.5);\n        float even = step(1.0, mod(coord.y*size.y+0.5, 2.0));\n        f.x = mix(1.0-f.x, f.x, even);\n        float side = step(1.0, f.x+f.y);\n\n        vec3 bc = vec3(\n            mix(\n                f.xy,\n                1.0-f.yx,\n                side\n            ),\n            fract(abs(f.x+f.y-1.0))\n        );\n\n        vec2 c = floor(coord*size-0.5);\n\n        vec2 right = mix(\n            c,\n            c+vec2(1, 0),\n            even\n        )/size;\n\n        vec2 bottom = mix(\n            c+vec2(1),\n            c+vec2(0, 1),\n            even\n        )/size;\n\n        vec2 diag = mix(\n            c+mix(vec2(1,0), vec2(0,1), side),\n            c+vec2(side),\n            even\n        )/size;\n\n        float tRight = textureIntensity(right, size);\n        float tBottom = textureIntensity(bottom, size);\n        float tDiag = textureIntensity(diag, size);\n\n        float result = mix(tRight, tBottom, step(bc.x, bc.y));\n        result = mix(tDiag, result, step(bc.z, max(bc.x, bc.y)));\n        return vec4(result);\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/hex-smoothstep.shader", "#file /texture-layer/texfuns/interpolation/hex-smoothstep.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        coord.x *= (size.x+0.5)/size.x;\n        float xoff = abs(1.0-mod(coord.y*size.y+0.5, 2.0));\n        coord.x -= (xoff*0.5)/size.x;\n        \n        vec2 f = fract(coord*size+0.5);\n        float even = step(1.0, mod(coord.y*size.y+0.5, 2.0));\n        f.x = mix(1.0-f.x, f.x, even);\n        float side = step(1.0, f.x+f.y);\n\n        vec3 bc = vec3(\n            mix(\n                f.xy,\n                1.0-f.yx,\n                side\n            ),\n            fract(abs(f.x+f.y-1.0))\n        );\n\n        vec2 c = floor(coord*size-0.5);\n\n        vec2 right = mix(\n            c,\n            c+vec2(1, 0),\n            even\n        )/size;\n\n        vec2 bottom = mix(\n            c+vec2(1),\n            c+vec2(0, 1),\n            even\n        )/size;\n\n        vec2 diag = mix(\n            c+mix(vec2(1,0), vec2(0,1), side),\n            c+vec2(side),\n            even\n        )/size;\n\n        float tRight = textureIntensity(right, size);\n        float tBottom = textureIntensity(bottom, size);\n        float tDiag = textureIntensity(diag, size);\n\n        bc = smoothstep(0.0, 1.0, bc);\n        bc /= bc.x+bc.y+bc.z;\n\n        return vec4(tRight*bc.x + tBottom*bc.y + tDiag*bc.z);\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/lerp.shader", "#file /texture-layer/texfuns/interpolation/lerp.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        vec2 f = fract(coord*size-0.5);\n        vec2 c = floor(coord*size-0.5);\n\n        vec4 lb = texture2DRect(c+vec2(0.0, 0.0), size);\n        vec4 lt = texture2DRect(c+vec2(0.0, 1.0), size);\n        vec4 rb = texture2DRect(c+vec2(1.0, 0.0), size);\n        vec4 rt = texture2DRect(c+vec2(1.0, 1.0), size);\n\n        vec4 a = mix(lb, lt, f.t);\n        vec4 b = mix(rb, rt, f.t);\n        return mix(a, b, f.s);\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/nearest.shader", "#file /texture-layer/texfuns/interpolation/nearest.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        return texture2DRect(floor(coord*size), size);\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/polynom6th.shader", "#file /texture-layer/texfuns/interpolation/polynom6th.shader\nfragment:\n    float interp(float x){\n        float t = 1.0-linstep(0.0, 1.5, abs(x));\n        return t*t*t*(t*(t*6.0-15.0)+10.0);\n    } ");
sys.defFile("/texture-layer/texfuns/interpolation/rect.shader", "#file /texture-layer/texfuns/interpolation/rect.shader\nfragment:\n    vec4 texture2DRect(vec2 coord, vec2 size){\n        return vec4(textureIntensity((coord+0.5)/size, size));\n    }");
sys.defFile("/texture-layer/texfuns/interpolation/smoothstep.shader", "#file /texture-layer/texfuns/interpolation/smoothstep.shader\nfragment:\n    vec4 texture2DInterp(vec2 coord, vec2 size){\n        vec2 f = smoothstep(0.0, 1.0, fract(coord*size-0.5));\n        vec2 c = floor(coord*size-0.5);\n\n        vec4 lb = texture2DRect(c+vec2(0.0, 0.0), size);\n        vec4 lt = texture2DRect(c+vec2(0.0, 1.0), size);\n        vec4 rb = texture2DRect(c+vec2(1.0, 0.0), size);\n        vec4 rt = texture2DRect(c+vec2(1.0, 1.0), size);\n\n        vec4 a = mix(lb, lt, f.t);\n        vec4 b = mix(rb, rt, f.t);\n        return mix(a, b, f.s);\n    }");
sys.defFile("/texture-layer/texfuns/tween/crossfade.shader", "#file /texture-layer/texfuns/tween/crossfade.shader\nfragment:\n    float fadeFun(float a, float b, float f, vec2 coord, vec2 size){\n        return mix(a, b, f);\n    }");
sys.defFile("/texture-layer/texfuns/tween/dissolve.shader", "#file /texture-layer/texfuns/tween/dissolve.shader\nfragment:\n    float rand(vec2 co){\n        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n    }\n    float fadeFun(float a, float b, float f, vec2 coord, vec2 size){\n        float r1 = rand(coord);\n        float r2 = rand(coord+3.0);\n        r1 = min(r1, r2);\n        r2 = max(r1, r2);\n        f = linstep(r1, r2, f);\n        return mix(a, b, f);\n    }");
sys.defFile("/texture-layer/texfuns/tween/fbm.shader", "#file /texture-layer/texfuns/tween/fbm.shader\nfragment:\n\n    //\n    // Description : Array and textureless GLSL 2D/3D/4D simplex \n    //               noise functions.\n    //      Author : Ian McEwan, Ashima Arts.\n    //  Maintainer : ijm\n    //     Lastmod : 20110822 (ijm)\n    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n    //               Distributed under the MIT License. See LICENSE file.\n    //               https://github.com/ashima/webgl-noise\n    // \n\n    vec3 mod289(vec3 x) {\n      return x - floor(x * (1.0 / 289.0)) * 289.0;\n    }\n\n    vec4 mod289(vec4 x) {\n      return x - floor(x * (1.0 / 289.0)) * 289.0;\n    }\n\n    vec4 permute(vec4 x) {\n         return mod289(((x*34.0)+1.0)*x);\n    }\n\n    vec4 taylorInvSqrt(vec4 r)\n    {\n      return 1.79284291400159 - 0.85373472095314 * r;\n    }\n\n    float snoise(vec3 v)\n      { \n      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n    // First corner\n      vec3 i  = floor(v + dot(v, C.yyy) );\n      vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n    // Other corners\n      vec3 g = step(x0.yzx, x0.xyz);\n      vec3 l = 1.0 - g;\n      vec3 i1 = min( g.xyz, l.zxy );\n      vec3 i2 = max( g.xyz, l.zxy );\n\n      //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n      //   x1 = x0 - i1  + 1.0 * C.xxx;\n      //   x2 = x0 - i2  + 2.0 * C.xxx;\n      //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n      vec3 x1 = x0 - i1 + C.xxx;\n      vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n      vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\n    // Permutations\n      i = mod289(i); \n      vec4 p = permute( permute( permute( \n                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) \n               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n    // Gradients: 7x7 points over a square, mapped onto an octahedron.\n    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n      float n_ = 0.142857142857; // 1.0/7.0\n      vec3  ns = n_ * D.wyz - D.xzx;\n\n      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\n      vec4 x_ = floor(j * ns.z);\n      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n      vec4 x = x_ *ns.x + ns.yyyy;\n      vec4 y = y_ *ns.x + ns.yyyy;\n      vec4 h = 1.0 - abs(x) - abs(y);\n\n      vec4 b0 = vec4( x.xy, y.xy );\n      vec4 b1 = vec4( x.zw, y.zw );\n\n      //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n      //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n      vec4 s0 = floor(b0)*2.0 + 1.0;\n      vec4 s1 = floor(b1)*2.0 + 1.0;\n      vec4 sh = -step(h, vec4(0.0));\n\n      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n      vec3 p0 = vec3(a0.xy,h.x);\n      vec3 p1 = vec3(a0.zw,h.y);\n      vec3 p2 = vec3(a1.xy,h.z);\n      vec3 p3 = vec3(a1.zw,h.w);\n\n    //Normalise gradients\n      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n      p0 *= norm.x;\n      p1 *= norm.y;\n      p2 *= norm.z;\n      p3 *= norm.w;\n\n    // Mix final noise value\n      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n      m = m * m;\n      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), \n                                    dot(p2,x2), dot(p3,x3) ) );\n      }\n\n    uniform float time, spatialFrequency, timeFrequency, amplitude, attack;\n    uniform float spatialLacunarity, timeLacunarity, gain;\n    float noise(vec2 coord){\n        float result = 0.0;\n        for(int i=0; i<5; i++){\n            float fi = float(i);\n            float sl = pow(spatialLacunarity, fi);\n            float tl = pow(timeLacunarity, fi);\n            float g = pow(gain, fi);\n            result += snoise(vec3(coord*spatialFrequency*sl, time*timeFrequency*tl+fi*10.0))*g;\n        }\n        return result;\n    }\n\n    float fadeFun(float a, float b, float f, vec2 coord, vec2 size){\n        float envelope = smoothstep(0.0, attack, f) - smoothstep(1.0-attack, 1.0, f);\n\n        float aspect = size.x/size.y;\n        coord.x = coord.x*aspect;\n\n        float n = noise(coord);\n        n = (n*amplitude)/255.0;\n        return mix(a, b, f) + n*envelope;\n    }");
sys.defFile("/texture-layer/texfuns/tween/noise.shader", "#file /texture-layer/texfuns/tween/noise.shader\nfragment:\n\n    //\n    // Description : Array and textureless GLSL 2D/3D/4D simplex \n    //               noise functions.\n    //      Author : Ian McEwan, Ashima Arts.\n    //  Maintainer : ijm\n    //     Lastmod : 20110822 (ijm)\n    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n    //               Distributed under the MIT License. See LICENSE file.\n    //               https://github.com/ashima/webgl-noise\n    // \n\n    vec3 mod289(vec3 x) {\n      return x - floor(x * (1.0 / 289.0)) * 289.0;\n    }\n\n    vec4 mod289(vec4 x) {\n      return x - floor(x * (1.0 / 289.0)) * 289.0;\n    }\n\n    vec4 permute(vec4 x) {\n         return mod289(((x*34.0)+1.0)*x);\n    }\n\n    vec4 taylorInvSqrt(vec4 r)\n    {\n      return 1.79284291400159 - 0.85373472095314 * r;\n    }\n\n    float snoise(vec3 v)\n      { \n      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n    // First corner\n      vec3 i  = floor(v + dot(v, C.yyy) );\n      vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n    // Other corners\n      vec3 g = step(x0.yzx, x0.xyz);\n      vec3 l = 1.0 - g;\n      vec3 i1 = min( g.xyz, l.zxy );\n      vec3 i2 = max( g.xyz, l.zxy );\n\n      //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n      //   x1 = x0 - i1  + 1.0 * C.xxx;\n      //   x2 = x0 - i2  + 2.0 * C.xxx;\n      //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n      vec3 x1 = x0 - i1 + C.xxx;\n      vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n      vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\n    // Permutations\n      i = mod289(i); \n      vec4 p = permute( permute( permute( \n                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) \n               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n    // Gradients: 7x7 points over a square, mapped onto an octahedron.\n    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n      float n_ = 0.142857142857; // 1.0/7.0\n      vec3  ns = n_ * D.wyz - D.xzx;\n\n      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\n      vec4 x_ = floor(j * ns.z);\n      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n      vec4 x = x_ *ns.x + ns.yyyy;\n      vec4 y = y_ *ns.x + ns.yyyy;\n      vec4 h = 1.0 - abs(x) - abs(y);\n\n      vec4 b0 = vec4( x.xy, y.xy );\n      vec4 b1 = vec4( x.zw, y.zw );\n\n      //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n      //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n      vec4 s0 = floor(b0)*2.0 + 1.0;\n      vec4 s1 = floor(b1)*2.0 + 1.0;\n      vec4 sh = -step(h, vec4(0.0));\n\n      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n      vec3 p0 = vec3(a0.xy,h.x);\n      vec3 p1 = vec3(a0.zw,h.y);\n      vec3 p2 = vec3(a1.xy,h.z);\n      vec3 p3 = vec3(a1.zw,h.w);\n\n    //Normalise gradients\n      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n      p0 *= norm.x;\n      p1 *= norm.y;\n      p2 *= norm.z;\n      p3 *= norm.w;\n\n    // Mix final noise value\n      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n      m = m * m;\n      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), \n                                    dot(p2,x2), dot(p3,x3) ) );\n      }\n\n    uniform float time, spatialFrequency, timeFrequency, amplitude, attack;\n    float fadeFun(float a, float b, float f, vec2 coord, vec2 size){\n        float gain = smoothstep(0.0, attack, f) - smoothstep(1.0-attack, 1.0, f);\n\n        float aspect = size.x/size.y;\n        coord.x = coord.x*aspect;\n\n        float n = snoise(vec3(coord*spatialFrequency, time*timeFrequency));\n        //n = floor(n*amplitude+0.5)/255.0;\n        n = (n*amplitude)/255.0;\n        return mix(a, b, f) + n*gain;\n    }");
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

sys.defModule('/texture-layer/video', function(exports, require, fs) {
  var BaseLayer, TextureVideoLayer;
  BaseLayer = require('base');
  exports = TextureVideoLayer = (function(_super) {
    __extends(TextureVideoLayer, _super);

    function TextureVideoLayer(parent, params) {
      this.parent = parent;
      if (params == null) {
        params = {};
      }
      this.gf = this.parent.gf;
      this.map = this.parent.map;
      this.haveData = false;
      this.haveColormap = false;
      this.mixFactor = 0;
      this.time = 0;
      this.shaders = {
        'crossfade': this.getShadersFadeFun('crossfade'),
        'dissolve': this.getShadersFadeFun('dissolve'),
        'noise': this.getShadersFadeFun('noise'),
        'fbm': this.getShadersFadeFun('fbm')
      };
      this.fadeFun = 'crossfade';
      this.interpolationName = 'bell';
      this.shader = this.gf.shader(this.shaders[this.fadeFun][this.interpolationName]);
      this.state = this.gf.state({
        shader: this.shader,
        vertexbuffer: {
          pointers: [
            {
              name: 'position',
              size: 2
            }, {
              name: 'texcoord',
              size: 2
            }
          ]
        }
      });
      this.texture0 = this.gf.texture2D({
        channels: 'luminance',
        width: 1,
        height: 1,
        filter: 'nearest',
        repeat: 'clamp'
      });
      this.texture1 = this.gf.texture2D({
        channels: 'luminance',
        width: 1,
        height: 1,
        filter: 'nearest',
        repeat: 'clamp'
      });
      if (params.colormap != null) {
        this.setColormap(params.colormap);
      }
      if (params.data != null) {
        this.setData(params.data);
      }
      if (params.interpolation != null) {
        if (params.fadeFun != null) {
          this.fadeFun = params.fadeFun;
        }
        this.setInterpolation(params.interpolation);
      } else if (params.fadeFun != null) {
        this.setFadeFun(params.fadeFun);
      }
    }

    TextureVideoLayer.prototype.getShadersFadeFun = function(fadeFun) {
      var name, shaders, _i, _j, _len, _len1, _ref, _ref1;
      shaders = {};
      _ref = ['nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic', 'hex-nearest', 'hex-linear', 'hex-smoothstep'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        shaders[name] = [fs.open("texfuns/tween/" + fadeFun + ".shader"), fs.open('texfuns/intensity.shader'), fs.open('texfuns/interpolation/rect.shader'), fs.open("texfuns/interpolation/" + name + ".shader"), fs.open('display.shader')];
      }
      _ref1 = ['bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom'];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        name = _ref1[_j];
        shaders[name] = [fs.open("texfuns/tween/" + fadeFun + ".shader"), fs.open('texfuns/intensity.shader'), fs.open('texfuns/interpolation/rect.shader'), fs.open("texfuns/interpolation/" + name + ".shader"), fs.open("texfuns/interpolation/generalBicubic.shader"), fs.open('display.shader')];
      }
      return shaders;
    };

    TextureVideoLayer.prototype.updateBitmaps = function(data) {
      this.bitmaps = data.bitmaps;
      this.firstFrame = this.bitmaps[0];
      this.lastFrame = this.bitmaps[this.bitmaps.length - 1];
      this.frame0 = this.bitmaps[0];
      this.frame1 = this.bitmaps[1 % this.bitmaps.length];
      this.mixFactor = 0;
      this.time = 0;
      this.texture0.dataSized(this.frame0.bitmap, this.width, this.height);
      return this.texture1.dataSized(this.frame1.bitmap, this.width, this.height);
    };

    TextureVideoLayer.prototype.draw = function(southWest, northEast, verticalSize, verticalOffset) {
      var _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
      if (this.haveData && this.haveColormap) {
        this.state.float('colormap', this.colormap).float('mixFactor', this.mixFactor).float('time', this.time).vec2('sourceSize', this.texture1.width, this.texture1.height).sampler('source0', this.texture0).sampler('source1', this.texture1).float('minIntensity', 0).float('maxIntensity', 255).float('verticalSize', verticalSize).float('verticalOffset', verticalOffset).vec2('slippyBounds.southWest', southWest.x, southWest.y).vec2('slippyBounds.northEast', northEast.x, northEast.y);
        if (this.fadeFun === 'noise' || this.fadeFun === 'fbm') {
          if (this.fadeParams != null) {
            this.state.float('spatialFrequency', (_ref3 = this.fadeParams.spatialFrequency) != null ? _ref3 : 10).float('timeFrequency', (_ref2 = this.fadeParams.timeFrequency) != null ? _ref2 : this.bitmaps.length / 2).float('amplitude', (_ref1 = this.fadeParams.amplitude) != null ? _ref1 : 1.0).float('attack', (_ref = this.fadeParams.attack) != null ? _ref : 0.25);
            if (this.fadeFun === 'fbm') {
              this.state.float('spatialLacunarity', (_ref6 = this.fadeParams.spatialLacunarity) != null ? _ref6 : 2).float('timeLacunarity', (_ref5 = this.fadeParams.timeLacunarity) != null ? _ref5 : 1).float('gain', (_ref4 = this.fadeParams.gain) != null ? _ref4 : 0.5);
            }
          } else {
            this.state.float('spatialFrequency', 10).float('timeFrequency', this.bitmaps.length / 2).float('amplitude', 1.0).float('attack', 0.25);
            if (this.fadeFun === 'fbm') {
              this.state.float('spatialLacunarity', 2).float('timeLacunarity', 1).float('gain', 0.5);
            }
          }
        }
        return this.state.draw();
      }
    };

    TextureVideoLayer.prototype.setData = function(data) {
      this.parent.dirty = true;
      this.width = data.width;
      this.height = data.height;
      this.projection = proj4(new proj4.Proj(data.projection), new proj4.Proj('WGS84'));
      this.bounds = data.bounds;
      this.tessellate(data);
      this.updateBitmaps(data);
      return this.haveData = true;
    };

    TextureVideoLayer.prototype.setTime = function(time) {
      var frame0, frame1, i, _i, _ref;
      if (this.bitmaps != null) {
        this.parent.dirty = true;
        if (time < this.bitmaps[0].time) {
          frame0 = this.bitmaps[0];
          frame1 = this.bitmaps[1];
        } else if (time > this.bitmaps[this.bitmaps.length - 1].time) {
          frame0 = this.bitmaps[this.bitmaps.length - 2];
          frame1 = this.bitmaps[this.bitmaps.length - 1];
        } else {
          for (i = _i = 0, _ref = this.bitmaps.length - 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            frame0 = this.bitmaps[i];
            frame1 = this.bitmaps[i + 1];
            if (time >= frame0.time && time <= frame1.time) {
              break;
            }
          }
        }
        this.mixFactor = (time - frame0.time) / (frame1.time - frame0.time);
        if (this.frame0 !== frame0) {
          this.frame0 = frame0;
          this.texture0.dataSized(this.frame0.bitmap, this.width, this.height);
        }
        if (this.frame1 !== frame1) {
          this.frame1 = frame1;
          this.texture1.dataSized(this.frame1.bitmap, this.width, this.height);
        }
        return this.time = (time - this.firstFrame.time) / (this.lastFrame.time - this.firstFrame.time);
      }
    };

    TextureVideoLayer.prototype.setInterpolation = function(interpolationName) {
      this.interpolationName = interpolationName;
      this.parent.dirty = true;
      return this.shader.source(this.shaders[this.fadeFun][this.interpolationName]);
    };

    TextureVideoLayer.prototype.setFadeFun = function(fadeFun, params) {
      this.fadeFun = fadeFun;
      this.fadeParams = params;
      this.parent.dirty = true;
      return this.shader.source(this.shaders[this.fadeFun][this.interpolationName]);
    };

    return TextureVideoLayer;

  })(BaseLayer);
  return exports;
});
sys.defFile("/webgl-framework/blit.shader", "#file /webgl-framework/blit.shader\nvarying vec2 texcoord;\n\nvertex:\n    attribute vec2 position;\n    uniform vec2 viewport;\n\n    void main(){\n        texcoord = position*0.5+0.5;\n        gl_Position = vec4(position, 0, 1);\n    }\n\nfragment:\n    uniform sampler2D source;\n    uniform float scale;\n\n    void main(){\n        gl_FragColor.rgb = texture2D(source, texcoord*scale).rgb;\n        gl_FragColor.a = 1.0;\n    }");
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

sys.defModule('/webgl-framework/framebuffer', function(exports, require, fs) {
  var Framebuffer, FramebufferCube, texture;
  texture = require('texture');
  exports.Framebuffer = Framebuffer = (function() {
    function Framebuffer(gf, params) {
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      this.gl = this.gf.gl;
      this.buffer = this.gl.createFramebuffer();
    }

    Framebuffer.prototype.generateMipmap = function() {
      return this.colorTexture.generateMipmap();
    };

    Framebuffer.prototype.anisotropy = function() {
      return this.colorTexture.anisotropy();
    };

    Framebuffer.prototype.bind = function(unit) {
      if (unit == null) {
        unit = 0;
      }
      return this.colorTexture.bind(unit);
    };

    Framebuffer.prototype.check = function() {
      var result;
      result = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
      switch (result) {
        case this.gl.FRAMEBUFFER_UNSUPPORTED:
          throw 'Framebuffer is unsupported';
          break;
        case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
          throw 'Framebuffer incomplete attachment';
          break;
        case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
          throw 'Framebuffer incomplete dimensions';
          break;
        case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
          throw 'Framebuffer incomplete missing attachment';
      }
      return this;
    };

    Framebuffer.prototype.unuse = function() {
      if (this.gf.currentFramebuffer != null) {
        this.gf.currentFramebuffer = null;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      }
      return this;
    };

    return Framebuffer;

  })();
  exports.Framebuffer2D = Framebuffer = (function(_super) {
    __extends(Framebuffer, _super);

    function Framebuffer(gf, params) {
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      Framebuffer.__super__.constructor.call(this, this.gf, params);
      if (params.color != null) {
        if (params.color instanceof texture.Texture) {
          this.color(params.color);
          this.ownColor = false;
        } else {
          this.color(this.gf.texture2D(params.color));
          this.ownColor = true;
        }
      } else {
        this.ownColor = false;
      }
    }

    Framebuffer.prototype.color = function(colorTexture) {
      this.colorTexture = colorTexture;
      this.use();
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.colorTexture.target, this.colorTexture.handle, 0);
      this.check();
      this.unuse();
      return this;
    };

    Framebuffer.prototype.use = function() {
      if (this.gf.currentFramebuffer !== this) {
        this.gf.currentFramebuffer = this;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.buffer);
      }
      return this;
    };

    Framebuffer.prototype.viewport = function(width, height) {
      if (width == null) {
        width = this.colorTexture.width;
      }
      if (height == null) {
        height = this.colorTexture.height;
      }
      return this.gl.viewport(0, 0, width, height);
    };

    Framebuffer.prototype.destroy = function() {
      this.gl.deleteFramebuffer(this.buffer);
      if (this.ownColor) {
        this.color.destroy();
      }
      return this;
    };

    return Framebuffer;

  })(exports.Framebuffer);
  exports.FramebufferCube = FramebufferCube = (function(_super) {
    __extends(FramebufferCube, _super);

    function FramebufferCube(gf, params) {
      var color;
      this.gf = gf;
      FramebufferCube.__super__.constructor.call(this, this.gf, params);
      this.negativeX = new exports.Framebuffer2D(this.gf);
      this.negativeY = new exports.Framebuffer2D(this.gf);
      this.negativeZ = new exports.Framebuffer2D(this.gf);
      this.positiveX = new exports.Framebuffer2D(this.gf);
      this.positiveY = new exports.Framebuffer2D(this.gf);
      this.positiveZ = new exports.Framebuffer2D(this.gf);
      this.currentSide = this.negativeX;
      color = params.color;
      if (color != null) {
        if (params.color instanceof texture.Texture) {
          this.color(params.color);
        } else {
          this.color(this.gf.textureCube(params.color));
        }
      }
    }

    FramebufferCube.prototype.color = function(colorTexture) {
      this.colorTexture = colorTexture;
      this.negativeX.color(this.colorTexture.negativeX);
      this.negativeY.color(this.colorTexture.negativeY);
      this.negativeZ.color(this.colorTexture.negativeZ);
      this.positiveX.color(this.colorTexture.positiveX);
      this.positiveY.color(this.colorTexture.positiveY);
      return this.positiveZ.color(this.colorTexture.positiveZ);
    };

    FramebufferCube.prototype.destroy = function() {
      this.negativeX.destroy();
      this.negativeY.destroy();
      this.negativeZ.destroy();
      this.positiveX.destroy();
      this.positiveY.destroy();
      return this.positiveZ.destroy();
    };

    FramebufferCube.prototype.cubeSide = function(name) {
      return this.currentSide = this[name];
    };

    FramebufferCube.prototype.use = function() {
      return this.currentSide.use();
    };

    FramebufferCube.prototype.viewport = function(width, height) {
      if (width == null) {
        width = this.colorTexture.size;
      }
      if (height == null) {
        height = this.colorTexture.size;
      }
      return this.gl.viewport(0, 0, width, height);
    };

    return FramebufferCube;

  })(exports.Framebuffer);
  return exports;
});
sys.defModule('/webgl-framework/matrix', function(exports, require, fs) {
  var Mat3, Mat4, arc, deg, tau;
  tau = Math.PI * 2;
  deg = 360 / tau;
  arc = tau / 360;
  exports.Mat3 = Mat3 = (function() {
    function Mat3(view) {
      this.view = view;
      if (this.data == null) {
        this.data = new Float32Array(9);
      }
      this.identity();
    }

    Mat3.prototype.identity = function() {
      var d;
      d = this.data;
      d[0] = 1;
      d[1] = 0;
      d[2] = 0;
      d[3] = 0;
      d[4] = 1;
      d[5] = 0;
      d[6] = 0;
      d[7] = 0;
      d[8] = 1;
      return this;
    };

    Mat3.prototype.rotatex = function(angle) {
      var c, s;
      s = Math.sin(angle * arc);
      c = Math.cos(angle * arc);
      return this.amul(1, 0, 0, 0, c, s, 0, -s, c);
    };

    Mat3.prototype.rotatey = function(angle) {
      var c, s;
      s = Math.sin(angle * arc);
      c = Math.cos(angle * arc);
      return this.amul(c, 0, -s, 0, 1, 0, s, 0, c);
    };

    Mat3.prototype.rotatez = function(angle) {
      var c, s;
      s = Math.sin(angle * arc);
      c = Math.cos(angle * arc);
      return this.amul(c, s, 0, -s, c, 0, 0, 0, 1);
    };

    Mat3.prototype.amul = function(b00, b10, b20, b01, b11, b21, b02, b12, b22, b03, b13, b23) {
      var a, a00, a01, a02, a10, a11, a12, a20, a21, a22;
      a = this.data;
      a00 = a[0];
      a10 = a[1];
      a20 = a[2];
      a01 = a[3];
      a11 = a[4];
      a21 = a[5];
      a02 = a[6];
      a12 = a[7];
      a22 = a[8];
      a[0] = a00 * b00 + a01 * b10 + a02 * b20;
      a[1] = a10 * b00 + a11 * b10 + a12 * b20;
      a[2] = a20 * b00 + a21 * b10 + a22 * b20;
      a[3] = a00 * b01 + a01 * b11 + a02 * b21;
      a[4] = a10 * b01 + a11 * b11 + a12 * b21;
      a[5] = a20 * b01 + a21 * b11 + a22 * b21;
      a[6] = a00 * b02 + a01 * b12 + a02 * b22;
      a[7] = a10 * b02 + a11 * b12 + a12 * b22;
      a[8] = a20 * b02 + a21 * b12 + a22 * b22;
      return this;
    };

    return Mat3;

  })();
  exports.Mat4 = Mat4 = (function() {
    function Mat4(view) {
      this.view = view;
      if (this.data == null) {
        this.data = new Float32Array(16);
      }
      this.identity();
    }

    Mat4.prototype.identity = function() {
      var d;
      d = this.data;
      d[0] = 1;
      d[1] = 0;
      d[2] = 0;
      d[3] = 0;
      d[4] = 0;
      d[5] = 1;
      d[6] = 0;
      d[7] = 0;
      d[8] = 0;
      d[9] = 0;
      d[10] = 1;
      d[11] = 0;
      d[12] = 0;
      d[13] = 0;
      d[14] = 0;
      d[15] = 1;
      return this;
    };

    Mat4.prototype.zero = function() {
      var d;
      d = this.data;
      d[0] = 0;
      d[1] = 0;
      d[2] = 0;
      d[3] = 0;
      d[4] = 0;
      d[5] = 0;
      d[6] = 0;
      d[7] = 0;
      d[8] = 0;
      d[9] = 0;
      d[10] = 0;
      d[11] = 0;
      d[12] = 0;
      d[13] = 0;
      d[14] = 0;
      d[15] = 0;
      return this;
    };

    Mat4.prototype.copy = function(dest) {
      var dst, src;
      if (dest == null) {
        dest = new Mat4();
      }
      src = this.data;
      dst = dest.data;
      dst[0] = src[0];
      dst[1] = src[1];
      dst[2] = src[2];
      dst[3] = src[3];
      dst[4] = src[4];
      dst[5] = src[5];
      dst[6] = src[6];
      dst[7] = src[7];
      dst[8] = src[8];
      dst[9] = src[9];
      dst[10] = src[10];
      dst[11] = src[11];
      dst[12] = src[12];
      dst[13] = src[13];
      dst[14] = src[14];
      dst[15] = src[15];
      return dest;
    };

    Mat4.prototype.perspective = function(fov, aspect, near, far) {
      var bottom, d, hyp, left, rel, right, top, vfov;
      if (fov == null) {
        fov = 60;
      }
      if (aspect == null) {
        aspect = 1;
      }
      if (near == null) {
        near = 0.01;
      }
      if (far == null) {
        far = 100;
      }
      hyp = Math.sqrt(1 + aspect * aspect);
      rel = 1 / hyp;
      vfov = fov * rel;
      this.zero();
      d = this.data;
      top = near * Math.tan(vfov * Math.PI / 360);
      right = top * aspect;
      left = -right;
      bottom = -top;
      d[0] = (2 * near) / (right - left);
      d[5] = (2 * near) / (top - bottom);
      d[8] = (right + left) / (right - left);
      d[9] = (top + bottom) / (top - bottom);
      d[10] = -(far + near) / (far - near);
      d[11] = -1;
      d[14] = -(2 * far * near) / (far - near);
      return this;
    };

    Mat4.prototype.translate = function(x, y, z) {
      var a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, d;
      d = this.data;
      a00 = d[0];
      a01 = d[1];
      a02 = d[2];
      a03 = d[3];
      a10 = d[4];
      a11 = d[5];
      a12 = d[6];
      a13 = d[7];
      a20 = d[8];
      a21 = d[9];
      a22 = d[10];
      a23 = d[11];
      d[12] = a00 * x + a10 * y + a20 * z + d[12];
      d[13] = a01 * x + a11 * y + a21 * z + d[13];
      d[14] = a02 * x + a12 * y + a22 * z + d[14];
      d[15] = a03 * x + a13 * y + a23 * z + d[15];
      return this;
    };

    Mat4.prototype.rotatex = function(angle) {
      var a10, a11, a12, a13, a20, a21, a22, a23, c, d, rad, s;
      d = this.data;
      rad = tau * (angle / 360);
      s = Math.sin(rad);
      c = Math.cos(rad);
      a10 = d[4];
      a11 = d[5];
      a12 = d[6];
      a13 = d[7];
      a20 = d[8];
      a21 = d[9];
      a22 = d[10];
      a23 = d[11];
      d[4] = a10 * c + a20 * s;
      d[5] = a11 * c + a21 * s;
      d[6] = a12 * c + a22 * s;
      d[7] = a13 * c + a23 * s;
      d[8] = a10 * -s + a20 * c;
      d[9] = a11 * -s + a21 * c;
      d[10] = a12 * -s + a22 * c;
      d[11] = a13 * -s + a23 * c;
      return this;
    };

    Mat4.prototype.rotatey = function(angle) {
      var a00, a01, a02, a03, a20, a21, a22, a23, c, d, rad, s;
      d = this.data;
      rad = tau * (angle / 360);
      s = Math.sin(rad);
      c = Math.cos(rad);
      a00 = d[0];
      a01 = d[1];
      a02 = d[2];
      a03 = d[3];
      a20 = d[8];
      a21 = d[9];
      a22 = d[10];
      a23 = d[11];
      d[0] = a00 * c + a20 * -s;
      d[1] = a01 * c + a21 * -s;
      d[2] = a02 * c + a22 * -s;
      d[3] = a03 * c + a23 * -s;
      d[8] = a00 * s + a20 * c;
      d[9] = a01 * s + a21 * c;
      d[10] = a02 * s + a22 * c;
      d[11] = a03 * s + a23 * c;
      return this;
    };

    Mat4.prototype.rotatez = function(angle) {
      var a00, a01, a02, a03, a10, a11, a12, a13, c, d, rad, s;
      d = this.data;
      rad = tau * (angle / 360);
      s = Math.sin(rad);
      c = Math.cos(rad);
      a00 = d[0];
      a01 = d[1];
      a02 = d[2];
      a03 = d[3];
      a10 = d[4];
      a11 = d[5];
      a12 = d[6];
      a13 = d[7];
      d[0] = a00 * c + a10 * s;
      d[1] = a01 * c + a11 * s;
      d[2] = a02 * c + a12 * s;
      d[3] = a03 * c + a13 * s;
      d[4] = a10 * c - a00 * s;
      d[5] = a11 * c - a01 * s;
      d[6] = a12 * c - a02 * s;
      d[7] = a13 * c - a03 * s;
      return this;
    };

    Mat4.prototype.invert = function(destination) {
      var a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33, b00, b01, b02, b03, b04, b05, b06, b07, b08, b09, b10, b11, d, dst, invDet, src;
      if (destination == null) {
        destination = this;
      }
      src = this.data;
      dst = destination.data;
      a00 = src[0];
      a01 = src[1];
      a02 = src[2];
      a03 = src[3];
      a10 = src[4];
      a11 = src[5];
      a12 = src[6];
      a13 = src[7];
      a20 = src[8];
      a21 = src[9];
      a22 = src[10];
      a23 = src[11];
      a30 = src[12];
      a31 = src[13];
      a32 = src[14];
      a33 = src[15];
      b00 = a00 * a11 - a01 * a10;
      b01 = a00 * a12 - a02 * a10;
      b02 = a00 * a13 - a03 * a10;
      b03 = a01 * a12 - a02 * a11;
      b04 = a01 * a13 - a03 * a11;
      b05 = a02 * a13 - a03 * a12;
      b06 = a20 * a31 - a21 * a30;
      b07 = a20 * a32 - a22 * a30;
      b08 = a20 * a33 - a23 * a30;
      b09 = a21 * a32 - a22 * a31;
      b10 = a21 * a33 - a23 * a31;
      b11 = a22 * a33 - a23 * a32;
      d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (d === 0) {
        return;
      }
      invDet = 1 / d;
      dst[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
      dst[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
      dst[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
      dst[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
      dst[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
      dst[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
      dst[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
      dst[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
      dst[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
      dst[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
      dst[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
      dst[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
      dst[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
      dst[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
      dst[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
      dst[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;
      return destination;
    };

    Mat4.prototype.toMat3Rot = function(dest) {
      var a00, a01, a02, a10, a11, a12, a20, a21, a22, b01, b11, b21, d, dst, id, src;
      dst = dest.data;
      src = this.data;
      a00 = src[0];
      a01 = src[1];
      a02 = src[2];
      a10 = src[4];
      a11 = src[5];
      a12 = src[6];
      a20 = src[8];
      a21 = src[9];
      a22 = src[10];
      b01 = a22 * a11 - a12 * a21;
      b11 = -a22 * a10 + a12 * a20;
      b21 = a21 * a10 - a11 * a20;
      d = a00 * b01 + a01 * b11 + a02 * b21;
      id = 1 / d;
      dst[0] = b01 * id;
      dst[3] = (-a22 * a01 + a02 * a21) * id;
      dst[6] = (a12 * a01 - a02 * a11) * id;
      dst[1] = b11 * id;
      dst[4] = (a22 * a00 - a02 * a20) * id;
      dst[7] = (-a12 * a00 + a02 * a10) * id;
      dst[2] = b21 * id;
      dst[5] = (-a21 * a00 + a01 * a20) * id;
      dst[8] = (a11 * a00 - a01 * a10) * id;
      return dest;
    };

    return Mat4;

  })();
  return exports;
});
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

sys.defModule('/webgl-framework/module', function(exports, require, fs) {
  var Shader, ShaderProxy, State, VertexBuffer, WebGLFramework, framebuffer, getExtension, getSupportedExtensions, matrix, shims, texture, textureFloat, vector, vendorRe, vendors, _ref;
  if (window.WebGLRenderingContext != null) {
    vendors = ['WEBKIT', 'MOZ', 'MS', 'O'];
    vendorRe = /^WEBKIT_(.*)|MOZ_(.*)|MS_(.*)|O_(.*)/;
    getExtension = WebGLRenderingContext.prototype.getExtension;
    WebGLRenderingContext.prototype.getExtension = function(name) {
      var extobj, match, vendor, _i, _len;
      match = name.match(vendorRe);
      if (match !== null) {
        name = match[1];
      }
      extobj = getExtension.call(this, name);
      if (extobj === null) {
        for (_i = 0, _len = vendors.length; _i < _len; _i++) {
          vendor = vendors[_i];
          extobj = getExtension.call(this, vendor + '_' + name);
          if (extobj !== null) {
            return extobj;
          }
        }
        return null;
      } else {
        return extobj;
      }
    };
    getSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
      var extension, match, result, supported, _i, _len;
      supported = getSupportedExtensions.call(this);
      result = [];
      for (_i = 0, _len = supported.length; _i < _len; _i++) {
        extension = supported[_i];
        match = extension.match(vendorRe);
        if (match !== null) {
          extension = match[1];
        }
        if (__indexOf.call(result, extension) < 0) {
          result.push(extension);
        }
      }
      return result;
    };
  }
  shims = require('shims');
  textureFloat = require('texture-float');
  texture = require('texture');
  matrix = require('matrix');
  vector = require('vector');
  State = require('state');
  VertexBuffer = require('vertexbuffer');
  _ref = require('shader'), Shader = _ref.Shader, ShaderProxy = _ref.ShaderProxy;
  framebuffer = require('framebuffer');
  exports = WebGLFramework = (function() {
    function WebGLFramework(params) {
      var debug, i, perf, _ref1, _ref2, _ref3;
      if (params == null) {
        params = {};
      }
      debug = (_ref1 = params.debug) != null ? _ref1 : false;
      delete params.debug;
      perf = (_ref2 = params.perf) != null ? _ref2 : false;
      delete params.perf;
      this.canvas = (_ref3 = params.canvas) != null ? _ref3 : document.createElement('canvas');
      delete params.canvas;
      this.gl = this.getContext('webgl', params);
      if (this.gl == null) {
        this.gl = this.getContext('experimental-webgl');
      }
      if (this.gl == null) {
        throw new Error('WebGL is not supported');
      }
      this.textureFloat = textureFloat(this.gl);
      this.vao = null;
      if ((window.WebGLPerfContext != null) && perf) {
        console.log('webgl perf context enabled');
        this.gl = new WebGLPerfContext.create(this.gl);
      } else if ((window.WebGLDebugUtils != null) && debug) {
        console.log('webgl debug enabled');
        this.gl = WebGLDebugUtils.makeDebugContext(this.gl, function(err, funcName, args) {
          throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
        });
      }
      this.currentVertexBuffer = null;
      this.currentShader = null;
      this.currentFramebuffer = null;
      this.currentState = null;
      this.maxAttribs = this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS);
      this.vertexUnits = (function() {
        var _i, _ref4, _results;
        _results = [];
        for (i = _i = 0, _ref4 = this.maxAttribs; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
          _results.push({
            enabled: false,
            pointer: null,
            location: i
          });
        }
        return _results;
      }).call(this);
      this.lineWidth = 1;
      this.quadVertices = this.vertexbuffer({
        pointers: [
          {
            name: 'position',
            size: 2
          }
        ],
        vertices: [-1, -1, 1, -1, 1, 1, -1, 1, -1, -1, 1, 1]
      });
      this.blit = this.state({
        shader: fs.open('blit.shader')
      });
    }

    WebGLFramework.prototype.haveExtension = function(search) {
      var name, _i, _len, _ref1;
      _ref1 = this.gl.getSupportedExtensions();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        name = _ref1[_i];
        if (name.indexOf(search) >= 0) {
          return true;
        }
      }
      return false;
    };

    WebGLFramework.prototype.getContext = function(name, params) {
      var error;
      try {
        return this.canvas.getContext(name, params);
      } catch (_error) {
        error = _error;
        return null;
      }
    };

    WebGLFramework.prototype.state = function(params) {
      return new State(this, params);
    };

    WebGLFramework.prototype.vertexbuffer = function(params) {
      return new VertexBuffer(this, params);
    };

    WebGLFramework.prototype.framebuffer = function(params) {
      if (params.type != null) {
        if (params.type === '2d') {
          return new framebuffer.Framebuffer2D(this, params);
        } else if (params.type === 'cube') {
          return new framebuffer.FramebufferCube(this, params);
        } else {
          throw new Error('unknown framebuffer type: ' + params.type);
        }
      } else {
        return new framebuffer.Framebuffer2D(this, params);
      }
    };

    WebGLFramework.prototype.shader = function(params) {
      return new Shader(this, params);
    };

    WebGLFramework.prototype.shaderProxy = function(shader) {
      return new ShaderProxy(shader);
    };

    WebGLFramework.prototype.mat4 = function(view) {
      return new matrix.Mat4(view);
    };

    WebGLFramework.prototype.mat3 = function(view) {
      return new matrix.Mat3(view);
    };

    WebGLFramework.prototype.vec3 = function(x, y, z) {
      return new vector.Vec3(x, y, z);
    };

    WebGLFramework.prototype.clearColor = function(r, g, b, a) {
      this.gl.clearColor(r, g, b, a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      return this;
    };

    WebGLFramework.prototype.frameStart = function() {
      var factor;
      if (fullscreen.element() != null) {
        factor = 1;
      } else {
        factor = 2;
      }
      if (this.canvas.offsetWidth * factor !== this.canvas.width) {
        this.canvas.width = this.canvas.offsetWidth * factor;
      }
      if (this.canvas.offsetHeight * factor !== this.canvas.height) {
        this.canvas.height = this.canvas.offsetHeight * factor;
      }
      if (this.gl.performance != null) {
        this.gl.performance.start();
      }
      return this;
    };

    WebGLFramework.prototype.frameEnd = function() {
      if (this.gl.performance != null) {
        this.gl.performance.stop();
      }
      return this;
    };

    WebGLFramework.prototype.texture2D = function(params) {
      return new texture.Texture2D(this, params);
    };

    WebGLFramework.prototype.textureCube = function(params) {
      return new texture.TextureCube(this, params);
    };

    WebGLFramework.prototype.getExtension = function(name) {
      return this.gl.getExtension(name);
    };

    WebGLFramework.prototype.htmlColor2Vec = function(value) {
      var b, g, r;
      r = parseInt(value.slice(0, 2), 16) / 255;
      g = parseInt(value.slice(2, 4), 16) / 255;
      b = parseInt(value.slice(4), 16) / 255;
      return {
        r: r,
        g: g,
        b: b
      };
    };

    return WebGLFramework;

  })();
  return exports;
});
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

sys.defModule('/webgl-framework/shader', function(exports, require, fs) {
  var Shader, ShaderObj, ShaderProxy, boilerplate, matrix;
  matrix = require('matrix');
  exports.ShaderObj = ShaderObj = (function() {
    function ShaderObj() {}

    return ShaderObj;

  })();
  boilerplate = '    precision highp int;\n    precision highp float;\n    #define PI 3.141592653589793\n    #define TAU 6.283185307179586\n    #define PIH 1.5707963267948966\n    #define E 2.7182818284590451\n    float angleBetween(vec3 a, vec3 b){return acos(dot(a,b));}\n\n    vec3 gamma(vec3 color){\n        return pow(color, vec3(1.0/2.4)); \n    }\n\n    vec3 degamma(vec3 color){\n        return pow(color, vec3(2.4));\n    }\n\n    vec3 gammasRGB(vec3 color){\n        return mix(\n            color*12.92,\n            pow(color, vec3(1.0/2.4))*1.055-0.055,\n            step((0.04045/12.92), color)\n        );\n    }\n\n    vec3 degammasRGB(vec3 color){\n        return mix(\n            color/12.92,\n            pow((color+0.055)/1.055, vec3(2.4)),\n            step(0.04045, color)\n        );\n    }\n    \n    float linstep(float edge0, float edge1, float value){\n        return clamp((value-edge0)/(edge1-edge0), 0.0, 1.0);\n    }\n    \n    float linstepOpen(float edge0, float edge1, float value){\n        return (value-edge0)/(edge1-edge0);\n    }\n\n    vec2 linstep(vec2 edge0, vec2 edge1, vec2 value){\n        return clamp((value-edge0)/(edge1-edge0), vec2(0.0), vec2(1.0));\n    }\n    \n    vec2 linstepOpen(vec2 edge0, vec2 edge1, vec2 value){\n        return (value-edge0)/(edge1-edge0);\n    }';
  exports.Shader = Shader = (function(_super) {
    __extends(Shader, _super);

    function Shader(gf, params) {
      this.gf = gf;
      this.gl = this.gf.gl;
      this.program = this.gl.createProgram();
      this.vs = this.gl.createShader(this.gl.VERTEX_SHADER);
      this.fs = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      this.gl.attachShader(this.program, this.vs);
      this.gl.attachShader(this.program, this.fs);
      this.source(params);
    }

    Shader.prototype.source = function(params) {
      var c, common, f, file, fragment, v, vertex, _i, _len, _ref, _ref1, _ref2;
      if (typeof params === 'string') {
        _ref = this.splitSource(params), common = _ref[0], vertex = _ref[1], fragment = _ref[2];
      } else if (params instanceof sys.File) {
        _ref1 = this.splitSource(params.read()), common = _ref1[0], vertex = _ref1[1], fragment = _ref1[2];
      } else if (params instanceof Array) {
        common = [];
        vertex = [];
        fragment = [];
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          file = params[_i];
          _ref2 = this.splitSource(file.read()), c = _ref2[0], v = _ref2[1], f = _ref2[2];
          if (c.length > 0) {
            common.push(c);
          }
          if (v.length > 0) {
            vertex.push(v);
          }
          if (f.length > 0) {
            fragment.push(f);
          }
        }
        common = common.join('\n');
        vertex = vertex.join('\n');
        fragment = fragment.join('\n');
      }
      return this.setSource({
        common: common,
        vertex: vertex,
        fragment: fragment
      });
    };

    Shader.prototype.destroy = function() {
      this.gl.deleteShader(this.vs);
      this.gl.deleteShader(this.fs);
      return this.gl.deleteProgram(this.program);
    };

    Shader.prototype.splitSource = function(source) {
      var common, current, filename, fragment, line, linenum, lines, vertex, _i, _len;
      common = [];
      vertex = [];
      fragment = [];
      current = common;
      lines = source.trim().split('\n');
      filename = lines.shift().split(' ')[1];
      for (linenum = _i = 0, _len = lines.length; _i < _len; linenum = ++_i) {
        line = lines[linenum];
        if (line.match(/vertex:$/)) {
          current = vertex;
        } else if (line.match(/fragment:$/)) {
          current = fragment;
        } else {
          current.push("#line " + linenum + " " + filename);
          current.push(line);
        }
      }
      return [common.join('\n').trim(), vertex.join('\n').trim(), fragment.join('\n').trim()];
    };

    Shader.prototype.preprocess = function(source) {
      var filename, line, lineno, lines, match, result, _i, _len, _ref;
      lines = [];
      result = [];
      filename = 'no file';
      lineno = 1;
      _ref = source.trim().split('\n');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        match = line.match(/#line (\d+) (.*)/);
        if (match) {
          lineno = parseInt(match[1], 10) + 1;
          filename = match[2];
        } else {
          lines.push({
            source: line,
            lineno: lineno,
            filename: filename
          });
          result.push(line);
          lineno += 1;
        }
      }
      return [result.join('\n'), lines];
    };

    Shader.prototype.setSource = function(_arg) {
      var common, fragment, vertex;
      common = _arg.common, vertex = _arg.vertex, fragment = _arg.fragment;
      this.uniformCache = {};
      this.attributeCache = {};
      if (common == null) {
        common = '';
      }
      this.compileShader(this.vs, [common, vertex].join('\n'));
      this.compileShader(this.fs, [common, fragment].join('\n'));
      return this.link();
    };

    Shader.prototype.compileShader = function(shader, source) {
      var error, lines, _ref;
      source = [boilerplate, source].join('\n');
      _ref = this.preprocess(source), source = _ref[0], lines = _ref[1];
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        error = this.gl.getShaderInfoLog(shader);
        throw this.translateError(error, lines);
      }
    };

    Shader.prototype.link = function() {
      this.gl.linkProgram(this.program);
      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        throw new Error("Shader Link Error: " + (this.gl.getProgramInfoLog(this.program)));
      }
    };

    Shader.prototype.translateError = function(error, lines) {
      var i, line, lineno, match, message, result, sourceline, _i, _len, _ref;
      result = ['Shader Compile Error'];
      _ref = error.split('\n');
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        line = _ref[i];
        match = line.match(/ERROR: \d+:(\d+): (.*)/);
        if (match) {
          lineno = parseFloat(match[1]) - 1;
          message = match[2];
          sourceline = lines[lineno];
          result.push("File \"" + sourceline.filename + "\", Line " + sourceline.lineno + ", " + message);
          result.push("   " + sourceline.source);
        } else {
          result.push(line);
        }
      }
      return result.join('\n');
    };

    Shader.prototype.attributeLocation = function(name) {
      var location;
      location = this.attributeCache[name];
      if (location === void 0) {
        location = this.gl.getAttribLocation(this.program, name);
        if (location >= 0) {
          this.attributeCache[name] = location;
          return location;
        } else {
          this.attributeCache[name] = null;
          return null;
        }
      } else {
        return location;
      }
    };

    Shader.prototype.uniformLocation = function(name) {
      var location;
      location = this.uniformCache[name];
      if (location === void 0) {
        location = this.gl.getUniformLocation(this.program, name);
        if (location != null) {
          this.uniformCache[name] = location;
          return location;
        } else {
          this.uniformCache[name] = null;
          return null;
        }
      } else {
        return location;
      }
    };

    Shader.prototype.use = function() {
      if (this.gf.currentShader !== this) {
        this.gf.currentShader = this;
        return this.gl.useProgram(this.program);
      }
    };

    Shader.prototype.mat4 = function(name, value) {
      var location;
      if (value instanceof matrix.Mat4) {
        value = value.data;
      }
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        this.gl.uniformMatrix4fv(location, false, value);
      }
      return this;
    };

    Shader.prototype.mat3 = function(name, value) {
      var location;
      if (value instanceof matrix.Mat3) {
        value = value.data;
      }
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        this.gl.uniformMatrix3fv(location, false, value);
      }
      return this;
    };

    Shader.prototype.vec2 = function(name, a, b) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        if (a instanceof Array || a instanceof Float32Array) {
          this.gl.uniform2fv(location, a);
        } else {
          this.gl.uniform2f(location, a, b);
        }
      }
      return this;
    };

    Shader.prototype.vec3 = function(name, a, b, c) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        if (a instanceof Array || a instanceof Float32Array) {
          this.gl.uniform3fv(location, a);
        } else {
          this.gl.uniform3f(location, a, b, c);
        }
      }
      return this;
    };

    Shader.prototype.vec4 = function(name, a, b, c, d) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        if (a instanceof Array || a instanceof Float32Array) {
          this.gl.uniform4fv(location, a);
        } else {
          this.gl.uniform4f(location, a, b, c, d);
        }
      }
      return this;
    };

    Shader.prototype.int = function(name, value) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        this.gl.uniform1i(location, value);
      }
      return this;
    };

    Shader.prototype.uniformSetter = function(obj) {
      obj.setUniformsOn(this);
      return this;
    };

    Shader.prototype.float = function(name, value) {
      var location;
      location = this.uniformLocation(name);
      if (location != null) {
        this.use();
        if (value instanceof Array || value instanceof Float32Array) {
          this.gl.uniform1fv(location, value);
        } else {
          this.gl.uniform1f(location, value);
        }
      }
      return this;
    };

    return Shader;

  })(ShaderObj);
  exports.ShaderProxy = ShaderProxy = (function(_super) {
    __extends(ShaderProxy, _super);

    function ShaderProxy(shader) {
      this.shader = shader != null ? shader : null;
    }

    ShaderProxy.prototype.attributeLocation = function(name) {
      return this.shader.attributeLocation(name);
    };

    ShaderProxy.prototype.uniformLocation = function(name) {
      return this.shader.uniformLocation(name);
    };

    ShaderProxy.prototype.use = function() {
      this.shader.use();
      return this;
    };

    ShaderProxy.prototype.mat4 = function(name, value) {
      this.shader.mat4(name, value);
      return this;
    };

    ShaderProxy.prototype.vec2 = function(name, a, b) {
      this.shader.vec2(name, a, b);
      return this;
    };

    ShaderProxy.prototype.vec3 = function(name, a, b, c) {
      this.shader.vec3(name, a, b, c);
      return this;
    };

    ShaderProxy.prototype.vec4 = function(name, a, b, c, d) {
      this.shader.vec4(name, a, b, c, d);
      return this;
    };

    ShaderProxy.prototype.int = function(name, value) {
      this.shader.int(name, value);
      return this;
    };

    ShaderProxy.prototype.uniformSetter = function(obj) {
      this.shader.uniformSetter(obj);
      return this;
    };

    ShaderProxy.prototype.float = function(name, value) {
      this.shader.float(name, value);
      return this;
    };

    return ShaderProxy;

  })(ShaderObj);
  return exports;
});
sys.defModule('/webgl-framework/shims', function(exports, require, fs) {
  var getAttrib, getAttribName, startTime, vendorName, vendors, _ref;
  vendors = [null, 'webkit', 'apple', 'moz', 'o', 'xv', 'ms', 'khtml', 'atsc', 'wap', 'prince', 'ah', 'hp', 'ro', 'rim', 'tc'];
  vendorName = function(name, vendor) {
    if (vendor === null) {
      return name;
    } else {
      return vendor + name[0].toUpperCase() + name.substr(1);
    }
  };
  getAttribName = function(obj, name) {
    var attrib, attrib_name, vendor, _i, _len;
    for (_i = 0, _len = vendors.length; _i < _len; _i++) {
      vendor = vendors[_i];
      attrib_name = vendorName(name, vendor);
      attrib = obj[attrib_name];
      if (attrib != null) {
        return attrib_name;
      }
    }
  };
  getAttrib = function(obj, name, def) {
    var attrib, attrib_name, vendor, _i, _len;
    if (obj) {
      for (_i = 0, _len = vendors.length; _i < _len; _i++) {
        vendor = vendors[_i];
        attrib_name = vendorName(name, vendor);
        attrib = obj[attrib_name];
        if (attrib != null) {
          return attrib;
        }
      }
    }
    return def;
  };
  window.performance = getAttrib(window, 'performance');
  if (window.performance == null) {
    window.performance = {};
  }
  window.performance.now = getAttrib(window.performance, 'now');
  if (window.performance.now == null) {
    startTime = Date.now();
    window.performance.now = function() {
      return Date.now() - startTime;
    };
  }
  window.requestAnimationFrame = getAttrib(window, 'requestAnimationFrame', function(callback) {
    return setTimeout(callback, 1000 / 60);
  });
  window.fullscreen = {
    enabled: (_ref = getAttrib(document, 'fullScreenEnabled')) != null ? _ref : getAttrib(document, 'fullscreenEnabled'),
    element: function() {
      var _ref1;
      return (_ref1 = getAttrib(document, 'fullScreenElement')) != null ? _ref1 : getAttrib(document, 'fullscreenElement');
    },
    exit: function() {
      var name, _ref1, _ref2, _ref3;
      name = (_ref1 = (_ref2 = (_ref3 = getAttribName(document, 'exitFullScreen')) != null ? _ref3 : getAttribName(document, 'exitFullscreen')) != null ? _ref2 : getAttribName(document, 'cancelFullScreen')) != null ? _ref1 : getAttribName(document, 'cancelFullscreen');
      if (name != null) {
        return document[name]();
      }
    },
    request: function(element) {
      var name, _ref1;
      name = (_ref1 = getAttribName(element, 'requestFullScreen')) != null ? _ref1 : getAttribName(element, 'requestFullscreen');
      if (name != null) {
        return element[name]();
      }
    },
    addEventListener: function(callback) {
      var onChange, vendor, _i, _len, _ref1;
      onChange = function(event) {
        event.entered = fullscreen.element() != null;
        return callback(event);
      };
      document.addEventListener('fullscreenchange', onChange);
      _ref1 = vendors.slice(1);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        vendor = _ref1[_i];
        document.addEventListener(vendor + 'fullscreenchange', onChange);
      }
    }
  };
  fullscreen.addEventListener(function(event) {
    var element;
    element = event.target;
    if (event.entered) {
      return element.className += ' fullscreen';
    } else {
      return element.className = element.className.replace(' fullscreen', '').replace('fullscreen', '');
    }
  });
  return exports;
});
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

sys.defModule('/webgl-framework/state', function(exports, require, fs) {
  var ShaderObj, State, VertexBuffer, framebuffer, util;
  util = require('util');
  VertexBuffer = require('vertexbuffer');
  ShaderObj = require('shader').ShaderObj;
  framebuffer = require('framebuffer');
  exports = State = (function() {
    function State(gf, params) {
      var location, pointer, uniform, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      this.gf = gf;
      this.blendAlpha = __bind(this.blendAlpha, this);
      this.gl = this.gf.gl;
      if (params.shader instanceof ShaderObj) {
        this.shader = params.shader;
        this.ownShader = false;
      } else {
        this.shader = this.gf.shader(params.shader);
        this.ownShader = true;
      }
      if (params.framebuffer != null) {
        if (params.framebuffer instanceof framebuffer.Framebuffer) {
          this.framebuffer = params.framebuffer;
          this.ownFramebuffer = false;
        } else {
          this.framebuffer = this.gf.framebuffer(params.framebuffer);
          this.ownFramebuffer = true;
        }
      } else {
        this.framebuffer = null;
        this.ownFramebuffer = false;
      }
      if (params.vertexbuffer != null) {
        if (params.vertexbuffer instanceof VertexBuffer) {
          this.vertexbuffer = params.vertexbuffer;
          this.ownVertexbuffer = false;
        } else {
          this.vertexbuffer = this.gf.vertexbuffer(params.vertexbuffer);
          this.ownVertexbuffer = true;
        }
      } else {
        this.vertexbuffer = this.gf.quadVertices;
        this.ownVertexBuffer = false;
      }
      this.pointers = (function() {
        var _i, _ref, _results;
        _results = [];
        for (location = _i = 0, _ref = this.gf.maxAttribs; 0 <= _ref ? _i < _ref : _i > _ref; location = 0 <= _ref ? ++_i : --_i) {
          _results.push(null);
        }
        return _results;
      }).call(this);
      _ref = this.vertexbuffer.pointers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pointer = _ref[_i];
        location = this.shader.attributeLocation(pointer.name);
        if (location != null) {
          pointer = util.clone(pointer);
          pointer.location = location;
          this.pointers[location] = pointer;
        }
      }
      this.texturesByName = {};
      this.textures = [];
      this.depthTest = (_ref1 = params.depthTest) != null ? _ref1 : false;
      this.depthWrite = (_ref2 = params.depthWrite) != null ? _ref2 : true;
      if (params.cull != null) {
        this.cullFace = (_ref3 = this.gl[params.cull.toUpperCase()]) != null ? _ref3 : this.gl.BACK;
      } else {
        this.cullFace = false;
      }
      this.lineWidth = (_ref4 = params.lineWidth) != null ? _ref4 : 1;
      if (params.blend != null) {
        switch (params.blend) {
          case 'alpha':
            this.blend = this.blendAlpha;
            break;
          default:
            throw new Error('blend mode is not implemented: ' + params.blend);
        }
      } else {
        this.blend = null;
      }
      if (params.uniforms != null) {
        _ref5 = params.uniforms;
        for (_j = 0, _len1 = _ref5.length; _j < _len1; _j++) {
          uniform = _ref5[_j];
          this[uniform.type](uniform.name, uniform.value);
        }
      }
      if (this.gf.vao != null) {
        this.vao = this.gf.vao.createVertexArrayOES();
        this.gf.vao.bindVertexArrayOES(this.vao);
        this.setPointers();
        this.gf.vao.bindVertexArrayOES(null);
      } else {
        this.vao = null;
      }
    }

    State.prototype.destroy = function() {
      if (this.ownShader) {
        this.shader.destroy();
      }
      if (this.ownBuffer) {
        this.vertexbuffer.destroy();
      }
      if (this.vao != null) {
        return this.gf.vao.deleteVertexArrayOES(this.vao);
      }
    };

    State.prototype.blendAlpha = function() {
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      return this.gl.enable(this.gl.BLEND);
    };

    State.prototype.clearColor = function(r, g, b, a) {
      if (r == null) {
        r = 0;
      }
      if (g == null) {
        g = 0;
      }
      if (b == null) {
        b = 0;
      }
      if (a == null) {
        a = 1;
      }
      this.gl.clearColor(r, g, b, a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      return this;
    };

    State.prototype.clearDepth = function(value) {
      if (value == null) {
        value = 1;
      }
      this.gl.clearDepth(value);
      this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
      return this;
    };

    State.prototype.setViewport = function(width, height) {
      if (width == null) {
        width = this.gl.canvas.width;
      }
      if (height == null) {
        height = this.gl.canvas.height;
      }
      return this.gl.viewport(0, 0, width, height);
    };

    State.prototype.setPointers = function() {
      var location, pointer, _i, _len, _ref;
      this.vertexbuffer.bind();
      _ref = this.pointers;
      for (location = _i = 0, _len = _ref.length; _i < _len; location = ++_i) {
        pointer = _ref[location];
        if (pointer != null) {
          if (!this.gf.vertexUnits[location].enabled) {
            this.gl.enableVertexAttribArray(pointer.location);
          }
          this.gl.vertexAttribPointer(pointer.location, pointer.size, pointer.type, false, this.vertexbuffer.stride, pointer.offset);
        } else {
          if (this.gf.vertexUnits[location].enabled) {
            this.gl.disableVertexAttribArray(location);
          }
        }
      }
    };

    State.prototype.setupVertexBuffer = function() {
      if (this.vao != null) {
        return this.gf.vao.bindVertexArrayOES(this.vao);
      } else {
        return this.setPointers();
      }
    };

    State.prototype.setupState = function() {
      if (this.depthTest) {
        this.gl.enable(this.gl.DEPTH_TEST);
      } else {
        this.gl.disable(this.gl.DEPTH_TEST);
      }
      this.gl.depthMask(this.depthWrite);
      if (this.cullFace) {
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.cullFace);
      } else {
        this.gl.disable(this.gl.CULL_FACE);
      }
      if (this.blend != null) {
        this.blend();
      } else {
        this.gl.disable(this.gl.BLEND);
      }
      if (this.vertexbuffer.mode === this.gl.LINES || this.vertexbuffer.mode === this.gl.LINE_STRIP) {
        if (this.gf.lineWidth !== this.lineWidth) {
          this.gf.lineWidth = this.lineWidth;
          this.gl.lineWidth(this.lineWidth);
        }
      }
      this.shader.use();
      this.setupVertexBuffer();
      return this.gf.currentState = this;
    };

    State.prototype.draw = function(first, count) {
      var texture, unit, _i, _len, _ref;
      if (this.framebuffer != null) {
        this.framebuffer.viewport();
      } else {
        this.setViewport();
      }
      if (this.framebuffer != null) {
        this.framebuffer.use();
      } else {
        if (this.gf.currentFramebuffer != null) {
          this.gf.currentFramebuffer.unuse();
        }
      }
      _ref = this.textures;
      for (unit = _i = 0, _len = _ref.length; _i < _len; unit = ++_i) {
        texture = _ref[unit];
        texture.texture.bind(unit);
        this.int(texture.name, unit);
      }
      if (this.gf.currentState !== this) {
        this.setupState();
      }
      this.vertexbuffer.draw(first, count);
      return this;
    };

    State.prototype.mat4 = function(name, value) {
      this.shader.mat4(name, value);
      return this;
    };

    State.prototype.mat3 = function(name, value) {
      this.shader.mat3(name, value);
      return this;
    };

    State.prototype.int = function(name, value) {
      this.shader.int(name, value);
      return this;
    };

    State.prototype.vec2 = function(name, a, b) {
      this.shader.vec2(name, a, b);
      return this;
    };

    State.prototype.vec3 = function(name, a, b, c) {
      this.shader.vec3(name, a, b, c);
      return this;
    };

    State.prototype.vec4 = function(name, a, b, c, d) {
      this.shader.vec4(name, a, b, c, d);
      return this;
    };

    State.prototype.uniformSetter = function(obj) {
      this.shader.uniformSetter(obj);
      return this;
    };

    State.prototype.float = function(name, value) {
      this.shader.float(name, value);
      return this;
    };

    State.prototype.sampler = function(name, texture) {
      var stored;
      stored = this.texturesByName[name];
      if (stored == null) {
        stored = {
          name: name,
          texture: texture
        };
        this.texturesByName[name] = stored;
        this.textures.push(stored);
      }
      if (stored.texture !== texture) {
        stored.texture = texture;
      }
      return this;
    };

    State.prototype.bind = function(unit) {
      if (unit == null) {
        unit = 0;
      }
      if (this.framebuffer != null) {
        this.framebuffer.bind(unit);
      } else {
        throw new Error('State has no attached framebuffer');
      }
      return this;
    };

    State.prototype.generateMipmap = function() {
      if (this.framebuffer != null) {
        this.framebuffer.generateMipmap();
      } else {
        throw new Error('State has no attached framebuffer');
      }
      return this;
    };

    State.prototype.anisotropy = function() {
      if (this.framebuffer != null) {
        this.framebuffer.anisotropy();
      } else {
        throw new Error('State has no attached framebuffer');
      }
      return this;
    };

    State.prototype.vertices = function(data) {
      this.vertexbuffer.vertices(data);
      return this;
    };

    State.prototype.cubeSide = function(name) {
      if (this.framebuffer != null) {
        this.framebuffer.cubeSide(name);
      } else {
        throw new Error('State has no attached framebuffer');
      }
      return this;
    };

    return State;

  })();
  return exports;
});
sys.defModule('/webgl-framework/texture-float', function(exports, require, fs) {
  var draw, renderable;
  draw = function(gl, _arg) {
    var buffer, fragment, fragmentShader, positionLoc, program, sourceLoc, vertex, vertexShader, vertices;
    vertex = _arg.vertex, fragment = _arg.fragment;
    gl.activeTexture(gl.TEXTURE0);
    program = gl.createProgram();
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.attachShader(program, vertexShader);
    gl.shaderSource(vertexShader, vertex);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(vertexShader);
    }
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.attachShader(program, fragmentShader);
    gl.shaderSource(fragmentShader, fragment);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(fragmentShader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }
    gl.useProgram(program);
    vertices = new Float32Array([1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1]);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    sourceLoc = gl.getUniformLocation(program, 'source');
    if (sourceLoc != null) {
      gl.uniform1i(sourceLoc, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    return gl.deleteBuffer(buffer);
  };
  renderable = function(gl, targetType, channels) {
    var check, pixels, readbackFramebuffer, readbackTexture, sourceFramebuffer, sourceTexture;
    sourceTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, channels, 2, 2, 0, channels, targetType, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    sourceFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, sourceFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sourceTexture, 0);
    check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (check !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteTexture(sourceTexture);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return false;
    }
    draw(gl, {
      vertex: 'attribute vec2 position;\nvoid main(){\n    gl_Position = vec4(position, 0, 1);\n}',
      fragment: 'void main(){\n    gl_FragColor = vec4(0.5);\n}'
    });
    gl.deleteFramebuffer(sourceFramebuffer);
    readbackTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, readbackTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    readbackFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, readbackFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, readbackTexture, 0);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    draw(gl, {
      vertex: 'varying vec2 texcoord;\nattribute vec2 position;\nvoid main(){\n    texcoord = position*0.5+0.5;\n    gl_Position = vec4(position, 0, 1);\n}',
      fragment: 'precision highp int;\nprecision highp float;\nvarying vec2 texcoord;\nuniform sampler2D source;\nvoid main(){\n    gl_FragColor = texture2D(source, texcoord);\n}'
    });
    pixels = new Uint8Array(2 * 2 * 4);
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.deleteTexture(sourceTexture);
    gl.deleteTexture(readbackTexture);
    gl.deleteFramebuffer(readbackFramebuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    console.assert(gl.getError() === gl.NO_ERROR);
    return pixels[0] >= 126 && pixels[0] <= 128;
  };
  exports = function(gl) {
    var float16, float16linear, float32, float32linear, result;
    float16 = gl.getExtension('OES_texture_half_float');
    float16linear = gl.getExtension('OES_texture_half_float_linear');
    float32 = gl.getExtension('OES_texture_float');
    float32linear = gl.getExtension('OES_texture_float_linear');
    result = {};
    if (float16 != null) {
      result.float16 = {
        linear: float16linear != null,
        type: float16.HALF_FLOAT_OES,
        renderable: renderable(gl, float16.HALF_FLOAT_OES, gl.RGBA)
      };
    }
    if (float32 != null) {
      result.float32 = {
        linear: float32linear != null,
        type: gl.FLOAT,
        renderable: renderable(gl, gl.FLOAT, gl.RGBA)
      };
    }
    return result;
  };
  return exports;
});
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

sys.defModule('/webgl-framework/texture', function(exports, require, fs) {
  var ConcreteTexture, CubeSide, Texture, Texture2D, TextureCube;
  exports.Texture = Texture = (function() {
    function Texture() {}

    return Texture;

  })();
  ConcreteTexture = (function(_super) {
    __extends(ConcreteTexture, _super);

    function ConcreteTexture(gf, params) {
      var clamp, filter, sClamp, tClamp, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      this.gl = this.gf.gl;
      this.handle = this.gl.createTexture();
      this.channels = this.gl[((_ref = params.channels) != null ? _ref : 'rgba').toUpperCase()];
      this.bind();
      if (typeof params.type === 'string') {
        this.type = this.gl[((_ref1 = params.type) != null ? _ref1 : 'unsigned_byte').toUpperCase()];
      } else {
        this.type = (_ref2 = params.type) != null ? _ref2 : this.gl.UNSIGNED_BYTE;
      }
      filter = (_ref3 = params.filter) != null ? _ref3 : 'nearest';
      if (typeof filter === 'string') {
        this[filter]();
      } else {
        this.minify = (_ref4 = this.gl[filter.minify.toUpperCase()]) != null ? _ref4 : this.gl.LINEAR;
        this.magnify = (_ref5 = this.gl[filter.magnify.toUpperCase()]) != null ? _ref5 : this.gl.LINEAR;
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.magnify);
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.minify);
      }
      clamp = (_ref6 = params.clamp) != null ? _ref6 : 'edge';
      if (typeof clamp === 'string') {
        this[clamp]();
      } else {
        if (clamp.s === 'edge') {
          sClamp = this.gl.CLAMP_TO_EDGE;
        } else if (clamp.s === 'repeat') {
          sClamp = this.gl.REPEAT;
        } else {
          throw new Error('unknown S clamp mode: ' + clamp.s);
        }
        if (clamp.t === 'edge') {
          tClamp = this.gl.CLAMP_TO_EDGE;
        } else if (clamp.t === 'repeat') {
          tClamp = this.gl.REPEAT;
        } else {
          throw new Error('unknown T clamp mode: ' + clamp.t);
        }
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, sClamp);
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, tClamp);
      }
    }

    ConcreteTexture.prototype.destroy = function() {
      return this.gl.deleteTexture(this.handle);
    };

    ConcreteTexture.prototype.generateMipmap = function() {
      this.mipmapped = true;
      this.bind();
      this.gl.generateMipmap(this.target);
      return this;
    };

    ConcreteTexture.prototype.anisotropy = function() {
      var ext, max;
      this.anisotropic = true;
      ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
      if (ext) {
        max = this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        return this.gl.texParameterf(this.target, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
      }
    };

    ConcreteTexture.prototype.linear = function() {
      this.bind();
      this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      return this;
    };

    ConcreteTexture.prototype.nearest = function() {
      this.bind();
      this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      return this;
    };

    ConcreteTexture.prototype.repeat = function() {
      this.bind();
      this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
      this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
      return this;
    };

    ConcreteTexture.prototype.edge = function() {
      this.bind();
      this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      return this;
    };

    ConcreteTexture.prototype.bind = function(unit) {
      if (unit == null) {
        unit = 0;
      }
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.gl.bindTexture(this.target, this.handle);
      return this;
    };

    return ConcreteTexture;

  })(exports.Texture);
  CubeSide = (function(_super) {
    __extends(CubeSide, _super);

    function CubeSide(handle, target) {
      this.handle = handle;
      this.target = target;
    }

    return CubeSide;

  })(exports.Texture);
  exports.TextureCube = TextureCube = (function(_super) {
    __extends(TextureCube, _super);

    function TextureCube(gf, params) {
      var _ref;
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      this.target = this.gf.gl.TEXTURE_CUBE_MAP;
      TextureCube.__super__.constructor.call(this, this.gf, params);
      this.negativeX = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
      this.negativeY = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
      this.negativeZ = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
      this.positiveX = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X);
      this.positiveY = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
      this.positiveZ = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
      this.size(params.size);
      if ((_ref = this.minify) === this.gl.NEAREST_MIPMAP_NEAREST || _ref === this.gl.LINEAR_MIPMAP_NEAREST || _ref === this.gl.NEAREST_MIPMAP_LINEAR || _ref === this.gl.LINEAR_MIPMAP_LINEAR) {
        this.generateMipmap();
      }
    }

    TextureCube.prototype.size = function(size) {
      this.size = size;
      this.bind();
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
      return this;
    };

    TextureCube.prototype.dataSized = function(data, side, size) {
      this.size = size;
      this.bind();
      this.gl.texImage2D(this[side].target, 0, this.channels, this.size, this.size, 0, this.channels, this.type, data);
      return this;
    };

    return TextureCube;

  })(ConcreteTexture);
  exports.Texture2D = Texture2D = (function(_super) {
    __extends(Texture2D, _super);

    function Texture2D(gf, params) {
      var _ref;
      this.gf = gf;
      if (params == null) {
        params = {};
      }
      this.target = this.gf.gl.TEXTURE_2D;
      Texture2D.__super__.constructor.call(this, this.gf, params);
      if (params.data instanceof Image) {
        this.dataImage(params.data);
      } else if ((params.width != null) && (params.height != null)) {
        if (params.data != null) {
          this.dataSized(params.data, params.width, params.height);
        } else {
          this.size(params.width, params.height);
        }
      }
      if ((_ref = this.minify) === this.gl.NEAREST_MIPMAP_NEAREST || _ref === this.gl.LINEAR_MIPMAP_NEAREST || _ref === this.gl.NEAREST_MIPMAP_LINEAR || _ref === this.gl.LINEAR_MIPMAP_LINEAR) {
        this.generateMipmap();
      }
    }

    Texture2D.prototype.loadImage = function(url) {
      var image;
      image = new Image();
      image.onload = (function(_this) {
        return function() {
          return _this.dataImage(image);
        };
      })(this);
      return image.src = url;
    };

    Texture2D.prototype.dataImage = function(data) {
      this.bind();
      this.width = data.width;
      this.height = data.height;
      this.gl.texImage2D(this.target, 0, this.channels, this.channels, this.type, data);
      return this;
    };

    Texture2D.prototype.dataSized = function(data, width, height) {
      this.bind();
      this.width = width;
      this.height = height;
      this.gl.texImage2D(this.target, 0, this.channels, this.width, this.height, 0, this.channels, this.type, data);
      return this;
    };

    Texture2D.prototype.size = function(width, height) {
      this.width = width;
      this.height = height;
      this.bind();
      this.gl.texImage2D(this.target, 0, this.channels, this.width, this.height, 0, this.channels, this.type, null);
      return this;
    };

    Texture2D.prototype.draw = function(scale) {
      if (scale == null) {
        scale = 1;
      }
      return this.gf.blit.float('scale', scale).sampler('source', this).draw();
    };

    return Texture2D;

  })(ConcreteTexture);
  return exports;
});
sys.defModule('/webgl-framework/util', function(exports, require, fs) {
  exports.clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };
  return exports;
});
sys.defModule('/webgl-framework/vector', function(exports, require, fs) {
  var Vec3, tau;
  tau = Math.PI * 2;
  exports.Vec3 = Vec3 = (function() {
    function Vec3(x, y, z) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      this.z = z != null ? z : 0;
      null;
    }

    Vec3.prototype.set = function(x, y, z) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      this.z = z != null ? z : 0;
      return this;
    };

    Vec3.prototype.rotatey = function(angle) {
      var c, rad, s, x, z;
      rad = tau * (angle / 360);
      s = Math.sin(rad);
      c = Math.cos(rad);
      x = this.z * s + this.x * c;
      z = this.z * c - this.x * s;
      this.x = x;
      this.z = z;
      return this;
    };

    return Vec3;

  })();
  return exports;
});
sys.defModule('/webgl-framework/vertexbuffer', function(exports, require, fs) {
  var VertexBuffer, util;
  util = require('util');
  exports = VertexBuffer = (function() {
    function VertexBuffer(gf, _arg) {
      var mode, offset, pointer, pointers, stride, vertices;
      this.gf = gf;
      pointers = _arg.pointers, vertices = _arg.vertices, mode = _arg.mode, stride = _arg.stride;
      this.gl = this.gf.gl;
      this.buffer = this.gl.createBuffer();
      if (mode != null) {
        this.mode = this.gl[mode.toUpperCase()];
      } else {
        this.mode = this.gl.TRIANGLES;
      }
      offset = 0;
      this.pointers = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = pointers.length; _i < _len; _i++) {
          pointer = pointers[_i];
          pointer = util.clone(pointer);
          if (pointer.size == null) {
            pointer.size = 4;
          }
          pointer.type = this.gl.FLOAT;
          pointer.typeSize = 4;
          pointer.byteSize = pointer.typeSize * pointer.size;
          pointer.offset = offset;
          offset += pointer.byteSize;
          _results.push(pointer);
        }
        return _results;
      }).call(this);
      this.stride = offset;
      if (vertices != null) {
        this.vertices(vertices);
      }
    }

    VertexBuffer.prototype.destroy = function() {
      this.gl.deleteBuffer(this.buffer);
      return this;
    };

    VertexBuffer.prototype.vertices = function(data) {
      if (data instanceof Array) {
        data = new Float32Array(data);
      }
      this.count = data.buffer.byteLength / this.stride;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      return this;
    };

    VertexBuffer.prototype.bind = function() {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      return this;
    };

    VertexBuffer.prototype.unbind = function() {
      if (this.gf.currentVertexbuffer != null) {
        this.gf.currentVertexbuffer = null;
        return this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      }
    };

    VertexBuffer.prototype.draw = function(first, count) {
      if (first == null) {
        first = 0;
      }
      if (count == null) {
        count = this.count;
      }
      this.gl.drawArrays(this.mode, first, count);
      return this;
    };

    return VertexBuffer;

  })();
  return exports;
});
sys.main();
})();
