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
                                    var funcError = function(title, text, url, _type_) {
                                        that.data._el.spinner.remove();
                                        that.render_error(Globa.Error.locale() + '<br><br>' + text);
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
