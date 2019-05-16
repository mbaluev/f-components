(function($){
    var methods = {
        activate : function() {
            return this.each(function() {
                $(this).find('[data-toggle="f-ellipsis"]')
                    .addBack('[data-toggle="f-ellipsis"]').fEllipsis();
            });
        },
        init : function(options) {
            return this.each(function(){
                var self = $(this), data = self.data('_f');
                if (!data) {
                    self.data('_f', 'ellipsis');
                    var that = this.obj = {};
                    that.defaults = {
                        height: 32
                    };
                    that.data = self.data();
                    that.options = $.extend(true, {}, that.defaults, that.data, options);

                    /* save widget options to self.data */
                    self.data(that.options);

                    that.init = function(){
                        self.dotdotdot({ height: that.data.height });
                        $(window).on('resize', function(){
                            self.dotdotdot({ height: that.data.height });
                        });
                    };
                    that.init();
                }
                return this;
            });
        }
    };
    $.fn.fEllipsis = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on $.fEllipsis' );
        }
    };
})( jQuery );

// $('body').fEllipsis('activate')

$.fn.bindFirst = function(name, selector, data, handler) {
    this.on(name, selector, data, handler);
    this.each(function() {
        var handlers = $._data(this, 'events')[name.split('.')[0]];
        var handler = handlers.pop();
        handlers.splice(0, 0, handler);
    });
};
$.fn.closestChild = function(selector) {
    var $found = $(),
        $currentSet = this;
    while ($currentSet.length) {
        $found = $currentSet.filter(selector);
        if ($found.length) break;
        $currentSet = $currentSet.children();
    }
    return $found.first();
};
$.fn.closestChildren = function(selector) {
    var $found = $(),
        $currentSet = this;
    while ($currentSet.length) {
        $found = $currentSet.filter(selector);
        if ($found.length) break;
        $currentSet = $currentSet.children();
    }
    return $found;
};
if (typeof fUrl == 'undefined') {
    fUrl = {};
}
if (typeof fUrl.parseHash != 'function') {
    fUrl.parseHash = function(index){
        var hash = location.hash.substring(1, location.hash.length);
        var hashObj = [];
        hash.split('&').forEach(function(q){
            hashObj.push(q);
        });
        return (typeof index == 'number' ? hashObj[index] : hashObj);
    };
}

