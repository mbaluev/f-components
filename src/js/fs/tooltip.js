/* created by mbaluev at 2018 */
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
