function ToggleClearFilterButton(show) {
    if (show) {
        $('#clearFilterButton').show();
    } else {
        $('#clearFilterButton').hide();
    }
}

function MakeFilterLine(filterArgs) {
    if (!filterArgs) {
        $('#filter-line').hide(); //??
        ToggleClearFilterButton(false);
        return;
    }
    var title = (filterArgs.oper == 'and') ? '' : Globa.AnyFrom.locale();
    for (var i = 0; i < filterArgs.filterItems.length; i++) {
        var item = filterArgs.filterItems[i];
        var filterItem = Enumerable.From(window[viewName].Filters).Where(function (a) {
            return a.fieldName == item.column;
        }).FirstOrDefault();
        if (!filterItem) continue;

        var fieldTitle = filterItem.title;
        var val = item.value;
        if (item.hasOwnProperty('valueTitle'))
            val = item.valueTitle;
        if (val && val.constructor == Date)
            val = Asyst.date.format(val, Asyst.date.defaultDateFormat);
        if (val == null) val = "' '";
        title += '<span class="label">' + fieldTitle + ' <span style="background-color:#7b7b7b; padding: 1px 5px">' + Grid.ExtFilterOper[item.oper].title + '</span> ' + val + '</span> &nbsp;&nbsp';
    }
    $('#filter-line #filter-title').html(title);
    ToggleClearFilterButton(true);
    //временное(?) решение - если флага нет, линию не показываем.
    if (Asyst.Workspace.views[viewName].isExtFilterVisible) {
        $('#filter-line').show();
    }
    if (!Asyst.Workspace.views[viewName].isExtFilterVisible) {
        $('#filter-line>.icon-pencil').hide();
        $('#filter-line>.icon-remove-circle').hide();
    }
    $('.wrapper').resize();
}

function getParamsToFilterArgs(filterParams, indices) {
    var filterArgs = { oper: 'and', filterItems: [] };

    if (filterParams.hasOwnProperty('FilterConsistency') && filterParams.hasOwnProperty('FilterConsistency').toLowerCase() == 'or') {
        filterArgs.oper = 'or';
    }

    var fieldIName = "FieldXName";
    var fieldIValue = "FieldXName";
    var fieldIOperation = "FieldXOperation";

    //массив операций и соответствующих функций проверки
    var operations = {
        Equal: '=',
        GreaterThen: '>',
        LessThen: '<',
        GreaterThenOrEqual: '>=',
        LessThenOrEqual: '<=',
        Like: 'like',
        NotLike: 'notlike',
        Started: 'started',
        NotEqual: '<>'
    };
    var test = true;
    for (var i = 0; i < indices.length; i++) {
        var filterItem = {};
        fieldIName = "Field" + indices[i] + "Name";
        fieldIValue = "Field" + indices[i] + "Value";
        fieldIOperation = "Field" + indices[i] + "Operation";

        filterItem.column = filterParams[fieldIName];
        filterItem.value = filterParams[fieldIValue];

        filterItem.oper = operations.Equal;
        if (!filterParams.hasOwnProperty(fieldIOperation) || operations[filterParams[fieldIOperation]] == undefined)
            filterItem.oper = operations.Equal;
        else
            //если указано - используем из массива операций соответствующую
            filterItem.oper = operations[filterParams[fieldIOperation]];
        filterArgs.filterItems.push(filterItem);
    }
    return filterArgs;
}

function clearGETFilters() {
    var d = Asyst.Utils.splitGETString();

    var indices = Array();
    for (var a in d) {
        var re = /Field(\d+)Name/g;
        var ind = re.exec(a);
        if (ind !== undefined && ind !== null && ind[1] !== undefined)
            indices.push(ind[1]);
    }

    if (indices.length === 0 && !d.hasOwnProperty("extFilters"))
        return location.href;

    for (var i = 0; i < indices.length; i++) {
        delete d["Field" + indices[i] + "Name"];
        delete d["Field" + indices[i] + "Value"];
        delete d["Field" + indices[i] + "Operation"];
    }
    delete d["extFilters"];
    delete d["view"];
    delete d["ExpandGroup"];
    delete d["hideFilterPanel"];
    delete d["ViewSampleId"];

    var newfilterstring = "?";
    var first = true;
    for (var c in d) {
        newfilterstring += (first ? "" : "&") + c + "=" + d[c];
        first = false;
    }

    return location.protocol + "//" + location.host + location.pathname + (first ? "" : newfilterstring) + location.hash;
}