if (typeof fCookie == 'undefined') {
    fCookie = {};
}
if (typeof fCookie.get != 'function') {
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
if (typeof fCookie.set != 'function') {
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
if (typeof fCookie.remove != 'function') {
    fCookie.remove = function(name) {
        fCookie.set(name, "", -1);
    }
}

if (typeof fConvert == 'undefined') {
    fConvert = {};
}
if (typeof fConvert.getEmSize == 'undefined') {
    fConvert.getEmSize = function(element) {
        if (!element) {
            element = document.documentElement;
        }
        var fontSize = window.getComputedStyle(element, null).fontSize;
        return parseFloat(fontSize) || 16;
    };
}
if (typeof fConvert.toPx == 'undefined') {
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

(function($){
    var methods = {
        activate : function() {
            return this.each(function() {
                $(this).find('[data-toggle="f-menu"]')
                    .addBack('[data-toggle="f-menu"]').fMenu();
            });
        },
        init : function(options) {
            return this.each(function(){
                var self = $(this), data = self.data('_f');
                if (!data) {
                    self.data('_f', 'menu');
                    var that = this.obj = {};
                    that.defaults = {
                        target: null,
                        hidden: true,
                        backdrop: false
                    };
                    that.data = self.data();
                    that.options = $.extend(true, {}, that.defaults, that.data, options);
                    that.data._initiated = false;
                    that.data._source = {
                        source: self,
                        source_arrow: self.find('.f-icon_animate')
                    };
                    that.data._twins = {
                        twins: null,
                        twins_icons: null
                    };
                    that.data._triggers = {
                        show: 'show.fMenu',
                        shown: 'shown.fMenu',
                        hide: 'hide.fMenu',
                        hidden: 'hidden.fMenu'
                    };
                    that.data._cookieHidden = that.data.target.replace('=','_') + '.hidden';
                    that.data._el = {
                        menu__backdrop: $('<div class="f-menu__backdrop"></div>')
                    };

                    /* save widget options to self.data */
                    self.data(that.options);

                    that.hide = function(){
                        $(that.data.target).addClass('f-menu_animation');
                        that.hide_raw();
                        that.set_cookie(true);
                        if ($(that.data.target).css('transition-duration') != '0s' &&
                            $(that.data.target).css('transition-duration') != '') {
                            setTimeout(that.hide_finish, that.css_time_to_milliseconds($(that.data.target).css('transition-duration')));
                        }
                    };
                    that.hide_raw = function(){
                        self.trigger(that.data._triggers.hide, that);
                        $('.f-application')
                            .addClass('f-' + $(that.data.target).data('id') + '_hidden')
                            .removeClass('f-' + $(that.data.target).data('id') + '_shown');
                        $(that.data.target).addClass('f-menu_hide');
                        $(that.data.target).removeClass('f-menu_opened');
                        that.data._twins.twins_icons.removeClass('f-icon_rotate_180deg');
                        if ($(that.data.target).css('transition-duration') == '0s' ||
                            $(that.data.target).css('transition-duration') == '') {
                            that.hide_finish();
                        }
                    };
                    that.hide_finish = function() {
                        $(that.data.target).removeClass('f-menu_animation');
                        $(that.data.target).removeClass('f-menu_hide');
                        $(that.data.target).addClass('f-menu_hidden');
                        $(that.data.target).data('hidden', true);
                        self.trigger(that.data._triggers.hidden, that);
                        $(window).trigger('resize');
                    };
                    that.show = function(){
                        $(that.data.target).addClass('f-menu_animation');
                        that.show_raw();
                        that.set_cookie(false);
                        if ($(that.data.target).css('transition-duration') != '0s' &&
                            $(that.data.target).css('transition-duration') != '') {
                            setTimeout(that.show_finish, that.css_time_to_milliseconds($(that.data.target).css('transition-duration')));
                        }
                    };
                    that.show_raw = function(){
                        self.trigger(that.data._triggers.show, that);
                        $('.f-application')
                            .removeClass('f-' + $(that.data.target).data('id') + '_hidden')
                            .addClass('f-' + $(that.data.target).data('id') + '_shown');
                        $(that.data.target).addClass('f-menu_open');
                        $(that.data.target).removeClass('f-menu_hidden');
                        that.data._twins.twins_icons.addClass('f-icon_rotate_180deg');
                        if ($(that.data.target).css('transition-duration') == '0s' ||
                            $(that.data.target).css('transition-duration') == '') {
                            that.show_finish();
                        }
                    };
                    that.show_finish = function(){
                        $(that.data.target).removeClass('f-menu_animation');
                        $(that.data.target).removeClass('f-menu_open');
                        $(that.data.target).addClass('f-menu_opened');
                        $(that.data.target).data('hidden', false);
                        self.trigger(that.data._triggers.shown, that);
                        $(window).trigger('resize');
                    };
                    that.toggle = function(){
                        if ($(that.data.target).data('hidden')) {
                            that.show();
                        } else {
                            that.hide();
                        }
                    };
                    that.toggle_raw = function(){
                        if (that.data.hidden) {
                            that.hide_raw();
                        } else {
                            that.show_raw();
                        }
                    };

                    that.bind = function(){
                        self.on('click', that.toggle);
                        if (that.data.backdrop) {
                            that.data._el.menu__backdrop.on('click', that.toggle);
                        }
                    };
                    that.css_time_to_milliseconds = function(time_string) {
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

                    that.get_twins = function(){
                        that.data._twins.twins = $('[data-toggle="f-menu"][data-target="' + that.data.target + '"]');
                        that.data._twins.twins_icons = that.data._twins.twins.find('.f-icon_animate');
                    };
                    that.get_cookie = function(){
                        if (fCookie.get(that.data._cookieHidden) != null &&
                            typeof fCookie.get(that.data._cookieHidden) != 'undefined') {
                            if (fCookie.get(that.data._cookieHidden) == 'true') {
                                that.data.hidden = true;
                            }
                            if (fCookie.get(that.data._cookieHidden) == 'false') {
                                that.data.hidden = false;
                            }
                        }
                    };
                    that.set_cookie = function(value){
                        fCookie.set(that.data._cookieHidden, value);
                    };

                    that.init_menu = function(){
                        if (that.data.backdrop) {
                            $(that.data.target).after(that.data._el.menu__backdrop);
                        }
                        that.get_twins();
                        that.get_cookie();
                        that.toggle_raw();
                        that.bind();
                    };
                    that.init_mobile = function(){
                        if (typeof kendo != 'undefined') {
                            if (typeof kendo.support.mobileOS == 'object') {
                                that.data.hidden = true;
                            }
                        }
                    };
                    that.init = function(){
                        that.init_mobile();
                        that.init_menu();
                    };
                    that.init();
                }
                return this;
            });
        },
        hide : function() {
            return this.each(function() {
                this.obj.hide();
            });
        },
        show : function() {
            return this.each(function() {
                this.obj.show();
            });
        }
    };
    $.fn.fMenu = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on $.fMenu' );
        }
    };
})( jQuery );

// $('body').fMenu('activate')

(function($){
    var methods = {
        activate : function() {
            return this.each(function() {
                $(this).find('[data-toggle="f-popup"]')
                    .addBack('[data-toggle="f-popup"]').on('click mouseover', function(e) {
                    if (!$(this).data('trigger')) {
                        $(this).data('trigger', 'click');
                    }
                    if (typeof kendo.support.mobileOS == 'object') {
                        $(this).data('trigger', 'click');
                    }
                    if (e.type == $(this).data('trigger')) {
                        $(e.currentTarget).fPopup(e.data);
                    }
                });
            });
        },
        init : function(options) {
            return this.each(function(){
                var self = $(this), data = self.data('_f');
                if (!data) {
                    var that = this.obj = {};
                    that.defaults = {
                        trigger: 'click',
                        target: null,
                        position: 'bottom left',
                        place: 'body', // [source, body]
                        animation: true,
                        width: 'auto',
                        height: 'auto',
                        offset: [0,0],
                        arrow: true
                    };
                    that.data = self.data();
                    that.options = $.extend(true, {}, that.defaults, that.data, options);
                    that.data._inFocus = false;
                    that.data._visible = false;
                    that.data._initiated = false;
                    that.data._source = {
                        source: self,
                        source_arrow: self.find('.f-icon_animate')
                    };
                    that.data._popup = {
                        popup: $('<div class="f-popup"></div>'),
                        popup__arrow: $('<div class="f-popup__arrow"></div>'),
                        popup_position: null
                    };
                    that.data._triggers = {
                        show: 'show.fsPopup',
                        shown: 'shown.fsPopup',
                        hide: 'hide.fsPopup',
                        hidden: 'hidden.fsPopup'
                    };

                    /* save widget options to self.data */
                    self.data(that.options);

                    that.remove = function(){
                        that.data._popup.popup.remove();
                    };
                    that.render = function(){
                        $('body').append(
                            that.data._popup.popup.empty().append(
                                (that.data.arrow ? that.data._popup.popup__arrow : null),
                                $(self.data('target')).clone().removeClass('f-menu_popup_hidden')
                            )
                        );
                        that.bind_popup();
                    };

                    that.hide = function(){
                        self.trigger(that.data._triggers.hide, that);
                        that.remove();
                        that.data._visible = false;
                        that.data._inFocus = false;
                        if (typeof that.data._source.source_arrow[0] != 'undefined') {
                            that.data._source.source_arrow.removeClass('f-icon_rotate_180deg');
                        }
                        self.trigger(that.data._triggers.hidden, that);
                    };
                    that.show = function(){
                        self.trigger(that.data._triggers.show, that);
                        that.render();
                        if (that.data.animation) {
                            that.data._popup.popup.addClass('f-popup_animation');
                        }
                        that.set_width(that.data.width);
                        that.set_position(that.data.position);
                        that.data._popup.popup__arrow.addClass('f-popup__arrow_' + that.data._popup.popup_position);
                        that.data._visible = true;
                        that.data._inFocus = false;
                        // trigger shown
                        that.data._popup.popup.one('oanimationend animationend webkitAnimationEnd', function(e){
                            $(this).off(e);
                            self.trigger(that.data._triggers.shown, that);
                        });
                        that.data._popup.popup.addClass('f-popup_visible_' + that.data.position.split(' ')[0]);
                        if (typeof that.data._source.source_arrow[0] != 'undefined') {
                            that.data._source.source_arrow.addClass('f-icon_rotate_180deg');
                        }
                    };

                    that.focus = function(e){
                        that.data._inFocus = true;
                    };
                    that.exit = function(e){
                        if (!that.data._inFocus && that.data._visible) {
                            that.hide();
                        }
                        that.data._inFocus = false;
                    };

                    that.bind = function(){
                        if (that.data.trigger == 'click') {
                            $('body').on('mouseup.popup.body touchend.popup.body', that.exit);
                            that.data._source.source.on('mouseup.popup.source touchend.popup.source', that.focus);
                        }
                        if (that.data.trigger == 'mouseover') {
                            $('body').on('mouseover.popup.body', that.exit);
                            that.data._source.source.on('mouseover.popup.source', that.focus);
                        }
                    };
                    that.bind_popup = function(){
                        if (that.data.trigger == 'click') {
                            that.data._popup.popup.on('mouseup.popup.self touchend.popup.self', that.focus);
                        }
                        if (that.data.trigger == 'mouseover') {
                            that.data._popup.popup.on('mouseover.popup.self', that.focus);
                        }
                    };

                    that.set_width = function(width){
                        that.data._popup.popup.css({ 'width': width, 'max-width': width });
                    };
                    that.set_height = function(height){
                        that.data._popup.popup.css({ 'height': height, 'max-height': height });
                    };
                    that.set_position = function(position, i){
                        if (typeof i === 'undefined') { i = 0; }
                        if (i < 11) {
                            var dims = that.get_dimentions(that.data._source.source),
                                popupDims = that.get_dimentions(that.data._popup.popup),
                                pos = position.split(' '),
                                top, left,
                                offsetx = that.data.offset[0],
                                offsety = that.data.offset[1],
                                main = pos[0],
                                secondary = pos[1];
                            that.data._popup.popup_position = main;
                            switch (main) {
                                case 'top':
                                    top = dims.top - popupDims.height - offsety;
                                    break;
                                case 'right':
                                    left = dims.left + dims.width + offsetx;
                                    break;
                                case 'bottom':
                                    top = dims.top + dims.height + offsety;
                                    break;
                                case 'left':
                                    left = dims.left - popupDims.width - offsetx;
                                    break;
                            }
                            switch (secondary) {
                                case 'top':
                                    top = dims.top + offsety;
                                    break;
                                case 'right':
                                    left = dims.left + dims.width - popupDims.width - offsetx;
                                    break;
                                case 'bottom':
                                    top = dims.top + dims.height - popupDims.height - offsety;
                                    break;
                                case 'left':
                                    left = dims.left + offsetx;
                                    break;
                                case 'center':
                                    if (/left|right/.test(main)) {
                                        top = dims.top + dims.height/2 - popupDims.height/2;
                                    } else {
                                        left = dims.left + dims.width/2 - popupDims.width/2;
                                    }
                            }
                            that.data._popup.popup.css({ left: left, top: top });
                            if (that.data.arrow) {
                                that.set_position_arrow(position);
                            }

                            /* correct popup position relative to the window */
                            var el = that.get_offset(that.data._source.source);
                            switch (position) {
                                case 'bottom right':
                                    if (el.left + el.width - popupDims.width < 0) {
                                        that.set_position('bottom left', ++i);
                                    }
                                    if (el.top + el.height + offsety + popupDims.height > $(window).height()) {
                                        that.set_position('top right', ++i);
                                    }
                                    break;
                                case 'left top':
                                    if (el.left - offsetx - popupDims.width < 0) {
                                        that.set_position('right top', ++i);
                                    }
                                    if (el.top + popupDims.height > $(window).height()) {
                                        that.set_position('left bottom', ++i);
                                    }
                                    break;
                                case 'left center':
                                    if (el.left - offsetx - popupDims.width < 0) {
                                        that.set_position('right center', ++i);
                                    }
                                    if (el.top + el.height/2 + popupDims.height/2 > $(window).height()) {
                                        that.set_position('left bottom', ++i);
                                    }
                                    if (el.top + el.height/2 - popupDims.height/2 < 0) {
                                        that.set_position('left top', ++i);
                                    }
                                    break;
                                case 'left bottom':
                                    if (el.left - offsetx - popupDims.width < 0) {
                                        that.set_position('right bottom', ++i);
                                    }
                                    if (el.top + el.height - popupDims.height < 0) {
                                        that.set_position('left top', ++i);
                                    }
                                    break;
                                case 'top right':
                                    if (el.left + el.width - popupDims.width < 0) {
                                        that.set_position('top left', ++i);
                                    }
                                    if (el.top - offsety - popupDims.height < 0) {
                                        that.set_position('bottom right', ++i);
                                    }
                                    break;
                                case 'top left':
                                    if (el.left + popupDims.width > $(window).width()) {
                                        that.set_position('top right', ++i);
                                    }
                                    if (el.top - offsety - popupDims.height < 0) {
                                        that.set_position('bottom left', ++i);
                                    }
                                    break;
                                case 'right bottom':
                                    if (el.left + el.width + offsetx + popupDims.width > $(window).width()) {
                                        that.set_position('left bottom', ++i);
                                    }
                                    if (el.top + el.height - popupDims.height < 0) {
                                        that.set_position('right top', ++i);
                                    }
                                    break;
                                case 'right center':
                                    if (el.left + el.width + offsetx + popupDims.width > $(window).width()) {
                                        that.set_position('left center', ++i);
                                    }
                                    if (el.top + el.height/2 + popupDims.height/2 > $(window).height()) {
                                        that.set_position('right bottom', ++i);
                                    }
                                    if (el.top + el.height/2 - popupDims.height/2 < 0) {
                                        that.set_position('right top', ++i);
                                    }
                                    break;
                                case 'right top':
                                    if (el.left + el.width + offsetx + popupDims.width > $(window).width()) {
                                        that.set_position('left top', ++i);
                                    }
                                    if (el.top + popupDims.height > $(window).height()) {
                                        that.set_position('right bottom', ++i);
                                    }
                                    break;
                                case 'bottom left':
                                    if (el.left + popupDims.width > $(window).width()) {
                                        that.set_position('bottom right', ++i);
                                    }
                                    if (el.top + el.height + offsety + popupDims.height > $(window).height()) {
                                        that.set_position('top left', ++i);
                                    }
                                    break;
                            }
                        }
                    };
                    that.set_position_arrow = function(position){
                        var sourceDims = that.get_dimentions(that.data._source.source),
                            popupDims = that.get_dimentions(that.data._popup.popup),
                            arrowDims = { width: 10 },
                            pos = position.split(' '),
                            top, left,
                            offsetx = that.data.offset[0],
                            offsety = that.data.offset[1],
                            main = pos[0],
                            secondary = pos[1];
                        switch (main) {
                            case 'top':
                                if (sourceDims.width <= popupDims.width) {
                                    switch (secondary) {
                                        case 'left':
                                            left = sourceDims.width/2;
                                            break;
                                        case 'right':
                                            left = popupDims.width - sourceDims.width/2;
                                            break;
                                        case 'center':
                                            left = popupDims.width/2;
                                            break;
                                    }
                                } else {
                                    left = popupDims.width/2;
                                }
                                left = left - arrowDims.width/2 - offsetx;
                                if (left < 0) { left = 5; }
                                that.data._popup.popup__arrow.css('left', left);
                                break;
                            case 'right':
                                if (sourceDims.height <= popupDims.height) {
                                    switch (secondary) {
                                        case 'top':
                                            top = sourceDims.height/2;
                                            break;
                                        case 'bottom':
                                            top = popupDims.height - sourceDims.height/2;
                                            break;
                                        case 'center':
                                            top = popupDims.height/2;
                                            break;
                                    }
                                } else {
                                    top = popupDims.height/2;
                                }
                                top = top - arrowDims.width/2 - offsety;
                                if (top < 0) { top = 5; }
                                that.data._popup.popup__arrow.css('top', top);
                                break;
                            case 'bottom':
                                if (sourceDims.width <= popupDims.width) {
                                    switch (secondary) {
                                        case 'left':
                                            left = sourceDims.width/2;
                                            break;
                                        case 'right':
                                            left = popupDims.width - sourceDims.width/2;
                                            break;
                                        case 'center':
                                            left = popupDims.width/2;
                                            break;
                                    }
                                } else {
                                    left = popupDims.width/2;
                                }
                                left = left - arrowDims.width/2 - offsetx;
                                if (left < 0) { left = 5; }
                                that.data._popup.popup__arrow.css('left', left);
                                break;
                            case 'left':
                                if (sourceDims.height <= popupDims.height) {
                                    switch (secondary) {
                                        case 'top':
                                            top = sourceDims.height/2;
                                            break;
                                        case 'bottom':
                                            top = popupDims.height - sourceDims.height/2;
                                            break;
                                        case 'center':
                                            top = popupDims.height/2;
                                            break;
                                    }
                                } else {
                                    top = popupDims.height/2;
                                }
                                top = top - arrowDims.width/2 - offsety;
                                if (top < 0) { top = 5; }
                                that.data._popup.popup__arrow.css('top', top);
                                break;
                        }
                    };
                    that.get_dimentions = function($el) {
                        var position;
                        if (that.data.place == 'source') {
                            position = $el.position();
                        }
                        if (that.data.place == 'body') {
                            position = $el.offset();
                        }
                        return {
                            width: $el.outerWidth(),
                            height: $el.outerHeight(),
                            left: position.left,
                            top: position.top
                        }
                    };
                    that.get_offset = function($el) {
                        var offset = $el.offset();
                        return {
                            width: $el.outerWidth(),
                            height: $el.outerHeight(),
                            left: offset.left,
                            top: offset.top
                        }
                    };

                    that.init_offset = function(){
                        if (typeof that.data.offset !== 'object') {
                            that.data.offset = that.data.offset.split(',').map(Number);
                        }
                    };
                    that.init_popup = function(){
                        that.init_offset();
                        that.init_components();
                        that.init_resize();
                        that.bind();
                        that.set_width(that.data.width);
                        that.set_height(that.data.height);
                        that.data._initiated = true;
                    };
                    that.init_components = function(){
                        if (typeof that.data._source.source_arrow[0] != 'undefined') {
                            that.data._source.source_arrow.addClass('f-icon_animate');
                        }
                    };
                    that.init_resize = function(){
                        if (that.data.place == 'body') {
                            $(window).on('resize', function(){
                                if (that.data._visible) {
                                    that.set_position(that.data.position);
                                }
                            });
                            $(document).on('mousewheel', function(){
                                if (that.data._visible) {
                                    that.set_position(that.data.position);
                                }
                            });
                        }
                    };
                    that.init = function(){
                        if (!that.data._initiated) {
                            that.init_popup();
                        }
                        if (!that.data._visible) {
                            that.show();
                            if (that.data.trigger == 'mouseover') {
                                that.data._inFocus = true;
                            }
                        } else {
                            if (that.data.trigger == 'click') {
                                that.hide();
                            }
                        }
                    };
                    that.init();
                }
                return this;
            });
        },
        hide : function() {
            return this.each(function() {
                this.obj.hide();
            });
        },
        show : function() {
            return this.each(function() {
                this.obj.show();
            });
        }
    };
    $.fn.fPopup = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on $.fPopup' );
        }
    };
})( jQuery );

