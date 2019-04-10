var fDashboard = function(options) {
    var that = {};
    that.data = {
        id: Date.now(),
        containerid: null,
        items: [],
        mode: 'view',
        single: false,
        disabled: true,
        collapsed_widget_height: 1,
        grid_options: {
            verticalMargin: 0,
            cellHeight: 50,
            disableDrag: true,
            disableResize: true,
            resizable: { handles: 'e, se, s, sw, w' }
        }
    };
    that.data = $.extend(that.data, options);
    that.data._el = {
        target: $('#' + that.data.containerid),
        widget_grid: $('<div class="f-widget-grid"></div>'),
        widget_grid__container: $('<div class="f-widget-grid__container"></div>'),
        grid_stack: $('<div class="grid-stack"></div>'),
        loader: $('<span class="f-spinner f-spinner_align_center"></span>')
    };
    that.data._el.target.append(that.data._el.widget_grid);
    that.data._el.widget_grid.append(that.data._el.widget_grid__container);
    that.data._el.widget_grid__container.append(that.data._el.grid_stack);
    that.data._private = {
        grid: null,
        nodes: [],
        id: 0
    };
    var self = that.data._el.grid_stack;

    that.destroy = function(){
        that.clear();
        self.removeData();
        self.remove();
    };
    that.clear = function(){
        that.data._el.grid.removeAll();
        _.each(that.data._private.nodes, function(node) {
            node.widget.widget('destroy');
        });
        that.data._private.nodes = [];
    };
    that.save = function(callback){
        that.data.items = _.map(self.children('.grid-stack-item:visible'), function(el) {
            el = $(el);
            var node = that.get(el);
            return {
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
                settings: node.settings
            };
        }, this);
        if (typeof callback == "function") { callback(that.data.items); }
    };

    that.load = function(){
        that.data._private.grid.removeAll();
        var items = GridStackUI.Utils.sort(that.data.items);
        _.each(items, function(item) {
            that.load_widget(item);
        });
    };
    that.load_items = function(items){
        that.clear();
        that.data.items = $.extend(true, {}, items);
        that.load();
    };
    that.load_widget = function(item){
        that.data._private.id++;

        item._id = that.data._private.id;
        item._height = item.height;
        item.settings = item.settings || {};
        item.settings.collapsed = (item.settings.collapsed === undefined ? false : item.settings.collapsed);
        item.settings.collapsible = (item.settings.collapsible === undefined ? true : item.settings.collapsible);
        item.buttons = item.buttons || [];
        item._widget = that.render_widget(item);

        item._el = $('<div><div class="grid-stack-item-content"></div></div>');
        item._el.find('.grid-stack-item-content').append(item._widget);

        that.data._private.grid.addWidget(item._el, item.x, item.y, item.width, item.height);
        that.data._private.nodes.push(item);
        that.set(item._el, item);
    };
    that.render_widget = function(item){
        var widget = $('<div class="f-widget f-widget_animation" id="' + item._id + '"></div>'),
            widget__border = $('<div class="f-widget__border"' + (item.settings.color ? ' style="border-color:' + item.settings.color + '"' : '') + '></div>'),
            widget__header = $('<div class="f-widget__header"></div>'),
            widget__header_name = $('<div class="f-widget__header-name"></div>'),
            widget__header_button = $('<button class="f-widget__header-button" type="button" data-toggle="collapse" data-tooltip="' + item.settings.name + '">'),
            widget__header_text = $('<span class="f-widget__header-text f-widget__header-text_size_md">' + item.settings.name + '</span>'),
            widget__header_icon = $('<span class="f-icon f-icon_svg_right f-icon_animate"></span>'),
            widget__header_actions = $('<div class="f-widget__header-actions"></div>'),
            widget__content = $('<div class="f-widget__content"></div>');

        item.buttons.unshift(
            {
                id: 'button_settings',
                cssClass: 'f-icon_svg_settings',
                mode: 'edit',
                //name: 'Редактировать',
                //tooltip: 'Редактировать',
                onClick: function(){
                    console.log('edit ' + item._id);
                }
            },
            {
                id: 'button_delete',
                cssClass: 'f-icon_svg_trash',
                mode: 'edit',
                //name: 'Удалить',
                //tooltip: 'Удалить',
                onClick: function(){
                    that.remove_widget(item._id);
                    $('body').fTooltip('clear');
                }
            }
        );

        widget.append( widget__border.append(
            widget__header.append(
                widget__header_name.append((item.settings.name ? widget__header_button.append( widget__header_text, widget__header_icon ) : null)),
                (item.buttons ? widget__header_actions.append(
                    item.buttons.map(function(b){
                        var widget__header_button = $('<button class="f-widget__header-button" type="button"></button>'),
                            icon = $('<span class="f-icon"></span>'),
                            button__text = $('<span class="f-button__text"></span>');
                        widget__header_button.append(icon, button__text);
                        if (b.tooltip) {
                            widget__header_button.attr('data-tooltip', b.tooltip);
                        }
                        if (b.cssClass) {
                            icon.addClass(b.cssClass);
                        } else {
                            icon.remove();
                        }
                        if (b.name) {
                            button__text.html(b.name);
                        } else {
                            button__text.remove();
                        }
                        if (typeof b.onClick === 'function') {
                            widget__header_button.on('click', function(){
                                b.onClick(b);
                            });
                        }
                        b._el = widget__header_button;
                        if (that.data.mode === b.mode) {
                            b._el.show();
                        } else {
                            b._el.hide();
                        }
                        return b._el;
                    })
                ) : null)), widget__content )).fTooltip('activate');

        if (item.settings.collapsible) {
            widget__header_button.on('click', function(){
                if (that.data.mode === 'view') {
                    that.toggle_widget(item, widget, true);
                }
            });
        } else {
            widget__header_icon.remove();
        }
        if (item.settings.collapsed) {
            that.collapse_widget(item, widget, false);
        } else {
            that.expand_widget(item, widget, false);
        }
        return widget;
    };

    that.toggle_widget = function(item, widget, save_state){
        if (item.collapsed) {
            that.expand_widget(item, widget, save_state);
        } else {
            that.collapse_widget(item, widget, save_state);
        }
    };
    that.expand_widget = function(item, widget, save_state){
        widget.data('resizable', true);
        widget.attr('data-collapsed', false);
        widget.find('.f-widget__header-button .f-icon').addClass('f-icon_rotate_0deg');
        that.update_widget(item._id, null, null, null, item.height);
        if (save_state) {
            item.collapsed = !item.collapsed;
        }
    };
    that.collapse_widget = function(item, widget, save_state){
        widget.data('resizable', false);
        widget.attr('data-collapsed', true);
        widget.find('.f-widget__header-button .f-icon').removeClass('f-icon_rotate_0deg');
        that.update_widget(item._id, null, null, null, that.data.collapsed_widget_height);
        if (save_state) {
            item.collapsed = !item.collapsed;
        }
    };

    that.edit_mode = function(force){
        if (that.data.mode !== 'edit' || force) {
            that.data.mode = 'edit';
            self.addClass('grid-stack_mode_edit');
            self.removeClass('grid-stack_mode_view');
            _.each(that.data._private.nodes, function(item) {
                that.expand_widget(item, item._widget,false);
                item._widget.data('resizable', false);
                // buttons
                var buttons = that.get(item._el).buttons;
                _.each(buttons, function(b){
                    if (b.mode === 'edit') {
                        b._el.show();
                    }
                    if (b.mode === 'view') {
                        b._el.hide();
                    }
                });
                // header
                if (!item.settings.name && buttons.filter(function(b){ return b.mode === 'edit'; }).length === 0) {
                    item._widget.find('.f-widget__header').hide();
                } else {
                    item._widget.find('.f-widget__header').show();
                }
            });
            that.enable();
            that.resize();
        }
    };
    that.view_mode = function(force){
        if (that.data.mode !== 'view' || force) {
            that.data.mode = 'view';
            self.addClass('grid-stack_mode_view');
            self.removeClass('grid-stack_mode_edit');
            _.each(that.data._private.nodes, function(item) {
                item.height = that.get(item._el).height;
                item._widget.data('resizable', true);
                // expand, collapse
                if (item.collapsed) {
                    that.collapse_widget(item, item._widget, false);
                } else {
                    that.expand_widget(item, item._widget, false);
                }
                // buttons
                var buttons = that.get(item._el).buttons;
                _.each(buttons, function(b){
                    if (b.mode === 'edit') {
                        b._el.hide();
                    }
                    if (b.mode === 'view') {
                        b._el.show();
                    }
                });
                // header
                if (!item.settings.name && buttons.filter(function(b){ return b.mode === 'view'; }).length === 0) {
                    item._widget.find('.f-widget__header').hide();
                } else {
                    item._widget.find('.f-widget__header').show();
                }
            });
            that.disable();
            that.resize();
        }
    };

    that.add_widget = function(item, callback){
        that.load_widget(item);
        if (typeof callback == "function") {
            var data = $.extend(true, {}, item);
            _.unset(data, '_widget');
            _.unset(data, '_el');
            callback(data);
        }
    };
    that.remove_widget = function(_id, callback){
        var item = that.data._private.nodes.filter(function(d){ return d._id === _id; });
        if (item.length > 0) { item = item[0]; }
        that.data._private.grid.removeWidget(item._el);
        that.data._private.nodes = that.data._private.nodes.filter(function(d){ return d._id !== item._id; });
        if (typeof callback == "function") { callback(item); }
    };
    that.update_widget = function(_id, x, y, width, height, callback){
        var item = that.data._private.nodes.filter(function(d){ return d._id === _id; });
        if (item.length > 0) { item = item[0]; }
        that.data._private.grid.update(item._el, x, y, width, height);
        if (typeof callback == "function") { callback(item); }
    };

    that.create = function(){
        if (self.hasClass('grid-stack')) {
            if (that.data.single) {
                self.addClass('grid-stack_single');
            } else {
                self.addClass('grid-stack_multiple');
            }
            self.gridstack(that.data.grid_options);
            that.data._private.grid = self.data('gridstack');
            window.fDashboards[that.data.id] = that;
            return true;
        } else {
            $.error( 'Container does not have class .grid-stack' );
            return false;
        }
    };
    that.enable = function(){
        that.data.disabled = false;
        that.data._private.grid.enableMove(true, true);
        that.data._private.grid.enableResize(true, true);
    };
    that.disable = function(){
        that.data.disabled = true;
        that.data._private.grid.enableMove(false, true);
        that.data._private.grid.enableResize(false, true);
    };

    that.set = function(el, data){
        $.extend(el.data('_gridstack_node'), data);
    };
    that.get = function(el){
        return el.data('_gridstack_node');
    };

    that.resize = function(){
        _.each(that.data._private.nodes, function(item) {
            if (typeof item._widget.data('resize') === 'function') {
                item._widget.data('resize')(item);
            }
        });
    };
    that.init_resize = function(){
        $(window).on('resize.fs', function(){
            that.resize();
        });
    };
    that.init_window = function(){
        if (!window.fDashboards) {
            window.fDashboards = [];
        }
    };
    that.init = function(){
        that.data.collapsed_widget_height = +fCookie.get('collapsed_widget_height');
        that.init_window();
        if (that.create()) {
            that.load();
            if (that.data.mode === 'view') {
                that.view_mode(true);
            } else {
                that.edit_mode(true);
            }
            that.init_resize();
        }
    };
    that.init();
    return that;
};