function clearAllFilters() {
    window[viewName].QuickFilterClear();
    Grid.ClearExtFilter(window[viewName]);
    ToggleClearFilterButton(false);
    var newhref = clearGETFilters();
    if (newhref != location.href) {
        location.href = newhref;
    }
}

function restoreDatesInFilterArgs(args, columns) {
    for (var ctx in args.filterItems) {
        var item = args.filterItems[ctx];
        for (var i in columns) {
            var subitem = columns[i];
            if ((subitem.kind == "date" || subitem.kind == "datetime") && subitem.field == item.column) {
                var newValue = new Date(item.value);
                if (!isNaN(newValue))
                    item.value = newValue;
            }
        }
    }
    return args;
}

function filterDataByGET(data, columns) {
    var filterParams = Asyst.Utils.splitGETString();

    if (filterParams.hasOwnProperty('extFilters')) {
        var par = JSON.parse(decodeURIComponent(filterParams.extFilters));
        if (columns === null && columns === undefined)
            columns = Asyst.Workspace.currentView.Columns;
        return restoreDatesInFilterArgs(par, columns);
    }
    //определяем, какие индексы засунули в строку параметров
    var indices = Array();
    for (var a in filterParams) {
        var re = /Field(\d+)Name/g;
        var ind = re.exec(a);
        if (ind !== undefined && ind !== null && ind[1] !== undefined)
            indices.push(ind[1]);
    }
    if (indices.length === 0)
        return;

    //выполняем подмены в значениях шаблонов
    var user = Asyst.Workspace.currentUser;
    for (var d in filterParams) {
        filterParams[d] = decodeURIComponent(filterParams[d]);
        filterParams[d] = filterParams[d].replace(/\{UserAccount\}/g, user.Account);
        filterParams[d] = filterParams[d].replace(/\{UserId\}/g, user.Id);
        filterParams[d] = filterParams[d].replace(/\{CurrentDate\}/g, Asyst.date.format(new Date()));
    }

    return getParamsToFilterArgs(filterParams, indices);
}

//готовит строку как like-условие sql в regexp представление js
function likeStringToJS(value) {
    var result = value;
    result = result.replace(/%/gi, '.*');
    result = result.replace(/\?/gi, '\\?');
    return result.replace(/%/gi, '.');
}



//проверяет, подходит ли строка dataRow под условия filterParams с индексаторами indices
function filterDataRow(dataRow, filterParams, indices) {

    if (indices === undefined || indices === null || indices.length === 0 || filterParams === undefined || filterParams === null)
        return true;

    var fieldIName = "FieldXName";
    var fieldIValue = "FieldXName";
    var fieldIOperation = "FieldXOperation";

    //массив операций и соответствующих функций проверки
    var operations = {
        Equal: function (x, y) {
            if (x instanceof Date) return x.valueOf() == y.valueOf();
            else return x == y;
        },
        GreaterThen: function (x, y) {
            return x > y;
        },
        LessThen: function (x, y) {
            return x < y;
        },
        GreaterThenOrEqual: function (x, y) {
            return x >= y;
        },
        LessThenOrEqual: function (x, y) {
            return x <= y;
        },
        Like: function (x, y) {
            return RegExp(likeStringToJS(y), 'gi').test(x);
        },
        NotLike: function (x, y) {
            return !RegExp(likeStringToJS(y), 'gi').test(x);
        }
    };
    var test = true;
    for (var i = 0; i < indices.length; i++) {
        fieldIName = "Field" + indices[i] + "Name";
        fieldIValue = "Field" + indices[i] + "Value";
        fieldIOperation = "Field" + indices[i] + "Operation";

        // если массив содержит переменную с нужным именем, проверям её
        if (dataRow.hasOwnProperty(filterParams[fieldIName])) {
            var testvalue = dataRow[filterParams[fieldIName]];
            var paramvalue = filterParams[fieldIValue];//decodeURIComponent(filterParams[fieldIValue]);
            //если значение - дата, то приводим текст из запроса в объект типа дата
            if (testvalue instanceof Date) {
                paramvalue = Asyst.date.parse(paramvalue);
                paramvalue.setHours(testvalue.getHours(), testvalue.getMinutes(), testvalue.getSeconds(), testvalue.getMilliseconds());
            }
            //если имя операции не указано или мы такое не знаем, вызываем Equal
            if (!filterParams.hasOwnProperty(fieldIOperation) || operations[filterParams[fieldIOperation]] == undefined)
                test = operations.Equal(testvalue, paramvalue);
            //если указано - вызываем из массива операций соответствующую
            else
                test = operations[filterParams[fieldIOperation]](testvalue, paramvalue);

            //если строка не прошла проверку - возвращаем false, иначе - продолжаем
            if (!test)
                return false;
        }

    }
    return true;
}