// $('body').fPopup('activate')

(function($){
    var methods = {
        activate : function() {
            return this.each(function() {
                $(this).find('[min-width],[max-width]')
                    .addBack('[min-width],[max-width]').fResizeListener();
            });
        },
        init : function(options) {
            return this.each(function(){
                var self = $(this), data = self.data('_resize');
                if (!data) {
                    var that = this.obj = {};
                    that.defaults = {};
                    that.data = self.data();
                    that.options = $.extend(true, {}, that.defaults, that.data, options);
                    that.data._sizes = ['768px', '1024px', '1280px', '1440px']; //['34em', '48em', '62em', '76em'];
                    that.data._modes = [];
                    that.data._cnt = 0;

                    /* save widget options to self.data */
                    self.data(that.options);

                    that.getModes = function(){
                        if (typeof self.attr('min-width') != 'undefined') {
                            if ($.inArray('min-width', that.data._modes) < 0) {
                                that.data._modes.push('min-width');
                            }
                        }
                        if (typeof self.attr('max-width') != 'undefined') {
                            if ($.inArray('max-width', that.data._modes) < 0) {
                                that.data._modes.push('max-width');
                            }
                        }
                    };
                    that.getEmSize = function(element) {
                        if (!element) {
                            element = document.documentElement;
                        }
                        var fontSize = window.getComputedStyle(element, null).fontSize;
                        return parseFloat(fontSize) || 16;
                    };
                    that.getElementSize = function(element) {
                        if (!element.getBoundingClientRect) {
                            return {
                                width: element.offsetWidth,
                                height: element.offsetHeight
                            }
                        }

                        var rect = element.getBoundingClientRect();
                        return {
                            width: Math.round(rect.width),
                            height: Math.round(rect.height)
                        }
                    };
                    that.convertToPx = function(element, value) {
                        var numbers = value.split(/\d/);
                        var units = numbers[numbers.length - 1];
                        value = parseFloat(value);
                        switch (units) {
                            case "px":
                                return value;
                            case "em":
                                return value * that.getEmSize(element);
                            case "rem":
                                return value * that.getEmSize();
                            // Viewport units!
                            // According to http://quirksmode.org/mobile/tableViewport.html
                            // documentElement.clientWidth/Height gets us the most reliable info
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
                            // for now, not supporting physical units (since they are just a set number of px)
                            // or ex/ch (getting accurate measurements is hard)
                        }
                    };
                    that.setupInformation = function(){
                        that.data._modes.map(function(_mode){
                            var attrValue = '';
                            that.data._sizes.map(function(_size){
                                var value = that.convertToPx(null, _size);
                                var size = that.getElementSize(self[0]);
                                if (_mode === 'min-width' && size.width >= value) {
                                    attrValue += _size + ' ';
                                }
                                if (_mode === 'max-width' && size.width <= value) {
                                    attrValue += _size + ' ';
                                }
                            });
                            self.attr(_mode, attrValue);
                        });
                        that.data._cnt++;
                    };
                    that.bind = function(){
                        self.resize(that.setupInformation);
                    };
                    that.init = function(){
                        that.getModes();
                        that.bind();
                    };
                    that.init();
                }
                return this;
            });
        },
        method : function() {
            return this.each(function() {
                this.obj.method();
            });
        }
    };
    $.fn.fResizeListener = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on $.fResizeListener' );
        }
    };
})( jQuery );

