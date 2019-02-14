(function($){
    var methods = {
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
                            that.data._modes.push('min-width');
                        }
                        if (typeof self.attr('max-width') != 'undefined') {
                            that.data._modes.push('max-width');
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
$(function(){
    //$('[min-width],[max-width]').fResizeListener();
});