function menuChangeView(newViewName, newViewTitle) {
    if (window[viewName])
        window[viewName].saveCurrentSample();
    viewName = newViewName;
    showBrowser('#view', newViewName);
    $('#viewSelectBtn').text(newViewTitle);
}

function ViewClick(view, item, column, event) {
    var entity = Asyst.Workspace.views[viewName].entity;
    if (column.id === '_like_selector') return;

    if (entity && Asyst.Workspace.views[viewName].isViewProcessLink) {
        if (column && column.hasOwnProperty('url') && column.url)
            return;
        var loc = window.location.href;
        if (loc[loc.length - 1] == '#')
            loc = loc.substring(0, loc.length - 1);
        loc = removeURLParameter(loc, 'extFilters');
        var resPath = saveTabAndLink('/' + Asyst.Workspace.views[viewName].entity.name + '/form/auto/' + item[Asyst.Workspace.views[viewName].entity.idName]);
        var fArgs = window[viewName].DataView.getFilterArgs();
        if (fArgs.hasOwnProperty('oper')) {
        }
        if (event && /*event.hasOwnProperty('ctrlKey') &&*/ event.ctrlKey === true) {
            var c = window.open(resPath);
        } else {
            window.location.href = resPath;
        }
    }
}

function showBrowser(selector, viewName, viewSampleId) {
    var saveTitle = '';
    if (window.hasOwnProperty('views') && views.hasOwnProperty(viewName) && views[viewName].hasOwnProperty('title'))
        saveTitle = views[viewName].title;
    Asyst.API.AdminTools.saveStats({ page: location.href, pageTitle: saveTitle, type: 'view', action: 'open' }, true);
    Asyst.Workspace.CurrentViewName = viewName;

    var view;
    var viewEl = $(selector);

    var expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    setPageCookie("CurrentViewName", viewName, expires);

    //Loader.show(selector);
    Loader.show();

    var params = $.extend(Asyst.Utils.splitGETString(), null);
    if (!params.hasOwnProperty('viewSampleId'))
        params.viewSampleId = viewSampleId;
    else if (params.viewSampleId == 'null') params.viewSampleId = null;

    var successLoadView = function(data) {
        var filterArgs = filterDataByGET(data, data.columns);
        if ((filterArgs === undefined || filterArgs === null) && data.viewSample && data.viewSample.hasOwnProperty('filterArgs')) {
            filterArgs = data.viewSample.filterArgs;
            restoreDatesInFilterArgs(filterArgs, data.columns);
        }

        for (var colIdx in data.columns) {
            var column = data.columns[colIdx];
            if (column.formatter)
                column.formatter = eval(column.formatter);
            else if (column.url)
                column.formatter = Grid.LinkFormatter;
            else
                column.formatter = Grid.DefaultFormatter;
        }


        viewEl[0].innerHtml = "";

        if (viewEl.height() === 0) {
            try {
                var cont = $('#s4-bodyContainer');
                var resizeContainer = function (event) {
                    var hasScroll = false;
                    var widthScroll = 0;

                    for (var el = viewEl; !hasScroll && el.length > 0; el = el.parent()) {
                        var sw = el[0].scrollWidth, ow = el[0].offsetWidth;

                        if (sw != ow) {
                            hasScroll = true;
                            widthScroll = el[0].offsetHeight - el[0].clientHeight;
                        }
                    }

                    viewEl.height($(window).height() - viewEl.offset().top - 3 - widthScroll);
                    if (grid)
                        grid.resizeCanvas();
                };

                $(window).resize(resizeContainer);
                $(window).resize();

            } catch (error) {
            }
        }

        var options = {
            forceFitColumns: Asyst.Workspace.views && Asyst.Workspace.views[viewName] && Asyst.Workspace.views[viewName].isFullWidthScreen,
            enableCellNavigation: false,
            editable: false,
            autoHeight: false,
            doClick: true,
            wideString: Asyst.Workspace.views && Asyst.Workspace.views[viewName] && Asyst.Workspace.views[viewName].isWideString,
            initiallyCollapsed: Asyst.Workspace.views && Asyst.Workspace.views[viewName] && Asyst.Workspace.views[viewName].isInitiallyCollapsed,
            rowSelectionModel: new Asyst.RowSelectionModel({ selectActiveRow: false }),
            multiColumnSort: true,
            columnPicker: {
                forceFitTitle: 'Во всю ширину экрана',
                hideSyncResizeButton: true
            }

        };

        //todo replace
        if (Asyst.Workspace.views && Asyst.Workspace.views[viewName] && Asyst.Workspace.views[viewName].hasOwnProperty('preprocessFunction'))
            Asyst.Workspace.views[viewName].preprocessFunction(viewEl, data.data, data.columns, options, data.groups);

        if (data.EditFormName) {
            viewEl.css("overflow", "hidden");
            view = Asyst.Models.EditableView.EditableGrid.create(viewEl, data.data, data.columns, data.EditFormName, data.KeyName, data.EntityName);
        } else {
            view = Grid.Create(viewEl, viewName, data, options, params);

            var grid = view.Grid;
            var dataView = view.DataView;

            if (options.doClick) {
                grid.onClick.subscribe(function (e, args) {
                    var cell = grid.getCellFromEvent(e);
                    if (cell) {
                        var item = grid.getDataItem(cell.row);
                        if (item.__nonDataRow) return;
                        var column = grid.getColumns()[cell.cell];
                        ViewClick(dataView, item, column, e);
                    }
                });
            }
        }

        window[viewName] = view;

        if (!window['views'] || !views.hasOwnProperty(viewName) || !Asyst.Workspace.views[viewName].isEditable)
            $('#menuItemAdd').hide();
        else
            $('#menuItemAdd').show();

        if (Asyst.Workspace.views && Asyst.Workspace.views[viewName] && Asyst.Workspace.views[viewName].isExtFilterVisible)
            $('.ext-filter-menu').show();
        else
            $('.ext-filter-menu').hide();


        $('#BrowseSearch').off().keyup(window[viewName].QuickFilterKeyup);
        $('.search-clear').off().click(window[viewName].QuickFilterClear);
        if (Asyst.Workspace.views && Asyst.Workspace.views[viewName] && Asyst.Workspace.views[viewName].isInitiallyCollapsed) {
            window[viewName].CollapseAllGroups();
        }

        if (params.hasOwnProperty("ExpandGroup"))
            if (params.ExpandGroup == "true")
                view.ExpandAllGroups();
            else
                view.CollapseAllGroups();

        var needInvalidate = false;

        if (filterArgs && filterArgs.hasOwnProperty('oper')) {
            view.DataView.setFilter(Grid.ExtFilter);
            filterArgs = $.extend(filterArgs, { gridView: view });
            view.DataView.setFilterArgs(filterArgs);
            view.DataView.refresh();
            needInvalidate = true;
            //$('#BrowseSearchGroup').hide();
            if (!params.hideFilterPanel)
                MakeFilterLine(filterArgs);
            ToggleClearFilterButton(true);
        } else {
            view.QuickFilterClear();
            ToggleClearFilterButton(false);

            !(!!data.EditFormName) && Grid.ClearExtFilter(view);
        }

        if (filterArgs && /*!filterArgs.hasOwnProperty('oper') && */filterArgs.hasOwnProperty('searchString') && filterArgs.searchString !== "") {
            $('#BrowseSearch').val(filterArgs.searchString);
            view.UpdateQuickFilter(filterArgs.searchString);
            ToggleClearFilterButton(true);
            view.DataView.refresh();
            needInvalidate = true;
        }

        if (data.viewSample && data.viewSample.hasOwnProperty('groups')) {
            view.SetGroupsCollapsed(data.viewSample.groups);
            needInvalidate = true;
        }
        if (data.viewSample && data.viewSample.hasOwnProperty('viewport') && data.viewSample.top != -1) {
            view.Grid.scrollRowToTop(data.viewSample.viewport.top);
            needInvalidate = true;
        }

        //восстанавливаем меню.
        if (Asyst.Workspace.views && Asyst.Workspace.views[viewName])
            $('#viewSelectBtn').text(Asyst.Workspace.views[viewName].title);
        if (data.viewSample && data.viewSampleName != null && data.viewSampleName != "")
            $('#viewSampleSelectBtn').text(data.viewSampleName);
        else
            $('#viewSampleSelectBtn').text(Globa.ViewSample.locale());
        view.viewSampleMenuRebuild();

        if (needInvalidate) {
            view.Grid.invalidate();
        }

        //быстрокостыль для нового хрома и ширины реестра
        {
            $('#view').css({ width: '1200px' });
            setTimeout(function () {
                $('#view').css({ width: '100%' });
            }, 100);
        }

        // Отображение tooltip-а в представлении при наведении элементы с атрибутом [title] или [rel="tooltip"]
        $('#view').off('hover.view.tooltip').on('hover.view.tooltip', '[title],[rel="tooltip"]', function (e) {
            var $el = $(e.target);
            var tooltip = $el.data('tooltip');
            if (!tooltip) {
                $el.tooltip({ container: 'BODY', html: true });

                $('.tooltip.in').remove();// Скрываем все "Замороженные" tooltips, которые отображались для уже скрывшихся элементов
                $el.data('tooltip').show();
            }
        });

        Loader.hide();
    };

    Asyst.API.View.load({
        viewName: viewName,
        data: params,
        success: function (dataView) {
            if (dataView.UseSamples) {
                Asyst.API.ViewSample.load({
                    viewName: viewName,
                    data: { Id: params.viewSampleId },
                    success: function (dataViewSample) {
                        if (dataViewSample != undefined) {
                            dataView.viewSample = dataViewSample.Sample;
                            dataView.viewSampleName = dataViewSample.Name;
                        }
                        successLoadView(dataView);
                    },
                    error: function () {
                        Loader.hide();
                    }
                });
            }
            else {
                successLoadView(dataView);
            }
        },
        error: function () {
            Loader.hide();
        },
        async: true
    });
}