// $('body').fResizeListener('activate')

(function($){
    var methods = {
        activate : function() {
            return this.each(function() {
                $(this).find('[data-toggle="f-search"]')
                    .addBack('[data-toggle="f-search"]').on('click', function(e, data) {
                        $(e.currentTarget).fSearch(
                            $.extend(true, { source: $(e.currentTarget) }, data)
                        ).fSearch('show');
                    });
            });
        },
        init : function(options) {
            return this.each(function(){
                var self = $(this), data = self.data('_widget');
                if (!data) {
                    self.data('_widget', { type: 'search', target : self });
                    var that = this.obj = {};
                    that.defaults = {
                        source: null,
                        func: null,
                        search_delay: 300
                    };
                    that.data = self.data();
                    that.options = $.extend(true, {}, that.defaults, that.data, options);

                    /* save widget options to self.data */
                    self.data(that.options);

                    that.data._el = {
                        search: $('<div class="f-search"></div>'),
                        search__view: $('<div class="f-search__view f-search__view_hidden"></div>'),
                        search__backdrop: $('<div class="f-search__backdrop"></div>'),
                        search__dialog: $('<div class="f-search__dialog"></div>'),
                        search__header: $('<div class="f-search__header"></div>'),
                        search__header_row_input: $('<div class="f-search__header-row"></div>'),
                        input: $('<input class="k-textbox" placeholder="Поиск">'),
                        span_search: $([
                            '<span class="f-button">',
                            '<span class="f-icon f-icon_svg_search_white"></span>',
                            '</span>'
                        ].join('')),
                        button_clear: $([
                            '<button class="f-button">',
                            '<span class="f-button__text">Очистить</span>',
                            '</button>'
                        ].join('')),
                        button_close: $([
                            '<button class="f-button">',
                            '<span class="f-button__text">Закрыть</span>',
                            '</button>'
                        ].join('')),
                        search__header_row_filter: $('<div class="f-search__header-row"></div>'),
                        search__body: $('<div class="f-search__body"></div>'),
                        results: $('<table class="f-table"></table>'),
                        spinner: $([
                            '<span class="f-button">',
                            '<span class="f-icon f-spinner f-spinner_color_white"></span>',
                            '</span>'
                        ].join(''))
                    };
                    that.data._private = {
                        timeout_id: null,
                        xhr: null,
                        search_text: null,
                        search_current_text: null,
                        search_results: null
                    };

                    that.destroy = function(){
                        that.hide();
                        setTimeout(function(){
                            self.removeData();
                            self.remove();
                        }, 500);
                    };
                    that.hide = function(){
                        if (that.data._el.search__view.hasClass('f-search__view_visible')) {
                            that.data._el.search__view.removeClass('f-search__view_visible');
                            setTimeout(function(){
                                that.data._el.search__view.addClass('f-search__view_hidden');
                                $(window).off('keyup.search');
                            }, 100);
                        }
                    };
                    that.show = function(){
                        that.data._el.search__view.removeClass('f-search__view_hidden');
                        setTimeout(function(){
                            that.data._el.search__view.addClass('f-search__view_visible');
                            that.focus();
                            that.bind_hide();
                        }, 100);
                    };
                    that.focus = function(){
                        that.data._el.input.focus();
                    };
                    that.render = function(){
                        $('body').append(
                            that.data._el.search.append(
                                that.data._el.search__view.append(
                                    that.data._el.search__backdrop,
                                    that.data._el.search__dialog.append(
                                        that.data._el.search__header.append(
                                            that.data._el.search__header_row_input.append(
                                                that.data._el.span_search,
                                                that.data._el.input,
                                                that.data._el.button_clear,
                                                that.data._el.button_close
                                            )
                                        ),
                                        that.data._el.search__body
                                    )
                                )
                            )
                        );
                    };
                    that.render_error = function(text){
                        var table = $('<table class="f-table"><tbody><tr><td class="f-table-td_static">' + text + '</td></tr></tbody></table>');
                        that.data._el.search__body.empty().append(table);
                    };

                    that.search = function(){
                        that.data._private.search_text = that.data._el.input.val();
                        if (!that.data._private.search_text) {
                            this.clear();
                        } else {
                            if (that.data._private.timeout_id) {
                                clearTimeout(that.data._private.timeout_id);
                                that.data._private.timeout_id = null;
                            }
                            that.data._private.timeout_id = setTimeout(function(){
                                if (that.data._private.search_current_text !== that.data._private.search_text) {
                                    if (that.data._private.xhr) {
                                        that.data._private.xhr.abort();
                                        that.data._private.xhr = null;
                                    }
                                    that.data._private.search_current_text = that.data._private.search_text;
                                    that.data._private.timeout_id = null;
                                    var funcSuccess = function() {
                                        that.data._el.spinner.remove();
                                        that.data._private.xhr = null;
                                    };
                                    var funcError = function() {
                                        that.data._el.spinner.remove();
                                        that.render_error(that.data._private.xhr.status + ' ' + that.data._private.xhr.statusText);
                                        that.data._private.xhr = null;
                                    };
                                    var funcExists = function(namespace) {
                                        var tokens = namespace.split('.');
                                        return tokens.reduce(function(prev, curr) {
                                            return (typeof prev === "undefined") ? prev : prev[curr];
                                        }, window);
                                    };
                                    if (typeof funcExists(that.data.func) === 'function') {
                                        that.data._el.input.after(that.data._el.spinner);
                                        that.data._private.xhr = eval(that.data.func)({
                                            elem: that,
                                            keyword: that.data._private.search_current_text,
                                            success: funcSuccess,
                                            error: funcError
                                        });
                                    } else {
                                        that.render_error('Search method does not exist');
                                    }
                                }
                            }, that.data.search_delay);
                        }
                    };
                    that.clear = function(){
                        that.data._private.search_text = '';
                        that.data._private.search_current_text = '';
                        that.data._el.search__body.empty();
                        that.data._el.input.val('');
                        that.focus();
                    };

                    that.bind = function(){
                        if (that.data.source) {
                            //that.data.source.on('click', that.show);
                            that.data._el.search__backdrop.on('click', that.hide);
                            that.data._el.button_clear.on('click', that.clear);
                            that.data._el.button_close.on('click', that.hide);
                            that.bind_search();
                        }
                    };
                    that.bind_hide = function(){
                        $(window).on('keyup.search', function(e){
                            if (e.keyCode === 27) {
                                that.hide();
                            }
                        });
                    };
                    that.bind_search = function(){
                        var keyup = function (e) {
                            switch (e.keyCode) {
                                case 27: // escape
                                    that.hide();
                                    break;
                                default: // search
                                    that.search();
                            }
                            e.stopPropagation();
                            e.preventDefault();
                        };
                        var keydown = function (e) {
                            switch (e.keyCode) {
                                case 27: // escape
                                    e.preventDefault();
                                    break;
                                case 13: // enter. stop processing to prevent submit form
                                    e.preventDefault();
                                    break;
                            }
                            e.stopPropagation();
                        };
                        that.data._el.input.on('keydown keypress', keydown);
                        that.data._el.input.on('keyup', keyup);
                    };

                    that.init = function(){
                        that.render();
                        that.bind();
                    };
                    that.init();
                }
                return this;
            });
        },
        destroy : function() {
            return this.each(function() {
                this.obj.destroy();
            });
        },
        hide : function() {
            return this.each(function() {
                this.obj.hide();
            });
        },
        show : function() {
            return this.each(function() {
                this.obj.show();
            });
        }
    };
    $.fn.fSearch = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on $.fSearch' );
        }
    };
})( jQuery );

