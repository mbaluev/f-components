if (!Asyst) {
    Asyst = {};
}

(function () {
    'use strict';
    if (!Asyst.globalSearch) {
        Asyst.globalSearch = {};
    }
    if (typeof Asyst.globalSearch.quick !== 'function') {
        Asyst.globalSearch.quick = function (params) {
            Asyst.API.Search.find({
                keyword: params.keyword,
                type: 'Entity',
                success: successRender,
                error: params.error
            });
            function successRender(data) {
                params.success();
                var that = params.elem;
                if (!jQuery.isArray(data.items)) {
                    that.render_error(Globa.RecordNotFound.locale());
                } else {
                    if (data.items.length > 0) {
                        var table = $('<table class="f-table"></table>');
                        var tbody = $('<tbody></tbody>');
                        var tr = $('<tr></tr>');
                        var td = $('<td></td>');
                        var a = $('<a class="f-link"></a>');
                        data.items.map(function (d) {
                            if (d.hasOwnProperty('__type__') && (d.__type__ === 'filesearch' || d.__type__ === 'documentsearch')) {
                                tbody.append(
                                    tr.clone().append(
                                        td.clone().addClass('f-table-td_color_grey').css({ 'white-space': 'nowrap' }).text('Файл'),
                                        td.clone().append(
                                            a.clone().text(d.name)
                                                .attr('href', d.url)
                                                .attr('target', '_blank')
                                        )
                                    )
                                );
                            } else {
                                tbody.append(
                                    tr.clone().append(
                                        td.clone().addClass('f-table-td_color_grey').css({ 'white-space': 'nowrap' }).text(d.entityTitle),
                                        td.clone().append(
                                            a.clone().text(d.name)
                                                .attr('href', '/' + d.url + '?mode=view&back' + encodeURIComponent(location.href))
                                                .attr('target', '_blank')
                                        )
                                    )
                                );
                            }
                        });
                        that.data._el.search__body.empty().append(table.append(tbody));
                    } else {
                        that.render_error(Globa.RecordNotFound.locale());
                    }
                }
            }
        };
    }
}());