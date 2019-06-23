/* created by mbaluev at 2018 */
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