// $('body').fSearch('activate')

(function($){
    var methods = {
        activate : function() {
            return this.each(function() {
                $(this).find('[data-toggle="f-tab"]')
                    .addBack('[data-toggle="f-tab"]').on('click', function(e, data) {
                        if (!data) {
                            data = $(this).data('bubble');
                        }
                        $('[data-toggle="f-popup"]').fPopup({ _visible: true });
                        $(e.currentTarget).fTab();
                        $(e.currentTarget).fTab('select', data);
                    });

                $(this).find('[data-toggle="f-tab"][data-active="true"]')
                    .addBack('[data-toggle="f-tab"][data-active="true"]').trigger('click', false);

                $(this).find('[data-toggle="f-tab"][href="#' + fUrl.parseHash(0) + '"]')
                    .addBack('[data-toggle="f-tab"][href="#' + fUrl.parseHash(0) + '"]').trigger('click', false);
            });
        },
        init : function(options) {
            return this.each(function(){
                var self = $(this), data = self.data('_f');
                if (!data) {
                    var that = this.obj = {};
                    that.defaults = {
                        active: false,
                        disabled: false,
                        animation: true,
                        highlight: true
                    };
                    that.data = self.data();
                    that.options = $.extend(true, {}, that.defaults, that.data, options);
                    that.data._source = self;
                    that.data._target = null;
                    that.data._neighbors = [];
                    that.data._initiating = false;
                    that.data._initiated = false;
                    that.data._cnt = -1;
                    that.data._twins = {
                        twins: null
                    };
                    that.data._parent = null;
                    that.data._triggers = {
                        show: 'show.fTab',
                        shown: 'shown.fTab',
                        hide: 'hide.fTab',
                        hidden: 'hidden.fTab',
                        load: 'load.fTab',
                        loaded: 'loaded.fTab'
                    };

                    /* save widget options to self.data */
                    self.data(that.options);

                    that.select = function(bubble){
                        that.hide_neighbors();
                        that.show_target();
                        that.show_twins();
                        if (bubble) {
                            that.show_parent();
                        }
                    };
                    that.hide_neighbors = function(){
                        that.data._neighbors.forEach(function(tab){
                            if (that.data.highlight) {
                                tab.removeClass('f_active');
                            }
                            if (tab.data().active) {
                                tab.data()._source.trigger(that.data._triggers.hide, tab.data());
                                tab.data()._target.removeClass('f-tab__panel_animation');
                                tab.data()._target.removeClass('f-tab__panel_visible');
                                tab.data()._target.addClass('f-tab__panel_hidden');
                                tab.data().active = false;
                                tab.data().disabled = false;
                                tab.data()._source.trigger(that.data._triggers.hidden, tab.data());
                            }
                        });
                    };
                    that.show_target = function(){
                        that.data._cnt++;
                        that.data._source.trigger(that.data._triggers.show, that.data);
                        if (that.data._cnt == 0) {
                            that.data._source.trigger(that.data._triggers.load, that.data);
                        }
                        if (that.data.animation) {
                            that.data._target.addClass('f-tab__panel_animation');
                        }
                        if (that.data.highlight) {
                            that.data._source.addClass('f_active');
                        }
                        that.data.active = true;
                        that.data.disabled = true;
                        // trigger shown
                        that.data._target.off('oanimationend animationend webkitAnimationEnd');
                        that.data._target.one('oanimationend animationend webkitAnimationEnd', function(e){
                            $(this).off(e);
                            that.data._target.removeClass('f-tab__panel_animation');
                            that.data._source.trigger(that.data._triggers.shown, that.data);
                            if (that.data._cnt == 0) {
                                that.data._source.trigger(that.data._triggers.loaded, that.data);
                            }
                        });
                        that.data._target.removeClass('f-tab__panel_hidden');
                        that.data._target.addClass('f-tab__panel_visible');
                    };
                    that.show_twins = function(){
                        that.data._twins.twins.each(function(){
                            if ($(this).data('highlight')) {
                                $(this).addClass('f_active');
                            }
                        });
                    };
                    that.show_parent = function(){
                        if (that.data._parent.length > 0) {
                            if (!that.data._parent.data('active')) {
                                if (!that.data._parent.data('_initiated')) {
                                    that.data._parent.fTab();
                                }
                                that.data._parent.fTab('select');
                            }
                        }
                    };

                    that.get_neighbors = function(){
                        $('[data-toggle="f-tab"][data-tab-group="' + self.data('tab-group') + '"]').each(function(){
                            if ($(this).attr('href') != that.data._source.attr('href')) {
                                var tab = $(this);
                                if (!tab.data('_initiated') && !tab.data('_initiating')) {
                                    tab.fTab();
                                }
                                that.data._neighbors.push(tab);
                            }
                        });
                    };
                    that.get_twins = function(){
                        that.data._twins.twins = $('[data-toggle="f-tab"][data-tab-group="' + self.data('tab-group') + '"][href="' + self.attr('href') + '"]');
                    };
                    that.get_parent = function(){
                        that.data._parent = $('[data-toggle="f-tab"][href="#' + self.data('tab-group') + '"]');
                    };

                    that.init_tab = function(){
                        that.data._initiating = true;
                        that.get_neighbors();
                        that.get_twins();
                        that.get_parent();
                        that.data._target = $(self.attr('href'));
                        that.data._initiated = true;
                        that.data._initiating = false;
                    };
                    that.init = function(){
                        if (!that.data._initiated) {
                            that.init_tab();
                        }
                    };
                    that.init();
                }
                return this;
            });
        },
        select : function(bubble) {
            return this.each(function() {
                this.obj.select(bubble);
            });
        }
    };
    $.fn.fTab = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on $.fTab' );
        }
    };
})( jQuery );

