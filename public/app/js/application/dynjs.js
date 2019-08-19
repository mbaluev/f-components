//http://slawutich.pp.ua/javascript/47-dynjs.html динамическая подгрузка css/js
dynjs =
    {
        type: { js: "js", css: "css", csstxt: "csstxt" },
        load: function (url_, type_, async_) {
            if (typeof (type_) == "undefined") {
                type_ = dynjs.type.js;
            }

            var is_exist = false;
            var tag = type_ == dynjs.type.js ? "script" : type_ == dynjs.type.css ? "link" : "style";
            var objects = document.getElementsByTagName(tag);
            var src = type_ == dynjs.type.js ? "src" : "href";
            for (var i = 0; i < objects.length; i++) {
                var elem = objects[i];
                if (elem.getAttribute(src) == url_) {
                    is_exist = true;
                }
            }
            if (is_exist) {
                return;
            }
            var _elem = document.createElement(tag);
            var type = type_ == dynjs.type.js ? "text/javascript" : "text/css";

            _elem.setAttribute("type", type);
            _elem.setAttribute(src, url_);

            if (type_ == dynjs.type.css) {
                _elem.setAttribute("rel", "Stylesheet");
            }
            if (type_ == dynjs.type.csstxt) {
                if (typeof (_elem.styleSheet) != "undefined") {
                    _elem.styleSheet.cssText = url_;
                }
                else if (typeof (_elem.innerText) != "undefined") {
                    _elem.innerText = url_;
                }
                else {
                    _elem.innerHTML = url_;
                }
            }

            if (type_ == dynjs.type.js && async_ !== undefined) {
                _elem.async = !!async_;
            }
            document.getElementsByTagName("head")[0].appendChild(_elem);
        }
    };