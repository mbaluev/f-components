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