// $('body').fTab('activate')

(function($){
    var methods = {
        activate : function() {
            return this.each(function() {
                //$(this).find('[data-tooltip]').addBack('[data-tooltip]').on('mouseover', function(e, data) {
                $('body').on('mouseover', '[data-tooltip]', function(e) {
                    if (!kendo.support.mobileOS) {
                        $(e.currentTarget).fTooltip(e.data);
                        $(e.currentTarget).trigger('mouseover.tooltip');
                    }
                });
            });
        },
        init : function(options) {
            return this.each(function(){
                var self = $(this), data = self.data('_tooltip');
                if (!data) {
                    var that = this.tooltip = {};
                    that.defaults = {
                        follow: true,
                        tooltip: self.attr('data-tooltip'),
                        offsety: 5,
                        padding: 5,
                        paddingArrow: 10
                    };
                    that.data = self.data();
                    that.options = $.extend(that.defaults, that.data, options);

                    /* save widget options to self.data */
                    self.data(that.options);

                    that.data._tooltip = {
                        tooltip: $('<div class="f-tooltip"></div>'),
                        tooltip__text: $('<div class="f-tooltip__text"></div>'),
                        tooltip__arrow: $('<div class="f-tooltip__arrow"></div>'),
                        tooltip__arrow_width: 10
                    };

                    that.destroy = function(){
                        that.data._tooltip.tooltip.remove();
                        that.data._tooltip.tooltip.css({
                            width: 'auto'
                        });
                    };
                    that.hide = function(){
                        that.destroy();
                        self.off('mousemove.tooltip');
                    };
                    that.show = function(e){
                        that.render();
                        if (that.data.follow) {
                            that.follow(e);
                            self.on('mousemove.tooltip', that.follow);
                        } else {
                            that.put(e);
                        }
                    };

                    that.put = function(e){
                        that.data._tooltip.tooltip.addClass('f-tooltip_visible');
                        that.data._tooltip.tooltip__arrow.removeClass('f-tooltip__arrow_bottom');
                        that.data._tooltip.tooltip__arrow.addClass('f-tooltip__arrow_top');
                        var yOffset = that.data.offsety;
                        var padding = that.data.padding;
                        var paddingArrow = that.data.paddingArrow;
                        var ttw = Math.ceil(that.data._tooltip.tooltip.width());
                        var tth = Math.ceil(that.data._tooltip.tooltip.outerHeight());
                        var taw = that.data._tooltip.tooltip__arrow_width;
                        var curX = self.offset().left + self[0].getBoundingClientRect().width/2;
                        var curY = self.offset().top;
                        var ttleft = curX - ttw / 2;
                        var tttop = curY - tth - yOffset;
                        if (ttleft - padding < 0) {
                            ttleft = padding;
                            if (ttleft + ttw + padding > $(window).width()) {
                                ttw = $(window).width() - padding * 2;
                            }
                        } else if (ttleft + ttw + padding > $(window).width()) {
                            ttleft = $(window).width() - padding - ttw;
                            if (ttleft - padding < 0) {
                                ttw = $(window).width() - padding * 2;
                            }
                        }
                        if (tttop < 0) {
                            tttop = curY + self[0].getBoundingClientRect().height + yOffset;
                            that.data._tooltip.tooltip__arrow.removeClass('f-tooltip__arrow_top');
                            that.data._tooltip.tooltip__arrow.addClass('f-tooltip__arrow_bottom');
                        }
                        var taleft = curX - ttleft - taw;
                        if (taleft < paddingArrow) {
                            taleft = paddingArrow;
                        }
                        if (taleft > ttw - taw - paddingArrow) {
                            taleft = ttw - taw - paddingArrow;
                        }
                        that.data._tooltip.tooltip.css({
                            top: tttop,
                            left: ttleft
                        });
                        that.data._tooltip.tooltip__arrow.css({
                            left: taleft
                        });
                    };
                    that.follow = function(e){
                        that.data._tooltip.tooltip.addClass('f-tooltip_visible');
                        that.data._tooltip.tooltip__arrow.removeClass('f-tooltip__arrow_bottom');
                        that.data._tooltip.tooltip__arrow.addClass('f-tooltip__arrow_top');
                        var yOffset = that.data.offsety + 20;
                        var padding = that.data.padding;
                        var paddingArrow = that.data.paddingArrow;
                        var ttw = Math.ceil(that.data._tooltip.tooltip.width());
                        var tth = Math.ceil(that.data._tooltip.tooltip.outerHeight());
                        var taw = that.data._tooltip.tooltip__arrow_width;
                        var wscrY = $(window).scrollTop();
                        var wscrX = $(window).scrollLeft();
                        var curX = (document.all) ? e.clientX + wscrX : e.pageX;
                        var curY = (document.all) ? e.clientY + wscrY : e.pageY;
                        var ttleft = curX - ttw / 2;
                        var tttop = curY - tth - yOffset;
                        if (ttleft - padding < 0) {
                            ttleft = padding;
                            if (ttleft + ttw + padding > $(window).width()) {
                                ttw = $(window).width() - padding * 2;
                            }
                        } else if (ttleft + ttw + padding > $(window).width()) {
                            ttleft = $(window).width() - padding - ttw;
                            if (ttleft - padding < 0) {
                                ttw = $(window).width() - padding * 2;
                            }
                        }
                        if (tttop < 0) {
                            tttop = curY + yOffset;
                            that.data._tooltip.tooltip__arrow.removeClass('f-tooltip__arrow_top');
                            that.data._tooltip.tooltip__arrow.addClass('f-tooltip__arrow_bottom');
                        }
                        var taleft = curX - ttleft - taw;
                        if (taleft < paddingArrow) {
                            taleft = paddingArrow;
                        }
                        if (taleft > ttw - taw - paddingArrow) {
                            taleft = ttw - taw - paddingArrow;
                        }
                        that.data._tooltip.tooltip.css({
                            top: tttop,
                            left: ttleft
                        });
                        that.data._tooltip.tooltip__arrow.css({
                            left: taleft
                        });
                    };

                    that.render = function(){
                        var tooltip = '';
                        if (self.attr('title')) {
                            self.data('tooltip', self.attr('title'));
                            self.removeAttr('title');
                        }
                        if (self.data('tooltip')) {
                            that.data.tooltip = self.data('tooltip');
                        }
                        if (that.data.tooltip) {
                            tooltip = that.data.tooltip;
                        }
                        if (tooltip != '') {
                            $('body').append(
                                that.data._tooltip.tooltip.append(
                                    that.data._tooltip.tooltip__text.html(tooltip),
                                    that.data._tooltip.tooltip__arrow
                                )
                            );
                        }
                    };
                    that.update = function(tooltip){
                        that.data.tooltip = tooltip;
                        that.data._tooltip.tooltip__text.html(that.data.tooltip);
                    };

                    that.bind = function(){
                        self.on('mouseover.tooltip', that.show);
                        self.on('mouseout.tooltip', that.hide);
                    };
                    that.init = function(){
                        that.bind();
                    };
                    that.init();
                }
                return this;
            });
        },
        hide : function(e) {
            return this.each(function() {
                this.tooltip.hide(e);
            });
        },
        show : function(e) {
            return this.each(function() {
                this.tooltip.show(e);
            });
        },
        update : function(tooltip) {
            return this.each(function() {
                this.tooltip.update(tooltip);
            });
        },
        clear : function(e) {
            return this.each(function() {
                $('.f-tooltip').remove();
            });
        }
    };
    $.fn.fTooltip = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on $.fTooltip' );
        }
    };
})( jQuery );

