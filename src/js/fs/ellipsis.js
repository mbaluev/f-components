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
