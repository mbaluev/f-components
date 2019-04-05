var GridBoard = function(options){
    var that = this._gridboard = {};
    that.data = {
        title: null,
        margin: true,
        loader: null,
        defaults: {
            itemWidth: 3,
            itemHeight: 3,
            x: 0,
            y: 0,
            categoryId: 0
        },
        collapsed_widget_height: 1,
        extraHeaderRenderer: null,
        filters: [],
        items: [],
        data: [],
        grid: null

        /*
        [
            {
                id: '1',
                type: 'radio',
                fieldName: 'category1',
                items: [
                    {
                        id: 1,
                        name: 'name',
                        color: '#333'
                    }
                ]
            },
            {
                id: '2',
                type: 'select',
                fieldName: 'category2',
                items: []
            },
            {
                id: '3',
                type: 'input',
                fieldName: 'title'
            }
        ]
        */
    };
    that.data = $.extend(true, {}, that.data, options);
    that.data._el = {
        target: $('#' + that.data.containerid).css({ height: '100%' }),

        radio_group: $('<span class="radio-group radio-group_type_buttons"></span>'),
        select: $('<select class="select" data-fc="select" data-width="200"></select>'),
        input: $([
            '<span class="input input__has-clear" data-width="200">',
            '<span class="input__box">',
            '<span class="alertbox" data-fc="alertbox">',
            '<span class="icon icon_svg_search"></span>',
            '</span>',
            '<input type="text" class="input__control">',
            '<button class="button" type="button" data-fc="button">',
            '<span class="icon icon_svg_close"></span>',
            '</button>',
            '</span>',
            '</span>'
        ].join('')),
        filters: [],

        card: $('<div class="card"></div>'),
        card__header: $('<div class="card__header"></div>'),
        card__header_row: $('<div class="card__header-row card__header-row_wrap card__header-column_start"></div>'),
        card__header_column: $('<div class="card__header-column"></div>'),
        card__main: $([
            '<div class="card__main">',
            '<div class="card__middle">',
            '<div class="card__middle-scroll">',
            '</div>',
            '</div>',
            '</div>'
        ].join('')),

        widget_grid: $('<div class="widget-grid grid-stack" data-gs-animate="true"></div>'),
        loader: $('<span class="spinner spinner_align_center"></span>')
    };

    that.render = function(){
        that.data._el.target.empty();
        that.data._el.target.append(
            that.data._el.card
        );
        that.render_card_header();
        that.render_card_main();
    };
    that.render_card_header = function(){
        if (typeof that.data.extraHeaderRenderer == 'function' || that.data.filters) {
            that.data._el.card.append(
                that.data._el.card__header.append(
                    that.data._el.card__header_row
                )
            );
        }
        if (typeof that.data.extraHeaderRenderer == 'function') {
            that.data._el.card__header_row.append(
                that.data._el.card__header_column.clone().append(
                    that.data.extraHeaderRenderer()
                )
            );
        }
        if (that.data.filters) {
            if (typeof that.data.filters == 'object' && that.data.filters.length > 0) {
                that.render_filters();
            }
        }
    };
    that.render_card_main = function(){
        that.data._el.card.append(
            that.data._el.card__main
        );
    };

    that.render_filters = function(){
        that.data.filters.forEach(function(filter){
            if (filter.type == 'radio') {
                that.render_filter_radio(filter);
            }
            if (filter.type == 'select') {
                that.render_filter_select(filter);
            }
            if (filter.type == 'input') {
                that.render_filter_input(filter);
            }
        });
        that.filter_items();
    };
    that.render_filter_radio = function(filter){
        filter.value = 0;
        filter.elem = that.data._el.radio_group.clone();
        filter.elem.append($([
            '<label class="radio radio_type_button" data-fc="radio" data-checked="true">',
            '<button class="button button_toggable_radio" type="button" data-fc="button" data-checked="true">',
            '<span class="button__text">Все</span>',
            '</button>',
            '<input class="radio__input" type="radio" value="0" hidden/>',
            '</label>'
        ].join('')));
        if (filter.items) {
            filter.items.forEach(function(filter_item){
                filter.elem.append($([
                    '<label class="radio radio_type_button" data-fc="radio" data-tooltip="' + filter_item.name + '">',
                    '<button class="button button_toggable_radio" type="button" data-fc="button">',
                    '<span class="button__text">' + filter_item.name + '</span>',
                    '<span class="icon">',
                    '<span class="icon icon__circle" style="background-color: ' + filter_item.color + '"></span>',
                    '</span>',
                    '</button>',
                    '<input class="radio__input" type="radio" name="radio-group-button" value="' + filter_item.id + '" hidden/>',
                    '</label>'
                ].join('')));
            });
        }
        that.data._el.card__header_row.append(
            that.data._el.card__header_column.clone().append(
                filter.elem
            )
        );
        filter.elem.radio_group();
        filter.elem.find('[data-fc="radio"]').on('click', function(){
            filter.value = +$(this).radio_group('value');
            that.filter_items();
        });
    };
    that.render_filter_select = function(filter){
        filter.value = 0;
        filter.elem = that.data._el.select.clone();
        if (filter.items) {
            filter.items.forEach(function(filter_item){
                filter.elem.append(
                    $('<option value="' + filter_item.id + '" ' + (filter_item.selected ? 'selected' : '') + '>' + filter_item.name + '</option>')
                );
            });
        }
        that.data._el.card__header_row.append(
            that.data._el.card__header_column.clone().append(
                filter.elem
            )
        );
        filter.elem.select({
            mode: filter.mode || 'radio-check'
        });
        filter.elem.on('change', function(){
            var value = $(this).select('value');
            if (typeof value == 'object') {
                if (value) {
                    filter.value = value.map(function(d){ return +d; });
                } else {
                    filter.value = 0;
                }
            } else {
                filter.value = +value;
            }
            that.filter_items();
        })

    };
    that.render_filter_input = function(filter){
        filter.value = '';
        filter.timer = null;
        filter.elem = that.data._el.input.clone();
        filter.elem.on('keyup', function(){
            clearTimeout(filter.timer);
            filter.value = filter.elem.input('value');
            filter.timer = setTimeout(function(){
                that.filter_items();
            }, 300);
        });
        that.data._el.card__header_row.append(
            that.data._el.card__header_column.clone().append(
                filter.elem
            )
        );
        filter.elem.input();
    };

    that.render_grid = function(){
        var widget_grid_options = {
            items: that.data.data,
            margin: that.data.margin,
            loader: that.data.loader,
            collapsed_widget_height: that.data.collapsed_widget_height
        };
        that.data._el.card__main.closestChild('.card__middle-scroll').append(that.data._el.widget_grid);
        that.data.grid = that.data._el.widget_grid.widget_grid(widget_grid_options);
    };
    that.render_items = function(){
        that.data.items.forEach(function(item, i){
            item.visible = true;
            item.collapsed = (item.collapsed ? true : false);
            item.categoryIds = item.categoryIds || [];
            that.add_item(item);
            that.data.defaults.x += that.data.defaults.itemWidth;
            if (that.data.defaults.x >= 12) {
                that.data.defaults.x = 0;
                that.data.defaults.y += that.data.defaults.itemHeight;
            }
        });
        that.data.grid.widget_grid('view_mode');
    };

    that.remove_items = function(){
        that.data.data = [];
        that.data.defaults.x = 0;
        that.data.defaults.y = 0;
        that.data.grid.widget_grid('clear');
    };
    that.remove_item = function(item){
        item.visible = false;
        item.collapsed = $('#' + item.id).data().collapsed;
        that.data.grid.widget_grid('remove_widget', item.id);
        that.data.data = that.data.data.filter(function(d){ return d._id != item.id; });
    };
    that.add_item = function(item){
        item.visible = true;
        var dataitem = {
            x: that.data.defaults.x,
            y: that.data.defaults.y,
            width: that.data.defaults.itemWidth,
            height: that.data.defaults.itemHeight,
            settings: $.extend(true, {}, item, {
                id: item.id,
                name: item.name,
                buttons: item.buttons,
                collapsed: item.collapsed,
                contentFormatter: that.data.contentFormatter
            })
        };
        that.data.data.push(dataitem);
        that.data.grid.widget_grid('add_widget', dataitem);
    };
    that.update_item = function(item){
        that.data.grid.widget_grid(
            'update_widget',
            item.id,
            that.data.defaults.x,
            that.data.defaults.y,
            that.data.defaults.itemWidth,
            that.data.defaults.itemHeight
        );
    };

    that.filter_items = function(){
        that.loader_add();
        $('body').tooltip('clear');
        setTimeout(function(){
            that.data.defaults.x = 0;
            that.data.defaults.y = 0;
            that.data.items.forEach(function(item){
                var _filtered = true;
                that.data.filters.forEach(function(filter){
                    var _filtered_item = true;
                    if (filter.type == 'radio') {
                        _filtered_item = that.filter_items_radio(item, filter);
                    }
                    if (filter.type == 'select') {
                        _filtered_item = that.filter_items_select(item, filter);
                    }
                    if (filter.type == 'input') {
                        _filtered_item = that.filter_items_input(item, filter);
                    }
                    if (!_filtered_item) {
                        _filtered = false;
                    }
                });
                if (_filtered) {
                    if (!item.visible) {
                        that.add_item(item);
                    } else {
                        that.update_item(item);
                    }
                    that.data.defaults.x += that.data.defaults.itemWidth;
                    if (that.data.defaults.x >= 12) {
                        that.data.defaults.x = 0;
                        that.data.defaults.y += that.data.defaults.itemHeight;
                    }
                } else {
                    if (item.visible) {
                        that.remove_item(item);
                    }
                }
            });
            that.data.grid.widget_grid('view_mode');
            that.loader_remove();
        }, 100);
    };
    that.filter_items_radio = function(item, filter){
        return (item[filter.fieldName] == filter.value || filter.value == 0);
    };
    that.filter_items_select = function(item, filter){
        if (typeof filter.value == 'object') {
            var _filtered = false;
            filter.value.forEach(function(fvalue){
                if (item[filter.fieldName] == fvalue || fvalue == 0) {
                    _filtered = true;
                }
            });
            return _filtered;
        } else {
            return (item[filter.fieldName] == filter.value || filter.value == 0);
        }
    };
    that.filter_items_input = function(item, filter){
        return (item[filter.fieldName].toLowerCase().indexOf(filter.value.toLowerCase()) >= 0);
    };

    that.loader_add = function(){
        that.data._el.target.before(that.data._el.loader)
    };
    that.loader_remove = function(){
        that.data._el.loader.remove();
    };

    that.init = function(){
        that.loader_add();
        setTimeout(function(){
            that.render();
            //that.render_filters();
            that.render_grid();
            that.render_items();
            //that.init_components();
            //that.bind();
            that.loader_remove();
        }, 100);
    };
    that.init();
    return that;
};