// $('body').fTooltip('activate')

(function($){
    var methods = {
        activate : function() {
            return this.each(function() {
                $(this).find('[data-toggle="f-widget-grid"]')
                    .addBack('[data-toggle="f-widget-grid"]').fWidgetGrid();
            });
        },
        init : function(options) {
            return this.each(function(){
                var self = $(this), data = self.data('_f');
                if (!data) {
                    self.data('_f', 'widget-grid');
                    var that = this.obj = {};
                    that.defaults = {};
                    that.data = self.data();
                    that.options = $.extend(true, {}, that.defaults, that.data, options);
                    that.data._triggers = {};
                    that.data._nodes = [];

                    /* save widget options to self.data */
                    self.data(that.options);

                    that._sort = function(nodes, dir, width) {
                        width = _.chain(nodes).map(function(node) { return node.x + node.w; }).max().value();
                        dir = dir != -1 ? 1 : -1;
                        return _.sortBy(nodes, function(n) { return dir * (n.x + n.y * width); });
                    };
                    that._sortNodes = function(dir) {
                        that.data._nodes = that._sort(that.data._nodes, dir);
                    };
                    that._isNodeChangedPosition = function(node, x, y, w, h) {
                        if (typeof x != 'number') { x = node.x; }
                        if (typeof y != 'number') { y = node.y; }
                        if (typeof w != 'number') { w = node.w; }
                        if (typeof h != 'number') { h = node.h; }

                        if (typeof node.maxWidth != 'undefined') { w = Math.min(w, node.maxWidth); }
                        if (typeof node.maxHeight != 'undefined') { h = Math.min(h, node.maxHeight); }
                        if (typeof node.minWidth != 'undefined') { w = Math.max(w, node.minWidth); }
                        if (typeof node.minHeight != 'undefined') { h = Math.max(h, node.minHeight); }

                        return !(node.x == x && node.y == y && node.w == w && node.h == h);
                    };
                    that._isIntercepted = function(a, b) {
                        return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
                    };
                    that._collisionNodeCheck = function(n) {
                        return n != this && that._isIntercepted(n, this);
                    };
                    that._isAreaEmpty = function(x, y, w, h) {
                        var nn = { x: x || 0, y: y || 0, w: w || 1, h: h || 1};
                        var collisionNode = _.find(that.data._nodes, _.bind(function(n) {
                            return that._isIntercepted(n, nn);
                        }, this));
                        return collisionNode === null || typeof collisionNode === 'undefined';
                    };
                    that._fixCollisions = function(node) {
                        while (true) {
                            var collisionNode = _.find(that.data._nodes, _.bind(that._collisionNodeCheck, node));
                            if (typeof collisionNode == 'undefined') {
                                return;
                            }
                            that._moveNode(collisionNode, collisionNode.x, node.y + node.h, collisionNode.w, collisionNode.h);
                        }
                    };
                    that._fixEmpty = function(){};
                    that._prepareNode = function(node) {
                        node = $.extend({ w: 1, h: 1, x: 0, y: 0}, node);

                        node.x = parseInt('' + node.x);
                        node.y = parseInt('' + node.y);
                        node.w = parseInt('' + node.w);
                        node.h = parseInt('' + node.h);

                        if (node.w < 1) {
                            node.w = 1;
                        }
                        if (node.h < 1) {
                            node.h = 1;
                        }
                        if (node.x < 0) {
                            node.x = 0;
                        }
                        if (node.y < 0) {
                            node.y = 0;
                        }

                        return node;
                    };
                    that._moveNode = function(node, x, y, w, h) {
                        if (!that._isNodeChangedPosition(node, x, y, w, h)) {
                            return node;
                        }
                        if (typeof x != 'number') { x = node.x; }
                        if (typeof y != 'number') { y = node.y; }
                        if (typeof w != 'number') { w = node.w; }
                        if (typeof h != 'number') { h = node.h; }

                        if (typeof node.maxWidth != 'undefined') { w = Math.min(w, node.maxWidth); }
                        if (typeof node.maxHeight != 'undefined') { h = Math.min(h, node.maxHeight); }
                        if (typeof node.minWidth != 'undefined') { w = Math.max(w, node.minWidth); }
                        if (typeof node.minHeight != 'undefined') { h = Math.max(h, node.minHeight); }

                        if (node.x == x && node.y == y && node.w == w && node.h == h) {
                            return node;
                        }

                        node.x = x;
                        node.y = y;
                        node.w = w;
                        node.h = h;

                        return node;
                    };
                    that._renderNodes = function(){
                        that.data._nodes.map(function(node){
                            if (node.elem.attr('data-x') != node.x) {
                                node.elem.attr('data-x', node.x);
                            }
                            if (node.elem.attr('data-y') != node.y) {
                                node.elem.attr('data-y', node.y);
                            }
                            if (node.elem.attr('data-w') != node.w) {
                                node.elem.attr('data-w', node.w);
                            }
                            if (node.elem.attr('data-h') != node.h) {
                                node.elem.addClass('f-widget_animated');
                                node.elem.attr('data-h', node.h);
                                if (node.elem.css('transition-duration') != '0s' &&
                                    node.elem.css('transition-duration') != '') {
                                    setTimeout(function(){
                                        node.elem.removeClass('f-widget_animated');
                                        if (node._collapsed != node.collapsed && !node.collapsed && node.elem.data('resizable')) {
                                            node.elem.trigger('resize');
                                        }
                                    }, that.css_time_to_milliseconds(node.elem.css('transition-duration')));
                                }
                            }
                            if (node._collapsed != node.collapsed) {
                                if (node.collapsed) {
                                    node.elem.data('resizable', false);
                                    node.elem.attr('data-collapsed', true);
                                    node.btn.find('.f-icon').removeClass('f-icon_rotate_0deg');
                                } else {
                                    node.elem.data('resizable', true);
                                    node.elem.attr('data-collapsed', false);
                                    node.btn.find('.f-icon').addClass('f-icon_rotate_0deg');
                                }
                            }
                        });
                    };
                    that._toggleNode = function(node){
                        node._collapsed = node.collapsed;
                        node.collapsed = !node._collapsed;
                        if (node.collapsed) {
                            node.h = 1;
                        } else {
                            node.h = node._h;
                        }
                    };

                    that.css_time_to_milliseconds = function(time_string) {
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

                    that.getNodes = function(){
                        self.closestChildren('.f-widget').each(function(i){
                            $(this).data('_id', i);
                            that.data._nodes.push($.extend($(this).data(), {
                                elem: $(this),
                                btn: $(this).find('[data-toggle="collapse"]')
                            }));
                        });
                    };
                    that.initCollapse = function(){
                        that.data._nodes.map(function(node){
                            node.collapsed = typeof node.collapsed == 'undefined' ? false : node.collapsed;
                            node._h = node.h;
                            if (node.collapsed) {
                                node._h = node.h;
                                node.h = 1;
                            }
                        });
                    };
                    that.initCollapsible = function(){
                        that.data._nodes.map(function(node){
                            node.collapsible = typeof node.collapsible == 'undefined' ? true : node.collapsible;
                            if (node.collapsible) {
                                that.bindNodeCollapsible(node);
                            } else {
                                node.btn.find('.f-icon').remove();
                            }
                        });
                    };
                    that.fixPositions = function(){
                        that._sortNodes();
                        that.data._nodes.map(function(node){
                            node.y = 0;
                        });
                        that.data._nodes.map(function(node){ that._fixCollisions(node); });
                        that._renderNodes();
                    };
                    that.bind = function(){};
                    that.bindNodeCollapsible = function(node){
                        node.btn.on('click', function(){
                            that._toggleNode(node);
                            that.fixPositions();
                        });
                    };
                    that.initAnimation = function(){
                        setTimeout(function(){
                            self.closestChildren('.f-widget').addClass('f-widget_animation');
                        }, 100);
                    };
                    that.init = function(){
                        that.getNodes();
                        that.initCollapse();
                        that.initCollapsible();
                        that.fixPositions();
                        that.initAnimation();
                    };
                    that.init();
                }
                return this;
            });
        },
        method : function() {
            return this.each(function() {
                this.obj.method();
            });
        }
    };
    $.fn.fWidgetGrid = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on $.fWidgetGrid' );
        }
    };
})( jQuery );

// $('body').fWidgetGrid('activate')
