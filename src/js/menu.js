(function($){
    var methods = {
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
$(function(){
    $('[data-toggle="f-menu"]').fMenu();
});