function ViewExport(viewName, result) {
    function colorNameToHexExcel(color) {

        var colors = {
            "aliceblue": "#f0f8ff",
            "antiquewhite": "#faebd7",
            "aqua": "#00ffff",
            "aquamarine": "#7fffd4",
            "azure": "#f0ffff",
            "beige": "#f5f5dc",
            "bisque": "#ffe4c4",
            "black": "#000000",
            "blanchedalmond": "#ffebcd",
            "blue": "#0000ff",
            "blueviolet": "#8a2be2",
            "brown": "#a52a2a",
            "burlywood": "#deb887",
            "cadetblue": "#5f9ea0",
            "chartreuse": "#7fff00",
            "chocolate": "#d2691e",
            "coral": "#ff7f50",
            "cornflowerblue": "#6495ed",
            "cornsilk": "#fff8dc",
            "crimson": "#dc143c",
            "cyan": "#00ffff",
            "darkblue": "#00008b",
            "darkcyan": "#008b8b",
            "darkgoldenrod": "#b8860b",
            "darkgray": "#a9a9a9",
            "darkgreen": "#006400",
            "darkkhaki": "#bdb76b",
            "darkmagenta": "#8b008b",
            "darkolivegreen": "#556b2f",
            "darkorange": "#ff8c00",
            "darkorchid": "#9932cc",
            "darkred": "#8b0000",
            "darksalmon": "#e9967a",
            "darkseagreen": "#8fbc8f",
            "darkslateblue": "#483d8b",
            "darkslategray": "#2f4f4f",
            "darkturquoise": "#00ced1",
            "darkviolet": "#9400d3",
            "deeppink": "#ff1493",
            "deepskyblue": "#00bfff",
            "dimgray": "#696969",
            "dodgerblue": "#1e90ff",
            "firebrick": "#b22222",
            "floralwhite": "#fffaf0",
            "forestgreen": "#228b22",
            "fuchsia": "#ff00ff",
            "gainsboro": "#dcdcdc",
            "ghostwhite": "#f8f8ff",
            "gold": "#ffd700",
            "goldenrod": "#daa520",
            "gray": "#808080",
            "green": "#008000",
            "greenyellow": "#adff2f",
            "honeydew": "#f0fff0",
            "hotpink": "#ff69b4",
            "indianred ": "#cd5c5c",
            "indigo": "#4b0082",
            "ivory": "#fffff0",
            "khaki": "#f0e68c",
            "lavender": "#e6e6fa",
            "lavenderblush": "#fff0f5",
            "lawngreen": "#7cfc00",
            "lemonchiffon": "#fffacd",
            "lightblue": "#add8e6",
            "lightcoral": "#f08080",
            "lightcyan": "#e0ffff",
            "lightgoldenrodyellow": "#fafad2",
            "lightgrey": "#d3d3d3",
            "lightgreen": "#90ee90",
            "lightpink": "#ffb6c1",
            "lightsalmon": "#ffa07a",
            "lightseagreen": "#20b2aa",
            "lightskyblue": "#87cefa",
            "lightslategray": "#778899",
            "lightsteelblue": "#b0c4de",
            "lightyellow": "#ffffe0",
            "lime": "#00ff00",
            "limegreen": "#32cd32",
            "linen": "#faf0e6",
            "magenta": "#ff00ff",
            "maroon": "#800000",
            "mediumaquamarine": "#66cdaa",
            "mediumblue": "#0000cd",
            "mediumorchid": "#ba55d3",
            "mediumpurple": "#9370d8",
            "mediumseagreen": "#3cb371",
            "mediumslateblue": "#7b68ee",
            "mediumspringgreen": "#00fa9a",
            "mediumturquoise": "#48d1cc",
            "mediumvioletred": "#c71585",
            "midnightblue": "#191970",
            "mintcream": "#f5fffa",
            "mistyrose": "#ffe4e1",
            "moccasin": "#ffe4b5",
            "navajowhite": "#ffdead",
            "navy": "#000080",
            "oldlace": "#fdf5e6",
            "olive": "#808000",
            "olivedrab": "#6b8e23",
            "orange": "#ffa500",
            "orangered": "#ff4500",
            "orchid": "#da70d6",
            "palegoldenrod": "#eee8aa",
            "palegreen": "#98fb98",
            "paleturquoise": "#afeeee",
            "palevioletred": "#d87093",
            "papayawhip": "#ffefd5",
            "peachpuff": "#ffdab9",
            "peru": "#cd853f",
            "pink": "#ffc0cb",
            "plum": "#dda0dd",
            "powderblue": "#b0e0e6",
            "purple": "#800080",
            "red": "#ff0000",
            "rosybrown": "#bc8f8f",
            "royalblue": "#4169e1",
            "saddlebrown": "#8b4513",
            "salmon": "#fa8072",
            "sandybrown": "#f4a460",
            "seagreen": "#2e8b57",
            "seashell": "#fff5ee",
            "sienna": "#a0522d",
            "silver": "#c0c0c0",
            "skyblue": "#87ceeb",
            "slateblue": "#6a5acd",
            "slategray": "#708090",
            "snow": "#fffafa",
            "springgreen": "#00ff7f",
            "steelblue": "#4682b4",
            "tan": "#d2b48c",
            "teal": "#008080",
            "thistle": "#d8bfd8",
            "tomato": "#ff6347",
            "turquoise": "#40e0d0",
            "violet": "#ee82ee",
            "wheat": "#f5deb3",
            "white": "#ffffff",
            "whitesmoke": "#f5f5f5",
            "yellow": "#ffff00",
            "yellowgreen": "#9acd32"
        };

        return (colors[color.toLowerCase()] || color).toUpperCase();

    }

    function createWorkbook(title, data, columns, groups) {
        var sheet = {
            title: 'Лист 1',
            columns: [],
            rows: []
        };
        var workbook = new kendo.ooxml.Workbook({
            sheets: [sheet]
        });

        var header = { cells: [] };
        var div = $('<div/>');
        for (var c = 0; c < columns.length; c++) {
            var text = columns[c].name;

            //sheet.columns.push({ autoWidth: true });
            sheet.columns.push({ width: Math.min(400, Math.max(20, columns[c].width)), autoWidth: !columns[c].width });
            header.cells.push({ value: (div.html(text).text()), bold: true });
        }

        //Group column titles 
        for (var groupNumber = 0; groupNumber < groups.length; groupNumber++) {

            sheet.columns.push({ width: 250 });

            var grp = groups[groupNumber];

            header.cells.push({ value: grp.title || '', bold: true });

        }

        sheet.rows.push(header);

        sheet.filter = { from: 0, to: sheet.columns.length - 1 };

        var row = { cells: [] };
        var cell = {};
        //А теперь пройдемся по всем данным
        for (var i = 0; i < data.length; i++) {
            row = { cells: [] };
            sheet.rows.push(row);

            for (var c = 0; c < columns.length; c++) {
                var item = data[i][columns[c].field];

                cell = { wrap: true };
                row.cells.push(cell);
                cell.value = item === null || item === undefined ? '' : item;

                /*Форматирование не применяем, потому что у экселя свои форматы*/
                //if (columns[c].format)
                //    cell.z = columns[c].format;

                if (columns[c].id.indexOf('Id') > 0 && data[i][columns[c].id.replace('Id', 'Title')]) { //Зашьём логику для индикаторов
                    var indicatorName = columns[c].id.replace('Id', ''); //если в представлении много индикаторов - обработаем их по отдельности.
                    var indicatorColor = data[i][indicatorName + 'Color'];
                    var indicatorTitle = data[i][indicatorName + 'Title'];

                    if (indicatorColor)
                        cell.background = colorNameToHexExcel(indicatorColor);
                    if (indicatorTitle)
                        cell.value = indicatorTitle;

                    cell.wrap = false;
                }
                /*Толку от этого в экселе нет. Либо там картинка, которую нельзя вставить в ячейку, либо там форматированный текст,
                 который тоже сложно в таком формате вставить в ячейку, просто вытащим title, alt или чистый текст*/
                else if (columns[c].expression) {
                    try {
                        with (data[i]) {
                            var value = eval(columns[c].expression);

                            if (value !== null && value !== undefined) {

                                if (value.toString().indexOf('<') > -1) { //Это html - его надо преобразовать в простой текст
                                    var val = $(value);

                                    value = val.attr('title') || val.attr('alt') || val.text();
                                    if (value) {
                                        cell.value = value.toString();
                                    }
                                }
                                else {
                                    cell.value = value;
                                }
                            }
                        }
                    } catch (error) {

                    }
                }
                else if (typeof cell.value === 'boolean') {
                    cell.value = cell.value ? Globa.Yes.locale() : Globa.No.locale();
                }
            }

            for (var j = 0; j < groups.length; j++) {
                var item = data[i][groups[j].name];

                row.cells.push({ value: item || '' });
            }

        }
        return workbook;
    }


    var columns = result.columns;
    var data = result.data;
    var groups = result.groups || [];

    if ((columns[0] !== undefined) && columns[0].id === "_checkbox_selector") //Пропустим первую колонку с галочками, если она есть.
        columns = columns.slice(1);

    if ((columns[columns.length - 1] !== undefined) && columns[columns.length - 1].id === "_like_selector") //Пропустим последнюю колонку с лайками, если она есть.
        columns = columns.slice(0, columns.length - 1);



    var workbook = createWorkbook(viewName, data, columns, groups);
 
    workbook.toDataURLAsync()
        .then(function (dataURL) {
            kendo.saveAs({
                dataURI: dataURL,
                fileName: viewName + ' ' + Asyst.date.format(new Date(), 'yyyyMMdd-HHmm') + ".xlsx"
            });
        })
        .catch(function (e) { console.error(e); });
}