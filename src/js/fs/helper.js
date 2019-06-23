/* created by mbaluev at 2018 */
if (typeof fUrl === 'undefined') {
    fUrl = {};
}
if (typeof fUrl.parseHash !== 'function') {
    fUrl.parseHash = function(index){
        var hash = location.hash.substring(1, location.hash.length);
        var hashObj = [];
        hash.split('&').forEach(function(q){
            hashObj.push(q);
        });
        return (typeof index == 'number' ? hashObj[index] : hashObj);
    };
}

if (typeof fCookie === 'undefined') {
    fCookie = {};
}
if (typeof fCookie.get !== 'function') {
    fCookie.get = function(name, ispage){
        if (ispage) {
            return fCookie.get(window.location.pathname + name);
        } else {
            var cookie = " " + document.cookie;
            var search = " " + name + "=";
            var setStr = null;
            var offset = 0;
            var end = 0;
            if (cookie.length > 0) {
                offset = cookie.indexOf(search);
                if (offset != -1) {
                    offset += search.length;
                    end = cookie.indexOf(";", offset);
                    if (end == -1) {
                        end = cookie.length;
                    }
                    setStr = unescape(cookie.substring(offset, end));
                }
            }
            return (setStr);
        }
    };
}
if (typeof fCookie.set !== 'function') {
    fCookie.set = function(name, value, expires, path, domain, secure, ispage){
        if (ispage) {
            fCookie.set(window.location.pathname + name, value, expires);
        } else {
            document.cookie = name + "=" + escape(value) +
                ((expires) ? "; expires=" + expires : "") +
                ((path) ? "; path=" + path : "") +
                ((domain) ? "; domain=" + domain : "") +
                ((secure) ? "; secure" : "");
        }
    };
}
if (typeof fCookie.remove !== 'function') {
    fCookie.remove = function(name) {
        fCookie.set(name, "", -1);
    }
}

if (typeof fConvert === 'undefined') {
    fConvert = {};
}
if (typeof fConvert.getEmSize === 'undefined') {
    fConvert.getEmSize = function(element) {
        if (!element) {
            element = document.documentElement;
        }
        var fontSize = window.getComputedStyle(element, null).fontSize;
        return parseFloat(fontSize) || 16;
    };
}
if (typeof fConvert.toPx === 'undefined') {
    fConvert.toPx = function(element, value) {
        var numbers = value.split(/\d/);
        var units = numbers[numbers.length - 1];
        value = parseFloat(value);
        switch (units) {
            case "px":
                return value;
            case "em":
                return value * fConvert.getEmSize(element);
            case "rem":
                return value * fConvert.getEmSize();
            case "vw":
                return value * document.documentElement.clientWidth / 100;
            case "vh":
                return value * document.documentElement.clientHeight / 100;
            case "vmin":
            case "vmax":
                var vw = document.documentElement.clientWidth / 100;
                var vh = document.documentElement.clientHeight / 100;
                var chooser = Math[units === "vmin" ? "min" : "max"];
                return value * chooser(vw, vh);
            default:
                return value;
        }
    };
}
if (typeof fConvert.css_time_to_milliseconds === 'undefined') {
    fConvert.css_time_to_milliseconds = function(time_string) {
        var num = parseFloat(time_string, 10),
            unit = time_string.match(/m?s/),
            milliseconds;
        if (unit) {
            unit = unit[0];
        }
        switch (unit) {
            case "s": // seconds
                milliseconds = num * 1000;
                break;
            case "ms": // milliseconds
                milliseconds = num;
                break;
            default:
                milliseconds = 0;
                break;
        }
        return milliseconds;
    };
}
