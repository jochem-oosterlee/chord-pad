!function() {
    "use strict";
    if (window.AudioContext || (window.AudioContext = window.webkitAudioContext || window.mozAudioContext),
    window.AudioContext && !AudioContext.prototype.createGain && (AudioContext.prototype.createGain = AudioContext.prototype.createGainNode),
    window.OfflineAudioContext || (window.OfflineAudioContext = window.webkitOfflineAudioContext),
    window.AudioBufferSourceNode && (AudioBufferSourceNode.prototype.start || (AudioBufferSourceNode.prototype.start = AudioBufferSourceNode.prototype.noteOn),
    AudioBufferSourceNode.prototype.stop || (AudioBufferSourceNode.prototype.stop = AudioBufferSourceNode.prototype.noteOff)),
    !window.performance) {
        var e, t, o, n, s, a, i, r, l, c, d, u, p, f, h = Date.now();
        window.performance = {
            now: function() {
                return Date.now() - h
            }
        }
    }
    window.NodeList && !NodeList.prototype.forEach && (NodeList.prototype.forEach = Array.prototype.forEach),
    Uint8Array.prototype.slice || Object.defineProperty(Uint8Array.prototype, "slice", {
        value: function(e, t) {
            return new Uint8Array(Array.prototype.slice.call(this, e, t))
        }
    }),
    Object.assign || Object.defineProperty(Object, "assign", {
        value: function e(t, o) {
            if (null == t)
                throw TypeError("Cannot convert undefined or null to object");
            for (var n = Object(t), s = 1; s < arguments.length; s++) {
                var a = arguments[s];
                if (null != a)
                    for (var i in a)
                        Object.prototype.hasOwnProperty.call(a, i) && (n[i] = a[i])
            }
            return n
        },
        writable: !0,
        configurable: !0
    }),
    Element.prototype.closest || (Element.prototype.matches || (Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector),
    Element.prototype.closest = function(e) {
        var t = this;
        if (!document.documentElement.contains(this))
            return null;
        do {
            if (t.matches(e))
                return t;
            t = t.parentElement
        } while (null !== t);
        return null
    }
    ),
    Array.prototype.find || (Array.prototype.find = function(e) {
        for (var t = Object(this), o = t.length >>> 0, n = arguments[1], s = 0; s < o; s++) {
            var a = t[s];
            if (e.call(n, a, s, t))
                return a
        }
    }
    );
    var m = String.fromCharCode
      , $ = [[100, 111, 99, 117, 109, 101, 110, 116], [108, 111, 99, 97, 116, 105, 111, 110], [104, 111, 115, 116], [119, 119, 119, 46, 111, 110, 101, 109, 111, 116, 105, 111, 110, 46, 99, 111, 109]]
      , _ = function(e) {
        return m.apply(null, e) || $
    }
      , y = window[_($[0])][_($[1])][_($[2])] == _($[3])
      , v = !("ontouchstart"in window || window.DocumentTouch && document instanceof DocumentTouch);
    document.documentElement && (v && (document.documentElement.className += " mouse-device"),
    document.location.search.indexOf("fullscreen") > -1 && (document.documentElement.className += " fullscreen"));
    var g, b, x, k = {
        get: function(e) {
            var t = void 0;
            try {
                t = localStorage[e]
            } catch (o) {}
            return t
        },
        set: function(e, t) {
            try {
                localStorage[e] = t
            } catch (o) {}
        },
        keys: function() {
            var e = [];
            try {
                for (var t in localStorage)
                    e.push(t)
            } catch (o) {}
            return e.sort()
        }
    };
    g = /iPad|iPhone|iPod/.test(navigator.userAgent),
    b = (document.querySelector('meta[property="script-time"]') || {}).content,
    e = function(e) {
        var t = new XMLHttpRequest;
        t.open(e.method || "POST", e.url, !0),
        e.responseType && (t.responseType = e.responseType),
        e.contentType && t.setRequestHeader("Content-Type", e.contentType);
        var o = function() {
            e.always && e.always()
        };
        return t.onload = function() {
            if (404 == t.status) {
                e.fail ? e.fail(t.status) : alert("Not found (" + t.status + ")"),
                o();
                return
            }
            if (t.status >= 500) {
                e.fail ? e.fail(t.status) : alert("Server error (" + t.status + ")"),
                o();
                return
            }
            if (e.reponseType)
                e.done(this.responseText);
            else
                try {
                    var n = JSON.parse(this.responseText);
                    e.done(n)
                } catch (s) {
                    alert(s)
                }
            o()
        }
        ,
        e.fail && (t.onerror = t.ontimeout = function() {
            e.fail ? e.fail() : alert("Network error"),
            o()
        }
        ),
        t.send(e.content ? e.content : e.form ? new FormData(e.form) : null),
        t
    }
    ,
    t = function(e) {
        var t = navigator.userAgent.match("Firefox") && "mp3" != e.format ? "ogg" : "mp3"
          , o = new Date().getTime()
          , n = new XMLHttpRequest;
        return n.open("GET", "sound_loader.php?" + (e.sound ? "sound=" + e.sound + "&" : "") + "items=" + e.items + "&format=" + t + "&time=" + b, !0),
        n.responseType = "arraybuffer",
        n.onprogress = function(t) {
            t.total && e.onProgress && e.onProgress({
                progress: t.loaded / t.total
            })
        }
        ,
        n.onload = function() {
            if (200 != n.status)
                throw "Error loading sounds " + n.responseURL + " (" + n.status + ")";
            for (var t = new Uint8Array(this.response), o = 0, s = function() {
                for (var e = ""; t[o]; )
                    e += String.fromCharCode(t[o]),
                    o++;
                return o++,
                e
            }, a = [], i = ""; ; ) {
                var r = s();
                if (!r)
                    break;
                var l = parseInt(s())
                  , c = t.slice(o, o + l).buffer;
                (function(t) {
                    var o = new Promise(function(o, n) {
                        e.context.decodeAudioData(c, function(n) {
                            o(),
                            e.onItem({
                                name: t,
                                buffer: n
                            })
                        }, function(e) {
                            n(),
                            i || (i = e + " " + t + " (" + l + ")")
                        })
                    }
                    );
                    a.push(o)
                }
                )(r),
                o += l
            }
            Promise.all(a).then(function(t) {
                e.onFinished()
            }).catch(function(t) {
                throw setTimeout(function() {
                    e.ignoreErrors || alert("Error decoding sounds"),
                    e.onFinished()
                }, 0),
                t + " " + i
            })
        }
        ,
        n.onerror = n.ontimeout = function(t) {
            throw setTimeout(function() {
                alert("Error loading sounds"),
                e.onFinished()
            }, 0),
            "Error loading sounds " + e.items + " (" + (new Date().getTime() - o) + " ms)"
        }
        ,
        y && n.send(),
        {
            stop: function() {
                n.abort()
            }
        }
    }
    ,
    o = function(e) {
        var t = document.createElement("input");
        t.type = "file",
        t.style.display = "none",
        document.body.appendChild(t),
        t.addEventListener("change", function(o) {
            var n = t.files[0]
              , s = new FileReader;
            s.onload = function(t) {
                e.onLoad({
                    filename: n.name,
                    content: t.target.result
                })
            }
            ,
            "ArrayBuffer" == e.type ? s.readAsArrayBuffer(n) : "DataURL" == e.type ? s.readAsDataURL(n) : s.readAsText(n),
            t.parentNode.removeChild(t)
        }),
        t.click()
    }
    ,
    n = function(e, t, o) {
        var n = new Blob([e],{
            type: t
        })
          , s = document.createElement("a")
          , a = window.URL.createObjectURL(n);
        s.href = a,
        s.target = "_blank",
        s.download = o,
        document.body.appendChild(s),
        s.click(),
        g || window.URL.revokeObjectURL(a),
        s.parentElement.removeChild(s)
    }
    ,
    s = function(e, t, o) {
        var s = e.length;
        o && (s -= o * (e.sampleRate || 44100));
        var a, i, r = e.numberOfChannels, l = s * r * 2 + 44, c = new ArrayBuffer(l), d = new DataView(c), u = [], p = 0, f = 0;
        function h(e) {
            d.setUint16(f, e, !0),
            f += 2
        }
        function m(e) {
            d.setUint32(f, e, !0),
            f += 4
        }
        for (m(1179011410),
        m(l - 8),
        m(1163280727),
        m(544501094),
        m(16),
        h(1),
        h(r),
        m(e.sampleRate),
        m(2 * e.sampleRate * r),
        h(2 * r),
        h(16),
        m(1635017060),
        m(l - f - 4),
        a = 0; a < e.numberOfChannels; a++)
            u.push(e.getChannelData(a));
        for (; f < l; ) {
            for (a = 0; a < r; a++) {
                var $ = u[a];
                i = (.5 + (i = Math.max(-1, Math.min(1, $[p] + ($[p + s] || 0)))) < 0 ? 32768 * i : 32767 * i) | 0,
                d.setInt16(f, i, !0),
                f += 2
            }
            p++
        }
        n(c, "audio/wav", t)
    }
    ,
    a = function(e) {
        throw e
    }
    ,
    x = {
        get: function(e, t, o) {
            if (!(t in e) && "toJSON" != t)
                throw "Prop not found " + t;
            return e[t]
        }
    },
    i = function(e) {
        return "?test" != document.location.search ? e : new Proxy(e,x)
    }
    ;
    var C = function(e={}) {
        let t, o, n, s = function(e) {
            var s = t.context.sampleRate || 44100;
            o = new S({
                context: new OfflineAudioContext(2,s * e.duration,s),
                audioSystem: t
            }),
            n = setInterval( () => {
                e.onProgress && e.onProgress(o.context.currentTime / e.duration)
            }
            , 1e3),
            o.context.oncomplete = t => {
                e.onComplete({
                    renderedBuffer: t.renderedBuffer
                }),
                a()
            }
        }, a = function() {
            clearTimeout(n),
            o && "closed" != o.context.state && o.context.suspend(o.context.currentTime),
            o = null
        };
        return !function() {
            if (!/iPad|iPhone|iPod/.test(navigator.userAgent))
                return;
            let e = document.createElement("div");
            e.id = "tempAudio",
            e.innerHTML = '<audio x-webkit-airplay="deny"></audio>';
            let o = e.children[0];
            o.src = "data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAABhTEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAAnGMHkkIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADgnABGiAAQBCqgCRMAAgEAH///////////////7+n/9FTuQsQH//////2NG0jWUGlio5gLQTOtIoeR2WX////X4s9Atb/JRVCbBUpeRUq//////////////////9RUi0f2jn/+xDECgPCjAEQAABN4AAANIAAAAQVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==",
            o.preload = "auto",
            o.type = "audio/mpeg",
            o.disableRemotePlayback = !0,
            document.body.append(e);
            let n = () => {
                o.play().catch( () => {}
                ),
                o.pause(),
                "running" != t.context.state && t.context.resume(),
                window.removeEventListener("mousedown", n)
            }
              , s = () => {
                window.addEventListener("mousedown", n)
            }
            ;
            window.addEventListener("focus", () => s()),
            s()
        }(),
        t = new S({
            context: new AudioContext({
                sampleRate: 44100
            }),
            lowpass: e.lowpass,
            highpass: e.highpass
        }),
        this.current = function() {
            return o || t
        }
        ,
        this.startOffline = s,
        this.stopOffline = a,
        this.isOffline = function() {
            return !!o
        }
        ,
        this
    }
      , S = function(e) {
        var t, o = this, n = e.context, s = e.audioSystem, a = {}, i = {}, r = n.createGain();
        r.gain.value = s ? s.masterGain.gain.value : .8,
        y && r.connect(n.destination);
        var l = n.createGain();
        l.gain.value = s ? s.convolverGain.gain.value : 1;
        var c = n.createBiquadFilter();
        c.type = s ? s.filter1.type : e.highpass ? "highpass" : "allpass",
        c.frequency.value = s ? s.filter1.frequency.value : e.highpass || 0,
        c.Q.value = 0;
        var d = n.createBiquadFilter();
        d.type = s ? s.filter2.type : e.lowpass ? "lowpass" : "allpass",
        d.frequency.value = s ? s.filter2.frequency.value : e.lowpass || 0,
        c.connect(d);
        var u = n.createGain();
        u.gain.value = 0,
        u.connect(r),
        l.connect(r),
        d.connect(r);
        var p = n.createGain();
        p.connect(r);
        var f = function() {
            for (var e in a)
                a[e].disconnect();
            a = {}
        }
          , h = function(e) {
            if (t) {
                if (e == t.buffer)
                    return;
                t.disconnect()
            }
            f(),
            (t = o.convolver = n.createConvolver()).connect(l),
            t.buffer = e,
            d.connect(t)
        };
        s && s.convolver.buffer && h(s.convolver.buffer);
        var m = function(e) {
            l.gain.value = e
        }
          , $ = function() {
            p.disconnect(),
            f(),
            (p = o.sessionGain = n.createGain()).connect(r)
        }
          , _ = function(e, t, o) {
            for (var n = e.getChannelData(0), s = e.sampleRate || 44100, a = o ? o * s : n.length, i = Math.min(t * s, Math.floor(a / 2)), r = a - 1; r >= 0; r--)
                r >= a - i && (n[r] = n[r] * (a - r) / i + n[r - i] * (r - a + i) / i)
        }
          , v = function(e) {
            var o = a[e];
            if (o)
                return o;
            var s = n.createGain();
            return s.gain.value = e,
            t && s.connect(t),
            a[e] = s,
            s
        }
          , g = function(e) {
            var t = i[e];
            return t || (t = i[e] = n.createGain()).connect(o.filter1),
            t
        }
          , b = function(e, t, o, n) {
            var s = g(e);
            s.gain.cancelScheduledValues(o),
            s.gain.setTargetAtTime(t, o, n)
        }
          , x = function() {
            for (var e in i)
                i[e].disconnect();
            i = {}
        };
        return this.context = n,
        this.sessionGain = p,
        this.masterGain = r,
        this.convolverGain = l,
        this.filter1 = c,
        this.filter2 = d,
        this.setConvolverBuffer = h,
        this.setConvolverGain = m,
        this.fadeOutSession = $,
        this.crossFade = _,
        this.effectLevelNode = v,
        this.channelGain = g,
        this.setChannelGain = b,
        this.resetChannelGains = x,
        this
    }
      , A = function(e) {
        return e.forEach(function(t, o) {
            e[t.value] = t
        }),
        e
    }
      , T = {
        a: 'Simple',
        b: 'Compound',
        c: 'Complex'
    }
      , w = A([{
        value: "2/2",
        name: "2/2",
        beats: 2,
        beatScale: 2,
        beatDiv: 2,
        group: "a"
    }, {
        value: "4/2",
        name: "4/2",
        beats: 4,
        beatScale: 2,
        beatDiv: 2,
        group: "a"
    }, {
        value: "2/4",
        name: "2/4",
        beats: 2,
        beatScale: 1,
        beatDiv: 2,
        group: "a"
    }, {
        value: "3/4",
        name: "3/4",
        beats: 3,
        beatScale: 1,
        beatDiv: 2,
        group: "a"
    }, {
        value: "4/4",
        name: "4/4",
        beats: 4,
        beatScale: 1,
        beatDiv: 2,
        group: "a"
    }, {
        value: "3/8",
        name: "3/8",
        beats: 3,
        beatScale: .5,
        beatDiv: 2,
        group: "a"
    }, {
        value: "6/8",
        name: "6/8",
        beats: 2,
        beatScale: 1.5,
        beatDiv: 3,
        group: "b"
    }, {
        value: "9/8",
        name: "9/8",
        beats: 3,
        beatScale: 1.5,
        beatDiv: 3,
        group: "b"
    }, {
        value: "12/8",
        name: "12/8",
        beats: 4,
        beatScale: 1,
        beatDiv: 3,
        group: "b"
    }, {
        value: "5/4",
        name: "5/4",
        beats: 5,
        beatScale: 1,
        beatDiv: 2,
        group: "c"
    }, {
        value: "7/4",
        name: "7/4",
        beats: 7,
        beatScale: 1,
        beatDiv: 2,
        group: "c"
    }, {
        value: "5/8",
        name: "5/8",
        beats: 5,
        beatScale: .5,
        beatDiv: 2,
        group: "c"
    }, {
        value: "7/8",
        name: "7/8",
        beats: 7,
        beatScale: .5,
        beatDiv: 2,
        group: "c"
    }])
      , P = function() {
        var e, t = "";
        return w.forEach(function(o) {
            o.group != e && (t += (e ? "</optgroup>" : "") + '<optgroup label="' + T[o.group] + '">',
            e = o.group),
            t += '<option value="' + o.value + '">' + o.name + "</option>"
        }),
        t += "</optgroup>"
    }
      , E = function(e) {
        var t, o = this._log = [], n = 0, s = "", a = 0, i = !1;
        window.logInfo = function() {
            var e = o.map(function(e) {
                return e[3]
            });
            return e.shift(),
            e.join(",")
        }
        ;
        var r = function() {
            o[n - 1],
            e.buttonState({
                undoAction: n > 1 && !i ? o[n - 1][3] : null,
                redoAction: n < o.length && !i ? o[n][3] : null
            })
        };
        this.reset = function(t) {
            var a = JSON.stringify(t || e.dataSource());
            o.length = 0,
            o.push([0, "", a, void 0, e.extraSource()]),
            n = 1,
            s = a,
            r()
        }
        ,
        this.disable = function() {
            i = !0,
            r()
        }
        ,
        this.enable = function() {
            i = !1,
            r()
        }
        ,
        this.updateExtra = function() {
            t = e.extraSource()
        }
        ;
        var l = function(t) {
            if (1 != n) {
                var a = o[n - 1]
                  , i = s.substr(0, a[0]) + a[1] + s.substr(a[0] + a[2].length);
                a[3];
                try {
                    var l = JSON.parse(i);
                    k.set(e.localStorageName, i),
                    t || e.dataState(l, o[n - 2][4]),
                    s = i,
                    n--,
                    t || r()
                } catch (c) {
                    console.log(c)
                }
            }
        };
        this.save = function(i) {
            var c = JSON.stringify(e.dataSource());
            if (c != s) {
                var d = o[n - 1];
                if (performance.now() - a < 5e3 && i && i == d[3] && i.match(/[+-]\d/) && (l(!0),
                c == s))
                    return;
                k.set(e.localStorageName, c),
                d[4] = t;
                for (var u = 0; s[u] == c[u]; )
                    u++;
                for (var p = 0; s[s.length - 1 - p] == c[c.length - 1 - p] && u <= Math.min(s.length - 1 - p, c.length - 1 - p); )
                    p++;
                n < o.length && (o.length = n),
                o[n] = [u, s.substring(u, s.length - p), c.substring(u, c.length - p), i, e.extraSource()],
                n++,
                s = c,
                a = performance.now(),
                r()
            }
        }
        ,
        this.undo = function() {
            l()
        }
        ,
        this.redo = function() {
            if (n != o.length) {
                var t = s
                  , a = o[n]
                  , i = t.substr(0, a[0]) + a[2] + t.substr(a[0] + a[1].length);
                a[3];
                var l = a[4];
                try {
                    var c = JSON.parse(i);
                    k.set(e.localStorageName, i),
                    e.dataState(c, l),
                    s = i,
                    n++,
                    r()
                } catch (d) {
                    console.log(d)
                }
            }
        }
    }
      , L = function(e, t, o, n) {
        return "object" == typeof t ? t[(e + (o || 0) + 9999 * t.length) % t.length] - (o ? t[o] : 0) + (n ? Math.floor(e / t.length) * n : 0) : (e + 9999 * t) % t
    }
      , I = function(e, t) {
        for (var o in t)
            "object" != typeof t[o] || t[o].length ? typeof e[o] != typeof t[o] && void 0 != t[o] && (e[o] = t[o]) : "object" != typeof e[o] ? e[o] = JSON.parse(JSON.stringify(t[o])) : I(e[o], t[o])
    };
    let N = ""
      , O = ""
      , M = ""
      , q = ""
      , D = ""
      , j = ""
      , G = ""
      , B = ""
      , R = ""
      , V = ""
      , H = ""
      , K = ""
      , F = ""
      , U = ""
      , z = "";
    z += "onkeydown";
    let Y = "";
    Y += "onload";
    let Q = [q += "onmousedown", D += "onmouseup", N += "onmousemove", O += "onmouseover", M += "onmouseout", j += "onmousewheel", G += "ontouchstart", B += "ontouchend", R += "ontouchmove", V += "ontouchforcechange", H += "onclick", K += "ondblclick", F += "oninput", U += "onchange"]
      , W = {};
    for (let Z = Q.length; Z >= 0; Z--)
        W[Q[Z]] = {};
    let X = function(e, t, o) {
        let n = e[t];
        "string" == typeof n && "number" == typeof o && (o = o.toString()),
        n !== o && (e[t] = o)
    }, J = function(e, t) {
        let o = document.getElementById(e);
        if (!o && !t)
            throw alert("Unexpected error, try to reload page to get a newer version."),
            "Element " + e + " not found";
        return o
    }, ee = function(e, t) {
        if (!e.getAttribute)
            throw "No getAttribute " + e.tagName + "," + e.innerHTML;
        return e.getAttribute("data-" + t)
    }, et = function(e) {
        eo(),
        document.documentElement.classList.add("dialog-open");
        let t = document.createElement("div"), o;
        t.id = "dialog",
        t.className = "dialog" + (e.className ? " " + e.className : "");
        let n, s = "";
        e.disableCancel || (s += '<button class="close-dialog" data-event="dialogClose"><span class="icon-cross"></span></button>'),
        e.title && (s += '<div class="dialog-header">' + e.title + "</div>"),
        e.description && (s += '<div class="dialog-description">' + e.description + "</div>");
        let a = e.formatOptionGroup || function() {}
        , i = e.formatOption || function(e) {
            return e.name
        }
        , r;
        if (e.options && (s += '<div class="items' + (e.optionsOneColumn ? "" : " two-columns") + '" id="dialog-items"></div>'),
        e.belowContent && (s += '<div class="dialog-description">' + e.belowContent + "</div>"),
        s += '<div style="position: relative;">',
        e.rightBottomContent && (s += '<div style="position: absolute; right: 0; bottom: 0;">' + e.rightBottomContent + "</div>"),
        e.buttons) {
            if (e.buttons.length > 0) {
                let l = '<div class="buttons' + (e.verticalButtons ? " buttons-vertical" : " buttons-horizontal") + ' dialog-action-buttons">';
                s += l,
                e.buttons.forEach(function(e, t) {
                    e ? e.name && (s += '<button class="' + (e.disabled ? "disabled " : "") + '" data-event="dialogButton" data-pos="' + t + '">' + (e.right ? '<div style="float: right; color: rgba(0,0,0,.5)">' + e.right + "</div>" : "") + e.name + "</button>") : s += '</div><div style="height: 5px;"></div>' + l
                }),
                s += "</div>"
            }
        } else
            s += '<div class="buttons buttons-horizontal dialog-action-buttons"><button data-event="dialogOK">' + 'OK' + '</button><button data-event="dialogCancel">' + 'Cancel' + "</button></div>";
        s += "</div>";
        let c = e.notice || (e.options && e.options[e.value] ? e.options[e.value].notice : void 0)
          , d = e.formatNotice || function(e) {
            return e
        }
        ;
        c ? s += '<div id="dialog-notice" class="dialog-notice">' + c + "</div>" : s += '<div id="dialog-notice" class="dialog-notice" style="display: none;"></div>',
        t.innerHTML = '<div class="dialog-box" ' + (e.width ? 'style="width: ' + e.width + 'px;"' : "") + ">" + s + "</div>",
        J("app").appendChild(t);
        let u = J("dialog-notice")
          , p = function() {
            let e = J("dialog-items")
              , t = e.querySelector(".selected");
            t && (e.scrollTop = t.offsetTop - .5 * e.clientHeight)
        }
          , f = function(e) {
            let t = J("dialog-items");
            n.forEach(function(o, n) {
                let s = t.childNodes[r[n]];
                e == o.value ? (s.classList.add("selected"),
                void 0 != o.notice && (u.innerHTML = d(o.notice),
                u.style.display = "block")) : s.classList.remove("selected")
            }),
            o = e
        }
          , h = function(e, t) {
            n = e;
            let o = "", s;
            r = [];
            let l = 0;
            e.forEach(function(e, n) {
                let c = a(e, s);
                o += (c || "") + '<button class="item' + (e.value == t ? " selected" : "") + '" data-event="dialogChangeItem" data-value="' + e.value + '" data-pos="' + n + '"' + (e.title ? ' title="' + e.title + '"' : "") + ">" + i(e) + "</button>",
                s = e,
                c && l++,
                r.push(l),
                l++
            }),
            J("dialog-items").innerHTML = o,
            f(t),
            p()
        };
        e.options && h(e.options, e.value);
        let m = function() {
            !e.disableCancel && (e.onBeforeClose && e.onBeforeClose(),
            eo(),
            window.removeEventListener("keydown", _),
            e.onCancel && e.onCancel(),
            e.onClose && e.onClose())
        };
        e.disableClickOutside || (t.onclick = function(e) {
            e.target == t && m()
        }
        );
        let $ = function() {
            (!e.onBeforeSelect || e.onBeforeSelect()) && (e.onBeforeClose && e.onBeforeClose(),
            eo(),
            window.removeEventListener("keydown", _),
            (void 0 != o || !e.options) && e.onSelect && e.onSelect(o),
            e.onClose && e.onClose())
        };
        W[H].dialogOK = function(e, t) {
            $()
        }
        ,
        W[H].dialogCancel = function(e, t) {
            m()
        }
        ;
        let _ = function(e) {
            if (!t.parentNode) {
                window.removeEventListener("keydown", _);
                return
            }
            27 == e.keyCode && m()
        };
        return window.addEventListener("keydown", _),
        W[H].dialogChangeItem = function(t, o) {
            let n = ee(o, "value")
              , s = Number(n);
            isNaN(s) && (s = n),
            f(s),
            e.onChange && e.onChange(s)
        }
        ,
        W[K].dialogChangeItem = function(e, t) {
            $()
        }
        ,
        W[H].dialogButton = function(t, o) {
            let n = parseInt(ee(o, "pos"))
              , s = e.buttons[n];
            s.disabled || (s.stay || (e.onBeforeClose && e.onBeforeClose(),
            eo()),
            s.onSelect && s.onSelect(),
            !s.stay && e.onClose && e.onClose())
        }
        ,
        W[H].dialogClose = function(e, t) {
            m()
        }
        ,
        {
            updateOptions: h,
            currentValue: function() {
                return o
            },
            selectOption: f,
            selectOK: function() {
                $()
            },
            cancelDialog: function() {
                m()
            }
        }
    }, eo = function() {
        let e = J("dialog", !0);
        e && e.parentElement.removeChild(e),
        document.documentElement.classList.remove("dialog-open")
    }, en, es, ea, ei, er, el, ec, ed, eu, ep, ef;
    en = function(e) {
        let t = ee(e.target, "event") ? e.target : e.target.parentNode || e.target
          , o = ee(t, "event")
          , n = W[G][o];
        if (n) {
            let s = n(e, t);
            return void 0 != s && s
        }
    }
    ,
    es = function(e) {
        if (!e.touches && !e.which)
            return;
        let t = e.touches && e.touches.length > 0 && document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) || e.target
          , o = ee(t, "event")
          , n = W[R].all
          , s = W[R][o];
        if (n && n(e),
        s)
            return s(e, t),
            !1
    }
    ,
    ea = function(e) {
        let t = ee(e.target, "event")
          , o = W[B][t]
          , n = W[B].all;
        if (n && n(e),
        o) {
            let s = o(e, e.target);
            return void 0 != s && s
        }
    }
    ,
    ei = function(e) {
        let t = ee(e.target, "event") ? e.target : e.target.parentNode || e.target
          , o = ee(t, "event")
          , n = W[H][o];
        if (n)
            return n(e, t),
            !1
    }
    ,
    er = function(e) {
        let t = ee(e.target, "event") ? e.target : e.target.parentNode || e.target
          , o = ee(t, "event")
          , n = W[K][o];
        if (n)
            return n(e, t),
            !1
    }
    ,
    el = function(e) {
        let t = ee(e.target, "event")
          , o = W[O][t];
        if (o && v)
            return o(e, e.target),
            !1
    }
    ,
    ec = function(e) {
        let t = ee(e.target, "event")
          , o = W[M][t];
        if (o && v)
            return o(e, e.target),
            !1
    }
    ,
    ed = function(e) {
        let t = ee(e.target, "event")
          , o = W[F][t];
        if (o)
            return o(e, e.target),
            !1
    }
    ,
    eu = function(e) {
        let t = ee(e.target, "event")
          , o = W[U][t];
        if (o)
            return o(e, e.target),
            !1
    }
    ,
    ep = function(e) {
        let t = e.target, o, n;
        for (; o = ee(t, "event"),
        !(n = W[j][o]) && "HTML" != t.parentNode.tagName; )
            t = t.parentNode;
        if (n)
            return n(e, t),
            !1
    }
    ,
    ef = function() {
        let e = document.body;
        e.addEventListener(void 0 !== e[G] ? "touchstart" : "mousedown", en, {
            passive: !1
        }),
        e[void 0 !== e[G] ? B : D] = ea,
        e[O] = el,
        e[M] = ec,
        e[void 0 !== e.onwheel ? "onwheel" : j] = ep,
        e[H] = ei,
        e[K] = er,
        e[F] = ed,
        e[U] = eu,
        e[N] = e[R] = es
    }
    ,
    document.addEventListener("DOMContentLoaded", ef);
    let eh = function(e) {
        let t = e.elem
          , o = e.value
          , n = 0
          , s = t;
        for (; "app" != s.id && !s.classList.contains("dialog-box"); )
            n += s.offsetTop,
            s = s.offsetParent;
        let a = (e.customValue ? e.customValue.label : "") || 'Enter value'
          , i = "";
        e.options && e.options.forEach(e => {
            i += '<div data-value="' + e[0] + '">' + e[1] + "</div>"
        }
        ),
        t.classList.add("bright");
        let r = document.createElement("div");
        r.className = "slider",
        r.innerHTML = '<div class="panel" id="panel-' + name + '" style="top: ' + n + 'px;">' + (e.title ? '<div class="title">' + e.title + "</div>" : "") + '<input list="steplist" type="range" min="' + e.min + '" max="' + e.max + '" step="' + e.step + '" value="' + o + '" /><div class="panel-links"><div data-value="">' + a + "</div></div>" + (e.description ? '<div class="description">' + e.description + "</div>" : "") + "</div>",
        s.appendChild(r),
        n + r.childNodes[0].clientHeight + 35 > t.offsetParent.clientHeight && (r.childNodes[0].style.marginTop = "-90px");
        let l = function() {
            r && (r.parentElement.removeChild(r),
            r = null,
            t.classList.remove("bright"),
            e.onClose && e.onClose())
        };
        r.querySelector('[class="panel-links"]').onclick = function(t) {
            let n = Number(t.target.dataset.value);
            if (!n) {
                let s = prompt(a, o);
                if (null == s)
                    return;
                let i = Number(s);
                if (isNaN(i))
                    return;
                n = Math.min(Math.max(i, (e.customValue ? e.customValue.min : 0) || e.min), (e.customValue ? e.customValue.max : 0) || e.max)
            }
            o = n,
            e.onInput && e.onInput(n),
            e.onChange && e.onChange(n),
            l()
        }
        ;
        let c = r.querySelector('input[type="range"]');
        c.oninput = function() {
            o = parseFloat(c.value),
            e.onInput && e.onInput(o, !0)
        }
        ,
        c.onchange = function() {
            e.onInput && e.onInput(o),
            e.onChange && e.onChange(o),
            l()
        }
        ,
        r.childNodes[0][H] = function(e) {
            e.stopPropagation()
        }
        ,
        r[H] = function() {
            e.onChange && e.onChange(o),
            l()
        }
        ,
        r.style.display = "block"
    }, em = function(e, t) {
        let o = J(e), n, s = function(e) {
            let s = t.onRender(n, e);
            "number" == typeof s && (s = Number(s.toFixed(10)).toString()),
            s != o.innerHTML && (o.innerHTML = s)
        };
        return o.onclick = function() {
            if (t.onClick) {
                var e = t.onClick(n);
                if (!0 === e || void 0 == e)
                    return
            }
            let a = () => {
                eh({
                    elem: o,
                    title: t.title,
                    customValue: t.customValue,
                    onClose: function() {
                        s(),
                        t.onClose && t.onClose()
                    },
                    min: t.min,
                    max: t.max,
                    step: t.step,
                    description: t.description,
                    value: n,
                    options: t.options,
                    onChange: t.onChange,
                    onInput: function(e, o) {
                        n = e,
                        s(o),
                        t.onInput && t.onInput(e, o)
                    }
                })
            }
            ;
            if ("dropDown" == t.type) {
                eg({
                    header: t.title,
                    elem: o,
                    value: n,
                    direction: t.direction,
                    options: t.options,
                    onSelect: function(e) {
                        if ("" == e) {
                            a();
                            return
                        }
                        n = e,
                        s(),
                        t.onInput && t.onInput(n),
                        t.onChange(n)
                    }
                });
                return
            }
            if (t.options) {
                et({
                    title: t.title,
                    value: n,
                    options: t.options,
                    notice: t.notice,
                    onChange: t.onChange,
                    onSelect: function(e) {
                        n = e,
                        s(),
                        t.onChange(n)
                    },
                    onClose: t.onClose
                });
                return
            }
            a()
        }
        ,
        this.update = function() {
            n = t.onData(),
            s()
        }
        ,
        this
    }, e$ = new function() {
        let e = this
          , t = function() {
            return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement
        }
          , o = document.documentElement
          , n = o.requestFullscreen || o.mozRequestFullScreen || o.webkitRequestFullscreen || o.msRequestFullscreen
          , s = document.exitFullscreen || document.mozExitFullScreen || document.webkitExitFullscreen || document.msExitFullscreen
          , a = function() {
            document.documentElement.classList.toggle("fullscreen", t()),
            e.onChange && setTimeout(function() {
                e.onChange()
            }, 0)
        };
        o.addEventListener("fullscreenchange", a),
        o.addEventListener("webkitfullscreenchange", a),
        this.toggle = function() {
            t() ? s.apply(document) : n.apply(o)
        }
        ,
        this.isAvailable = function() {
            return !!n && !navigator.userAgent.match(/iPad|iPhone/)
        }
        ,
        this.isActive = t
    }
    , e_ = function(e) {
        let t = J("status-bar", !0);
        t || ((t = document.createElement("div")).className = "status-bar",
        t.id = "status-bar",
        J("app").appendChild(t)),
        t.innerHTML = e
    }, ey = function() {
        let e = J("status-bar", !0);
        e && e.parentElement.removeChild(e)
    }, ev;
    ev = function(e) {
        let t = document.getElementById("notice");
        if (t && t.parentNode.removeChild(t),
        !e)
            return;
        let o = document.createElement("div");
        o.className = "notice",
        o.id = "notice",
        o.innerHTML = e,
        o.ontransitionend = function() {
            o.parentNode.removeChild(o)
        }
        ,
        J("app").appendChild(o),
        setTimeout(function() {
            o.style.opacity = 0
        }, 1e3)
    }
    ;
    let eg = function(e) {
        let t = e.elem
          , o = "left-down" == e.direction || "right" == e.direction ? t.clientWidth : 0
          , n = "up" == e.direction || "right" == e.direction ? 0 : t.clientHeight
          , s = t;
        for (; "app" != s.id; )
            o += s.offsetLeft,
            n += s.offsetTop,
            s = s.offsetParent;
        let a = '<div class="container" style="left: ' + o + "px; top: " + n + 'px;"><div class="box">' + (e.header ? '<div class="items-header">' + e.header + "</div>" : "");
        if (e.options) {
            a += '<div class="items"' + (e.width ? ' style="width: ' + e.width + 'px"' : "") + ">";
            let i;
            e.options.forEach(function(t) {
                void 0 != t[2] && t[2] != i && (a += '<div class="item-group-header">' + t[2] + "</div>",
                i = t[2]),
                a += '<button class="item' + (t[0] == e.value ? " selected" : "") + '" data-value="' + t[0].toString().replace(/"/g, "&quot;") + '">' + t[1] + "</button>"
            }),
            a += "</div>"
        }
        e.content && (a += e.content),
        a += "</div></div>";
        let r = document.createElement("div");
        r.className = "dropdown" + (e.direction ? " dropdown-" + e.direction : ""),
        r.innerHTML = a;
        let l = function() {
            r.parentNode.removeChild(r)
        };
        return r.childNodes[0][H] = function(t) {
            let o = t.target.dataset.value;
            void 0 != o && (e.onSelect(o),
            l()),
            t.stopPropagation()
        }
        ,
        r[H] = function() {
            l()
        }
        ,
        J("app").appendChild(r),
        {
            hide: function() {
                l()
            }
        }
    }, eb = function(e, t) {
        setTimeout(function() {
            throw e + (t ? " " + t : "")
        }, 0),
        alert(e)
    }, e0, ex;
    ex = {},
    e0 = function(e, t) {
        let o, n, s, a;
        if (e.touches) {
            if (e.touches.length > 1) {
                o = (e.touches[0].clientX + e.touches[1].clientX) * .5,
                n = (e.touches[0].clientY + e.touches[1].clientY) * .5;
                let i = e.touches[1].clientX - e.touches[0].clientX
                  , r = e.touches[1].clientY - e.touches[0].clientY;
                a = Math.sqrt(i * i + r * r)
            } else
                o = e.changedTouches[0].clientX,
                n = e.changedTouches[0].clientY;
            s = e.touches.length
        } else
            o = e.clientX,
            n = e.clientY,
            s = e.buttons > 0 ? 1 : 0,
            a = 1;
        return t && (ex.startX = o,
        ex.startY = n),
        void 0 != o && ((o != ex.x || n != ex.y) && (ex.lastX = void 0 != ex.x ? ex.x : o,
        ex.lastY = void 0 != ex.y ? ex.y : n),
        ex.lastScale = ex.scale,
        ex.x = o,
        ex.y = n,
        ex.count = s,
        ex.scale = a),
        ex
    }
    ;
    var ek, eC, eS, e1, e2, eA, eT, e3 = {};
    eC = (ek = e3).DEFAULT_VOLUME = 90,
    ek.DEFAULT_DURATION = 128,
    ek.DEFAULT_CHANNEL = 0,
    eS = {
        midi_letter_pitches: {
            a: 21,
            b: 23,
            c: 12,
            d: 14,
            e: 16,
            f: 17,
            g: 19
        },
        midiPitchFromNote: function(e) {
            var t = /([a-g])(#+|b+)?([0-9]+)$/i.exec(e)
              , o = t[1].toLowerCase()
              , n = t[2] || "";
            return 12 * parseInt(t[3], 10) + eS.midi_letter_pitches[o] + ("#" == n.substr(0, 1) ? 1 : -1) * n.length
        },
        ensureMidiPitch: function(e) {
            return "number" != typeof e && /[^0-9]/.test(e) ? eS.midiPitchFromNote(e) : parseInt(e, 10)
        },
        midi_pitches_letter: {
            12: "c",
            13: "c#",
            14: "d",
            15: "d#",
            16: "e",
            17: "f",
            18: "f#",
            19: "g",
            20: "g#",
            21: "a",
            22: "a#",
            23: "b"
        },
        midi_flattened_notes: {
            "a#": "bb",
            "c#": "db",
            "d#": "eb",
            "f#": "gb",
            "g#": "ab"
        },
        noteFromMidiPitch: function(e, t) {
            var o, n = 0, s = e, t = t || !1;
            return e > 23 && (n = Math.floor(e / 12) - 1,
            s = e - 12 * n),
            o = eS.midi_pitches_letter[s],
            t && o.indexOf("#") > 0 && (o = eS.midi_flattened_notes[o]),
            o + n
        },
        mpqnFromBpm: function(e) {
            var t = Math.floor(6e7 / e)
              , o = [];
            do
                o.unshift(255 & t),
                t >>= 8;
            while (t);
            for (; o.length < 3; )
                o.push(0);
            return o
        },
        bpmFromMpqn: function(e) {
            var t = e;
            if (void 0 !== e[0]) {
                t = 0;
                for (var o = 0, n = e.length - 1; n >= 0; ++o,
                --n)
                    t |= e[o] << n
            }
            return Math.floor(6e7 / e)
        },
        codes2Str: function(e) {
            return String.fromCharCode.apply(null, e)
        },
        str2Bytes: function(e, t) {
            if (t)
                for (; e.length / 2 < t; )
                    e = "0" + e;
            for (var o = [], n = e.length - 1; n >= 0; n -= 2) {
                var s = 0 === n ? e[n] : e[n - 1] + e[n];
                o.unshift(parseInt(s, 16))
            }
            return o
        },
        translateTickTime: function(e) {
            for (var t = 127 & e; e >>= 7; )
                t <<= 8,
                t |= 127 & e | 128;
            for (var o = []; ; )
                if (o.push(255 & t),
                128 & t)
                    t >>= 8;
                else
                    break;
            return o
        }
    },
    (e1 = function(e) {
        if (!this)
            return new e1(e);
        e && (null !== e.type || void 0 !== e.type) && (null !== e.channel || void 0 !== e.channel) && (null !== e.param1 || void 0 !== e.param1) && (this.setTime(e.time),
        this.setType(e.type),
        this.setChannel(e.channel),
        this.setParam1(e.param1),
        this.setParam2(e.param2))
    }
    ).NOTE_OFF = 128,
    e1.NOTE_ON = 144,
    e1.AFTER_TOUCH = 160,
    e1.CONTROLLER = 176,
    e1.PROGRAM_CHANGE = 192,
    e1.CHANNEL_AFTERTOUCH = 208,
    e1.PITCH_BEND = 224,
    e1.prototype.setTime = function(e) {
        this.time = eS.translateTickTime(e || 0)
    }
    ,
    e1.prototype.setType = function(e) {
        if (e < e1.NOTE_OFF || e > e1.PITCH_BEND)
            throw Error("Trying to set an unknown event: " + e);
        this.type = e
    }
    ,
    e1.prototype.setChannel = function(e) {
        if (e < 0 || e > 15)
            throw Error("Channel is out of bounds.");
        this.channel = e
    }
    ,
    e1.prototype.setParam1 = function(e) {
        this.param1 = e
    }
    ,
    e1.prototype.setParam2 = function(e) {
        this.param2 = e
    }
    ,
    e1.prototype.toBytes = function() {
        var e = []
          , t = this.type | 15 & this.channel;
        return e.push.apply(e, this.time),
        e.push(t),
        e.push(this.param1),
        void 0 !== this.param2 && null !== this.param2 && e.push(this.param2),
        e
    }
    ,
    (e2 = function(e) {
        if (!this)
            return new e2(e);
        this.setTime(e.time),
        this.setType(e.type),
        this.setData(e.data)
    }
    ).SEQUENCE = 0,
    e2.TEXT = 1,
    e2.COPYRIGHT = 2,
    e2.TRACK_NAME = 3,
    e2.INSTRUMENT = 4,
    e2.LYRIC = 5,
    e2.MARKER = 6,
    e2.CUE_POINT = 7,
    e2.CHANNEL_PREFIX = 32,
    e2.END_OF_TRACK = 47,
    e2.TEMPO = 81,
    e2.SMPTE = 84,
    e2.TIME_SIG = 88,
    e2.KEY_SIG = 89,
    e2.SEQ_EVENT = 127,
    e2.prototype.setTime = function(e) {
        this.time = eS.translateTickTime(e || 0)
    }
    ,
    e2.prototype.setType = function(e) {
        this.type = e
    }
    ,
    e2.prototype.setData = function(e) {
        this.data = e
    }
    ,
    e2.prototype.toBytes = function() {
        if (!this.type)
            throw Error("Type for meta-event not specified.");
        var e = [];
        if (e.push.apply(e, this.time),
        e.push(255, this.type),
        Array.isArray(this.data))
            e.push(this.data.length),
            e.push.apply(e, this.data);
        else if ("number" == typeof this.data)
            e.push(1, this.data);
        else if (null !== this.data && void 0 !== this.data) {
            e.push(this.data.length);
            var t = this.data.split("").map(function(e) {
                return e.charCodeAt(0)
            });
            e.push.apply(e, t)
        } else
            e.push(0);
        return e
    }
    ,
    (eA = function(e) {
        if (!this)
            return new eA(e);
        this.events = (e || {}).events || []
    }
    ).START_BYTES = [77, 84, 114, 107],
    eA.END_BYTES = [0, 255, 47, 0],
    eA.prototype.addEvent = function(e) {
        return this.events.push(e),
        this
    }
    ,
    eA.prototype.addNoteOn = eA.prototype.noteOn = function(e, t, o, n) {
        return this.events.push(new e1({
            type: e1.NOTE_ON,
            channel: e,
            param1: eS.ensureMidiPitch(t),
            param2: n || eC,
            time: o || 0
        })),
        this
    }
    ,
    eA.prototype.addNoteOff = eA.prototype.noteOff = function(e, t, o, n) {
        return this.events.push(new e1({
            type: e1.NOTE_OFF,
            channel: e,
            param1: eS.ensureMidiPitch(t),
            param2: n || eC,
            time: o || 0
        })),
        this
    }
    ,
    eA.prototype.addNote = eA.prototype.note = function(e, t, o, n, s) {
        return this.noteOn(e, t, n, s),
        o && this.noteOff(e, t, o, s),
        this
    }
    ,
    eA.prototype.addChord = eA.prototype.chord = function(e, t, o, n) {
        if (!Array.isArray(t) && !t.length)
            throw Error("Chord must be an array of pitches");
        return t.forEach(function(t) {
            this.noteOn(e, t, 0, n)
        }, this),
        t.forEach(function(t, n) {
            0 === n ? this.noteOff(e, t, o) : this.noteOff(e, t)
        }, this),
        this
    }
    ,
    eA.prototype.setInstrument = eA.prototype.instrument = function(e, t, o) {
        return this.events.push(new e1({
            type: e1.PROGRAM_CHANGE,
            channel: e,
            param1: t,
            time: o || 0
        })),
        this
    }
    ,
    eA.prototype.setTempo = eA.prototype.tempo = function(e, t) {
        return this.events.push(new e2({
            type: e2.TEMPO,
            data: eS.mpqnFromBpm(e),
            time: t || 0
        })),
        this
    }
    ,
    eA.prototype.setTimeSig = eA.prototype.timeSig = function(e, t) {
        var o = e.split("/")
          , n = [Number(o[0]), Math.log(Number(o[1])) / Math.log(2), 24, 8];
        return this.events.push(new e2({
            type: e2.TIME_SIG,
            data: n,
            time: t || 0
        })),
        this
    }
    ,
    eA.prototype.setTrackEnd = function(e) {
        return this.events.push(new e2({
            type: e2.END_OF_TRACK,
            data: [],
            time: e || 0
        })),
        this
    }
    ,
    eA.prototype.toBytes = function() {
        var e = 0
          , t = []
          , o = eA.START_BYTES
          , n = eA.END_BYTES
          , s = function(o) {
            var n = o.toBytes();
            e += n.length,
            t.push.apply(t, n)
        };
        this.events.forEach(s),
        e += n.length;
        var a = eS.str2Bytes(e.toString(16), 4);
        return o.concat(a, t, n)
    }
    ,
    (eT = function(e) {
        if (!this)
            return new eT(e);
        var t = e || {};
        if (t.ticks) {
            if ("number" != typeof t.ticks)
                throw Error("Ticks per beat must be a number!");
            if (t.ticks <= 0 || t.ticks >= 32768 || t.ticks % 1 != 0)
                throw Error("Ticks per beat must be an integer between 1 and 32767!")
        }
        this.ticks = t.ticks || 128,
        this.tracks = t.tracks || []
    }
    ).HDR_CHUNKID = "MThd",
    eT.HDR_CHUNK_SIZE = "\0\0\0\x06",
    eT.HDR_TYPE0 = "\0\0",
    eT.HDR_TYPE1 = "\0\x01",
    eT.prototype.addTrack = function(e) {
        return e ? (this.tracks.push(e),
        this) : (e = new eA,
        this.tracks.push(e),
        e)
    }
    ,
    eT.prototype.toBytes = function() {
        var e = this.tracks.length.toString(16)
          , t = eT.HDR_CHUNKID + eT.HDR_CHUNK_SIZE;
        return this.tracks.length > 1 ? t += eT.HDR_TYPE1 : t += eT.HDR_TYPE0,
        t += eS.codes2Str(eS.str2Bytes(e, 2)),
        t += String.fromCharCode(this.ticks / 256, this.ticks % 256),
        this.tracks.forEach(function(e) {
            t += eS.codes2Str(e.toBytes())
        }),
        t
    }
    ,
    ek.Util = eS,
    ek.File = eT,
    ek.Track = eA,
    ek.Event = e1,
    ek.MetaEvent = e2;
    var ew = function() {
        function e(t) {
            return (e = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
                return typeof e
            }
            : function(e) {
                return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
            }
            )(t)
        }
        function t(e, t) {
            if (!(e instanceof t))
                throw TypeError("Cannot call a class as a function")
        }
        function o(e, t) {
            for (var o = 0; o < t.length; o++) {
                var n = t[o];
                n.enumerable = n.enumerable || !1,
                n.configurable = !0,
                "value"in n && (n.writable = !0),
                Object.defineProperty(e, n.key, n)
            }
        }
        function n(e, t, n) {
            return t && o(e.prototype, t),
            n && o(e, n),
            e
        }
        for (var s = {
            VERSION: "2.0.16",
            NOTES: [],
            HEADER_CHUNK_LENGTH: 14,
            CIRCLE_OF_FOURTHS: ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb", "Bbb", "Ebb", "Abb"],
            CIRCLE_OF_FIFTHS: ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "E#"]
        }, a = [["C"], ["C#", "Db"], ["D"], ["D#", "Eb"], ["E"], ["F"], ["F#", "Gb"], ["G"], ["G#", "Ab"], ["A"], ["A#", "Bb"], ["B"]], i = 0, r = function e(t) {
            a.forEach(function(e) {
                e.forEach(function(e) {
                    return s.NOTES[i] = e + t
                }),
                i++
            })
        }, l = -1; l <= 9; l++)
            r(l);
        var c, d = function() {
            function e() {
                t(this, e)
            }
            return n(e, null, [{
                key: "byteToHex",
                value: function e(t) {
                    return ("0" + t.toString(16)).slice(-2)
                }
            }, {
                key: "bytesToHex",
                value: function t(o) {
                    var n = [];
                    return o.forEach(function(t) {
                        return n.push(e.byteToHex(t))
                    }),
                    n.join("")
                }
            }, {
                key: "hexToNumber",
                value: function e(t) {
                    return parseInt(t, 16)
                }
            }, {
                key: "bytesToNumber",
                value: function t(o) {
                    return e.hexToNumber(e.bytesToHex(o))
                }
            }, {
                key: "bytesToLetters",
                value: function e(t) {
                    var o = [];
                    return t.forEach(function(e) {
                        return o.push(String.fromCharCode(e))
                    }),
                    o.join("")
                }
            }, {
                key: "decToBinary",
                value: function e(t) {
                    return (t >>> 0).toString(2)
                }
            }, {
                key: "getVarIntLength",
                value: function e(t) {
                    for (var o = t[0], n = 1; o >= 128; )
                        o = t[n],
                        n++;
                    return n
                }
            }, {
                key: "readVarInt",
                value: function e(t) {
                    var o = 0;
                    return t.forEach(function(e) {
                        var t = e;
                        128 & t ? (o += 127 & t,
                        o <<= 7) : o += t
                    }),
                    o
                }
            }, {
                key: "atob",
                value: function(e) {
                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t.toString = function() {
                        return e.toString()
                    }
                    ,
                    t
                }(function(e) {
                    return "function" == typeof atob ? atob(e) : Buffer.from(e, "base64").toString("binary")
                })
            }]),
            e
        }(), u = function() {
            function e(o, n) {
                t(this, e),
                this.enabled = !0,
                this.eventIndex = 0,
                this.pointer = 0,
                this.lastTick = 0,
                this.lastStatus = null,
                this.index = o,
                this.data = n,
                this.delta = 0,
                this.runningDelta = 0,
                this.events = [];
                var s = this.data.subarray(this.data.length - 3, this.data.length);
                if (!(255 === s[0] && 47 === s[1] && 0 === s[2]))
                    throw "Invalid MIDI file; Last three bytes of track " + this.index + "must be FF 2F 00 to mark end of track"
            }
            return n(e, [{
                key: "reset",
                value: function e() {
                    return this.enabled = !0,
                    this.eventIndex = 0,
                    this.pointer = 0,
                    this.lastTick = 0,
                    this.lastStatus = null,
                    this.delta = 0,
                    this.runningDelta = 0,
                    this
                }
            }, {
                key: "enable",
                value: function e() {
                    return this.enabled = !0,
                    this
                }
            }, {
                key: "disable",
                value: function e() {
                    return this.enabled = !1,
                    this
                }
            }, {
                key: "setEventIndexByTick",
                value: function e(t) {
                    for (var o in t = t || 0,
                    this.events)
                        if (this.events[o].tick >= t)
                            return this.eventIndex = o,
                            this
                }
            }, {
                key: "getCurrentByte",
                value: function e() {
                    return this.data[this.pointer]
                }
            }, {
                key: "getDeltaByteCount",
                value: function e() {
                    return d.getVarIntLength(this.data.subarray(this.pointer))
                }
            }, {
                key: "getDelta",
                value: function e() {
                    return d.readVarInt(this.data.subarray(this.pointer, this.pointer + this.getDeltaByteCount()))
                }
            }, {
                key: "handleEvent",
                value: function e(t, o) {
                    if (o = o || !1) {
                        var n = t - this.lastTick
                          , s = this.getDelta();
                        if (this.pointer < this.data.length && (o || n >= s)) {
                            var a = this.parseEvent();
                            if (this.enabled)
                                return a
                        }
                    } else if (this.events[this.eventIndex] && this.events[this.eventIndex].tick <= t && (this.eventIndex++,
                    this.enabled))
                        return this.events[this.eventIndex - 1];
                    return null
                }
            }, {
                key: "getStringData",
                value: function e(t) {
                    var o = d.getVarIntLength(this.data.subarray(t + 2))
                      , n = d.readVarInt(this.data.subarray(t + 2, t + 2 + o));
                    return d.bytesToLetters(this.data.subarray(t + 2 + o, t + 2 + o + n))
                }
            }, {
                key: "parseEvent",
                value: function e() {
                    var t = this.pointer + this.getDeltaByteCount()
                      , o = {}
                      , n = this.getDeltaByteCount();
                    if (o.track = this.index + 1,
                    o.delta = this.getDelta(),
                    this.lastTick = this.lastTick + o.delta,
                    this.runningDelta += o.delta,
                    o.tick = this.runningDelta,
                    o.byteIndex = this.pointer,
                    255 == this.data[t]) {
                        switch (this.data[t + 1]) {
                        case 0:
                            o.name = "Sequence Number";
                            break;
                        case 1:
                            o.name = "Text Event",
                            o.string = this.getStringData(t);
                            break;
                        case 2:
                            o.name = "Copyright Notice";
                            break;
                        case 3:
                            o.name = "Sequence/Track Name",
                            o.string = this.getStringData(t);
                            break;
                        case 4:
                            o.name = "Instrument Name",
                            o.string = this.getStringData(t);
                            break;
                        case 5:
                            o.name = "Lyric",
                            o.string = this.getStringData(t);
                            break;
                        case 6:
                            o.name = "Marker";
                            break;
                        case 7:
                            o.name = "Cue Point",
                            o.string = this.getStringData(t);
                            break;
                        case 9:
                            o.name = "Device Name",
                            o.string = this.getStringData(t);
                            break;
                        case 32:
                            o.name = "MIDI Channel Prefix";
                            break;
                        case 33:
                            o.name = "MIDI Port",
                            o.data = d.bytesToNumber([this.data[t + 3]]);
                            break;
                        case 47:
                            o.name = "End of Track";
                            break;
                        case 81:
                            o.name = "Set Tempo",
                            o.data = Math.round(6e7 / d.bytesToNumber(this.data.subarray(t + 3, t + 6))),
                            this.tempo = o.data;
                            break;
                        case 84:
                            o.name = "SMTPE Offset";
                            break;
                        case 88:
                            o.name = "Time Signature",
                            o.data = this.data.subarray(t + 3, t + 7),
                            o.timeSignature = "" + o.data[0] + "/" + Math.pow(2, o.data[1]);
                            break;
                        case 89:
                            o.name = "Key Signature",
                            o.data = this.data.subarray(t + 3, t + 5),
                            o.data[0] >= 0 ? o.keySignature = s.CIRCLE_OF_FIFTHS[o.data[0]] : o.data[0] < 0 && (o.keySignature = s.CIRCLE_OF_FOURTHS[Math.abs(o.data[0])]),
                            0 == o.data[1] ? o.keySignature += " Major" : 1 == o.data[1] && (o.keySignature += " Minor");
                            break;
                        case 127:
                            o.name = "Sequencer-Specific Meta-event";
                            break;
                        default:
                            o.name = "Unknown: " + this.data[t + 1].toString(16)
                        }
                        var a = d.getVarIntLength(this.data.subarray(t + 2))
                          , i = d.readVarInt(this.data.subarray(t + 2, t + 2 + a));
                        this.pointer += n + 3 + i
                    } else if (240 === this.data[t]) {
                        o.name = "Sysex";
                        var r = d.getVarIntLength(this.data.subarray(t + 1))
                          , l = d.readVarInt(this.data.subarray(t + 1, t + 1 + r));
                        o.data = this.data.subarray(t + 1 + r, t + 1 + r + l),
                        this.pointer += n + 1 + r + l
                    } else if (247 === this.data[t]) {
                        o.name = "Sysex (escape)";
                        var c = d.getVarIntLength(this.data.subarray(t + 1))
                          , u = d.readVarInt(this.data.subarray(t + 1, t + 1 + c));
                        o.data = this.data.subarray(t + 1 + c, t + 1 + c + u),
                        this.pointer += n + 1 + c + u
                    } else if (this.data[t] < 128) {
                        if (o.running = !0,
                        o.noteNumber = this.data[t],
                        o.noteName = s.NOTES[this.data[t]],
                        o.velocity = this.data[t + 1],
                        this.lastStatus <= 143)
                            o.name = "Note off",
                            o.channel = this.lastStatus - 128 + 1,
                            this.pointer += n + 2;
                        else if (this.lastStatus <= 159)
                            o.name = "Note on",
                            o.channel = this.lastStatus - 144 + 1,
                            this.pointer += n + 2;
                        else if (this.lastStatus <= 175)
                            o.name = "Polyphonic Key Pressure",
                            o.channel = this.lastStatus - 160 + 1,
                            o.note = s.NOTES[this.data[t + 1]],
                            o.pressure = event[1],
                            this.pointer += n + 2;
                        else if (this.lastStatus <= 191)
                            o.name = "Controller Change",
                            o.channel = this.lastStatus - 176 + 1,
                            o.number = this.data[t + 1],
                            o.value = this.data[t + 2],
                            this.pointer += n + 2;
                        else if (this.lastStatus <= 207)
                            o.name = "Program Change",
                            o.channel = this.lastStatus - 192 + 1,
                            o.value = this.data[t + 1],
                            this.pointer += n + 1;
                        else if (this.lastStatus <= 223)
                            o.name = "Channel Key Pressure",
                            o.channel = this.lastStatus - 208 + 1,
                            this.pointer += n + 1;
                        else if (this.lastStatus <= 239)
                            o.name = "Pitch Bend",
                            o.channel = this.lastStatus - 224 + 1,
                            o.value = this.data[t + 2],
                            this.pointer += n + 2;
                        else
                            throw "Unknown event (running): ".concat(this.lastStatus)
                    } else if (this.lastStatus = this.data[t],
                    this.data[t] <= 143)
                        o.name = "Note off",
                        o.channel = this.lastStatus - 128 + 1,
                        o.noteNumber = this.data[t + 1],
                        o.noteName = s.NOTES[this.data[t + 1]],
                        o.velocity = Math.round(this.data[t + 2] / 127 * 100),
                        this.pointer += n + 3;
                    else if (this.data[t] <= 159)
                        o.name = "Note on",
                        o.channel = this.lastStatus - 144 + 1,
                        o.noteNumber = this.data[t + 1],
                        o.noteName = s.NOTES[this.data[t + 1]],
                        o.velocity = Math.round(this.data[t + 2] / 127 * 100),
                        this.pointer += n + 3;
                    else if (this.data[t] <= 175)
                        o.name = "Polyphonic Key Pressure",
                        o.channel = this.lastStatus - 160 + 1,
                        o.note = s.NOTES[this.data[t + 1]],
                        o.pressure = event[2],
                        this.pointer += n + 3;
                    else if (this.data[t] <= 191)
                        o.name = "Controller Change",
                        o.channel = this.lastStatus - 176 + 1,
                        o.number = this.data[t + 1],
                        o.value = this.data[t + 2],
                        this.pointer += n + 3;
                    else if (this.data[t] <= 207)
                        o.name = "Program Change",
                        o.channel = this.lastStatus - 192 + 1,
                        o.value = this.data[t + 1],
                        this.pointer += n + 2;
                    else if (this.data[t] <= 223)
                        o.name = "Channel Key Pressure",
                        o.channel = this.lastStatus - 208 + 1,
                        this.pointer += n + 2;
                    else if (this.data[t] <= 239)
                        o.name = "Pitch Bend",
                        o.channel = this.lastStatus - 224 + 1,
                        this.pointer += n + 3;
                    else
                        throw "Unknown event: ".concat(this.data[t]);
                    return this.delta += o.delta,
                    this.events.push(o),
                    o
                }
            }, {
                key: "endOfTrack",
                value: function e() {
                    return 255 == this.data[this.pointer + 1] && 47 == this.data[this.pointer + 2] && 0 == this.data[this.pointer + 3]
                }
            }]),
            e
        }();
        return Uint8Array.prototype.forEach || Object.defineProperty(Uint8Array.prototype, "forEach", {
            value: Array.prototype.forEach
        }),
        {
            Player: function() {
                function o(e, n) {
                    t(this, o),
                    this.sampleRate = 5,
                    this.startTime = 0,
                    this.buffer = n || null,
                    this.midiChunksByteLength = null,
                    this.division,
                    this.format,
                    this.setIntervalId = !1,
                    this.tracks = [],
                    this.instruments = [],
                    this.defaultTempo = 120,
                    this.tempo = null,
                    this.startTick = 0,
                    this.tick = 0,
                    this.lastTick = null,
                    this.inLoop = !1,
                    this.totalTicks = 0,
                    this.events = [],
                    this.totalEvents = 0,
                    this.eventListeners = {},
                    "function" == typeof e && this.on("midiEvent", e)
                }
                return n(o, [{
                    key: "loadFile",
                    value: function e(t) {
                        throw "loadFile is only supported on Node.js"
                    }
                }, {
                    key: "loadArrayBuffer",
                    value: function e(t) {
                        return this.buffer = new Uint8Array(t),
                        this.fileLoaded()
                    }
                }, {
                    key: "loadDataUri",
                    value: function e(t) {
                        for (var o = d.atob(t.split(",")[1]), n = new Uint8Array(o.length), s = 0; s < o.length; s++)
                            n[s] = o.charCodeAt(s);
                        return this.buffer = n,
                        this.fileLoaded()
                    }
                }, {
                    key: "getFilesize",
                    value: function e() {
                        return this.buffer ? this.buffer.length : 0
                    }
                }, {
                    key: "fileLoaded",
                    value: function e() {
                        if (!this.validate())
                            throw "Invalid MIDI file; should start with MThd";
                        return this.setTempo(this.defaultTempo).getDivision().getFormat().getTracks().dryRun()
                    }
                }, {
                    key: "validate",
                    value: function e() {
                        return "MThd" === d.bytesToLetters(this.buffer.subarray(0, 4))
                    }
                }, {
                    key: "getFormat",
                    value: function e() {
                        return this.format = d.bytesToNumber(this.buffer.subarray(8, 10)),
                        this
                    }
                }, {
                    key: "getTracks",
                    value: function e() {
                        this.tracks = [];
                        for (var t = 0; t < this.buffer.length; ) {
                            if ("MTrk" == d.bytesToLetters(this.buffer.subarray(t, t + 4))) {
                                var o = d.bytesToNumber(this.buffer.subarray(t + 4, t + 8));
                                this.tracks.push(new u(this.tracks.length,this.buffer.subarray(t + 8, t + 8 + o)))
                            }
                            t += d.bytesToNumber(this.buffer.subarray(t + 4, t + 8)) + 8
                        }
                        var n = 0;
                        return this.tracks.forEach(function(e) {
                            n += 8 + e.data.length
                        }),
                        this.midiChunksByteLength = s.HEADER_CHUNK_LENGTH + n,
                        this
                    }
                }, {
                    key: "enableTrack",
                    value: function e(t) {
                        return this.tracks[t - 1].enable(),
                        this
                    }
                }, {
                    key: "disableTrack",
                    value: function e(t) {
                        return this.tracks[t - 1].disable(),
                        this
                    }
                }, {
                    key: "getDivision",
                    value: function e() {
                        return this.division = d.bytesToNumber(this.buffer.subarray(12, s.HEADER_CHUNK_LENGTH)),
                        this
                    }
                }, {
                    key: "playLoop",
                    value: function e(t) {
                        this.inLoop || (this.inLoop = !0,
                        this.tick = this.getCurrentTick(),
                        this.tracks.forEach(function(e, o) {
                            if (!t && this.endOfFile())
                                this.triggerPlayerEvent("endOfFile"),
                                this.stop();
                            else {
                                var n = e.handleEvent(this.tick, t);
                                t && n ? (n.hasOwnProperty("name") && "Set Tempo" === n.name && (this.defaultTempo = n.data,
                                this.setTempo(n.data)),
                                n.hasOwnProperty("name") && "Program Change" === n.name && !this.instruments.includes(n.value) && this.instruments.push(n.value)) : n && (n.hasOwnProperty("name") && "Set Tempo" === n.name && (this.setTempo(n.data),
                                this.isPlaying() && this.pause().play()),
                                this.emitEvent(n))
                            }
                        }, this),
                        t || this.triggerPlayerEvent("playing", {
                            tick: this.tick
                        }),
                        this.inLoop = !1)
                    }
                }, {
                    key: "setTempo",
                    value: function e(t) {
                        return this.tempo = t,
                        this
                    }
                }, {
                    key: "setStartTime",
                    value: function e(t) {
                        return this.startTime = t,
                        this
                    }
                }, {
                    key: "play",
                    value: function e() {
                        if (this.isPlaying())
                            throw "Already playing...";
                        return this.startTime || (this.startTime = new Date().getTime()),
                        this.setIntervalId = setInterval(this.playLoop.bind(this), this.sampleRate),
                        this
                    }
                }, {
                    key: "loop",
                    value: function e() {
                        setTimeout((function() {
                            this.playLoop(),
                            this.loop()
                        }
                        ).bind(this), this.sampleRate)
                    }
                }, {
                    key: "pause",
                    value: function e() {
                        return clearInterval(this.setIntervalId),
                        this.setIntervalId = !1,
                        this.startTick = this.tick,
                        this.startTime = 0,
                        this
                    }
                }, {
                    key: "stop",
                    value: function e() {
                        return clearInterval(this.setIntervalId),
                        this.setIntervalId = !1,
                        this.startTick = 0,
                        this.startTime = 0,
                        this.resetTracks(),
                        this
                    }
                }, {
                    key: "skipToTick",
                    value: function e(t) {
                        return this.stop(),
                        this.startTick = t,
                        this.tracks.forEach(function(e) {
                            e.setEventIndexByTick(t)
                        }),
                        this
                    }
                }, {
                    key: "skipToPercent",
                    value: function e(t) {
                        if (t < 0 || t > 100)
                            throw "Percent must be number between 1 and 100.";
                        return this.skipToTick(Math.round(t / 100 * this.totalTicks)),
                        this
                    }
                }, {
                    key: "skipToSeconds",
                    value: function e(t) {
                        var o = this.getSongTime();
                        if (t < 0 || t > o)
                            throw t + " seconds not within song time of " + o;
                        return this.skipToPercent(t / o * 100),
                        this
                    }
                }, {
                    key: "isPlaying",
                    value: function t() {
                        return this.setIntervalId > 0 || "object" === e(this.setIntervalId)
                    }
                }, {
                    key: "dryRun",
                    value: function e() {
                        for (this.resetTracks(); !this.endOfFile(); )
                            this.playLoop(!0);
                        return this.events = this.getEvents(),
                        this.totalEvents = this.getTotalEvents(),
                        this.totalTicks = this.getTotalTicks(),
                        this.startTick = 0,
                        this.startTime = 0,
                        this.resetTracks(),
                        this.triggerPlayerEvent("fileLoaded", this),
                        this
                    }
                }, {
                    key: "resetTracks",
                    value: function e() {
                        return this.tracks.forEach(function(e) {
                            return e.reset()
                        }),
                        this
                    }
                }, {
                    key: "getEvents",
                    value: function e() {
                        return this.tracks.map(function(e) {
                            return e.events
                        })
                    }
                }, {
                    key: "getTotalTicks",
                    value: function e() {
                        return Math.max.apply(null, this.tracks.map(function(e) {
                            return e.delta
                        }))
                    }
                }, {
                    key: "getTotalEvents",
                    value: function e() {
                        return this.tracks.reduce(function(e, t) {
                            return {
                                events: {
                                    length: e.events.length + t.events.length
                                }
                            }
                        }, {
                            events: {
                                length: 0
                            }
                        }).events.length
                    }
                }, {
                    key: "getSongTime",
                    value: function e() {
                        return this.totalTicks / this.division / this.tempo * 60
                    }
                }, {
                    key: "getSongTimeRemaining",
                    value: function e() {
                        return Math.round((this.totalTicks - this.getCurrentTick()) / this.division / this.tempo * 60)
                    }
                }, {
                    key: "getSongPercentRemaining",
                    value: function e() {
                        return Math.round(this.getSongTimeRemaining() / this.getSongTime() * 100)
                    }
                }, {
                    key: "bytesProcessed",
                    value: function e() {
                        return s.HEADER_CHUNK_LENGTH + 8 * this.tracks.length + this.tracks.reduce(function(e, t) {
                            return {
                                pointer: e.pointer + t.pointer
                            }
                        }, {
                            pointer: 0
                        }).pointer
                    }
                }, {
                    key: "eventsPlayed",
                    value: function e() {
                        return this.tracks.reduce(function(e, t) {
                            return {
                                eventIndex: e.eventIndex + t.eventIndex
                            }
                        }, {
                            eventIndex: 0
                        }).eventIndex
                    }
                }, {
                    key: "endOfFile",
                    value: function e() {
                        return this.isPlaying() ? this.totalTicks - this.tick <= 0 : this.bytesProcessed() >= this.midiChunksByteLength
                    }
                }, {
                    key: "getCurrentTick",
                    value: function e() {
                        return this.startTime ? Math.round((new Date().getTime() - this.startTime) / 1e3 * (this.division * (this.tempo / 60))) + this.startTick : this.startTick
                    }
                }, {
                    key: "emitEvent",
                    value: function e(t) {
                        return this.triggerPlayerEvent("midiEvent", t),
                        this
                    }
                }, {
                    key: "on",
                    value: function e(t, o) {
                        return this.eventListeners.hasOwnProperty(t) || (this.eventListeners[t] = []),
                        this.eventListeners[t].push(o),
                        this
                    }
                }, {
                    key: "triggerPlayerEvent",
                    value: function e(t, o) {
                        return this.eventListeners.hasOwnProperty(t) && this.eventListeners[t].forEach(function(e) {
                            return e(o || {})
                        }),
                        this
                    }
                }]),
                o
            }(),
            Utils: d,
            Constants: s
        }
    }()
      , eP = {
        volume: 1,
        keyboardOffset: 48,
        velocity: .7,
        currentZoom: 1,
        transposeLock: !1,
        editor: {
            headers: {
                chord: {},
                bass: {}
            }
        },
        cadencesPedalPoint: !1,
        playedMelodyEvents: [],
        tempoLock: !1
    };
    /iPad|iPhone|iPod/.test(navigator.userAgent);
    var e5 = {
        90: 0,
        83: 1,
        88: 2,
        68: 3,
        67: 4,
        86: 5,
        71: 6,
        66: 7,
        72: 8,
        78: 9,
        74: 10,
        77: 11,
        188: 12,
        76: 13,
        190: 14,
        189: 16,
        191: 16,
        186: 15,
        81: 12,
        50: 13,
        87: 14,
        51: 15,
        69: 16,
        82: 17,
        53: 18,
        84: 19,
        54: 20,
        89: 21,
        55: 22,
        85: 23,
        73: 24,
        57: 25,
        79: 26,
        48: 27,
        80: 28,
        219: 29,
        187: 30,
        221: 31
    }
      , eE = {}
      , eL = {
        188: ",",
        190: ".",
        189: "/",
        186: ";",
        219: " ",
        187: " ",
        221: " "
    };
    for (var eI in e5)
        eE[e5[eI]] = eE[e5[eI]] || eL[eI] || String.fromCharCode(eI);
    var eN = ["I", "II", "III", "IV", "V", "VI", "VII"]
      , e4 = new function() {
        var e = [[0, 'None'], [1, 'Intro'], [2, 'Verse'], [3, 'Pre-chorus'], [4, 'Chorus'], [5, 'Interlude'], [6, 'Bridge'], [7, 'Solo'], [8, 'Outro'], ];
        this.sectionValue = function(t) {
            var o = t.trim().toLowerCase()
              , n = e.find(function(e) {
                return o == e[1].toLowerCase()
            });
            return void 0 != n ? n[0] : t
        }
        ,
        this.sectionName = function(t) {
            return "number" == typeof t ? e[t][1] : t
        }
        ,
        this.defaultSections = e
    }
      , eO = [[2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 12], [1, 16], [1, 18], [1, 24], [1, 32], [1, 48], [3, 4], [3, 8], [5, 8], [7, 8], [3, 16]]
      , eM = [[49, 50, 51, 52, 53, 54, 55, 56, 57, 48], [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 219], [65, 83, 68, 70, 71, 72, 74, 75, 76, 186, 222], [90, 88, 67, 86, 66, 78, 77, 188, 190, 189]]
      , e7 = {}
      , eq = {
        keyboardType: "scale",
        keyboardChordNumNotes: 3,
        keyboardMulti: 0,
        keyboardKeyCount: 15,
        keyboardSustain: !1,
        drumMachineEnabled: !1,
        metronomeEnabled: !1,
        chordControlEnabled: !1,
        chordsHoldChord: !1,
        showUnusualChords: !1,
        showAlwaysVoiceInfo: !1,
        midiInputs: {},
        midiOutputs: {},
        midiInputChannel: 0,
        midiInputMode: "absolute",
        midiOutputChannel: 1,
        chordNotation: "default",
        keyboardLayout: "qwerty"
    };
    "undefined" != typeof BroadcastChannel && (f = new BroadcastChannel("music"));
    var e6 = A([{
        value: "once",
        name: 'Once',
        chord: {
            style: "once"
        },
        bass: {
            style: "once"
        }
    }, {
        value: "basic-1",
        name: 'Basic' + " 1",
        chord: {
            style: "split-23-1",
            step: [1, 8]
        },
        bass: {
            style: "once",
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "basic-2",
        name: 'Basic' + " 2",
        chord: {
            style: "arp-1-2-3-2",
            step: [1, 8]
        },
        bass: {
            style: "once",
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "basic-3",
        name: 'Basic' + " 3",
        chord: {
            style: "arp-1-3-2-3",
            step: [1, 8],
            mirror: !0
        },
        bass: {
            style: "once",
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "basic-4",
        name: 'Basic' + " 4",
        chord: {
            style: "arp-1-2-3-1-2-4",
            step: [1, 8]
        },
        bass: {
            style: "once",
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "pop-1",
        name: "Pop 1",
        chord: {
            style: "beat"
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1!1+! . . . . . . @1f! 1!1+! . . . . 1s1+s . ."
        },
        tempo: 120,
        shuffle: "2:1"
    }, {
        value: "pop-2",
        name: "Pop 2",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "x . . . . x? . . 0# . . . . x . ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "11+ . . 1 . . 1+m? 1fm? 11+ . . 1 1+ . 1+m 1fm"
        },
        tempo: 90,
        sustain: "chord"
    }, {
        value: "pop-3",
        name: "Pop 3",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "xs . . . 1s3s 2s . @xs . . . . 12 . 3- ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s1+s . . 1+! . . @1s . . . . 1+! . 1+! . ."
        },
        tempo: 90,
        sustain: "chord"
    }, {
        value: "pop-4",
        name: "Pop 4",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "xS2 xT . . xm . . . xm . . . xm . . . x . . . xm . . . xm . . . 3 1 2 3 xS2 xT . . xm . . . xm . . . xm . . . x . . . xm . . . xm . . . 1 2 3 1",
            numNotes: 3
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1 . . @1f# . . . . 1 . . @1f# . 1f# . .",
            octave: 3
        },
        tempo: 90,
        sustain: "chord"
    }, {
        value: "dance-1",
        name: "Dance 1",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "x . . @x . . @x . . x . . x . . x"
        },
        bass: {
            style: "bass-octave-1"
        },
        sustain: "2-beats"
    }, {
        value: "dance-2",
        name: "Dance 2",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: ". . x . . x . . x . . x . 1 2* 1"
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "x . . . x . . @x . . x . . . . .",
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "rock-1",
        name: "Rock 1",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "xs . . . . . . . . . x! . . x! . ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs x! xs @1<!"
        },
        xsustain: "chord"
    }, {
        value: "rock-2",
        name: "Rock 2",
        tempo: 120,
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: "xs . . xs . . x! ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s . . . 1+ . . . . . 1s . 1+ . . . 1s . . . 1+ . . . . . 1s . 1+ . 1s ."
        },
        xsustain: "chord"
    }, {
        value: "rock-3",
        name: "Rock 3",
        tempo: 120,
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: ". . . . xs . . @2 . 13 . . x . 2 13 . . 1! . xs . . @2 . 13 . . x . 2 13"
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1 . . . . . . . . . 1 . . . . .",
            octave: 3
        }
    }, {
        value: "rock-4",
        name: "Rock 4",
        tempo: 120,
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: "234 . 234 . 1 234 . @234 . 1 234 . 1 234 . 1"
        },
        bass: {
            style: "bass-octave-1",
            step: [1, 8]
        },
        sustain: "chord"
    }, {
        value: "swing-1",
        name: "Swing 1",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: ". . . xs# . . 0!# ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1s . . . . . . @1f& 1s . . . . . . @1f& 1s . . . . . . @1f& 1s . . . . . @1f& 1<%",
            octave: 3
        },
        shuffle: "2:1",
        tempo: 130,
        tags: ["retro"]
    }, {
        value: "swing-2",
        name: "Swing 2",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: "x! . . @xs . . . . . x! . . . x! . ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1s . 1fs . 1+s 1 1fs# . 1+s . 1fs . 1s @1// 1/s . 1s . 1fs . 1+s 1 1fs# . 1+s . 1fs . 1s @1// 1/ 1+"
        },
        shuffle: "2:1",
        tempo: 130,
        tags: ["retro"]
    }, {
        value: "waltz-1",
        name: 'Waltz',
        timeSignature: "3/4",
        chord: {
            style: "arpeggio",
            step: [1, 3],
            arp: ". x x"
        },
        bass: {
            style: "arpeggio",
            step: [1, 3],
            arp: "1 . . 1f# . .",
            octave: 3
        },
        sustain: "chord",
        tags: ["retro"]
    }, {
        value: "jazz-waltz-1",
        name: 'Jazz Waltz',
        timeSignature: "3/4",
        chord: {
            style: "arpeggio",
            step: [1, 6],
            arp: ". x! . . xs ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 6],
            arp: "1 . . @1 . @1f 1 . . @1 . @1f 1 . . @1 . @1f 1 . . @1 . .",
            octave: 3
        },
        shuffle: "2:1",
        tempo: 120,
        tags: ["retro"]
    }, {
        value: "reggae-1",
        name: "Reggae",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: ". . x! . . . x! . . . x! 231+ . . x! . . . x! . . . x! . . . x! 2!3!1+! . 2!3!1+! x! ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1 1 . . . 1+! . ."
        },
        shuffle: "2:1",
        tempo: 80,
        tags: ["latin"]
    }, {
        value: "salsa-1",
        name: "Salsa 1",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "14 2 3 14 . 23 @0 14 . 23 . @14 . 23 @0 14",
            numNotes: 3
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s . . @1f&s# . . @1s . . . . @1f&s# . . @1s . . . . @1f&s# . . @1s . . . . @1f&s# . . . .",
            octave: 3
        }
    }, {
        value: "salsa-2",
        name: "Salsa 2",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "3# . 4 1# . 2 @0 3m# . 4 . @1# . 2 @0 3"
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s . . @1f&s# . . @1s . . . . @1f&s# . . @1s . . . . @1f&s# . . @1s . . . . @1f&s# . . . .",
            octave: 3
        }
    }, {
        value: "bossa-nova-1",
        name: "Bossa Nova 1",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: "x! . xs . . x . @x! . xs . . x! . x! ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1s . . 1 1fs# . . @1s . . . 1 1fs# . . @1f- 1s . . 1 1fs# . . @1s . . . 1 1fs# . @1\\\\ 1\\",
            octave: 3
        },
        tempo: 120,
        tags: ["latin"]
    }, {
        value: "bossa-nova-2",
        name: "Bossa Nova 2",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: ". . . . x . . . . . x! . . . . . . . . . xs . . . . . . . x! . . ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1! . . . . . 1f! . 1fs# . . . . . @1s . . . 1!m . . . 1 . 1+! . 1<+! . 1f! . 1f<! ."
        },
        tempo: 120,
        tags: ["latin"]
    }, {
        value: "samba-1",
        name: "Samba",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: "x! . x @1! . x! . @x! . x! . @x! . x! . 1!"
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1s . . . 1f&s# . . . 1s . . . 1f&s# . . @1f&!",
            octave: 3
        },
        tempo: 120,
        tags: ["latin"]
    }, {
        value: "merengue-1",
        name: "Merengue",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: ". x! . x! . . x! . . . x! . . . x! ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s . . . 1f&s# . . . 1s . . . 1f&s# . . .",
            octave: 3
        },
        tempo: 120,
        tags: ["latin"]
    }, {
        value: "cumbia-1",
        name: "Cumbia",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: ". x!"
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1 . 2! 3!",
            octave: 3
        },
        tempo: 100,
        tags: ["latin"]
    }, {
        value: "reggaeton-1",
        name: "Reggaeton",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: ". . . x! . . x ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1 . 1f&# . 1 . 1f&# 1?",
            octave: 3
        },
        tempo: 100,
        tags: ["latin"]
    }, {
        value: "tango-1",
        name: "Tango",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: ". . . 1 2*! . 1 . . . . 1 2*! . 2*! ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1s . . 1f# 1+# . 1f# .",
            octave: 3
        },
        tempo: 120,
        sustain: "chord",
        tags: ["latin"]
    }, {
        value: "flamenco-1",
        name: "Flamenco 1",
        chord: {
            style: "arpeggio",
            step: [1, 6],
            arp: ". xs .",
            noteDuration: .3
        },
        bass: {
            style: "arpeggio",
            step: [1, 6],
            arp: "11f . 1+s",
            octave: 3,
            noteDuration: .3
        },
        tempo: 100,
        timeSignature: "6/8",
        tags: ["latin"]
    }, {
        value: "flamenco-2",
        name: "Flamenco 2",
        chord: {
            style: "arpeggio",
            step: [1, 12],
            arp: ". . 13 2 1s3s . . . 1m3 . 2s .",
            noteDuration: .3
        },
        bass: {
            style: "arpeggio",
            step: [1, 12],
            arp: "11f . . . . . 1s1fs . . . . .",
            octave: 3,
            noteDuration: .3
        },
        tempo: 100,
        timeSignature: "6/8",
        tags: ["latin"]
    }, {
        value: "flamenco-3",
        name: "Flamenco 3",
        chord: {
            style: "arpeggio",
            step: [1, 32],
            arp: ". . . . 1s 2s 3s 4s 1,2,3,4, . . . 1!2!3!4! . . . . . . . 1s . . . 2s3s4s . . . . . . .",
            numNotes: 3
        },
        bass: {
            style: "arpeggio",
            step: [1, 4],
            arp: "1s . 2s 3s",
            octave: 3
        },
        tempo: 100,
        tags: ["latin"]
    }, {
        value: "ragtime-1",
        name: "Ragtime",
        chord: {
            style: "offbeat"
        },
        bass: {
            style: "arpeggio",
            arp: "1 . 1f- . 1 . 1f- . 1 . 1f- . 1 . 1f- . 1 . 1f- . 1 . 1f- . 1 . 1f- . 1 . 1f- @1f&?",
            octave: 3,
            step: [1, 8]
        },
        tags: ["retro"]
    }, {
        value: "country-1",
        name: "Country 1",
        chord: {
            style: "backbeat"
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1s . . @2 3 . 2 3",
            octave: 3
        },
        shuffle: "2:1",
        sustain: "2-beats",
        tags: ["retro"]
    }, {
        value: "country-2",
        name: "Country 2",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: ". . 123 1 . 1 23 1"
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            arp: "1s . . . 1f . 1f> . 1s . . . 1f> . 1f .",
            octave: 3
        },
        shuffle: "2:1",
        sustain: "chord",
        tags: ["retro"]
    }, {
        value: "polyrhythm-1",
        name: "Polyrhythm",
        chord: {
            style: "arp-1-2",
            step: [1, 6],
            mirror: !0
        },
        bass: {
            style: "bass-5th-up",
            step: [1, 4],
            octave: 3
        },
        sustain: "chord",
        tempo: 80,
        timeSignature: "6/8"
    }, {
        value: "straddle-run-1",
        name: "Straddle run",
        chord: {
            style: "straddle-run-1",
            numNotes: 3
        },
        bass: {
            style: "once",
            double: !0
        },
        sustain: "chord"
    }, {
        value: "strumming-1",
        name: "Strumming 1",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "2*# . . 1m 2*m 1m @2*# . . 1m 2*m 1m 2*# . . ."
        },
        bass: {
            style: "once",
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "strumming-2",
        name: "Strumming 2",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "2*# . 2*m 1m 2*m . @2*# . 2*m 1m 2*m . 2*# . . ."
        },
        bass: {
            style: "once",
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "boogie-1",
        name: "Boogie",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: ". x! . . x . . . x . . @x! . . . ."
        },
        bass: {
            style: "bass-boogie-2",
            octave: 3
        },
        shuffle: "2:1",
        tags: ["retro"]
    }, {
        value: "funk-1",
        name: "Funk 1",
        chord: {
            style: "backbeat"
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s . . . . . @1<+! . 1+! . 1f<! 1f! . 1<+! 1+ ."
        },
        shuffle: "2:1",
        tags: ["retro"]
    }, {
        value: "funk-2",
        name: "Funk 2",
        chord: {
            style: "backbeat"
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s . . . . . @1f<! 1f! 1<+! . . 1+! . . @1s . . . . . . . . . 1+ . . . 1<+ . . ."
        },
        shuffle: "2:1",
        tags: ["retro"]
    }, {
        value: "funk-3",
        name: "Funk 3",
        chord: {
            style: "backbeat"
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s . . 1!m . . @1<+! . 1+! . . . . . . . 1! . . . . . @1<+! . 1+! . . 1!m . . 1<+! 1+"
        },
        shuffle: "2:1",
        tags: ["retro"]
    }, {
        value: "funk 4",
        name: "Funk 4",
        chord: {
            style: "backbeat"
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1s . . 1+! . 1ms! @1<+m! . 1+! . . . . . . . 1s . . 1+! . . . . . 1f<<+! 1f<+! 1f<<+! 1+! 1<+! 1f! 1f<!"
        },
        shuffle: "2:1",
        tags: ["retro"]
    }, {
        value: "funk 5",
        name: "Funk 5",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            arp: "xs . . @x! . . . . . . . . x! . . . xs . . @x! . . . . . . . . . . . ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 16],
            arp: "1 . . . . . . @1<+ 1+! 1<+ 1f! 1f<! . . @1< . 1 . . . . . . @1+! 1s . 1+! . 1<s . 1<+! ."
        },
        shuffle: "2:1",
        tags: ["retro"]
    }, {
        value: "melodic-1",
        name: "Melodic 1",
        chord: {
            style: "arpeggio",
            step: [1, 2],
            arp: ". xs"
        },
        bass: {
            style: "arpeggio",
            octave: 3,
            step: [1, 8],
            arp: "1 1f 2<<+ 2<+ 2+ 2<+ 2<<+ 1f 1 1f 2<<+ 2<+ 2+ . . 1f"
        },
        sustain: "chord"
    }, {
        value: "melodic-2",
        name: "Melodic 2",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            octaveOffset: 0,
            arp: ". 1 2 4 3+ 2 4 3+"
        },
        bass: {
            style: "pulse",
            step: [1, 1],
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "melodic-3",
        name: " Melodic 3",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            octaveOffset: 0,
            arp: ". 1 2 3 4 2 3 4 1 2 3 1 2 4 2 3"
        },
        bass: {
            style: "pulse",
            step: [1, 1],
            octave: 3
        },
        sustain: "chord",
        tempo: 80
    }, {
        value: "melodic-4",
        name: " Melodic 4",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: ". . . x . . x ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            octave: 3,
            arp: "1 1f 1+ . . 1f# . ."
        },
        sustain: "chord"
    }, {
        value: "melodic-5",
        name: " Melodic 5",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            octaveOffset: 0,
            arp: ". 1 2 3 4 3 2 1 . 1 2 3 4 2 3 1"
        },
        bass: {
            style: "pulse",
            step: [1, 1],
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "melodic-6",
        name: " Melodic 6",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            xoctaveOffset: 0,
            arp: "23 1 2 3 1 2 3 1 23 1 2 3> 1 2 3 1"
        },
        bass: {
            style: "once",
            octave: 3
        },
        sustain: "chord"
    }, {
        value: "melodic-7",
        name: " Melodic 7",
        chord: {
            style: "arpeggio",
            step: [1, 16],
            octave: 4,
            numNotes: 3,
            arp: "345 . 1 . 2 . @234 . . . . . 4<< 4< 4 . . . 234 . . . @23 . . . 21 . . . . ."
        },
        bass: {
            style: "arpeggio",
            step: [1, 8],
            octave: 3,
            arp: "1 . . 0# . . . . 1 . . 0# . . . 3"
        },
        sustain: "chord"
    }, {
        value: "melodic-8",
        name: " Melodic 8",
        chord: {
            style: "arpeggio",
            step: [1, 8],
            arp: "2 1 @2> 1 2>> 1 2>>> @2 1 2> 1 @2>> 1 2> 1 @2<"
        },
        bass: {
            style: "arpeggio",
            octave: 3,
            step: [1, 8],
            arp: "1 . . . . . . . 0# . . . . 1+ . 1+"
        },
        sustain: "chord"
    }, {
        value: "modulation-1",
        name: "Mod 1",
        chord: {
            style: "modulation-1"
        },
        bass: {
            style: "modulation-1"
        },
        tempo: 100,
        tags: ["mod"]
    }, {
        value: "modulation-2",
        name: "Mod 2",
        chord: {
            style: "modulation-2"
        },
        bass: {
            style: "modulation-2"
        },
        tempo: 100,
        tags: ["mod"]
    }, {
        value: "modulation-3",
        name: "Mod 3",
        chord: {
            style: "modulation-3"
        },
        bass: {
            style: "modulation-3"
        },
        tempo: 100,
        tags: ["mod"]
    }, {
        value: "modulation-4",
        name: "Mod 4",
        chord: {
            style: "modulation-4"
        },
        bass: {
            style: "modulation-4"
        },
        tempo: 100,
        tags: ["mod"]
    }])
      , eD = A([{
        value: "a",
        name: 'Pulse'
    }, {
        value: "b",
        name: "Boogie styles"
    }, {
        value: "c",
        name: 'Other'
    }, {
        value: "d",
        name: 'Rhythms'
    }, {
        value: "e",
        name: "Octaves"
    }, {
        value: "f",
        name: "Fifths"
    }, {
        value: "g",
        name: "Arpeggios"
    }, {
        value: "h",
        name: 'Splits'
    }, {
        value: "i",
        name: "Runs"
    }, {
        value: "j",
        name: "Durations"
    }, {
        value: "k",
        name: "Music styles"
    }, {
        value: "l",
        name: "Modulations"
    }])
      , ej = A([{
        value: "none",
        name: 'None',
        step: [1, 1],
        list: ".",
        shared: !0,
        global: !0,
        bassOption: !0
    }, {
        value: "once",
        name: 'Once',
        step: [1, 1],
        loop: !1,
        list: "xs",
        shared: !0,
        global: !0,
        bassOption: !0
    }, {
        value: "bar",
        name: 'Whole bar',
        step: [1, 1],
        list: "xs",
        shared: !0,
        global: !0
    }, {
        value: "half-bar",
        name: 'Half bar',
        step: [1, 2],
        list: "xs",
        shared: !0
    }, {
        value: "backbeat",
        name: 'Backbeat',
        step: [1, 4],
        list: ". x",
        shared: !0,
        styleGroup: "a"
    }, {
        value: "beat",
        name: 'Beat',
        list: "x",
        beatDiv: 1,
        shared: !0,
        global: !0,
        styleGroup: "a",
        bassOption: !0
    }, {
        value: "offbeat",
        name: 'Offbeat',
        beatDiv: 2,
        list: ". x",
        shared: !0,
        styleGroup: "a"
    }, {
        value: "pulse",
        name: 'Custom',
        list: "x",
        shared: !0,
        customStep: !0,
        styleGroup: "a"
    }, {
        value: "tresillo-1",
        name: "Tresillo",
        step: [1, 16],
        list: "x . . x . . x! .",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "bass-octave-tresillo",
        name: "Octave tresillo 1",
        list: "1 . . 1+s . . 1+ .",
        step: [1, 16],
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        deprecated: !0
    }, {
        value: "tresillo-2",
        name: 'Tresillo slow',
        step: [1, 8],
        list: "x . . @x . . x! .",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "cinquillo",
        name: "Cinquillo",
        step: [1, 8],
        list: "x . x! @x . x! x .",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "habanera",
        name: "Habanera",
        step: [1, 8],
        list: "x . . x! x . x .",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "son-clave-3-2",
        name: "Son clave 3-2",
        step: [1, 16],
        cropLength: 1,
        list: "x . . x . . @x . . . x . x . . .",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "son-clave-2-3",
        name: "Son clave 2-3",
        step: [1, 16],
        cropLength: 1,
        list: ". . x . x . . . x . . x . . x .",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "bossa-nova-clave-3-2",
        name: "Bossa Nova clave 3-2",
        step: [1, 16],
        cropLength: 1,
        list: "x . . x . . @x . . . x . . x . .",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "bossa-nova-clave-2-3",
        name: "Bossa Nova clave 2-3",
        step: [1, 16],
        cropLength: 1,
        list: ". . x . . x . . x . . x . . x .",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "dotted-eight",
        name: "3/16",
        step: [1, 16],
        cropLength: 1,
        list: "x . . x . . @x . . x . . x . . x",
        shared: !0,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "d",
        bassOption: !0
    }, {
        value: "split-13-2",
        name: "Split 13-2",
        list: "13 2",
        customStep: !0,
        styleGroup: "h"
    }, {
        value: "split-23-1",
        name: "Split 23-1",
        list: "23 1",
        customStep: !0,
        styleGroup: "h"
    }, {
        value: "arp-1-2",
        name: "Arp 1-2",
        list: "1 2",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-x-1-2",
        name: "Arp x-1-2",
        list: ". 1 2",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-2-3",
        name: "Arp 1-2-3",
        list: "1 2 3",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-3-2",
        name: "Arp 1-3-2",
        list: "1 3 2",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-x-1-2-1",
        name: "Arp x-1-2-1",
        list: ". 1 2 1",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-x-1-2-3",
        name: "Arp x-1-2-3",
        list: ". 1 2 3",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-2-3-2",
        name: "Arp 1-2-3-2",
        list: "1 2 3 2",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-2-3-4",
        name: "Arp 1-2-3-4",
        list: "1 2 3 4",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-2-4-3",
        name: "Arp 1-2-4-3",
        list: "1 2 4 3",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-3-2-3",
        name: "Arp 1-3-2-3",
        list: "1 3 2 3",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-3-2-4",
        name: "Arp 1-3-2-4",
        list: "1 3 2 4",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-4-3-2",
        name: "Arp 1-4-3-2",
        list: "1 4 3 2",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-2-1-2-3",
        name: "Arp 2-1-2-3",
        list: "2 1 2 3",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-2-3-4-3-2",
        name: "Arp 1-2-3-4-3-2",
        list: "1 2 3 4 3 2",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-2-3-1-2-4",
        name: "Arp 1-2-3-1-2-4",
        list: "1 2 3 1 2 4",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-2-3-2-3-2",
        name: "Arp 1-2-3-2-3-2",
        list: "1 2 3 2 3 2",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-3-2-3-4-3",
        name: "Arp 1-3-2-3-4-3",
        list: "1 3 2 3 4 3",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-2-1-2-3-4-3",
        name: "Arp 2-1-2-3-4-3",
        list: "2 1 2 3 4 3",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "arp-1-3-2-3-4-3-2-3",
        name: "Arp 1-3-2-3-4-3-2-3",
        list: "1 3 2 3 4 3 2 3",
        customStep: !0,
        canMirror: !0,
        styleGroup: "g"
    }, {
        value: "simple-run-1",
        name: "Simple run",
        step: [1, 8],
        list: "1 2 3 4 5 6 7 8 9 8 7 6 5 4 3 2",
        cropLength: 0,
        customStep: !0,
        canMirror: !0,
        styleGroup: "i",
        timeSignature: "4/4"
    }, {
        value: "simple-run-2",
        name: "Simple run",
        step: [1, 12],
        list: "1 2 3 4 5 6 7 6 5 4 3 2",
        cropLength: 0,
        customStep: !0,
        canMirror: !0,
        styleGroup: "i",
        timeSignature: "6/8"
    }, {
        value: "zig-zag-run-1",
        name: "Zig-zag run",
        step: [1, 8],
        list: "1 3 2 4 3 5 4 6 5 7 4 6 3 5 2 4",
        cropLength: 0,
        customStep: !0,
        canMirror: !0,
        styleGroup: "i",
        timeSignature: "4/4"
    }, {
        value: "zig-zag-run-2",
        name: "Zig-zag run",
        step: [1, 12],
        list: "1 3 2 4 3 5 4 6 3 5 2 4",
        cropLength: 0,
        customStep: !0,
        canMirror: !0,
        styleGroup: "i",
        timeSignature: "6/8"
    }, {
        value: "straddle-run-1",
        name: "Straddle run",
        step: [1, 8],
        list: "13 2 24 3 35 4 46 5 57 6 46 5 35 4 24 3",
        cropLength: 0,
        customStep: !0,
        canMirror: !0,
        styleGroup: "i",
        timeSignature: "4/4"
    }, {
        value: "misc-run-1",
        name: "Misc run",
        step: [1, 16],
        list: "1 2 4 2 3 5 3 4 6 4 5 7 3 4 6 3",
        cropLength: 0,
        customStep: !0,
        canMirror: !0,
        styleGroup: "i",
        timeSignature: "4/4"
    }, {
        value: "straddle-run-2",
        name: "Straddle run",
        step: [1, 12],
        list: "13 2 24 3 35 4 46 5 35 4 24 3",
        cropLength: 0,
        customStep: !0,
        canMirror: !0,
        styleGroup: "i",
        timeSignature: "6/8"
    }, {
        value: "bass-octave-1",
        name: "Bass octave 1",
        list: "1 1+",
        customStep: !0,
        styleGroup: "e",
        bassOption: !0
    }, {
        value: "bass-octave-2",
        name: "Bass octave 2",
        list: "1 . 1+ 1+",
        step: [1, 16],
        styleGroup: "e"
    }, {
        value: "bass-octave-3",
        name: "Bass octave 3",
        list: "1 . 1+ . 1 . 1+ . 1 . 1+ . 1 . 1<+ 1+ 1 . 1+ . 1 . 1+ . 1 . 1+ . 1 . 1<+ 1+ 1 . 1+ . 1 . 1+ . 1 . 1+ . 1 . 1<+ 1+ 1 . 1+ . 1 . 1+ . 1 . 1+ . 1 . 1>+ 1+",
        step: [1, 16],
        styleGroup: "e"
    }, {
        value: "bass-octave-4",
        name: "Bass octave 4",
        list: "1 1+ 1+ 1 1+ 1+ 1 1+",
        step: [1, 8],
        styleGroup: "e"
    }, {
        value: "bass-octave-5",
        name: "Bass octave 5",
        list: "1s . . . . 1+ 1 .",
        step: [1, 8],
        styleGroup: "e"
    }, {
        value: "bass-5th-up",
        name: "Bass 5th up",
        list: "1s 1fs#",
        step: [1, 4],
        customStep: !0,
        sustain: !1,
        styleGroup: "f"
    }, {
        value: "bass-5th-down",
        name: "Bass 5th down",
        list: "1s 1f-s#",
        step: [1, 4],
        customStep: !0,
        sustain: !1,
        styleGroup: "f"
    }, {
        value: "bass-5th-pong",
        name: "Bass 5th pong",
        list: "1s 1fs# 1+s# 1fs#",
        step: [1, 4],
        customStep: !0,
        sustain: !1,
        styleGroup: "f"
    }, {
        value: "bass-5th-tresillo",
        name: "Bass 5th tresillo",
        step: [1, 16],
        resetStep: !0,
        customStep: !0,
        list: "1 . . 1f!# . . 1f!# .",
        sustain: !1,
        shuffle: "1:1",
        timeSignature: "4/4",
        styleGroup: "f"
    }, {
        value: "modulation-1",
        name: "Mod 1",
        step: [1, 16],
        list: "0s#(volume=1) 0(volume=0.5)",
        styleGroup: "l",
        shared: !0
    }, {
        value: "modulation-2",
        name: "Mod 2",
        step: [1, 32],
        list: "0s#(volume=1) 0(volume=0.5)",
        styleGroup: "l",
        shared: !0
    }, {
        value: "modulation-3",
        name: "Mod 3",
        step: [1, 16],
        list: "0s#(volume=0.5) 0(volume=0) 0(volume=1) 0(volume=0)",
        styleGroup: "l",
        shared: !0
    }, {
        value: "modulation-4",
        name: "Mod 4",
        step: [1, 32],
        list: "0s#(pitch=-0.1) 0s#(pitch=0.1) 0s#(pitch=-0.2) 0s#(pitch=-0.2) 0s#(pitch=-0.3) 0s#(pitch=-0.3)",
        styleGroup: "l",
        shared: !0
    }, {
        value: "bass-reggae-1",
        name: "Bass reggae",
        step: [1, 16],
        list: "1 1 . . . 1+! . .",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "bass-salsa-1",
        name: "Bass salsa",
        step: [1, 16],
        list: "1s . . @1f&s# . . @1s . . . . @1f&s# . . @1s . . . . @1f&s# . . @1s . . . . @1f&s# . . . .",
        sustain: !1,
        shuffle: "1:1",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "bass-bossa-nova-1",
        name: "Bass bossa nova 1",
        step: [1, 8],
        list: "1s . . 1 1fs# . . @1s . . . 1 1fs# . . @1f- 1s . . 1 1fs# . . @1s . . . 1 1fs# . @1\\\\ 1\\",
        sustain: !1,
        shuffle: "1:1",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "bass-bossa-nova-2",
        name: "Bass bossa nova 2",
        step: [1, 16],
        list: "1! . . . . . 1f! . 1fs# . . . . . @1s . . . 1!m . . . 1 . 1+! . 1<+! . 1f! . 1f<! .",
        sustain: !1,
        shuffle: "1:1",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "bass-tango-1",
        name: "Bass tango",
        step: [1, 8],
        list: "1s . . 1f# 1+# . 1f# .",
        sustain: !1,
        shuffle: "1:1",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "bass-boogie-1",
        name: "Bass boogie 1",
        step: [1, 8],
        list: "1 1 1>> 1>> 1>>>> 1>>>> 1>>>>> 1>>>>",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b"
    }, {
        value: "bass-boogie-2",
        name: "Bass boogie 2",
        step: [1, 8],
        list: "1 1+ 1>> 1+ 1>>>> 1+ 1>>>>> 1>>>>",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b"
    }, {
        value: "bass-boogie-3",
        name: "Bass boogie 3",
        step: [1, 8],
        list: "11f 11f 11f> 11f>",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b"
    }, {
        value: "bass-boogie-4",
        name: "Bass boogie 4",
        step: [1, 8],
        list: "11f 11f 1>>\\ 1>>",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b"
    }, {
        value: "bass-boogie-5",
        name: "Bass boogie 5",
        step: [1, 8],
        list: "1 1 1>>\\ 1>> 1>>>> 1 1>>>>> 1>>>>",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b"
    }, {
        value: "bass-boogie-6",
        name: "Bass boogie 6",
        step: [1, 8],
        list: "1 1f 11f> 1f 11f>> 1f 11f> 1f",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b"
    }, {
        value: "bass-funk-1",
        name: "Bass funk 1",
        step: [1, 16],
        list: "1s . . . . . @1<+! . 1+! . 1f<! 1f! . 1<+! 1+ .",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "bass-funk-2",
        name: "Bass funk 2",
        step: [1, 16],
        list: "1s . . . . . @1f<! 1f! 1<+ . . 1+! . . @1s . . . . . . . . . 1+ . . . 1<+ . . .",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "bass-funk-3",
        name: "Bass funk 3",
        step: [1, 16],
        list: "1s . . 1!m . . @1<+! . 1+! . . . . . . . 1! . . . . . @1<+! . 1+! . . 1!m . . 1<+! 1+",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "bass-funk-4",
        name: "Bass funk 4",
        step: [1, 16],
        list: "1s . . 1+! . 1ms! @1<+m! . 1+! . . . . . . . 1s . . 1+! . . . . . 1f<<+! 1f<+! 1f<<+! 1+! 1<+! 1f! 1f<!",
        sustain: !1,
        shuffle: "2:1",
        styleGroup: "b",
        deprecated: !0
    }, {
        value: "waltz-1",
        name: "Waltz 1",
        step: [1, 3],
        timeSignature: "3/4",
        list: ". x x",
        styleGroup: "k"
    }, {
        value: "waltz-2",
        name: "Waltz 2",
        step: [1, 6],
        timeSignature: "3/4",
        list: ". . x . x . . . x x x .",
        styleGroup: "k"
    }, {
        value: "waltz-3",
        name: "Waltz 3",
        step: [1, 6],
        timeSignature: "3/4",
        list: ". 1 2* . 2* . . . 2* 1 2* .",
        styleGroup: "k"
    }, {
        value: "arpeggio",
        name: 'Custom sequence',
        customStep: !0,
        arp: !0,
        shared: !0,
        canMirror: !0,
        styleGroup: "c"
    }])
      , eG = [];
    "C C# Db D D# Eb E F F# Gb G G# Ab A A# Bb B".split(" ").forEach(function(e) {
        eG.push({
            value: e,
            name: e
        })
    }),
    eG = A(eG);
    for (var eB = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"], eR = [130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94], eV = [], eH = 0; eH < 128; eH++) {
        var e8 = eH + 9
          , eK = eR[e8 % 12] * Math.pow(2, Math.floor(e8 / 12) - 2);
        eV.push(eK / 1760)
    }
    var eF = [1, 3, -1, 6, 8, 10, -1]
      , eU = [0, 2, 4, 5, 7, 9, 11]
      , ez = [0, 2, 3, 5, 7, 8, 11]
      , e9 = [0, 2, 3, 5, 7, 9, 11]
      , eY = [0, 2, 4, 5, 7, 8, 11]
      , eQ = [0, 1, 4, 5, 7, 8, 11]
      , eW = [0, 1, 3, 5, 7, 9, 11]
      , eZ = [0, 1, 3, 5, 7, 8, 11]
      , eX = function(e, t) {
        for (var o = [], n = 0; n < e.length; n++) {
            var s = e[(t + n) % e.length] - e[t];
            o.push(s >= 0 ? s : s + 12)
        }
        return o
    }
      , eJ = A([{
        value: "pentatonic",
        steps: [0, 2, 4, 7, 9]
    }, {
        value: "blues",
        steps: [0, 2, 3, 4, 7, 9],
        special: 3
    }, ])
      , te = A([{
        value: "ionian",
        name: 'Major',
        modeName: 'Ionian' + " (" + 'Major'.toLowerCase() + ")",
        offset: 0,
        steps: eX(eU, 0),
        scaleGroup: "a",
        primary: !0
    }, {
        value: "dorian",
        name: 'Dorian',
        offset: 1,
        steps: eX(eU, 1),
        scaleGroup: "a",
        charPitches: [9]
    }, {
        value: "phrygian",
        name: 'Phrygian',
        offset: 2,
        steps: eX(eU, 2),
        scaleGroup: "a",
        charPitches: [1]
    }, {
        value: "lydian",
        name: 'Lydian',
        offset: 3,
        steps: eX(eU, 3),
        scaleGroup: "a",
        charPitches: [6]
    }, {
        value: "mixolydian",
        name: 'Mixolydian',
        offset: 4,
        steps: eX(eU, 4),
        scaleGroup: "a",
        charPitches: [10]
    }, {
        value: "aeolian",
        name: 'Minor',
        modeName: 'Aeolian' + " (" + 'Minor'.toLowerCase() + ")",
        offset: 5,
        steps: eX(eU, 5),
        scaleGroup: "a",
        primary: !0
    }, {
        value: "locrian",
        name: 'Locrian',
        offset: 6,
        steps: eX(eU, 6),
        scaleGroup: "a",
        charPitches: [1, 6]
    }, {
        value: "ionian-b6",
        name: 'Harmonic major',
        modeName: 'Harmonic major',
        shortName: 'H-Major',
        offset: 0,
        steps: eX(eY, 0),
        scaleGroup: "d",
        primary: !0
    }, {
        value: "dorian-b5",
        name: 'Dorian' + " b5",
        offset: 1,
        steps: eX(eY, 1),
        scaleGroup: "d"
    }, {
        value: "phrygian-b4",
        name: 'Phrygian' + " b4",
        offset: 2,
        steps: eX(eY, 2),
        scaleGroup: "d"
    }, {
        value: "lydian-b3",
        name: 'Lydian' + " b3",
        offset: 3,
        steps: eX(eY, 3),
        scaleGroup: "d"
    }, {
        value: "mixolydian-b2",
        name: 'Mixolydian' + " b2",
        offset: 4,
        steps: eX(eY, 4),
        scaleGroup: "d"
    }, {
        value: "aeolian-b1",
        name: 'Lydian' + " #2 #5",
        offset: 5,
        steps: eX(eY, 5),
        scaleGroup: "d"
    }, {
        value: "locrian-b7",
        name: 'Locrian' + " bb7",
        offset: 6,
        steps: eX(eY, 6),
        scaleGroup: "d"
    }, {
        value: "aeolian-#7",
        name: 'Harmonic minor',
        modeName: 'Harmonic minor',
        shortName: 'H-Minor',
        offset: 0,
        steps: eX(ez, 0),
        scaleGroup: "b",
        primary: !0
    }, {
        value: "locrian-#6",
        name: 'Locrian' + " #6",
        offset: 1,
        steps: eX(ez, 1),
        scaleGroup: "b"
    }, {
        value: "ionian-#5",
        name: 'Major' + " #5",
        offset: 2,
        steps: eX(ez, 2),
        scaleGroup: "b"
    }, {
        value: "dorian-#4",
        name: 'Dorian' + " #4",
        offset: 3,
        steps: eX(ez, 3),
        scaleGroup: "b"
    }, {
        value: "phrygian-#3",
        name: 'Phrygian' + " " + 'Dominant',
        offset: 4,
        steps: eX(ez, 4),
        scaleGroup: "b"
    }, {
        value: "lydian-#2",
        name: 'Lydian' + " #2",
        offset: 5,
        steps: eX(ez, 5),
        scaleGroup: "b"
    }, {
        value: "mixolydian-#1",
        name: 'Super-Locrian' + " bb7",
        offset: 6,
        steps: eX(ez, 6),
        scaleGroup: "b"
    }, {
        value: "dorian-#7",
        name: 'Melodic minor',
        modeName: 'Melodic minor',
        shortName: 'M-Minor',
        offset: 0,
        steps: eX(e9, 0),
        scaleGroup: "c",
        primary: !0
    }, {
        value: "phrygian-#6",
        name: 'Dorian' + " b9",
        offset: 1,
        steps: eX(e9, 1),
        scaleGroup: "c"
    }, {
        value: "lydian-#5",
        name: 'Lydian' + " #5",
        offset: 2,
        steps: eX(e9, 2),
        scaleGroup: "c"
    }, {
        value: "mixolydian-#4",
        name: 'Lydian' + " " + 'Dominant',
        offset: 3,
        steps: eX(e9, 3),
        scaleGroup: "c"
    }, {
        value: "aeolian-#3",
        name: 'Mixolydian' + " b6",
        offset: 4,
        steps: eX(e9, 4),
        scaleGroup: "c"
    }, {
        value: "locrian-#2",
        name: 'Locrian' + " #2",
        offset: 5,
        steps: eX(e9, 5),
        scaleGroup: "c"
    }, {
        value: "ionian-#1",
        name: 'Super-Locrian',
        offset: 6,
        steps: eX(e9, 6),
        scaleGroup: "c"
    }, {
        value: "double-harmonic-major",
        name: 'Double harmonic major',
        modeName: 'Double harmonic major',
        shortName: 'D-H-Major',
        offset: 0,
        steps: eX(eQ, 0),
        scaleGroup: "f",
        primary: !0
    }, {
        value: "lydian-#2-#6",
        name: 'Lydian' + " #2 #6",
        offset: 1,
        steps: eX(eQ, 1),
        scaleGroup: "f"
    }, {
        value: "ultraphrygian",
        name: 'Ultra-Phrygian',
        offset: 2,
        steps: eX(eQ, 2),
        scaleGroup: "f"
    }, {
        value: "hungarian-minor",
        name: 'Hungarian minor',
        offset: 3,
        steps: eX(eQ, 3),
        scaleGroup: "f"
    }, {
        value: "oriental",
        name: 'Oriental',
        offset: 4,
        steps: eX(eQ, 4),
        scaleGroup: "f"
    }, {
        value: "ionian-#2-#5",
        name: 'Ionian' + " #2 #5",
        offset: 5,
        steps: eX(eQ, 5),
        scaleGroup: "f"
    }, {
        value: "locrian-bb3-bb7",
        name: 'Locrian' + " bb3 bb7",
        offset: 6,
        steps: eX(eQ, 6),
        scaleGroup: "f"
    }, {
        value: "neapolitan-major",
        name: 'Neapolitan major',
        modeName: 'Neapolitan major',
        offset: 0,
        steps: eX(eW, 0),
        scaleGroup: "g",
        primary: !0
    }, {
        value: "leading-whole-tone",
        name: 'Leading whole-tone',
        offset: 1,
        steps: eX(eW, 1),
        scaleGroup: "g"
    }, {
        value: "lydian-augmented-dominant",
        name: 'Lydian' + " " + 'Dominant' + " #5 ",
        offset: 2,
        steps: eX(eW, 2),
        scaleGroup: "g"
    }, {
        value: "lydian-dominant-b6",
        name: 'Lydian' + " " + 'Dominant' + " b6",
        offset: 3,
        steps: eX(eW, 3),
        scaleGroup: "g"
    }, {
        value: "major-locrian",
        name: 'Major locrian',
        offset: 4,
        steps: eX(eW, 4),
        scaleGroup: "g"
    }, {
        value: "semilocrian-b4",
        name: 'Semi-Locrian' + " b4",
        offset: 5,
        steps: eX(eW, 5),
        scaleGroup: "g"
    }, {
        value: "superlocrian-bb3",
        name: 'Super-Locrian' + " bb3",
        offset: 6,
        steps: eX(eW, 6),
        scaleGroup: "g"
    }, {
        value: "neapolitan-minor",
        name: 'Neapolitan minor',
        modeName: 'Neapolitan minor',
        offset: 0,
        steps: eX(eZ, 0),
        scaleGroup: "h",
        primary: !0
    }, {
        value: "lydian-#6",
        name: 'Lydian' + " #6",
        offset: 1,
        steps: eX(eZ, 1),
        scaleGroup: "h"
    }, {
        value: "Mixolydian-augmented",
        name: 'Mixolydian' + " #5",
        offset: 2,
        steps: eX(eZ, 2),
        scaleGroup: "h"
    }, {
        value: "Hungarian-gypsy",
        name: 'Aeolian' + " #4",
        offset: 3,
        steps: eX(eZ, 3),
        scaleGroup: "h"
    }, {
        value: "Locrian-dominant",
        name: 'Locrian' + " " + 'Dominant',
        offset: 4,
        steps: eX(eZ, 4),
        scaleGroup: "h"
    }, {
        value: "ionian-#2",
        name: 'Ionian' + " #2",
        offset: 5,
        steps: eX(eZ, 5),
        scaleGroup: "h"
    }, {
        value: "ultralocrian-bb3",
        name: 'Ultra-Locrian' + " bb3",
        offset: 6,
        steps: eX(eZ, 6),
        scaleGroup: "h"
    }, {
        value: "augmented",
        name: 'Augmented',
        steps: [0, 3, 4, 7, 8, 11],
        scaleGroup: "e",
        offset: 0
    }, {
        value: "whole-tone",
        name: 'Whole-tone',
        steps: [0, 2, 4, 6, 8, 10],
        scaleGroup: "e",
        offset: 0
    }, ]);
    te.get = function(e) {
        var t = this[e];
        if (!t)
            throw "Unknown scale " + e;
        return t
    }
    ;
    var tt = A([{
        value: "a",
        name: 'Modern Western',
        steps: [0, 2, 4, 5, 7, 9, 11]
    }, {
        value: "b",
        name: 'Harmonic minor',
        pentaAlt: 5,
        steps: [0, 2, 3, 5, 7, 8, 11]
    }, {
        value: "c",
        name: 'Melodic minor',
        steps: [0, 2, 3, 5, 7, 9, 11]
    }, {
        value: "d",
        name: 'Harmonic major',
        steps: [0, 2, 4, 5, 7, 8, 11]
    }, {
        value: "f",
        name: 'Double harmonic major',
        steps: [0, 1, 4, 5, 7, 8, 11],
        unusual: !0
    }, {
        value: "g",
        name: 'Neapolitan major',
        steps: [0, 1, 3, 5, 7, 9, 11],
        unusual: !0
    }, {
        value: "h",
        name: 'Neapolitan minor',
        steps: [0, 1, 3, 5, 7, 8, 11],
        unusual: !0
    }, {
        value: "e",
        name: 'Other'
    }])
      , to = [];
    tt.forEach(function(e) {
        to[e.value] = []
    }),
    te.forEach(function(e) {
        void 0 != e.offset && (to[e.scaleGroup][e.offset] = e.value)
    });
    var tn = A([{
        value: "diatonic-power",
        name: "5",
        chords: ["power"],
        suffix: "5"
    }, {
        value: "diatonic-sus2",
        name: "Sus2",
        chords: ["sus2", "susb2"],
        mirror: "diatonic-sus4",
        suffix: "sus2",
        default: !0
    }, {
        value: "diatonic-triad",
        name: 'Triad',
        chords: ["maj", "min", "dim", "aug", "majb5"],
        suffix: "",
        default: !0
    }, {
        value: "diatonic-sus4",
        name: "Sus4",
        chords: ["sus4", "sus#4"],
        mirror: "diatonic-sus2",
        suffix: "sus4",
        default: !0
    }, {
        value: "diatonic-sus24",
        name: "Sus24",
        chords: ["sus24", "susb24", "sus2#4", "susb2#4"],
        suffix: "sus24"
    }, {
        value: "diatonic-6",
        name: "6",
        chords: ["maj6", "min6", "minb6", "aug6"],
        mirror: "diatonic-7",
        suffix: "6"
    }, {
        value: "diatonic-7sus2",
        name: "7sus2",
        chords: ["dom7sus2", "dom7susb2", "maj7sus2", "maj7susb2"],
        suffix: "7sus2"
    }, {
        value: "diatonic-7",
        name: "7",
        chords: ["dom7", "min7", "maj7", "min7b5", "minmaj7", "maj7#5", "dim7", "dom7b5"],
        mirror: "diatonic-6",
        suffix: "7",
        default: !0
    }, {
        value: "diatonic-7sus4",
        name: "7sus4",
        chords: ["dom7sus4", "dom7susb2", "maj7sus4", "maj7sus#4"],
        suffix: "7sus4"
    }, {
        value: "diatonic-9",
        name: "9",
        chords: ["dom9", "min9", "maj9", "minmaj9", "dim9", "dom9#5", "min9b5", "min7b9", "dom7b9", "maj7b9", "maj7#9", "maj7#5#9", "maj9#5", "dim7b9", "min7b5b9"],
        suffix: "9"
    }, {
        value: "diatonic-11",
        name: "11",
        chords: ["dom11", "min11", "maj11", "min11b9", "maj9#11", "min11b5b9", "min11b5", "dom11b9", "dim11b9", "minmaj11", "minmaj9#11", "maj7#5#9#11", "dom11b9", "maj11#5", "min9#11", "maj7#9#11", "maj9#5#11", "dom9#11"],
        suffix: "11"
    }, {
        value: "diatonic-add2",
        name: "Add2",
        longName: "Add2/Add9",
        chords: ["majadd2", "minadd2", "majaddb2", "minaddb2"],
        mirror: "diatonic-add4",
        suffix: "add2"
    }, {
        value: "diatonic-add4",
        name: "Add4",
        longName: "Add4/Add11",
        chords: ["majadd4", "minadd4", "majadd#4", "minadd#4"],
        mirror: "diatonic-add2",
        suffix: "add4"
    }])
      , ts = A([{
        value: "studio",
        name: "Studio"
    }, {
        value: "chamber",
        name: "Chamber"
    }, {
        value: "gated",
        name: "Gated"
    }, {
        value: "plate",
        name: "Plate"
    }, {
        value: "hall",
        name: "Hall"
    }, {
        value: "church",
        name: "Church"
    }])
      , ta = [{
        name: "maj",
        suffix: "",
        positions: [0, 4, 7]
    }, {
        name: "min",
        suffix: "m",
        positions: [0, 3, 7]
    }, {
        name: "dim",
        suffix: "dim",
        alt: "\xb0",
        positions: [0, 3, 6]
    }, {
        name: "dim7",
        suffix: "dim7",
        alt: "\xb07",
        positions: [0, 3, 6, 9]
    }, {
        name: "min7b5",
        suffix: "m7b5",
        suffix2: "halfdim",
        alt: "\xf87",
        otherName: "Half-diminished 7th",
        positions: [0, 3, 6, 10]
    }, {
        name: "min7b5b9",
        suffix: "m7b5b9",
        alt: "\xf89",
        otherName: "Half-diminished 9th",
        positions: [0, 3, 6, 10, 13]
    }, {
        name: "aug",
        suffix: "aug",
        alt: "#5",
        positions: [0, 4, 8]
    }, {
        name: "aug6",
        suffix: "aug6",
        alt: "#6",
        positions: [0, 4, 8, 10]
    }, {
        name: "maj7#5",
        suffix: "maj7#5",
        positions: [0, 4, 8, 11]
    }, {
        name: "maj9#5",
        suffix: "maj9#5",
        positions: [0, 4, 8, 11, 14]
    }, {
        name: "power",
        suffix: "5",
        positions: [0, 7]
    }, {
        name: "majb5",
        suffix: "(b5)",
        positions: [0, 4, 6]
    }, {
        name: "dom7",
        suffix: "7",
        positions: [0, 4, 7, 10]
    }, {
        name: "dom7add6",
        suffix: "7/6",
        positions: [0, 4, 7, 9, 10]
    }, {
        name: "min7",
        suffix: "m7",
        positions: [0, 3, 7, 10]
    }, {
        name: "min7add4",
        suffix: "m7/4",
        positions: [0, 3, 5, 7, 10]
    }, {
        name: "min7add6",
        suffix: "m7/6",
        positions: [0, 3, 7, 9, 10]
    }, {
        name: "maj7",
        suffix: "maj7",
        alt: "Δ7",
        positions: [0, 4, 7, 11]
    }, {
        name: "maj7add6",
        suffix: "maj7/6",
        positions: [0, 4, 7, 9, 11]
    }, {
        name: "minmaj7",
        suffix: "mmaj7",
        positions: [0, 3, 7, 11]
    }, {
        name: "minmaj7b9",
        suffix: "mmaj7b9",
        positions: [0, 3, 7, 11, 13]
    }, {
        name: "maj7sus2",
        suffix: "maj7sus2",
        positions: [0, 2, 7, 11]
    }, {
        name: "maj7sus4",
        suffix: "maj7sus4",
        positions: [0, 5, 7, 11]
    }, {
        name: "maj7b5",
        suffix: "maj7b5",
        positions: [0, 4, 6, 11]
    }, {
        name: "maj7b9",
        suffix: "maj7b9",
        positions: [0, 4, 7, 11, 13]
    }, {
        name: "maj7#11",
        suffix: "maj7#11",
        positions: [0, 4, 7, 11, 18]
    }, {
        name: "dom7b5",
        suffix: "7b5",
        positions: [0, 4, 6, 10]
    }, {
        name: "dom7#5",
        suffix: "7#5",
        positions: [0, 4, 8, 10]
    }, {
        name: "dom7#5b9",
        suffix: "7#5b9",
        suffix2: "7b9b13",
        positions: [0, 4, 8, 10, 13]
    }, {
        name: "dom7#5#9",
        suffix: "7#5#9",
        suffix2: "7#9b13",
        positions: [0, 4, 8, 10, 15]
    }, {
        name: "maj6",
        suffix: "6",
        positions: [0, 4, 7, 9]
    }, {
        name: "min6",
        suffix: "m6",
        positions: [0, 3, 7, 9]
    }, {
        name: "6sus2",
        suffix: "6sus2",
        positions: [0, 2, 7, 9]
    }, {
        name: "6sus4",
        suffix: "6sus4",
        positions: [0, 5, 7, 9]
    }, {
        name: "minb6",
        suffix: "mb6",
        positions: [0, 3, 7, 8]
    }, {
        name: "maj6add9",
        suffix: "6/9",
        positions: [0, 4, 7, 9, 14]
    }, {
        name: "6add9sus4",
        suffix: "6/9sus4",
        positions: [0, 5, 7, 9, 14]
    }, {
        name: "maj6add11",
        suffix: "6/11",
        positions: [0, 4, 7, 9, 17]
    }, {
        name: "min6add9",
        suffix: "m6/9",
        positions: [0, 3, 7, 9, 14]
    }, {
        name: "min6add11",
        suffix: "m6/11",
        positions: [0, 3, 7, 9, 17]
    }, {
        name: "dom9",
        suffix: "9",
        positions: [0, 4, 7, 10, 14]
    }, {
        name: "dom9sus4",
        suffix: "9sus4",
        positions: [0, 5, 7, 10, 14]
    }, {
        name: "dom9b5",
        suffix: "9b5",
        positions: [0, 4, 6, 10, 14]
    }, {
        name: "dom9#5",
        suffix: "9#5",
        positions: [0, 4, 8, 10, 14]
    }, {
        name: "min9",
        suffix: "m9",
        positions: [0, 3, 7, 10, 14]
    }, {
        name: "maj9",
        suffix: "maj9",
        positions: [0, 4, 7, 11, 14]
    }, {
        name: "maj9#11",
        suffix: "maj9#11",
        positions: [0, 4, 7, 11, 14, 18]
    }, {
        name: "dom7b9",
        suffix: "7b9",
        positions: [0, 4, 7, 10, 13]
    }, {
        name: "dom7#9",
        suffix: "7#9",
        positions: [0, 4, 7, 10, 15]
    }, {
        name: "dom7#11",
        suffix: "7#11",
        positions: [0, 4, 7, 10, 18]
    }, {
        name: "dom7b5b9",
        suffix: "7b5b9",
        positions: [0, 4, 6, 10, 13]
    }, {
        name: "dom7b5#9",
        suffix: "7b5#9",
        positions: [0, 4, 6, 10, 15]
    }, {
        name: "min7b9",
        suffix: "m7b9",
        positions: [0, 3, 7, 10, 13]
    }, {
        name: "dim7b9",
        suffix: "dim7b9",
        alt: "\xb07b9",
        positions: [0, 3, 6, 9, 13]
    }, {
        name: "maj7#9",
        suffix: "maj7#9",
        positions: [0, 4, 7, 11, 15]
    }, {
        name: "minmaj9",
        suffix: "mmaj9",
        positions: [0, 3, 7, 11, 14]
    }, {
        name: "dim9",
        suffix: "dim9",
        alt: "\xb09",
        positions: [0, 3, 6, 9, 14]
    }, {
        name: "min9b5",
        suffix: "m9b5",
        alt: "\xf89",
        otherName: "Half-diminished 9th",
        positions: [0, 3, 6, 10, 14]
    }, {
        name: "dom13sus4",
        suffix: "13sus4",
        positions: [0, 7, 10, 14, 17, 21]
    }, {
        name: "dom11",
        suffix: "11",
        positions: [0, 4, 7, 10, 14, 17]
    }, {
        name: "dom11b9",
        suffix: "11b9",
        positions: [0, 4, 7, 10, 13, 17]
    }, {
        name: "maj11",
        suffix: "maj11",
        positions: [0, 4, 7, 11, 14, 17]
    }, {
        name: "min11",
        suffix: "m11",
        positions: [0, 3, 7, 10, 14, 17]
    }, {
        name: "dom13",
        suffix: "13",
        positions: [0, 4, 7, 10, 14, 17, 21]
    }, {
        name: "min13",
        suffix: "m13",
        positions: [0, 3, 7, 10, 14, 17, 21]
    }, {
        name: "dom13#11",
        suffix: "13#11",
        positions: [0, 4, 7, 10, 14, 18, 21]
    }, {
        name: "maj13",
        suffix: "maj13",
        positions: [0, 4, 7, 11, 14, 17, 21]
    }, {
        name: "maj13#11",
        suffix: "maj13#11",
        positions: [0, 4, 7, 11, 14, 18, 21]
    }, {
        name: "dom13b9",
        suffix: "13b9",
        positions: [0, 4, 7, 10, 13, 17, 21]
    }, {
        name: "sus2",
        suffix: "sus2",
        positions: [0, 2, 7],
        sus: !0
    }, {
        name: "dom7sus2",
        suffix: "7sus2",
        positions: [0, 2, 7, 10]
    }, {
        name: "sus4",
        suffix: "sus4",
        positions: [0, 5, 7],
        sus: !0
    }, {
        name: "sus24",
        suffix: "sus24",
        positions: [0, 2, 5, 7]
    }, {
        name: "dom7sus4",
        suffix: "7sus4",
        positions: [0, 5, 7, 10]
    }, {
        name: "majadd2",
        suffix: "add2",
        suffix2: "2",
        positions: [0, 2, 4, 7]
    }, {
        name: "minadd2",
        suffix: "madd2",
        suffix2: "m2",
        positions: [0, 2, 3, 7]
    }, {
        name: "majadd4",
        suffix: "add4",
        suffix2: "4",
        positions: [0, 4, 5, 7]
    }, {
        name: "minadd4",
        suffix: "madd4",
        suffix2: "m4",
        positions: [0, 3, 5, 7]
    }, {
        name: "majadd9",
        suffix: "add9",
        positions: [0, 2, 4, 7]
    }, {
        name: "minadd9",
        suffix: "madd9",
        positions: [0, 2, 3, 7]
    }, {
        name: "majadd11",
        suffix: "add11",
        positions: [0, 4, 5, 7]
    }, {
        name: "minadd11",
        suffix: "madd11",
        positions: [0, 3, 5, 7]
    }, ];
    ta.forEach(function(e) {
        ta[e.name] = e,
        e.positions = e.positions.map(function(e) {
            return e % 12
        }).sort(function(e, t) {
            return e - t
        })
    }),
    ta.sortValue = function(e) {
        return e.suffix.replace(/#/g, "c").replace(/^5/, "!").replace("add", "0").replace("b6", "6").replace(/[13]/g, function(e) {
            return "9z" + e
        }).replace("sus", "!").replace(/\+/, "z") || '"'
    }
    ;
    let ti = new function() {
        let e = function(e) {
            let t = {
                major: "maj",
                ma: "maj",
                mj: "maj",
                mm: "minmaj",
                mmaj: "minmaj",
                mmajor: "minmaj",
                minor: "min",
                mi: "min",
                m: "min",
                ad: "add",
                madd: "minadd",
                maddb: "minaddb",
                mad: "minadd",
                madb: "minaddb",
                mb: "minb",
                diminished: "dim",
                di: "dim",
                o: "dim",
                halfdim: "min7b5",
                hdim: "min7b5",
                omit: "no",
                s: "sus"
            }
              , o = e.toLowerCase().replace(/[\(\)]/g, "").replace(/♭/g, "b").replace(/♯/, "#").replace(/[a-z]+/g, function(e) {
                return t[e] || e
            }).replace(/^-/, "min").replace(/ø([79])/, "min$1b5").replace(/ø/, "min7b5").replace(/[δΔ](7|9|11|13)/, "maj$1").replace(/[δΔ]/, "maj7").replace("\xb0", "dim").replace(/^([^a-z]+)min/, "min$1").replace(/^b5/, "majb5").replace(/^(?:power(?!5)|5)/, "power5").replace(/^\+|\+$/, "aug").replace(/\+(\d+)/g, "#$1").replace(/-(\d+)/g, "b$1").replace(/(.+)(aug|\+)(?!\d)/, "aug$1").replace(/aug6/, "add#6").replace(/\/([#b]?\d+)/g, "add$1").replace(/^(min)?([#b]?[24])/, "$1add$2").replace(/^(add|no|[#b]?6)/, "maj$1").replace(/sus(7|9|11|13)/, "$1sus4").replace(/sus(?![b#\d])/, "sus4").replace(/(sus[#b]?\d)([#b]?\d)/, "$1add$2").replace(/([5679])(\d+)/, "$1add$2").replace(/^([1379])/, "dom$1")
              , n = (o.replace(/(sus|add)([2-9])(\d)/, "$1$2add$3") || "maj").match(/dom\d*|maj\d*|min\d*|dim\d*|aug\d*|power\d*|add[#b]?\d+|no\d+|sus[b#]?\d*|[#b]\d+|.+/g)
              , s = {
                0: 0
            }
              , a = {
                0: 0,
                2: 2,
                3: 4,
                4: 5,
                5: 7,
                6: 9,
                7: 11,
                9: 14,
                11: 17,
                13: 21,
                24: -1
            }
              , i = 'Unknown part';
            n.forEach(function(e) {
                let t = e.match(/^(dom|maj|min|dim|aug|add|no|sus|power)?(?:([b#])?(\d+))?$/);
                if (!t)
                    throw i + " " + e;
                let o = t[1]
                  , n = "#" == t[2] ? 1 : "b" == t[2] ? -1 : 0
                  , r = Number(t[3] || 0);
                if (r && !a[r])
                    throw i + " " + r;
                if ("add" == o)
                    5 == r && 1 == n ? s[6] = -1 : s[r] = 7 == r && 0 == n ? -1 : n;
                else if ("no" == o) {
                    if (0 == s[r] && r > 0)
                        delete s[r];
                    else
                        throw i + " no" + r
                } else if (!o && n) {
                    if ((0 == r || 7 == r) && 0 != n)
                        throw i + " " + r;
                    s[r] = n
                } else if ("sus" == o)
                    delete s[3],
                    s[r] = n,
                    s[5] = 0;
                else if (o || 5 != r) {
                    if ("dom" == o || "maj" == o || "min" == o || "dim" == o || "aug" == o || "power" == o) {
                        if ("power" != o && void 0 == s[2] && void 0 == s[3] && void 0 == s[4] && (s[3] = "maj" == o || "dom" == o || "aug" == o ? 0 : -1),
                        3 != r && (5 == r || void 0 == s[5]) && (s[5] = "dim" == o ? -1 : "aug" == o ? 1 : 0),
                        6 == r && (s[6] = "aug" == o ? 1 : n),
                        r >= 7) {
                            s[7] = "maj" == o ? 0 : "dim" == o ? -2 : -1;
                            for (let l = 9; l <= r; l += 2)
                                s[l] = 0
                        }
                    } else
                        throw i + " " + e
                } else
                    s[5] = 0
            });
            let r = {};
            for (let l in s)
                r[a[l] + s[l]] = !0;
            let c = {};
            Object.keys(r).forEach(function(e) {
                c[e % 12] = !0
            });
            let d = Object.keys(c).map(function(e) {
                return Number(e)
            }).sort(function(e, t) {
                return e - t
            })
              , u = ""
              , p = {}
              , f = {
                "-1": "b",
                0: "",
                1: "#"
            };
            return -1 == s[3] && (-1 == s[5] && -1 != s[7] ? (u += "dim",
            p[5] = !0) : u += "m"),
            0 == s[7] ? u += "maj" : (0 == s[3] && s[5],
            1 == s[6] && (u += "aug6",
            p[6] = !0)),
            0 == s[13] && void 0 != s[11] && void 0 != s[9] && void 0 != s[7] ? (u += "13",
            p[7] = !0,
            p[9] = 0 == s[9],
            p[11] = 0 == s[11],
            p[13] = !0) : 0 == s[11] && void 0 != s[9] && void 0 != s[7] ? (u += "11",
            p[7] = !0,
            p[9] = 0 == s[9],
            p[11] = !0) : 0 == s[9] && void 0 != s[7] ? (u += "9",
            p[7] = !0,
            p[9] = !0) : void 0 != s[7] ? (u += "7",
            p[7] = !0) : 0 == s[6] ? (u += "6",
            p[6] = !0) : void 0 != s[3] && void 0 == s[5] ? (u += "3",
            p[5] = !0) : void 0 == s[2] && void 0 == s[3] && void 0 == s[4] && void 0 == s[6] && void 0 == s[9] && 0 == s[5] && (u += "5",
            p[3] = !0),
            void 0 == s[3] && (void 0 != s[2] || void 0 != s[4]) && (u += "sus" + (void 0 != s[2] ? f[s[2]] + "2" : "") + (void 0 != s[4] ? f[s[4]] + "4" : ""),
            p[3] = !0,
            void 0 != s[2] && (p[2] = !0),
            void 0 != s[4] && (p[4] = !0),
            void 0 != s[9] && (p[9] = !0)),
            s[5] && !p[5] && (u += f[s[5]] + "5"),
            [2, 4, 6, 7, 9, 11, 13].forEach(function(e) {
                void 0 == s[e] || p[e] || (0 == s[e] ? u += "add" + e : u += f[s[e]] + e)
            }),
            void 0 != s[3] || p[3] || (u += "no3"),
            void 0 != s[5] || p[5] || (u += "no5"),
            {
                name: o,
                suffix: u = u.replace(/(\d+)add(\d+)$/, "$1/$2").replace(/^#5$/, "aug").replace(/^([#b]\d+)$/, "($1)"),
                positions: d
            }
        }
          , t = {};
        this.parseType = function(o) {
            if (!o)
                throw "No chord object";
            if ("string" == typeof o) {
                let n = t[o];
                return n || (n = t[o] = e(o)),
                i({
                    name: n.name,
                    suffix: n.suffix,
                    positions: n.positions
                })
            }
            Array.isArray(o)
        }
        ,
        this.compactSuffix = function(e) {
            return e.replace("maj", "Δ").replace("dim", "\xb0").replace(/^m7b5$/, "\xf87").replace("aug", "+")
        }
    }
    , tr = function(e) {
        return e && ({
            qwerty: {},
            qwertz: {
                89: 90,
                90: 89
            },
            azerty: {
                65: 81,
                81: 65,
                87: 90,
                90: 87
            }
        })[u.keyboardLayout][e] || e
    }, tl = 0, tc = new function() {
        let e = []
          , t = 0;
        for (let o = 0; o < 21; o++) {
            let n = 8 - .312 * o;
            e.push(t > 0 ? t + 1 : 0),
            t += n
        }
        this.fretPositions = e;
        let s = function(e, t, o, n) {
            return this.rootFretNum = function(s) {
                let a = (t5(r.scaleKey) + s.rootPos + s.bassPos) % 12
                  , i = 0
                  , l = a - e;
                for (; l < 0; )
                    l += 12;
                let c = t - 1 - (6 == t && oc.chord.maxOctave > 0 || oc.bass.maxOctave > 0 ? 2 : 0);
                for (; i < c && l >= o[i] && Math.abs(l - o[i] - n) < Math.abs(l - n); )
                    l -= o[i],
                    i++;
                return l
            }
            ,
            this.noteFretInfo = function(n, s) {
                let a = 0
                  , i = n - e;
                for (; a < t - 1 && i >= o[a] && (i > 19 || i > s + 3); )
                    i -= o[a],
                    a++;
                return i < 0 || i > 19 ? null : {
                    fretNum: i,
                    strNum: a
                }
            }
            ,
            this.stringCount = t,
            this
        }
          , a = new s(40,6,[5, 5, 5, 4, 5],4)
          , i = new s(28,4,[5, 5, 5, 4],4)
          , l = new s(48,4,[4, 3, 2],0);
        return this.currentGuitarType = function(e) {
            let t = "chord" == e ? o6.get(r.instrument).type : "bass" == e ? o6.get(r.bassInstrument || r.instrument).type : "melody" == e ? o6.get(r.melodyInstrument || r.instrument).type : r.bassInstrument || r.melodyInstrument ? void 0 : o6.get(r.instrument).type;
            return "guitar" == t || "bass" == t || "ukulele" == t ? t : void 0
        }
        ,
        this.currentGuitarModel = function(e) {
            let t = this.currentGuitarType(e);
            return "guitar" == t ? a : "bass" == t ? i : "ukulele" == t ? l : null
        }
        ,
        this.guitarModel = function(e) {
            return "guitar" == e ? a : "bass" == e ? i : "ukulele" == e ? l : null
        }
        ,
        this
    }
    , td = function(e) {
        this.items = [],
        this.early = "",
        this.envelopes = null;
        let t = i(this);
        for (let o in e)
            void 0 != e[o] && (t[o] = e[o]);
        return t
    }, tu = function(e) {
        this.n = void 0,
        this.velocity = 1,
        this.attack = 0,
        this.sustain = !1,
        this.keep = !1,
        this.duration = 1,
        this.octave = 0,
        this.halfSteps = 0,
        this.scaleSteps = 0,
        this.fifth = !1,
        this.third = !1,
        this.remaining = !1,
        this.condition = "",
        this.fit = !1,
        this.dir = !1,
        this.modify = "",
        this.next = !1,
        this.offset = 0;
        let t = i(this);
        for (let o in e)
            void 0 != e[o] && (t[o] = e[o]);
        return t
    }, tp = function(e) {
        this.type = "default",
        this.speed = 1,
        this.bassPos = 0,
        this.section = 0,
        this.length = void 0,
        this.scale = void 0,
        this.chordOctave = void 0,
        this.bassOctave = void 0,
        this.chordInv = void 0,
        this.transpose = 0,
        this.keyChange = 0,
        this.voicing = void 0,
        this.rootPos = null;
        let t = i(this);
        for (let o in e)
            void 0 != e[o] && (t[o] = e[o]);
        return t
    }, tf;
    tf = {
        default: {
            playing: !0
        },
        onlyBass: {
            playing: !0
        },
        onlyChord: {
            playing: !0
        },
        rest: {
            playing: !1
        },
        break: {
            playing: !1
        }
    },
    tp.typeInfo = function(e) {
        return tf[e]
    }
    ;
    let th = function(e) {
        let t = 100 / 36
          , o = 60 / 36
          , n = 100 / 62
          , s = [0, .5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6]
          , a = []
          , i = J(e.id)
          , l = function(e, o) {
            let n = (J("dialog-style-piano", !0) || J("piano")).querySelector('.piano-handles [data-type="' + e + '"]');
            tc.currentGuitarType();
            let a = o6.get("bass" == e && r.bassInstrument || r.instrument)
              , i = oq.get(a.type)
              , l = void 0 != o ? o : "melody" == e || i.handles[e] && "none" != r.style[e].style;
            "guitar" == a.type && "chord" == e && oc.chord.multipleNotes && 5 == oc.chord.numNotes && (l = !1),
            ("bass" == e || "chord" == e) && r.manualChordPositions && (p.chordPropsVisible() || p.isSequencePlaying()) && (l = !1),
            X(n.style, "visibility", l ? "inherit" : "hidden");
            let c, d;
            "melody" == e ? "bass-chord" == u.keyboardType ? (c = eP.keyboardOffset,
            d = 72) : (c = ty(0),
            d = ty(12 * Math.floor(u.keyboardKeyCount / 7) + L(u.keyboardKeyCount, eU)) - ty(0)) : (c = r.style[e].octaveOffset + t5(r.scaleKey) + 12 * r.style[e].octave + eP.transpose,
            d = 12);
            let f = c - 24
              , h = f + d
              , m = 1 * t * (7 * Math.floor(f / 12) + L(f, s))
              , $ = 1 * t * (7 * Math.floor(h / 12) + L(h, s));
            X(n.style, "left", m.toFixed(3) + "%"),
            X(n.style, "width", ($ - m).toFixed(3) + "%")
        }
          , c = function(e) {
            l("bass", e),
            l("chord", e),
            l("melody", e)
        }
          , d = function() {
            let e = ""
              , n = oq[o6.get(r.bassInstrument || r.instrument).type];
            for (let s = 0; s < 36; s++) {
                let a = s % 7
                  , l = eU[a] + 12 * Math.floor(s / 7) + 24
                  , c = "";
                e += '<div data-key="' + l + '" class="whole ' + c + '" style="left: ' + (1 * s * t).toFixed(3) + '%;"></div>',
                -1 != eF[a] && 35 != s && (l = eF[a] + 12 * Math.floor(s / 7) + 24,
                c = n.minNote && l < n.minNote ? "disabled" : "",
                e += '<div data-key="' + l + '" class="half ' + c + '" style="left: ' + ((s * t + t - .5 * o) * 1).toFixed(3) + '%"></div>')
            }
            X(i.querySelector(".piano-container"), "innerHTML", e)
        }
          , f = function(e, t, o, n, s) {
            let l = tc.currentGuitarModel(n);
            if (!tc)
                return;
            o || (o = p.currentChordItem());
            let c = l.noteFretInfo(e, o ? l.rootFretNum(o) : 0);
            if (!c)
                return;
            let d = t.indexOf("hover") > -1
              , f = i.querySelector(".guitar-view .strings").childNodes[c.strNum];
            if (!f)
                return;
            let h = document.createElement("div");
            if (h.className = t,
            h.style.left = 0 == c.fretNum ? "2px" : (tc.fretPositions[c.fretNum - 1] + (tc.fretPositions[c.fretNum] - tc.fretPositions[c.fretNum - 1]) / 2) * .5 + "%",
            h.dataset.note = e,
            h.dataset.strNum = c.strNum,
            h.dataset.fretNum = c.fretNum,
            !s && u.showAlwaysVoiceInfo && o) {
                let m = t5(r.scaleKey) + o.rootPos;
                s = oe(ti.parseType(o.chord).suffix, (e - m + 11988) % 12)
            }
            if (s) {
                let $ = a[c.strNum - 1]
                  , _ = null != $ && $ == c.fretNum;
                h.innerHTML = (_ ? "&nbsp;&nbsp;&nbsp;&nbsp;" : "&nbsp;&nbsp;") + s,
                a[c.strNum] = _ ? null : c.fretNum
            }
            if (f.childNodes.forEach(function(e) {
                -1 == e.className.indexOf("hover") && (e.style.zIndex = 0,
                e.style.opacity = .5)
            }),
            f.appendChild(h),
            !d) {
                h.dataset.useStr = !0;
                let y = i.querySelector(".guitar-view .strings2").childNodes[c.strNum];
                y.style.marginLeft = 0 == c.fretNum ? 0 : (tc.fretPositions[c.fretNum - 1] + (tc.fretPositions[c.fretNum] - tc.fretPositions[c.fretNum - 1]) / 2) * .5 + "%",
                X(y.style, "visibility", c.fretNum >= 0 ? "visible" : "hidden")
            }
        }
          , h = function(e, t) {
            let o = i.querySelector(".guitar-view ." + t + '[data-note="' + e + '"]');
            if (!o)
                return;
            let n = o.parentNode;
            n.removeChild(o);
            let s = i.querySelector(".guitar-view .strings2").childNodes[o.dataset.strNum];
            a[o.dataset.strNum] = null;
            let r = !0;
            n.childNodes.forEach(function(e) {
                e.dataset.useStr && (s.style.marginLeft = e.style.left,
                r = !1)
            }),
            r && X(s.style, "visibility", "hidden")
        }
          , m = function() {
            let e = tc.currentGuitarType();
            i.classList.toggle("guitar", !!e && (!r.bassInstrument || r.bassInstrument == r.instrument)),
            i.classList.toggle("type-guitar", "guitar" == e),
            i.classList.toggle("type-bass", "bass" == e),
            i.classList.toggle("type-ukulele", "ukulele" == e),
            i.classList.toggle("type-standup-bass", "bass" == e && "standup-bass" == r.instrument);
            let t = '<div class="bar-press"></div><div class="frets">';
            tc.fretPositions.forEach(function(e, o) {
                let n = tc.fretPositions[o + 1];
                void 0 != n && (t += '<div class="fret" style="left: ' + e + "%; width: " + (n - e) + '%;">' + (o > 0 && o % 2 == 0 && 10 != o && 12 != o || 11 == o ? "<div>" + (o + 1).toString().split("").join("<br/>") + "</div>" : "") + "</div>")
            }),
            t += "</div>";
            let o = "guitar" == e ? 6 : 4
              , n = -80 / (o - 1)
              , s = "";
            for (let a = 0; a < o; a++)
                s += '<div class="string" style="top: ' + (n * a + 88) + "%; border-width: " + Math.min(Math.max(3 - a, 1), 2) + 'px;"></div>';
            t += '<div class="strings">' + s + '</div><div class="strings2">' + s + "</div>",
            X(i.querySelector(".guitar-view .neck"), "innerHTML", t)
        }
          , $ = function() {
            d(),
            m(),
            c()
        };
        return this.press = function(e, t, o, n, s) {
            let a = i.childNodes[0].childNodes[0].childNodes[e - 24];
            if (a) {
                if (a.classList.add(t),
                void 0 != o)
                    a.innerHTML = '<span class="bottom-info">' + o + "</span>";
                else if (s && "compose" == nC) {
                    let l = t5(r.scaleKey) + s.rootPos
                      , c = (e - l + 11988) % 12
                      , d = ti.parseType(s.chord);
                    a.innerHTML = '<span class="bottom-info">' + (u.showAlwaysVoiceInfo ? oe(d.suffix, c) : 0 == c ? "•" : "") + "</span>"
                }
            }
            tc.currentGuitarType() && f(e, t, s, n, o)
        }
        ,
        this.release = function(e, t) {
            let o = i.childNodes[0].childNodes[0].childNodes[e - 24];
            o && (o.classList.remove(t),
            1 == o.classList.length && X(o, "innerHTML", ""));
            tc.currentGuitarType() && h(e, t)
        }
        ,
        this.updateGuitarBarPress = function(e) {
            let t = i.querySelectorAll(".guitar-view .string > *")
              , o = 99999
              , n = 99999;
            t.forEach(function(e) {
                e.dataset.strNum;
                let t = e.dataset.fretNum;
                t < o && (o = t)
            });
            let s = 0;
            t.forEach(function(e) {
                let t = e.dataset.strNum;
                e.dataset.fretNum == o && (t < n && (n = t),
                s++)
            });
            let a;
            X(i.querySelector(".guitar-view .bar-press").style, "visibility", "hidden")
        }
        ,
        this.releaseAll = function() {
            (i.querySelectorAll(".hold-chord,.hold-bass,.hold-hover") || []).forEach(function(e) {
                e.classList.remove("hold-chord", "hold-bass", "hold-hover"),
                X(e, "innerHTML", "")
            })
        }
        ,
        this.update = function() {
            $()
        }
        ,
        this.updateHandles = function(e) {
            c(e)
        }
        ,
        this.updateId = function(e) {
            i = J(e)
        }
        ,
        i.innerHTML = '<div class="piano-view"><div title="Piano keys" class="piano-container"></div></div><div class="guitar-view"><div class="hole-decoration"></div><div class="neck"></div><div class="hole"></div></div><div class="piano-handles"><div title="' + 'Bass range' + '" id="piano-bass-handle" data-event="pianoHandle" data-type="bass" class="piano-handle"></div><div title="' + 'Chord range' + '" id="piano-chord-handle" data-event="pianoHandle" data-type="chord" class="piano-handle"></div><div title="Melody range" id="piano-melody-handle" data-event="pianoHandle" data-type="melody" class="piano-handle"></div></div>Piano',
        e.handles && (W[G].pianoHandle = function(e, t) {
            e.preventDefault();
            let o = e.pageX
              , s = t.dataset.type
              , a = "melody" == s ? eP.keyboardOffset : r.style[s].octaveOffset
              , i = t.parentNode.clientWidth;
            t.parentNode.appendChild(t),
            t.classList.add("active");
            let c;
            W[R].all = function(e) {
                let t = Math.round(a + (e.pageX - o) / n_ / n / 1 / i * 100);
                if ("melody" == s)
                    eP.keyboardOffset = t;
                else {
                    let d = Math.min(Math.max(t, 24 - t5(r.scaleKey) - 12 * r.style[s].octave - 12 + 2), 24 - t5(r.scaleKey) - 12 * r.style[s].octave + 60);
                    r.style[s].octaveOffset = d
                }
                t != c && (c = t,
                l(s),
                "roll" != nC || p.started() || tA(),
                "keyboard" == nC && tT(),
                p.updateCurrentChord(),
                p.updateChordPreview())
            }
            ,
            W[B].all = function() {
                "melody" == s ? oK() : J("dialog-style-piano", !0) || o8("Updated " + s + " range"),
                t.classList.remove("active"),
                delete W[R].all,
                delete W[B].all,
                "roll" == nC && p.started() && tA()
            }
        }
        ),
        $(),
        this
    }, tm, t$ = function() {
        tm ? tm.update() : tm = new th({
            id: "piano",
            handles: !0
        });
        let e = "roll" == nC && !r.manualChordPositions;
        J("piano").classList.toggle("piano-type-bass", "keyboard" != nC || e),
        J("piano").classList.toggle("piano-type-chord", "keyboard" != nC || e),
        J("piano").classList.toggle("piano-type-melody", "compose" != nC),
        J("piano").querySelector('.piano-handle[data-type="bass"]').classList.toggle("show", "compose" == nC || e),
        J("piano").querySelector('.piano-handle[data-type="chord"]').classList.toggle("show", "compose" == nC || e),
        J("piano").querySelector('.piano-handle[data-type="melody"]').classList.toggle("show", "keyboard" == nC)
    }, t_ = function() {
        let e = eJ[u.keyboardType];
        if (!e)
            return;
        let t = r.scale
          , o = tt[te.get(t).scaleGroup];
        if (!o.steps)
            return;
        let n = !1;
        return e.steps.forEach(function(t) {
            -1 == o.steps.indexOf(t) && t != e.special && (n = !0)
        }),
        n && !o.pentaAlt ? void 0 : u.keyboardType
    }, ty = function(e) {
        let t = u.keyboardType
          , o = Math.floor(e / 12)
          , n = e % 12;
        if ("all" == t) {
            let s = e;
            return s + 12 * Math.floor(eP.keyboardOffset / 12)
        }
        let a = te.get(r.scale)
          , i = te.get(u.chordControlEnabled ? to[a.scaleGroup][eP.currentMode] : r.scale);
        if ("scale" == t) {
            let l = eU.indexOf(n);
            if (-1 == l)
                return;
            return (o + Math.floor((l += Math.floor(eP.keyboardOffset / 12) * i.steps.length + Math.floor((eP.keyboardOffset + 11988) % 12 / 12 * i.steps.length)) / i.steps.length)) * 12 + L(l, i.steps) + t5(r.scaleKey) + eP.keyChange + eP.transpose
        }
        if ("chord" == t || "bass" == t || "bass-chord" == t) {
            let c = p.currentChordItem() || new tp({
                rootPos: 0,
                chord: "maj"
            });
            if (!c)
                return;
            let d = {
                instrType: "melody",
                voicing: void 0,
                numNotes: u.keyboardChordNumNotes,
                full: u.keyboardChordNumNotes > 3,
                isGuitar: "guitar" == o6.get(r.melodyInstrument || r.instrument).type
            }
              , f = Object.assign({}, c);
            f.bassOctave = t8(c, r.style.bass.octaveOffset, {
                instrType: "melody"
            }),
            f.chordOctave = 0,
            f.chordInv = tH(c, eP.keyboardOffset, d);
            let h = of(f, "melody", !1, d)
              , m = of(f, "bass", !1, {
                numNotes: 3
            })
              , $ = o * eU.length + eU.indexOf(n);
            return "chord" == t ? h[$] : "bass" == t ? m[$] : $ < 7 ? m[$] : h[$ - 7]
        }
        if (eJ[t]) {
            let _ = eU.indexOf(n);
            if (-1 == _)
                return;
            let y = t_(r.scale);
            if (!y)
                return;
            let v = eJ[y]
              , g = tt[a.scaleGroup]
              , b = v.steps.indexOf(L(i.offset + (g.pentaAlt || 0), eU));
            if (-1 == b)
                return;
            _ += Math.floor(eP.keyboardOffset / 12) * v.steps.length + Math.floor((eP.keyboardOffset + 11988) % 12 / 12 * v.steps.length);
            let x = o * eU.length + _ + b, k;
            return 12 * Math.floor(x / v.steps.length) + L(x % v.steps.length, v.steps) - v.steps[b] + t5(r.scaleKey) + eP.keyChange + eP.transpose
        }
    }, tv, tg, tb, t0, tx, tk, tC, tS, t1, t2;
    t0 = {},
    tx = {},
    tk = null,
    t1 = function(e) {
        X(J("guess-chord").style, "display", e ? "block" : "none"),
        X(J("guess-chord"), "innerHTML", tq(e)),
        clearTimeout(tS),
        tS = setTimeout(function() {
            J("guess-chord").style.display = "none"
        }, 3e3)
    }
    ,
    tg = function() {
        tx = {},
        t2()
    }
    ,
    t2 = function() {
        let e = []
          , t = []
          , o = ""
          , n = 999
          , s = 0;
        for (let a in tx) {
            let i = Number(a);
            i < n && (n = i),
            s++
        }
        if (s >= 3) {
            let l = Object.keys(tx).map(function(e) {
                return Number(e)
            })
              , c = l[1] - l[0] > 5;
            for (let d = 0; d < 12; d++) {
                let u = {};
                for (let p in tx)
                    u[(p - d + 120) % 12] = !0;
                let f = Object.keys(u).length;
                ta.forEach(function(o) {
                    let s = 0
                      , a = !0;
                    if (o.positions.forEach(function(e) {
                        u[e] && (s += c && (d + e) % 12 == n % 12 ? .5 : 1,
                        (d + e) % 12 == n % 12 && (a = !1))
                    }),
                    s < f - (c && 3 == o.positions.length ? 1 : .5))
                        return;
                    let i = tN(d) + o.suffix;
                    s >= o.positions.length - .5 ? e.find(function(e) {
                        return e[0] == d
                    }) || e.push([d, n, o.name, i + (c && d != n % 12 ? "/" + tN(n % 12) : ""), d == n % 12 || c ? 0 : 1]) : 0 == e.length && t.push([o.name, i, o.positions.length + (u[0] ? 0 : 1) + (c && d == n % 12 ? 0 : 1)])
                })
            }
            if (e.length > 0) {
                e = e.sort(function(e, t) {
                    return e[4] - t[4]
                });
                let h = [];
                e.forEach(function(t) {
                    Math.floor(t[4]) == Math.floor(e[0][4]) && h.push(t[3])
                }),
                o += h.join(" or ");
                let m = {
                    rootPos: (e[0][0] + 12 - t5(r.scaleKey)) % 12,
                    bassPos: /*!lowBass || best[0][0] == lowest % 12 ? 0 : */
                    (e[0][1] - e[0][0] + 11988) % 12,
                    chord: e[0][2]
                }
                  , $ = Object.keys(tx).map(function(e) {
                    return Number(e)
                }).sort();
                if (r.manualChordPositions) {
                    if (c) {
                        let _ = $[0] - t5(r.scaleKey) - m.rootPos;
                        m.bassOctave = Math.floor(_ / 12) - r.style.bass.octave,
                        $.shift()
                    }
                    let y = $[0] - t5(r.scaleKey) - m.rootPos
                      , v = ti.parseType(m.chord);
                    m.chordOctave = Math.floor(y / 12) - r.style.chord.octave,
                    m.chordInv = v.positions.indexOf(y % 12);
                    let g = 0;
                    $.forEach(function(e) {
                        let t = e - t5(r.scaleKey) - m.rootPos
                          , o = Math.floor(t / 12) - r.style.chord.octave
                          , n = v.positions.indexOf(t % 12);
                        g |= 1 << (o - m.chordOctave) * v.positions.length + n - m.chordInv
                    }),
                    m.voicing = g
                }
                tk = {
                    chordItem: m
                }
            } else
                t.length > 0 && s >= 3 && (o = '<span class="guess-weak">~' + (t = t.sort(function(e, t) {
                    return e[2] - t[2]
                }))[0][1] + "</span>")
        }
        clearTimeout(tC),
        tC = setTimeout(t1, o ? 300 : 0, o)
    }
    ,
    tb = function(e) {
        let t = u.keyboardMulti;
        if (!t || "bass-chord" == u.keyboardType)
            return;
        let o = te.get(r.scale)
          , n = (e - t5(r.scaleKey) + 12) % 12
          , s = o.steps.indexOf(n)
          , a = s > -1 ? L(s - t, o.steps, 0, 12) - n : L(1 - t, eU, 0, 12) - eU[1];
        return e + a
    }
    ,
    tv = function(e, t, o) {
        let n, s = o6.get(r.melodyInstrument || r.instrument), a = !!eP.melodySustainPressed || !("organ"in s) && u.keyboardSustain;
        if (0 == t) {
            let i = t0[e];
            if (void 0 == i)
                return;
            delete t0[e],
            p.recordNote(i, t),
            o9.release("melody", i, void 0, void 0, a),
            delete tx[i];
            let l = tb(i);
            l && (p.recordNote(l, t),
            o9.release("melody", l, void 0, void 0, a),
            delete tx[l]),
            0 == Object.keys(tx).length && tk && (p.recordChord(tk.chordItem),
            tk = null);
            let c = J("keyboard-key-" + e, !0);
            c && c.classList.remove("hold-hover");
            return
        }
        let d;
        if (o)
            d = e;
        else {
            let f = ty(e);
            if (void 0 == f)
                return;
            d = f
        }
        p.recordNote(d, t),
        o9.press("melody", d, t),
        tx[d] = !0;
        let h = tb(d);
        h && (p.recordNote(h, t),
        o9.press("melody", h, t),
        tx[h] = !0),
        t0[e] = d,
        t2();
        let m = J("keyboard-key-" + e, !0);
        m && (m.classList.add("hold-hover"),
        n && (m.childNodes[1].innerHTML = n))
    }
    ;
    let tA = function() {
        p.renderPianoRoll()
    }
      , tT = function() {
        let e = ""
          , t = u.keyboardKeyCount
          , o = 100 / t
          , n = 60 / t
          , s = te.get(r.scale)
          , a = tt[s.scaleGroup]
          , i = u.chordControlEnabled ? to[s.scaleGroup][eP.currentMode] : r.scale
          , l = te.get(i)
          , c = t_()
          , d = c ? eJ[c] : void 0
          , p = d ? d.steps.indexOf(a.steps[l.offset]) : 0
          , f = L(t5(r.scaleKey) + eP.transpose + eP.keyChange, 12)
          , h = function(e, t) {
            let o = [];
            return "bass-chord" == u.keyboardType ? 12 == e && o.push("first") : "all" == u.keyboardType ? (l.steps.indexOf((e + 12 - t5(r.scaleKey) - eP.keyChange - eP.transpose) % 12) > -1 && o.push("active"),
            e % 12 == 0 && o.push("first")) : (t % 12 == f && o.push("tonic"),
            d && (eU.indexOf(e % 12),
            d.steps.length,
            void 0 != t && -1 == l.steps.indexOf(L(t - t5(r.scaleKey) - eP.transpose - eP.keyChange, 12)) && o.push("special"))),
            o.join(" ")
        }
          , m = function(e) {
            let t = eE[e] || " ";
            return String.fromCharCode(tr(t.charCodeAt(0)))
        }
          , $ = "";
        for (let _ = 0; _ < t; _++) {
            let y = L(_, eU, 0, 12)
              , v = ty(y)
              , g = void 0 != v ? tN(v) : "n/a";
            if ("bass-chord" == u.keyboardType) {
                let b = Math.floor(.4 * t);
                g = (y = b < 7 && _ >= b ? L(_ - b + 7, eU, 0, 12) : y) >= 12 ? "C" + (_ - Math.min(b, 7) + 1) : "B" + (_ + 1)
            }
            $ += '<div id="keyboard-key-' + y + '" title="' + 'Key' + ": " + m(y) + '" data-event="keyPad" data-vel="1" data-key="' + y + '" class="whole ' + (p > -1 ? h(y, v) : "") + '" style="left: ' + _ * o + "%; width: " + o + '%;"><span class="top-info">' + g + "</span></div>",
            -1 == eU.indexOf((L(_, eU) + 1) % 7) && "all" == u.keyboardType && _ < t - 1 && ($ += '<div id="keyboard-key-' + ++y + '" title="' + 'Key' + ": " + m(y) + '" data-event="keyPad" data-vel="1" data-key="' + y + '" class="half ' + (p > -1 ? h(y, v) : "") + '" style="left: ' + (_ * o + o - .5 * n) + "%; width: " + n + '%;"></div>')
        }
        e += '<div class="piano piano-large piano-type-' + u.keyboardType + '"><div class="piano-container">' + $ + "</div></div>",
        X(J("keyboard"), "innerHTML", e);
        let x = J("keyboard-select-type");
        X(x, "value", u.keyboardType),
        X(x, "title", x.options[x.selectedIndex].title),
        X(J("keyboard-chord-num-notes").parentNode.style, "display", "bass-chord" == u.keyboardType ? "inline-block" : "none"),
        X(J("keyboard-chord-num-notes"), "value", u.keyboardChordNumNotes),
        X(J("keyboard-multi").parentNode.style, "display", "bass-chord" != u.keyboardType ? "inline-block" : "none"),
        X(J("keyboard-multi"), "value", u.keyboardMulti);
        let k = "organ"in o6.get(r.melodyInstrument || r.instrument);
        J("keyboard-sustain").checked = u.keyboardSustain && !k,
        J("keyboard-sustain").disabled = k,
        tg()
    }
      , t3 = function() {
        return 60 / r.style.tempo * w[r.style.timeSignature].beatScale
    }
      , tw = function() {
        let e = w[r.style.timeSignature];
        return t3() * e.beats
    }
      , tP = function(e) {
        let t = e.charCodeAt(0) - 65 - 2;
        return t < 0 && (t += 7),
        t
    }
      , t5 = function(e) {
        let t = e.toLowerCase().match(/^([a-h])((?:b+|#+)?)$/);
        if (t)
            return (eU[Math.min("cdefgabh".indexOf(t[1]), 6)] + ("#" == t[2].charAt(0) ? 1 : -1) * t[2].length + 12) % 12
    }
      , tE = function(e) {
        let t = te.get(r.scale)
          , o = t5(e);
        if (void 0 == o) {
            let n = e.match(/^(b+|#+)?([iv]+)/i);
            if (!n)
                return;
            {
                let s = eN.indexOf(n[2].toUpperCase());
                if (!(s > -1))
                    return;
                {
                    let a = 0;
                    return n[1] && (a = ("#" == n[1].charAt(0) ? 1 : -1) * n[1].length),
                    t5(r.scaleKey) + t.steps[s] + a
                }
            }
        }
        return o
    }
      , tL = function(e) {
        let t;
        return [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [4, 3], [8, 3], ].forEach(function(o) {
            e == o[0] / o[1] && (t = o)
        }),
        t ? t.join("/") : e
    }
      , tI = function(e) {
        if ("string" == typeof e) {
            let t = e.split("/");
            return 2 == t.length ? t[0] / t[1] : Number(e)
        }
    }
      , tN = function(e, t, o, n) {
        o || (o = r.scaleKey),
        t || (t = r.scale),
        n || (n = "default");
        let s = te.get(t);
        if ("roman-numeral" == n || "number" == n) {
            let a = te.get("ionian")
              , i = t5(o) - ("number" == n ? a.steps[te.get((u.chordControlEnabled,
            r.scale)).offset] : 0)
              , l = a.steps.indexOf(L(e - i, 12))
              , c = a.steps.indexOf(L(e - i - 1, 12));
            a.steps.indexOf(L(e - i - 2, 12));
            let d = "";
            if (s.steps.indexOf(L(e - i, 12)),
            -1 == l) {
                let p = a.steps.indexOf(L(e - i + 1, 12));
                p > -1 && (-1 == c || -1 == s.steps.indexOf(a.steps[p])) ? (l = p,
                d = "b") : (l = c,
                d = "#")
            }
            return d + ("number" == n ? l + 1 : eN[l])
        }
        let f = tP(o)
          , h = L(e - t5(o), 12)
          , m = s.steps.indexOf(h);
        if (m > -1) {
            let $ = L(m + f, eU)
              , _ = L(e, 12) - $;
            _ < -2 && (_ += 12),
            _ > 2 && (_ -= 12);
            let y;
            return String.fromCharCode((m + f + 2) % 7 + 65) + ({
                "-2": "bb",
                "-1": "b",
                0: "",
                1: "#",
                2: "##"
            })[_]
        }
        return eB[L(e, 12)]
    }
      , t4 = function(e) {
        let t = w[r.style.timeSignature];
        return [1, t.beats * (e || t.beatDiv || 2)]
    }
      , tO = function() {
        t$(),
        tU(),
        tJ(),
        d.update(),
        c.update(),
        tX.update(),
        nx(),
        p.update(),
        "keyboard" == nC && tT(),
        "roll" == nC && tA(),
        X(document, "title", (r.name ? "[" + r.name + "] " : "") + document.title.replace(/\[.*\] /, ""))
    }
      , tM = function() {
        l.current().convolverGain.gain.value = r.effectAmount
    }
      , t7 = new E({
        localStorageName: "chordPlayer",
        dataSource: function() {
            return r
        },
        extraSource: function() {
            return {
                sequence: p.currentStateData()
            }
        },
        buttonState: function(e) {
            J("sequence-undo").title = 'Undo' + (e.undoAction ? ": " + e.undoAction : "") + " (Ctrl+Z)",
            J("sequence-undo").disabled = e.undoAction ? "" : "disabled",
            J("sequence-redo").title = 'Redo' + (e.redoAction ? ": " + e.redoAction : "") + " (Ctrl+Y)",
            J("sequence-redo").disabled = e.redoAction ? "" : "disabled"
        },
        dataState: function(e, t) {
            r = e,
            p.updateCurrentState(t.sequence),
            ou(),
            oQ(),
            p.replaySequence(),
            tO()
        }
    })
      , tq = function(e) {
        if (void 0 != e)
            return "number" == u.chordNotation || "roman-numeral" == u.chordNotation ? e.replace(/^#/, "♯").replace(/^b/, "♭") : e.replace("##", '<span class="compact">#</span>#')
    }
      , t6 = function(e) {
        if (e)
            return e.replace(/<.+?>/g, "")
    }
      , tD = function(e, t) {
        let o = ti.parseType(e)
          , n = o.positions.indexOf(t);
        if (n > 0) {
            let s = o.positions.filter(function(e) {
                return e != o.positions[n]
            }).toString()
              , a = ta.find(function(e) {
                return e.positions.toString() == s
            });
            if (a && a.suffix.length <= o.suffix.length && "power" != a.name)
                return a.name
        }
        return e
    }
      , tj = function(e, t, o, n, s, a) {
        if (null == t)
            return "";
        let i = ti.parseType(e);
        if (!i)
            return "undefined";
        s || (s = "default"),
        a || (a = r.scale),
        n || (n = r.scaleKey);
        let l = t5(n) + t
          , c = tN(l, a, n, s);
        if ("roman-numeral" == s) {
            let d = i.suffix
              , u = c;
            (i.name.indexOf("min") > -1 || i.name.indexOf("dim") > -1) && (u = u.toLowerCase(),
            d.match(/^maj/) || (d = d.replace("m7b5", "\xf87").replace(/^m/, "")));
            let p = "";
            o && (p = "/" + oe(i.suffix, o),
            i.positions.indexOf(o) > -1 ? p = p.replace(/[#b]/, "") : "/7" == p && (p = "/M7"));
            let f = p
              , h = te.get(r.scale);
            return ("dom7" == e || "dom9" == e) && eU[h.offset],
            u + (d ? "<sup>" + d.replace(/[\(\)]/g, "").replace("maj", "Δ").replace("dim", "\xb0").replace("sus", "s").replace(/add([#b]?[24])/, "$1").replace("aug", "+") + "</sup>" : "") + f
        }
        if ("default" == s)
            return c + i.suffix + (o ? "/" + tN(o + l, a, n) : "");
        if ("number" == s) {
            let m = ti.compactSuffix(i.suffix).replace(/[\(\)]/g, "").replace("m", "-").replace("sus", "s").replace(/add([#b]?[24])/, "$1")
              , $ = "";
            return "-" == m.charAt(0) && ($ = "-",
            m = m.substr(1)),
            c + $ + (m ? "<sup>" + m + "</sup>" : "") + (o ? "/" + tN(o + l, a, n, s) : "")
        }
        return "?"
    }
      , tG = function(e, t, o) {
        void 0 == o && (o = r.scale);
        let n = te.get(o)
          , s = tn[e];
        if (s) {
            let a = s.chords, i = L(t, n.steps), l = n.steps, c;
            loop: for (let d = 0; d < a.length; d++) {
                let u = a[d]
                  , p = ti.parseType(u).positions;
                for (let f = 0; f < p.length; f++)
                    if (-1 == l.indexOf((p[f] + i) % 12))
                        continue loop;
                c = u;
                break
            }
            return c
        }
        return e
    }
      , tB = function(e) {
        let t = new tp(e);
        if (void 0 == t.bassOctave && (t.bassOctave = t8(t, r.style.bass.octaveOffset)),
        void 0 == t.chordOctave) {
            let o = 12 * r.style.chord.octave + r.style.chord.octaveOffset + t5(r.scaleKey);
            t.chordOctave = r.style.chord.inversions ? 0 : tV(t, o)
        }
        void 0 == t.chordInv && (t.chordInv = r.style.chord.inversions && !tc.currentGuitarModel("chord") ? tH(t, 12 * r.style.chord.octave + r.style.chord.octaveOffset + t5(r.scaleKey) + t.transpose) : 0);
        let n = ti.parseType(t.chord);
        for (; t.chordInv < 0; )
            t.chordInv += n.positions.length,
            t.chordOctave--;
        for (; t.chordInv >= n.positions.length; )
            t.chordInv -= n.positions.length,
            t.chordOctave++;
        return t
    }
      , tR = function(e, t) {
        let o = te.get(r.scale).steps.indexOf(t);
        if (o > -1) {
            if ("sus2" == e || "sus4" == e)
                return tG("diatonic-triad", o) || e;
            if ("maj7sus2" == e || "maj7sus4" == e || "dom7sus2" == e || "dom7sus4" == e)
                return tG("diatonic-7", o) || e
        }
        return e
    }
      , tV = function(e, t) {
        let o = of(new tp({
            chord: tR(e.chord, e.rootPos),
            rootPos: e.rootPos,
            bassPos: e.bassPos
        }), "chord", !0)
          , n = 0;
        for (; 12 * n + o < t; )
            n++;
        for (; 12 * n + o >= t + 12; )
            n--;
        return n
    }
      , tH = function(e, t, o) {
        let n = 0
          , s = 99999
          , a = -1
          , i = tR(e.chord, e.rootPos)
          , l = new tp({
            chord: i,
            rootPos: e.rootPos,
            bassPos: e.bassPos
        });
        r.style.bass.octave,
        e.bassOctave,
        r.style.bass.double,
        e.rootPos,
        e.bassPos,
        t5(r.scaleKey),
        r.style.chord.open,
        ti.parseType(i),
        t5(r.scaleKey),
        e.rootPos;
        let c = 0;
        for (; c++ < 20; ) {
            l.chordInv = n;
            let d = of(l, o && o.instrType ? o.instrType : "chord", !0, o)
              , u = d - t < 0 ? 999 : d - t;
            if (u > s)
                break;
            s = u,
            a = n,
            n += t > d ? 1 : -1
        }
        return a
    }
      , t8 = function(e, t, o) {
        ti.parseType(e.chord);
        let n = e.rootPos + e.bassPos - e.transpose
          , s = 0;
        for (; 12 * s + n < t; )
            s++;
        for (; 12 * s + n >= t + 12; )
            s--;
        let a = o6.get((o && "melody" == o.instrType ? r.melodyInstrument : r.bassInstrument) || r.instrument)
          , i = oq.get(a.type).minNote;
        for (; i && (r.style.bass.octave + s) * 12 + n + t5(r.scaleKey) < i; )
            s++;
        let l = oq.get(a.type).maxBassNote;
        for (; l && (r.style.bass.octave + s) * 12 + n + t5(r.scaleKey) > l; )
            s--;
        return s
    }
      , tK = function() {
        let e = [];
        for (let t = 0; t < Math.min(r.sequence.length, 4); t++) {
            let o = r.sequence[t]
              , n = tj(o.chord, o.rootPos, o.bassPos);
            n && e.push(n)
        }
        return "Chords" + (e.length > 0 ? " " + e.join("-") : "") + " " + r.style.tempo + "bpm"
    }
      , tF = function(e, t, o, n) {
        let s = "string" == typeof t ? te.get(t) : t
          , a = o ? s.shortName || s.name : n && s.modeName || s.name;
        return "0" == '1' && (a = a.toLowerCase()),
        (e ? e + ('' || " ") : "") + a.replace(" augmented", " aug").replace(" dominant", " dom")
    }
      , tU = function() {
        let e = "";
        to[te.get(r.scale).scaleGroup].forEach(function(t) {
            let o = te.get(t);
            e += '<button class="' + (eP.currentMode == o.offset ? "highlighted" : "") + '" data-event="chordControlMode" data-index="' + o.offset + '" title="' + (o.modeName || o.name) + '">' + (o.offset + 1) + "</button>"
        }),
        X(J("chords-control-modes"), "innerHTML", e);
        let t = [];
        r.customChords.some(function(e) {
            return e.chord.indexOf("dom") > -1
        }) || t.push('<button class="' + (eP.chordsDom ? "selected" : "") + '" data-event="chordControlDom" title="' + 'Dominant 7ths' + "\n" + 'Key' + ': Alt">' + 'Dom' + "</button>"),
        X(J("chords-control-buttons"), "innerHTML", t.join("")),
        X(J("controls-advanced").style, "display", u.chordControlEnabled ? "block" : "none");
        let o = eP.transpose;
        X(J("chords-transpose"), "innerHTML", 0 != o ? (o > 0 ? "+" : "") + o : "0"),
        e = "";
        for (let n = -6; n < 6; n++) {
            let s = L(7 * n + eP.keyChange, 12);
            e += '<option value="' + s + '">' + tN(t5(r.scaleKey) + o + s) + "</option>"
        }
        X(J("chords-key-change"), "innerHTML", e),
        X(J("chords-key-change"), "value", eP.keyChange)
    };
    W[H].chordControlMode = function(e, t) {
        eP.currentMode = Number(t.dataset.index),
        tU(),
        tJ(),
        d.update(),
        tX.reset(),
        tX.update(),
        "keyboard" == nC && tT(),
        p.update()
    }
    ;
    let tz = function(e, t) {
        r.style.chord.octave,
        r.style.chord.octaveOffset,
        t5(r.scaleKey);
        let o = te.get("ionian")
          , n = te.get(r.scale)
          , s = te.get(to[n.scaleGroup][e]);
        s.steps.slice().forEach(function(e, n) {
            let a = e + 48;
            if (t) {
                let i = e - o.steps[n]
                  , r = (i < 0 ? "b" : i > 0 ? "#" : "").repeat(Math.abs(i)) + (n + 1);
                s.charPitches && s.charPitches.indexOf(e) > -1 && (r = '<b style="text-decoration: underline;">' + r + "</b>"),
                tm.press(a, "hold-hover", r)
            } else
                tm.release(a, "hold-hover")
        })
    }, t9, tY, tQ = !1;
    W[O].chordControlMode = W[G].chordControlMode = function(e, t) {
        if (p.isSequencePlaying() || p.chordPropsVisible() || ne.isDragging())
            return !0;
        tm.updateHandles(!1);
        let o = Number(t.dataset.index);
        return t9 = setTimeout(function() {
            tJ(void 0, o),
            tm.releaseAll(),
            tz(o, !0),
            tQ = !0
        }, tQ ? 0 : 300),
        clearTimeout(tY),
        !0
    }
    ,
    W[M].chordControlMode = W[B].chordControlMode = function(e, t) {
        return !!(p.isSequencePlaying() || p.chordPropsVisible() || ne.isDragging()) || (tm.updateHandles(),
        clearTimeout(t9),
        tY = setTimeout(function() {
            tJ(),
            tQ = !1
        }, 0),
        tz(Number(t.dataset.index), !1),
        !0)
    }
    ,
    W[H].chordControlDom = function(e, t) {
        eP.chordsDom = !eP.chordsDom,
        t.classList.toggle("highlighted", eP.chordsDom),
        tJ(),
        d.update()
    }
    ,
    W[H].chordControlAdd = function(e, t) {
        eP.chordsAdd = !eP.chordsAdd,
        t.classList.toggle("highlighted", eP.chordsAdd),
        tJ()
    }
    ,
    W[H].chordControlExt = function(e, t) {
        eP.chordsExt = !eP.chordsExt,
        t.classList.toggle("highlighted", eP.chordsExt),
        tJ()
    }
    ,
    W[H].chordControlShowSecondarySyntax = function(e, t) {
        eP.showSecondarySyntax = !eP.showSecondarySyntax,
        t.classList.toggle("highlighted", eP.showSecondarySyntax),
        p.update()
    }
    ,
    W[H].chordControlTranspose = function(e, t) {
        let o = Number(t.dataset.amount);
        eP.transpose += o,
        tO()
    }
    ,
    W[H].chordControlTransposeValue = function(e, t) {
        let o = prompt('Key change' + " (\xb1" + 'Half steps'.toLowerCase() + ")", eP.transpose);
        if (null == o)
            return;
        let n = Number(o);
        !isNaN(n) && (eP.transpose = n,
        tO())
    }
    ,
    W[U].chordControlKeyChange = function(e, t) {
        eP.keyChange = Number(e.target.value),
        tO()
    }
    ;
    let tW = function() {
        let e = "triad"
          , t = function() {
            let t = te.get(r.scale)
              , o = ""
              , n = u.chordControlEnabled ? to[t.scaleGroup][eP.currentMode] : r.scale;
            nT.parallell && (n = "ionian" == r.scale ? "aeolian" : "aeolian" == r.scale ? "ionian" : r.scale);
            let s = te.get(n)
              , a = {};
            s.steps.forEach(function(e, t) {
                a[L(e + eP.transpose, 12) + tG("diatonic-triad", t, n)] = !0
            });
            for (let i = 0; i < 12; i++) {
                let l = 30 * i
                  , c = L(7 * i - t5(r.scaleKey), 12)
                  , d = nT.dominant || eP.chordsDom || "7" == e ? "dom7" : "maj7" == e ? "maj7" : "9" == e ? "dom9" : "maj9" == e ? "maj9" : "maj"
                  , p = a[L(c - eP.keyChange, 12) + "maj"]
                  , f = p && c == L(eP.keyChange + eP.transpose, 12)
                  , h = L(7 * i + 9 - t5(r.scaleKey), 12)
                  , m = "7" == e || "maj7" == e ? "min7" : "9" == e || "maj9" == e ? "min9" : "min"
                  , $ = a[L(h - eP.keyChange, 12) + "min"]
                  , _ = $ && h == L(eP.keyChange + eP.transpose, 12);
                o += '<div class="clip clip-' + (l < 180 ? "after" : "before") + '"><div id="' + d + "-" + c + '-0-100" data-event="chordPad" data-chord-pad="1" data-chord-item=\'' + JSON.stringify({
                    chord: d,
                    rootPos: c
                }) + '\' data-extra="100" class="pie' + (p ? " near" : "") + (f ? " tonic" : "") + '" style="transform: rotate(' + l + 'deg);"><span class="pie-label" style="transform: translate(-50%, 0) rotate(-' + l + 'deg)">' + tj(d, c, 0, r.scaleKey).replace("maj", "M") + '</span></div><div id="' + m + "-" + h + '-0-100" data-event="chordPad" data-chord-pad="1" data-chord-item=\'' + JSON.stringify({
                    chord: m,
                    rootPos: h
                }) + '\' data-extra="100" class="pie' + ($ ? " near" : "") + (_ ? " tonic" : "") + ' small" style="transform: rotate(' + l + 'deg);"><span class="pie-label" style="transform: translate(-50%, 0) rotate(-' + l + 'deg)">' + tj(m, h, 0, r.scaleKey) + "</span></div></div>"
            }
            X(J("circle-of-fifths"), "innerHTML", '<div class="pie-chart">' + o + "</div>")
        };
        J("circle-chord-types").onchange = function() {
            e = this.value,
            t()
        }
        ,
        this.update = t
    }, tZ = function() {
        let e, t, o, n, s = "default", a = 0, i = 0, c = "voice", d = "", u = "", f = 1, h = 1, m = 0, $ = "velocity", _, y = [["default", '<span class="editor-symbol-frame">&nbsp;</span><span class="symbol-label">' + 'Default' + "</span>"], ["hold", '<span class="editor-symbol-frame">-</span><span class="symbol-label">' + 'Hold' + "</span>"], ["release", '<span class=")editor-symbol-frame">⨯</span><span class="symbol-label">' + 'Release' + "</span>"], ["sustain", '<span>☰</span><span class="symbol-label">' + 'Sustain' + "</span>", ""], ], g = [["voice", '<span class="editor-symbol-tones tone"></span><span class="symbol-label">' + 'Tone' + "</span>"], ["chord", '<span class="editor-symbol-tones all"></span><span class="symbol-label">' + 'Chord' + "</span>"], ["remaining", '<span class="editor-symbol-tones upper"></span><span class="symbol-label">' + 'Remaining' + "</span>"], ["early-change", '<span class="editor-symbol-tones early"></span><span class="symbol-label">' + 'Early change' + "</span>"], ["envelopes", '<span class="editor-symbol-tones">~</span><span class="symbol-label">' + 'Automation' + "</span>"], ["picker", '<svg class="editor-symbol-tones picker" viewBox="0 0 32 32"><path d="M30.828 1.172c-1.562-1.562-4.095-1.562-5.657 0l-5.379 5.379-3.793-3.793-4.243 4.243 3.326 3.326-14.754 14.754c-0.252 0.252-0.358 0.592-0.322 0.921h-0.008v5c0 0.552 0.448 1 1 1h5c0 0 0.083 0 0.125 0 0.288 0 0.576-0.11 0.795-0.329l14.754-14.754 3.326 3.326 4.243-4.243-3.793-3.793 5.379-5.379c1.562-1.562 1.562-4.095 0-5.657zM5.409 30h-3.409v-3.409l14.674-14.674 3.409 3.409-14.674 14.674z"></path></svg><span class="symbol-label">' + 'Pick' + (v ? ' <addr style="opacity: 0.5;">(' + (navigator.userAgent.match(/Macintosh/) ? "Option" : "Alt") + ")</span>" : "") + "</addr>"], ], b = [["velocity", 'Velocity'], ["offset", 'Offset'], ["volume", 'Volume'], ["pitch", 'Pitch'], ["strum", 'Strum'], ["lowpass", 'Lowpass'], ["lowpassQ", 'Lowpass' + " Q"], ["highpass", 'Highpass'], ["highpassQ", 'Highpass' + " Q"], ], x = {
            velocity: {
                min: .01,
                max: 1,
                step: .01,
                curve: 1,
                existing: !0,
                display: function(e) {
                    return Math.round(100 * e)
                },
                default: 1
            },
            volume: {
                min: 0,
                max: 1,
                step: .01,
                curve: 1,
                existing: !1,
                display: function(e) {
                    return Math.round(100 * e)
                }
            },
            strum: {
                min: -.25,
                max: .25,
                step: .001,
                curve: 1,
                existing: !1,
                display: function(e) {
                    return (e > 0 ? "+" : "") + Math.round(100 * e / .25)
                },
                notesOnly: !0,
                default: 0
            },
            offset: {
                min: 0,
                max: 1,
                step: .001,
                curve: 1,
                existing: !0,
                display: function(e) {
                    return (e > 0 ? "+" : "") + Math.round(100 * e / 1)
                },
                default: 0
            },
            pitch: {
                min: -12,
                max: 12,
                step: 1,
                curve: 1,
                existing: !1,
                display: function(e) {
                    return (e > 0 ? "+" : "") + Math.round(10 * e) / 10
                }
            },
            highpass: {
                min: 0,
                max: 22050,
                step: 1,
                curve: .3,
                existing: !1,
                display: function(e) {
                    return e
                }
            },
            highpassQ: {
                min: 0,
                max: 20,
                step: .1,
                curve: 1,
                existing: !1,
                display: function(e) {
                    return Math.round(e)
                }
            },
            lowpass: {
                min: 0,
                max: 22050,
                step: 1,
                curve: .3,
                existing: !1,
                display: function(e) {
                    return e
                }
            },
            lowpassQ: {
                min: 0,
                max: 20,
                step: .1,
                curve: 1,
                dexisting: !1,
                display: function(e) {
                    return Math.round(e)
                }
            }
        }, k = {
            keep: ["s", 'Seamless change'],
            pitch_bend: ["p", 'Pitch bend change'],
            first: ["1", 'Only first in chord'],
            not_first: ["&gt;1", 'Not first in chord'],
            first_beat: ["[", 'Only first beat in chord'],
            not_first_beat: ["[&gt;", 'Not first beat in chord'],
            last_beat: ["]", 'Only last beat in chord'],
            not_last_beat: ["&lt;]", 'Not last beat in chord']
        }, C = {
            sus2: ["S2", ""],
            sus4: ["S4", ""],
            only_third: ["T", ""]
        }, S = {
            chord: {},
            bass: {}
        }, A, T = this, E = window.matchMedia("(min-width: 768px)").matches, L = function(e, t) {
            return "bass" == t ? (e.fifth ? "BF" : e.third ? "BT" : "B" + ((-1 == e.n ? 0 : e.n) + 1)) + (e.fit ? "\xb1" : "") + (e.octave < 0 ? "-".repeat(Math.abs(e.octave)) : e.octave > 0 ? "+".repeat(e.octave) : "") : (e.fifth ? "CF" : e.third ? "CT" : "C" + ((-1 == e.n ? 0 : e.n) + 1)) + (e.octave < 0 ? "-".repeat(Math.abs(e.octave)) : e.octave > 0 ? "+".repeat(e.octave) : "")
        }, I = function(e) {
            return e.octave + (e.fifth ? "f" : e.third ? "3" : "0") + (-1 == e.n ? 0 : e.n) + "," + (e.fit ? "0" : "1") + ((o[e.n] ? e.scaleSteps : 0) + 50)
        }, N = function() {
            let e = ej[r.style.chord.style]
              , t = ej[r.style.bass.style]
              , o = r.style.chord.step || e.step || t4(e.beatDiv)
              , n = r.style.bass.step || t.step || t4(t.beatDiv)
              , s = w[r.style.timeSignature]
              , a = "1:1" == r.style.shuffle ? Math.max(o[1], n[1], s.beats * s.beatDiv) : Math.max(o[1], n[1])
              , i = Math.max(o[0] / o[1] * a, 1)
              , l = Math.max(n[0] / n[1] * a, 1);
            return {
                chordRemap: i % 1 == 0 ? i : 1,
                bassRemap: l % 1 == 0 ? l : 1
            }
        };
        this.update = function() {
            S.chord = {},
            S.bass = {};
            let n = window.matchMedia("(min-width: 667px)").matches
              , s = "";
            o = {};
            let a = function(e, t) {
                let n = I(t);
                return S[e][n] || (S[e][n] = {
                    itemPart: {
                        octave: t.octave,
                        n: t.n,
                        third: t.third,
                        fifth: t.fifth,
                        fit: t.fit,
                        ofs: o[t.n] ? t.scaleSteps : void 0
                    },
                    useOfs: !o[t.n],
                    items: []
                }),
                S[e][n]
            }
              , i = function(e, t, o, n, i) {
                let l = r.style[e];
                l.arpEvents || (l.arpEvents = t.events,
                l.arpLength = t.length);
                let d = ej[l.style], u = l.step || d.step || t4(d.beatDiv), p = w[r.style.timeSignature].beats, f = "", h = 0, m;
                for (let _ in t.events) {
                    let y = t.events[_]
                      , v = y.items
                      , g = Number(_);
                    if (v.forEach(function(t, o) {
                        let n = a(e, t);
                        (n.items[g] || (n.items[g] = [])).push(o)
                    }),
                    y.early && g < l.arpLength) {
                        let b = g * o * u[0] / u[1] * 100
                          , A = "bar" == y.early ? 1 : p
                          , T = (Math.floor(g * u[0] / u[1] * A) + 1) / A * o * 100;
                        f += '<div class="early-change-mark" data-event="editorEarlyChange" data-type="' + e + '" data-index="' + g + '" style="left: ' + b + "%; width: " + (T - b) + '%;"></div>'
                    }
                    if (g < l.arpLength) {
                        let P = x[$]
                          , E = P.existing;
                        ("envelopes" == c && E ? y.items.map(function(e) {
                            return $
                        }) : "envelopes" == c && (y.envelopes && void 0 != y.envelopes[$] || void 0 != P.default && (!P.notesOnly || y.items.length > 0)) ? [$] : "envelopes" != c && y.envelopes ? Object.keys(y.envelopes) : []).forEach(function(t, n) {
                            let s = x[t]
                              , a = "envelopes" == c && E ? y.items[n][$] : y.envelopes && void 0 != y.envelopes[t] ? y.envelopes[t] : s.default
                              , r = Math.pow((a - s.min) / (s.max - s.min), s.curve)
                              , l = g * o * u[0] / u[1] * 100
                              , d = Math.round(((1 - r) * .7 + .15) * 100)
                              , p = u[0] / u[1] * o / i * 100;
                            void 0 == m && (h = d),
                            f += '<div class="envelopes-mark" data-type="' + e + '" data-index="' + g + '" style="left: ' + l + "%; top: " + d + "%; width: " + p + '%;">' + ("envelopes" == c ? s.display(a) : "") + "</div>",
                            h = l,
                            m = d
                        })
                    }
                }
                for (let I in eP.editor.headers[e])
                    a(e, eP.editor.headers[e][I]);
                if ("chord" == e) {
                    let N = 0;
                    for (; Object.keys(S[e]).length < 4; )
                        a(e, {
                            n: N,
                            octave: 0
                        }),
                        N++
                }
                "bass" == e && (Object.keys(S[e]).length < 3 && a(e, {
                    n: 0,
                    octave: 0
                }),
                Object.keys(S[e]).length < 3 && a(e, {
                    n: 0,
                    octave: 1
                }),
                Object.keys(S[e]).length < 3 && a(e, {
                    n: 0,
                    fifth: !0,
                    octave: 0
                }));
                let O = Object.keys(S[e]).sort();
                l.mirror || (O = O.reverse());
                let M = "";
                s += '<div class="left-headers" data-event="editorLeftHeaders" data-type="' + e + '">',
                O.forEach(function(a, c) {
                    let d = S[e][a];
                    M += '<div class="dialog-style-editor-row" data-type="' + e + "\" data-data='" + JSON.stringify(d.itemPart) + "'>",
                    s += '<div data-type="' + e + "\" data-data='" + JSON.stringify(d.itemPart) + "'>" + L(d.itemPart, e) + "</div>";
                    for (let f = 0; f < t.length * n * i; f++) {
                        let h = l.cropLength && f * u[0] / u[1] / i >= l.cropLength || f / i >= t.length
                          , m = u[0] * f / u[1] * p / i
                          , $ = m % p == 0 ? 2 : m == Math.floor(m) ? 1 : 0
                          , _ = l.cropLength ? f % (l.cropLength * u[1] / u[0] * i) % (t.length * i) / i : f / i % t.length
                          , y = t.events[_]
                          , v = d.items[_]
                          , g = "";
                        v && (!h || l.loop) && v.forEach(function(t, o) {
                            let n = y.items[t]
                              , s = [];
                            if (0 != n.scaleSteps && s.push('Scale steps' + " " + (n.scaleSteps > 0 ? "+" : n.scaleSteps < 0 ? "-" : "") + Math.abs(n.scaleSteps)),
                            0 != n.halfSteps && s.push('Half steps' + " " + (n.halfSteps > 0 ? "+" : "") + n.halfSteps),
                            "first" == n.condition && -1 == n.n)
                                s.push('Only first');
                            else if (n.condition) {
                                let a = k[n.condition];
                                s.push(a[0] + " " + a[1])
                            }
                            n.attack > 0 && s.push('Attack' + ": " + n.attack),
                            n.velocity < 1 && s.push('Velocity' + ": " + x.velocity.display(n.velocity)),
                            0 != n.offset && s.push('Offset' + ": " + x.offset.display(n.offset)),
                            n.duration < 1 && s.push('Duration' + ": " + n.duration),
                            n.sustain && s.push("— " + 'Sustain');
                            let l = (n.offset + (y.envelopes && y.envelopes.strum ? y.envelopes.strum > 0 ? y.envelopes.strum * t : -y.envelopes.strum * (y.items.length - 1 - t) : 0)) * u[1] / u[0] / p * i * 100
                              , f = s.join("\n")
                              , h = "chord" == e && n.remaining ? c + 1 : 1;
                            g += '<div data-event="editorItem" data-index="' + t + "\" title='" + f + "' class=\"selected " + e + (0 == n.duration ? " release" : "") + ("first" == n.condition && -1 == n.n || n.condition || n.keep ? " gray" : "") + '" style="' + (n.velocity > 0 && n.velocity < 1 ? "opacity: " + n.velocity + ";" : "") + "line-height: " + 15 * h + "px; height: calc(" + 100 * h + "% + " + (h - 1) + "px); bottom: " + (d.useOfs ? 2 : 0) * (n.scaleSteps + n.halfSteps) + "px; margin-left: " + l + "%;" + (("first" != n.condition || -1 != n.n || n.fifth) && "last_beat" != n.condition ? "" : " xopacity: 0.5;") + (n.remaining ? "z-index: " + (t + 1) + ";" : "") + '">' + (C[n.modify] ? C[n.modify][0] : ("chord" == e && n.remaining,
                            "chord" == e && "first" == n.condition && n.n,
                            /*!itemPart.scaleSteps && !itemPart.halfSteps ?*/
                            "")) + (n.scaleSteps ? (n.scaleSteps > 0 ? "+" : "-") + Math.abs(n.scaleSteps) : "") + (n.halfSteps ? (n.halfSteps > 0 ? "+" : "-") + Math.abs(n.halfSteps) : "") + (n.condition ? k[n.condition][0] : "") + (n.keep ? "s<span>—</span>" : n.sustain || r.style.sustain ? "<span>—</span>" : 0 == n.duration ? "<span>x</span>" : n.duration < 1 ? "<span>\xb7</span>" : "") + "</div>"
                        }),
                        M += '<div class="' + (Math.floor(f / u[1] / i) % 2 ? "odd" : "") + (h ? " gray" : "") + '" data-event="editorItemContainer" data-index="' + f / i + '" style="' + ($ > 0 ? "margin-left: " + $ + "px; " : "") + "flex: 0 0 calc(" + o * u[0] / u[1] / i * 100 + "% - " + $ + 'px);">' + g + "</div>"
                    }
                    M += "</div>"
                }),
                s += "</div>";
                let q = x[$];
                return '<div class="type-container"><div class="envelopes-bg' + (q && q.min < 0 ? " center" : "") + '" style="width: ' + 100 * t.length * n * u[0] / u[1] + '%;"></div><div id="editor-mark-' + e + '" class="mark"></div>' + M + f + "</div>"
            }
              , l = w[r.style.timeSignature]
              , d = ej[r.style.chord.style]
              , u = ej[r.style.bass.style]
              , p = r.style.chord.step || d.step || t4(d.beatDiv)
              , f = r.style.bass.step || u.step || t4(u.beatDiv)
              , h = p[0] / p[1]
              , m = f[0] / f[1]
              , y = N()
              , v = od(r.style.chord)
              , g = od(r.style.bass)
              , b = Math.max(v.length * h, g.length * m, 1) * Math.max(r.style.chord.cropLength || 1, r.style.bass.cropLength || 1);
            e = b;
            let T = Math.min(h / y.chordRemap, m / y.bassRemap) * (n ? 2 : 1)
              , P = 1;
            for (; T > .0625; )
                T /= 2,
                b * (P /= 2) < 1 && (b *= 2);
            for (; T < .05; )
                P *= 2,
                T *= 2;
            t = P;
            let E = "";
            E += '<div class="dialog-style-editor-top">';
            let O = l.beats
              , q = Math.max(p[1] / p[0] * y.chordRemap, f[1] / f[0] * y.bassRemap, O)
              , D = q / O;
            for (let j = 0; j < q * b; j++) {
                let G = j % D == 0 ? 1 : 0;
                E += '<div class="' + (j % D == 0 ? "first" : "") + (j % D == D - 1 ? "last" : "") + '" style="' + (G ? "margin-left: " + G + "px;" : "") + "flex: 0 0 calc(" + 100 / q * P + "% - " + G + 'px);">' + (j % D == 0 ? Math.floor(j / D) % O + 1 : j % (D / 2) == 0 ? "+" : "\xb7") + "</div>"
            }
            E += "</div>",
            E += i("chord", v, P, b / h / v.length, y.chordRemap) + i("bass", g, P, b / m / g.length, y.bassRemap),
            X(J("editor").querySelector(".editor"), "innerHTML", E),
            X(J("editor").querySelector(".left-headers-container"), "innerHTML", s),
            A = J("editor").querySelector(".editor"),
            this.updatePageNav(),
            M(),
            J("editor-chord-right-content").querySelector('[data-type="chord"]').style.height = 20 * Object.keys(S.chord).length + "px",
            X(J("editor-chord-length"), "innerHTML", r.style.chord.arpLength * y.chordRemap),
            X(J("editor-bass-length"), "innerHTML", r.style.bass.arpLength * y.bassRemap),
            X(J("editor-time-signature"), "value", r.style.timeSignature);
            let B = p[1] * y.chordRemap == f[1] * y.bassRemap ? p[1] * y.chordRemap / l.beats : 0
              , R = B * l.beats;
            X(J("editor-beat-div"), "value", B || ""),
            X(J("editor-shuffle").style, "display", R % 2 == 0 ? "inline-block" : "none"),
            X(J("editor-shuffle"), "value", r.style.shuffle),
            _.update()
        }
        ;
        let O = function(e) {
            let t = N()
              , o = "chord" == e ? t.chordRemap : t.bassRemap
              , n = r.style[e]
              , s = {};
            for (let a in n.arpEvents) {
                let i = Number(a) * o
                  , l = n.arpEvents[a];
                s[i] || (s[i] = new td),
                l.items.length > 0 && (s[i].items = l.items),
                l.early && (s[i].early = l.early),
                l.envelopes && (s[i].envelopes = l.envelopes)
            }
            let c = ej[n.style]
              , d = n.step || c.step || t4(c.beatDiv);
            return n.step = [1, d[1] * o / d[0]],
            n.arpEvents = s,
            n.arpLength *= o,
            o
        };
        this.updatePageNav = function() {
            let o = A.scrollLeft / A.clientWidth;
            X(J("editor-prev-page"), "disabled", A.scrollLeft > 0 ? "" : "disabled"),
            X(J("editor-next-page"), "disabled", o < e * t - 1 ? "" : "disabled")
        }
        ;
        let M = function() {
            J("editor").classList.toggle("lock", "early-change" == c || "envelopes" == c),
            J("editor").classList.toggle("early-change", "early-change" == c),
            J("editor").classList.toggle("envelopes", "envelopes" == c),
            X(J("editor-edit-mode"), "innerHTML", g.find(function(e) {
                return c == e[0]
            })[1].replace(/<addr.+?<\/addr>/, "")),
            J("editor").classList.toggle("picker", "picker" == c),
            X(J("editor-envelope-type").style, "display", "envelopes" == c ? "block" : "none"),
            X(J("editor-envelope-type"), "innerHTML", b.find(e => e[0] == $)[1]),
            X(J("editor-duration-type"), "innerHTML", y.find(function(e) {
                return e[0] == (r.style.sustain ? "sustain" : s)
            })[1]),
            X(J("editor-duration-type").style, "display", "early-change" == c || "envelopes" == c || "picker" == c ? "none" : "block"),
            X(J("editor-config").style, "display", "early-change" == c || "envelopes" == c || "picker" == c ? "none" : "block")
        };
        this.startPlaying = function() {
            J("editor").classList.add("playing"),
            n = A.scrollLeft
        }
        ,
        this.stopPlaying = function() {
            J("editor").classList.remove("playing")
        }
        ,
        this.setMark = function(o, n) {
            let s = J("editor-mark-" + n, !0);
            if (!s)
                return;
            let a = p.currentChordItem()
              , i = p.started() && a && tp.typeInfo(a.type).playing;
            if (X(s.style, "visibility", i ? "inherit" : "hidden"),
            !i)
                return;
            let l, c = o / w[r.style.timeSignature].beats % (r.style[n].loop ? e : 9999) * t;
            s.style.left = 100 * c + "%"
        }
        ;
        let q = function(e) {
            if (r.style.preset = void 0,
            (!e || "chord" == e) && (r.style.chord.style = "arpeggio",
            r.style.chord.keep = !1,
            !r.style.chord.step)) {
                let t = ej[r.style.chord.style];
                r.style.chord.step = t.step || t4(t.beatDiv)
            }
            if ((!e || "bass" == e) && (r.style.bass.style = "arpeggio",
            !r.style.bass.step)) {
                let o = ej[r.style.bass.style];
                r.style.bass.step = o.step || t4(o.beatDiv)
            }
            nx()
        }
          , D = function(e, t) {
            let o = r.style[e]
              , n = o.arpEvents
              , s = ej[r.style[e].style]
              , a = o.step || s.step || t4(s.beatDiv);
            if (t >= (o.cropLength ? Math.min(a[1] / a[0] * o.cropLength, o.arpLength) : o.arpLength)) {
                let i = o.arpLength, l = o.cropLength || o.arpLength * a[0] / a[1] < 1 ? Math.ceil(Math.floor(t + 1) * a[0] / a[1] / (o.cropLength || 1)) * a[1] / a[0] * (o.cropLength || 1) : Math.ceil(Math.floor(t + 1) / i) * i, c;
                if (o.cropLength) {
                    for (let d in c = o.cropLength / (a[0] / a[1]),
                    n)
                        Number(d) * a[0] / a[1] >= o.cropLength && delete n[d];
                    let u = o.cropLength / (a[0] / a[1]);
                    o.arpLength > u && (o.arpLength = u)
                }
                for (; o.arpLength < l; ) {
                    if (o.loop) {
                        let p = n[(o.cropLength ? o.arpLength % c : o.arpLength) % i];
                        p && (n[o.arpLength] = {
                            items: p.items.map(function(e) {
                                return new tu(e)
                            }),
                            early: p.early,
                            envelopes: Object.assign({}, p.envelopes)
                        })
                    }
                    o.arpLength++
                }
                return o.cropLength = 0,
                q(e),
                ou(),
                !0
            }
            return !1
        }
          , j = function(e, t, o) {
            let n = r.style[e];
            if (o) {
                let s = ej[r.style[e].style]
                  , a = n.step || s.step || t4(s.beatDiv)
                  , i = {};
                for (let l in n.arpEvents) {
                    let c = Math.round(Number(l) * (a[0] / a[1]) / (t[0] / t[1]));
                    if (!i[c]) {
                        i[c] = new td;
                        let d = n.arpEvents[l];
                        i[c].items = d.items,
                        i[c].early = i[c].early || d.early || "",
                        i[c].envelopes = i[c].envelopes || d.envelopes || null
                    }
                }
                n.style = "arpeggio",
                n.arpEvents = i,
                n.arpLength = Math.round(n.arpLength * (a[0] / a[1]) / (t[0] / t[1]))
            }
            n.step = t
        };
        window.addEventListener("focus", function(e) {
            J("editor").classList.remove("picker")
        }),
        window.addEventListener("keydown", function(e) {
            "AltLeft" == e.code && "picker" != c && J("editor").classList.add("picker"),
            "ShiftLeft" == e.code && J("editor").classList.add("addition")
        }),
        window.addEventListener("keyup", function(e) {
            "AltLeft" == e.code && "picker" != c && J("editor").classList.remove("picker"),
            "ShiftLeft" == e.code && J("editor").classList.remove("addition")
        }),
        J("editor-time-signature").innerHTML = P(),
        J("editor-time-signature").onchange = function() {
            let e = JSON.parse(JSON.stringify(r));
            r.style.preset = void 0,
            r.style.timeSignature = this.value,
            r.style.shuffle = "1:1",
            ej[r.style.chord.style],
            ej[r.style.bass.style],
            nv(r, e);
            let t = w[r.style.timeSignature]
              , o = [1, t.beats * (3 == t.beatDiv ? 6 : t.beatDiv)];
            j("chord", o, !0),
            j("bass", o, !0),
            o8("Updated time signature"),
            oQ(),
            ou(),
            p.replaySequence(),
            tO()
        }
        ,
        J("editor-beat-div").onchange = function() {
            if ("" == this.value) {
                T.update();
                return
            }
            let e = Number(this.value)
              , t = [1, w[r.style.timeSignature].beats * e];
            j("chord", t, !0),
            j("bass", t, !0),
            r.style.preset = void 0,
            r.style.shuffle = "1:1",
            o8("Updated beat division"),
            ou(),
            p.replaySequence(),
            tO()
        }
        ,
        J("editor-shuffle").onchange = function(e) {
            r.style.shuffle = e.target.value,
            r.style.preset = void 0,
            o8("Updated shuffle"),
            ou(),
            p.replaySequence(),
            tO()
        }
        ,
        W[E ? G : H].editorTrackLoop = function(e, t) {
            let o = t.parentNode.dataset.type;
            r.style[o].loop = !r.style[o].loop,
            T.update(),
            o8("Toggled pattern loop"),
            ev(("chord" == o ? 'Chord' : 'Bass') + ": " + 'Loop' + " " + (r.style[o].loop ? 'On' : 'Off').toLowerCase())
        }
        ,
        W[E ? G : H].editorTrackShowOptions = function(e, t) {
            n0(t.parentNode.dataset.type)
        }
        ,
        W[E ? G : H].editorTrackLength = function(e, t) {
            let o = t.parentNode.dataset.type
              , n = r.style[o]
              , s = n.step[1] / n.step[0]
              , a = prompt('Length' + "  (1 " + 'Bar'.toLowerCase() + " = " + s + ")", n.arpLength);
            if (null == a)
                return;
            let i = Number(a);
            !isNaN(i) && (n.arpLength = Math.min(Math.max(i, 1), 16 * s),
            n.cropLength = n.arpLength < s ? 1 : 0,
            q(o),
            ou(),
            T.update(),
            o8("Updated " + o + " pattern length to " + i))
        }
        ,
        W[E ? G : H].editorTrackChangeLength = function(e, t) {
            let o = t.parentNode.dataset.type
              , n = Number(t.dataset.amount)
              , s = r.style[o];
            O(o);
            let a = s.step[1] / s.step[0];
            if (n > 0 && s.arpLength >= a) {
                if (s.arpLength < 16 * a) {
                    let i = Math.floor(a);
                    for (; i <= s.arpLength; )
                        i *= 2;
                    s.arpLength = i
                }
            } else if (n < 0 && s.arpLength > a) {
                let l = Math.floor(a);
                for (; 2 * l < s.arpLength; )
                    l *= 2;
                s.arpLength = l
            } else
                s.arpLength = Math.max(s.arpLength + n, 1);
            s.cropLength = s.arpLength < a ? 1 : 0,
            q(o),
            ou(),
            T.update(),
            o8("Updated " + o + " pattern length " + (n > 0 ? "+" + n : n))
        }
        ,
        W[E ? G : H].editorNextPage = function() {
            A.scrollLeft += A.clientWidth,
            T.updatePageNav()
        }
        ,
        W[E ? G : H].editorPrevPage = function() {
            A.scrollLeft -= A.clientWidth,
            T.updatePageNav()
        }
        ,
        W[E ? G : H].editorDurationType = function(e, t) {
            eg({
                elem: t,
                direction: "left-down",
                value: r.style.sustain ? "sustain" : s,
                options: y,
                onSelect: function(e) {
                    if ("sustain" == e)
                        confirm('Enable sustain on all notes through the chord?') && (r.style.sustain = "chord",
                        T.update(),
                        o8("Enabled sustained notes"));
                    else {
                        if (r.style.sustain) {
                            if (!confirm('Disable sustain on all notes through the chord?'))
                                return;
                            r.style.sustain = "",
                            T.update(),
                            o8("Disabled sustained notes")
                        }
                        s = e,
                        M()
                    }
                }
            })
        }
        ,
        W[E ? G : H].editorEditMode = function(e, t) {
            eg({
                elem: t,
                direction: "left-down",
                value: c,
                options: g,
                onSelect: function(e) {
                    c = e,
                    T.update()
                }
            })
        }
        ,
        W[E ? G : H].editorEnvelopeType = function(e, t) {
            let o = {};
            ["chord", "bass"].forEach(function(e) {
                let t = r.style[e]
                  , n = t.arpEvents;
                for (let s in n) {
                    let a = n[s];
                    if (Number(s) < t.arpLength && a.envelopes)
                        for (let i in a.envelopes)
                            o[i] = (o[i] || 0) + 1
                }
            }),
            eg({
                elem: t,
                direction: "left-down",
                value: $,
                options: b.map(function(e) {
                    return [e[0], e[1] + (o[e[0]] ? ' <span style="pointer-events: none; opacity: 0.5;">(' + o[e[0]] + ")</span>" : "")]
                }),
                onSelect: function(e) {
                    $ = e,
                    T.update()
                }
            })
        }
        ,
        W[E ? G : H].editorMoreMenu = function(e, t) {
            let o = function(e) {
                let t = r.style[e]
                  , o = function() {
                    let o = t.arpEvents;
                    for (let n in o) {
                        let s = Number(n)
                          , a = o[s];
                        if (s >= t.arpLength) {
                            delete o[s];
                            break
                        }
                        o[t.arpLength + s] = {
                            items: a.items.map(function(e) {
                                return new tu(e)
                            }),
                            early: a.early,
                            envelopes: Object.assign({}, a.envelopes)
                        }
                    }
                    t.arpLength *= 2,
                    q(e),
                    ou(),
                    T.update(),
                    o8("Duplicate " + e)
                }
                  , n = function() {
                    r.style[e].arpEvents = {},
                    q(e),
                    ou(),
                    T.update(),
                    o8("Deleted all " + e)
                }
                  , s = function() {
                    let o = t.arpEvents;
                    for (let n in o)
                        o[n].envelopes = null;
                    q(e),
                    ou(),
                    T.update(),
                    o8("Deleted automations " + e)
                }
                  , a = b.find(e => e[0] == $)[1]
                  , i = function() {
                    let o = prompt('Scale' + " " + a.toLowerCase() + " (%)", 100);
                    if (null == o)
                        return;
                    let n = Number(o) / 100
                      , s = t.arpEvents
                      , i = x[$];
                    for (let r in s)
                        if ("velocity" == $)
                            s[r].items.forEach(function(e) {
                                e.velocity = Math.min(Math.max(e.velocity * n, 0), 1)
                            });
                        else {
                            let l = s[r].envelopes;
                            l && (l[$] = Math.min(Math.max(l[$] * n, i.min), i.max))
                        }
                    q(e),
                    ou(),
                    T.update(),
                    o8("Scale " + a.toLowerCase())
                }
                  , l = function() {
                    let o = prompt('Offset' + " " + a.toLowerCase(), 0);
                    if (null == o)
                        return;
                    let n = Number(o)
                      , s = t.arpEvents
                      , i = x[$];
                    for (let r in s)
                        if ("velocity" == $)
                            s[r].items.forEach(function(e) {
                                e.velocity = Math.min(Math.max(e.velocity + n / 100, 0), 1)
                            });
                        else {
                            let l = s[r].envelopes;
                            l && (l[$] = Math.min(Math.max(l[$] + n, i.min), i.max))
                        }
                    q(e),
                    ou(),
                    T.update(),
                    o8("Offset " + a.toLowerCase())
                }
                  , c = [];
                c.push({
                    name: 'Duplicate sequence',
                    onSelect: function() {
                        o()
                    }
                }),
                c.push({
                    name: 'Delete sequence',
                    onSelect: function() {
                        n()
                    }
                }),
                c.push({
                    name: 'Delete automations',
                    onSelect: function() {
                        s()
                    }
                }),
                c.push({
                    name: 'Scale' + " " + a.toLowerCase(),
                    onSelect: function() {
                        i()
                    }
                }),
                c.push({
                    name: 'Offset' + " " + a.toLowerCase(),
                    onSelect: function() {
                        l()
                    }
                }),
                et({
                    title: "chord" == e ? 'Edit chord sequence' : 'Edit Bass sequence',
                    buttons: c,
                    verticalButtons: !0
                })
            }
              , n = [];
            n.push({
                name: 'Edit chord sequence',
                onSelect: function() {
                    o("chord")
                }
            }),
            n.push({
                name: 'Edit bass sequence',
                onSelect: function() {
                    o("bass")
                }
            }),
            et({
                title: 'Editor menu',
                buttons: n,
                verticalButtons: !0
            })
        }
        ,
        W[E ? G : H].editorConfig = function(e, t) {
            let o = function() {
                let e = "";
                for (let n = -7; n <= 7; n++)
                    e += '<option value="' + n + '">' + (n > 0 ? "+" : "") + n + "</option>";
                let c = "";
                for (let p = -7; p <= 7; p++)
                    c += '<option value="' + p + '">' + (p > 0 ? "+" : "") + p + "</option>";
                let $ = eg({
                    elem: t,
                    direction: "left-down",
                    content: '<div style="width: 300px; padding: 10px;"><div class="form-control"><div class="label">' + 'Duration' + '</div><input id="editor-config-duration" type="range" min="0.01" max="1" step="0.01" /></div><div class="form-control"><div class="label">' + 'Velocity' + '</div><input id="editor-config-velocity" type="range" min="0.01" max="1" step="0.01" /></div><!--div class="form-control"><div class="label">' + 'Attack' + '</div><input id="editor-config-attack" type="range" min="0" max="1" step="0.01" /></div--><div class="form-control"><div class="label">' + 'Scale steps' + '</div><div class="value-buttons"><button data-event="editorConfigScaleStep" data-amount="-1" class="button">-</button><select class="value-control" id="editor-config-scale-steps" style="width: auto;">' + e + '</select><button data-event="editorConfigScaleStep" data-amount="1" class="button">+</button></div></div><div class="form-control"><div class="label">' + 'Half steps' + '</div><div class="value-buttons"><button data-event="editorConfigHalfStep" data-amount="-1" class="button">-</button><select class="value-control" id="editor-config-half-steps" style="width: auto;">' + c + '</select><button data-event="editorConfigHalfStep" data-amount="1" class="button">+</button></div></div><!--div class="form-control"><div class="label">' + 'Early change' + '</div><select id="editor-config-early" class="items"><option value="">' + 'No' + '</option><option value="beat">' + 'Next beat' + '</option><option value="bar">' + 'Next bar' + '</option></select></div--><div class="form-control"><div class="label">' + 'Condition' + '</div><select id="editor-config-conditional" class="items"><option value="">' + 'No' + '</option><option value="first">1 ' + 'Only first in chord' + '</option><option value="not_first">&gt;1 ' + 'Not first in chord' + '</option><option value="first_beat">[ ' + 'Only first beat in chord' + '</option><option value="not_first_beat">&gt;[ ' + 'Not first beat in chord' + '</option><option value="last_beat">] ' + 'Only last beat in chord' + '</option><option value="not_last_beat">&lt;] ' + 'Not last beat in chord' + '</option><option value="keep">s ' + 'Seamless change' + '</option><!--option value="pitch_bend">p ' + 'Pitch bend change' + '</option--></select></div><div class="form-control"><div class="label">' + 'Modification' + '</div><select id="editor-config-modify" class="items"><option value="">' + 'No' + '</option><option value="sus2">' + 'Chord' + ' sus2</option><option value="sus4">' + 'Chord' + ' sus4</option><option value="only_third">' + 'Only third' + '</option></select></div><div class="buttons buttons-horizontal"><button id="editor-config-ok">' + 'Close' + '</button><button id="editor-config-reset">' + 'Reset' + "</button></div></div>"
                }), _ = function() {
                    J("editor-config-reset").disabled = 0 == i && 0 == a && "" == d && "" == u && 1 == h && 1 == f ? "disabled" : ""
                }, y, v = 0;
                J("editor-config-duration").value = f,
                J("editor-config-duration").parentNode.style.display = "default" == s ? "block" : "none",
                J("editor-config-duration").oninput = function() {
                    f = Number(this.value),
                    y || (y = setInterval(function() {
                        let e = v++ % 2 == 0 ? "chord" : "bass"
                          , t = "chord" == e ? 60 : 36;
                        o9.press(e, t, h * Math.max(r.style.chord.velocity, r.style[e].velocity)),
                        o9.release(e, t, l.current().context.currentTime + f * r.style[e].noteDuration * t3() / 2)
                    }, 500)),
                    W[B].all = function() {
                        clearTimeout(y),
                        y = void 0
                    }
                }
                ,
                J("editor-config-duration").onchange = function() {
                    f = Number(this.value),
                    _()
                }
                ;
                let g, b = 0;
                J("editor-config-velocity").value = h,
                J("editor-config-velocity").parentNode.style.display = "release" != s ? "block" : "none",
                J("editor-config-velocity").oninput = function() {
                    h = Number(this.value),
                    g || (g = setInterval(function() {
                        let e = b++ % 2 == 0 ? "chord" : "bass"
                          , t = "chord" == e ? 60 : 36;
                        o9.press(e, t, h * r.style[e].velocity),
                        o9.release(e, t, l.current().context.currentTime + .1)
                    }, 500)),
                    W[B].all = function() {
                        clearTimeout(g),
                        g = void 0
                    }
                }
                ,
                J("editor-config-velocity").onchange = function() {
                    h = Number(this.value),
                    _()
                }
                ,
                J("editor-config-scale-steps").value = a,
                J("editor-config-scale-steps").onchange = function() {
                    a = Number(this.value),
                    _()
                }
                ,
                W[G].editorConfigScaleStep = function(e, t) {
                    a = Math.min(Math.max(a + Number(t.dataset.amount), -7), 7),
                    J("editor-config-scale-steps").value = a,
                    _()
                }
                ,
                J("editor-config-half-steps").value = i,
                J("editor-config-half-steps").onchange = function() {
                    i = Number(this.value),
                    _()
                }
                ,
                W[G].editorConfigHalfStep = function(e, t) {
                    i = Math.min(Math.max(i + Number(t.dataset.amount), -7), 7),
                    J("editor-config-half-steps").value = i,
                    _()
                }
                ,
                J("editor-config-conditional").value = d,
                J("editor-config-conditional").onchange = function() {
                    d = this.value,
                    _()
                }
                ,
                J("editor-config-modify").value = u,
                J("editor-config-modify").onchange = function() {
                    u = this.value,
                    _()
                }
                ,
                J("editor-config-ok").onclick = function() {
                    $.hide()
                }
                ,
                J("editor-config-reset").onclick = function() {
                    f = 1,
                    h = 1,
                    m = 0,
                    i = 0,
                    a = 0,
                    d = "",
                    u = "",
                    $.hide(),
                    o()
                }
                ,
                _()
            };
            o()
        }
        ;
        let R = function(e, t) {
            let o = new tu(e);
            return r.style.sustain || "hold" != s || (o.sustain = !0),
            o.duration = "release" == s ? 0 : f,
            o.velocity = h,
            o.attack = m,
            o.scaleSteps = a,
            o.halfSteps = i,
            "first" == d ? o.condition = "first" : d && (o.condition = d),
            u && "bass" != t && (o.remaining = !0,
            o.n = 0,
            u && (o.modify = u)),
            "chord" == t && "voice" != c && ("chord" == c && (o.n = 0),
            o.remaining = !0),
            o
        };
        W[E ? G : H].editorItem = function(e, t) {
            let o = Number(t.dataset.index)
              , n = t.parentNode
              , l = n.parentNode
              , p = l.dataset.type
              , $ = Number(n.dataset.index)
              , _ = r.style[p]
              , y = ej[r.style[p].style]
              , v = _.step || y.step || t4(y.beatDiv)
              , g = 1 / (v[0] / v[1]);
            if (($ != Math.floor($) || g != Math.floor(g)) && ($ *= O(p)),
            D(p, $)) {
                tO(),
                o8("Extended pattern");
                return
            }
            let b = _.arpEvents
              , x = b[$]
              , k = x.items[o];
            if ("picker" == c || e.altKey) {
                f = k.duration,
                h = k.velocity,
                m = k.attack,
                d = k.condition,
                u = k.modify,
                a = k.scaleSteps,
                i = k.halfSteps,
                s = k.sustain ? "hold" : 0 == k.duration ? "release" : "default",
                c = k.remaining ? 0 == k.n ? "chord" : "remaining" : "voice",
                M();
                return
            }
            R(JSON.parse(l.dataset.data), p),
            x.items.splice(o, 1),
            0 != x.items.length || x.early || x.envelopes || delete b[$],
            q(p),
            ou(),
            T.update(),
            o8("Deleted style note")
        }
        ,
        W[E ? G : H].editorEarlyChange = function(e, t) {
            let o = t.dataset.type
              , n = Number(t.dataset.index)
              , s = r.style[o].arpEvents;
            delete s[n].early,
            0 == s[n].items.length && delete s[n],
            r.style.preset = void 0,
            ou(),
            o8("Removed early change"),
            T.update()
        }
        ;
        let V = 0;
        return W[E ? G : H].editorItemContainer = function(e, t) {
            let o = Number(t.dataset.index)
              , n = t.parentNode
              , s = n.dataset.type
              , a = r.style[s]
              , i = ej[r.style[s].style]
              , l = a.step || i.step || t4(i.beatDiv)
              , d = 1 / (l[0] / l[1])
              , u = w[r.style.timeSignature].beats;
            if ("picker" == c || e.altKey)
                return;
            if ((o != Math.floor(o) || d != Math.floor(d)) && (o *= O(s)),
            D(s, o) && a.loop) {
                tO(),
                o8("Extended pattern");
                return
            }
            let f = a.arpEvents;
            if (f[o] || (f[o] = new td),
            "early-change" == c) {
                let h = u
                  , m = Math.floor(o * l[0] / l[1] * h);
                for (let _ in f) {
                    let y = Number(_);
                    Math.floor(y * l[0] / l[1] * h) == m && (f[y].early = "")
                }
                f[o].early = "beat",
                q(s),
                ou(),
                o8("Updated early change"),
                T.update();
                return
            }
            if ("envelopes" == c) {
                let g = t.closest(".type-container").getBoundingClientRect()
                  , k = x[$]
                  , C = Math.pow(Math.min(Math.max((1 - (e.clientY - g.y) / g.height) * 1.3 - .15, 0), 1), 1 / k.curve) * (k.max - k.min) + k.min;
                C = Math.round(Math.round(C / k.step) * k.step * 1e4) / 1e4;
                let S = performance.now() - V < 300 || e.ctrlKey || 2 == e.button;
                if (k.existing)
                    f[o].items.forEach(function(e) {
                        e[$] = S && void 0 != k.default ? k.default : C
                    });
                else {
                    if (k.notesOnly && 0 == f[o].items.length)
                        return;
                    f[o].envelopes || (f[o].envelopes = {}),
                    S ? delete f[o].envelopes[$] : f[o].envelopes[$] = C,
                    0 == Object.keys(f[o].envelopes) && (f[o].envelopes = null)
                }
                V = performance.now(),
                q(s),
                ou(),
                o8("Updated " + b.find(function(e) {
                    return e[0] == $
                })[1].toLowerCase() + " " + k.display(C)),
                T.update();
                return
            }
            let A = R(JSON.parse(n.dataset.data), s);
            f[o].items.find(function(e) {
                return JSON.stringify(e) == JSON.stringify(A)
            }) || f[o].items.push(A),
            f[o].items = f[o].items.sort(function(e, t) {
                return e.n - t.n
            }),
            q(s),
            ou(),
            o8("Inserted style note"),
            p.previewArp(A, s),
            E ? (v && T.update(),
            W[B].all = function() {
                v || T.update(),
                delete W[B].all,
                o9.releaseAll()
            }
            ) : (T.update(),
            setTimeout(function() {
                o9.releaseAll()
            }, 100))
        }
        ,
        W[H].editorLeftHeaders = function(e, t) {
            let o = t.dataset.type
              , n = {
                chord: [{
                    n: 0,
                    octave: 0
                }, {
                    n: 1,
                    octave: 0
                }, {
                    n: 2,
                    octave: 0
                }, {
                    n: 3,
                    octave: 0
                }, {
                    n: 4,
                    octave: 0
                }, {
                    n: 5,
                    octave: 0
                }, {
                    n: 6,
                    octave: 0
                }, {
                    n: 7,
                    octave: 0
                }, {
                    n: 8,
                    octave: 0
                }, ],
                bass: [{
                    n: 0,
                    octave: 0
                }, {
                    n: 1,
                    octave: 0
                }, {
                    n: 2,
                    octave: 0
                }, {
                    n: 3,
                    octave: 0
                }, {
                    n: 0,
                    octave: 0,
                    fifth: !0
                }, {
                    n: 0,
                    octave: 0,
                    fifth: !0,
                    fit: !0
                }, ]
            }
              , s = {
                chord: {},
                bass: {}
            }
              , a = {
                chord: {},
                bass: {}
            }
              , i = {};
            for (let l = -1; l <= 3; l++)
                n[o].forEach(function(e) {
                    if (0 != l && e.fit)
                        return;
                    let t = Object.assign({}, e, {
                        octave: l
                    });
                    i[I(t)] = {
                        itemPart: t,
                        items: []
                    }
                });
            for (let c in S[o])
                i[c] = S[o][c];
            let d = Object.keys(i).sort();
            r.style[o].mirror || (d = d.reverse());
            let u = "";
            u += '<div style="margin-bottom: 10px;">' + 'Octave' + ' <div id="left-headers-tabs" class="buttons buttons-horizontal buttons-small">';
            for (let p = -1; p <= 3; p++)
                u += '<button data-event="headersOctave" data-octave="' + p + '">' + p + "</button>";
            u += "</div></div>",
            u += '<div id="left-headers-checkboxes" class="items" style="padding: 10px;">',
            d.forEach(function(e) {
                var t, n;
                let r = i[e];
                s[o][e] = eP.editor.headers[o][e] || S[o][e],
                a[o][e] = r.itemPart,
                u += '<div data-octave="' + r.itemPart.octave + '"><label><input type="checkbox" data-event="headersCheckbox" data-type="' + o + '" name="' + e + '"' + (s[o][e] ? ' checked="checked"' : "") + (r.items.length > 0 ? ' disabled="disabled"' : "") + ' /><span><span style="display: inline-block; width: 50px;">' + L(r.itemPart, o) + "</span><span>" + (t = r.itemPart,
                'Tone' + " " + (t.n + 1) + (t.fifth ? " + " + 'Fifth'.toLowerCase() : "") + (t.fit ? ", " + 'In range'.toLowerCase() : "")) + "</span></span></label></div>"
            }),
            u += "</div>";
            let f, h = function(e) {
                void 0 != f && J("left-headers-tabs").querySelector('button[data-octave="' + f + '"]').classList.remove("selected"),
                J("left-headers-tabs").querySelector('button[data-octave="' + e + '"]').classList.add("selected"),
                J("left-headers-checkboxes").querySelectorAll("div[data-octave]").forEach(function(t) {
                    t.style.display = t.dataset.octave == e ? "block" : "none"
                }),
                f = e
            };
            W[H].headersOctave = function(e, t) {
                h(Number(t.dataset.octave))
            }
            ,
            W[U].headersCheckbox = function(e, t) {
                s[t.dataset.type][t.name] = t.checked
            }
            ,
            et({
                title: 'Available tones',
                description: u,
                onSelect: function() {
                    for (let e in eP.editor.headers[o] = {},
                    s)
                        for (let t in s[e])
                            s[e][t] ? eP.editor.headers[e][t] = a[e][t] : delete eP.editor.headers[e][t];
                    tO()
                },
                onCancel: function() {}
            }),
            h(0)
        }
        ,
        _ = new em("editor-tempo",{
            min: 30,
            max: 200,
            step: 1,
            title: "Tempo",
            customValue: {
                max: 300
            },
            onData: function() {
                return r.style.tempo
            },
            onInput: function(e) {
                r.style.tempo = e,
                p.startExampleChord()
            },
            onChange: function(e) {
                o8("Updated tempo to " + e + " BPM"),
                oQ()
            },
            onRender: function(e) {
                return e + " BPM"
            },
            onClose: function() {
                p.replaySequence(),
                p.isSequencePlaying() || p.stopChord()
            }
        }),
        this
    }, tX = new function() {
        let e = this
          , t = 0
          , o = [["5maj 7maj 0maj"], ["7maj 7dom7 0maj"], ["5maj_2 7dom7 0maj"], ["5maj 5sus2 0maj"], ["2min7 7dom7 0maj"], ["2dom7 7dom7 0maj"], ["7maj 11min7b5 0maj"], ["7dom7sus4 7dom7 0maj"], ["9min 7maj_4 0maj"], ["5maj 5min 0maj"], ["10maj 5maj 0maj"], ["8maj 10maj 0maj"], ["8maj7 10maj6add9 0maj"], ["2min7b5 7dom7b9 0maj"], ["5min 7min 0min"], ["3maj 10maj_4 0min"], ["8maj 10maj 0min"], ["8maj7 10maj6add9 0min"], ["7min 7dom7 0min"], ["2min7b5 7dom7 0min"]];
        this.reset = function() {
            t = "aeolian" == r.scale ? 9 : 0,
            this.update()
        }
        ,
        this.update = function() {
            let e = ""
              , n = te.get(r.scale)
              , s = te.get(to[n.scaleGroup][0])
              , a = s.steps[n.offset]
              , i = u.chordControlEnabled ? to[n.scaleGroup][eP.currentMode] : r.scale;
            te.get(i);
            let l = {};
            o.sort(function(e, t) {
                return Math.abs(e[2] - a) - Math.abs(t[2] - a)
            }).forEach(function(o) {
                let n = o[0].split(" ")
                  , s = !0
                  , c = "";
                n.forEach(function(e, o) {
                    let d = e.match(/^(\d+)([^_]+)(?:_(\d+))?/)
                      , p = Number(d[1])
                      , f = L(p + t - a, 12)
                      , h = d[2]
                      , m = eP.cadencesPedalPoint ? L(-p, 12) : d[3] ? Number(d[3]) : 0;
                    m > 0 && "maj7" == h && (h = "maj");
                    let $ = ob(h, f, m, i);
                    o != n.length - 1 || $ || (s = !1);
                    let _ = '<span style="' + ($ ? "" : "font-style: italic; ") + (0 == p ? "font-weight: bold; " : "") + '">' + tj(h, f + ("number" == u.chordNotation ? eP.transpose + eP.keyChange : 0), m, tN(t5(r.scaleKey) + ("number" == u.chordNotation ? 0 : eP.transpose + eP.keyChange)), u.chordNotation) + "</span>"
                      , y = l[h] = (l[h] || 10) + 1
                      , v = new tp({
                        bassPos: m,
                        rootPos: L(f + eP.transpose + eP.keyChange, 12),
                        transpose: eP.transpose,
                        keyChange: eP.keyChange,
                        chord: h
                    });
                    c += '<button id="' + h + "-" + f + "-" + m + "-" + y + '" data-event="chordPad" class="chord-pad" data-chord-pad="1" data-chord-item=\'' + JSON.stringify(v) + "' data-extra=\"" + y + '">' + _ + '<br/><span class="weak" style="font-size: 9px;">' + tN(f - a, "aeolian", "C", "number") + "</span></button>"
                }),
                e += s ? '<div class="chord-progression">' + c + "</div>" : ""
            }),
            X(J("cadences"), "innerHTML", e);
            let c = ""
              , d = s.steps[n.offset];
            "aeolian" != i && "ionian" != i || u.chordControlEnabled && eP.currentMode != n.offset || [["maj", 0], ["min", 9]].forEach(function(e) {
                c += '<button data-event="cadenceMode" data-value="' + e[1] + '" ' + (t == e[1] ? 'class="highlighted"' : "") + ">" + tj(e[0], e[1] - d, 0, tN(t5(r.scaleKey) + eP.transpose + eP.keyChange)) + "</button>"
            }),
            X(J("cadences-mode-buttons"), "innerHTML", c)
        }
        ,
        W[H].cadenceMode = function(o, n) {
            t = Number(n.dataset.value),
            e.update()
        }
    }
    , tJ = function(e, t) {
        let o = ""
          , n = te.get(r.scale)
          , s = u.chordControlEnabled ? to[n.scaleGroup][void 0 != t ? t : eP.currentMode] : r.scale
          , a = te.get(s)
          , i = s;
        nT.parallell && (i = "ionian" == r.scale ? "aeolian" : "aeolian" == r.scale ? "ionian" : r.scale);
        let l = te.get(i);
        t5(r.scaleKey),
        e7 = {};
        let c = 0
          , d = eP.transpose + (nT.halfDown ? -1 : nT.halfUp ? 1 : 0)
          , p = void 0 != e ? e : eP.keyChange
          , f = {
            halfDown: 'Lower chords a half step',
            halfUp: 'Raise chords a half step',
            diminished: "Diminished 7ths",
            dominant: 'Dominant chords',
            advanced: 'Slash chords'
        }
          , h = [];
        for (let m in nT)
            f[m] && h.push(f[m]);
        let $ = !0
          , _ = {}
          , y = /b2|#4/
          , v = a.charPitches
          , g = function(e, s, a, i) {
            let l = te.get(i);
            o += '<div class="chords-row' + ("diatonic-triad" == e && 0 == a ? " big" : "") + '">',
            [0, 1, 2, 3, 4, 5, 6].forEach(function(f, h) {
                "number" == u.chordNotation && (h = L(h - n.offset, 7));
                let m;
                if (e) {
                    let $ = tG(e, h, l.value);
                    $ && (u.showUnusualChords || !$.match(y)) && (m = ti.parseType($).name)
                } else
                    m = s;
                let g = 'class="chord-pad"';
                if (!m || void 0 == l.steps[h]) {
                    o += "<div " + g + ' data-chord-pad="1"></div>';
                    return
                }
                let b = ti.parseType(m).positions[a]
                  , x = ti.parseType(tD(m, b))
                  , k = tq(tj(x.name, l.steps[h] + ("number" == u.chordNotation ? p + d : 0), b, tN(t5(r.scaleKey) + ("number" == u.chordNotation ? 0 : p + d)), u.chordNotation, i) || "-")
                  , C = !1;
                v && x.positions.forEach(function(e) {
                    v.indexOf((e + l.steps[h]) % 12) > -1 && (C = !0)
                });
                let S = L(l.steps[h] + p + d, 12)
                  , A = x.name + "," + S + "," + b
                  , T = _[A] || 0;
                _[A] = T + 1;
                let w = x.name + "-" + S + "-" + b + "-" + T
                  , P = "default" == u.chordNotation ? "" : t6(tj(x.name, S, b, tN(t5(r.scaleKey)), "default") || "-")
                  , E = tr(eM[c] && eM[c][f]);
                E && (P += (P ? "\n" : "") + 'Key' + ": " + String.fromCharCode(E),
                e7[E] = w);
                let I = JSON.stringify({
                    chord: x.name,
                    rootPos: S,
                    bassPos: b,
                    transpose: d,
                    keyChange: p
                });
                o += "<button " + (P ? 'title="' + P + '" ' : "") + 'id="' + w + '" ' + g + ' data-event="chordPad" data-chord-pad="1" data-extra="' + T + "\" data-chord-item='" + I + "'" + (void 0 != t && u.chordControlEnabled && v && C ? ' style="text-decoration: underline;"' : "") + ">" + k + ("default" != u.chordNotation && k && -1 == k.indexOf("sup") ? "<sup>&nbsp;&nbsp;</sup>" : "") + "</button>"
            }),
            o += "</div>",
            c++
        }
          , b = function(e) {
            tn.forEach(function(t) {
                if (-1 == Object.keys(r.chordLayout).indexOf(t.value))
                    return;
                let o = t.value
                  , n = 0;
                eP.chordsAdd && ("diatonic-sus2" == o && (o = "diatonic-add2"),
                "diatonic-sus4" == o && (o = "diatonic-add4")),
                eP.chordsExt && ("diatonic-7" == o && (o = "diatonic-9"),
                "diatonic-sus2" == o && (o = "diatonic-7sus2"),
                "diatonic-triad" == o && (o = "diatonic-7"),
                "diatonic-sus4" == o && (o = "diatonic-7sus4")),
                (nT.dominant || eP.chordsDom) && ("diatonic-7" == o && (o = "dom7"),
                "diatonic-9" == o && (o = "dom9"),
                "diatonic-11" == o && (o = "dom11")),
                nT.diminished && "diatonic-7" == o && (o = "dim7"),
                nT.advanced && ("diatonic-sus2" == o ? o = "diatonic-triad" : "diatonic-triad" == o ? (o = "diatonic-triad",
                n = 1) : "diatonic-sus4" == o ? (o = "diatonic-triad",
                n = 2) : "diatonic-7" == o && (o = "diatonic-7",
                n = 3)),
                -1 == o.indexOf("diatonic-") && ($ = !1),
                g(o, void 0, n, e)
            }),
            r.customChords.forEach(function(t) {
                let o = t.chord;
                eP.chordsExt && "dom7" == o && (o = "dom9"),
                g(void 0, o, 0, e)
            })
        };
        r.parallellScaleChords && "a" == l.scaleGroup ? (o += "<div>",
        b("ionian"),
        o += "</div><div>",
        b("ionian" == i ? "aeolian" : i),
        o += "</div>") : b(i),
        X(J("chords"), "innerHTML", "<div>" + o + "</div>");
        let x = J("chords-alt-info");
        te.get(to[n.scaleGroup][0]);
        let k = tN(t5(r.scaleKey) + eP.keyChange + eP.transpose);
        X(x, "innerHTML", h.join(" / ") || 'Chords in %'.replace("%", r.parallellScaleChords && "a" == l.scaleGroup ? tF(k, "ionian") + "/" + tF(null, "ionian" == l.value ? "aeolian" : l.value) : tF(k, l.value, !1, u.chordControlEnabled)))
    }, oe, ot;
    ot = {
        0: ["R"],
        1: ["b2", "b9", "11", "13"],
        2: ["2", "9", "11", "13"],
        3: ["b3", "#9"],
        4: ["3"],
        5: ["4", "11", "13"],
        6: ["b5", "#11"],
        7: ["5"],
        8: ["#5", "b13"],
        9: ["6", "13"],
        10: ["b7"],
        11: ["7"]
    },
    oe = function(e, t) {
        let o = ot[t % 12];
        if (!o)
            return setTimeout(function() {
                throw "Unknown position " + t
            }, 0),
            "";
        if (6 == t && e.indexOf("#4") > -1)
            return "#4";
        if (8 == t && e.indexOf("b6") > -1)
            return "b6";
        if (9 == t && e.indexOf("dim") > -1)
            return "bb7";
        if (10 == t && "aug6" == e)
            return "#6";
        if (-1 == e.indexOf(o[0])) {
            for (let n = o.length - 1; n >= 1; n--)
                if (e.indexOf(o[n]) > -1)
                    return o[1]
        }
        return o[0]
    }
    ;
    let oo = function(e, t) {
        let o = of(e, "chord")
          , n = {}
          , s = r.style.chord.arpEvents;
        for (let a in s) {
            let i = s[a];
            o$(i.items, o, "chord", e, void 0, function(e, o, s) {
                void 0 != s && !n[s] && !e.halfSteps && !e.scaleSteps && !e.modify && (n[s] = !0,
                t(e, o, s))
            })
        }
    }, on, os, oa, oi, or;
    oi = {
        chord: [],
        bass: []
    },
    or = function() {
        if (oa && oa.showVoiceInfo) {
            tm.releaseAll();
            return
        }
        for (let e in oi)
            oi[e].forEach(function(e) {
                tm.release(e, "hold-hover")
            }),
            oi[e].length = 0;
        tm.updateGuitarBarPress()
    }
    ,
    on = function(e, t) {
        if (p.started() || (or(),
        oa = {
            chordItem: e,
            showVoiceInfo: t
        },
        !e))
            return;
        let o = tB(e)
          , n = ti.parseType(o.chord)
          , s = t5(r.scaleKey) + o.rootPos
          , a = of(o, "bass")
          , i = !0;
        if (oq.get(o6.get(r.bassInstrument || r.instrument).type).parts.bass && "onlyChord" != o.type) {
            let l = r.style.bass.arpEvents;
            for (let c in l) {
                let d = l[c];
                o$(d.items, a, "bass", o, void 0, function(e, a, l) {
                    if ("none" != r.style.chord.style) {
                        if (void 0 == l || e.halfSteps || e.scaleSteps || e.modify || !i)
                            return;
                        i = !1
                    }
                    for (let c = (r.style.bass.double,
                    0); c >= 0; c--) {
                        let d = (l - s + 11988) % 12;
                        tm.press(l + 12 * c, t ? "hold-bass" : "hold-hover", t ? oe(n.suffix, d) : void 0, "bass", o),
                        oi.bass.push(l + 12 * c)
                    }
                })
            }
        }
        oq.get(o6.get(r.instrument).type).parts.chord && "onlyBass" != o.type && oo(o, function(e, a, i) {
            for (let l = (r.style.chord.double,
            0); l >= 0; l--) {
                let c = (i - s + 11988) % 12;
                tm.press(i + 12 * l, t ? "hold-chord" : "hold-hover", t ? oe(n.suffix, c) : void 0, "chord", o),
                oi.chord.push(i + 12 * l)
            }
        })
    }
    ,
    os = function() {
        oa && on(oa.chordItem, oa.showVoiceInfo)
    }
    ,
    W[O].chordPad = function(e, t) {
        if (p.chordPropsVisible() || ne.isDragging())
            return;
        let o = new tp(JSON.parse(t.dataset.chordItem));
        on(o)
    }
    ,
    W[M].chordPad = function() {
        !(p.chordPropsVisible() || ne.isDragging()) && on(null)
    }
    ;
    let ol;
    W[O].keyPad = function(e, t) {
        let o = Number(t.dataset.key)
          , n = ty(o);
        tm.press(n, "hold-hover", void 0, "melody"),
        ol = o;
        let s = tb(n);
        s && tm.press(s, "hold-hover", void 0, "melody")
    }
    ,
    W[M].keyPad = function(e, t) {
        let o = ty(ol);
        tm.release(o, "hold-hover");
        let n = tb(o);
        n && tm.release(n, "hold-hover")
    }
    ;
    let oc = i({
        chord: {},
        bass: {}
    }), od = function(e, t) {
        if (e.arpEvents && !t)
            return {
                events: e.arpEvents,
                length: e.arpLength
            };
        let o = ej[e.style];
        e.step || o.step || t4(o.beatDiv),
        w[r.style.timeSignature].beats;
        let n = (e.arp || o.list || "").split(" ")
          , s = {};
        return n.forEach(function(e, t) {
            if ("" == e || "." == e)
                return;
            let o = e.match(/_?[@\^`´]?(?:-?[x0-9](?:S[24]|T)?[tf\+\-&%<>/\\\*]*)[s!',]?m?[#\?]?(?:\(.+?\))*/g);
            if (!o)
                return;
            let n = []
              , a = !1
              , i = {}
              , r = 0;
            o.forEach(function(e) {
                let t = new tu;
                for ("_" == e[0] && (r += .125,
                t.offset = r,
                e = e.slice(1)),
                "^" == e[0] && (t.next = !0,
                e = e.slice(1),
                a = !0),
                "@" == e[0] && (e = e.slice(1),
                a = !0),
                "\xb4" == e[0] && (t.walk = 1,
                e = e.slice(1)),
                "`" == e[0] && (t.walk = -1,
                e = e.slice(1)); ")" == e[e.length - 1]; ) {
                    let o = e.lastIndexOf("(")
                      , s = e.lastIndexOf("=")
                      , l = e.substring(o + 1, s)
                      , c = e.substring(s + 1, e.length - 1);
                    i[l] = Number(c),
                    e = e.slice(0, o)
                }
                for ("#" == e[e.length - 1] && (e = e.slice(0, -1),
                t.condition = "first"),
                "?" == e[e.length - 1] && (e = e.slice(0, -1),
                t.condition = "last_beat"),
                "m" == e[e.length - 1] && (t.velocity = .75,
                e = e.slice(0, -1)),
                "s" == e[e.length - 1] && (t.sustain = !0,
                e = e.slice(0, -1)),
                "!" == e[e.length - 1] && (t.duration = .5,
                e = e.slice(0, -1)),
                "'" == e[e.length - 1] && (t.duration = .1,
                e = e.slice(0, -1)),
                "," == e[e.length - 1] && (t.duration = 0,
                e = e.slice(0, -1)); "&" == e[e.length - 1]; )
                    t.fit = !0,
                    e = e.slice(0, -1);
                for (; "%" == e[e.length - 1]; )
                    t.dir = !0,
                    e = e.slice(0, -1);
                for (; "+" == e[e.length - 1]; )
                    t.octave++,
                    e = e.slice(0, -1);
                for (; "-" == e[e.length - 1]; )
                    t.octave--,
                    e = e.slice(0, -1);
                for (; "\\" == e[e.length - 1]; )
                    t.halfSteps--,
                    e = e.slice(0, -1);
                for (; "/" == e[e.length - 1]; )
                    t.halfSteps++,
                    e = e.slice(0, -1);
                for (; "<" == e[e.length - 1]; )
                    t.scaleSteps--,
                    e = e.slice(0, -1);
                for (; ">" == e[e.length - 1]; )
                    t.scaleSteps++,
                    e = e.slice(0, -1);
                for (; "f" == e[e.length - 1]; )
                    t.fifth = !0,
                    e = e.slice(0, -1);
                for (; "t" == e[e.length - 1]; )
                    t.third = !0,
                    e = e.slice(0, -1);
                "S" == e.substr(-2, 1) && (t.modify = "sus" + e.substr(-1),
                e = e.slice(0, -2)),
                "T" == e[e.length - 1] && (t.modify = "only_third",
                e = e.slice(0, -1)),
                ("x" == e || "*" == e[e.length - 1]) && (e = e.slice(0, -1),
                "first" == t.condition && (t.condition = ""),
                t.remaining = !0);
                {
                    let d = "" == e ? 0 : parseInt(e) - 1;
                    t.n = d,
                    "first" == t.condition && (-1 == d ? (t.remaining = !0,
                    t.n = 0) : (t.condition = t.fifth ? "not_first" : "",
                    n.push(new tu({
                        remaining: !0,
                        n: 0,
                        sustain: t.sustain,
                        condition: "first"
                    })))),
                    (t.remaining || "first" == t.condition || d > -1) && n.push(t)
                }
            }),
            s[t] = {
                items: n,
                early: a ? "beat" : "",
                envelopes: i
            }
        }),
        {
            events: s,
            length: n.length
        }
    }, ou = function(e) {
        let t = e || r.style
          , o = !1
          , n = 0
          , s = 0
          , a = !1
          , i = !1
          , l = w[r.style.timeSignature]
          , c = ej[t.chord.style]
          , d = (c.customStep ? t.chord.step : c.step) || c.step || t4(c.beatDiv)
          , u = d[0] / d[1]
          , p = 1
          , f = ej[t.bass.style]
          , h = (f.customStep ? t.bass.step : f.step) || f.step || t4(f.beatDiv)
          , m = h[0] / h[1]
          , $ = 1
          , _ = 0;
        for (; u / p != m / $ && _++ < 100; )
            u / p > m / $ ? p++ : $++;
        let y = u / p
          , v = "1:1" == t.shuffle ? 1 / 4 / l.beats : 1 / l.beats;
        for (; y > v; )
            y /= l.beats;
        let g = function(e, t) {
            let r = od(e)
              , l = {};
            for (let c in r.events) {
                if (Number(c) >= r.length)
                    continue;
                let d = r.events[c];
                if (d.envelopes)
                    for (let u in d.envelopes)
                        l[u] = !0;
                let p = d.items;
                p.length > 1 && (i = !0),
                p.forEach(function(e) {
                    e.octave > s && (s = e.octave),
                    e.n > n && (n = e.n),
                    (e.scaleSteps || e.modify) && (a = !0),
                    e.remaining && (i = !0,
                    o = !0)
                })
            }
            return {
                has: l
            }
        }
          , b = oq.get(o6.get(r.instrument).type)
          , x = g(t.chord, u);
        oc.chord.has = x.has,
        oc.chord.dynamic = o,
        oc.chord.maxPos = n,
        oc.chord.maxOctave = s,
        oc.chord.numNotes = t.chord.numNotes || (o || 0 == n ? b.strings ? b.strings.length : 4 : n + 1),
        oc.chord.multipleNotes = i,
        oc.chord.cropLength = t.chord.cropLength,
        oc.chord.loop = c.loop;
        {
            let k = g(t.bass, m);
            oc.bass.has = k.has,
            oc.bass.maxOctave = s,
            oc.bass.cropLength = t.bass.cropLength,
            oc.bass.loop = f.loop
        }
        oc.beatDiv = Math.round(1 / y / w[t.timeSignature].beats),
        oc.useScale = a
    }, op = {}, of = function(e, t, o, n) {
        let s = "bass" == t, a = o6.get("melody" == t ? r.melodyInstrument || r.instrument : "bass" == t && r.bassInstrument || r.instrument), i = oq.get(a.type), l = !s && i.strings && !r.manualChordPositions, c = e.rootPos + 12 * (s ? r.style.bass.octave : r.style.chord.octave) + 12 * ((s ? e.bassOctave : l ? 3 - r.style.chord.octave : e.chordOctave) || 0), d = e.bassPos || 0, u = ti.parseType(e.chord), p = s ? oc.bass : oc.chord, f = n ? n.numNotes : s ? 999 : p.numNotes + (l ? 1 : 0), h = n ? n.voicing : e.voicing, m = n ? n.open : r.style.chord.open, $, _ = u.positions.indexOf(d);
        if (s && -1 == _) {
            let y = e.chord + d
              , v = op[y];
            if (!v) {
                let g = u.positions.slice();
                g.push(d),
                v = op[y] = g.sort(function(e, t) {
                    return e - t
                })
            }
            _ = ($ = v.slice()).indexOf(d)
        } else
            $ = u.positions.slice();
        let b = s ? _ : l ? 0 : e.chordInv || 0
          , x = []
          , k = $.length - 1;
        for (; $[0] - 12 > $[0]; )
            k--;
        let C = k - 0 + 1;
        C = $.length;
        let S = b >= 0 ? Math.floor(b / C) : -Math.floor((-b - 1) / C) - 1
          , A = (b + 100 * $.length) % $.length
          , T = $.length;
        if (s && T > f && $.forEach(function(e, t) {
            0 != e && 3 != e && 4 != e && 7 != e && ($[t] = void 0,
            T--)
        }),
        !s && void 0 == h) {
            if (T > f && _ > -1 && ($[_] = void 0,
            T--),
            T > f) {
                let w = $.indexOf(7);
                w > -1 && ($[w] = void 0,
                T--)
            }
            if ($.indexOf(9) > -1 && T > f) {
                let P = $.indexOf(5);
                P > -1 && ($[P] = void 0,
                T--)
            }
            if ($.indexOf(5) > -1 && T > f) {
                let E = $.indexOf(2);
                E > -1 && ($[E] = void 0,
                T--)
            }
            if (T > f) {
                let L = $.indexOf(4);
                L > -1 && ($[L] = void 0,
                T--)
            }
        }
        let I = -9999
          , N = {
            1: !0
        }
          , O = 0
          , M = 0;
        for (let q = 0; q < 17; q++) {
            let D = $[A];
            if (void 0 != D) {
                let j = D + c + t5(r.scaleKey) + 12 * S
                  , G = !1;
                if (s || void 0 == h)
                    m && !s && 2 != p.numNotes && $.length > 2 && (N[O] || ($.length > 3 || r.style.chord.numNotes < 4) && x.length > 0 && j == x[0] + 12) && (G = !0),
                    O++,
                    A != _ || j - I != 1 || l || m || n && n.full || (G = !0);
                else {
                    let B = h >> M;
                    if (0 == B)
                        break;
                    G = !(1 & B)
                }
                if (G)
                    q--;
                else {
                    if (o)
                        return j;
                    x.push(j),
                    I = j
                }
            }
            A++,
            M++,
            A == $.length && (A = 0,
            S++)
        }
        return void 0 == h && m && !s && 2 == p.numNotes && x[2] - x[1] > x[1] - x[0] && x.shift(),
        l && (x = oh(x, e, t, n)),
        x
    }, oh = function(e, t, o, n) {
        let s = [], a = tc.currentGuitarModel(o), i = a.rootFretNum(t), l = i, c = o6.get("melody" == o ? r.melodyInstrument || r.instrument : "bass" == o && r.bassInstrument || r.instrument), d = oq.get(c.type), u = (r.style.bass.octave + t.bassOctave) * 12 + t.rootPos + t.bassPos + t5(r.scaleKey), p = d.parts.bass && "none" != r.style.bass.style ? a.noteFretInfo(u, i) : null, f = p && p.strNum < d.strings.length - 1 ? p.strNum + 1 : 0, h = (t5(r.scaleKey) + t.rootPos) % 12, m = {}, $ = {}, _, y;
        for (let v in e.forEach(function(e) {
            let t = a.noteFretInfo(e, i);
            if (!t)
                return;
            let o = (e % 12 + 12 - h) % 12
              , n = m[o] || 0 == o || 7 == o
              , s = (t.fretNum > 0 || 1 == t.strNum) && t.fretNum < i || t.fretNum > i + (i > 0 && n ? 2 : 3);
            !(t.strNum < f) && (!(f > 0) || e != u) && !s && (!$[t.strNum] || !n && 2 != _ && 5 != _ && 8 != _) && (m[o] = !0,
            _ = o,
            y = s,
            t.fretNum > l && (l = t.fretNum),
            $[t.strNum] = e)
        }),
        $)
            s.push($[v]);
        let g = n ? n.numNotes : oc.chord.dynamic ? oc.chord.numNotes : oc.chord.maxPos + 1;
        !oc.chord.multipleNotes && s.length < g && (s.length = 0,
        e.forEach(function(e) {
            let t = a.noteFretInfo(e, i);
            t && !(t.strNum < f) && e != u && s.push(e)
        }));
        let b = r.style.chord.octaveOffset + t5(r.scaleKey) + 12 * r.style.chord.octave
          , x = 0;
        if (d.handles.chord && "none" != r.style.chord.style)
            for (; x < s.length && s[x] < b; )
                x++;
        return x = Math.max(Math.min(x, s.length - g), 0),
        s = s.slice(x, x + g)
    }, om = function(e, t) {
        return L(e, te.get(t).steps)
    }, o$ = function(e, t, o, n, s, a) {
        e && 0 != e.length && e.forEach(function(e, i) {
            if ("chord" == o && e.remaining) {
                let l = tc.currentGuitarModel("chord")
                  , c = 0
                  , d = []
                  , u = 0;
                if (void 0 != n.voicing) {
                    let p = n.voicing;
                    for (; p > 0; )
                        p >>= 1,
                        u++
                }
                let f = l ? 999 : u || r.style.chord.numNotes
                  , h = 0;
                for (let m = 0; m < 99 && m != t.length; m++) {
                    let $ = 1 << (t[m] + 12e3) % 12;
                    if (f) {
                        if (h >= f - e.n)
                            break
                    } else {
                        if (c & $ && !l)
                            break;
                        c |= $
                    }
                    if (m < e.n)
                        continue;
                    let _ = o_(e, m, n, t, "chord");
                    d.push(_),
                    h++
                }
                l && void 0 == n.voicing && (d = oh(d, n, "chord")),
                d.forEach(function(t, o) {
                    a(e, o, t)
                })
            } else {
                let y = o_(e, e.n, n, t, o, s);
                a(e, i, y)
            }
        })
    }, o_ = function(e, t, o, n, s, a) {
        let i = r.style[s]
          , l = oc[s];
        if (-1 == t || !tp.typeInfo(o.type).playing)
            return;
        ti.parseType(o.chord);
        let c = i.mirror ? l.maxPos - t : t
          , d = 0;
        void 0 != e.octave && (d += e.octave),
        i.mirror && (d = l.maxOctave - d);
        let u = n[c];
        if (void 0 == u)
            return;
        if (e.third) {
            let p = 0;
            for (; Math.abs(n[p] - n[0] - 4) > Math.abs(n[p + 1] - n[0] - 4); )
                p++;
            u += n[p] - n[0]
        }
        if (e.fifth) {
            let f = 0;
            for (; Math.abs(n[f] - n[0] - 7) > Math.abs(n[f + 1] - n[0] - 7); )
                f++;
            u += n[f] - n[0]
        }
        let h = e.dir && void 0 != a && a < 0 ? -1 : 1
          , m = (e.scaleSteps || 0) * h
          , $ = o.scale || o0(o) || "ionian"
          , _ = t5(r.scaleKey)
          , y = te.get($).steps
          , v = (u % 12 - o.rootPos - t5(r.scaleKey) + 24) % 12;
        if (3 == v || 4 == v) {
            if ("sus2" == e.modify) {
                if (!(y[1] - y[0] > 1))
                    return;
                m--
            }
            if ("sus4" == e.modify) {
                if (!(y[4] - y[3] > 1))
                    return;
                m++
            }
        }
        if ("only_third" == e.modify && 3 != v & 4 != v)
            return;
        if (0 != m) {
            i.mirror && (m = -m);
            let g = (u - _ - o.rootPos + 120) % 12
              , b = y.indexOf(g);
            if (b > -1) {
                let x = y[(b + m + 10 * y.length) % y.length] - g;
                m > 0 && x <= 0 && (x += 12),
                m < 0 && x >= 0 && (x -= 12),
                u += x
            } else
                u += 2 * m,
                console.log("not in scale", g, y)
        }
        if (e.halfSteps && (u += e.halfSteps * h),
        e.fit) {
            let k = 12 * i.octave + i.octaveOffset + t5(r.scaleKey) - 12 * d;
            for (; u < k; )
                u += 12;
            for (; u >= k + 12; )
                u -= 12
        }
        u += 12 * d;
        let C = "bass" == s && r.bassInstrument || r.instrument;
        return o6.get(C),
        u
    }, oy = {}, ov = function(e, t="hold", o=0) {
        if (!e) {
            setTimeout(function() {
                throw "ChordItem error " + JSON.stringify(r)
            }, 0);
            return
        }
        og(t);
        let n, s, a = e.bassPos;
        for (; ; )
            if ((n = J(s = e.chord + "-" + e.rootPos + "-" + a + "-" + o, !0)) || !a)
                break;
            else
                a = 0;
        if (n && (n.classList.add(t),
        oy[t] = s,
        "hold" == t && !p.isSequencePlaying())) {
            let i = te.get(r.scale)
              , l = u.chordControlEnabled ? to[i.scaleGroup][eP.currentMode] : r.scale
              , c = te.get(l).steps.indexOf(e.rootPos);
            0 == e.chord.indexOf("dom") && -1 == e.chord.indexOf("sus") && c > -1 ? ov({
                chord: tG("diatonic-triad", L(c + 3, 7), l),
                rootPos: L(e.rootPos + 5, 12),
                bassPos: 0
            }, "tonic") : og("tonic")
        }
    }, og = function(e="hold") {
        if (!oy)
            return;
        let t = J(oy[e], !0);
        t && (t.classList.remove(e),
        "hold" != e || p.started() || og("tonic"))
    }, ob = function(e, t, o, n) {
        let s = ti.parseType(e)
          , a = te.get(n)
          , i = a.steps.indexOf(o) > -1;
        return s.positions.forEach(function(e) {
            -1 == a.steps.indexOf((e + t) % 12) && (i = !1)
        }),
        i
    }, o0, ox;
    ox = [],
    o0 = function(e, t) {
        t || (t = e.chord);
        let o = e.rootPos + "-" + e.keyChange + "-" + e.transpose + "-" + t + "-" + e.bassPos + "-" + r.scale
          , n = ox[o];
        if (n)
            return n;
        ti.parseType(t);
        let s = te.get(r.scale), a = -1, i;
        return te.forEach(function(o) {
            if (!ob(t, 0, e.bassPos, o.value))
                return;
            let n = 0;
            o.steps.indexOf(L(-e.rootPos + e.transpose + e.keyChange, 12)) > -1 && (n += .1),
            s.scaleGroup == o.scaleGroup && (n += "ionian" == s.value ? 9999 : 1),
            o.steps.forEach(function(t) {
                s.steps.indexOf(L(t + e.rootPos - e.transpose - e.keyChange, 12)) > -1 && n++
            }),
            n > a && (a = n,
            i = o.value)
        }),
        ox[o] = i,
        i
    }
    ;
    let ok = function(e, t) {
        let o = te.get(t)
          , n = o.steps.indexOf((11988 - e.rootPos + e.transpose + e.keyChange) % 12);
        if (n > -1) {
            let s = to[o.scaleGroup];
            if (s.length > 0)
                return s[(o.offset + s.length + n) % s.length]
        }
    }, oC = function(e, t, o) {
        let n = {};
        o && o.forEach(function(e) {
            e.scale && (n[e.rootPos + e.chord] = e.scale)
        });
        let s = t5(r.scaleKey)
          , a = (e = e.trim()).match(/^[\d\s-]+$/i)
          , i = !e.match(/\s/) && !e.match(/-$/)
          , l = e.replace(a || i ? /-/g : /\s+-\s+/g, " ").replace(/(\s\d+)\s+([A-Za-z])/g, "$1$2").replace(/(^|\s)(\d+),(\d+)/g, "$1$2.$3").replace(/n\.?c\.?/ig, "rest").replace(/\s*(add\s*|no\s*|#\d)/g, "$1").replace(/(\d)(?:rd|th)/g, "$1").replace(/♭|\s?flat/ig, "b").replace(/♯|\s?sharp/ig, "#").match(/<.*?>|[^\s,|]+/g) || []
          , c = []
          , d = 1
          , p = 0
          , f = 0
          , h = 0
          , m = "default";
        return l.forEach(function(e) {
            if ("" == e)
                return;
            let i, l, $ = 0, _ = 1;
            if ("<" == e.charAt(0)) {
                let y = e.substring(1, e.length - 1);
                h = e4.sectionValue(y);
                return
            }
            if ("default" == e || "onlyBass" == e || "onlyChord" == e) {
                m = e;
                return
            }
            if (a) {
                let v = e - 1
                  , g = te.get(r.scale).steps;
                if (v >= 0 && v < g.length)
                    i = g[v] + t5(r.scaleKey),
                    l = tG("diatonic-triad", v, r.scale);
                else
                    throw 'Unknown scale degree' + " " + e
            } else {
                let b = e.match(/^(\d+)bpm$/i);
                if (b) {
                    d = Number(b[1]) / r.style.tempo;
                    return
                }
                let x = e.match(/^tr([+-]?\d+)$/i);
                if (x) {
                    f = Number(x[1]);
                    return
                }
                let k = e.match(/^kc([+-]?\d+)$/i);
                if (k) {
                    p = Number(k[1]);
                    return
                }
                let C = e.match(/^([0-9\.\/]*)(rest|break|(?:b+|#+)?[vi]+|[a-h](?:b+|#+)?)([^\/]*(?:\/[b#]?\d[^\/]*)?)(?:\/(.+))?$/i);
                if (!C)
                    throw 'Unknown chord' + " " + e;
                if (C[1] && (_ = tI(C[1]),
                isNaN(_)))
                    throw 'Unknown part' + " " + e;
                let S = C[2]
                  , A = C[3];
                S.match(/^[vi]/) && !A.match(/^(?:m|dim|o|aug|sus)/) && (A = "m" + A);
                try {
                    l = ti.parseType(A || "maj").name
                } catch (T) {
                    throw T + " (" + e + ")"
                }
                let w = C[4];
                if (i = tE(S),
                w) {
                    let P = tE(w);
                    if (void 0 != P)
                        w.match(/[vi]/i) ? i += P : $ = (P + 12 - i) % 12;
                    else
                        throw 'Unknown slash chord' + " /" + w
                }
            }
            let E = void 0 != i ? (i - s + ("roman-numeral" == u.chordNotation ? p : 0) + 11988) % 12 : null
              , L = new tp({
                type: "break" == name ? "break" : "rest" == name || "s" == name ? "rest" : m,
                length: t * _,
                chord: l,
                rootPos: E,
                bassPos: $,
                scale: n[E + l],
                speed: d,
                keyChange: p,
                transpose: f,
                section: h
            });
            if (h && (h = 0),
            r.manualChordPositions && o) {
                let I = [];
                if (o.forEach(function(e, t) {
                    e.chord == L.chord && e.rootPos == L.rootPos && I.push({
                        chordItem: e,
                        diff: Math.abs(t - c.length)
                    })
                }),
                I.length > 0) {
                    let N = I.sort(function(e, t) {
                        return e.diff - t.diff
                    })[0].chordItem;
                    L.bassOctave = N.bassOctave,
                    L.chordOctave = N.chordOctave,
                    L.chordInv = N.chordInv,
                    L.voicing = N.voicing
                } else
                    L = tB(L)
            }
            c.push(L)
        }),
        c
    }, oS = function(e) {
        let t = o1(r.sequence);
        if (t.list.length > 0) {
            let o = r.scaleKey + " " + r.scale
              , n = 0;
            t.list.forEach(function(e) {
                e.value == o && (n = e.rank)
            });
            let s = Math.floor(1e3 * t.list[0].rank) > 1e3 * Math.floor(n);
            if (X(J("scale-warning").style, "display", "none"),
            s) {
                let a = t.list[0].value.split(" ")
                  , i = a[0]
                  , l = a[1]
                  , c = tF(i, l);
                J("scale-warning").title = 'Recommended scale' + ":\n" + c,
                e && et({
                    title: 'Scale',
                    description: 'Change to recommended scale %?'.replace("%", c),
                    buttons: [{
                        name: 'OK',
                        onSelect: function() {
                            o2(t5(i) - t5(r.scaleKey), !0),
                            r.scaleKey = i,
                            r.scale = l,
                            eP.currentMode = te.get(r.scale).offset,
                            eP.keyChange = 0,
                            eP.transpose = 0,
                            o8("Updated scale to " + c),
                            tO()
                        }
                    }, {
                        name: 'Cancel'
                    }]
                })
            }
        }
    }, o1 = function(e) {
        let t = []
          , o = {}
          , n = 9999
          , s = t5(r.scaleKey);
        e.forEach(function(e, t) {
            if (!tp.typeInfo(e.type).playing)
                return;
            let a = ti.parseType(e.chord);
            a.positions.forEach(function(t, n) {
                let a = L(e.rootPos + s + t - e.transpose, 12);
                o[a] = (o[a] || 0) + (0 == n ? 10 : 1)
            }),
            a.positions.length < n && (n = a.positions.length)
        });
        let a = Object.keys(o).map(function(e) {
            return parseInt(e)
        });
        for (let i = 0; i < 12; i++)
            te.forEach(function(e) {
                let s = tt[e.scaleGroup];
                if (!s.steps)
                    return;
                let r = 0
                  , l = 0;
                if (a.forEach(function(t) {
                    let n = (t + 12 - i) % 12;
                    if (e.steps.indexOf(n) > -1) {
                        let s = o[t];
                        r += 1e3 * s + (0 == n && s >= 10 ? 10 : 0),
                        l++
                    }
                }),
                l >= n) {
                    r += (0 == e.offset ? 1 : 0) + (e.primary ? 10 : 0) + ("a" == e.scaleGroup ? 10 : 0) + (s.unusual ? 0 : 1e5);
                    let c = tN(i, "ionian", "C");
                    t.push({
                        value: c + " " + e.value,
                        name: tF(c, e),
                        count: l,
                        rank: r
                    })
                }
            });
        return {
            list: t = t.sort(function(e, t) {
                return t.rank - e.rank
            }),
            noteCount: a.length
        }
    }, o2 = function(e, t) {
        r.sequence.forEach(function(t) {
            if (tp.typeInfo(t.type).playing) {
                let o = (t.rootPos + 1188 - e) % 12;
                if (r.manualChordPositions) {
                    let n = Math.floor((e + o - t.rootPos) / 12);
                    t.bassOctave -= n,
                    t.chordOctave -= n
                }
                t.rootPos = o
            }
        }),
        r.melody.events.forEach(function(t) {
            t[1] -= e
        }),
        t && !r.manualChordPositions && (r.style.chord.octaveOffset -= e,
        r.style.bass.octaveOffset -= e)
    }, oA = function() {
        let e = "", t, o = ['Common chords', 'Used chords', 'Major chords', 'Minor chords', 'Diminished chords', 'Suspended chords', 'Power chords', 'Other chords'], n = {
            maj: !0,
            min: !0,
            maj6: !0,
            min6: !0,
            power: !0,
            dom7: !0,
            min7: !0,
            maj7: !0,
            sus2: !0,
            sus4: !0,
            dim: !0,
            dim7: !0,
            min7b5: !0
        }, s = [], a = {
            "": 'Major'.toLowerCase(),
            m: 'Minor'.toLowerCase()
        }, i = {};
        return r.sequence.forEach(function(e) {
            let t = ti.parseType(e.chord);
            !i[t.name] && (i[t.name] = !0,
            s.push([e.chord, a[t.suffix] || t.suffix, 1, t.suffix.replace("m", "")]))
        }),
        ta.forEach(function(e) {
            let t = ti.parseType(e.name)
              , o = ti.compactSuffix(t.suffix)
              , i = (t.suffix != e.suffix ? e.suffix + "," : "") + (a[t.suffix] || t.suffix) + (o != t.suffix ? " (" + o + ")" : "");
            n[e.name] && s.push([e.name, i, 0, e.suffix.replace("m", "")]),
            s.push([e.name, i, e.name.indexOf("sus") > -1 ? 5 : 0 == e.name.indexOf("maj") || 0 == e.name.indexOf("dom") || 0 == e.name.indexOf("aug") ? 2 : e.name.indexOf("dim") > -1 ? 4 : 0 == e.name.indexOf("min") ? 3 : e.name.indexOf("power") > -1 ? 6 : 7, ta.sortValue(e)])
        }),
        s.sort(function(e, t) {
            return e[2] < t[2] ? -1 : e[2] > t[2] ? 1 : e[3] < t[3] ? -1 : e[3] > t[3] ? 1 : e[1] < t[1] ? -1 : e[1] > t[1] ? 1 : 0
        }).forEach(function(n) {
            if (void 0 == n)
                return;
            let s = o[n[2]];
            s != t && (e += (t ? "</optgroup>" : "") + '<optgroup label="' + s + '">',
            t = s),
            e += '<option value="' + n[0] + '">' + t6(n[1]) + "</option>"
        }),
        e += "</optgroup>"
    }, oT = function() {
        let e = this, t, o, n, s, a, i, d, h, m, $, _ = {
            chord: !1,
            bass: !1
        }, y = [], v = [], g, b = {}, x, k, C = !1, S, A, T, P, E = 0, I = 0, N = 0, q = !1, D = !1, j = !1, V, F, z = [], Y, Q = e => {
            let t = ti.parseType(e.chord)
              , o = t.positions.indexOf(7) > -1;
            t.positions.indexOf(2);
            let n = []
              , s = t.positions.length;
            return n.push([e_(e, ""), 'Closed']),
            s > 2 && (n.push([e_(e, "R"), 'Closed']),
            o && n.push([e_(e, "R5"), 'Closed'])),
            n.sort( (e, t) => e[1].length - t[1].length),
            3 == s && n.push([21, "Drop 2"]),
            4 == s && (n.push([e_(e, "", [2]), "Drop 2"]),
            n.push([e_(e, "", [3]), "Drop 3"]),
            n.push([e_(e, "", [2, 3]), "Drop 2 3"]),
            n.push([e_(e, "", [2, 4]), "Drop 2 4"]),
            n.push([e_(e, "R", [2]), "Drop 2"])),
            5 == s && (n.push([e_(e, "R", [2]), "Drop 2"]),
            n.push([e_(e, "R", [3]), "Drop 3"]),
            n.push([e_(e, "R", [2, 3]), "Drop 2 3"]),
            n.push([e_(e, "R", [2, 4]), "Drop 2 4"]),
            o && n.push([e_(e, "R5", [2]), "Drop 2"])),
            6 == s && (n.push(["2201-4", "Kenny Baron"]),
            o && (n.push([e_(e, "R5", [2]), "Drop 2"]),
            n.push([e_(e, "R5", [3]), "Drop 3"]),
            n.push([e_(e, "R5", [2, 3]), "Drop 2 3"]),
            n.push([e_(e, "R5", [2, 4]), "Drop 2 4"]))),
            n.map(e => {
                let t = Number(e[0].toString().split("-")[0]).toString(2).match(/1/g).length;
                return [e[0], e[1], t]
            }
            ).filter(e => e[2] > 1).sort( (e, t) => t[2] - e[2] || e[0] - t[0])
        }
        , Z = (e, t) => {
            if (e.voicing) {
                let o = Q(e).find(t => t[0] == e.voicing)
                  , n = e.voicing == e$(e);
                e.chord = t;
                let s = o ? Q(e).find(e => e[1] == o[1]) : null;
                s ? e.voicing = s[0] : n ? e.voicing = e$(e) : e.voicing = void 0
            } else
                e.chord = t;
            e.scale && !ob(e.chord, 0, e.bassPos, e.scale) && (e.scale = void 0)
        }
        ;
        this.currentStateData = function() {
            return {
                cursorPos: I,
                cursorLen: N
            }
        }
        ,
        this.selectedBeatRange = function() {
            let e = 0
              , t = [];
            return r.sequence.forEach(function(o, n) {
                n == I && (t[0] = e),
                e += o.length,
                n == I + N - 1 && (t[1] = e)
            }),
            I == r.sequence.length && (t[0] = e),
            I + N >= r.sequence.length && (t[1] = 999999),
            t
        }
        ,
        this.updateCurrentState = function(e) {
            I = e.cursorPos,
            N = e.cursorLen
        }
        ,
        this.setVelocityFactor = function(e) {
            V = e
        }
        ,
        this.setBPMFactor = function(e) {
            F = e
        }
        ,
        this.updateBufferTime = function(e) {
            t = e ? .1 : 2
        }
        ,
        this.totalBeats = function() {
            let e = 0;
            return r.sequence.forEach(function(t) {
                e += t.length / t.speed
            }),
            e
        }
        ,
        this.loopCountFromMelody = function() {
            let e = r.melody.events
              , t = this.totalBeats();
            return 0 == t ? 0 : e.length > 0 && r.loopSequence ? Math.floor(e[e.length - 1][0] / t) + 1 : 1
        }
        ,
        this.totalTime = function() {
            let e = r.melody.events
              , t = this.totalBeats();
            return t3() * (t > 0 ? t * p.loopCountFromMelody() : e.length > 0 ? e[e.length - 1][0] + (e[e.length - 1][3] || 0) : 0)
        }
        ;
        let ee, eo, en = function() {
            if (!ee)
                return;
            let e = tB(ee);
            g && g.rootPos != e.rootPos && "fretNoise"in o6.get(r.instrument) && p.started() && o9.press("chord", 100 + Math.round(10 * Math.random()), 1, a - .1, !1),
            g = e,
            b.chord = ti.parseType(g.chord);
            {
                let t = of(g, "chord");
                if (T = !0,
                b.chordNotes && t[0] != b.chordNotes[0]) {
                    let o = t[0] - b.chordNotes[0];
                    b.chordDiff = o
                }
                b.chordNotes = t
            }
            {
                let n = of(g, "bass");
                b.bassDiff = b.bassNotes && n[0] != b.bassNotes[0] ? n[0] - b.bassNotes[0] : 0,
                b.bassNotes = n
            }
        };
        this.updateCurrentChord = function() {
            en()
        }
        ;
        let es = function(e, t) {
            let o = !1;
            e != eo && eo && "break" == eo.type && (d -= eo.length * oc.beatDiv),
            e == eo || t || ($ = !0,
            _.bass = !0,
            _.chord = !0,
            eo && e && tp.typeInfo(e.type).playing && (e.transpose != eo.transpose || e.keyChange != e.keyChange) && (o = !0),
            eo = e),
            ee = e,
            en(),
            !o9.isSilentMode() && e && "compose" == nC && setTimeout(function() {
                j && (o && (eP.keyChange = e.keyChange,
                eP.transpose = e.transpose,
                tU(),
                tJ()),
                ov(e))
            }, (a - l.current().context.currentTime) * 1e3)
        }
          , ea = function(t, o) {
            let n = r.melody.events;
            if (!n)
                return;
            let a = o6.get(r.melodyInstrument || r.instrument)
              , i = r.style.sustain;
            for (; x < n.length; ) {
                let l = n[x]
                  , c = l[0] * t3() + s;
                if (o && c > t + o)
                    break;
                let d = l[1] + t5(r.scaleKey)
                  , u = l[2]
                  , p = (l[3] || 0) * t3()
                  , f = void 0 != l[4] ? !!l[4] : i;
                c >= t - .02 && (o9.press("melody", d, u, c),
                o9.release("melody", d, c + p, void 0, f && !("organ"in a))),
                x++
            }
            !D && !o9.isSilentMode() && x > 0 && x == n.length && r.loopSequence && (x = 0,
            s += e.totalTime())
        }
          , ei = function() {
            let e = p.getItem(P);
            e && es(e)
        }
          , er = function(e) {
            if (j) {
                if (0 == r.sequence.length)
                    return;
                for (; v.length >= 2 && v[1].time < e; )
                    v.shift();
                v.push({
                    time: a,
                    chordItem: g
                })
            } else {
                for (; y.length > 0 && y[0].time < e; )
                    y.shift();
                y.push({
                    time: a,
                    counter: i
                })
            }
            if (!b.chord || j && !r.loopSequence && P == r.sequence.length)
                return;
            let t = !1
              , o = function(o) {
                let n = "bass" == o
                  , s = r.style[o]
                  , l = oc[o]
                  , c = ej[s.style]
                  , u = w[r.style.timeSignature].beats * oc.beatDiv
                  , f = s.step || c.step || t4(c.beatDiv)
                  , h = f[1] / f[0] / u
                  , y = s.loop ? i + d : i - E;
                if (!s.loop && (y < 0 || y >= s.arpLength / h))
                    return;
                let v = (l.cropLength ? y % (u * l.cropLength) : y) * h % s.arpLength;
                0 == v && o9.resetEnvelopes(o);
                let x = s.arpEvents[v];
                if (!x)
                    return;
                let k = !1
                  , C = i - E == 0
                  , S = i - E < oc.beatDiv
                  , A = j && i - E >= (g.length - 1) * oc.beatDiv || !j && i - E < oc.beatDiv
                  , L = w[r.style.timeSignature]
                  , I = !1
                  , N = function(i, l, c) {
                    if ($ && (void 0 != c || !tp.typeInfo(g.type).playing) && (o9.releaseSustainPedal(a - .02, !j),
                    tp.typeInfo(g.type).playing && o9.pressSustainPedal(a),
                    $ = !1,
                    t = !0),
                    void 0 == c || a < e - .02)
                        return;
                    if (_[o]) {
                        if ("not_first" == i.condition)
                            return;
                        (i.remaining || 0 == i.n && 0 == i.halfSteps && 0 == i.scaleSteps) && (I = !0)
                    } else if ("first" == i.condition)
                        return;
                    if (S) {
                        if ("not_first_beat" == i.condition)
                            return
                    } else if ("first_beat" == i.condition)
                        return;
                    if (A) {
                        if ("not_last_beat" == i.condition)
                            return
                    } else if ("last_beat" == i.condition)
                        return;
                    k = !0;
                    let d = s.numNotes || b.chord.positions.length
                      , u = n && r.bassInstrument || r.instrument
                      , p = o6.get(u)
                      , f = oq.get(p.type)
                      , h = n ? 0 : (x.envelopes && void 0 != x.envelopes.strum ? x.envelopes.strum * t3() / g.speed : 0) + (f.strum ? r.style.chord.spread + Math.min(Math.max((T ? 1 : -1) * (.1 * Math.random() + .1), -.06), .06) / 4 : r.style.chord.spread) * t3() / g.speed * F
                      , v = "none" == r.style.bass.style || r.bassInstrument ? l : l + 1
                      , w = a + i.offset * t3() / g.speed + (h >= 0 ? (f.strum ? v : l) * h : -((d - 1 - l) * h))
                      , P = w + 0
                      , E = y % (L.beats * oc.beatDiv) == 0 ? 1 : y % oc.beatDiv == 0 || C ? .9 : .8
                      , N = Math.min(Math.max((void 0 != V ? V : s.velocity) * i.velocity, 0), 2)
                      , O = c % 12 == (t5(r.scaleKey) + g.rootPos + (n ? g.bassPos : 0)) % 12
                      , M = r.style.sustain
                      , q = i.sustain && !r.style.sustain ? void 0 : i.duration * s.noteDuration * t3() * F / 2
                      , D = !r.style.sustain && !i.sustain;
                    if (i.attack,
                    g.speed,
                    n) {
                        if (void 0 != m && "keep" != i.condition) {
                            let G = "bass" != p.type && M;
                            o9.release(o, m, a - .02, void 0, G),
                            r.style.bass.double && o9.release(o, m + 12, a - .02, void 0, G)
                        }
                        void 0 == q && (m = c)
                    }
                    if (0 != q && (o9.press(o, c, N * Math.max(1 - Math.random() * l * .1, 0), w, O, g, D, i.keep ? "keep" : i.condition, x),
                    n && r.style.bass.double || !n && r.style.chord.double)) {
                        let B = c + 12;
                        B && o9.press(o, B, N, P, O, g, D, i.keep ? "keep" : i.condition, x)
                    }
                    if (n)
                        void 0 != q && (o9.release(o, c, w + q * E, void 0, M),
                        r.style.bass.double && o9.release(o, c + 12, P + q * E, void 0, M));
                    else if (void 0 != q && (o9.release(o, c, w + q * E, void 0, M),
                    r.style.chord.double)) {
                        let R = c + 12;
                        R && o9.release(o, R, P + q * E, void 0, M)
                    }
                }
                  , O = x.items;
                if (O.length > 0) {
                    let M = O[0]
                      , q = i - E >= g.length * oc.beatDiv - ("bar" == x.early ? L.beats : 1) * oc.beatDiv;
                    if (j && q && (M.next || x.early) && tp.typeInfo(g.type).playing && es(p.getItem(P + 1), M.next || t),
                    "chord" == o && "onlyBass" == g.type || "bass" == o && "onlyChord" == g.type)
                        return
                }
                o9.processEnvelopes(o, x, a),
                o$(O, n ? b.bassNotes : b.chordNotes, o, g, n ? b.bassDiff : b.chordDiff, N),
                I && O.length > 0 && (_[o] = !1),
                !n && O.length > 0 && O[0].remaining && (T = !T)
            };
            "2-beats" == r.style.sustain && (i + d) % (2 * oc.beatDiv) == 0 && ($ = !0),
            oq.get(o6.get(r.instrument).type).parts.chord && o("chord"),
            oq.get(o6.get(r.bassInstrument || r.instrument).type).parts.bass && o("bass")
        }
          , el = {
            "1:1": 0,
            "3:2": .2,
            "2:1": 1 / 3,
            "3:1": .5
        }
          , ec = function() {
            let c = l.current()
              , f = c.context
              , h = c.context.currentTime;
            void 0 == a && (a = o = s = h - n,
            o9.setStartTime(o));
            let m = function() {
                let e = p.getItem(j ? P : I)
                  , t = t3() / (e ? e.speed : 1) * F / oc.beatDiv
                  , o = el[r.style.shuffle];
                a += t + t * (i % 2 == 0 ? o : -o),
                i++,
                j && e && i - E >= e.length * oc.beatDiv && (P++,
                E += e.length * oc.beatDiv,
                P % r.sequence.length == 0 && (r.loopSequence ? (i = 0,
                E = 0,
                d = 0) : o9.releaseAll(a)),
                ei())
            }
              , $ = function() {
                let e = (i + d) / Math.max(Math.floor(oc.beatDiv), 1);
                if (u.metronomeEnabled && g && "break" != g.type && (!o9.isSilentMode() || l.isOffline()) && e == Math.floor(e) && oF.click) {
                    let t = f.createBufferSource();
                    t.buffer = oF.click.buffer;
                    let o = w[r.style.timeSignature];
                    t.playbackRate.value = e % o.beats == 0 ? .85 : 1,
                    t.connect(c.sessionGain),
                    t.start(a)
                }
            };
            if (o9.isSilentMode()) {
                let _ = e.loopCountFromMelody();
                for (ea(h, void 0); P < r.sequence.length * _; )
                    er(),
                    $(),
                    m();
                _ > 0 ? (o9.releaseAll(a),
                o9.setEndTime(a)) : o9.setEndTime(o + e.totalTime())
            } else {
                for (; a < h + t; )
                    er(h),
                    a >= h && (j && "roll" == nC && o9.updatePianoRollCursor(a - o),
                    "explore" != nC && $(),
                    setTimeout(function(t, o) {
                        e.setMark(t, o)
                    }, (a - h) * 1e3, i, E)),
                    m();
                j && ea(h, t),
                o9.sendMidi(h + .8 * t),
                o9.cleanUp(h)
            }
        }
          , ed = function(e) {
            void 0 != h && (clearTimeout(h),
            h = void 0,
            o9.releaseAll(),
            b = {},
            eo = null,
            o9.isSilentMode() || (f && u.drumMachineEnabled && f.postMessage({
                action: "chord-player-stop"
            }),
            J("piano").classList.remove("playing"),
            c.stopPlaying(),
            setTimeout(function() {
                os()
            }, 0)))
        }
          , eu = function(e) {
            if (void 0 == h) {
                if (y.length = 0,
                v.length = 0,
                o9.reset(),
                l.current(),
                !o9.isSilentMode()) {
                    if (f && u.drumMachineEnabled && "explore" != nC) {
                        let t = performance.now();
                        f.onmessage = function(e) {
                            "drum-machine-start" == e.data.action && (a += (performance.now() - t) * 5e-4)
                        }
                        ,
                        f.postMessage({
                            action: "chord-player-start",
                            tempo: r.style.tempo
                        })
                    }
                    h = setInterval(ec, 50),
                    J("sequence-mark").style.left = null,
                    J("piano").classList.add("playing"),
                    c.startPlaying(),
                    tm.releaseAll()
                }
                a = void 0,
                o = void 0,
                n = e || 0,
                i = 0,
                E = 0,
                d = 0,
                $ = !0,
                F = 1,
                ec()
            }
        }
          , ep = function(e) {
            for (let t = I; t < I + N; t++)
                e(r.sequence[t], t)
        }
          , ef = function(e) {
            let t, o = !0;
            return ep(function(n) {
                void 0 != t && t != n[e] && (o = !1),
                t = n[e]
            }),
            o ? t : void 0
        };
        this.started = function() {
            return void 0 != h
        }
        ,
        this.isSequencePlaying = function() {
            return j
        }
        ,
        this.chordRecording = function(e) {
            return q || 2 == e.buttons || e && (e.ctrlKey || e.metaKey)
        }
        ,
        this.isCurrentChordManual = function() {
            return g && void 0 != g.chordOctave
        }
        ,
        this.currentChord = function() {
            let e;
            if (j) {
                let t = performance.now();
                for (; v.length >= 2 && v[1].time < t; )
                    v.shift();
                e = v.length > 0 ? v[0].chordItem : void 0
            } else
                e = g && g.chord ? g : void 0;
            return e
        }
        ;
        let eh = function() {
            let e = l.current().context.currentTime;
            for (; y.length > 0 && y[0].time < e; )
                y.shift();
            y.length > 0 && (i = y[0].counter,
            a = y[0].time),
            j || (E = Math.ceil(i / oc.beatDiv) * oc.beatDiv),
            $ = !0
        };
        this.startChord = function(e, t, o, n) {
            return o && p.started() && JSON.stringify(e) == JSON.stringify(ee) ? (p.stopChord(),
            !1) : (p.started() && (r.style.chord.loop || r.style.bass.loop ? eh() : p.stopChord()),
            e ? es(e) : en(),
            this.setVelocityFactor(t),
            e && (ov(e, void 0, n),
            eu()),
            !0)
        }
        ,
        this.startExampleChord = function(e) {
            if ("once" == r.style.chord.style && "once" == r.style.bass.style) {
                let t = performance.now();
                if (this._lastStartExampleTime && t - this._lastStartExampleTime < 500)
                    return;
                this._lastStartExampleTime = t
            }
            e && this.stopChord(),
            this.startChord(new tp({
                chord: "maj",
                rootPos: "aeolian" == r.scale ? 10 : 7
            }))
        }
        ,
        this.stopChord = function() {
            j || (ed(),
            g = null,
            og())
        }
        ,
        this.cursorTime = function() {
            let e = 0;
            if (I < r.sequence.length)
                for (let t = 0; t < I; t++) {
                    let o = this.getItem(t);
                    e += o.length * t3() / o.speed
                }
            return e
        }
        ,
        this.startSequence = function({force: e=!1, ofsTime: t=0, countOff: o=!1}={}) {
            if (j && !e)
                return;
            t || (t = 0),
            this.stopSequence(),
            j = !0,
            x = 0,
            i = 0,
            d = 0,
            P = 0,
            E = 0,
            V = void 0,
            ee = null,
            eo = null,
            S = [],
            A = {},
            ei(),
            o9.isSilentMode() || (em.classList.add("playing"),
            J("sequence-play").innerHTML = '<span class="icon-stop">',
            tm.updateHandles(),
            J("piano").classList.add("sequence-playing"));
            let n = w[r.style.timeSignature].beats;
            if (o && oF.click && 0 == t) {
                let s = l.current()
                  , a = s.context
                  , c = a.currentTime;
                for (let u = 0; u < n; u++) {
                    let p = a.createBufferSource();
                    p.buffer = oF.click.buffer,
                    p.connect(s.sessionGain),
                    p.start(c + t3() * u)
                }
            }
            eu(o && 0 == t ? t - t3() * n : t)
        }
        ,
        this.stopSequence = function() {
            if (j && (j = !1,
            g = null,
            !o9.isSilentMode())) {
                if (S.length > 0 && (eP.playedMelodyEvents = S),
                this.setChordRecording(!1),
                this.setMelodyRecording(!1),
                og(),
                "compose" == nC) {
                    let e = r.sequence[I];
                    e && (eP.transpose = e.transpose,
                    eP.keyChange = e.keyChange,
                    t$(),
                    tU(),
                    tJ())
                }
                em.classList.remove("playing"),
                ed(),
                J("sequence-play").innerHTML = '<span class="icon-play">',
                tm.updateHandles(),
                J("piano").classList.remove("sequence-playing"),
                "roll" == nC && o9.updatePianoRollCursor(void 0)
            }
        }
        ,
        this.toggleSequence = function(e) {
            j ? this.stopSequence() : (o9.releaseAll(),
            this.startSequence({
                ofsTime: e
            }))
        }
        ,
        this.replaySequence = function(t) {
            e.isSequencePlaying() && (e.stopSequence(),
            e.startSequence({
                ofsTime: t
            }))
        }
        ,
        this.captureSequence = function(e) {
            o9.setSilentMode(!0),
            this.startSequence(),
            this.stopSequence(),
            o9.setSilentMode(!1)
        }
        ,
        this.exportMidi = function(e, t) {
            this.captureSequence(),
            o9.exportMidi(e, t),
            o9.reset()
        }
        ,
        this.exportWebPlayer = function() {
            this.captureSequence();
            let e = o9.exportWebPlayer();
            return o9.reset(),
            e
        }
        ,
        this.renderPianoRoll = function() {
            let e = !1, t;
            j && (this.stopSequence(),
            e = !0,
            t = l.current().context.currentTime - o),
            this.captureSequence(),
            o9.renderPianoRoll(),
            o9.reset(),
            e && this.startSequence({
                ofsTime: t
            })
        }
        ;
        let em = J("sequence-items");
        this.setMark = function(e, t) {
            let o = ee && "break" == ee.type;
            c.setMark((o ? 0 : r.style.chord.loop ? e + d : e - t) / oc.beatDiv, "chord"),
            c.setMark((o ? 0 : r.style.bass.loop ? e + d : e - t) / oc.beatDiv, "bass");
            let n = e / oc.beatDiv
              , s = J("sequence-mark");
            if (p.isSequencePlaying() && void 0 != n) {
                let a = eb()
                  , i = J("sequence-items")
                  , l = i.childNodes[0].clientHeight + 2
                  , u = n % a / a * 100
                  , f = Math.floor(n / a) * l + 2;
                s.style.left = u + "%",
                s.style.top = f + "px",
                s.style.height = l + "px",
                0 == u && (f < i.scrollTop && (i.scrollTop = f),
                f + l > i.scrollTop + i.clientHeight && (i.scrollTop = f + l - i.clientHeight))
            }
        }
        ,
        this.updateChordPreview = function() {
            let e = r.sequence[I];
            this.chordPropsVisible() && 1 == N && on(e, !0)
        }
        ,
        this.updateCurrentChordPositions = function() {
            let e = r.sequence[I];
            e && (e.chordInv = void 0,
            e.bassInv = void 0,
            r.sequence[I] = tB(e))
        }
        ,
        this.currentChordItem = function() {
            return e.started() ? ee : r.sequence[I]
        }
        ,
        this.setCurrentChordItem = function(e) {
            ee = e
        }
        ;
        let e$ = function(e) {
            let t = tB(e);
            t.voicing = void 0;
            let o = ti.parseType(t.chord)
              , n = 0;
            return oo(t, function(e, s, a) {
                let i = a - 12 * (t.chordOctave + r.style.chord.octave) - t.rootPos - t5(r.scaleKey)
                  , l = Math.floor(i / 12) * o.positions.length + o.positions.indexOf(i % 12) - t.chordInv;
                l >= 0 && (n ^= 1 << l)
            }),
            n
        }
          , e_ = function(e, t, o) {
            let n = ti.parseType(e.chord)
              , s = n.positions.length
              , a = L(s - e.chordInv, s)
              , i = Math.pow(2, s) - 1;
            t.indexOf("R") > -1 && (i ^= 1 << a);
            let r = n.positions.indexOf(7);
            t.indexOf("5") > -1 && r > -1 && (i ^= 1 << L(a + r, s));
            let l = n.positions.indexOf(2);
            t.indexOf("9") > -1 && l > -1 && (i ^= 1 << L(a + l, s));
            let c = n.positions.indexOf(3);
            t.indexOf("3") > -1 && c > -1 && (i ^= 1 << L(a + c, s));
            let d = n.positions.indexOf(4);
            if (t.indexOf("3") > -1 && d > -1 && (i ^= 1 << L(a + d, s)),
            t.indexOf("D") > -1 && (i ^= 1 << s),
            o) {
                let u = [];
                for (let p = 0; p < 32; p++)
                    i >> p & 1 && u.push(p);
                let f = 0;
                for (let h = 0; h < 32; h++)
                    u.indexOf(h),
                    i >> h & 1 && (f |= -1 == o.indexOf(u.length - u.indexOf(h)) ? 1 << h + n.positions.length : 1 << h);
                let m = new tp(e);
                for (m.voicing = f; (1 & m.voicing) == 0; ) {
                    let $ = m.voicing;
                    if (ek(m, 0, -1, !0),
                    m.voicing == $)
                        break
                }
                i = m.voicing
            }
            return i
        }
          , ey = new function() {
            let e = !0, t, o = function(e) {
                t && (J("chord-props-tabs").querySelector('[data-value="' + t + '"]').classList.remove("selected"),
                J("chord-props-page-" + t).style.display = "none"),
                J("chord-props-tabs").querySelector('[data-value="' + e + '"]').classList.add("selected"),
                J("chord-props-page-" + e).style.display = "block",
                t = e
            }, n = function() {
                let t = ""
                  , o = r.sequence[I];
                if (o && tp.typeInfo(o.type).playing && 1 == N) {
                    let n = ti.parseType(o.chord)
                      , s = te.get(o.scale || o0(o) || "ionian")
                      , a = {};
                    n.positions.forEach(function(e) {
                        a[e] = !0
                    });
                    let i = [];
                    n.positions.indexOf(4) > -1 || n.positions.indexOf(3),
                    i.push(o),
                    ta.forEach(function(t) {
                        let r = 0;
                        if (t.positions.forEach(function(e) {
                            a[e] && r++
                        }),
                        (r == n.positions.length || r == t.positions.length) && (!e || ob(t.name, 0, 0, s.value))) {
                            let l = new tp(o);
                            Z(l, t.name),
                            i.push(l)
                        }
                    });
                    let l = {};
                    i.sort(function(e, t) {
                        return ta.sortValue(ti.parseType(e.chord)).localeCompare(ta.sortValue(ti.parseType(t.chord)))
                    }).forEach(function(n) {
                        let a = ti.parseType(n.chord);
                        if (l[n.bassPos + "," + a.positions.toString()])
                            return;
                        l[n.bassPos + "," + a.positions.toString()] = !0;
                        let i = tq(tj(a.name, n.rootPos - ("number" == u.chordNotation ? 0 : n.keyChange + n.transpose), n.bassPos, tN(t5(r.scaleKey) + ("number" == u.chordNotation ? 0 : n.keyChange + n.transpose)), u.chordNotation, "") || "-")
                          , c = n.chord == o.chord && n.bassPos == o.bassPos;
                        t += '<div id="' + (n.chord + "-" + n.rootPos + "-" + n.bassPos) + '-10" class="chord-pad" style="' + (c ? "font-weight: bold;" : "") + (e || ob(n.chord, 0, 0, s.value) ? "" : "color: rgba(0,0,0,.5);") + '" data-event="chordPad" data-chord-pad="1" data-chord-item=\'' + JSON.stringify(n) + '\' data-extra="10">' + i + "</div>"
                    })
                }
                J("chord-props-page-extend-buttons").innerHTML = t ? '<div class="chord-props-progression">' + t + "</div>" : '<div class="control"><div class="label" style="font-style: italic;">' + 'No chord selected' + "</div></div>"
            };
            W[H].chordPropsTabs = function(e, t) {
                o(e.target.dataset.value)
            }
            ,
            W[U].chordPropsExtendChordsInScale = function(t, o) {
                e = o.checked,
                n()
            }
            ,
            o("extend"),
            this.update = n
        }
        ;
        this.updateChordProps = function() {
            if (!this.chordPropsVisible())
                return;
            if (J("sequence-chord-props").classList.contains("ideas")) {
                ey.update();
                return
            }
            let e = r.sequence[I];
            if (J("sequence-chord-props").classList.toggle("manual", !!e && !!tp.typeInfo(e.type).playing && !!r.manualChordPositions),
            J("sequence-chord-props").classList.toggle("multiple", !!e && N > 1),
            J("sequence-chord-props").classList.toggle("new", !e),
            J("sequence-chord-props").classList.toggle("empty", !!e && 1 == N && !tp.typeInfo(e.type).playing),
            X(J("item-toggle-voicing-page"), "innerHTML", C ? 'General' : 'Voicing'),
            J("sequence-chord-props").classList.toggle("voicing-page", !!C),
            !e)
                return;
            let t = tB(e)
              , o = ti.parseType(e.chord);
            if (r.manualChordPositions && tp.typeInfo(e.type).playing) {
                X(J("item-voicing").style, "display", 1 == N ? "block" : "none");
                let n = e$(e)
                  , s = Q(e)
                  , a = s.filter(e => e[0] == n)[0]
                  , i = s.filter(t => t[0] == e.voicing || t[0] == e.voicing + "-" + e.chordInv)[0]
                  , l = void 0 != e.voicing ? e.voicing : n
                  , c = {};
                for (let d = 0; d < 32; d++)
                    e.voicing >> d & 1 && (c[(e.chordInv + d) % o.positions.length] = !0);
                X(J("item-voicing-preset"), "innerHTML", '<option value="">' + 'Auto' + (a ? ": " + a[1] + " (" + a[2] + ")" : "") + "</option>" + (i || void 0 == e.voicing ? "" : '<option value="' + l + '">' + 'Custom' + " (" + (l.toString(2).match(/1/g) || []).length + ")</option>") + s.map( (e, t) => (0 == t || e[2] != s[t - 1][2] ? (e > 0 ? "</optgroup>" : "") + '<optgroup label="' + e[2] + " " + 'voices' + '">' : "") + '<option value="' + e[0] + '">' + e[1] + " (" + e[2] + ")</option>").join("") + "</optgroup>"),
                X(J("item-voicing-preset"), "value", i ? i[0] : void 0 != e.voicing ? e.voicing : "");
                let u = J("item-voicing-buttons").childNodes[0];
                for (let p = 0; p < 10; p++) {
                    let f = u.childNodes[p + 1];
                    f.classList.toggle("selected", k + p >= 0 && l >> k + p & 1),
                    X(f, "innerHTML", oe(o.suffix, o.positions[(p + t.chordInv + k + 999 * o.positions.length) % o.positions.length]).replace(/[b#]/g, ""))
                }
                let h = ( () => {
                    let e = {}
                      , n = []
                      , s = 0
                      , a = l;
                    for (; a > 0; )
                        1 & a && (e[(t.chordInv + s) % o.positions.length] = !0),
                        a >>= 1,
                        s++;
                    return o.positions.forEach(function(t, s) {
                        e[s] || 0 == t || 7 == t || n.push(Number(oe(o.suffix, t).replace(/[b#]/g, "")))
                    }),
                    n
                }
                )();
                X(J("item-voicing-incomplete").style, "visibility", h.length > 0 ? "inherit" : "hidden"),
                J("item-voicing-incomplete").innerHTML = 'Missing' + " " + h.sort( (e, t) => e - t).join(" ")
            }
            X(J("item-chord").style, "display", tp.typeInfo(e.type).playing ? "" : "none"),
            X(J("item-chord-icon").style, "display", tp.typeInfo(e.type).playing ? "" : "none"),
            this.updateRootProp(),
            this.updateBassProp(),
            this.updateChordProp(),
            this.updateScaleProp();
            let m = ef("type");
            X(J("item-type"), "value", void 0 != m ? m : "");
            let $ = ef("section")
              , _ = '<option value="" disabled="disabled">-</option>';
            e4.defaultSections.forEach(function(e) {
                _ += '<option value="_' + e[0] + '">' + e[1] + "</option>"
            });
            let y = {};
            r.sequence.forEach(function(e) {
                "string" == typeof e.section && (y[e.section] = !0)
            }),
            Object.keys(y).forEach(function(e) {
                _ += '<option value="' + e + '">' + e + "</option>"
            }),
            _ += '<option value="custom">' + 'Customize' + "…</option>",
            X(J("item-section"), "innerHTML", _),
            X(J("item-section"), "value", void 0 != $ ? ("number" == typeof $ ? "_" : "") + $ : "");
            let v = ef("transpose");
            X(J("item-transpose-steps"), "innerHTML", void 0 != v ? 0 != v ? (v > 0 ? "+" : "") + v : "0" : "-"),
            _ = '<option value="" disabled="disabled">-</option>';
            for (let g = -6; g < 6; g++) {
                let b = L(7 * g + e.keyChange, 12);
                _ += '<option value="' + b + '">' + tN(t5(r.scaleKey) + e.transpose + b) + "</option>"
            }
            let x = ef("keyChange");
            X(J("item-key-change"), "innerHTML", _),
            X(J("item-key-change"), "value", void 0 != x ? x : "");
            let S = ef("length");
            X(J("item-length"), "innerHTML", void 0 != S ? S : "-"),
            J("item-decrease-length").disabled = void 0 == S,
            J("item-increase-length").disabled = void 0 == S;
            let A = ef("speed");
            if (X(J("item-speed"), "innerHTML", void 0 != A && 1 != A ? Math.round(A * r.style.tempo) + " BPM" : "-"),
            tp.typeInfo(e.type).playing) {
                let T = e.rootPos + e.bassPos + t5(r.scaleKey);
                X(J("item-bass-octave").previousSibling, "disabled", "onlyChord" == e.type ? "disabled" : ""),
                X(J("item-bass-octave").nextSibling, "disabled", "onlyChord" == e.type ? "disabled" : ""),
                X(J("item-bass-octave"), "innerHTML", 1 == N ? tN(T) + (t.bassOctave + r.style.bass.octave + Math.floor(T / 12)) : "-");
                let w = t.chordInv;
                if (e.voicing) {
                    for (let P = 0; P < 32; P++)
                        if (e.voicing >> P & 1) {
                            w += P;
                            break
                        }
                }
                let E = e.rootPos + 12 * Math.floor(w / o.positions.length) + o.positions[(w + o.positions.length) % o.positions.length] + t5(r.scaleKey);
                X(J("item-chord-inv").previousSibling, "disabled", "onlyBass" == e.type ? "disabled" : ""),
                X(J("item-chord-inv"), "innerHTML", 1 == N ? tN(E) + (t.chordOctave + r.style.chord.octave + Math.floor(E / 12)) : "-"),
                X(J("item-chord-inv").nextSibling, "disabled", "onlyBass" == e.type ? "disabled" : "")
            }
            this.updateChordPreview()
        }
        ,
        this.setCursorPos = function(e, t) {
            void 0 != e && (I = Math.min(Math.max(e, 0), r.sequence.length)),
            N = Math.min(t || 1, I < r.sequence.length ? r.sequence.length - I : 1),
            em.childNodes.forEach(function(e) {
                let t = Number(e.dataset.sequenceId);
                e.classList.toggle("cursor", t >= I && t < I + N)
            }),
            t7.updateExtra(),
            k = 0
        }
        ,
        this.clickItem = function() {
            let e = r.sequence[I];
            e && (j ? p.replaySequence(p.cursorTime()) : (p.stopChord(),
            p.startChord(e),
            r.manualChordPositions && tm.updateHandles()))
        }
        ,
        this.releaseItem = function() {
            p.stopChord(),
            r.manualChordPositions && tm.updateHandles()
        }
        ,
        this.recordChord = function(e, t) {
            if (!q && (!t || !t.ctrlKey && !t.metaKey) || void 0 == I)
                return;
            let o = new tp(e);
            return r.manualChordPositions && (o = tB(o)),
            Y ? (o.length = I == r.sequence.length ? w[r.style.timeSignature].beats : r.sequence[I].length,
            r.sequence[I] = o) : (o.length = w[r.style.timeSignature].beats,
            r.sequence.splice(I, 0, o)),
            o8("Recorded chord " + tN(o.rootPos + t5(r.scaleKey)) + ti.parseType(o.chord).suffix),
            this.setCursorPos(I + 1),
            this.update(),
            o
        }
        ,
        this.getItem = function(e) {
            return r.sequence[r.loopSequence ? e % r.sequence.length : e]
        }
        ,
        this.animateSequenceItem = function(e, t, o) {
            let n = [];
            for (let s = em.childNodes.length - 1; s >= 0; s--) {
                let a = em.childNodes[s]
                  , i = Number(a.dataset.sequenceId);
                !(i < e) && !(i >= e + t) && n.push(a)
            }
            em.childNodes[e],
            n.forEach(function(e) {
                e.classList.add("no-transition"),
                e.style.opacity = o ? 0 : 1
            }),
            setTimeout(function() {
                n.forEach(function(e) {
                    e.classList.remove("no-transition"),
                    e.style.opacity = o ? 1 : 0
                })
            }, 0)
        }
        ;
        let eb, e0;
        e0 = {
            0: .5,
            1: 1,
            2: 2
        },
        eb = function() {
            let e = 9999
              , t = 0;
            return r.sequence.forEach(function(o) {
                t += o.length,
                o.length < e && (e = o.length)
            }),
            e0[eP.currentZoom] * (t <= 16 ? Math.max(t + 4, 16) : (document.body.clientWidth <= 414 && e < 4 ? 4 : 8) * w[r.style.timeSignature].beats)
        }
        ;
        let ex = function(t) {
            let o = e.getItem(t)
              , n = e.getItem(t + 1)
              , s = (0 == o.chord.indexOf("maj") || 0 == o.chord.indexOf("dom")) && n && tp.typeInfo(o.type).playing && tp.typeInfo(n.type).playing && 0 != n.rootPos && (o.rootPos + 5) % 12 == n.rootPos
              , a = (0 == o.chord.indexOf("dim") || "min7b5" == o.chord) && n && tp.typeInfo(o.type).playing && tp.typeInfo(n.type).playing && 0 != n.rootPos && (o.rootPos + 1) % 12 == n.rootPos;
            if (!a && !s)
                return null;
            let i = o.scale || o0(o) || "ionian";
            return tj(o.chord, a ? 11 : 7, o.bassPos, void 0, "roman-numeral", void 0, i) + "/" + (ex(t + 1) || tj(0 == n.chord.indexOf("min") ? "min" : "maj", n.rootPos - o.transpose, 0, void 0, "roman-numeral")).replace(/<sup>.+?<\/sup>/, "")
        };
        this.update = function() {
            let e = ""
              , t = 0
              , o = eb()
              , n = w[r.style.timeSignature].beats
              , s = te.get(r.scale)
              , a = u.chordControlEnabled ? to[s.scaleGroup][eP.currentMode] : r.scale;
            r.sequence.forEach(function(e, o) {
                t += e.length
            });
            let i = 0
              , l = 0;
            r.sequence.forEach(function(t, s) {
                let c = t.length;
                for (; c > 0; ) {
                    let d = "rest" == t.type ? "" : "break" == t.type ? '<i style="opacity: 0.3;">//</i>' : ("roman-numeral" == u.chordNotation && eP.showSecondarySyntax ? ex(s) : "") || tj(t.chord, "number" != u.chordNotation ? t.rootPos - t.transpose - t.keyChange : t.rootPos, t.bassPos, tN(t5(r.scaleKey) + t.transpose + t.keyChange), u.chordNotation, a)
                      , p = 0 == s || t.section && t.section != r.sequence[s - 1].section
                      , f = s == r.sequence.length - 1 || r.sequence[s + 1].section && t.section != r.sequence[s + 1].section
                      , h = i + c > o ? o - i : c
                      , m = h != c || !f
                      , $ = c < t.length || !p
                      , _ = 100 * h / o
                      , y = Math.ceil(em.clientWidth)
                      , v = tp.typeInfo(t.type).playing ? ("default" != u.chordNotation || u.chordControlEnabled ? tj(t.chord, "number" != u.chordNotation ? t.rootPos - t.transpose - t.keyChange : t.rootPos, t.bassPos, tN(t5(r.scaleKey) + t.transpose + t.keyChange), "default" == u.chordNotation ? "roman-numeral" : "default", a) : "").replace(/<.+?>/g, "") + (1 != t.speed ? "\n" + Math.round(t.speed * r.style.tempo) + " BPM" : "") : "";
                    e += '<div style="background-position-x: ' + -(l % n) * y / o + "px, " + ("break" == t.type ? 0 : -(l % n) * y / o) + "px; background-size: " + 100 / h + "% 100%, " + 100 * n / h + "% 100%; width: " + _ + '%;" title="' + v + '" class="item' + (m ? " begin" : "") + ($ ? " end" : "") + '" data-event="seqItem" data-sequence-id="' + s + '">' + (d ? "<span>" + tq(d) + "</span>" + (t.transpose + t.keyChange != 0 ? (t.transpose,
                    '<div class="transpose">' + tN(t5(r.scaleKey) + t.transpose + t.keyChange) + "</div>") : "") : "<span>&nbsp;</span>") + (c == t.length && t.section ? '<div class="section" data-event="seqItemSection" data-index="' + s + '">' + e4.sectionName(t.section) + "</div>" : "") + "</div>",
                    "break" != t.type && (l += h),
                    (i += h) >= o && (i = 0),
                    c -= h
                }
            });
            let c = o - t % o;
            e += '<div class="item extra" data-event="seqItem" data-sequence-id="' + r.sequence.length + '" style="width: calc(' + 100 * c / o + '% - 2px)"><span>' + 'Drag and drop chords here' + '</span></div><div id="sequence-mark" class="mark"></div>';
            let d = em.scrollTop;
            em.innerHTML = e,
            this.setCursorPos(I, N),
            this.updateChordProps(),
            setTimeout(function() {
                em.scrollTop = d,
                em.height = ""
            }, 0)
        }
        ,
        this.setChordRecording = function(e) {
            (q = void 0 != e ? e : !q) ? (J("sequence").classList.add("record"),
            J("sequence-record").classList.add("active"),
            Y = I < r.sequence.length,
            J("sequence").classList.toggle("record-replace", Y),
            this.setCursorPos(I, 1)) : (J("sequence").classList.remove("record"),
            J("sequence-record").classList.remove("active"))
        }
        ,
        this.setMelodyRecording = function(t) {
            let o = void 0 != t ? t : !D;
            o != D && ((D = o) ? (J("keyboard-record").classList.add("active"),
            t7.disable(),
            void 0 != t || j || e.startSequence({
                force: !0,
                ofsTime: e.cursorTime(),
                countOff: !0
            })) : (r.melody.events = r.melody.events.concat(S).sort(function(e, t) {
                return e[0] - t[0]
            }),
            S.length = 0,
            o8("Recorded melody"),
            J("keyboard-record").classList.remove("active"),
            t7.enable(),
            void 0 == t && j && e.stopSequence()))
        }
        ,
        this.previewArp = function(e, t) {
            let o = r.sequence[I];
            if (!o || e.remaining)
                return;
            let n = tB(o)
              , s = of(n, t)
              , a = o_(e, e.n, o, s, t);
            o9.press(t, a, e.velocity * r.style[t].velocity)
        }
        ,
        this.recordNote = function(e, t) {
            if (!this.isSequencePlaying())
                return;
            let n = Math.round((l.current().context.currentTime - o) / t3() * 1e3) / 1e3;
            if (t > 0)
                A[e] = S.length,
                S.push([Math.max(n, 0), e - t5(r.scaleKey), Math.round(1e3 * t) / 1e3, 1, u.keyboardSustain ? 1 : 0]);
            else if (e in A) {
                let s = S[A[e]];
                s[3] = Math.round((n - s[0]) * 1e3) / 1e3,
                delete A[e]
            }
        }
        ,
        this.changeBeats = function(e) {
            if (I == r.sequence.length)
                return;
            let t = w[r.style.timeSignature];
            ep(function(o) {
                o.length = Math.min(Math.max(Math.round(o.length + .999999 * e), 1), 128 * t.beats)
            }),
            o8("Updated duration " + (e > 0 ? "+" : "") + e),
            this.update()
        }
        ;
        let ek = function(e, t, o=0, n=!1) {
            let s = ti.parseType(e.chord);
            if (!s)
                return;
            let a = {};
            if (e.voicing) {
                let i = {};
                for (let r = 0; r < 32; r++)
                    e.voicing >> r & 1 && (i[r % s.positions.length] = !0);
                a = Object.keys(i).map(e => Number(e)).sort()
            }
            let l = e.chordInv;
            if (0 != t)
                do
                    if (e.chordInv += t,
                    !n) {
                        o > 0 && (e.voicing <<= o),
                        o < 0 && (e.voicing >>= -o);
                        break
                    }
                while (e.voicing && -1 == a.indexOf(L(e.chordInv - l, s.positions.length)) || !e.voicing && (1 & e$(e)) == 0);
            if (e.voicing && n) {
                var c = 0;
                for (let d = 0; d < 32; d++)
                    if (e.voicing >> d & 1) {
                        let u = d;
                        do
                            u += t + o;
                        while (-1 == a.indexOf(L(u, s.positions.length)));
                        let p = u - (e.chordInv - l);
                        if (p < 0) {
                            c = e.voicing;
                            break
                        }
                        c |= 1 << p
                    }
                e.voicing = c
            }
            e.chordInv < 0 && (e.chordInv += s.positions.length,
            void 0 != e.chordOctave && e.chordOctave--),
            e.chordInv >= s.positions.length && (void 0 != e.chordOctave && (e.chordInv -= s.positions.length),
            e.chordOctave++)
        };
        this.changeInv = function(e) {
            if (I != r.sequence.length) {
                if (N > 1)
                    ep(function(t, o) {
                        t.chordOctave += e
                    });
                else {
                    let t = r.sequence[I];
                    for (; t.voicing && (1 & t.voicing) == 0; )
                        ek(t, 1, -1);
                    ek(t, e, 0, !0)
                }
            }
        }
        ,
        this.changeBassOctave = function(e) {
            let t = r.sequence[I];
            ti.parseType(t.chord) && (ep(function(t, o) {
                t.bassOctave += e
            }),
            o8("Changed bass octave " + (e > 0 ? "+" : "") + e),
            this.updateChordProps(),
            this.clickItem())
        }
        ,
        this.changeBassPos = function(e) {
            let t = r.sequence[I]
              , o = ti.parseType(t.chord);
            if (!o)
                return;
            let n = o.positions.indexOf(t.bassPos);
            t.bassPos = n > -1 ? o.positions[(n + e + o.positions.length) % o.positions.length] : 0,
            o8("Changed bass note " + (e > 0 ? "+" : "") + e),
            this.update(),
            this.clickItem()
        }
        ,
        this.transposeChord = function(e, t, o) {
            if (tp.typeInfo(e.type).playing) {
                if (ti.parseType(e.chord),
                !o) {
                    let n = e.rootPos + t;
                    e.rootPos = (n + 12) % 12,
                    r.manualChordPositions && (n < 0 && (e.chordOctave--,
                    e.bassOctave--),
                    n >= 12 && (e.chordOctave++,
                    e.bassOctave++))
                }
                e.transpose += t
            }
        }
        ,
        this.transposeChords = function(t) {
            let o = eP.transposeLock;
            if (0 == I && N == r.sequence.length) {
                let n = t5(r.scaleKey) + t;
                n < 0 && (r.style.chord.octaveOffset -= 12,
                r.style.bass.octaveOffset -= 12),
                n >= 12 && (r.style.chord.octaveOffset += 12,
                r.style.bass.octaveOffset += 12),
                r.scaleKey = tN(n, "ionian", "C"),
                ep(function(e, n) {
                    o && (e.rootPos = (e.rootPos - t + 12) % 12)
                }),
                o8("Transposed scale " + (t > 0 ? "+" : "") + t),
                tO(),
                this.clickItem();
                return
            }
            ep(function(n, s) {
                e.transposeChord(n, t, o)
            }),
            o8("Transposed key " + (t > 0 ? "+" : "") + t),
            this.updateChordProps(),
            this.update(),
            this.clickItem()
        }
        ,
        this.deleteItem = function() {
            I != r.sequence.length && (e.animateSequenceItem(I, N, !1),
            setTimeout(function() {
                e.update()
            }, 500),
            r.sequence.splice(I, N),
            o8("Deleted chord"))
        }
        ,
        this.changeCursor = function(e, t) {
            t ? this.setCursorPos(I, N + e) : this.setCursorPos(I + e);
            let o = r.sequence[I];
            o && (eP.transpose = o.transpose,
            eP.keyChange = o.keyChange,
            tU(),
            tJ()),
            this.updateChordProps()
        }
        ,
        this.updateBassProp = function() {
            let e = this.getItem(I)
              , t = ti.parseType(e.chord)
              , o = "";
            if (tp.typeInfo(e.type).playing) {
                let n = []
                  , s = te.get(r.scale)
                  , a = u.chordControlEnabled ? to[s.scaleGroup][eP.currentMode] : r.scale;
                for (let i = 0; i < 12; i++) {
                    let l = t.positions.indexOf(i) > -1
                      , c = s.steps.indexOf((e.rootPos + i) % 12) > -1
                      , d = tN(t5(r.scaleKey) + e.rootPos + i - ("roman-numeral" == u.chordNotation ? e.transpose : 0), a, r.scaleKey, u.chordNotation)
                      , p = 0 == i ? 'Root' : "roman-numeral" == u.chordNotation ? oe(t.suffix, i) : "roman-numeral" == u.chordNotation ? d : "/" + d;
                    n[l ? 0 : c ? 1 : 2] += '<option value="' + i + '">' + p + "</option>"
                }
                o = '<optgroup label="' + 'Notes in chord' + '">' + n[0] + '</optgroup><optgroup label="' + 'Notes in scale' + '">' + n[1] + '</optgroup><optgroup label="' + 'Other notes' + '">' + n[2] + "</optgroup>"
            }
            X(J("item-bass-pos"), "innerHTML", o),
            X(J("item-bass-pos"), "value", e.bassPos)
        }
        ,
        this.updateRootProp = function() {
            let e = this.getItem(I);
            if (!e)
                return;
            let t = []
              , o = te.get(r.scale)
              , n = u.chordControlEnabled ? to[o.scaleGroup][eP.currentMode] : r.scale;
            for (let s = 0; s < 12; s++) {
                let a = L(s + e.transpose + e.keyChange, 12)
                  , i = o.steps.indexOf(L(a - e.transpose - e.keyChange, 12))
                  , l = tN(t5(r.scaleKey) + a, n, tN(t5(r.scaleKey) + e.transpose + e.keyChange), u.chordNotation);
                t[i > -1 ? 0 : 1] += '<option value="' + a + '">' + l + "</option>"
            }
            let c = '<optgroup label="' + 'Notes in scale' + '">' + t[0] + '</optgroup><optgroup label="' + 'Other notes' + '">' + t[1] + "</optgroup>";
            X(J("item-root-pos"), "innerHTML", c),
            X(J("item-root-pos"), "value", tp.typeInfo(e.type).playing ? e.rootPos : "")
        }
        ,
        this.updateChordProp = function() {
            let e = this.getItem(I);
            te.get(r.scale),
            X(J("item-chord"), "innerHTML", oA()),
            X(J("item-chord"), "value", e.chord)
        }
        ,
        this.updateScaleProp = function() {
            let e = ""
              , t = this.getItem(I);
            if (tp.typeInfo(t.type).playing) {
                let o = ti.parseType(t.chord);
                te.get(r.scale);
                let n = t5(r.scaleKey) + t.rootPos, s = tN(n), a = o0(t), i = "", l = !1, c;
                te.forEach(function(d) {
                    let u = !0;
                    if (o.positions.forEach(function(e) {
                        -1 == d.steps.indexOf(e % 12) && (u = !1)
                    }),
                    !u)
                        return;
                    d.scaleGroup != c && (e += (c ? "</optgroup>" : "") + '<optgroup label="' + tt[d.scaleGroup].name + '">',
                    c = d.scaleGroup);
                    let p;
                    if (t.rootPos != (t.transpose + t.keyChange + 119988) % 12) {
                        let f = ok(t, d.value);
                        f && (p = te.get(f))
                    }
                    let h = (p || d).steps.map(function(e) {
                        return tN((p ? t5(r.scaleKey) + t.transpose + t.keyChange : n) + e, (p || d).value, p ? r.scaleKey : s)
                    }).join(" ");
                    d.value == t.scale && (l = !0);
                    let m = tN(t5(r.scaleKey) + t.transpose + t.keyChange);
                    a == d.value && (i = p ? tF(m, p) : tF(s, d)),
                    e += '<option value="' + d.value + '" title="' + h + '">' + (p ? tF(m, p) + " / " : "") + tF(s, d) + (a == d.value ? " *" : "") + "</option>"
                }),
                e = '<option value="">' + 'Auto' + (i ? ": " + i : "") + "</option>" + e
            }
            X(J("item-scale"), "innerHTML", e),
            X(J("item-scale"), "value", t.scale || "")
        }
        ,
        this.chordPropsVisible = function() {
            return J("sequence-chord-props").classList.contains("active")
        }
        ,
        this.showChordProps = function(t) {
            J("sequence-chord-props").classList.add("active"),
            J("sequence-chord-props").classList.toggle("ideas", !!t),
            J("sequence-chord-props").classList.toggle("edit", !t),
            e.getItem(I),
            e.updateChordProps(),
            e.updateChordPreview(),
            tm.updateHandles(),
            e.setChordRecording(!1)
        }
        ;
        let eC = function() {
            J("sequence-chord-props").classList.remove("active"),
            on(null),
            tm.updateHandles()
        };
        this.hideChordProps = function() {
            eC()
        }
        ,
        J("sequence-undo").onclick = function() {
            t7.undo()
        }
        ,
        J("sequence-redo").onclick = function() {
            e.setChordRecording(!1),
            t7.redo()
        }
        ;
        let eS;
        J("sequence-play").onmousedown = function(e) {
            p.isSequencePlaying() ? p.stopSequence() : eS = setTimeout(function() {
                eS = void 0,
                p.startSequence({
                    force: !0,
                    countOff: !0
                })
            }, 1e3)
        }
        ,
        J("sequence-play").onclick = function(t) {
            eS && (clearTimeout(eS),
            eS = void 0,
            e.toggleSequence("roll" == nC ? o9.pianoRollTime() : e.cursorTime()))
        }
        ,
        J("sequence-record").onclick = function() {
            e.setChordRecording(),
            e.stopSequence()
        }
        ,
        J("sequence-items").onmouseover = function() {
            r.manualChordPositions && p.isSequencePlaying()
        }
        ,
        J("item-length").onclick = function() {
            let t = ef("length")
              , o = prompt('Duration' + " (" + 'beats' + ")", void 0 != t ? t : "");
            if (null == o)
                return;
            let n = Number(o.replace(",", "."));
            if (!isNaN(n))
                n = Math.min(Math.max(n, .25), 128 * w[r.style.timeSignature].beats),
                ep(function(e) {
                    e.length = n
                }),
                o8("Updated chord duration " + n),
                e.update()
        }
        ,
        J("item-speed").onclick = function() {
            let t = ef("speed")
              , o = prompt('New tempo at chord' + " (" + 'main tempo' + " " + r.style.tempo + " BPM)", void 0 != t && 1 != t ? Math.round(t * r.style.tempo) : "");
            if (null == o)
                return;
            let n = Number(o);
            !isNaN(n) && (0 == n ? n = r.style.tempo : 0 == I && (r.style.tempo = n),
            ep(function(e) {
                e.speed = n / r.style.tempo
            }),
            o8("Updated chord tempo " + n),
            e.update())
        }
        ,
        J("item-section").onchange = function(t) {
            let o = this.value;
            if (o.match(/^_\d+$/) && (o = Number(o.substr(1))),
            "custom" == o) {
                let n = r.sequence[I].section
                  , s = prompt('Enter label', 0 != n ? e4.sectionName(n) : "");
                if (null == s || "" == s) {
                    e.updateChordProps();
                    return
                }
                o = e4.sectionValue(s)
            }
            ep(function(e) {
                e.section = 0
            });
            r.sequence[I].section = o,
            e.update(),
            o8("Updated chord section " + e4.sectionName(o))
        }
        ,
        J("item-transpose-lock").onclick = function() {
            eP.transposeLock = !eP.transposeLock,
            this.classList.toggle("selected")
        }
        ,
        J("item-transpose-steps").onclick = function() {
            let t = eP.transposeLock
              , o = ef("transpose")
              , n = prompt('Key change' + " (\xb1" + 'Half steps'.toLowerCase() + ")", void 0 != o ? o : "");
            if (null == n)
                return;
            let s = Number(n);
            if (isNaN(s))
                return;
            ep(function(o) {
                e.transposeChord(o, -o.transpose, t),
                e.transposeChord(o, s, t)
            }),
            o8("Updated transpose " + s),
            e.update();
            let a = r.sequence[I];
            a && (eP.transpose = a.transpose,
            tO())
        }
        ,
        J("item-key-change").onchange = function() {
            let t = Number(this.value);
            if (0 == I && N == r.sequence.length) {
                r.scaleKey = tN(t5(r.scaleKey) + t, "ionian", "C"),
                o8("Updated scale to " + r.scaleKey),
                tO();
                return
            }
            ep(function(e) {
                e.keyChange = t
            }),
            o8("Updated key change " + t),
            e.update();
            let o = r.sequence[I];
            o && (eP.keyChange = o.keyChange,
            tO())
        }
        ,
        J("sequence-items").onmouseout = function() {
            r.manualChordPositions && p.isSequencePlaying()
        }
        ,
        W[H].clickChordsDropDown = function(e, t) {
            let o = [['{"diatonicChords":["diatonic-sus2","diatonic-triad","diatonic-sus4","diatonic-7"],"otherChords":[],"parallellScale":false}', "Sus2, " + 'Triad' + ", Sus4, 7"], ['{"diatonicChords":["diatonic-triad","diatonic-sus4","diatonic-7"],"otherChords":[{"chord":"dom7"}],"parallellScale":false}', 'Triad' + ", Sus4, 7, " + 'Dom' + " 7"], ['{"diatonicChords":["diatonic-triad","diatonic-7"],"otherChords":[],"parallellScale":true}', 'Triad' + ", 7 x " + 'Major' + "/" + 'Minor'], ["custom", 'Customize' + "…"], ]
              , n = JSON.stringify({
                diatonicChords: Object.keys(r.chordLayout),
                otherChords: r.customChords,
                parallellScale: r.parallellScaleChords
            });
            eg({
                elem: t,
                direction: "left-down",
                value: o.find(function(e) {
                    return e[0] == n
                }) ? n : "custom",
                options: o,
                onSelect: function(e) {
                    if ("custom" == e)
                        nP();
                    else {
                        let t = JSON.parse(e);
                        r.chordLayout = {},
                        t.diatonicChords.forEach(function(e) {
                            r.chordLayout[e] = !0
                        }),
                        r.customChords = t.otherChords,
                        r.parallellScaleChords = t.parallellScale,
                        eP.chordsDom = !1,
                        eP.chordsExt = !1,
                        o8("Updated available chords"),
                        tO()
                    }
                }
            })
        }
        ;
        let e1 = function() {
            document.body.querySelectorAll('.chords-right [data-event="clickChordsHold"]').forEach(function(e) {
                e.classList.toggle("highlighted", u.chordsHoldChord)
            })
        };
        W[H].clickChordsHold = function(e, t) {
            u.chordsHoldChord = !u.chordsHoldChord,
            oK(),
            e1(),
            p.isSequencePlaying() || p.stopChord()
        }
        ,
        e1(),
        W[H].seqItemSection = function(t, o) {
            let n = Number(o.dataset.index);
            r.sequence[n].section;
            let s = n;
            for (; s < r.sequence.length - 1 && !r.sequence[s + 1].section; )
                s++;
            e.setCursorPos(n, s - n + 1),
            e.updateChordProps()
        }
        ,
        W[K].seqItemSection = function() {
            "compose" == nC && p.showChordProps()
        }
        ;
        let e2, eA;
        W[G].seqItem = function(t, o) {
            let n = Number(o.dataset.sequenceId)
              , s = e.getItem(n)
              , a = I
              , i = N;
            if (p.chordRecording(t)) {
                let l = o.getBoundingClientRect()
                  , c = t.pageX - l.x
                  , d = s ? l.width / s.length / 2 : 0;
                Y = n < r.sequence.length && c > d && c < l.width - d,
                J("sequence").classList.toggle("record-replace", Y),
                p.setCursorPos(n + (c >= l.width - d ? 1 : 0)),
                tJ()
            } else
                no.ShiftLeft ? n > I ? p.setCursorPos(I, n - I + 1) : p.setCursorPos(n, I + N - n) : (p.changeCursor(n - I),
                p.clickItem()),
                e2 = eA = n;
            let u = function() {
                e.setCursorPos(a, i),
                e2 = void 0
            };
            J("sequence-items").addEventListener("scroll", u),
            W[B].all = function() {
                J("sequence-items").removeEventListener("scroll", u),
                delete W[B].all,
                p.releaseItem(),
                void 0 != e2 && N > 1 && "compose" == nC && p.showChordProps(),
                e2 = void 0
            }
        }
        ,
        W[R].seqItem = function(e, t) {
            let o = Number(t.dataset.sequenceId);
            if (ne.isDragging()) {
                ne.hoverSeqItem(o, e, t);
                return
            }
            if (!p.chordRecording(e) && void 0 != e2 && o != eA) {
                p.stopChord();
                let n = Math.min(o, e2);
                p.setCursorPos(n, Math.max(o, e2) - n + 1),
                p.chordPropsVisible() && eC(),
                eA = o,
                on(null),
                tJ()
            }
        }
        ,
        W[O].seqItem = function(t, o) {
            let n = Number(o.dataset.sequenceId);
            if (!(n == r.sequence.length || p.chordPropsVisible() || N > 1 || ne.isDragging()) && "compose" == nC)
                on(e.getItem(n))
        }
        ,
        W[M].seqItem = function(e, t) {
            !(p.chordPropsVisible() || ne.isDragging()) && "compose" == nC && on(null)
        }
        ,
        W[K].seqItem = function(e, t) {
            "compose" == nC && p.showChordProps()
        }
        ;
        let eT = function(e) {
            W[B].all = function() {
                delete W[B].all,
                p.releaseItem(),
                e && e()
            }
        };
        W[O].seqVoicingToggle = function(e, t) {
            let o = Number(t.dataset.index)
              , n = tB(r.sequence[I]);
            n.voicing = void 0,
            n.chordInv += k;
            let s = of(n, "chord", !1, {})[o];
            if (void 0 == s)
                return;
            let a = ti.parseType(n.chord)
              , i = t5(r.scaleKey) + n.rootPos
              , l = L(s - i, 12);
            tm.press(s, "hold-hover", oe(a.suffix, l))
        }
        ,
        W[M].seqVoicingToggle = function(e, t) {
            let o = Number(t.dataset.index)
              , n = tB(r.sequence[I]);
            n.chordInv += k,
            n.voicing = void 0;
            let s = of(n, "chord", !1, {})[o];
            void 0 != s && tm.release(s, "hold-hover")
        }
        ,
        W[G].seqVoicingToggle = function(e, t) {
            let o = Number(t.dataset.index)
              , n = r.sequence[I]
              , s = void 0 != n.voicing ? n.voicing : e$(n);
            k + o < 0 && (ek(n, k),
            s <<= -k,
            k = 0),
            s ^= 1 << o + k;
            for (let a = 0; a < 32; a++)
                if (s >> a & 1) {
                    ek(n, a),
                    s >>= a,
                    k -= a;
                    break
                }
            n.voicing = s,
            p.clickItem(),
            o8("Updated chord voicing"),
            p.updateChordProps(),
            eT()
        }
        ;
        let e3 = '<div class="item-voicing buttons buttons-horizontal"><button id="item-voicing-left" data-event="seqVoicingLeft">❮</button>';
        for (let ew = 0; ew < 10; ew++)
            e3 += '<button data-event="seqVoicingToggle" data-index="' + ew + '"></button>';
        e3 += '<button id="item-voicing-right" data-event="seqVoicingRight">❯</button></div>',
        k = 0,
        J("item-voicing-buttons").innerHTML = e3;
        let e5 = function(e) {
            k += e,
            k = Math.min(k, 21),
            p.updateChordProps()
        };
        W[G].seqVoicingLeft = function() {
            e5(-1)
        }
        ,
        W[G].seqVoicingRight = function() {
            e5(1)
        }
        ,
        W[U].seqVoicingPreset = function(e, t) {
            let o = t.value.split("-")
              , n = Number(o[0])
              , s = o[1] ? Number(o[1]) : null;
            ep(function(e) {
                let t = ti.parseType(e.chord)
                  , o = e => {
                    let t = e.voicing || e$(e)
                      , o = 0;
                    for (; t >>= 1; )
                        o++;
                    return o
                }
                  , a = o(e);
                if (e.voicing = n || void 0,
                null != s)
                    e.chordOctave = e.bassOctave - r.style.chord.octave + r.style.bass.octave,
                    e.chordInv = s;
                else {
                    let i = a - o(e)
                      , l = i / Math.abs(i)
                      , c = e.chordOctave * t.positions.length + e.chordInv + o(e);
                    if (0 != i)
                        for (; ; ) {
                            ek(e, l, 0, !0);
                            let d = e.chordOctave * t.positions.length + e.chordInv + o(e);
                            if (Math.abs(d - c) >= Math.abs(i))
                                break
                        }
                }
            }),
            p.clickItem(),
            setTimeout( () => p.releaseItem(), 500),
            o8("Updated chord voicing"),
            k = 0,
            p.updateChordProps()
        }
        ,
        W[G].seqIncChordInv = function() {
            e.changeInv(1),
            o8("Changed chord inversion +1"),
            e.updateChordProps(),
            e.clickItem(),
            eT()
        }
        ,
        W[G].seqDecChordInv = function() {
            e.changeInv(-1),
            o8("Changed chord inversion -1"),
            e.updateChordProps(),
            e.clickItem(),
            eT()
        }
        ,
        W[G].seqIncBassOctave = function() {
            e.changeBassOctave(1),
            eT()
        }
        ,
        W[G].seqDecBassOctave = function() {
            e.changeBassOctave(-1),
            eT()
        }
        ,
        W[G].seqIncBassPos = function() {
            e.changeBassPos(1),
            eT()
        }
        ,
        W[G].seqDecBassPos = function() {
            e.changeBassPos(-1),
            eT()
        }
        ,
        W[G].seqTranspose = function(t, o) {
            let n = Number(o.dataset.amount);
            e.transposeChords(n);
            let s = r.sequence[I];
            s && (eP.transpose = s.transpose,
            eP.keyChange = 0,
            tO()),
            eT()
        }
        ,
        W[G].seqChangeLength = function(t, o) {
            let n = Number(o.dataset.amount);
            e.changeBeats(n)
        }
        ,
        W[H].seqToggleVoicingPage = function(t, o) {
            C = !C,
            e.update()
        }
        ,
        W[H].seqActions = function(t, o) {
            let n = function() {
                z = JSON.parse(JSON.stringify(r.sequence.slice(I, I + N)))
            }
              , s = {
                copy: function() {
                    n(),
                    e.updateChordProps()
                },
                paste: function() {
                    0 != z.length && (z.forEach(function(e, t) {
                        r.sequence.splice(I + t, 0, new tp(e))
                    }),
                    N = z.length,
                    o8("Pasted chords"),
                    e.update(),
                    e.animateSequenceItem(I, N, !0))
                },
                cut: function() {
                    n(),
                    e.deleteItem()
                }
            };
            eg({
                elem: o,
                options: [["cut", 'Cut'], ["copy", 'Copy'], ["paste", 'Paste'], ],
                onSelect: function(e) {
                    s[e]()
                }
            })
        }
        ,
        W[H].seqAdvanced = function(e) {
            J("sequence-chord-props").classList.toggle("advanced"),
            e.target.innerHTML = J("sequence-chord-props").classList.contains("advanced") ? 'Less' : 'More'
        }
        ,
        W[H].seqInsertRest = function() {
            let t = new tp({
                type: "rest",
                chord: "maj",
                length: w[r.style.timeSignature].beats
            });
            r.manualChordPositions && (t = tB(t)),
            r.sequence.push(t),
            e.update(),
            o8("Insert rest")
        }
        ,
        W[G].seqInsertRandom = function() {
            let t = Object.keys(r.chordLayout);
            r.customChords.forEach(function(e) {
                t.push(e.chord)
            });
            let o = r.parallellScaleChords ? ["ionian" == r.scale ? "aeolian" : "ionian", r.scale] : [r.scale]
              , n = {
                sus2: .05,
                sus4: .05,
                min7b5: .05,
                dim: .05,
                maj7: .3
            }
              , s = o[Math.floor(Math.random() * o.length)];
            te.get(s);
            let a, i, l = {}, c = {};
            r.sequence.forEach(function(e) {
                l[e.rootPos] = !0,
                c[e.chord + e.rootPos] = !0
            });
            do {
                let d = t[Math.floor(Math.random() * t.length)]
                  , u = Math.floor(7 * Math.random());
                a = tG(d, u, s),
                i = te.get(s).steps[u]
            } while (!a || a in n && Math.random() > n[a] || l[i] && Math.random() > .05 || c[a + i] && Math.random() > .05 || a.match(/b2|#4/));
            let f = new tp({
                chord: a,
                rootPos: i,
                length: w[r.style.timeSignature].beats
            });
            r.manualChordPositions && (f = tB(f)),
            r.sequence.push(f),
            I++,
            e.update(),
            o8("Insert random chord"),
            p.startChord(f),
            eT()
        }
        ,
        W[H].seqShowChordProps = function(e) {
            p.showChordProps()
        }
        ,
        W[H].seqZoomChords = function(e) {
            eP.currentZoom = (eP.currentZoom + 1) % 3,
            ev('Zoom' + ": " + 200 * Math.pow(.5, eP.currentZoom) + "%"),
            p.update()
        }
        ,
        W[H].seqEditList = function(e) {
            let t = !0
              , o = w[r.style.timeSignature]
              , n = "multiple"
              , s = !1;
            r.sequence.forEach(function(e) {
                Math.floor(e.length / o.beats) != e.length / o.beats && (t = !1),
                0 != e.bassPos && (n = "bass")
            });
            let a = t ? o.beats : 1, i, l, c, d, p, f = (i = [],
            l = 1,
            c = 0,
            d = 0,
            p = "default",
            r.sequence.forEach(function(e) {
                let t = e.length / a
                  , o = ti.parseType(e.chord)
                  , n = tN(t5(r.scaleKey) + e.rootPos - ("roman-numeral" == u.chordNotation ? e.transpose : 0), r.scale, tN(t5(r.scaleKey) + e.transpose), "number" == u.chordNotation ? "default" : u.chordNotation)
                  , s = o.suffix;
                "roman-numeral" == u.chordNotation && (o.name.indexOf("min") > -1 || o.name.indexOf("dim") > -1) && (n = n.toLowerCase(),
                s.match(/^maj/) || (s = s.replace(/^m/, "")));
                let f = tp.typeInfo(e.type).playing;
                i.push((f && e.type != p ? e.type + " " : "") + (0 != e.section ? "<" + e4.sectionName(e.section) + "> " : "") + (e.speed != l ? Math.round(r.style.tempo * e.speed) + "BPM " : "") + (e.transpose != d ? "tr" + (e.transpose > 0 ? "+" : "") + e.transpose + " " : "") + (e.keyChange != c ? "kc" + (e.keyChange > 0 ? "+" : "") + e.keyChange + " " : "") + (1 == t ? "" : tL(t)) + (f ? n + s + (0 == e.bassPos ? "" : "/" + tN(t5(r.scaleKey) + e.rootPos + e.bassPos)) : e.type)),
                l = e.speed,
                d = e.transpose,
                c = e.keyChange,
                p = e.type
            }),
            i.join(" ")), h = function(e) {
                f = f.replace(/(^|\s)([0-9\.\/]+)?([a-z]+)/ig, function(t, o, n, s) {
                    if ("tr" == s || "kc" == s || "BPM" == s)
                        return t;
                    let i = tp.typeInfo(s);
                    if (i && i.playing)
                        return t;
                    let r = tI(n || "1") * a / e;
                    return o + (1 == r ? "" : tL(r)) + s
                }),
                J("edit-list-str").value = f,
                a = e
            };
            et({
                className: "dialog-edit-all",
                description: '<div style="margin-bottom: 5px;"><textarea spellcheck="false" placeholder="' + 'List of chords' + " \n \n" + 'example' + " 1: Em7 G/B 2Cmaj7 4Bdim \n" + 'example' + " 2: 1 5 6 4 \n" + 'example' + ' 3: V7/V V7 I" id="edit-list-str" type="text" class="value-control" style="width: 100%; height: 80px; resize: none;" /></textarea></div><div id="edit-list-error" class="error-message"></div><div class="control"><span class="label">' + 'Unit' + '</span><select id="edit-list-unit" class="value-control"><option value="1">' + 'Beat' + '</option><option value="' + o.beats + '">' + 'Bar' + "</option></select></div>",
                title: 'Edit all',
                width: 600,
                disableClickOutside: !0,
                onBeforeSelect: function() {
                    let e = f;
                    try {
                        r.sequence = oC(e, a, r.sequence)
                    } catch (t) {
                        return alert(t),
                        !1
                    }
                    return !0
                },
                onSelect: function() {
                    o8("Edited all " + f),
                    tO(),
                    oS(!0)
                }
            }),
            J("edit-list-str").value = f,
            J("edit-list-str").focus(),
            J("edit-list-str").onchange = function(e) {
                f = e.target.value,
                s = !0
            }
            ,
            J("edit-list-str").onkeyup = function(e) {
                let t = "";
                try {
                    oC(e.target.value, a, r.sequence)
                } catch (o) {
                    t = o
                }
                J("edit-list-error").innerText = t
            }
            ,
            J("edit-list-unit").value = a,
            J("edit-list-unit").onchange = function(e) {
                !s && h(Number(e.target.value))
            }
        }
        ;
        let eE = function() {
            let t = function() {
                let t = new tp({
                    rootPos: 0,
                    chord: "maj",
                    length: w[r.style.timeSignature].beats
                });
                r.manualChordPositions && (t = tB(t)),
                r.sequence.splice(p.currentStateData().cursorPos, 0, t),
                p.setCursorPos(void 0, 1),
                e.update(),
                p.showChordProps(),
                o8("Insert rest")
            }
              , o = function() {
                r.sequence.length = 0,
                e.stopSequence(),
                e.update(),
                o8("Deleted chords")
            }
              , n = function() {
                r.manualChordPositions = !r.manualChordPositions,
                r.sequence.forEach(function(e, t) {
                    r.manualChordPositions ? r.sequence[t] = tB(e) : (e.bassOctave = void 0,
                    e.chordOctave = void 0,
                    e.chordInv = void 0,
                    e.voicing = void 0)
                }),
                e.replaySequence(),
                tO(),
                o8("Toggled manual chords " + r.manualChordPositions),
                r.manualChordPositions && p.showChordProps()
            }
              , s = function() {
                r.loopSequence = !r.loopSequence,
                o8("Toggled loop progression " + r.loopSequence),
                p.replaySequence()
            }
              , a = [];
            a.push({
                name: 'Insert chord',
                onSelect: function() {
                    t()
                }
            }),
            a.push({
                name: 'Extend chords',
                onSelect: function() {
                    p.showChordProps(!0)
                }
            }),
            a.push({
                name: 'Delete all chords',
                onSelect: function() {
                    o()
                }
            }),
            a.push({
                name: r.loopSequence ? 'Disable looping' : 'Enable looping',
                onSelect: function() {
                    s()
                }
            }),
            a.push({
                name: r.manualChordPositions ? 'Enable automatic chord positions' : 'Enable manual chord positions',
                onSelect: function() {
                    n()
                }
            }),
            et({
                title: 'Progression menu',
                buttons: a,
                verticalButtons: !0
            })
        };
        W[H].seqShowMore = function() {
            eE()
        }
        ,
        W[H].seqClose = function(e) {
            eC()
        }
        ,
        J("item-scale").onchange = function(t) {
            let o = e.getItem(I)
              , n = t.target.value;
            o.scale = n,
            e.update(),
            o8("Updated chord scale " + (n ? te.get(n).name : 'Auto'))
        }
        ,
        e3 = "";
        let eL;
        tn.forEach(function(e) {
            let t = e.value.indexOf("diatonic-") > -1 ? "Diatonic chords" : "Other chords";
            t != eL && (e3 += (eL ? "</optgroup>" : "") + '<optgroup label="' + t + '">',
            eL = t),
            e3 += '<option value="' + e.value + '">' + e.name + "</option>"
        }),
        e3 += "</optgroup>",
        J("item-chord-icon").onclick = function() {
            let t = e.getItem(I), o = ti.parseType(t.chord).suffix, n;
            for (; ; ) {
                if (null == (o = prompt('Chord type', o)))
                    return;
                try {
                    n = ti.parseType(o).name;
                    break
                } catch (s) {
                    alert(s)
                }
            }
            Z(t, n),
            e.updateChordProp(),
            e.update(),
            e.updateChordPreview(),
            o8("Updated chord type " + o)
        }
        ,
        J("item-type").onchange = function(t) {
            let o = this.value;
            ep(function(e) {
                e.type = o,
                tp.typeInfo(e.type).playing && null == e.rootPos && (e.rootPos = 0),
                ("rest" == e.type || "break" == e.type) && e.rootPos
            }),
            e.update(),
            o8("Updated chord type " + o)
        }
        ,
        J("item-chord").onchange = function(t) {
            let o = e.getItem(I);
            ti.parseType(o.chord);
            let n = t.target.value;
            Z(o, n),
            p.clickItem(),
            setTimeout( () => p.releaseItem(), 500),
            e.update(),
            o8("Updated chord type " + ti.parseType(n).suffix),
            e.updateChordPreview()
        }
        ,
        J("item-root-pos").onchange = function(t) {
            let o = e.getItem(I);
            o.rootPos = "" != t.target.value ? Number(t.target.value) : void 0,
            p.clickItem(),
            setTimeout( () => p.releaseItem(), 500),
            e.update(),
            o8("Updated chord root note " + o.rootPos)
        }
        ,
        J("item-bass-pos").onchange = function(t) {
            let o = e.getItem(I);
            o.bassPos = Number(t.target.value),
            e.update(),
            o8("Updated chord bass note " + o.bassPos)
        }
        ,
        this.updateBufferTime(!0)
    }, o3, ow, oP, o5, oE, oL, oI, oN, o4, oO, oM;
    oO = !1,
    oM = function() {
        if (oN.clearRect(0, 0, oI.width, oI.height),
        !oO)
            return;
        oP.getByteFrequencyData(oE);
        let e = 0;
        oN.fillStyle = "rgba(255,255,255,.3)";
        for (let t = 0; t < o5; t++) {
            let o = .1 * oE[t];
            oN.fillRect(e, oI.height - o, oL, o),
            e += 2 * oL
        }
        requestAnimationFrame(oM)
    }
    ,
    o3 = function(e) {
        clearTimeout(o4),
        e ? oO || (oO = !0,
        l.current().masterGain.connect(oP),
        oM()) : o4 = setTimeout(function() {
            oO = !1,
            oP.disconnect()
        }, 5e3)
    }
    ,
    ow = function() {
        (oP = l.current().context.createAnalyser()).fftSize = 1024,
        oP.smoothingTimeConstant = .8,
        console.log(oP),
        o5 = oP.frequencyBinCount,
        oE = new Uint8Array(o5),
        oN = (oI = J("spectrum")).getContext("2d"),
        oL = 1
    }
    ;
    let o7 = function(e) {
        if (!navigator.userAgent.match(/Googlebot|YandexBot/)) {
            try {
                l = new C({
                    highpass: 100,
                    lowpass: 1e4
                })
            } catch (t) {
                throw setTimeout(function() {
                    alert("Failed to setup audio. Try to upgrade browser.")
                }, 1e3),
                J("app").style.display = "none",
                t
            }
            e()
        }
    }
      , oq = [{
        value: "keyboard",
        minNote: 24,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: null,
        strum: !1,
        parts: {
            chord: !0,
            bass: !0
        },
        handles: {
            chord: !0,
            bass: !0
        }
    }, {
        value: "keyboard_bass",
        minNote: 24,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: null,
        strum: !1,
        parts: {
            chord: !1,
            bass: !0
        },
        handles: {
            chord: !1,
            bass: !0
        }
    }, {
        value: "viola",
        minNote: void 0,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: null,
        strum: !1,
        parts: {
            chord: !0,
            bass: !0
        },
        handles: {
            chord: !0,
            bass: !0
        }
    }, {
        value: "trumpet",
        minNote: void 0,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: null,
        strum: !1,
        parts: {
            chord: !0,
            bass: !0
        },
        handles: {
            chord: !0,
            bass: !0
        }
    }, {
        value: "clarinet",
        minNote: void 0,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: null,
        strum: !1,
        parts: {
            chord: !0,
            bass: !0
        },
        handles: {
            chord: !0,
            bass: !0
        }
    }, {
        value: "oboe",
        minNote: void 0,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: null,
        strum: !1,
        parts: {
            chord: !0,
            bass: !0
        },
        handles: {
            chord: !0,
            bass: !0
        }
    }, {
        value: "guitar",
        minNote: 40,
        maxNote: 83,
        maxBassNote: 63,
        strings: [40, 45, 50, 55, 59],
        strum: !0,
        parts: {
            chord: !0,
            bass: !0
        },
        handles: {
            chord: !0,
            bass: !0
        }
    }, {
        value: "bass",
        minNote: 28,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: [28, 33, 38, 43],
        strum: !1,
        parts: {
            chord: !1,
            bass: !0
        },
        handles: {
            chord: !1,
            bass: !0
        }
    }, {
        value: "tuba",
        minNote: void 0,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: null,
        strum: !1,
        parts: {
            chord: !1,
            bass: !0
        },
        handles: {
            chord: !1,
            bass: !0
        }
    }, {
        value: "harmonica",
        minNote: void 0,
        maxNote: void 0,
        maxBassNote: void 0,
        strings: null,
        strum: !1,
        parts: {
            chord: !0,
            bass: !1
        },
        handles: {
            chord: !0,
            bass: !1
        }
    }, {
        value: "ukulele",
        minNote: 48,
        maxNote: 91,
        maxBassNote: void 0,
        strings: [48, 52, 55, 57],
        strum: !1,
        parts: {
            chord: !0,
            bass: !1
        },
        handles: {
            chord: !1,
            bass: !1
        }
    }];
    oq.forEach(function(e) {
        oq[e.value] = e
    }),
    oq.get = function(e) {
        let t = oq[e];
        if (!t)
            throw "Unknown instrument type " + e;
        return i(t)
    }
    ;
    let o6 = [{
        name: "Upright Piano",
        value: "piano",
        samples: ["c3", "g3", "c4", "g4", "c5", "g5"],
        positions: [-12, -5, 0, 7, 12, 19],
        ofs: 60,
        vol: 1.5,
        type: "keyboard",
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        }
    }, {
        name: "Grand Piano",
        value: "grand-piano",
        samples: ["d2", "d3", "a3", "d4", "a4", "d5", "a5"],
        volumes: [1, 1, 2, 1, 2, 2, 2],
        positions: [-23, -11, -5, 1, 7, 13, 19],
        ofs: 62,
        vol: 1.5,
        type: "keyboard",
        notice: {
            url: "https://archive.org/details/SalamanderGrandPianoV3",
            name: "Alexander Holm",
            license: "CC BY 3"
        }
    }, {
        name: "M1 Piano",
        value: "m1piano",
        samples: ["f1", "c2", "f2", "c3", "f3", "c4", "f4", "c5"],
        volumes: [1, 1, 1, 1, 1, 1, 1, 1],
        positions: [-18, -12, -6, 0, 6, 12, 18, 24],
        ofs: 48,
        vol: .3,
        type: "keyboard",
        notice: {
            url: "https://www.failedmuso.com/korg-m1-piano-samples/",
            name: "FailedMuso",
            license: "free"
        }
    }, {
        name: "Wurlitzer",
        value: "wurlitzer",
        samples: ["d3", "a3", "d4", "a4", "d5", "a5", "d6"],
        positions: [-12, -4, 0, 8, 12, 20, 24],
        ofs: 50,
        vol: .8,
        type: "keyboard",
        notice: {
            url: "https://freesound.org/people/OldBassMan/packs/5726/",
            name: "OldBassMan",
            license: "CC BY 3"
        }
    }, {
        name: "Rhodes",
        value: "rhodes",
        samples: ["c2", "g2", "e3", "d5"],
        positions: [-13, -7, 2, 24],
        volumes: [1, 1, 1, .7],
        vol: .4,
        ofs: 50,
        type: "keyboard",
        notice: {
            url: "https://freesound.org/people/tim.kahn/packs/3957/",
            name: "Tim Kahn",
            license: "CC BY 3"
        }
    }, {
        name: "Clavinet",
        value: "clav",
        samples: ["c3", "g3", "c4", "g4", "c5", "g5"],
        positions: [-12, -5, 0, 7, 12, 19],
        volumes: [1, 1, 1, .9, .8, .8],
        ofs: 60,
        vol: .5,
        type: "keyboard",
        notice: {
            url: "https://www.producerfeed.com/2012/02/yamaha-dx21-fuzz-clavinet-samples.html",
            name: "Hardball Records",
            license: "free"
        }
    }, {
        name: "Marimba",
        value: "marimba",
        samples: ["e3", "g3", "d4", "g4"],
        positions: [-8, -5, 2, 19],
        ofs: 48,
        vol: .3,
        type: "keyboard",
        notice: {
            url: "https://freesound.org/people/Samulis/packs/15684/",
            name: "Samulis",
            license: "CC BY 3"
        }
    }, {
        name: "Drawbar Organ",
        value: "organ",
        samples: ["c3", "g3", "e4", "c5", "g5", "e6"],
        positions: [-12, -4, 4, 12, 20, 28],
        ofs: 48,
        vol: .3,
        notice: {
            url: "https://freepats.zenvoid.org/Organ/electric-organ.html",
            name: "FreePats",
            license: "CC 0"
        },
        type: "keyboard",
        organ: !0,
        loop: 2
    }, {
        name: "Perc Organ",
        value: "percorgan",
        samples: ["g3", "c4", "e4", "c5", "g5", "e6"],
        positions: [-4, 0, 4, 12, 20, 28],
        ofs: 48,
        vol: .3,
        notice: {
            url: "https://freepats.zenvoid.org/Organ/electric-organ.html",
            name: "FreePats",
            license: "CC 0"
        },
        type: "keyboard",
        organ: !0,
        loop: 2
    }, {
        name: "Pipe Organ",
        value: "renorgan",
        samples: ["c1", "c2", "c3", "c4", "c5"],
        positions: [0, 12, 24, 36, 48],
        volumes: [1, 1, 1, 1, 1.5],
        ofs: 36,
        vol: 1,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        type: "keyboard",
        organ: !0,
        loop: 2,
        crossFade: !0
    }, {
        name: "Accordion",
        value: "accordion",
        samples: ["c3", "g3", "c4", "g4", "c5"],
        positions: [0, 7, 12, 19, 24],
        volumes: [.8, 1, .7, .8, .7],
        ofs: 60,
        vol: .3,
        type: "keyboard",
        loop: 2,
        crossFade: !0,
        notice: {
            url: "https://floydsteinberg.gumroad.com/",
            name: "FloydSteinberg",
            license: ""
        },
        organ: !0
    }, {
        name: "Viola",
        value: "violaens",
        spiccatoValue: "viola-spic",
        samples: ["g2", "b2", "d3", "f3", "c4", "g4"],
        positions: [-5, -1, 2, 5, 12, 19],
        volumes: [1, .8, 1, 1, .8, .8],
        ofs: 60,
        vol: 1,
        type: "viola",
        loop: 2,
        crossFade: !0,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        organ: !0
    }, {
        name: "Viola spic",
        value: "viola-spic",
        spiccato: !0,
        samples: ["c2", "g2", "d3", "a3", "b4"],
        positions: [-12, -5, 2, 9, 23],
        volumes: [1, 1, 1, 1, 1],
        ofs: 60,
        vol: 1.5,
        type: "viola",
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        }
    }, {
        name: "Trumpet",
        value: "trumpet",
        spiccatoValue: "trumpet-stac",
        samples: ["a2", "c3", "d3", "g3", "d4", "c5"],
        positions: [-3, 0, 3, 7, 14, 24],
        volumes: [1.2, 1.2, 1, .7, .6, .6],
        ofs: 60,
        vol: .8,
        type: "trumpet",
        loop: 2,
        crossFade: !0,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        organ: !0
    }, {
        name: "Trumpet stac",
        value: "trumpet-stac",
        spiccato: !0,
        samples: ["c3", "g3", "d4", "c5"],
        positions: [0, 7, 14, 24],
        volumes: [1, 1, .5, .3],
        ofs: 60,
        vol: 2,
        type: "trumpet",
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        }
    }, {
        name: "Trombone",
        value: "trombone",
        samples: ["g1", "c2", "g2", "c3", "g3"],
        positions: [-17, -12, -5, 0, 7],
        volumes: [1.3, 1, 1, 1, .4],
        ofs: 60,
        vol: 1.5,
        type: "keyboard",
        loop: 1.5,
        crossFade: !0,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        organ: !0
    }, {
        name: "Horn",
        value: "horn",
        samples: ["a1", "d2", "f2", "c3", "d4"],
        positions: [-2, 2, 5, 12, 26],
        volumes: [4, 1, 2, 1, .5],
        ofs: 48,
        vol: 3,
        type: "keyboard",
        loop: 2,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        organ: !0
    }, {
        name: "Oboe",
        value: "oboe",
        samples: ["d3", "a3", "d4", "a4"],
        positions: [2, 10, 14, 22],
        volumes: [1, 2, 2, 3],
        ofs: 60,
        vol: 5,
        type: "oboe",
        loop: 2,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        organ: !0
    }, {
        name: "Clarinet",
        value: "clarinet",
        samples: ["a2", "d3", "f3", "a3", "d4"],
        positions: [-2, 2, 5, 10, 14],
        volumes: [1, 1, 1, .8, .8],
        ofs: 60,
        vol: 3,
        type: "clarinet",
        loop: 2,
        crossFade: !0,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        organ: !0
    }, {
        name: "Recorder",
        value: "bassrecorder",
        samples: ["a2", "e3", "a3", "e4"],
        positions: [-3, 4, 9, 16],
        volumes: [3, 3, 1, 1],
        ofs: 48,
        vol: 1.5,
        type: "keyboard",
        loop: 1.5,
        crossFade: !0,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        organ: !0
    }, {
        name: "Saxophone",
        value: "sax",
        samples: ["db1", "f1", "a1", "d2", "f2", "ab2", "b2", "d3", "f3", "ab3"],
        positions: [-11, -7, -3, 2, 5, 8, 11, 14, 17, 20],
        volumes: [.4, 1, 1, 1, .7, .5, 1, 1, 1, 1],
        ofs: 48,
        vol: 2,
        type: "keyboard",
        loop: 1.5,
        crossFade: !0,
        notice: {
            url: "https://github.com/sfzinstruments/karoryfer.bear-sax",
            name: "Karoryfer Lecolds",
            license: "CC 4"
        },
        organ: !0
    }, {
        name: "Harmonica",
        value: "harmonica",
        samples: ["c2", "e2", "g2", "e3", "g3", "c4", "g4"],
        positions: [0, 4, 7, 16, 19, 24, 31],
        volumes: [1, 1, 1.2, 1, 1, 1, 1],
        ofs: 48,
        vol: 1,
        type: "harmonica",
        loop: 1.75,
        crossFade: !0,
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        },
        organ: !0
    }, {
        name: "Classical Guitar",
        shortName: "Cl Guitar",
        value: "aguitar",
        samples: ["e2", "a2", "d3", "g3", "b3", "e4", "d5", "a5", "fret"],
        positions: [-8, -3, 2, 7, 11, 16, 26, 33, 60],
        volumes: [.8, 1.2, 1, 1, 1, 1, 1, 1, 1],
        ofs: 48,
        vol: .5,
        notice: {
            url: "https://freepats.zenvoid.org/Guitar/acoustic-guitar.html",
            name: "FreePats",
            license: "CC 0"
        },
        type: "guitar",
        fretNoise: !0
    }, {
        name: "Electric Guitar",
        shortName: "El Guitar",
        value: "eguitar",
        samples: ["e2", "a2", "eb3", "a3", "eb4", "a4", "eb5", "a5", "fret"],
        positions: [-8, -3, 3, 9, 15, 21, 27, 33, 60],
        volumes: [1, 1, 1, 1, 1, 1.2, 1.2, 1.2, .5],
        ofs: 48,
        vol: 1.5,
        notice: {
            url: "https://github.com/sfzinstruments/karoryfer.emilyguitar",
            name: "Karoryfer Lecolds",
            license: "CC 0"
        },
        type: "guitar",
        fretNoise: !0
    }, {
        name: "Bass Guitar",
        value: "sh887-bass",
        samples: ["g1", "c2", "g2", "c3", "g3"],
        positions: [-17, -12, -5, 0, 7],
        ofs: 48,
        vol: .6,
        notice: {
            url: "https://freesound.org/people/Project16/packs/15407/",
            name: "Project16",
            license: "CC BY 3"
        },
        type: "bass"
    }, {
        name: "Double Bass",
        value: "standup-bass",
        samples: ["g1", "c2", "f2", "c3", "g3"],
        positions: [-17, -12, -7, 0, 7],
        ofs: 48,
        vol: .6,
        notice: {
            url: "https://freesound.org/people/pjcohen/packs/21521/",
            name: "Pjcohen",
            license: "CC 0"
        },
        type: "bass"
    }, {
        name: "Tuba",
        value: "tuba",
        samples: ["g0", "c1", "e1", "g1", "bb1", "c2", "g2"],
        positions: [-17, -12, -8, -5, -2, 0, 7],
        volumes: [1, 1, 1, 1, 1, 1, 1],
        ofs: 48,
        vol: 2,
        notice: {
            url: "https://github.com/sfzinstruments/karoryfer.war-tuba",
            name: "Karoryfer Lecolds",
            license: "CC 4"
        },
        type: "tuba",
        organ: !0,
        loop: 2,
        crossFade: !0
    }, {
        name: "FM Brass",
        value: "fm-brass",
        samples: ["g1a", "g2a", "g3a", "g4a"],
        positions: [-17, -5, 7, 19],
        ofs: 48,
        vol: 2,
        type: "keyboard",
        notice: {
            url: "https://freesound.org/people/Terry93D/packs/21486/",
            name: "Terry93D",
            license: "CC 0"
        }
    }, {
        name: "Juno Pad",
        value: "junopad",
        samples: ["c2", "g2", "c3", "g3", "c4", "g4", "c5"],
        volumes: [1, 1, 1, 1, 1, 1, 1],
        positions: [-12, -5, 0, 7, 12, 19, 24],
        ofs: 48,
        vol: 4,
        loop: 1.5,
        crossFade: !0,
        type: "keyboard",
        notice: {
            url: "https://www.principleasure.com/drop",
            name: "Principleasure",
            license: "free"
        },
        organ: !0
    }, {
        name: "Swell Pad",
        value: "swellpad",
        samples: ["c2", "g2", "c3", "g3", "c4", "g4"],
        volumes: [1, 1, 1, 1, 1, 1],
        positions: [-12, -5, 0, 7, 12, 19],
        ofs: 48,
        vol: 4,
        loop: 2,
        crossFade: !0,
        type: "keyboard",
        notice: {
            url: "https://www.principleasure.com/drop",
            name: "Principleasure",
            license: "free"
        },
        organ: !0
    }, {
        name: "Sweep Pad",
        value: "sweep",
        samples: ["e3", "c4", "g4", "e5", "c6"],
        positions: [-8, 0, 8, 16, 24],
        volumes: [1, 1, .7, 1, 1],
        ofs: 60,
        vol: .3,
        maxPitch: .7,
        notice: {
            url: "https://freepats.zenvoid.org/Synthesizer/synth-pad.html",
            name: "FreePats",
            license: "CC 0"
        },
        type: "keyboard",
        organ: !0
    }, {
        name: "Synth Pad 1",
        value: "synthpad1",
        samples: ["c3", "g3", "c4", "g4", "c5", "g5"],
        positions: [-12, -5, 0, 7, 12, 19],
        ofs: 48,
        vol: 3,
        notice: {
            url: "https://zynaddsubfx.sourceforge.io/",
            name: "ZynAddSubFX",
            license: "free"
        },
        type: "keyboard",
        organ: !0
    }, {
        name: "Synth Pad 2",
        value: "synthpad3",
        samples: ["c3", "g3", "c4", "g4", "c5", "g5"],
        positions: [-12, -5, 0, 7, 12, 19],
        ofs: 60,
        vol: 3,
        notice: {
            url: "https://zynaddsubfx.sourceforge.io/",
            name: "ZynAddSubFX",
            license: "free"
        },
        type: "keyboard",
        organ: !0
    }, {
        name: "Harp",
        value: "harp",
        samples: ["c3", "g3", "d4", "c5", "g5"],
        volumes: [.8, .8, 1, 1, .5],
        positions: [-12, -5, 2, 12, 19],
        ofs: 48,
        vol: .7,
        type: "keyboard",
        notice: {
            url: "https://vis.versilstudios.com/vsco-community.html",
            name: "VersilianStudios",
            license: "CC 0"
        }
    }, {
        name: "Midi out" + (navigator.requestMIDIAccess ? "" : " (Chrome only)"),
        shortName: "Midi out",
        value: "midi-out",
        samples: [],
        positions: [],
        type: "keyboard",
        notice: ""
    }, ];
    o6.forEach(function(e) {
        o6[e.value] = e
    }),
    o6.get = function(e) {
        let t = this[e];
        if (!t)
            throw "Unknown instrument " + e;
        return i(t)
    }
    ;
    let oD = A([{
        value: "combo1",
        data: {
            bassInstrument: "sh887-bass",
            instrument: "rhodes",
            melodyInstrument: "rhodes"
        },
        name: "Combo: Rhodes/Bass Guitar",
        notice: ""
    }, {
        value: "combo2",
        data: {
            bassInstrument: "sh887-bass",
            instrument: "percorgan",
            melodyInstrument: "percorgan"
        },
        name: "Combo: Perc Organ/Bass Guitar",
        notice: ""
    }, {
        value: "combo3",
        data: {
            bassInstrument: "standup-bass",
            instrument: "grand-piano",
            melodyInstrument: "grand-piano"
        },
        name: "Combo: Grand Piano/Double Bass",
        notice: ""
    }, {
        value: "combo4",
        data: {
            bassInstrument: "tuba",
            instrument: "trumpet",
            melodyInstrument: "trumpet"
        },
        name: "Combo: Trumpet/Tuba",
        notice: ""
    }, {
        value: "combo5",
        data: {
            bassInstrument: "synthpad1",
            instrument: "synthpad3",
            melodyInstrument: "synthpad3"
        },
        name: "Combo: Synth Pads",
        notice: ""
    }, ])
      , oj = new function() {
        this.n = void 0,
        this.velocity = 1,
        this.sustain = !1,
        this.duration = 1,
        this.octave = 0,
        this.halfSteps = 0,
        this.scaleSteps = 0,
        this.fifth = !1,
        this.third = !1,
        this.remaining = !1,
        this.condition = "",
        this.fit = !1,
        this.dir = !1,
        this.modify = "",
        this.next = !1;
        let e = {
            items: {
                _index: {
                    _deprecated: {
                        delay: "offset"
                    },
                    velocity: 1,
                    attack: 0,
                    sustain: !1,
                    duration: 1,
                    octave: 0,
                    halfSteps: 0,
                    scaleSteps: 0,
                    fifth: !1,
                    third: !1,
                    remaining: !1,
                    condition: "",
                    fit: !1,
                    dir: !1,
                    modify: "",
                    next: !1,
                    offset: 0
                }
            },
            early: "",
            envelopes: null
        }
          , t = {
            style: {
                chord: {
                    arpEvents: {
                        _key: e
                    }
                },
                bass: {
                    arpEvents: {
                        _key: e
                    }
                }
            },
            sequence: {
                _index: {
                    type: "default",
                    bassPos: 0,
                    keyChange: 0,
                    section: 0,
                    speed: 1,
                    transpose: 0
                }
            }
        };
        this.collapse = function(e) {
            let o = function(e, t) {
                if (!e)
                    return;
                let n = t._index;
                if (n && Array.isArray(e))
                    e.forEach(function(e, t) {
                        o(e, n)
                    });
                else if (t._key)
                    for (let s in e)
                        o(e[s], t._key);
                else
                    for (let a in t)
                        "object" == typeof t[a] && t[a] ? e[a] && o(e[a], t[a]) : e[a] == t[a] && delete e[a]
            }
              , n = JSON.parse(JSON.stringify(e));
            return o(n, t),
            n
        }
        ,
        this.expand = function(e) {
            let o = function(e, t) {
                if (!e)
                    return;
                let n = t._index;
                if (n && Array.isArray(e))
                    e.forEach(function(e, t) {
                        o(e, n)
                    });
                else if (t._key)
                    for (let s in e)
                        o(e[s], t._key);
                else {
                    if (t._deprecated)
                        for (let a in t._deprecated)
                            a in e && (e[t._deprecated[a]] = e[a],
                            delete e[a]);
                    for (let i in t)
                        "_deprecated" == i || ("object" == typeof t[i] && t[i] ? e[i] && o(e[i], t[i]) : i in e || (e[i] = t[i]))
                }
            };
            o(e, t)
        }
    }
      , oG = function(e, t) {
        let o = !1;
        oj.expand(e),
        e.application || (e.application = "OneMotion Chord-Player"),
        e.name && (e.name == 'New project' || e.name.match(/^Chords /)) && (e.name = ""),
        void 0 == e.style && (e.style = {
            bass: e.bass,
            chord: e.chord,
            preset: e.preset,
            shuffle: e.shuffle,
            sustain: e.sustain,
            tempo: e.tempo,
            timeSignature: e.timeSignature,
            noteDuration: 1
        },
        delete e.bass,
        delete e.chord,
        delete e.noteDuration,
        delete e.preset,
        delete e.shuffle,
        delete e.sustain,
        delete e.tempo,
        delete e.timeSignature),
        void 0 != e.scaleMode && (e.scale = te.get(e.scaleMode).value,
        delete e.scaleMode),
        e.scaleKey || (e.scaleKey = "C"),
        te[e.scale] || (e.scale = "ionian"),
        void 0 != e.loop && delete e.loop,
        void 0 != e.playChordMode && delete e.playChordMode,
        void 0 != e.hold && delete e.hold,
        void 0 == e.effectType && (e.effectType = "chamber"),
        void 0 == e.effectEcho && (e.effectEcho = {
            active: !!e.effectDelay,
            delay: e.effectDelay || 1,
            feedback: .5,
            amount: e.effectDelay ? 1 : .5
        }),
        void 0 == e.effectAmount && (e.effectAmount = 1),
        void 0 == e.loopSequence && (e.loopSequence = !0),
        void 0 == e.manualChordPositions && (e.manualChordPositions = e.sequence.length > 0 && void 0 != e.sequence[0].bassOctave),
        e.style.timeSignature && w[e.style.timeSignature] || (e.style.timeSignature = "4/4"),
        "boolean" == typeof e.style.sustain && (e.style.sustain = e.style.sustain ? "chord" : ""),
        e.style.preset && !e6[e.style.preset] && (e.style.preset = void 0),
        ej[e.style.chord.style] || (e.style.chord.style = e.style.chord.arp ? "arpeggio" : "once"),
        ej[e.style.bass.style] || (e.style.bass.style = e.style.bass.arp ? "arpeggio" : "once"),
        !e.style.bass.arp && ej[e.style.bass.style].list && (e.style.bass.arp = ej[e.style.bass.style].list),
        e.style.chord.arp && "string" == typeof e.style.chord.arp && (e.style.chord.arp = e.style.chord.arp.replace(/&lt;/g, "<")),
        e.style.bass.arp && "string" == typeof e.style.bass.arp && (e.style.bass.arp = e.style.bass.arp.replace(/&lt;/g, "<")),
        ["chord", "bass"].forEach(function(t) {
            let o = e.style[t];
            if (!o.arpEvents) {
                let n = od(o);
                o.arpEvents = n.events,
                o.arpLength = n.length
            }
            Array.isArray(o.arpEvents) && (o.arpEvents = o.arpEvents.reduce(function(e, t, o) {
                return e[o] = t,
                e
            }, {}))
        }),
        ej[e.style.bass.style].deprecated && (e.style.bass.style = "arpeggio"),
        o6[e.instrument] || (e.instrument = "piano"),
        e.bassInstrument && !o6[e.bassInstrument] && (e.bassInstrument = void 0),
        e.melodyInstrument && !o6[e.melodyInstrument] && (e.melodyInstrument = void 0);
        let n = ej[e.style.chord.style]
          , s = ej[e.style.bass.style];
        if (void 0 == e.style.chord.octave && (e.style.chord.octave = 4),
        void 0 == e.style.chord.octaveOffset && (e.style.chord.octaveOffset = 7),
        void 0 == e.style.chord.inversions && (e.style.chord.inversions = !0),
        void 0 == e.style.chord.numNotes && (e.style.chord.numNotes = 0),
        void 0 == e.style.chord.open && (e.style.chord.open = !1),
        void 0 == e.style.chord.keep && (e.style.chord.keep = !1),
        void 0 == e.style.chord.cropLength && (e.style.chord.cropLength = n.customStep && !n.arp ? 1 : 0),
        void 0 == e.style.chord.loop && (e.style.chord.loop = !1 !== n.loop),
        void 0 == e.style.bass.octave && (e.style.bass.octave = 2),
        void 0 == e.style.bass.octaveOffset && (e.style.bass.octaveOffset = 0),
        void 0 == e.style.bass.cropLength && (e.style.bass.cropLength = s.customStep && !s.arp ? 1 : 0),
        void 0 == e.style.bass.loop && (e.style.bass.loop = !1 !== s.loop),
        void 0 != e.style.noteDuration && (e.style.chord.noteDuration = e.style.noteDuration,
        e.style.bass.noteDuration = e.style.noteDuration,
        delete e.style.noteDuration),
        e.melody || (e.melody = {
            events: []
        }),
        e.sections) {
            let a = 0;
            e.sequence.forEach(function(t, o) {
                t.section == a ? t.section = 0 : a = t.section,
                t.section > 20 && (t.section = e.sections.find(function(e) {
                    return e[0] == t.section
                })[1])
            }),
            delete e.sections
        }
        e.sequence.forEach(function(t, n) {
            "mode"in t && (t.scale = te.get(t.mode).value,
            delete t.mode),
            !("index"in t) && "degree"in t && (t.index = t.degree || 0,
            delete t.degree),
            void 0 == t.rootPos && void 0 != t.index && (o = !0,
            t.rootPos = t.scale ? te.get(t.scale).steps[t.index] : 0,
            t.chord = tG(t.type, t.index, t.scale),
            delete t.index,
            delete t.type,
            delete t.scale),
            "scale"in t || (t.scale = void 0),
            t.scale && !te[t.scale] && (t.scale = void 0),
            "halfdim7" == t.chord && (t.chord = "min7b5"),
            ("break" == t.type || "rest" == t.type) && (t.rootPos = null),
            null == t.rootPos && "default" == t.type && (t.type = "rest"),
            tp.typeInfo(t.type) || (t.type = null != t.rootPos ? "default" : "rest");
            try {
                ti.parseType(t.chord)
            } catch (s) {
                let a = t.chord;
                t.chord = "maj",
                setTimeout(function() {
                    throw "Cannot create chord " + a + " (" + s + ")"
                }, 0)
            }
            if ("transpose"in t || (t.transpose = 0),
            "keyChange"in t || (t.keyChange = 0),
            t.keyChange != t.keyChange % 12 && (t.keyChange = t.keyChange % 12),
            "section"in t || (t.section = 0),
            "voicing"in t || (t.voicing = void 0),
            !("bassPos"in t)) {
                let i = ti.parseType(t.chord);
                t.bassPos = i.positions[(t.bassInv || 0) % i.positions.length],
                t.chord = tD(t.chord, t.bassPos)
            }
            void 0 == t.speed && (t.speed = 1),
            !e.manualChordPositions || "chordInv"in t || (e.sequence[n] = tB(t))
        }),
        void 0 == e.customChords && (e.customChords = []),
        void 0 == e.parallellScaleChords && (e.parallellScaleChords = e.parallellScale || !1),
        delete e.parallellScale,
        e.customChords.forEach(function(e) {
            try {
                ti.parseType(e.chord)
            } catch (t) {
                let o = e.chord;
                e.chord = "maj",
                setTimeout(function() {
                    throw "Cannot create chord " + o + " (" + t + ")"
                }, 0)
            }
        }),
        t && o && eb("Old format, please save a new version")
    }
      , oB = function() {
        r.style.bass.octave,
        r.style.bass.octaveOffset,
        t5(r.scaleKey)
    };
    k.get("chordPlayerConfig") ? I(u = JSON.parse(k.get("chordPlayerConfig")), eq) : u = eq;
    let oR = function(t, o={}) {
        let n = function() {
            o.callback && o.callback()
        };
        if (!t.match(/^[A-Za-z0-9]+$/)) {
            n();
            return
        }
        if (et({
            title: 'Loading project',
            buttons: []
        }),
        t.match(/^\d+$/)) {
            let s = Number(t);
            e({
                url: "load_composition.php?chord_composition_id=" + s,
                done: function(e) {
                    oH(JSON.parse(e.composition.data), {
                        noSounds: o.noSounds,
                        reset: o.reset
                    })
                },
                fail: function(e) {
                    eb(404 == e ? 'Project % not found, check if the URL is correct.'.replace("%", s) : 'Server error, try again in a moment.')
                },
                always: function() {
                    n(),
                    setTimeout(function() {
                        eo()
                    }, 1e3)
                }
            })
        } else {
            let a = t;
            e({
                url: "share_as_link.php?code=" + a,
                done: function(e) {
                    oH(JSON.parse(e.content), {
                        noSounds: o.noSounds,
                        reset: o.reset
                    })
                },
                fail: function(e) {
                    eb(404 == e ? 'Project % not found, check if the URL is correct.'.replace("%", a) : 'Server error, try again in a moment.')
                },
                always: function() {
                    n(),
                    setTimeout(function() {
                        eo()
                    }, 1e3)
                }
            })
        }
    };
    window.onhashchange = function() {
        let e = document.location.hash.replace("#", "");
        e && (n1("compose"),
        oR(e))
    }
    ;
    let oV = function() {
        k.get("chordPlayer") && (r = JSON.parse(k.get("chordPlayer"))),
        r && r.application && -1 != r.application.indexOf("Chord-Player") || (r = {
            instrument: "piano",
            scale: "ionian",
            scaleKey: "C",
            tempo: 100,
            sustain: e6["dance-1"].sustain || "",
            timeSignature: "4/4",
            chord: {
                style: e6["dance-1"].chord.style,
                step: e6["dance-1"].chord.step,
                velocity: .7,
                spread: 0,
                numNotes: void 0,
                double: !1,
                octave: 4,
                run: void 0,
                arp: e6["dance-1"].chord.arp
            },
            bass: {
                style: e6["dance-1"].bass.style,
                step: void 0,
                velocity: .7,
                double: !1,
                octave: 2,
                arp: void 0
            },
            preset: "dance-1",
            noteDuration: 1,
            chordLayout: {
                "diatonic-sus2": !0,
                "diatonic-triad": !0,
                "diatonic-sus4": !0,
                "diatonic-7": !0
            },
            shuffle: e6["dance-1"].shuffle || "1:1",
            sequence: [{
                scale: "ionian",
                type: "diatonic-triad",
                index: 0,
                length: 4
            }, {
                scale: "ionian",
                type: "diatonic-7",
                index: 2,
                length: 4
            }, {
                scale: "ionian",
                type: "diatonic-triad",
                index: 5,
                length: 4
            }, {
                scale: "ionian",
                type: "diatonic-triad",
                index: 3,
                length: 4
            }, ]
        }),
        oG(r),
        t7.reset()
    }, oH = function(e, t={}) {
        return p.stopSequence(),
        oG(r = e, t.warn),
        ou(),
        t.silent || (p.setCursorPos(0),
        eP.currentMode = te.get(r.scale).offset,
        eP.keyChange = 0,
        eP.transpose = 0,
        eP.editor.headers = {
            chord: {},
            bass: {}
        },
        t.reset && t7.reset(),
        tO(),
        n3({
            default: !0,
            halfZero: !0
        })),
        new Promise( (e, o) => {
            t.noSounds ? e() : (oX().then( () => {
                e()
            }
            , () => {
                o()
            }
            ),
            oQ()),
            tM()
        }
        )
    }, o8 = function(e) {
        k.set("chordPlayer", JSON.stringify(r)),
        t7.save(e),
        document.location.hash && window.history.replaceState(void 0, void 0, document.location.href.split("#")[0])
    }, oK = function() {
        k.set("chordPlayerConfig", JSON.stringify(u))
    }, oF = {}, oU = function(e, t) {
        let o = o6.get(e)
          , n = o.positions.length - 1;
        for (; n > 0 && (eV[60 + t - o.positions[n] - o.ofs] < .6 || eV[60 + t - o.positions[n - 1] - o.ofs] <= (("maxPitch"in o) ? o.maxPitch : 1)); )
            n--;
        return n
    }, oz = function(e) {
        return "melody" == e ? r.melodyInstrument || r.instrument : "bass" == e ? r.bassInstrument || r.instrument : "chord" == e ? r.instrument : ""
    }, o9 = new function() {
        let e = 0, t = {}, o = !1, s, c, d = {};
        this.resetEnvelopes = function(e) {
            e ? d[e] = {} : (d.chord = {},
            d.bass = {},
            d.melody = {})
        }
        ,
        this.resetEnvelopes();
        let f = function(e) {
            e.source && (e.source.disconnect(),
            e.source = null,
            e.gainNode.disconnect(),
            e.gainNode = null,
            tl--)
        }
          , h = navigator.userAgent.indexOf("Firefox") > -1
          , m = function(e, n, s, a, i) {
            let r = t[e]
              , c = l.current().context.currentTime;
            if ((!n || n < c) && (n = c),
            (!(n < r.time) || s) && (!r.releaseTime || !(n > r.releaseTime))) {
                if ((!o || l.isOffline()) && !a && !i && r.source) {
                    let u = o6.get(r.instr)
                      , p = n;
                    n >= r.time ? p += "releaseTime"in u ? u.releaseTime : .2 * (.5 * Math.random() + .5) : p += .01;
                    let f = d[r.instrType];
                    r.gainNode.gain.cancelScheduledValues(n),
                    r.gainNode.gain.setTargetAtTime(r.velocity * r.gainFactor * (void 0 != f.volume ? f.volume : 1), n, .005 * tw()),
                    h ? r.gainNode.gain.setTargetAtTime(0, n, .22 * (p - n)) : r.gainNode.gain.linearRampToValueAtTime(0, p);
                    try {
                        r.source.stop(p)
                    } catch (m) {}
                    r.finished = !0
                }
                if (!o) {
                    if (n < r.time && r.pressTimerId)
                        clearTimeout(r.pressTimerId),
                        clearTimeout(r.releaseTimerId);
                    else {
                        let $ = function(e) {
                            let t = "hold-" + (e.instrType || "chord");
                            tm.release(e.note, t),
                            clearTimeout(e.pressTimerId)
                        };
                        clearTimeout(r.releaseTimerId);
                        let _ = (Math.max(n, s ? 0 : r.time + .1) - c) * 1e3;
                        _ > 0 ? r.releaseTimerId = setTimeout($, _, r) : $(r)
                    }
                }
                a ? r.sustainTime = n : r.releaseTime = n,
                r.sustained = a
            }
        };
        this.setSilentMode = function(e) {
            o = e
        }
        ,
        this.isSilentMode = function() {
            return o
        }
        ,
        this.reset = function() {
            t = {}
        }
        ,
        this.setStartTime = function(t) {
            s = t,
            e = 0
        }
        ,
        this.setEndTime = function(e) {
            c = e
        }
        ,
        this.releaseAll = function(e) {
            let o = l.current()
              , n = e || o.context.currentTime;
            for (let s in t)
                t[s].instr && m(s, n, !0);
            this.sendMidi()
        }
        ,
        this.releaseSustainPedal = function(e, o, n) {
            let s = l.current()
              , a = e || s.context.currentTime;
            for (let i in t) {
                let c = t[i];
                c.instr && (!n || n.indexOf(c.instrType) > -1) && (c.sustainTime < e || "melody" != c.instrType) && m(i, a, o)
            }
            r.style.sustain,
            this.sendMidi()
        }
        ,
        this.pressSustainPedal = function(e) {
            r.style.sustain,
            this.sendMidi()
        }
        ,
        this.processEnvelopes = function(e, o, n) {
            n = Math.max(n, 0);
            let s = d[e]
              , a = o.envelopes;
            if (a)
                for (let i in a)
                    s[i] = a[i];
            for (let r in t) {
                let l = t[r];
                l.instrType == e && (!l.releaseTime || n < l.releaseTime) && (void 0 != s.volume && l.gainNode && (l.gainNode.gain.setTargetAtTime(l.velocity * l.gainFactor * s.volume, n, .005 * tw()),
                l.gainVolume = s.volume),
                void 0 != s.pitch && l.source && l.source.playbackRate.setTargetAtTime(l.rate * Math.pow(2, s.pitch / 12), n, .005 * tw()),
                l.highpass && (void 0 != s.highpass && l.highpass.frequency.setTargetAtTime(Math.max(s.highpass, 1), n, .005 * tw()),
                void 0 != s.highpassQ && l.highpass.Q.setTargetAtTime(s.highpassQ, n, .005 * tw())),
                l.lowpass && (void 0 != s.lowpass && l.lowpass.frequency.setTargetAtTime(Math.max(s.lowpass, 1), n, .005 * tw()),
                void 0 != s.lowpassQ && l.lowpass.Q.setTargetAtTime(s.lowpassQ, n, .005 * tw())))
            }
        }
        ,
        this.sendMidi = function(e) {
            if (o || "midi-out" != r.instrument && "midi-out" != r.bassInstrument && "midi-out" != r.melodyInstrument)
                return;
            let n = performance.now()
              , s = l.current().context.currentTime;
            for (let a in t) {
                let i = t[a]
                  , c = u.midiOutputChannel + ("chord" == i.instrType ? 0 : "bass" == i.instrType ? 1 : 2) - 1;
                if ("cmd"in i) {
                    let d = n + (i.time - s) * 1e3;
                    oY.send([176 + c, i.cmd, i.value], d),
                    i.finished = !0;
                    continue
                }
                if ("midi-out" == i.instr) {
                    if ((!e || i.time < e) && (!i.releaseTime || i.releaseTime > i.time) && !i.midiStartedTime) {
                        let p = Math.round(n + (i.time - s) * 1e3);
                        i.midiStartedTime = p,
                        i.note >= 0 && i.note <= 127 && oY.send([144 + c, i.note, Math.round(Math.min(127 * i.velocity, 127))], i.midiStartedTime)
                    }
                    if (i.releaseTime && i.midiStartedTime && (!e || i.releaseTime < e) && !i.finished) {
                        i.finished = !0;
                        let f = Math.round(i.midiStartedTime + 1e3 * Math.max(i.releaseTime - .01 - i.time, .01));
                        i.note >= 0 && i.note <= 127 && oY.send([128 + c, i.note, 0], f)
                    }
                }
            }
        }
        ,
        this.cleanUp = function(e) {
            for (let o in t) {
                let n = t[o];
                n.finished && n.releaseTime < e && delete t[o]
            }
        }
        ;
        let $, _ = 0;
        this.renderPianoRoll = function() {
            let e = w[r.style.timeSignature]
              , o = s
              , n = Math.max(c, s + 60 / r.style.tempo * e.beats)
              , a = J("piano-roll-canvas");
            a.height = Math.min((n - o) * r.style.tempo * .95, 2e4);
            let i = a.getContext("2d");
            i.clearRect(0, 0, a.width, a.height);
            let l = J("piano-roll-container")
              , d = (a.width + l.offsetWidth - l.clientWidth) / 36;
            a.width;
            let u = a.height / (n - o)
              , f = 0
              , h = 0;
            for (i.fillStyle = "rgba(0,0,0,.2)"; h <= a.height; )
                i.beginPath(),
                i.fillRect(0, Math.round(h), a.width, f > 0 && f % e.beats == 0 ? 3 : 1),
                h += 60 * u / r.style.tempo * e.beatScale,
                f++;
            f = 0;
            let m = -1;
            for (i.fillStyle = "rgba(0,0,0,.2)"; m <= a.width; )
                i.beginPath(),
                i.fillRect(Math.round(m), 0, f > 0 && f % 7 == 0 ? 2 : 1, a.height),
                m += d,
                f++;
            let _ = {
                chord: "#DD5555A0",
                bass: "#6666CCA0",
                melody: "#55CC55A0"
            };
            for (let y in i.strokeStyle = "rgba(0,0,0,.3)",
            i.font = "10px Arial",
            i.textAlign = "center",
            t) {
                let v = t[y]
                  , g = Math.floor((v.note - 24) / 12)
                  , b = eU.indexOf(v.note % 12)
                  , x = eF.indexOf(v.note % 12)
                  , k = Math.round(d * (7 * g + (b > -1 ? b : x + .5)) + 1)
                  , C = Math.round(d - 3)
                  , S = Math.max((v.releaseTime - v.time) * u - 1, 3)
                  , A = (v.time - o) * u + 1
                  , T = S < 9 && !1;
                i.beginPath(),
                r.style.sustain ? (i.globalAlpha = .5,
                i.fillStyle = _[v.instrType],
                i.fillRect(k, A, C, S),
                i.globalAlpha = 1,
                i.fillStyle = _[v.instrType],
                i.fillRect(k, A, C, 11)) : (i.fillStyle = _[v.instrType],
                i.fillRect(k, A, C, S)),
                i.rect(k, A, C, S),
                i.stroke(),
                T && (i.save(),
                i.clip()),
                i.fillStyle = "rgba(0,0,0,.8)",
                i.fillText(tN(v.note), Math.round(k + d / 2 - 1), A + 9),
                T && i.restore()
            }
            let P = 1;
            i.font = "16px Arial",
            i.textAlign = "left",
            i.fillStyle = "rgba(255,255,255,.5)";
            for (let E = p.loopCountFromMelody(); E > 0; E--)
                r.sequence.forEach(function(t) {
                    i.fillText(tj(t.chord, t.rootPos, t.bassPos), 10, P + 35),
                    P += t.length / t.speed * u * 60 / r.style.tempo * e.beatScale
                });
            $ = {
                data: t,
                minTime: o,
                maxTime: n,
                hold: {},
                totalTime: p.totalTime()
            }
        }
        ,
        this.pressPianoRoll = function(e) {
            if (p.started())
                return;
            o9.resetEnvelopes();
            let t = J("piano-roll-canvas");
            t.getBoundingClientRect();
            let o = e * ($.maxTime - $.minTime) + $.minTime
              , n = $.data
              , s = {};
            for (let a in n) {
                let i = n[a]
                  , r = i.instrType + "-" + i.note + "-" + i.time;
                o >= i.time && o < i.releaseTime && (s[r] = i)
            }
            for (let l in $.hold)
                if (!s[l]) {
                    let c = $.hold[l];
                    o9.release(c.instrType, c.note),
                    delete $.hold[l]
                }
            for (let d in s)
                if (!$.hold[d]) {
                    let u = s[d];
                    o9.press(u.instrType, u.note, u.velocity)
                }
            $.hold = s,
            J("piano-roll-cursor").style.display = "block",
            J("piano-roll-cursor").style.top = e * t.clientHeight + "px"
        }
        ,
        this.releasePianoRoll = function() {
            if (!p.started()) {
                for (let e in $.hold) {
                    let t = $.hold[e];
                    o9.release(t.instrType, t.note)
                }
                $.hold = {},
                J("piano-roll-cursor").style.display = "none"
            }
        }
        ,
        this.updatePianoRollCursor = function(e) {
            if (!e) {
                J("piano-roll-cursor").style.display = "none";
                return
            }
            let t = J("piano-roll-canvas")
              , o = (r.loopSequence ? e % $.totalTime : e) / ($.maxTime - $.minTime) * t.clientHeight;
            J("piano-roll-cursor").style.display = o < t.clientHeight ? "block" : "none",
            J("piano-roll-cursor").style.top = o + "px"
        }
        ,
        this.setPianoRollTime = function() {
            let e = J("piano-roll-canvas");
            _ = J("piano-roll-container").scrollTop / e.clientHeight * ($.maxTime - $.minTime)
        }
        ,
        this.pianoRollTime = function() {
            return _
        }
        ,
        this.exportWebPlayer = function() {
            let e = []
              , o = 0;
            return Object.keys(t).sort(function(e, o) {
                return t[e].time - t[o].time
            }).forEach(function(n) {
                let a = t[n];
                if ("cmd"in a)
                    return;
                let i = a.time - s;
                e.push("[" + Math.round((i - o) * 1e3) + "," + a.note + "," + Math.round(127 * a.velocity) + "," + Math.round((a.releaseTime - a.time) * 1e3) + "]"),
                o = i
            }),
            "[" + e.join(",") + "]," + (r.loopSequence && r.sequence.length > 0 ? Math.round(1e3 * p.totalTime()) : 0) + "," + (r.style.sustain ? "true" : "false")
        }
        ,
        this.exportMidi = function(e, o) {
            let a = {
                melody: 2,
                chord: 0,
                bass: 1
            }
              , i = [];
            for (let l in t) {
                let c = t[l];
                if (!o[c.instrType])
                    continue;
                let d = a[c.instrType];
                if ("cmd"in c) {
                    i.push({
                        type: "cc",
                        channel: d,
                        time: Math.max(c.time - s, 0),
                        cmd: c.cmd,
                        value: c.value
                    });
                    continue
                }
                i.push({
                    type: "on",
                    channel: d,
                    note: c.note,
                    time: c.time - s,
                    velocity: c.velocity
                }, {
                    type: "off",
                    channel: d,
                    note: c.note,
                    time: c.releaseTime - s
                })
            }
            i = i.sort(function(e, t) {
                return e.time - t.time
            });
            let u = new e3.File({
                ticks: 4800
            })
              , f = u.addTrack();
            f.setTimeSig(r.style.timeSignature),
            f.setTempo(r.style.tempo);
            let h = 1 / t3() * 4800 * w[r.style.timeSignature].beatScale
              , m = 0;
            i.forEach(function(e) {
                let t = e.time * h;
                "cc" == e.type && r.style.sustain ? f.addEvent(new e3.Event({
                    channel: e.channel,
                    time: t - m,
                    type: 176,
                    param1: e.cmd,
                    param2: e.value
                })) : "on" == e.type ? f.noteOn(e.channel, e.note, t - m, Math.round(127 * e.velocity)) : "off" == e.type && f.noteOff(e.channel, e.note, t - m),
                m = t
            }),
            f.setTrackEnd(p.totalTime() * h - m);
            let $ = u.toBytes()
              , _ = new ArrayBuffer($.length)
              , y = new Uint8Array(_);
            for (let v = 0; v < $.length; v++)
                y[v] = $.charCodeAt(v);
            t = {},
            o.dataTransfer ? o.dataTransfer.setData("DownloadURL", "audio/midi:chords.mid:" + URL.createObjectURL(new Blob([_],{
                type: "audio/midi"
            }))) : n(_, "audio/midi", e + ".mid")
        }
        ;
        let y = function() {
            this._info && f(this._info)
        }
          , v = function(o, n, s, a) {
            let i = l.current()
              , r = s || i.context.currentTime;
            t[e++] = {
                time: r,
                cmd: o,
                value: n,
                instrType: a
            }
        };
        this.sendCC = function(e, t, o) {
            v(e, t, o, "chord"),
            v(e, t, o, "bass"),
            r.melody.events.length > 0 && v(e, t, o, "melody")
        }
        ,
        this.press = function(n, s, c, u, p, f, h, m, $) {
            let _ = oz(n), v = l.current(), g;
            void 0 == c && (c = 1);
            let b = v.context.currentTime
              , x = Math.max(u || b, 0)
              , k = performance.now() + (x - b) * 1e3
              , C = ("chord" == n || "bass" == n) && "once" == r.style[n].style && r.style.chord.keep ? "keep" : m
              , S = this.release(n, s, u || void 0, void 0, void 0, C, c);
            if (0 != c) {
                if (!S) {
                    let A, T, w, P, E;
                    if ((!o || l.isOffline()) && "midi-out" != _) {
                        let L = o6.get(_);
                        h && "spiccatoValue"in L && (this.press(n, s, c, x, p, f, !1),
                        L = o6.get(L.spiccatoValue),
                        c *= .5 + .5 * Math.random());
                        let I = oq[L.type];
                        I.minNote && I.minNote,
                        I.maxNote && I.maxNote;
                        let N = oU(L.value, s);
                        if (void 0 == (A = eV[60 + s - L.positions[N] - L.ofs]))
                            return;
                        "rate"in L && (A *= L.rate);
                        let O = d[n];
                        (g = v.context.createBufferSource()).playbackRate.value = A * (void 0 != O.pitch ? Math.pow(2, O.pitch / 12) : 1);
                        let M = L.value + "-" + L.samples[N]
                          , q = oF[M] || a("Sound item not found " + M);
                        q.buffer && (g.buffer = q.buffer),
                        g.onended = y,
                        P = v.context.createGain(),
                        E = (L.vol || 1) * ("volumes"in L ? L.volumes[N] : 1) * .7;
                        {
                            let D = c * E * (void 0 != O.volume ? O.volume : 1);
                            P.gain.setValueAtTime(D, x),
                            P.gain.value = D
                        }
                        let j = "melody" != n ? oc[n].has : null
                          , G = g;
                        if (j && j.highpass && ((T = v.context.createBiquadFilter()).type = "highpass",
                        T.frequency.value = void 0 != O.highpass ? O.highpass : 0,
                        void 0 != O.highpassQ && (T.Q.value = O.highpassQ),
                        G.connect(T),
                        G = T),
                        j && j.lowpass && ((w = v.context.createBiquadFilter()).type = "lowpass",
                        w.frequency.value = void 0 != O.lowpass ? Math.max(O.lowpass, 1) : 22050,
                        void 0 != O.lowpassQ && (w.Q.value = O.lowpassQ),
                        G.connect(w),
                        G = w),
                        G.connect(P),
                        "loop"in L && L.loop && q.buffer) {
                            g.loop = !0;
                            let B = "duration"in L ? L.duration : q.buffer.duration;
                            g.loopStart = Math.max(B - Math.min(L.loop, B / 2) - 0, 0),
                            g.loopEnd = B - 0
                        }
                        g.start(x),
                        tl++,
                        P.connect(v.filter1)
                    }
                    S = i({
                        time: x,
                        midiTime: k,
                        midiStartedTime: void 0,
                        instr: _,
                        pressTimerId: void 0,
                        releaseTime: void 0,
                        sustainTime: void 0,
                        sustained: !1,
                        releaseTimerId: void 0,
                        finished: !1,
                        note: s,
                        velocity: c,
                        rate: A,
                        source: g,
                        highpass: T,
                        lowpass: w,
                        gainNode: P,
                        gainFactor: E,
                        instrType: n
                    });
                    let R = e++;
                    g && (g._info = S),
                    t[R] = S,
                    u || this.sendMidi()
                }
                if (!o) {
                    let V = function(e, t, o, n) {
                        tm.press(e, "hold-" + (t || "chord"), void 0, t, f),
                        n.pressTimerId = void 0
                    };
                    S.pressTimerId = setTimeout(V, 1e3 * Math.max(x - b, 0) + 10, s, n, p, S)
                }
            }
        }
        ,
        this.release = function(e, o, n, s, a, i, r) {
            let c = l.current()
              , d = n || c.context.currentTime;
            for (let u in t) {
                let p = t[u];
                if (p.instrType == e && p.note >= o && p.note <= o && d >= p.time && (!p.releaseTime || d < p.releaseTime + ("keep" == i ? .03 : 0))) {
                    if ("keep" == i)
                        return p.gainNode && p.releaseTime && p.gainNode.gain.cancelScheduledValues(p.releaseTime),
                        p.releaseTime = void 0,
                        m(u, d + 999),
                        void 0 != r && p.gainNode && p.gainNode.gain.setTargetAtTime(r * p.gainFactor, d, .005 * tw()),
                        p;
                    m(u, d, s, a)
                }
            }
            return n || this.sendMidi(),
            null
        }
    }
    , oY = new function() {
        let e = [], t = [], o = {}, n, s = "<div>" + 'Read about' + ' <a target="_blank" href="https://help.ableton.com/hc/en-us/articles/209774225-Setting-up-a-virtual-MIDI-bus">' + 'virtual MIDI ports' + "</a></div>";
        return this.setupMidiInputs = function(t, a) {
            if (0 == Object.keys(u.midiInputs).length && !t && !a)
                return;
            0 == Object.keys(u.midiInputs).length && t && this.setupMidiInputs(!1, !0);
            let i = function(e) {
                let t = e.data[0]
                  , s = 15 & t
                  , a = e.data[1]
                  , i = J("midi-" + e.target.name, !0);
                if (i && (i.innerHTML = 144 == t ? tN(a) + Math.floor(a / 12) + (u.midiInputChannel && s != u.midiInputChannel - 1 ? " ch" + (s + 1) : "") : ""),
                !u.midiInputs[e.target.name] || t >= 240 || u.midiInputChannel && s != u.midiInputChannel - 1)
                    return;
                let l = te.get(r.scale);
                if (t >= 176 && t <= 179) {
                    if (64 == a) {
                        let c = e.data[2] >= 64;
                        eP.melodySustainPressed = c,
                        c || o9.releaseSustainPedal()
                    }
                    oY.send(e.data)
                }
                if (144 == t || 128 == t) {
                    let d = 128 == t ? 0 : e.data[2] / 127;
                    if ("absolute" == u.midiInputMode) {
                        tv(a, d, !0);
                        return
                    }
                    let f = function(e, t) {
                        let o = te.get(r.scale)
                          , n = eJ[u.keyboardType];
                        if ("scale" == u.keyboardType || n) {
                            let s = eU.indexOf(e % 12);
                            if (-1 == s)
                                return;
                            let a = 0;
                            if (n) {
                                if (-1 == (a = n.steps.indexOf(eU[o.offset])))
                                    return
                            } else
                                a = (eU.length - o.offset) % eU.length;
                            let i = Math.floor(e / 12) * eU.length + s + a + (t ? (n ? n.steps.length : eU.length) * t : 0);
                            return 12 * Math.floor(i / eU.length) + eU[i % eU.length]
                        }
                        return e + (t ? 12 * t : 0)
                    }
                      , h = function(e, t) {
                        let o = 0, n = function(e) {
                            let n;
                            return Object.keys(r.chordLayout).forEach(function(e) {
                                o == t && (n = e),
                                o++
                            }),
                            r.customChords.forEach(function(e) {
                                o == t && (n = e.chord),
                                o++
                            }),
                            n
                        }, s = u.chordControlEnabled ? to[l.scaleGroup][eP.currentMode] : r.scale, a = n(!1), i;
                        if (a) {
                            let c = r.parallellScaleChords ? "ionian" : s;
                            tG(a, e, c) && (i = new tp({
                                chord: tG(a, e, c),
                                rootPos: om(e, c)
                            }))
                        } else if (a = n(!0)) {
                            let d = "ionian" == s ? "aeolian" : s
                              , p = tG(a, e, d);
                            p && (i = new tp({
                                chord: p,
                                rootPos: om(e, d)
                            }))
                        }
                        return i
                    };
                    if ("pads" == u.midiInputMode) {
                        let m = (Object.keys(r.chordLayout).length + r.customChords.length) * (r.parallellScaleChords ? 2 : 1)
                          , $ = u.midiPadsSecondNote - u.midiPadsFirstNote
                          , _ = a - u.midiPadsFirstNote
                          , y = L(_, Math.abs($))
                          , v = (_ - y) / $;
                        if (v >= m) {
                            let g = f(12 * Math.floor(y / eU.length) + eU[y % eU.length], v - m);
                            void 0 != g && tv(g, d)
                        } else {
                            let b = h(y, m - 1 - v);
                            b && (d > 0 ? (o.down || (o.down = !0,
                            o.count = 0),
                            o.count++,
                            nl(b, d, u.chordsHoldChord)) : (o.count--,
                            0 != o.count || (o.down = !1,
                            u.chordsHoldChord || p.stopChord())))
                        }
                        return
                    }
                    if (a < 60) {
                        let x;
                        if ("all" == u.keyboardType ? x = l.steps.indexOf((a + 12 - t5(r.scaleKey)) % 12) : (x = eU.indexOf(a % 12)) > -1 && (x = (eU.length - l.offset + x) % eU.length),
                        d > 0 ? (o.down || (o.down = !0,
                        o.notes = {},
                        o.velocity = d,
                        o.count = 0,
                        o.triggered = !1,
                        o.chordItem = null),
                        o.notes[a] = x > -1 ? x : void 0,
                        o.count++) : (delete o.notes[a],
                        o.count--),
                        0 == o.count) {
                            o.down = !1,
                            clearTimeout(n),
                            u.chordsHoldChord ? !o.triggered && o.chordItem && p.startChord(o.chordItem, o.velocity, u.chordsHoldChord) : p.stopChord();
                            return
                        }
                        let k = 0
                          , C = 9999;
                        for (let S in o.notes)
                            S < C && (C = S),
                            k++;
                        let A = o.notes[C];
                        if (void 0 == A)
                            return;
                        let T = k - 1
                          , w = Object.keys(r.chordLayout).indexOf("diatonic-triad")
                          , P = h(A, 0 == T ? w : T - (T <= w ? 1 : 0));
                        if (!P)
                            return;
                        o.chordItem = P,
                        p.started() || p.setCurrentChordItem(P),
                        clearTimeout(n),
                        n = setTimeout(function(e) {
                            p.startChord(P, e.velocity, u.chordsHoldChord),
                            e.triggered = !0
                        }, 50, o)
                    } else
                        void 0 != f(a) && tv(a - 60, d)
                }
            }
              , l = function(o) {
                let n = JSON.parse(JSON.stringify(u))
                  , a = Array.from(o.inputs.values())
                  , r = function() {
                    e.forEach(function(e) {
                        e.onmidimessage = null
                    }),
                    e.length = 0,
                    a.forEach(function(t) {
                        t.onmidimessage = i,
                        e.push(t)
                    })
                };
                if (t) {
                    let l = [["[112,96]", "Launchpad mini"], ]
                      , c = JSON.stringify([u.midiPadsFirstNote, u.midiPadsSecondNote])
                      , d = l.find(function(e) {
                        return c == e[0]
                    }) ? c : ""
                      , p = function() {
                        J("midi-pads-container").style.display = "pads" == u.midiInputMode ? "block" : "none",
                        J("midi-settings").style.display = Object.keys(u.midiInputs).length > 0 ? "block" : "none",
                        J("pads-preset").value = d,
                        J("pads-first-note").value = u.midiPadsFirstNote,
                        J("pads-second-note").value = u.midiPadsSecondNote
                    }
                      , f = [];
                    a.forEach(function(e) {
                        f.push('<div id="midi-' + e.name + '" style="float: right; color: rgba(255,255,255,.3);"></div><label><input type="checkbox" ' + (u.midiInputs[e.name] ? "checked " : "") + 'data-event="midiInputCheckbox" data-name="' + e.name + '" /><span>' + e.name + "</span></label>")
                    }),
                    W[U].midiInputCheckbox = function(e, t) {
                        let o = t.dataset.name;
                        t.checked ? u.midiInputs[o] = !0 : delete u.midiInputs[o],
                        p()
                    }
                    ;
                    let h = '<div id="midi-settings">' + 'Channel' + '<br/><select data-event="midiInputChannel">';
                    for (let m = 0; m <= 16; m++)
                        h += '<option value="' + m + '"' + (u.midiInputChannel == m ? " selected" : "") + ">" + (m || 'All') + "</option>";
                    h += "</select><br/><br/>",
                    W[U].midiInputChannel = function(e, t) {
                        u.midiInputChannel = Number(t.value)
                    }
                    ;
                    let $ = [["absolute", 'Keyboard: Chord recognition / recording'], ["dynamic", 'Keyboard: Simplified chords and melody / recording'], ["pads", 'Pad Controller'], ];
                    h += 'Mode' + '<br/><select data-event="midiInputMode" style="width: 100%;">',
                    $.forEach(function(e) {
                        h += '<option value="' + e[0] + '"' + (u.midiInputMode == e[0] ? " selected" : "") + ">" + e[1] + "</option>"
                    }),
                    h += "</select><br/><br/>",
                    h += '<div id="midi-pads-container" class="midi-pads-container">' + 'Presets' + '<br/><select id="pads-preset" data-event="midiPadsPreset" style="width: 100%;"><option value="">-</option>',
                    l.forEach(function(e) {
                        h += '<option value="' + e[0] + '">' + e[1] + "</option>"
                    }),
                    h += "</select><br/><br/>" + 'Note mapping' + '<div class="pads-frame"><div><select id="pads-second-note" data-event="midiPadsSecondNote">';
                    for (let _ = 0; _ <= 132; _++)
                        h += '<option value="' + _ + '">' + tN(_, "ionian", "C") + Math.floor(_ / 12) + "</option>";
                    h += '</select><input type="text" disabled /></div><div><select id="pads-first-note" data-event="midiPadsFirstNote">';
                    for (let y = 0; y <= 132; y++)
                        h += '<option value="' + y + '">' + tN(y, "ionian", "C") + Math.floor(y / 12) + "</option>";
                    h += '</select><input type="text" disabled /></div></div></div>',
                    h += "</div>",
                    W[U].midiPadsPreset = function(e, t) {
                        if (!t.value)
                            return;
                        d = t.value;
                        let o = JSON.parse(t.value);
                        u.midiPadsFirstNote = o[0],
                        u.midiPadsSecondNote = o[1],
                        p()
                    }
                    ,
                    W[U].midiPadsFirstNote = function(e, t) {
                        u.midiPadsFirstNote = Number(t.value),
                        d = "",
                        p()
                    }
                    ,
                    W[U].midiPadsSecondNote = function(e, t) {
                        u.midiPadsSecondNote = Number(t.value),
                        d = "",
                        p()
                    }
                    ,
                    W[U].midiInputMode = function(e, t) {
                        u.midiInputMode = t.value,
                        p()
                    }
                    ,
                    f.length > 0 ? (et({
                        title: 'Select MIDI inputs',
                        description: f.join("<br/>") + "<br/><br/>" + h + s,
                        onSelect: function() {
                            oK(),
                            r()
                        },
                        onCancel: function() {
                            u = n
                        }
                    }),
                    p()) : et({
                        title: 'No MIDI devices found',
                        description: s
                    })
                } else
                    r()
            }
              , c = function() {
                et({
                    title: 'Your browser does not support MIDI',
                    buttons: [{
                        name: 'OK'
                    }]
                })
            };
            navigator.requestMIDIAccess || c(),
            navigator.requestMIDIAccess().then(l, c)
        }
        ,
        this.setupMidiOutputs = function(e) {
            if ("midi-out" != r.instrument && "midi-out" != r.bassInstrument && "midi-out" != r.melodyInstrument)
                return;
            let o = function(o) {
                let n = Object.assign({}, u.midiOutputs)
                  , a = u.midiOutputChannel
                  , i = Array.from(o.outputs.values());
                1 == i.length && (n[i[0].name] = !0);
                let r = [];
                i.forEach(function(e) {
                    r.push('<label><input type="checkbox" ' + (n[e.name] ? "checked " : "") + 'data-event="midiOutputCheckbox" data-name="' + e.name + '" /><span>' + e.name + "</span></label>")
                }),
                W[U].midiOutputCheckbox = function(e) {
                    let t = e.target.dataset.name;
                    e.target.checked ? n[t] = !0 : delete n[t]
                }
                ;
                let l = function() {
                    t.length = 0,
                    i.forEach(function(e) {
                        u.midiOutputs[e.name] && t.push(e)
                    })
                };
                if (e || 0 == Object.keys(u.midiOutputs)) {
                    let c = 'Channels (chord/bass/melody)' + '<br/><select data-event="midiOutputChannel">';
                    for (let d = 1; d <= 14; d++)
                        c += '<option value="' + d + '"' + (u.midiOutputChannel == d ? " selected" : "") + ">" + d + "-" + (d + 2) + "</option>";
                    c += "</select>",
                    W[U].midiOutputChannel = function(e) {
                        a = Number(e.target.value)
                    }
                    ,
                    et({
                        title: r.length > 0 ? "Select MIDI outputs" : "No MIDI outputs found",
                        description: r.length > 0 ? r.join("<br/>") + "<br/><br/>" + c + "<br/><br/>" + s : s,
                        onSelect: function() {
                            u.midiOutputs = n,
                            u.midiOutputChannel = a,
                            oK(),
                            l()
                        }
                    })
                } else
                    l()
            }
              , n = function() {
                et({
                    title: "Could not access MIDI output",
                    buttons: [{
                        name: 'OK'
                    }]
                })
            };
            navigator.requestMIDIAccess ? navigator.requestMIDIAccess().then(o, n) : n()
        }
        ,
        this.send = function(e, o) {
            ("midi-out" == r.instrument || "midi-out" == r.bassInstrument || "midi-out" == r.melodyInstrument) && t.forEach(function(t) {
                t.send(e, o)
            })
        }
        ,
        this
    }
    , oQ = function(e, t) {
        tM(),
        oZ(e, t)
    }, oW, oZ = function(e, o) {
        let n = l.current()
          , s = r.effectType
          , a = oF[s] || (oF[s] = {})
          , i = function() {
            let e = a.buffer;
            if (e) {
                if (r.effectEcho.active) {
                    let t = a.buffer.numberOfChannels
                      , o = [];
                    for (let s = 0; s < t; s++)
                        o.push(a.buffer.getChannelData(s));
                    let i = Math.max(176400, a.buffer.length)
                      , l = n.context.sampleRate || 44100;
                    e = n.context.createBuffer(t, i, l);
                    let c = [];
                    for (let d = 0; d < t; d++)
                        c.push(e.getChannelData(d));
                    let u = [1];
                    for (let p = 0; p <= 99; p++)
                        u.push(Math.pow(r.effectEcho.feedback, p + 1) * r.effectEcho.amount);
                    let f = Math.round(l * t3() * r.effectEcho.delay)
                      , h = r.effectEcho.lowpass || 1
                      , m = [];
                    for (let $ = 0; $ < t; $++)
                        for (let _ = e.length; _ >= 0; _--) {
                            let y = 0
                              , v = 0;
                            for (; ; ) {
                                let g = _ - v * f;
                                if (g < 0)
                                    break;
                                let b = (o[v % 2 == 0 ? $ : 1 ^ $][g] || 0) * u[v];
                                if (0 == v || 1 == h)
                                    y += b;
                                else {
                                    let x = m[v] || 0
                                      , k = x + (k - x) * h;
                                    y += k,
                                    m[v] = k
                                }
                                v++
                            }
                            c[$][_] = y
                        }
                }
                n.setConvolverBuffer(e)
            }
        }
          , c = function() {
            let t = JSON.stringify([s, r.effectEcho.active ? [r.effectEcho, r.style.tempo] : null]);
            (t != oW || o) && (oW = t,
            i()),
            e && e()
        };
        if (a.buffer) {
            c();
            return
        }
        t({
            sound: "ir",
            items: s,
            context: n.context,
            onItem: function(e) {
                a.buffer = e.buffer
            },
            onFinished: function() {
                c()
            }
        })
    }, oX = function(e={}) {
        let t = [];
        return t.push(oJ("chord")),
        r.bassInstrument && t.push(oJ("bass")),
        r.melodyInstrument && t.push(oJ("melody")),
        oY.setupMidiOutputs(e.showMidiDialog),
        new Promise( (e, o) => {
            Promise.all(t).then( () => {
                e()
            }
            , () => {
                o()
            }
            )
        }
        )
    }, oJ = function(e, o, n) {
        let s = oz(e) || e
          , a = o6.get(s)
          , i = oq[a.type]
          , r = l.current()
          , c = Math.max(i.minNote || 0, i.parts.chord ? 48 : 36)
          , d = function() {
            o && (o9.resetEnvelopes(),
            o9.press(e, c, .7, r.context.currentTime),
            o9.release(e, c, r.context.currentTime + .1)),
            n && n()
        };
        if ("midi-out" == s) {
            d();
            return
        }
        let u = oU(s, c)
          , p = []
          , f = 0
          , h = function(e) {
            e.samples.forEach(function(t, n) {
                if (o && n != u)
                    return;
                let s = e.value + "-" + t;
                (oF[s] || (oF[s] = {})).buffer && f++,
                p.push(s)
            })
        };
        return h(a),
        !o && "spiccatoValue"in a && h(o6.get(a.spiccatoValue)),
        new Promise( (e, o) => {
            p.length > 0 && f != p.length ? (e_('Loading' + "...0%"),
            t({
                items: p,
                context: l.current().context,
                onProgress: function(e) {
                    e_('Loading' + "..." + Math.round(100 * e.progress) + "%")
                },
                onItem: function(e) {
                    let t = oF[e.name];
                    "crossFade"in a && a.crossFade && r.crossFade(e.buffer, a.loop, "duration"in a ? a.duration : void 0),
                    t.buffer = e.buffer
                },
                onFinished: function() {
                    ey(),
                    d(),
                    e()
                }
            })) : (d(),
            e())
        }
        )
    }, ne = new function() {
        let e = !1, t, o, n, s, a, i;
        return this.setChordItem = function(e) {
            o = e
        }
        ,
        this.info = function() {
            return o
        }
        ,
        this.startDragging = function(s) {
            if (!o)
                return;
            let a = te.get(r.scale)
              , i = u.chordControlEnabled ? to[a.scaleGroup][eP.currentMode] : r.scale;
            t = document.createElement("div"),
            n = o.chord ? tj(o.chord, o.rootPos - ("number" == u.chordNotation ? 0 : o.transpose), o.bassPos, tN(t5(r.scaleKey) + o.transpose), u.chordNotation, i) : "",
            t.innerHTML = tq(n),
            t.className = "drag-chord",
            document.body.appendChild(t),
            e = !0,
            this.setPosition(s)
        }
        ,
        this.isDragging = function() {
            return e
        }
        ,
        this.setPosition = function(e) {
            t.style.left = e.pageX + "px",
            t.style.top = e.pageY + "px"
        }
        ,
        this.hoverSeqItem = function(e, t, o) {
            if (ne) {
                s && s.classList.remove("drag-chord-over", "drag-chord-left", "drag-chord-right", "drag-chord-before", "drag-chord-after");
                let n = o.getBoundingClientRect()
                  , l = t.pageX - n.x
                  , c = r.sequence[e]
                  , d = c ? n.width / c.length * (c.length <= 2 ? .25 : .5) : 0
                  , u = c && c.length == 2 * Math.floor(c.length / 2)
                  , p = c ? l < d ? "before" : l > n.width - d ? "after" : u && l < n.width / 4 ? "left" : u && l > 3 * n.width / 4 ? "right" : "over" : "before";
                o.classList.add("drag-chord-" + p),
                i = e,
                a = p,
                s = o
            }
        }
        ,
        this.noSeqItem = function() {
            s && (s.classList.remove("drag-chord-over", "drag-chord-before", "drag-chord-after", "drag-chord-left", "drag-chord-right"),
            s = void 0)
        }
        ,
        this.release = function() {
            if (t.parentNode.removeChild(t),
            e = !1,
            !s)
                return;
            let l = r.sequence[i]
              , c = i
              , d = w[r.style.timeSignature].beats
              , u = 1
              , f = 0;
            "over" == a && (d = l.length,
            u = l.speed,
            f = l.section),
            "left" == a && (f = l.section,
            l.section = 0),
            ("left" == a || "right" == a) && (r.sequence[c].length /= 2,
            u = l.speed,
            d = l.length);
            let h = Object.assign(o, {
                length: d,
                speed: u,
                section: f
            });
            r.manualChordPositions && (h = tB(h)),
            "before" == a || "left" == a ? r.sequence.splice(c, 0, h) : "after" == a || "right" == a ? (r.sequence.splice(c + 1, 0, h),
            c++) : r.sequence[c] = h,
            o8(("over" == a ? "Replaced" : "Added") + " chord " + n),
            p.update(),
            p.animateSequenceItem(c, 1, !0)
        }
        ,
        this
    }
    , nt, no = {}, nn = {}, ns = [], na = {
        ShiftLeft: !0,
        ShiftRight: !0,
        AltLeft: !0,
        AltRight: !0,
        IntlBackslash: !0,
        Comma: !0,
        Period: !0
    }, ni = function(e) {
        let t = e.keyCode
          , o = e.code;
        if (e.getModifierState && e.getModifierState("CapsLock"),
        190 == t && "compose" == nC && (t = 188),
        !no[o]) {
            if (e.metaKey || (no[o] = t),
            !J("dialog", !0)) {
                if (27 != t || J("dialog", !0) || (p.stopSequence(),
                p.hideChordProps(),
                n3({
                    default: !0,
                    halfZero: !0
                })),
                !e.metaKey && !e.ctrlKey && ("compose" == nC || "keyboard" == nC && e.shiftKey)) {
                    let n = e7[t];
                    if (n && !p.isSequencePlaying()) {
                        let s = J(n)
                          , a = new tp(JSON.parse(s.dataset.chordItem));
                        ns.length > 0 && ns[ns.length - 1],
                        nl(a, void 0, u.chordsHoldChord),
                        ns.push({
                            target: s,
                            code: o
                        })
                    }
                }
                if ("keyboard" == nC) {
                    let i = e5[tr(t)];
                    void 0 == i || e.shiftKey || tv(i, eP.velocity),
                    (e.ctrlKey || e.metaKey) && 13 == t && p.setMelodyRecording()
                }
                if ("explore" != nC && 32 == t && (p.toggleSequence("roll" == nC ? o9.pianoRollTime() : p.cursorTime()),
                e.preventDefault()),
                37 == t && p.changeCursor(-1, e.shiftKey),
                39 == t && p.changeCursor(1, e.shiftKey),
                "compose" == nC) {
                    if (na[o])
                        return nw(),
                        e.preventDefault(),
                        !1;
                    (189 == t || 173 == t) && p.changeBeats(-1),
                    (187 == t || 171 == t) && p.changeBeats(1),
                    (8 == t || 46 == t) && p.deleteItem(),
                    (e.ctrlKey || e.metaKey) && (90 == t && t7.undo(),
                    89 == t && t7.redo(),
                    13 == t && p.setChordRecording())
                }
            }
        }
    }, nr = function(e) {
        let t = e.keyCode
          , o = e.code;
        if (e.getModifierState && e.getModifierState("CapsLock"),
        190 == t && "compose" == nC && (t = 188),
        delete no[o],
        !J("dialog", !0)) {
            if (13 == t && p.releaseItem(),
            "keyboard" == nC) {
                let n = e5[tr(t)];
                void 0 != n && (eU.indexOf((n + 12e3) % 12),
                tv(n, 0))
            }
            if ("compose" == nC && (na[o] && nw(),
            e7[t] && (!u.chordsHoldChord || "editor" == nS)))
                for (let s = ns.length - 1; s >= 0; s--) {
                    let a = ns[s];
                    if (a.code == o) {
                        let i = s == ns.length - 1;
                        ns.splice(s, 1),
                        i && (p.stopChord(),
                        a.target.classList.remove("hold"));
                        break
                    }
                }
        }
    }, nl = function(e, t, o, n) {
        p.startChord(e, t, o, n) && p.recordChord(e)
    }, nc = function(e, t, o, n) {
        let s = e.target;
        if (s.dataset) {
            if (nn[t] = Object.assign({}, s.dataset),
            "keyPad" == s.dataset.event) {
                let a = Number(s.dataset.key);
                isNaN(a) || (tv(a, eP.velocity),
                e.stopPropagation(),
                e.preventDefault())
            }
            if (s.dataset.chordPad && s.dataset.chordItem && !p.isSequencePlaying()) {
                let i = new tp(JSON.parse(s.dataset.chordItem));
                i.chord && (nl(i, void 0, u.chordsHoldChord, s.dataset.extra),
                ne.setChordItem(i),
                nt = void 0),
                e.stopPropagation(),
                e.preventDefault()
            }
        }
    }, nd = function(e) {
        if (e.touches) {
            let t = e.changedTouches;
            for (let o = t.length - 1; o >= 0; o--)
                t[o],
                nc(e, t[o].identifier)
        } else
            nc(e, "mouse");
        return !1
    }, nu = new function() {
        let e, t, o;
        this.set = function(t) {
            e = t,
            o = !1
        }
        ,
        this.delay = function() {
            !o && (clearTimeout(t),
            t = setTimeout(e, 30))
        }
        ,
        this.done = function() {
            o = !0
        }
        ,
        this.abort = function() {
            clearTimeout(t),
            o = !0
        }
    }
    , np = function(e, t, o, n, s) {
        if (!t.dataset)
            return;
        let a = "keyPad" == t.dataset.event && t.dataset.key ? Number(t.dataset.key) : void 0
          , i = nn[o] && nn[o].key ? Number(nn[o].key) : void 0;
        if (void 0 != i && i != a && (tv(i, 0),
        delete nn[o]),
        void 0 != a && a != i && (tv(a, eP.velocity),
        nn[o] = Object.assign({}, t.dataset),
        e.stopPropagation(),
        e.preventDefault()),
        p.isSequencePlaying())
            return;
        if (ne.isDragging()) {
            ne.setPosition(e),
            t.closest(".sequence-items") || ne.noSeqItem();
            return
        }
        let l = nn[o]
          , c = l && l.chordItem
          , d = t.dataset.chordItem;
        if (!d) {
            !c || t.dataset.chordPad || t.closest(".chords") || ((!nt || performance.now() - nt < 1e3) && ne.startDragging(e),
            p.stopChord(),
            p.setChordRecording(!1),
            on(null),
            nu.abort());
            return
        }
        if (d && d != c) {
            (!nt || performance.now() - nt < 1e3) && (nt = performance.now());
            let u = t.dataset.chordItem && new tp(JSON.parse(t.dataset.chordItem));
            r.style.chord.loop && r.style.bass.loop ? p.startChord(u) : nu.set(function() {
                nu.done(),
                p.startChord(u, void 0, !1, t.dataset.extra)
            }),
            nn[o] = Object.assign({}, t.dataset),
            e.stopPropagation(),
            e.preventDefault()
        }
        nu.delay()
    }, nf = function(e) {
        if (e.changedTouches)
            for (let t = e.changedTouches.length - 1; t >= 0; t--) {
                let o = e.changedTouches[t]
                  , n = document.elementFromPoint(o.clientX, o.clientY);
                n && np(e, n, o.identifier)
            }
        else
            e.buttons > 0 && np(e, e.target, "mouse");
        return !1
    }, nh = function(e, t, o) {
        if (t.dataset) {
            if ("keyPad" == t.dataset.event) {
                let n = Number(t.dataset.key);
                isNaN(n) || (tv(n, 0),
                e.stopPropagation(),
                e.preventDefault())
            }
            if (t.dataset.chordPad && !p.isSequencePlaying() && !ne.isDragging()) {
                let s = t.dataset.chord;
                if (t.dataset.rootPos,
                t.dataset.bassPos,
                s && (e.touches && e.touches.length > 0 || e.button > 0))
                    return;
                u.chordsHoldChord || (nu.abort(),
                p.stopChord()),
                e.stopPropagation(),
                e.preventDefault()
            }
            delete nn[o],
            ne.isDragging() && ne.release()
        }
    }, nm = function(e) {
        if (e.changedTouches) {
            for (let t = e.changedTouches.length - 1; t >= 0; t--) {
                let o = e.changedTouches[t]
                  , n = document.elementFromPoint(o.clientX, o.clientY);
                n && nh(e, n, o.identifier)
            }
            if (0 == e.touches.length)
                for (let s in nn) {
                    let a = Number(nn[s].key);
                    isNaN(a) || o9.release("melody", a, void 0, void 0, r.style.sustain),
                    delete nn[s]
                }
        } else
            nh(e, e.target, "mouse");
        return !1
    }, n$ = function(e) {
        return e.deltaY || e.wheelDelta,
        !1
    }, n_ = 1, ny = function() {
        let e = J("app");
        if (e.style.transform = "inherit",
        v) {
            let t = J("banner-left", !0);
            if (!t)
                return;
            let o = e.clientWidth, n = e.clientHeight, s, a = n_ = Math.min((document.body.clientWidth - t.clientWidth - 40) / o, (document.body.clientHeight - 100) / n, 1.5), i = -((Math.max(e.clientHeight - e.parentNode.clientHeight, 0) + 30) * .5);
            e.style.transform = "translate(0," + i + "px)scale(" + a + "," + a + ")",
            e.dataset.scale = a
        }
    }, nv = function(e, t) {
        if (e.style.timeSignature != t.style.timeSignature) {
            let o = w[t.style.timeSignature]
              , n = w[e.style.timeSignature]
              , s = 0
              , a = [];
            t.sequence.forEach(function(e) {
                let t = e.length * n.beats / o.beats
                  , i = o.beats > n.beats ? .5 : 1
                  , r = Math.round((s + t) / i) * i - Math.round(s / i) * i;
                r > 0 && a.push(Object.assign({}, e, {
                    length: r
                })),
                s += t
            }),
            e.sequence = a
        } else
            e.sequence = t.sequence
    }, ng = "main", nb = "", n0 = function(e) {
        r.style.preset && (ng = "main");
        let t = ng;
        e && (ng = e);
        let o = !1
          , n = J("piano").innerHTML
          , s = o6.get(r.instrument)
          , a = "loop"in s && s.loop
          , i = !a || !!r.style.sustain
          , l = JSON.parse(JSON.stringify(r))
          , c = function() {
            let e, s, d = "main" == ng ? "preset" : "bass" == ng ? "bass" : "chord", u;
            "main" == ng && (u = e6.filter(function(e) {
                return !nb || e.tags && e.tags.indexOf(nb) > -1
            })),
            ("chord" == ng || "bass" == ng) && (u = [],
            ej.forEach(function(e) {
                if (e.deprecated)
                    return;
                let t = e.value.indexOf("bass-") > -1 ? "bass" : "chord";
                if (!e.shared && t != ng)
                    return;
                let o = e.timeSignature || "4/4";
                if (r.style.timeSignature != o && (!e.customStep || e.timeSignature) && !e.global)
                    return;
                let n = e.name;
                u.push({
                    value: e.value,
                    name: n,
                    styleGroup: e.styleGroup
                })
            }));
            let f = function() {
                return "main" == ng ? r.style.preset : "chord" == ng || "bass" == ng ? r.style[d].style : void 0
            }
              , h = function(e) {
                if (p.isSequencePlaying()) {
                    p.startSequence({
                        force: e
                    });
                    return
                }
                p.startExampleChord(e),
                J("dialog").classList.add("playing"),
                o = !0
            }
              , m = function() {
                !p.isSequencePlaying() && (p.stopChord(),
                o = !1)
            }
              , $ = function() {
                if ("main" == ng) {
                    let t = r.style.preset ? e6[r.style.preset] : null;
                    J("allow-sustain").parentNode.style.display = a && (!t || t.sustain) ? "block" : "none",
                    J("allow-sustain").checked = i,
                    J("dialog-style-bass").parentNode.style.display = "none",
                    J("dialog-style-bass").value = r.style.bass.style
                }
                if (("main" == ng || "settings" == ng) && s.update(),
                "settings" == ng && (X(J("dialog-style-time-signature"), "value", r.style.timeSignature),
                X(J("dialog-style-shuffle"), "value", r.style.shuffle),
                X(J("dialog-style-sustain"), "value", r.style.sustain)),
                "chord" == ng || "bass" == ng) {
                    let o = r.style[ng]
                      , n = ej[o.style];
                    X(J("dialog-style-" + ng + "-note-duration").parentNode.style, "display", "xs" == n.list ? "none" : "block");
                    let l = (n.customStep ? r.style[ng].step : n.step) || n.step || t4(n.beatDiv);
                    if (X(J("dialog-style-" + ng + "-length").parentNode.style, "display", n.arp ? "block" : "none"),
                    n.arp) {
                        let c = []
                          , d = 1 / (l[0] / l[1]);
                        for (let u = 1; u < d; u++)
                            c.push([u, u]);
                        if (d == Math.round(d))
                            for (let f = 1; f <= 8; f++)
                                c.push([f * d, f * d]);
                        let h = r.style[ng].arpLength;
                        c.find(function(e) {
                            return e[0] == h
                        }) || c.push([h, h]);
                        let m = c.sort(function(e, t) {
                            return e[1] - t[1]
                        }).map(function(e) {
                            return '<option value="' + e[0] + '">' + e[1] + "</option>"
                        }).join("");
                        X(J("dialog-style-" + ng + "-length"), "innerHTML", m),
                        X(J("dialog-style-" + ng + "-length"), "value", h)
                    }
                    X(J("dialog-style-" + ng + "-step"), "value", l.join("/")),
                    X(J("dialog-style-" + ng + "-step").parentNode.style, "display", n.customStep ? "block" : "none"),
                    X(J("dialog-style-controls").style, "display", "none" == r.style[ng].style ? "none" : "flow-root"),
                    X(J("dialog-style-" + ng + "-mirror"), "checked", r.style[ng].mirror),
                    X(J("dialog-style-" + ng + "-mirror").parentNode.parentNode.style, "display", n.canMirror ? "block" : "none"),
                    X(J("dialog-style-" + ng + "-loop"), "checked", r.style[ng].loop),
                    X(J("dialog-style-" + ng + "-loop").parentNode.parentNode.style, "display", n.arp ? "block" : "none");
                    let $ = 1 / (o.arpLength * l[0] / l[1]);
                    X(J("dialog-style-" + ng + "-crop-length"), "value", r.style[ng].cropLength),
                    X(J("dialog-style-" + ng + "-crop-length").parentNode.parentNode.style, "display", $ != Math.floor($) && n.customStep ? "block" : "none");
                    let _ = J("dialog-style-" + ng + "-crop-length").options;
                    for (let y = _.length - 1; y >= 0; y--) {
                        let v = _[y]
                          , g = Number(v.value);
                        g > 0 && (v.innerHTML = g * l[1])
                    }
                    n.shuffle && (n.shuffle,
                    r.style.shuffle)
                }
                "chord" == ng && (ej[r.style.chord.style],
                X(J("dialog-style-chord-spread").parentNode.style, "display", "once" == r.style.chord.style ? "block" : "none"),
                X(J("dialog-style-chord-keep").parentNode.style, "display", "once" == r.style.chord.style ? "block" : "none"),
                X(J("dialog-style-num-notes"), "value", r.style.chord.numNotes),
                X(J("dialog-style-chord-open").parentNode.style, "display", (oc.chord.numNotes,
                "block")),
                e.update(),
                X(J("dialog-style-chord-keep"), "checked", r.style.chord.keep)),
                J("dialog").classList.toggle("playing", p.started())
            }
              , _ = "";
            eO.forEach(function(e) {
                _ += '<option value="' + e[0] + "/" + e[1] + '">' + e[0] + (1 == e[1] ? "" : "/" + e[1]) + "</option>"
            });
            let y = "";
            [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(function(e) {
                y += '<option value="' + e + '">' + (e || "∞") + "</option>"
            });
            let v = P()
              , g = J("dialog-style-piano", !0);
            g && (n = g.innerHTML);
            let b = function(e, t) {
                if (e.styleGroup)
                    return t && e.styleGroup != t.styleGroup || !t ? '<div class="item-group-header">' + eD[e.styleGroup].name + "</div>" : void 0
            }
              , x = '<option value="0">∞</option><option value="0.5">1/2</option><option value="1">1</option><option value="2">2</option>'
              , k = o6.get(r.instrument)
              , C = oq.get(k.type)
              , S = o6.get(r.bassInstrument || r.instrument)
              , A = oq.get(S.type)
              , T = "";
            ej.forEach(function(e) {
                e.bassOption && (T += '<option value="' + e.value + '">' + e.name + "</option>")
            });
            let w = [["", 'All'], ["latin", 'Latin'], ["retro", 'Oldschool'], ["mod", 'Modulation'], ]
              , E = {};
            e6.forEach(function(e) {
                e.tags ? e.tags.forEach(function(e) {
                    E[e] = (E[e] || 0) + 1
                }) : E[""] = (E[""] || 0) + 1
            });
            let L = "";
            if (w.forEach(function(e) {
                L += '<option value="' + e[0] + '">' + e[1] + " (" + E[e[0]] + ")</option>"
            }),
            et({
                title: 'Select style',
                className: "dialog-style dialog-style-theme-" + ng,
                value: f(),
                options: u,
                optionsOneColumn: 1,
                rightBottomContent: '<button id="dialog-style-speaker"><svg viewBox="0 0 32 32" style="width: 20px; height: 20px; cursor: pointer; height: 25px; color: rgba(0,0,0,.3);"><path fill="currentColor" d="M30 19.348v2.652h-2.652l-3.348-3.348-3.348 3.348h-2.652v-2.652l3.348-3.348-3.348-3.348v-2.652h2.652l3.348 3.348 3.348-3.348h2.652v2.652l-3.348 3.348 3.348 3.348z"></path><path fill="currentColor" d="M13 30c-0.26 0-0.516-0.102-0.707-0.293l-7.707-7.707h-3.586c-0.552 0-1-0.448-1-1v-10c0-0.552 0.448-1 1-1h3.586l7.707-7.707c0.286-0.286 0.716-0.372 1.090-0.217s0.617 0.519 0.617 0.924v26c0 0.404-0.244 0.769-0.617 0.924-0.124 0.051-0.254 0.076-0.383 0.076z"></path></svg></button>',
                description: '<div class="dialog-style-themes buttons buttons-small buttons-horizontal" id="dialog-style-themes"><button data-id="main">' + 'Styles' + '</button><button data-id="settings">' + 'General' + '</button><button data-id="chord"' + (C.parts.chord ? "" : " disabled") + ">" + 'Chord' + '</button><button data-id="bass"' + (A.parts.bass ? "" : " disabled") + ">" + 'Bass' + '</button></div><div id="dialog-style-piano" class="piano' + ("chord" == ng || "bass" == ng ? " active" : "") + " piano-type-" + ng + '">' + n + "</div>" + ("main" == ng ? '<select id="dialog-style-select" class="dialog-style-select items" style="display: none;">' + L + "</select>" : ""),
                belowContent: '<div id="dialog-style-controls" class="dialog-style-controls">' + ("chord" == ng ? '<div class="control"><span class="label">' + 'Vel' + '</span><button id="dialog-style-chord-vel" class="value-control"></button></div><div class="control"><span class="label">' + 'Dur' + '</span><button id="dialog-style-chord-note-duration" class="value-control"></button></div><div class="control"><span class="label">' + 'Tones' + '</span><select id="dialog-style-num-notes" class="value-control"><option value="0">' + 'Auto' + '</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option></select></div><div class="control"><span class="label">' + 'Step' + '</span><select id="dialog-style-chord-step" class="value-control">' + _ + '</select></div><div class="control"><span class="label">\xd7</span><select id="dialog-style-chord-length" class="value-control"></select></div><div class="control"><span class="label">' + 'Reset' + '</span><label><select id="dialog-style-chord-crop-length" class="value-control">' + x + '</select></div><div class="control"><span class="label">' + 'Roll' + '</span><span id="dialog-style-chord-spread" class="value-control"></span></div><div class="control cb"><label><input id="dialog-style-chord-inversions" type="checkbox" /><span class="label">' + 'Inversions' + '</span></label></div><div class="control cb"><label><input id="dialog-style-chord-open" type="checkbox" /><span class="label">' + 'Spread' + '</span></label></div><div class="control cb"><label><input id="dialog-style-chord-octave" type="checkbox" /><span class="label">' + 'Double' + '</span></label></div><div class="control cb"><label><input id="dialog-style-chord-mirror" type="checkbox" /><span class="label">' + 'Mirror' + '</span></label></div><div class="control cb"><label><input id="dialog-style-chord-loop" type="checkbox" /><span class="label">' + 'Loop' + '</span></label></div><div class="control cb"><label><input id="dialog-style-chord-keep" type="checkbox" /><span class="label">' + 'Seamless change' + "</span></label></div>" : "bass" == ng ? '<div class="control"><span class="label">' + 'Vel' + '</span><button id="dialog-style-bass-vel" class="value-control"></button></div><div class="control"><span class="label">' + 'Dur' + '</span><button id="dialog-style-bass-note-duration" class="value-control"></button></div><div class="control"><span class="label">' + 'Step' + '</span><select id="dialog-style-bass-step" class="value-control">' + _ + '</select></div><div class="control"><span class="label">\xd7</span><select id="dialog-style-bass-length" class="value-control"></select></div><div class="control"><span class="label">' + 'Reset' + '</span><label><select id="dialog-style-bass-crop-length" class="value-control">' + x + '</select></div><div class="control cb"><label><input id="dialog-style-bass-octave" type="checkbox" /><span class="label">' + 'Double' + '</span></label></div><div class="control cb"><label><input id="dialog-style-bass-mirror" type="checkbox" /><span class="label">' + 'Mirror' + '</span></label></div><div class="control cb"><label><input id="dialog-style-bass-loop" type="checkbox" /><span class="label">' + 'Loop' + "</span></label></div>" : "main" == ng ? '<div class="control"><div class="label">' + 'Tempo' + '</div><button id="dialog-style-tempo" class="value-control"></button> <span id="dialog-style-tempo-lock" class="tempo-lock" title="' + 'Keep tempo when changing style' + '"><svg viewBox="0 0 20 32" style="width: 12px; height: 14px;"><path d="M18.5 14h-0.5v-6c0-3.308-2.692-6-6-6h-4c-3.308 0-6 2.692-6 6v6h-0.5c-0.825 0-1.5 0.675-1.5 1.5v15c0 0.825 0.675 1.5 1.5 1.5h17c0.825 0 1.5-0.675 1.5-1.5v-15c0-0.825-0.675-1.5-1.5-1.5zM6 8c0-1.103 0.897-2 2-2h4c1.103 0 2 0.897 2 2v6h-8v-6z"></path></svg></span></div><div class="control"><span class="label">' + 'Bass' + '</span><select id="dialog-style-bass" class="value-control" style="width: 120px;">' + T + '</select></div><div class="control" style="float: right;"><label><input type="checkbox" id="allow-sustain" /><span>' + 'Allow sustain' + "</span></label></div>" : "settings" == ng ? '<div class="control"><span class="label">' + 'Tempo' + '</span><button id="dialog-style-tempo" class="value-control"></button></div><div class="control"><span class="label">' + 'Time signature' + '</span><select id="dialog-style-time-signature" class="value-control" style="width: 55px;">' + v + '</select></div><div class="control"><span class="label">' + 'Swing ratio' + '</span><select id="dialog-style-shuffle" class="dialog-style-shuffle value-control"><option value="1:1">1:1 ' + 'None' + '</option><option value="3:2">3:2 ' + 'Light' + '</option><option value="2:1">2:1 ' + 'Shuffle' + '</option><option value="3:1">3:1 ' + 'Hard' + '</option></select></div><div class="control"><span class="label">' + 'Sustain notes' + '</span><select id="dialog-style-sustain" class="value-control"><option value="">' + 'Off' + '</option><option value="chord">' + 'Chord' + '</option><option value="2-beats">2 ' + 'beats' + '</option><!--option value="always">Always</option--></select></div><!--div class="control"><span class="label">' + 'Note duration' + '</span><span id="dialog-style-note-duration" class="value-control"></span></div-->' : "") + "</div>",
                formatOptionGroup: b,
                formatNotice: function(e) {
                    return e ? '<a href="" target="_blank">' + (e.title || "Source") + "</a>" : ""
                },
                onChange: function(e) {
                    let t = e != f() || !p.started();
                    if ("main" == ng) {
                        if (e != f()) {
                            let o = e6[e];
                            r.style.preset = e;
                            let n = ej[o.chord.style]
                              , s = ej[o.bass.style];
                            r.style.chord.style = o.chord.style,
                            r.style.chord.velocity = o.chord.velocity || .7,
                            r.style.chord.noteDuration = o.chord.noteDuration || 1,
                            r.style.chord.arp = o.chord.arp || n.list;
                            let a = od(r.style.chord, !0);
                            r.style.chord.arpEvents = a.events,
                            r.style.chord.arpLength = a.length,
                            r.style.chord.numNotes = o.chord.numNotes || 0,
                            r.style.chord.spread = o.chord.spread || 0,
                            r.style.chord.keep = o.chord.keep || 0,
                            r.style.chord.step = o.chord.step || n.step,
                            r.style.chord.octave = o.chord.octave || 4,
                            r.style.chord.octaveOffset = (void 0 != o.chord.octaveOffset ? o.chord.octaveOffset : 7) - t5(r.scaleKey),
                            r.style.chord.mirror = o.chord.mirror || !1,
                            r.style.chord.double = o.chord.double || !1,
                            r.style.chord.open = o.chord.open || !1,
                            r.style.chord.inversions = void 0 == o.chord.inversions || o.chord.inversions,
                            r.style.chord.cropLength = void 0 != o.chord.cropLength ? o.chord.cropLength : void 0 != n.cropLength ? n.cropLength : n.customStep && !n.arp ? 1 : 0,
                            r.style.chord.loop = !1 !== n.loop && !1 !== o.chord.loop,
                            r.style.bass.velocity = o.bass.velocity || .7,
                            r.style.bass.noteDuration = o.bass.noteDuration || 1,
                            r.style.bass.style = o.bass.style,
                            r.style.bass.arp = o.bass.arp || s.list;
                            let c = od(r.style.bass, !0);
                            r.style.bass.arpEvents = c.events,
                            r.style.bass.arpLength = c.length,
                            r.style.bass.step = o.bass.step || s.step,
                            r.style.bass.octave = o.bass.octave || 2,
                            r.style.bass.octaveOffset = -t5(r.scaleKey),
                            r.style.bass.mirror = o.bass.mirror || !1,
                            r.style.bass.double = o.bass.double || !1,
                            r.style.bass.cropLength = void 0 != o.bass.cropLength ? o.bass.cropLength : void 0 != s.cropLength ? s.cropLength : s.customStep && !s.arp ? 1 : 0,
                            r.style.bass.loop = !1 !== s.loop && !1 !== o.bass.loop,
                            r.style.sustain = i && o.sustain || "",
                            r.style.shuffle = o.shuffle ? o.shuffle : "1:1",
                            r.style.timeSignature = o.timeSignature || "4/4",
                            eP.tempoLock || (r.style.tempo = o.tempo ? o.tempo : 100),
                            nv(r, l)
                        }
                    } else if (e != f()) {
                        let u = ej[e]
                          , _ = ej[f()];
                        if (r.style.preset = void 0,
                        r.style[d].style = e,
                        "arpeggio" != e) {
                            r.style[d].arp = u.list;
                            let y = od(r.style[d], !0);
                            r.style[d].arpEvents = y.events,
                            r.style[d].arpLength = y.length,
                            r.style[d].cropLength = void 0 != u.cropLength ? u.cropLength : u.customStep && !u.arp ? 1 : 0,
                            u.canMirror || (r.style[d].mirror = !1),
                            u.customStep && _.customStep && !u.resetStep || (r.style[d].step = u.step),
                            r.style[d].loop = !1 !== u.loop,
                            u.shared || (r.style.chord.numNotes = 0)
                        }
                        "chord" == ng && "once" != r.style.chord.style && (r.style.chord.spread = 0,
                        r.style.chord.keep = !1)
                    }
                    ou(),
                    t || p.isSequencePlaying() ? h(!0) : m(),
                    $()
                },
                onSelect: function(e) {},
                onCancel: function() {
                    r = l,
                    ng = t,
                    p.replaySequence()
                },
                onBeforeClose: function() {
                    tm.updateId("piano"),
                    J("piano").innerHTML = J("dialog-style-piano").innerHTML
                },
                onClose: function() {
                    p.stopChord(),
                    ou(),
                    o8("Updated style"),
                    tO()
                }
            }),
            tm.updateId("dialog-style-piano"),
            J("dialog-style-speaker").onclick = function() {
                p.stopChord(),
                p.stopSequence(),
                J("dialog").classList.remove("playing")
            }
            ,
            J("dialog-style-themes").querySelector('[data-id="' + ng + '"]').classList.add("selected"),
            J("dialog-style-themes").onclick = function(e) {
                let t = e.target.dataset.id;
                t && (ng = t,
                c(),
                p.stopChord())
            }
            ,
            "main" == ng && (J("dialog-style-select").value = nb,
            J("dialog-style-select").onchange = function() {
                nb = this.value,
                p.stopChord(),
                p.stopSequence(),
                c()
            }
            ,
            J("dialog-style-tempo-lock").classList.toggle("selected", eP.tempoLock),
            J("dialog-style-tempo-lock").onclick = function() {
                eP.tempoLock = !eP.tempoLock,
                this.classList.toggle("selected", eP.tempoLock)
            }
            ,
            J("allow-sustain").onchange = function() {
                r.style.sustain = this.checked ? "chord" : "",
                i = this.checked,
                h(!0)
            }
            ,
            J("dialog-style-bass").onchange = function() {
                r.style.bass.style = this.value;
                let e = ej[this.value];
                r.style.bass.arp = e.list,
                r.style.bass.arpEvents = null,
                r.style.bass.step = e.step,
                r.style.bass.cropLength = e.cropLength,
                ou(),
                h(!0)
            }
            ),
            ("main" == ng || "settings" == ng) && (s = new em("dialog-style-tempo",{
                min: 30,
                max: 200,
                step: 1,
                title: "Tempo",
                customValue: {
                    max: 300
                },
                onData: function() {
                    return r.style.tempo
                },
                onInput: function(e) {
                    r.style.tempo = e,
                    p.startExampleChord()
                },
                onChange: function(e) {
                    oQ()
                },
                onRender: function(e) {
                    return e + " BPM"
                },
                onClose: function() {
                    p.replaySequence(),
                    o || p.stopChord(),
                    $()
                }
            })).update(),
            "settings" == ng && (J("dialog-style-sustain").value = r.style.sustain,
            J("dialog-style-sustain").onchange = function(e) {
                r.style.sustain = e.target.value,
                r.style.preset = void 0,
                i = !!e.target.value,
                $(),
                h(!0)
            }
            ,
            J("dialog-style-shuffle").value = r.style.shuffle,
            J("dialog-style-shuffle").onchange = function(e) {
                r.style.shuffle = e.target.value,
                r.style.preset = void 0,
                ou(),
                h()
            }
            ,
            J("dialog-style-time-signature").onchange = function(e) {
                r.style.timeSignature = this.value,
                r.style.preset = void 0,
                r.style.shuffle = "1:1",
                ej[r.style.chord.style],
                ej[r.style.bass.style],
                nv(r, l),
                oQ(),
                ou(),
                $()
            }
            ),
            'Enter sequence (advanced)',
            "chord" == ng) {
                J("dialog-style-chord-step").onchange = function(e) {
                    let t = e.target.value.split("/");
                    r.style.chord.step = [Number(t[0]), Number(t[1])],
                    r.style.preset = void 0,
                    ou(),
                    $(),
                    h()
                }
                ,
                J("dialog-style-chord-length").onchange = function() {
                    r.style.chord.arpLength = Number(this.value),
                    ou(),
                    $(),
                    h()
                }
                ,
                J("dialog-style-num-notes").value = r.style.chord.numNotes || 0,
                J("dialog-style-num-notes").onchange = function(e) {
                    r.style.chord.numNotes = Number(e.target.value),
                    r.style.preset = void 0,
                    ou(),
                    $(),
                    h()
                }
                ,
                J("dialog-style-chord-open").checked = r.style.chord.open,
                J("dialog-style-chord-open").onchange = function(e) {
                    r.style.chord.open = e.target.checked,
                    r.style.preset = void 0,
                    h()
                }
                ,
                J("dialog-style-chord-inversions").checked = r.style.chord.inversions,
                J("dialog-style-chord-inversions").onchange = function(e) {
                    r.style.chord.inversions = e.target.checked,
                    r.style.preset = void 0,
                    h()
                }
                ,
                J("dialog-style-chord-octave").checked = r.style.chord.double,
                J("dialog-style-chord-octave").onchange = function(e) {
                    r.style.chord.double = e.target.checked,
                    r.style.preset = void 0,
                    h()
                }
                ,
                J("dialog-style-chord-mirror").onchange = function(e) {
                    r.style.chord.mirror = e.target.checked,
                    r.style.preset = void 0,
                    ou(),
                    h(!0)
                }
                ,
                J("dialog-style-chord-loop").onchange = function(e) {
                    r.style.chord.loop = e.target.checked,
                    r.style.preset = void 0,
                    ou(),
                    h(!0)
                }
                ,
                J("dialog-style-chord-keep").checked = r.style.chord.keep,
                J("dialog-style-chord-keep").onchange = function(e) {
                    r.style.chord.keep = e.target.checked,
                    r.style.preset = void 0,
                    ou()
                }
                ,
                J("dialog-style-chord-crop-length").onchange = function(e) {
                    r.style.chord.cropLength = Number(e.target.value),
                    r.style.preset = void 0,
                    ou(),
                    h(!0)
                }
                ;
                new em("dialog-style-chord-vel",{
                    title: 'Velocity' + " (%)",
                    min: 0,
                    max: 200,
                    step: 1,
                    customValue: {},
                    onData: function() {
                        return 100 * r.style.chord.velocity
                    },
                    onInput: function(e) {
                        r.style.chord.velocity = e / 100,
                        p.startExampleChord()
                    },
                    onChange: function(e) {
                        "once" == r.style.chord.style ? h(!0) : o || p.stopChord(),
                        r.style.preset = void 0
                    },
                    onRender: function(e) {
                        return e
                    }
                }).update();
                new em("dialog-style-chord-note-duration",{
                    title: 'Note duration' + " (%)",
                    description: r.style.sustain ? "(" + 'Disable Sustain notes in General to use this' + ")" : "",
                    min: 1,
                    max: 100,
                    step: 1,
                    onData: function() {
                        return 100 * r.style.chord.noteDuration
                    },
                    onInput: function(e) {
                        r.style.chord.noteDuration = e / 100,
                        p.startExampleChord()
                    },
                    onChange: function(e) {
                        r.style.sustain || p.startExampleChord(),
                        r.style.preset = void 0
                    },
                    onRender: function(e) {
                        return r.style.sustain ? "-" : e
                    },
                    onClose: function() {
                        "once" == r.style.chord.style ? h(!0) : o || p.stopChord()
                    }
                }).update(),
                (e = new em("dialog-style-chord-spread",{
                    min: -100,
                    max: 100,
                    step: 1,
                    onData: function() {
                        return 100 * r.style.chord.spread
                    },
                    onInput: function(e) {
                        r.style.chord.spread = e / 100
                    },
                    onChange: function(e) {
                        r.style.preset = void 0,
                        p.startExampleChord()
                    },
                    onRender: function(e) {
                        return e
                    },
                    onClose: function() {
                        "once" == r.style.chord.style ? h(!0) : o || p.stopChord()
                    }
                })).update()
            }
            if ("bass" == ng) {
                J("dialog-style-bass-step").onchange = function(e) {
                    let t = e.target.value.split("/");
                    r.style.bass.step = [Number(t[0]), Number(t[1])],
                    r.style.preset = void 0,
                    ou(),
                    $(),
                    h()
                }
                ,
                J("dialog-style-bass-length").onchange = function() {
                    r.style.bass.arpLength = Number(this.value),
                    ou(),
                    $(),
                    h()
                }
                ,
                J("dialog-style-bass-octave").checked = r.style.bass.double,
                J("dialog-style-bass-octave").onchange = function(e) {
                    r.style.bass.double = e.target.checked,
                    r.style.preset = void 0,
                    h()
                }
                ,
                J("dialog-style-bass-mirror").onchange = function(e) {
                    r.style.bass.mirror = e.target.checked,
                    r.style.preset = void 0,
                    ou(),
                    h()
                }
                ,
                J("dialog-style-bass-loop").onchange = function(e) {
                    r.style.bass.loop = e.target.checked,
                    r.style.preset = void 0,
                    ou(),
                    h()
                }
                ,
                J("dialog-style-bass-crop-length").onchange = function(e) {
                    r.style.bass.cropLength = Number(e.target.value),
                    r.style.preset = void 0,
                    ou(),
                    h()
                }
                ;
                new em("dialog-style-bass-vel",{
                    title: 'Velocity' + " (%)",
                    min: 0,
                    max: 200,
                    step: 1,
                    onData: function() {
                        return 100 * r.style.bass.velocity
                    },
                    onInput: function(e) {
                        r.style.bass.velocity = e / 100,
                        p.startExampleChord()
                    },
                    onChange: function(e) {
                        "once" == r.style.bass.style ? h(!0) : o || p.stopChord(),
                        r.style.preset = void 0
                    },
                    onRender: function(e) {
                        return e
                    },
                    onClose: function() {}
                }).update();
                new em("dialog-style-bass-note-duration",{
                    title: 'Note duration' + " (%)",
                    description: r.style.sustain ? "(" + 'Disable Sustain notes in General to use this' + ")" : "",
                    min: 1,
                    max: 100,
                    step: 1,
                    onData: function() {
                        return 100 * r.style.bass.noteDuration
                    },
                    onInput: function(e) {
                        r.style.bass.noteDuration = e / 100,
                        p.startExampleChord()
                    },
                    onChange: function(e) {
                        r.style.sustain || p.startExampleChord(),
                        r.style.preset = void 0
                    },
                    onRender: function(e) {
                        return r.style.sustain ? "-" : e
                    },
                    onClose: function() {
                        "once" == r.style.chord.style ? h(!0) : o || p.stopChord()
                    }
                }).update()
            }
            $()
        };
        c()
    }, nx, nk = function() {
        let e = new em("volume",{
            min: 0,
            max: 1.25,
            step: .01,
            title: 'Volume',
            onData: function() {
                return eP.volume
            },
            onInput: function(e) {
                eP.volume = e;
                let t = l.current();
                t && (t.masterGain.gain.value = e < .8 ? e : Math.pow(e, 4))
            },
            onRender: function(e) {
                return Math.round(80 * e)
            }
        })
          , t = new em("instrument",{
            onData: function() {
                return r.instrument
            },
            onClick: function() {
                let e = JSON.parse(JSON.stringify(r)), o = !!r.bassInstrument || !!r.melodyInstrument, n = "melody", s = {
                    chord: "instrument",
                    bass: "bassInstrument",
                    melody: "melodyInstrument"
                }, a = [{
                    value: "melody",
                    name: 'Melody'
                }, {
                    value: "chord",
                    name: 'Chord'
                }, {
                    value: "bass",
                    name: 'Bass'
                }], i, c;
                oD.forEach(function(e) {
                    let t = e.data;
                    r.instrument == t.instrument && r.bassInstrument == t.bassInstrument && r.melodyInstrument == t.melodyInstrument && (c = e.value,
                    o = !1)
                });
                let d = function() {
                    let e = [];
                    o6.forEach(function(t) {
                        "spiccato"in t || e.push(t)
                    }),
                    o || oD.forEach(function(t) {
                        e.push(t)
                    }),
                    i.updateOptions(e, o ? r[s[n]] : c || r.instrument)
                }
                  , u = function() {
                    let e = J("dialog-instrument-select");
                    if (e.style.display = o ? "block" : "none",
                    o) {
                        let t = [];
                        a.forEach(function(e) {
                            t.push('<option value="' + e.value + '">' + e.name + " (" + o6.get(r[s[e.value]]).name + ")</option>")
                        }),
                        X(e, "innerHTML", t.join("")),
                        X(e, "value", n)
                    }
                }
                  , f = [];
                ts.forEach(function(e) {
                    f.push('<option value="' + e.value + '">' + e.name + "</option>")
                });
                let h = '<optgroup label="' + 'Delay time' + '">' + [[1, 1], [.67, 1.5], [.5, 2], [.33, 3], ].map(function(e) {
                    let t = 1
                      , o = e[1] * w[r.style.timeSignature].beats;
                    return o != Math.floor(o) && (t *= 2,
                    o *= 2),
                    '<option value="' + e[0] + '">' + t + "/" + o + "</option>"
                }).join("") + "</optgroup>"
                  , m = function() {
                    return o ? n : "chord"
                };
                i = et({
                    title: 'Select instrument',
                    className: "dialog-instrument",
                    description: '<label class="control"><input id="dialog-instrument-checkbox" type="checkbox" /><span class="label">' + 'Customize' + '</span></label><select id="dialog-instrument-select" class="items" style="width: 100%; margin-top: 5px;"></select>',
                    belowContent: '<div id="effect-container" class="effect-container"><div class="control"><span class="label">' + 'Effect' + '</span><select id="effect-type" class="effect-type">' + f.join("") + '</select> <button id="effect-amount" class="value-control"></button>&nbsp; <label><input id="effect-echo-on" type="checkbox" /><span class="label">' + 'Echo' + '</span></label><div id="effect-echo-container" class="effect-echo-container"><span class="label">' + 'Dl' + '</span><select id="effect-echo-delay" class="effect-echo-delay">' + h + '</select>&nbsp; <span class="label">' + 'Lv' + '</span><button id="effect-echo-amount" class="value-control"></button>&nbsp; <span class="label">' + 'Fb' + '</span><button id="effect-echo-feedback" class="value-control"></button></div></div></div>',
                    value: r.instrument,
                    formatNotice: function(e) {
                        var t;
                        return e ? 'Samples from' + ' <a href="' + ("/redirect/?url=" + encodeURIComponent(t = e.url) + "&z=") + Array.from(t).reduce( (e, t) => e + t.charCodeAt(0), 0) + '" target="_blank">' + e.name + "</a>" + (e.license ? " (" + ("free" == e.license ? 'free' : e.license) + ")" : "") : ""
                    },
                    options: [],
                    optionsOneColumn: 1,
                    onChange: function(e) {
                        let t = !p.started()
                          , a = oD[e];
                        a ? (r.instrument = a.data.instrument,
                        r.melodyInstrument = a.data.melodyInstrument,
                        oJ("chord", t),
                        setTimeout(function() {
                            r.bassInstrument = a.data.bassInstrument,
                            oJ("bass", t)
                        }, 300),
                        c = e) : (c = void 0,
                        o ? (r[s[n]] = e,
                        u()) : (r.instrument = e,
                        r.bassInstrument = void 0,
                        r.melodyInstrument = void 0),
                        oJ(m(), t)),
                        _()
                    },
                    onSelect: function(e) {
                        r.bassInstrument == r.instrument && r.melodyInstrument == r.instrument && (r.bassInstrument = void 0,
                        r.melodyInstrument = void 0),
                        t.update(),
                        oX({
                            showMidiDialog: !0
                        }),
                        ou(),
                        tO(),
                        o8("Updated instruments")
                    },
                    onCancel: function() {
                        r = e,
                        oX(),
                        oQ()
                    },
                    onClose: function() {}
                }),
                J("dialog-instrument-checkbox").onchange = function(e) {
                    (o = e.target.checked) ? c || (r.bassInstrument = r.instrument,
                    r.melodyInstrument = r.instrument) : (r.bassInstrument = void 0,
                    r.melodyInstrument = void 0,
                    c = void 0),
                    u(),
                    d()
                }
                ,
                J("dialog-instrument-checkbox").checked = o,
                J("dialog-instrument-select").onchange = function(e) {
                    n = e.target.value,
                    d()
                }
                ;
                let $ = function() {
                    if (!p.isSequencePlaying()) {
                        let e = l.current().context.currentTime;
                        o9.press(m(), 48, .7, e),
                        o9.release(m(), 48, e + .2)
                    }
                };
                J("effect-type").value = r.effectType,
                J("effect-type").onchange = function(e) {
                    r.effectType = e.target.value,
                    oQ(function() {
                        $()
                    })
                }
                ;
                let _ = function() {
                    J("effect-container").style.display = o ? "block" : "midi-out" == r.instrument ? "none" : "block",
                    J("effect-echo-container").style.display = J("effect-echo-on").checked ? "block" : "none"
                };
                J("effect-echo-on").checked = !!r.effectEcho.active,
                J("effect-echo-on").onchange = function(e) {
                    r.effectEcho.active = e.target.checked,
                    oQ(),
                    $(),
                    _()
                }
                ,
                _(),
                J("effect-echo-delay").value = r.effectEcho.delay,
                J("effect-echo-delay").onchange = function(e) {
                    r.effectEcho.delay = Number(e.target.value),
                    oQ(function() {
                        $()
                    })
                }
                ;
                new em("effect-echo-feedback",{
                    title: 'Feedback' + " (%)",
                    onData: function() {
                        return 100 * r.effectEcho.feedback
                    },
                    min: 0,
                    max: 50,
                    step: 1,
                    onInput: function(e) {},
                    onChange: function(e) {
                        r.effectEcho.feedback = e / 100,
                        oQ(),
                        $()
                    },
                    onRender: function(e) {
                        return e
                    }
                }).update();
                new em("effect-echo-amount",{
                    title: 'Echo level' + " (%)",
                    onData: function() {
                        return 100 * r.effectEcho.amount
                    },
                    min: 0,
                    max: 100,
                    step: 1,
                    onInput: function(e) {},
                    onChange: function(e) {
                        r.effectEcho.amount = e / 100,
                        oQ(),
                        $()
                    },
                    onRender: function(e) {
                        return e
                    }
                }).update();
                new em("effect-amount",{
                    title: 'Effect level' + " (%)",
                    onData: function() {
                        return 100 * r.effectAmount
                    },
                    min: 0,
                    max: 100,
                    step: 1,
                    onInput: function(e) {
                        r.effectAmount = e / 100,
                        oQ()
                    },
                    onChange: function(e) {
                        $()
                    },
                    onRender: function(e) {
                        return e
                    }
                }).update(),
                u(),
                d()
            },
            onRender: function(e) {
                let t = o6.get(e);
                return r.bassInstrument || r.melodyInstrument ? "Combo" : "shortName"in t ? t.shortName : t.name
            }
        })
          , o = {
            query: "",
            insertChords: !1
        }
          , n = function(e) {
            let t = et({
                title: 'Select scale',
                description: '<div class="control"><div class="label">' + 'Search by chords' + '</div></div><input id="dialog-scale-search-input" class="value-control" autocorrect="off" placeholder="' + 'List of chords' + '" type="text" style="width: 100%;" />',
                disableClickOutside: !0,
                options: [],
                optionsOneColumn: 1,
                onSelect: function(e) {
                    let t = e.split(/ /);
                    o2(t5(t[0]) - t5(r.scaleKey)),
                    r.scaleKey = t[0],
                    r.scale = t[1],
                    eP.currentMode = te.get(r.scale).offset,
                    eP.keyChange = 0,
                    eP.transpose = 0,
                    tX.reset(),
                    o8("Updated scale " + r.scaleKey + " " + te.get(r.scale).name),
                    tO()
                },
                onCancel: function() {
                    e && e()
                }
            });
            J("dialog-items").style.height = "150px";
            let n = function(e) {
                let o = [];
                if (e) {
                    try {
                        let n = o1(oC(e, 1));
                        n.list.forEach(function(e) {
                            o.push({
                                value: e.value,
                                name: '<div style="float: right; color: rgba(255,255,255,.2);">' + e.count + "/" + n.noteCount + "</div>" + e.name
                            })
                        })
                    } catch (s) {}
                    t.updateOptions(o, o.length > 0 ? o[0].value : void 0)
                }
            }
              , s = J("dialog-scale-search-input")
              , a = o.query;
            s.value = a,
            s.focus(),
            s.select(),
            s.onkeyup = function(e) {
                o.query = e.target.value,
                n(o.query)
            }
            ,
            n(a)
        };
        J("scale-warning").onclick = function() {
            oS(!0)
        }
        ;
        let s = new em("scale-key-mode",{
            onData: function() {
                return r.scale
            },
            onClick: function() {
                let e = !te.get(r.scale).primary
                  , t = !0
                  , o = JSON.parse(JSON.stringify(r))
                  , s = [];
                te.forEach(function(e) {
                    e.primary && (s[e.scaleGroup] || (s[e.scaleGroup] = []),
                    s[e.scaleGroup].push(e.value))
                });
                let a = function() {
                    if (p.started() || "midi-out" == r.instrument)
                        return;
                    let e = l.current().context.currentTime;
                    o9.releaseAll(),
                    o9.resetEnvelopes();
                    let t = te.get(r.scale).steps.slice();
                    t.push(12),
                    t.forEach(function(t, o) {
                        let n = t + 48 + t5(r.scaleKey);
                        o9.press("chord", n, .7, e + .3 * o),
                        o9.release("chord", n, e + (o + 1) * .3, !0)
                    }),
                    o9.sendMidi()
                }
                  , i = function() {
                    p.started() || "midi-out" == r.instrument || o9.releaseAll()
                }
                  , c = function() {
                    let l, d = function() {
                        te.get(r.scale);
                        let e = "";
                        eG.forEach(function(t) {
                            e += "<option " + (r.scaleKey == t.value ? " selected" : "") + ' value="' + t.value + '">' + t.name + "</option>"
                        }),
                        J("dialog-scale-select").innerHTML = e
                    }, u = function() {
                        l.releaseAll();
                        let e = te.get(r.scale).steps.slice();
                        e.push(60),
                        e.forEach(function(e) {
                            l.press(e + t5(r.scaleKey) + 48, "hold-chord")
                        })
                    }, f = t5(r.scaleKey), h = [];
                    te.forEach(function(t) {
                        if (!e && !t.primary || !s[t.scaleGroup])
                            return;
                        let o = [];
                        s[t.scaleGroup].forEach(function(e) {
                            if (e == t.value)
                                return;
                            let n = te[e]
                              , s = t.steps[(n.offset - t.offset + t.steps.length) % t.steps.length];
                            o.push(tN(f + s, t.value, r.scaleKey) + " " + n.name)
                        });
                        let n = []
                          , a = []
                          , i = {
                            1: "\xbd",
                            2: "1",
                            3: "1\xbd"
                        }
                          , l = t.steps;
                        l.forEach(function(e, o) {
                            a.push(i[(o < l.length - 1 ? l[o + 1] : l[0] + 12) - e]),
                            n.push(tN(e + t5(r.scaleKey), t.value, r.scaleKey))
                        });
                        let c = tF(r.scaleKey, t) + "\n" + 'Notes' + ": " + n.join(" ") + "\n" + 'Steps' + ": " + a.join(" ") + (o.length > 0 ? "\n" + 'Relative key' + ": " + o.join(", ") : "");
                        h.push({
                            value: t.value,
                            name: (e ? t.offset + 1 + " " : "") + (e && t.modeName || t.name),
                            groupName: tt[t.scaleGroup].name,
                            title: c
                        })
                    });
                    let m = function() {
                        let e = JSON.parse(JSON.stringify(o));
                        e.scaleKey = r.scaleKey,
                        e.scale = r.scale,
                        r = e,
                        t || o2(t5(r.scaleKey) - t5(o.scaleKey), !0),
                        p.updateCurrentChord(),
                        p.isSequencePlaying() && p.startSequence({
                            force: !0
                        })
                    }
                      , $ = et({
                        title: 'Select scale',
                        description: '<div style=""><div id="dialog-piano" class="piano active piano-type-chord"></div><select id="dialog-scale-select" class="dialog-scale-select items"></select></div>',
                        belowContent: '<div style="overflow: hidden;"><div class="control" style="float: right; "><a id="dialog-scale-search-link" class="label">' + 'Search by chords' + '</a></div><div class="control" style=""><label><input id="dialog-scale-show-modes" type="checkbox" /><span class="label">' + 'Show modes' + '</span></label></div><div id="dialog-scale-transpose-container" class="control"><label><input id="dialog-scale-transpose" type="checkbox" /><span class="label">' + 'Transpose song' + "</span></label></div></div>",
                        className: "dialog-scale",
                        value: r.scale,
                        options: h,
                        optionsOneColumn: 1,
                        formatOptionGroup: function(t, o) {
                            if (e)
                                return o && t.groupName != o.groupName || !o ? '<div class="item-group-header">' + t.groupName + "</div>" : void 0
                        },
                        onChange: function(e) {
                            r.scale = e,
                            d(),
                            m(),
                            u(),
                            a()
                        },
                        onSelect: function(e) {
                            o8("Updated scale " + r.scaleKey + " " + te.get(r.scale).name),
                            eP.currentMode = te.get(r.scale).offset,
                            eP.keyChange = 0,
                            eP.transpose = 0,
                            tX.reset(),
                            tO()
                        },
                        onCancel: function() {
                            r = JSON.parse(JSON.stringify(o)),
                            p.replaySequence()
                        },
                        onClose: function() {
                            i()
                        }
                    });
                    l = new th({
                        id: "dialog-piano"
                    }),
                    u(),
                    d(),
                    J("dialog-scale-search-link").onclick = function() {
                        $.cancelDialog(),
                        n(c)
                    }
                    ,
                    J("dialog-scale-select").onchange = function(e) {
                        r.scaleKey = e.target.value,
                        m(),
                        c()
                    }
                    ,
                    J("dialog-scale-show-modes").checked = e,
                    J("dialog-scale-show-modes").onchange = function(t) {
                        e = t.target.checked,
                        c()
                    }
                    ,
                    J("dialog-scale-transpose").checked = t,
                    J("dialog-scale-transpose").onchange = function(e) {
                        t = e.target.checked,
                        m()
                    }
                };
                c()
            },
            onRender: function(e) {
                return tF(r.scaleKey, e, !0)
            }
        })
          , a = new em("style",{
            onData: function() {},
            onClick: function() {
                n0()
            },
            onRender: function(e) {
                return r.style.preset ? e6[r.style.preset].short || e6[r.style.preset].name : 'Custom'
            }
        });
        J("keyboard-select-type").onchange = function(e) {
            u.keyboardType = this.value,
            oK(),
            tT(),
            t$(),
            e.target.blur(),
            o9.releaseAll()
        }
        ,
        J("keyboard-chord-num-notes").onchange = function(e) {
            u.keyboardChordNumNotes = Number(this.value),
            oK(),
            tT(),
            t$(),
            e.target.blur(),
            o9.releaseAll()
        }
        ,
        J("keyboard-multi").onchange = function(e) {
            u.keyboardMulti = Number(this.value),
            oK(),
            e.target.blur(),
            o9.releaseAll()
        }
        ,
        J("keyboard-record").onclick = function(e) {
            p.setMelodyRecording()
        }
        ;
        new em("keyboard-velocity",{
            title: 'Velocity' + " (%)",
            min: 0,
            max: 200,
            step: 1,
            onData: function() {
                return 100 * eP.velocity
            },
            onInput: function(e) {
                eP.velocity = e / 100
            },
            onRender: function(e) {
                return e
            }
        }).update(),
        J("keyboard-sustain").onchange = function(e) {
            u.keyboardSustain = this.checked,
            oK(),
            e.target.blur(),
            o9.releaseAll()
        }
        ,
        (nx = function() {
            e.update(),
            a.update(),
            t.update(),
            s.update()
        }
        )()
    }, nC, nS, n1 = function(e) {
        nC && (J("tab-" + nC).classList.remove("selected"),
        J("page-" + nC).style.display = "none",
        document.documentElement.classList.remove("section-" + nC)),
        J("tab-" + e).classList.add("selected"),
        J("page-" + e).style.display = "block",
        document.documentElement.classList.add("section-" + e),
        "explore" == nC && nI(),
        "keyboard" == nC && p.setMelodyRecording(!1),
        "compose" == nC && "compose" == e && nA("palette" == nS ? "editor" : "palette"),
        nC = e,
        "keyboard" == e && (tT(),
        p.hideChordProps()),
        "roll" == e && tA(),
        "explore" == e && nL(),
        J("controls").style.display = "explore" == e ? "none" : "",
        t$()
    }, n2 = [["palette", 'Chord palette'], ["circle", 'Circle of fifths'], ["cadences", 'Cadences'], ["editor", 'Style editor']], nA = function(e) {
        J("chords-page-nav-label").innerHTML = n2.find(function(t) {
            return e == t[0]
        })[1],
        nS && (J("chords-page-" + nS).style.display = "none"),
        J("chords-page-" + e).style.display = "block",
        nS = e,
        c.updatePageNav(),
        "cadences" == e && tX.reset()
    };
    W[H].tab = function(e, t) {
        n1(t.dataset.value)
    }
    ,
    W[H].chordsPageNav = function(e, t) {
        eg({
            elem: t,
            value: nS,
            options: n2,
            onSelect: function(e) {
                nA(e)
            }
        })
    }
    ;
    let nT = {}
      , n3 = function(e) {
        e.halfDown || e.halfUp || e.halfZero || ["halfDown", "halfZero", "halfUp"].forEach(function(t) {
            e[t] = nT[t]
        }),
        e.default || e.parallell || e.dominant || e.diminished || e.other || ["default", "parallell", "dominant", "diminished", "other"].forEach(function(t) {
            e[t] = nT[t]
        }),
        nT = e,
        tJ(),
        d.update()
    }
      , nw = function() {
        let e = {};
        no.ShiftLeft && !no.IntlBackslash && (e.parallell = !0),
        no.ShiftRight ? e.advanced = !0 : no.AltLeft ? e.dominant = !0 : no.AltRight || no.AltGraph ? e.diminished = !0 : e.default = !0,
        no.IntlBackslash || no.Comma || no.Period ? e[no.ShiftLeft || no.Period ? "halfUp" : "halfDown"] = !0 : e.halfZero = !0,
        nT = e,
        tU(),
        tJ(),
        d.update()
    };
    W[U].chordSelect = function() {
        tJ()
    }
    ;
    let nP = function() {
        let e = '<div id="chord-types">'
          , t = {};
        Object.keys(r.chordLayout).forEach(function(e) {
            t[e] = !0
        });
        let o = r.customChords.map(function(e) {
            return ti.parseType(e.chord).suffix || "maj"
        }).join(", "), n = r.parallellScaleChords, s;
        tn.forEach(function(o) {
            let n = o.value.indexOf("diatonic-") > -1 ? 'Chords in scale' : 'Other chords';
            n != s && (e += '<div class="dialog-chord-types-header">' + n.toUpperCase() + "</div>",
            s = n),
            e += '<div><label><input type="checkbox" value="' + o.value + '"' + (t[o.value] ? " checked" : "") + " /><span>" + (o.longName || o.name) + "</span></label></div>"
        }),
        e += '</div><div class="dialog-chord-types-header" style="margin-top: 20px;">' + 'Other chords' + '</div><div><textarea id="custom-chords" style="width: 100%; height: 50px;" placeholder="' + 'List of types' + " \n" + 'Example' + ': maj7,11,m7b5" /></textarea></div><div style="margin-top: 20px;"><div><label><input id="parallell-scale-chords" name="parallellScaleChords" type="checkbox" value="1" /><span>' + 'Combine major/minor scale' + "</span></label></div></div>",
        et({
            title: 'Available chords',
            description: '<div class="items dialog-chord-types">' + e + "</div>",
            disableClickOutside: !0,
            onBeforeSelect: function() {
                try {
                    let e = [];
                    return o.split(/[,\s]+/).forEach(function(t) {
                        if (!t)
                            return;
                        let o = ti.parseType(t);
                        e.push({
                            chord: o.name
                        })
                    }),
                    r.customChords = e,
                    !0
                } catch (t) {
                    return alert(t),
                    !1
                }
            },
            onSelect: function() {
                r.chordLayout = {},
                tn.forEach(function(e) {
                    t[e.value] && (r.chordLayout[e.value] = !0)
                }),
                r.parallellScaleChords = n,
                o8("Updated available chords"),
                tJ(),
                ny()
            }
        }),
        J("custom-chords").value = o,
        J("custom-chords").onchange = function() {
            o = this.value
        }
        ,
        J("parallell-scale-chords").checked = n,
        J("parallell-scale-chords").onchange = function() {
            n = this.checked
        }
        ,
        J("chord-types").addEventListener("change", function(e) {
            let o = e.target;
            o.checked ? t[o.value] = !0 : delete t[o.value]
        })
    }
      , n5 = function() {
        -1 == document.location.search.indexOf("test") && (J("app").oncontextmenu = function() {
            return !1
        }
        ),
        p = new oT,
        document.addEventListener("visibilitychange", function() {
            p.updateBufferTime("hidden" != document.visibilityState),
            n3({
                default: !0,
                halfZero: !0
            })
        }),
        window.addEventListener("focus", function() {
            n3({
                default: !0,
                halfZero: !0
            })
        }),
        c = new tZ,
        d = new tW,
        oV(),
        eP.currentMode = te.get(r.scale).offset,
        eP.keyChange = 0,
        eP.transpose = 0,
        oY.setupMidiInputs(!1),
        nk(),
        tO(),
        ou(),
        p.setCursorPos(0);
        let a = function() {
            oX({
                silent: !0
            }).then( () => {
                window.showAds && window.showAds(),
                nE()
            }
            ),
            t({
                items: "click",
                format: "mp3",
                context: l.current().context,
                onItem: function(e) {
                    oF.click = {
                        buffer: e.buffer
                    }
                },
                onFinished: function() {}
            }),
            oQ()
        };
        o7(function() {
            let e = document.location.hash.replace("#", "");
            e ? oR(e, {
                noSounds: !0,
                callback: a,
                reset: !0
            }) : a()
        }),
        document.onkeydown = ni,
        document.onkeyup = nr,
        document.addEventListener("touchstart", nd, {
            passive: !1
        }),
        document.addEventListener("touchmove", nf, {
            passive: !1
        }),
        document.addEventListener("touchend", nm, {
            passive: !1
        }),
        document.addEventListener("mousedown", nd, {
            passive: !1
        }),
        document.addEventListener("mousemove", nf, {
            passive: !1
        }),
        document.addEventListener("mouseup", nm, {
            passive: !1
        }),
        document.addEventListener("mousewheel", n$, {
            passive: !1
        }),
        J("cadence-pedal-point").onchange = function() {
            eP.cadencesPedalPoint = !eP.cadencesPedalPoint,
            tX.update()
        }
        ;
        let i = function() {
            if (u.drumMachineEnabled = !u.drumMachineEnabled,
            oK(),
            u.drumMachineEnabled) {
                let e;
                f.onmessage = function(t) {
                    "drum-machine-ok" == t.data.action && clearTimeout(e)
                }
                ,
                f.postMessage({
                    action: "chord-player-ping"
                }),
                e = setTimeout(function() {
                    et({
                        title: 'Information',
                        description: '<div style="margin-bottom: 5px;">' + 'Drum machine needs to be open in another tab.' + '</div><a href="/drum-machine/" target="_blank">' + 'Open drum-machine' + "</a>",
                        buttons: [{
                            name: 'OK'
                        }]
                    })
                }, 500)
            } else
                f.postMessage({
                    action: "chord-player-stop"
                })
        }
          , h = function() {
            let e = {
                keyboardLayout: u.keyboardLayout,
                keyboardKeyCount: u.keyboardKeyCount,
                chordNotation: u.chordNotation
            }
              , t = function() {
                for (let t in e)
                    u[t] = e[t];
                oK(),
                tO()
            };
            et({
                title: 'Preferences',
                description: '<div class="form-control"><label class="label">' + 'Keyboard' + '</label><select id="settings-keyboard-layout"><option value="qwerty">QWERTY</option><option value="qwertz">QWERTZ</option><option value="azerty">AZERTY</option></select></div><div class="form-control"><label class="label">' + 'Chord notation' + '</label><select id="settings-chord-notation"><option value="default">' + 'Default' + '</option><option value="number">Nashville Number System</option><option value="roman-numeral">' + 'Roman numerals' + '</option><!--option value="suffix">' + 'Only chord type' + '</option--></select></div><div class="form-control"><label class="label">' + 'Melody keys' + '</label><select id="settings-keyboard-key-count"><option value="8">8</option><option value="11">11</option><option value="15">15</option><option value="18">18</option><option value="22">22</option></select></div><div style="margin-top: 10px;"><label><input type="checkbox" id="settings-show-unusual-chords" /><span>' + 'Show unusual chords' + ' (b2,#4)</span></label></div><div><label><input type="checkbox" id="settings-force-voice-info" /><span>' + 'Show always voice info' + " (R,3,5)</span></label></div>",
                onSelect: function() {
                    t()
                }
            }),
            J("settings-keyboard-layout").value = u.keyboardLayout,
            J("settings-keyboard-layout").onchange = function() {
                e.keyboardLayout = this.value
            }
            ,
            J("settings-keyboard-key-count").value = u.keyboardKeyCount,
            J("settings-keyboard-key-count").onchange = function() {
                e.keyboardKeyCount = Number(this.value)
            }
            ,
            J("settings-chord-notation").value = u.chordNotation,
            J("settings-chord-notation").onchange = function() {
                e.chordNotation = this.value
            }
            ,
            J("settings-show-unusual-chords").checked = u.showUnusualChords,
            J("settings-show-unusual-chords").onchange = function() {
                e.showUnusualChords = this.checked
            }
            ,
            J("settings-force-voice-info").checked = u.showAlwaysVoiceInfo,
            J("settings-force-voice-info").onchange = function() {
                e.showAlwaysVoiceInfo = this.checked
            }
        }
          , m = function() {
            u.metronomeEnabled = !u.metronomeEnabled,
            oK()
        }
          , $ = function() {
            u.chordControlEnabled = !u.chordControlEnabled,
            u.chordControlEnabled ? eP.currentMode = te.get(r.scale).offset : (eP.transpose = 0,
            eP.keyChange = 0),
            oK(),
            tO()
        }
          , _ = function() {
            et({
                title: 'Keyboard shortcuts',
                className: "dialog-keyboard-shortcuts",
                description: '<div class="shortcuts"><div class="shortcuts-header">' + 'Chords' + '</div><div class="shortcuts-key"><span>1-9, A-Z</span> ' + 'Chords' + '</div><div class="shortcuts-key"><span>Shift</span> ' + 'Parallell scale chords' + '</div><div class="shortcuts-key"><span>Alt/Option</span> ' + 'Dominant chords' + '</div><div class="shortcuts-key"><span>&lt;</span> ' + 'Lower chords a half step' + '</div><div class="shortcuts-key"><span>&gt;</span> ' + 'Raise chords a half step' + '</div><div class="shortcuts-key"><span>+/-</span> ' + 'Increase/decrease chord length' + '</div><div class="shortcuts-header">' + 'Melody' + '</div><div class="shortcuts-key"><span>1-9, A-Z</span> ' + 'Tones' + '</div><div class="shortcuts-key"><span>Shift</span> ' + 'Chord' + "</div></div>",
                buttons: [{
                    name: 'OK'
                }]
            })
        }
          , y = function() {
            let e = [];
            e.push({
                name: u.chordControlEnabled ? 'Hide advanced panel' : 'Show advanced panel',
                onSelect: function() {
                    $()
                }
            }),
            e.push({
                name: u.drumMachineEnabled ? 'Disable drum machine' : 'Enable drum machine',
                onSelect: function() {
                    i()
                },
                disabled: !f
            }),
            e.push({
                name: u.metronomeEnabled ? 'Disable metronome' : 'Enable metronome',
                onSelect: function() {
                    m()
                }
            }),
            e.push({
                name: 'MIDI inputs' + (navigator.requestMIDIAccess || !v ? "" : " (Chrome)"),
                onSelect: function() {
                    oY.setupMidiInputs(!0)
                },
                disabled: !navigator.requestMIDIAccess
            }),
            e$.isAvailable() && -1 == document.location.search.indexOf("fullscreen") && e.push({
                name: e$.isActive() ? 'Leave fullscreen' : 'Fullscreen',
                onSelect: function() {
                    e$.toggle()
                }
            }),
            e.push({
                name: 'Keyboard shortcuts',
                onSelect: function() {
                    _()
                }
            }),
            e.push({
                name: 'Preferences',
                onSelect: function() {
                    h()
                }
            }),
            et({
                title: 'Tools menu',
                buttons: e,
                verticalButtons: !0
            })
        };
        J("sequence-options-menu").onclick = function() {
            y()
        }
        ;
        let g = function() {
            let e = function() {
                oH({
                    name: "",
                    instrument: "piano",
                    scale: "ionian",
                    scaleKey: "C",
                    tempo: 100,
                    sustain: "",
                    timeSignature: "4/4",
                    chord: {
                        style: e6.once.chord.style,
                        step: e6.once.chord.step,
                        velocity: .7,
                        spread: 0,
                        numNotes: void 0,
                        double: !1,
                        octave: 4,
                        arp: "xs",
                        loop: !1
                    },
                    bass: {
                        style: e6.once.bass.style,
                        step: e6.once.bass.step,
                        velocity: .7,
                        double: !1,
                        octave: 2,
                        arp: "1s",
                        loop: !1
                    },
                    preset: "once",
                    noteDuration: 1,
                    chordLayout: {
                        "diatonic-sus2": !0,
                        "diatonic-triad": !0,
                        "diatonic-sus4": !0,
                        "diatonic-7": !0
                    },
                    shuffle: e6.once.shuffle || "1:1",
                    sequence: []
                }, {
                    reset: !0
                }),
                o8()
            };
            et({
                title: 'New project',
                description: 'Are you sure you want to reset everything?',
                onSelect: function() {
                    e()
                }
            })
        }
          , b = function() {
            o({
                type: "ArrayBuffer",
                onLoad: function(e) {
                    try {
                        let t = {}
                          , o = []
                          , n = 0
                          , s = new ew.Player(function(e) {}
                        );
                        if (s.on("fileLoaded", function() {
                            let e = s.division;
                            s.getEvents().forEach(function(s) {
                                s.forEach(function(s) {
                                    let a = s.name;
                                    if ("Time Signature" == a) {
                                        let i = s.timeSignature;
                                        w[i] && (r.style.timeSignature = i)
                                    }
                                    if ("Key Signature" == a) {
                                        let l = s.keySignature.split(" ")
                                          , c = {
                                            Major: "ionian",
                                            Minor: "aeolian"
                                        };
                                        void 0 != t5(l[0]) && c[l[1]] && (r.scaleKey = l[0],
                                        r.scale = c[l[1]])
                                    }
                                    if ("Note off" == a || "Note on" == a) {
                                        let d = o[t[s.noteNumber]];
                                        d && (d.push(Math.round((s.tick / e - d[0]) * 1e3) / 1e3),
                                        delete t[s.noteNumber])
                                    }
                                    "Note on" == a && (n++,
                                    t[s.noteNumber] = o.length,
                                    o.push([Math.round(s.tick / e * 1e3) / 1e3, s.noteNumber, Math.round(s.velocity / 127 * 1e3) / 1e3]))
                                })
                            })
                        }),
                        s.loadArrayBuffer(new Uint8Array(e.content)),
                        o.length > 5e3) {
                            alert('Too many notes to import');
                            return
                        }
                        r.style.tempo = s.tempo,
                        r.melody.events = o,
                        o8("Imported MIDI file"),
                        tO(),
                        alert('% notes imported'.replace("%", n))
                    } catch (a) {
                        throw alert("Invalid MIDI file"),
                        a
                    }
                }
            })
        }
          , x = function() {
            let e = r.name || tK()
              , t = !0
              , o = !0
              , n = !0;
            et({
                title: 'Export MIDI file',
                width: 400,
                description: 'Filename' + '<br/><input id="export-filename-input" type="text" style="width: 100%;" /><br/><br/><label><input id="export-bass" type="checkbox" /><span>' + 'Bass' + '</span></label> <label><input id="export-chord" type="checkbox" /><span>' + 'Chords' + '</span></label> <label><input id="export-melody" type="checkbox" /><span>' + 'Melody' + "</span></label><br/>",
                disableClickOutside: !0,
                onBeforeSelect: function() {
                    return !!e || (alert('Empty fields'),
                    !1)
                },
                onSelect: function() {
                    var s;
                    s = e,
                    r.name || s == tK() || (r.name = s),
                    p.exportMidi(s, {
                        bass: t,
                        chord: o,
                        melody: n,
                        dataTransfer: void 0
                    })
                }
            });
            let s = J("export-filename-input");
            s.value = e,
            s.onchange = function(t) {
                e = this.value
            }
            ,
            v && (s.focus(),
            s.select());
            let a = J("export-bass");
            a.checked = t,
            a.onchange = function(e) {
                t = this.checked
            }
            ;
            let i = J("export-chord");
            i.checked = o,
            i.onchange = function(e) {
                o = this.checked
            }
            ;
            let l = J("export-melody");
            l.parentNode.style.display = r.melody.events.length > 0 ? "inline" : "none",
            l.checked = n,
            l.onchange = function(e) {
                n = this.checked
            }
        }
          , C = function() {
            let e = p.exportWebPlayer()
              , t = `<!-- Global player script -->
<script>
  !function(){"use strict";var e,t,o,a,r,n,i,u,c,s=!1,l=window,d=[0,2,4,5,7,9,11],f=[1,3,0,6,8,10,0],p=function(e,t,o,a){return v("sine",e,t,o,a)},v=function(t,o,r,n,i){Math.floor(r/12);var u=e.createGain(),c=880*Math.pow(2,(r-69)/12),s=n/127*.1*100/c,l=o||1e3*e.currentTime,d=i?(l+i+100)/1e3:0;u.gain.value=0,u.gain.setValueAtTime(0,l/1e3),u.gain.setTargetAtTime(s,(l+50)/1e3,.03),u.connect(e.destination);var f=e.createGain();f.gain.value=0,f.gain.setValueAtTime(0,l/1e3),f.gain.linearRampToValueAtTime(.2,(l+2e3)/1e3);var p=e.createGain();p.gain.value=.5,f.connect(p.gain);var v=e.createOscillator();v.frequency.value=5,v.connect(f),v.start(l/1e3),u.connect(p),p.connect(e.destination);for(var m=0;m<2;m++){var g=e.createOscillator();g.type=t,g.frequency.value=c*Math.pow(2,m),g.connect(u),g.start(l/1e3),d&&g.stop(d+.5)}var y=function(e){var t=e+.1;v.stop(t+100),u.gain.cancelScheduledValues(e),u.gain.setTargetAtTime(s,e,.03),u.gain.setTargetAtTime(0,t,.03)};if(d){var h=l+i+100;h>a&&(a=h),y(d-.1)}return i?null:y},m=function(e,a,i,c,s,l){var d=0;i.forEach(function(t){d+=t[0],p(1e3*o+d+e,t[1],t[2],t[3])}),l&&function(e,o,a,r){clearTimeout(n);var i=Number(o.dataset.octaveStart),c=(Number(o.dataset.octaveCount),e);a.forEach(function(e){c+=e[0],u.push([c,e[1],!0]);var t=r?Math.min(e[3],200):e[3];u.push([c+t-1,e[1],!1])}),u=u.sort(function(e,t){return e[0]-t[0]});var s=function(){for(var e=[0,0,1,1,2,3,3,4,4,5,5,6],a=performance.now()-t;u.length>0&&a>=u[0][0];){var r=u[0],c=Math.floor(r[1]/12)-i,l=r[1]%12,d=e[l],f=o.childNodes[0].childNodes[7*c+d],p=f&&1354>>l&1?f.childNodes[0]:f;p&&p.classList.toggle("press",r[2]),u.shift()}u.length>0&&(n=setTimeout(s,u[0][0]-a))};s()}(e,l,i,s),0!=c&&(r=setTimeout(function(){m(e+c,a,i,c,s,l)},a+e+c-performance.now()-1e3))};setTimeout(function(){[].slice.call(document.getElementsByClassName("piano")).forEach(function(t){for(var o=Number(t.dataset.octaveCount),a=Number(t.dataset.heightScale),r="",n=0;n<7*o;n++)r+='<div class="piano-white-key">'+(f[n%7]?'<div class="piano-black-key"></div>':"")+"</div>";t.innerHTML='<div class="piano-keys">'+r+'</div><a href="https://www.onemotion.com/chord-player/" target="_blank">Created with Chord Player</a>',t.style.paddingBottom=30*a/o+"%";var i=function(t){t.preventDefault();var o=t.target,a=!1;if("piano-black-key"==o.className&&(o=o.parentNode,a=!0),"piano-white-key"==o.className){t.target.classList.add("press");for(var r=Number(o.parentNode.parentNode.dataset.octaveStart),n=o,u=0;n=n.previousElementSibling;u++);g();var c=p(0,12*Math.floor(u/7+r)+(a?f[u%7]:d[u%7]),127),s=function(e){t.target!=e.target&&(v(t),i(e)||(l.addEventListener("mousemove",s),l.addEventListener("mouseup",v)))},v=function(){t.target.classList.remove("press");var o=e.currentTime;c(o),l.removeEventListener("mouseup",v),l.removeEventListener("mousemove",s)};return l.addEventListener("mouseup",v),l.addEventListener("mousemove",s),!0}};t.addEventListener("mousedown",i)})},0);var g=function(){if(!e){l.AudioContext||(l.AudioContext=l.webkitAudioContext||l.mozAudioContext),l.AudioContext&&(AudioContext.prototype.createGain||(AudioContext.prototype.createGain=AudioContext.prototype.createGainNode)),l.AudioBufferSourceNode&&(AudioBufferSourceNode.prototype.start||(AudioBufferSourceNode.prototype.start=AudioBufferSourceNode.prototype.noteOn),AudioBufferSourceNode.prototype.stop||(AudioBufferSourceNode.prototype.stop=AudioBufferSourceNode.prototype.noteOff));try{e=new AudioContext}catch(e){throw alert("Error ("+e+")"),e}}};l.toggleMusic=function(d,f,p,v,y){var h,A=document.getElementById(f);if(function(t){clearTimeout(r),clearTimeout(n),clearTimeout(i),t.querySelectorAll(".press").forEach(function(e){e.classList.remove("press")}),e&&(e.close(),e=null)}(A),d==c){if(s=!s,(h=d.querySelector(".play-icon"))&&h.classList.toggle("playing",s),!s)return}else s=!0;c&&((h=c.querySelector(".play-icon"))&&h.classList.remove("playing"));c=d,(h=d.querySelector(".play-icon"))&&h.classList.toggle("playing",s),u=[],g(),o=e.currentTime,t=performance.now(),a=0,m(0,t,p,v,y,A),0==v&&(i=setTimeout(function(){l.toggleMusic(d,f)},a+500))}}();
</script>

<!-- Global player style -->
<style>
  .piano {
    border: solid 1px black;
    background: black;
    border-radius: .3vw;
    position: relative;
  }
  .piano-keys {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    cursor: pointer;
    border-radius: .3vw;
    overflow: hidden;
  }
  .piano-white-key {
    background: #EEE;
    border-left: solid 1px rgba(0,0,0,.5);
    box-shadow: inset .1vw 0 .1vw rgba(255,255,255,.2),inset -.1vw -.1vw .1vw rgba(0,0,0,.2);
    border-radius: 0 0 .2vw .2vw;
    margin-left: -1px;
    position: relative;
    flex: 1;
  }
  .piano-black-key {
    background: black;
    background-image: linear-gradient(to right bottom, transparent, rgba(255,255,255,.3));
    border: solid 1px rgba(0,0,0,.5);
    border-top: none;
    border-radius: 0 0 .2vw .2vw;
    height: 60%;
    left: 65%;
    right: -35%;
    box-sizing: border-box;
    position: absolute;
    z-index: 1;
  }
  .piano-black-key::after {
    content: ' ';
    position: absolute;
    width: 100%;
    height: 100%;
    border: solid;
    border-top: none;
    border-width: 0 .3vw .6vw .3vw;
    border-color: black rgba(0,0,0,.1) rgba(0,0,0,.2) rgba(255,255,255,.1);
    box-sizing: border-box;
  }
  .piano-white-key.press, .piano-black-key.press {
    background: red;
  }
  .piano a {
    font-family: Arial;
    color: black;
    position: absolute;
    text-decoration: none;
    right: 0;
    padding: 2px;
    z-index: 1;
    transition: opacity 1s ease-in;
    opacity: 0;
    font-size: 0;
  }
  .piano a::after {
    content: 'i';
    font-size: 11px;
    background: white;
    font-weight: bold;
    padding: 0 4px;
    border: solid 1px black;
    border-radius: 100%;
    margin-left: 5px;
    box-shadow: 0 0 3px rgba(0,0,0,.5);
  }
  .piano:hover a {
    opacity: 1;
  }
  .piano a:hover {
    font-size: 11px;
    background: white;
  }
  .play-icon {
    border-color: transparent transparent transparent black;
    border-style: solid;
    border-width: 5px 0 5px 10px;
    display: inline-block;
    box-sizing: border-box;
  }
  .play-icon.playing {
    border-color: black;
  }
</style>

<!-- Piano component -->
<div id="piano-1" class="piano" data-height-scale="1" data-octave-start="2" data-octave-count="5">
</div>

<br/>

<!-- Button with song data -->
<button onclick="toggleMusic(this, 'piano-1', %%1);">
  <span class="play-icon"></span> %%2
</button>`.replace("%%1", e).replace("%%2", 'Song title');
            et({
                title: 'Export HTML code',
                buttons: [{
                    name: 'OK'
                }],
                description: '<div class="control"><div class="label">' + 'A simplified organ that works standalone and has no external dependencies.' + "</div></div>",
                belowContent: '<div class="control" style="float: right;"><div class="label" style="margin-right: 0;"><a data-event="demoNewTab">' + 'Open in new tab' + '</a> </div></div><div class="control"><div class="label" style="font-weight: bold;">' + 'Demo' + '</div></div><iframe id="iframe" frameborder="0" style="border: solid 1px black; width: 100%; height: 80px; margin-bottom: 10px;"></iframe><div class="control"><div class="label" style="font-weight: bold;">' + 'Code' + " (" + Math.round(t.length / 1e3) + 'kb)</div></div><textarea readonly style="white-space: pre; width: 100%; height: 100px; font-size: 9px;"  onmouseup="this.select();">' + t.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</textarea>" + (navigator.clipboard ? '<div class="control" style="float: right;"><a class="label" style="margin-right: 0;" data-event="copyToClipboard">' + 'Copy to clipboard' + "</a></div>" : "")
            });
            let o = document.getElementById("iframe").contentWindow.document;
            o.open();
            let n = 1 / Number(J("app").dataset.scale);
            o.write('<body style="transform: scale(' + n + "," + n + '); margin: 10px; margin-right: 20px;">' + t + "</body>"),
            o.close(),
            W[H].copyToClipboard = function() {
                navigator.clipboard.writeText(t)
            }
            ,
            W[H].demoNewTab = function() {
                let e = window.open("about:blank", "_blank");
                e.document.write(t),
                e.document.close()
            }
        }
          , S = function() {
            o({
                onLoad: function(e) {
                    try {
                        let t = e.filename.replace(".json", "")
                          , o = JSON.parse(e.content)
                          , n = o.application || "";
                        if (-1 == n.indexOf("Chord-Player")) {
                            alert("Invalid JSON file" + (n ? " (" + n + ")" : ""));
                            return
                        }
                        o.name = t,
                        oH(o, {
                            reset: !0,
                            warn: !0
                        })
                    } catch (s) {
                        alert('Invalid JSON file')
                    }
                }
            })
        }
          , A = function() {
            let e = prompt('Enter project filename', r.name || tK());
            e && (r.name = e != tK() ? e : "",
            tO(),
            n(JSON.stringify(oj.collapse(r)), "text/json", e + ".json"))
        }
          , T = function() {
            let e = r.name || tK()
              , t = r.loopSequence && r.sequence.length > 0
              , o = function() {
                et({
                    title: 'Creating sound file' + '... <span id="export-progress"></span>',
                    buttons: [],
                    disableCancel: !window.OfflineAudioContext.prototype.suspend,
                    onCancel: function() {
                        l.stopOffline()
                    }
                }),
                l.startOffline({
                    duration: p.totalTime() + 3,
                    onProgress: function(e) {
                        J("export-progress").innerHTML = Math.round(100 * e) + "%"
                    },
                    onComplete: function(o) {
                        s(o.renderedBuffer, e + ".wav", t ? 3 : 0),
                        eo()
                    }
                }),
                p.captureSequence(),
                o9.reset(),
                l.current().context.startRendering(),
                r.name || e == tK() || (r.name = e)
            };
            et({
                title: 'Export WAV file',
                width: 400,
                description: 'Filename' + '<br/><input id="export-filename-input" type="text" style="width: 100%;" /><br/><br/><label><input id="export-loop-input" type="checkbox" /><span>' + 'Seamless loop' + "</span></label>",
                disableClickOutside: !0,
                notice: 'Sound is licensed under a Creative Commons license' + ' (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4</a>)',
                onBeforeSelect: function() {
                    return !!e || (alert('Empty fields'),
                    !1)
                },
                onSelect: function() {
                    o()
                }
            });
            let n = J("export-filename-input");
            n.value = e,
            n.onchange = function(t) {
                e = this.value
            }
            ,
            v && (n.focus(),
            n.select());
            let a = J("export-loop-input");
            a.checked = t,
            a.onchange = function(e) {
                t = this.checked
            }
            ,
            ("midi-out" == r.instrument || "midi-out" == r.bassInstrument || "midi-out" == r.melodyInstrument) && alert("Warning: Midi out will not generate any sound")
        }
          , P = function() {
            let t = JSON.stringify(oj.collapse(r))
              , o = function() {
                e({
                    url: "share_as_link.php",
                    contentType: "application/json",
                    content: t,
                    done: function(e) {
                        let t = document.location.href.split(/[?#]/)[0] + "#" + e.code;
                        et({
                            title: 'Share as link',
                            description: '<textarea readonly style="width: 100%; font-size: 16px;" onmouseup="this.select();">' + t + "</textarea>" + (navigator.clipboard ? '<div style="float: right;"><a data-event="copyToClipboard">' + 'Copy to clipboard' + "</a></div>" : ""),
                            buttons: [{
                                name: 'Close'
                            }]
                        }),
                        W[H].copyToClipboard = function() {
                            navigator.clipboard.writeText(t)
                        }
                    },
                    fail: function() {
                        eb('Server error, try again in a moment.')
                    }
                })
            };
            if (t.length > 1e5) {
                alert('Too large project to share');
                return
            }
            et({
                title: 'Share as link',
                description: 'This will store a copy of your current project to share online. Continue?',
                onSelect: function() {
                    o()
                }
            })
        }
          , E = function() {
            nQ.requireMember(function() {
                e_('Loading' + "..."),
                e({
                    url: "compositions.php",
                    done: function(t) {
                        if (ey(),
                        0 == t.compositions.length) {
                            alert("No compositions yet!");
                            return
                        }
                        let o = function(e) {
                            let o = []
                              , n = RegExp(e.replace(/([()\[\]\\.])/g, "\\$1").replace(/\s+/g, ".*?"), "i");
                            t.compositions.forEach(function(e, t) {
                                let s = (e.name.match(n) ? 10 : 0) + (e.description.match(n) ? 1 : 0);
                                0 != s && o.push({
                                    value: t,
                                    name: e.name,
                                    public: e.public,
                                    title: e.description,
                                    score: s
                                })
                            }),
                            o.sort( (e, t) => t.score - e.score),
                            s.updateOptions(o, o.length > 0 ? o[0].value : "")
                        }, n, s = et({
                            className: "dialog-load-project",
                            title: 'Open project online',
                            disableClickOutside: !0,
                            width: 500,
                            description: '<form><input id="dialog-search-field" autocomplete="off" placeholder="' + 'Search' + '" type="text" style="width: 100%;" /></form>',
                            belowContent: '<!--div class="control" style="float: right;"><a id="select-link" class="label">' + 'Delete multiple' + '</a></div--><div class="control"><a id="rename-link" class="label">' + 'Rename' + '</a></div><div class="control"><a id="toggle-rename" class="label">' + 'More' + '</a></div><div class="control more" style="float: right;"><a id="delete-link" class="label">' + 'Delete' + '</a></div><form id="load-form"></form>',
                            options: [],
                            formatOption: function(e) {
                                return '<span class="more right"><label><input name="select" type="checkbox" value="' + t.compositions[e.value].chord_composition_id + '" /><span></span></label></span><span class="right">' + (e.public ? 'Public'.substr(0, 3) : "") + "</span>" + e.name
                            },
                            optionsOneColumn: 1,
                            onChange: function(e) {},
                            onSelect: function(o) {
                                e({
                                    url: "load_composition.php?chord_composition_id=" + t.compositions[o].chord_composition_id,
                                    done: function(e) {
                                        oH(JSON.parse(e.composition.data), {
                                            reset: !0
                                        })
                                    }
                                })
                            }
                        });
                        o(""),
                        J("dialog-search-field").focus(),
                        J("dialog-search-field").onkeyup = function() {
                            o(this.value)
                        }
                        ,
                        J("dialog-search-field").parentNode.onsubmit = function() {
                            return s.currentValue() && s.selectOK(),
                            !1
                        }
                        ,
                        J("toggle-rename").onclick = function() {
                            J("dialog").classList.toggle("show-more"),
                            this.innerHTML = J("dialog").classList.contains("show-more") ? 'Less' : 'More'
                        }
                        ,
                        J("rename-link").onclick = function() {
                            let o = s.currentValue();
                            if (void 0 == o)
                                return;
                            let n = t.compositions[o]
                              , a = prompt('Enter new filename', n.name);
                            a && a != n.name && e({
                                url: "update_composition.php?chord_composition_id=" + n.chord_composition_id,
                                contentType: "application/x-www-form-urlencoded",
                                content: "name=" + encodeURIComponent(a),
                                done: function(e) {
                                    if (e.exists) {
                                        alert('File exists already!');
                                        return
                                    }
                                    E()
                                }
                            })
                        }
                        ,
                        J("delete-link").onclick = function() {
                            let o = Array.from(J("dialog").querySelectorAll('input[type="checkbox"][name="select"]:checked')).map(function(e) {
                                return e.value
                            })
                              , n = s.currentValue();
                            if (void 0 == n && 0 == o.length)
                                return;
                            let a = t.compositions[n];
                            confirm('Are you sure you want to delete %?'.replace("%", o.length > 0 ? o.length : '"' + a.name + '"')) && e({
                                url: "delete_composition.php?chord_composition_id=" + (o.length > 0 ? o.join(",") : a.chord_composition_id),
                                done: function(e) {
                                    E()
                                }
                            })
                        }
                        ,
                        n = J("load-form")
                    }
                })
            })
        }
          , L = function() {
            nQ.requireMember(function() {
                let t, o, n, s;
                o = r.name || tK(),
                n = '<form id="member-save-form" class="form-vertical"><div class="form-control"><label class="label">' + 'Name' + '</label><input name="name" type="text" onblur="if (this.value.length > 0) this.value = this.value[0].toUpperCase() + this.value.substr(1);" /></div><div class="form-control"><label class="label">' + 'Description' + '</label><textarea name="description" style="min-height: 100px;"></textarea></div><div class="form-control"><label><input name="public" type="checkbox" /><span>' + 'Public' + '</span></label></div><div class="form-control"><label><input name="free" type="checkbox" /><span>' + 'Free to use' + '</span></label></div><input name="data" type="hidden" /></form>',
                et({
                    title: 'Save project online',
                    disableClickOutside: !0,
                    description: n,
                    onBeforeSelect: function() {
                        if ("" == t.name.value)
                            return alert('Empty fields'),
                            !1;
                        if (t.public.checked && "midi-out" == r.instrument)
                            return alert('Please change to something else than MIDI-out for public projects'),
                            !1;
                        r.name = t.name.value,
                        r.description = t.description.value,
                        r.public = t.public.checked,
                        r.free = t.free.checked,
                        k.set("chordPlayer", JSON.stringify(r)),
                        t.data.value = JSON.stringify(oj.collapse(r));
                        let n = function(o) {
                            e({
                                url: "save_composition.php?force=" + (o ? 1 : 0),
                                form: t,
                                done: function(e) {
                                    if (e.exists) {
                                        confirm('A project with that name already exists. Overwrite?') && n(!0);
                                        return
                                    }
                                    eo(),
                                    tO(),
                                    setTimeout(function() {
                                        alert('The project is stored!')
                                    }, 0)
                                }
                            })
                        };
                        return n(t.name.value == o),
                        !1
                    }
                }),
                s = function() {
                    t.free.parentNode.style.display = t.public.checked ? "block" : "none"
                }
                ,
                (t = J("member-save-form")).onsubmit = function() {
                    return !1
                }
                ,
                t.name.value = o,
                t.description.value = r.description || "",
                t.public.checked = r.public,
                t.public.onchange = function() {
                    s()
                }
                ,
                t.free.checked = r.free,
                s()
            })
        }
          , I = function() {
            nQ.requireMember(function() {
                et({
                    title: 'Delete current project',
                    description: 'Are you sure you want to delete %?'.replace("%", '"' + r.name + '"'),
                    onSelect: function() {
                        e({
                            url: "delete_composition.php?name=" + encodeURIComponent(r.name),
                            done: function(e) {
                                alert("Project deleted!")
                            }
                        })
                    }
                })
            })
        }
          , N = function() {
            let e = [{
                name: 'Open project online',
                onSelect: function() {
                    E()
                }
            }, {
                name: 'Save project online',
                onSelect: function() {
                    L()
                }
            }, {
                name: 'Delete current project',
                onSelect: function() {
                    I()
                },
                disabled: !r.name
            }, ];
            nQ.hasCookie() && e.push({
                name: 'Log out',
                onSelect: function() {
                    nQ.logout(function() {
                        alert('Logged out!')
                    })
                }
            }),
            et({
                title: 'Member actions',
                buttons: e,
                verticalButtons: !0,
                onCancel: function() {
                    O()
                }
            })
        }
          , O = function() {
            p.stopSequence();
            let e = [{
                name: 'New project',
                onSelect: function() {
                    g()
                }
            }, {
                name: 'Open project file',
                onSelect: function() {
                    S()
                }
            }, {
                name: 'Save project file',
                onSelect: function() {
                    A()
                }
            }, {
                name: 'Share as link',
                onSelect: function() {
                    P()
                }
            }, {
                name: 'Import MIDI file (melody)',
                onSelect: function() {
                    b()
                }
            }, {
                name: 'Export MIDI file',
                onSelect: function() {
                    x()
                }
            }, {
                name: 'Export WAV file',
                onSelect: function() {
                    T()
                }
            }, {
                name: 'Export HTML code',
                onSelect: function() {
                    C()
                }
            }, {
                name: 'Member actions' + " &raquo;",
                onSelect: function() {
                    N()
                }
            }, ];
            et({
                title: 'Project menu',
                buttons: e,
                verticalButtons: !0
            })
        };
        J("sequence-file-menu").onclick = function() {
            O()
        }
        ;
        let M = function() {
            let e = w[r.style.timeSignature].beats
              , t = function(e) {
                let t = p.selectedBeatRange();
                r.melody.events.forEach(function(o, n) {
                    o[0] >= t[0] && o[0] < t[1] && e(o, n)
                })
            }
              , o = function() {
                p.setCursorPos(0, 99999)
            }
              , n = function() {
                let e = p.selectedBeatRange();
                eP.melodyClipboard = [],
                t(function(t) {
                    let o = t.slice();
                    o[0] -= e[0],
                    eP.melodyClipboard.push(o)
                })
            }
              , s = function() {
                n();
                let e = p.selectedBeatRange();
                r.melody.events = r.melody.events.filter(function(t) {
                    return t[0] < e[0] || t[0] >= e[1]
                }),
                o8("Cut melody")
            }
              , a = function() {
                let e = p.selectedBeatRange();
                eP.melodyClipboard.forEach(function(t) {
                    let o = t.slice();
                    o[0] += e[0],
                    r.melody.events.push(o)
                }),
                r.melody.events = r.melody.events.sort(function(e, t) {
                    return e[0] - t[0]
                }),
                o8("Pasted melody")
            }
              , i = function(o) {
                let n = prompt('Offset notes' + " (\xb1" + 'Bars'.toLowerCase() + ")", 0);
                if (null == n)
                    return;
                let s = Number(n);
                !isNaN(s) && (t(function(t) {
                    t[0] += s * e
                }),
                r.melody.events = r.melody.events.sort(function(e, t) {
                    return e[0] - t[0]
                }),
                o8("Moved melody " + s))
            }
              , l = function(e) {
                let o = prompt('Transpose notes', 0);
                if (null == o)
                    return;
                let n = Number(o);
                !isNaN(n) && (t(function(e) {
                    e[1] += n
                }),
                o8("Transposed melody " + n))
            }
              , c = function(e) {
                let o = prompt('Change note velocity' + " (%)", 100);
                if (null == o)
                    return;
                let n = Number(o);
                !isNaN(n) && (t(function(e) {
                    e[2] = Math.round(1e3 * Math.min(e[2] * n / 100, 3)) / 1e3
                }),
                o8("Change melody velocity " + n))
            }
              , d = function(e, o) {
                t(function(t, n) {
                    let s = Math.round(t[0] / e);
                    t[0] = Math.round(1e3 * (o ? Math.round(1.5 * s) / 1.5 * e : s * e)) / 1e3
                }),
                o8("Quantized melody")
            }
              , u = [];
            u.push({
                name: 'Select all',
                onSelect: function() {
                    o()
                }
            }),
            u.push({
                name: 'Cut notes',
                onSelect: function() {
                    s()
                }
            }),
            u.push({
                name: 'Copy notes',
                onSelect: function() {
                    n()
                }
            }),
            u.push({
                name: 'Paste notes',
                onSelect: function() {
                    a()
                },
                disabled: !eP.melodyClipboard
            }),
            u.push({
                name: 'Offset notes',
                onSelect: function() {
                    i()
                }
            }),
            u.push({
                name: 'Transpose notes',
                onSelect: function() {
                    l()
                }
            }),
            u.push({
                name: 'Change note velocity',
                onSelect: function() {
                    c()
                }
            }),
            u.push({
                name: 'Quantize notes' + " 1/" + 4 * e,
                onSelect: function() {
                    d(1 / 4, !1)
                }
            }),
            u.push(null, {
                name: 'Record last played notes' + (eP.playedMelodyEvents.length > 0 ? " (" + eP.playedMelodyEvents.length + ")" : ""),
                onSelect: function() {
                    r.melody.events = r.melody.events.concat(eP.playedMelodyEvents).sort(function(e, t) {
                        return e[0] - t[0]
                    }),
                    o8("Record last played notes"),
                    eP.playedMelodyEvents.length = 0
                },
                disabled: 0 == eP.playedMelodyEvents.length
            }),
            et({
                title: 'Edit melody',
                description: 'Applies to selected chord range',
                buttons: u,
                verticalButtons: !0
            })
        };
        W[H].showMelodyMenu = function() {
            p.stopSequence(),
            M()
        }
        ,
        W[G].clickPianoRoll = function(e, t) {
            let o = v
              , n = t.getBoundingClientRect()
              , s = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
              , a = setTimeout(function() {
                o = !0,
                o9.pressPianoRoll((s - n.y) / n.height)
            }, o ? 0 : 100);
            W[R].all = function(e) {
                let n = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
                if (!o) {
                    Math.abs(n - s) > 5 && clearTimeout(a);
                    return
                }
                let i = t.getBoundingClientRect();
                o9.pressPianoRoll((n - i.y) / i.height)
            }
            ,
            W[B].all = function(e) {
                o9.releasePianoRoll(),
                delete W[R].all,
                delete W[B].all
            }
        }
        ,
        J("piano-roll-container").onscroll = function(e) {
            o9.setPianoRollTime()
        }
        ,
        setTimeout(ny, 0),
        window.addEventListener("resize", function() {
            tO(),
            ny()
        }),
        e$.onChange = function() {
            ny()
        }
        ,
        n1("compose"),
        nA("palette"),
        n3({
            default: !0,
            halfZero: !0
        })
    };
    document.addEventListener("DOMContentLoaded", n5);
    let nE, nL, nI, nN, n4, nO, nM, n7, nq, n6, nD, nj, nG, nB, nR, nV, nH, n8, nK, nF, nU, nz, n9, nY;
    nD = 0,
    nG = function(e) {
        nM && J("explore-nav").querySelector('[data-value="' + nM + '"]').classList.remove("selected"),
        nM = e,
        J("explore-nav").querySelector('[data-value="' + nM + '"]').classList.add("selected")
    }
    ,
    W[H].exploreTab = function(e, t) {
        nG(t.dataset.value),
        nD = 0,
        n7 = void 0,
        J("explore-search").value = "",
        nH()
    }
    ,
    nB = function(e) {
        if (void 0 != n4) {
            let t = J("examples-table").querySelector('[data-index="' + n4 + '"] [data-event="playExample"]');
            t.parentNode.previousSibling.innerHTML = "",
            t.classList.remove("selected")
        }
        void 0 != e && J("examples-table").querySelector('[data-index="' + e + '"] [data-event="playExample"]').classList.add("selected"),
        n4 = e
    }
    ,
    nV = function() {
        return "compositions.php?" + ({
            exampleProjects: "examples=1",
            favProjects: "fav=1",
            memberProjects: "all=1",
            ownProjects: "own=1"
        })[nM] + (n7 ? "&member_id=" + n7 : "") + ("" != J("explore-search").value ? "&search=" + encodeURIComponent(J("explore-search").value) : "")
    }
    ,
    nH = function() {
        nF();
        let t = function() {
            let e = "";
            e += "<h2>" + (n7 ? nq : "") + "</h2>" + (n7 ? '<div class="compositions-table-filter"><a data-event="showAllCompositions">' + 'Show all' + "</a></div>" : "") + '<table class="compositions-table" id="examples-table"><tr><th>' + 'Name' + "</th><th>" + ("exampleProjects" == nM ? 'Artist' : "" + 'Member') + "</th><th>" + 'Chords' + "</th><th>" + ("exampleProjects" == nM ? "" : "&#x2605;") + "</th></tr>",
            n6.items.forEach(function(t, o) {
                let n = [];
                try {
                    let s = JSON.parse(t.data);
                    nU(s),
                    s.sequence.forEach(function(e) {
                        n.push(tj(e.chord, e.rootPos, e.bassPos, s.scaleKey, void 0, s.scale))
                    })
                } catch (a) {
                    setTimeout(function() {
                        throw a
                    }, 0)
                }
                let i = (n.length > 4 ? n.slice(0, 4).concat("...") : n).join(" ");
                e += '<tr data-index="' + o + '" title="' + (t.description || "").replace(/"/g, "&quot;") + '"><td>' + t.name + "</td><td>" + ("exampleProjects" == nM ? t.username : '<a data-event="filterMember">' + t.username + "</a>") + "</td><td>" + i + "</td><td>" + (t.likes || "") + '</td><td><div style="position: relative;"><div class="play-time"></div><div class="buttons buttons-horizontal buttons-small"><button data-event="playExample" data-index="' + o + '"><span class="icon-play"></span></button><button data-event="loadMenu" data-index="' + o + '">...</button></div></div></td></tr>'
            }),
            e += "</table>" + function(e) {
                let t = '<select class="items" data-event="changePage" style="text-align: right;">';
                for (let o = 0; o < e.pageCount; o++)
                    t += "<option" + (e.currentPage == o ? " selected" : "") + ">" + (o + 1) + "</option>";
                return t += "</select>",
                W[H].nextPage = function() {
                    nD++,
                    e.onChange()
                }
                ,
                W[H].prevPage = function() {
                    nD--,
                    e.onChange()
                }
                ,
                W[U].changePage = function(t, o) {
                    nD = Number(o.value) - 1,
                    e.onChange()
                }
                ,
                e.pageCount > 1 ? '<div class="compositions-table-page-nav"><div class="container control">' + (e.currentPage > 0 ? '<button class="button arrow" data-event="prevPage">&laquo;</button>' : "") + '<div class="label">' + t + " " + 'of' + " " + e.pageCount + "</div>" + (n6.more ? '<button class="button arrow" data-event="nextPage">&raquo;</button>' : "") + "</div></div>" : ""
            }({
                pageCount: nj,
                currentPage: nD,
                onChange: function() {
                    nH()
                }
            }),
            J("explore-examples").innerHTML = e
        };
        e_('Loading' + "..."),
        nR && nR.abort(),
        nR = e({
            url: nV() + "&limit=20&page=" + nD + ("memberProjects" == nM && J("explore-free").checked ? "&free=1" : ""),
            method: "exampleProjects" == nM ? "GET" : "POST",
            done: function(e) {
                ey(),
                void 0 != (n6 = e.items ? e : {
                    items: e
                }).count && (nj = Math.ceil(n6.count / 20)),
                setTimeout(t, 0)
            }
        }),
        X(J("explore-randomize").style, "display", "memberProjects" != nM || nQ.hasCookie() ? "block" : "none"),
        X(J("explore-free").parentNode.style, "display", "memberProjects" == nM ? "block" : "none")
    }
    ,
    W[H].filterMember = function(e, t) {
        let o = Number(t.closest("tr").dataset.index)
          , n = n6.items[o];
        n7 = n.member_id,
        nq = n.username,
        nD = 0,
        J("explore-search").value = "",
        nH()
    }
    ,
    W[H].showAllCompositions = function() {
        n7 = void 0,
        nD = 0,
        J("explore-search").value = "",
        nH()
    }
    ,
    n8 = {},
    nK = function() {
        nF();
        let t = "memberProjects" == nM || "favProjects" == nM
          , o = nV() + (t ? "&free=1" : "") + "&limit=20&random=1";
        n8[o] || (n8[o] = []);
        let n = function() {
            let e = n8[o].pop()
              , n = n8[o].pop();
            if (!n)
                return;
            let s = JSON.parse(e.data);
            nU(s);
            let a = JSON.parse(n.data);
            nU(a),
            nz(s, "chords", a);
            let i = t5(a.scaleKey) - t5(s.scaleKey);
            r.style.chord.octaveOffset += i,
            r.style.bass.octaveOffset += i,
            r.melody.events.length = 0;
            let l = 'Chords from' + ": " + e.name + ", " + e.username + "\n" + 'Style from' + ": " + n.name + ", " + n.username + "\n";
            r.name = "Mix " + e.name + " vs " + n.name,
            r.description = l,
            oH(r, {
                silent: !0
            }).then( () => {
                p.startSequence()
            }
            ),
            et({
                title: 'Mix',
                width: 500,
                description: '<div style="font-size: 11px;">' + l.replace(/\n/g, "<br/>") + (t ? '<div style="margin-top: 5px; font-weight: bold;">' + 'Free to use' + "</div>" : "") + "</div>",
                buttons: [{
                    name: 'Load mix',
                    onSelect: function() {
                        n9("Load mix")
                    }
                }, {
                    name: 'Try again',
                    onSelect: function() {
                        nK()
                    }
                }, ],
                verticalButtons: !0,
                onBeforeClose: function() {
                    p.stopSequence()
                }
            })
        };
        n8[o].length < 2 ? e({
            url: o,
            method: "POST",
            done: function(e) {
                n8[o] = e.items,
                e.items.length >= 2 ? n() : alert('No free content to mix!')
            }
        }) : n()
    }
    ,
    nF = function() {
        clearTimeout(nO),
        nB(void 0),
        p.stopSequence()
    }
    ,
    nU = function(e) {
        oG(e),
        nN && "exampleProjects" == nM && (e.instrument = nN.instrument,
        e.bassInstrument = nN.bassInstrument,
        e.melodyInstrument = nN.melodyInstrument,
        e.effectType = nN.effectType,
        e.effectAmount = nN.effectAmount,
        e.effectEcho = nN.effectEcho)
    }
    ,
    W[H].playExample = function(e, t) {
        let o = Number(t.dataset.index);
        if (n4 == o) {
            nF();
            return
        }
        nF();
        let n = n6.items[o]
          , s = JSON.parse(n.data);
        n.member_id || nU(s),
        o9.press("chord", 32, .001),
        o9.release("chord", 32);
        let a = function() {
            if (n4 != o)
                return;
            p.startSequence();
            let e = performance.now()
              , n = p.totalTime()
              , s = function() {
                let o = (performance.now() - e) / 1e3
                  , s = Math.round(Math.max(n - (r.loopSequence && n > 0 ? o % n : o), 0))
                  , a = s % 60;
                t.parentNode.previousSibling.innerHTML = Math.floor(s / 60) + ":" + (a < 10 ? "0" : "") + a
            };
            s(),
            nO = setInterval(s, 1e3)
        };
        nB(o),
        oH(s, {
            silent: !0
        }).then(a),
        t$()
    }
    ,
    nz = function(e, t, o) {
        o || (o = nN);
        let n = JSON.parse(JSON.stringify(o));
        t && "chords" != t || (n = Object.assign(n, {
            sequence: e.sequence,
            scale: e.scale,
            scaleKey: e.scaleKey,
            manualChordPositions: e.manualChordPositions,
            loopSequence: e.loopSequence,
            melody: e.melody
        })),
        t && "style" != t || (n = Object.assign(n, {
            style: e.style
        }),
        "memberProjects" != nM || (n.instrument = e.instrument,
        n.bassInstrument = e.bassInstrument,
        n.melodyInstrument = e.melodyInstrument,
        n.effectAmount = e.effectAmount,
        n.effectEcho = e.effectEcho,
        n.effectType = e.effectType)),
        "chords" == t && nv(n, e),
        "style" == t && nv(n, o),
        r = n
    }
    ,
    n9 = function(e) {
        nN = r,
        eP.currentMode = te.get(r.scale).offset,
        eP.transpose = 0,
        n1("compose"),
        nA("palette"),
        oX(),
        oB(),
        o8(e),
        ou(),
        tO(),
        oS(),
        p.setCursorPos(0),
        p.hideChordProps()
    }
    ,
    nY = function(t) {
        if (!nQ.hasCookie()) {
            nQ.requireMember(function() {});
            return
        }
        e({
            url: "like.php?chord_composition_id=" + t.chord_composition_id + "&set=" + (t.liked ? 0 : 1),
            done: function(e) {
                nH()
            }
        })
    }
    ,
    W[H].loadMenu = function(e, t) {
        let o = Number(t.dataset.index)
          , n = n6.items[o]
          , s = JSON.parse(n.data);
        nU(s);
        let a = (n.timestamp ? '<div style="font-size: 10px; margin-top: 5px;">' + n.timestamp.substr(0, 10) + "</div>" : "") + (n.free ? '<div style="font-size: 10px; margin-top: 5px; font-weight: bold;">' + 'Free to use' + "</div>" : "") + (n.like_list && nQ.hasCookie() ? '<div style="font-size: 10px; margin-top: 5px;">' + 'Liked by' + " " + n.like_list.split("|").join(", ") + "</div>" : "");
        et({
            title: n.name,
            description: (n.description || "").replace(/http[^\s]+/g, e => '<a target="_blank" href="' + e + '">' + e + "</a>") + (a ? '<div style="margin-top: 5px;">' + a + "</div>" : ""),
            buttons: [{
                name: 'Open project',
                onSelect: function() {
                    if (n.member_id) {
                        if (!nQ.hasCookie()) {
                            nQ.requireMember(function() {});
                            return
                        }
                        oH(JSON.parse(n.data))
                    } else
                        nz(s),
                        r.name = "",
                        r.description = "";
                    n9("Open project " + n.name)
                }
            }, {
                name: 'Import only style',
                onSelect: function() {
                    if (n.member_id && !nQ.hasCookie()) {
                        nQ.requireMember(function() {});
                        return
                    }
                    nz(s, "style"),
                    n9("Import only style " + n.name)
                }
            }, {
                name: 'Import only chords',
                onSelect: function() {
                    if (n.member_id && !nQ.hasCookie()) {
                        nQ.requireMember(function() {});
                        return
                    }
                    nz(s, "chords"),
                    n9("Import only chords " + n.name)
                }
            }, {
                name: n.member_id ? n.liked ? 'Undo like project' : 'Like project' : null,
                onSelect: function() {
                    nY(n)
                },
                disabled: n.own
            }],
            verticalButtons: !0,
            notice: n.public ? '<input style="width: 100%;" type="text" onmouseup="this.select();" value="' + document.location.href.split(/[?#]/)[0] + "#" + n.chord_composition_id + '" />' : ""
        })
    }
    ,
    nE = function() {
        nG("exampleProjects"),
        nH(),
        J("explore-randomize").onclick = function() {
            nK()
        }
        ,
        J("explore-free").onchange = function() {
            nD = 0,
            nH()
        }
        ;
        let e, t;
        J("explore-search").onkeyup = function(o) {
            let n = o.target.value;
            n != t && (clearTimeout(e),
            e = setTimeout(function() {
                t = n,
                nH()
            }, "Enter" == o.code ? 0 : 1e3))
        }
    }
    ,
    nL = function() {
        p.stopSequence(),
        nN = JSON.parse(JSON.stringify(r)),
        J("share-box").classList.add("explore"),
        J("explore-nav").querySelectorAll(".member-button").forEach(function(e) {
            e.disabled = nQ.hasCookie() ? "" : "disabled"
        }),
        nH()
    }
    ,
    nI = function() {
        nF(),
        JSON.stringify(r) != JSON.stringify(nN) && (oH(nN, {
            silent: !0
        }),
        tO()),
        J("share-box").classList.remove("explore")
    }
    ;
    var nQ = {};
    nQ.formatUsername = function(e) {
        return e[0].toUpperCase() + e.substr(1)
    }
    ,
    nQ.formatUsernameS = function(e) {
        return nQ.formatUsername(e) + ("s" == e.substr(-1).toLowerCase() ? "" : "s")
    }
    ,
    nQ.createLoginForm = function(t) {
        var o = `
      <form id="login-form" onsubmit="return false;">
        <div class="form-control">
          <label class="label">${'Username or email'}</label>
          <input id="login-form-email" type="text" name="email" />
        </div>
        <div class="form-control">
          <label class="label">${'Password'}</label>
          <input type="password" name="password" />
        </div>
        <div class="form-control">
          <label class="label">&nbsp;</label>
          <label><input type="checkbox" name="remember" /><span>${'Remember me'}</span></label>
        </div>
        <div>
        <div class="buttons buttons-horizontal"><input type="submit" class="button" value="${'Login'}" /></div>
        </div>
      </form>
    `
          , n = document.createElement("div");
        n.innerHTML = o;
        var s = n.querySelector("form")
          , a = function() {
            return e({
                url: "../member/login_post.php",
                form: s,
                done: function(e) {
                    e.required_fields && alert('Empty fields'),
                    e.failed && alert('Wrong email or password'),
                    e.member_id && t(e)
                }
            }),
            !1
        };
        return s.onsubmit = a,
        setTimeout(function() {
            s.email.focus()
        }, 100),
        n
    }
    ,
    nQ.createRegisterForm = function(t) {
        var o = `
      <form id="register-form">
        <div class="form-control">
          <label class="label">${'Username'}</label>
          <input type="text" name="username" />
        </div>
        <div class="form-control">
          <label class="label">${'Email'}</label>
          <input type="text" name="email" />
        </div>
        <div class="form-control">
          <label class="label">${'Password'}</label>
          <input type="password" name="password" />
        </div>
        <div class="form-control">
          <label class="label">${'Repeat password'}</label>
          <input type="password" name="password_again" />
        </div>
        <div class="form-control">
          <label><input type="checkbox" name="accept_policy" /><span>${'I accept the % policy'.replace("%", '<a href="/terms-and-privacy/" target="_blank">Terms & Privacy</a>')}</span></label>
        </div>
        <br/>
        <div>
          <div class="buttons buttons-horizontal">
            <input type="submit" class="button" value="${'Sign up'}" />
          </div>
        </div>
      </form>
    `
          , n = document.createElement("div");
        n.innerHTML = o;
        var s = n.querySelector("form")
          , a = function() {
            return s.password.value != s.password_again.value ? (alert('Passwords does not match'),
            !1) : s.accept_policy.checked ? (e({
                url: "../member/register_post.php",
                form: s,
                done: function(e) {
                    e.required_fields && alert('Empty fields'),
                    e.invalid_email && alert('Invalid email'),
                    e.invalid_username && alert('Invalid username (only a-z, numbers and underscore allowed)'),
                    e.username_exists && alert('Username is already taken'),
                    e.email_exists && alert('Email is already registered'),
                    e.member_id && t(e)
                }
            }),
            !1) : (alert('You must accept the policy to continue'),
            !1)
        };
        return s.onsubmit = a,
        setTimeout(function() {
            s.username.focus()
        }, 100),
        n
    }
    ,
    nQ.hasCookie = function() {
        return document.cookie.match(/(?:member_md5|member_on)=/)
    }
    ,
    nQ.checkStatus = function(t) {
        if (!nQ.hasCookie()) {
            t({});
            return
        }
        e({
            url: "../member/status.php",
            done: function(e) {
                t(e)
            },
            fail: function() {
                t({})
            }
        })
    }
    ,
    nQ.logout = function(e) {
        var t = new XMLHttpRequest;
        t.open("POST", "../member/logout.php", !0),
        t.onload = function() {
            try {
                var t = JSON.parse(this.responseText);
                document.cookie = "member_md5=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;",
                e(t)
            } catch (o) {
                alert(o),
                e(null)
            }
        }
        ,
        t.onerror = function() {
            e(null)
        }
        ,
        t.send()
    }
    ,
    nQ.showLoginDialog = function(e) {
        et({
            title: 'Member login',
            description: '<div id="login-form"></div>',
            buttons: []
        });
        var t = function(t) {
            eo(),
            e && e()
        };
        J("login-form").appendChild(nQ.createLoginForm(t))
    }
    ,
    nQ.showRegisterDialog = function(e) {
        et({
            title: 'Member sign up',
            description: '<div id="register-form"></div>',
            buttons: []
        });
        var t = function(t) {
            eo(),
            alert('You are now signed up and can login' + "!"),
            nQ.showLoginDialog(e)
        };
        J("register-form").appendChild(nQ.createRegisterForm(t))
    }
    ,
    nQ.requireMember = function(e) {
        e_('Loading' + "..."),
        nQ.checkStatus(function(t) {
            if (ey(),
            t.username) {
                e();
                return
            }
            et({
                title: 'This is a member feature',
                buttons: [{
                    name: 'Login',
                    onSelect: function() {
                        nQ.showLoginDialog(e)
                    }
                }, {
                    name: 'Sign up',
                    onSelect: function() {
                        nQ.showRegisterDialog(e)
                    }
                }, ]
            })
        })
    }
}();
