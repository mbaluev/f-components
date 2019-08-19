var Grid = {};

Grid.Create = function (element, viewName, viewData, options, dataParams) {
    var gridView = { viewName: viewName };
    element.empty();

    var data = viewData.data,
        entityName = viewData.EntityName,
        keyName = viewData.KeyName,
        entityTitle = viewData.EntityTitle,
        columns = viewData.columns,
        groups = viewData.groups,
        filters = viewData.filters,
        viewSample = viewData.viewSample;

        gridView.EntityId = viewData.EntityId;
        gridView.EntityName = viewData.EntityName;
        gridView.KeyName = viewData.KeyName;

    gridView.title = entityTitle;
    gridView.entityName = entityName;

    gridView.CollapseAllGroups = function () {
        gridView.DataView.collapseAllGroups()
    };

    gridView.ExpandAllGroups = function () {
        gridView.DataView.expandAllGroups()
    };

    gridView.SetGroupsCollapsed = function (collapsedGroups) {
        /*
         TODO: В новой версии слика нет метода setCollapsedGroups
         */
        ////получаем группы. ходим по группам, если текущая группа в числе свернутых - пихаем её в список и всех её последователей (тупо, но придётся)
        //gridView.DataView.beginUpdate();
        //var originalGroups = gridView.DataView.getGroups();
        ////объект со свернутыми группами, которые нужно будет поставить в датавью
        //var collapsedForDataView = {};


        //var processGroup = function (group) {
        //    if (group && group.hasOwnProperty('value')) {
        //        if (collapsedGroups.hasOwnProperty(crc32(gridView.DataView.getGroupPath(group)))) {
        //            processCollapsedGroup(group);
        //        }
        //        else {
        //            for (var j = 0; j < group.groups.length; j++) {
        //                processGroup(group.groups[j]);
        //            }
        //        }
        //    }
        //};
        //var processCollapsedGroup = function (group) {
        //    collapsedForDataView[gridView.DataView.getGroupPath(group)] = true;
        //    for (var j = 0; j < group.groups.length; j++) {
        //        processCollapsedGroup(group.groups[j]);
        //    }
        //};

        //for (var i = 0; i < originalGroups.length; i++) {
        //    processGroup(originalGroups[i]);
        //}

        //gridView.DataView.setCollapsedGroups(collapsedForDataView);
        //gridView.DataView.endUpdate();
    };

    if (!options) {
        options = {
            enableCellNavigation: true,
            editable: false,
            autoHeight: false
        };
    }
    var checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });

    var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider({ checkboxSelect: true, checkboxSelectPlugin: checkboxSelector });

    var dataView = new Slick.Data.DataView({
        groupItemMetadataProvider: groupItemMetadataProvider,
        inlineFilters: false
    });


    var groupings = [];
    for (var gg in groups) {

        (function (group) {
            groupings.push({
                getter: group.name,
                formatter: function (g) {
                    if (group.expression && g.rows.length) {
                        var title = new Function(Object.keys(g.rows[0]).toString(), "return " + group.expression).apply(null, Object.values(g.rows[0]));
                        return (title || '') + "&nbsp;&nbsp;<span style='color:gray'>(" + g.count + ")</span>";
                    }
                    else
                    return (g.value || '') + "&nbsp;&nbsp;<span style='color:gray'>(" + g.count + ")</span>";
                },
                aggregators: [

                ],
                aggregateCollapsed: true,
                lazyTotalsCalculation: true
            });
        })(groups[gg]);
    }

    dataView.setGrouping(groupings);



    var cols = columns;
    cols.unshift(checkboxSelector.getColumnDefinition());
    var visibleCols = cols;

    if (viewSample) {
        //ширина
        for (var c in cols) {
            if (viewSample.columns.hasOwnProperty(cols[c].id)) {
                cols[c].width = viewSample.columns[cols[c].id].width;
                cols[c].visible = viewSample.columns[cols[c].id].visible;
            }
        }

        //порядок
        var oneCols = Enumerable.From(cols);
        var twoCols = Enumerable.From(viewSample.columns);
        cols = oneCols.OrderBy(function (a) {
            var d = twoCols.Where(function (b) {
                return b.Key == a.id;
            }).SingleOrDefault();
            if (d === undefined || d === null)
                return -1;
            else return Number(d.Value.order);

        }).ToArray();

        visibleCols = Enumerable.From(cols).Where('$.visible==true').ToArray();
    }

    var grid = new Slick.Grid(element, dataView, visibleCols, options);



    $(element).data('slickgrid', grid);


    //var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));
    grid.registerPlugin(groupItemMetadataProvider);

    var columnpicker = new Slick.Controls.ColumnPicker(cols, grid, options);
    if (options.rowSelectionModel)
        grid.setSelectionModel(options.rowSelectionModel);
    grid.registerPlugin(checkboxSelector);

    gridView.DataView = dataView;
    gridView.Grid = grid;
    gridView.Data = data;
    gridView.Columns = cols;
    gridView.Options = options;
    gridView.DataParams = dataParams;
    gridView.Filters = filters;
    gridView.Groups = groups;
    gridView.QuickFilterVals = [];

    dataView.syncGridSelection(grid, true, true);

    var sortcol = "";
    var sortdir = 1;

    function comparer(a, b) {
        var x = a[sortcol], y = b[sortcol];
        return (x == y ? 0 : (x > y ? 1 : -1));
    }

    function setCompare(sortAsc, fieldName) {
        sortdir = sortAsc ? 1 : -1;
        sortcol = fieldName;

        dataView.sort(comparer, sortAsc);
    }



    grid.onSort.subscribe(function (e, args) {
        var cols = args.sortCols;
        dataView.sort(function (dataRow1, dataRow2) {
            for (var i = 0, l = cols.length; i < l; i++) {
                var field = cols[i].sortCol.field;
                var sign = cols[i].sortAsc ? 1 : -1;
                var value1 = dataRow1[field], value2 = dataRow2[field];
                var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
                if (result != 0) {
                    return result;
                }
            }
            return 0;
        });
    });

    gridView.DataView.beginUpdate();
    gridView.DataView.setItems(data);
    gridView.DataView.setFilterArgs({
        searchString: ""
    });

    gridView.DataView.setFilter(Grid.QuickFilter);


    if (viewSample && viewSample.hasOwnProperty("sortColumns") && viewSample.sortColumns.length > 0) {
        gridView.Grid.setSortColumns(viewSample.sortColumns);
        setCompare(viewSample.sortColumns[0].sortAsc, viewSample.sortColumns[0].columnId);
    }

    gridView.DataView.endUpdate();

    gridView.DataView.setFilterArgs({
        searchString: ""
    });

    gridView.DataView.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
    });

    gridView.DataView.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
    });

    if (options.initiallyCollapsed && dataView.getGroups().length > 0) {
        dataView.collapseAllGroups()
    } else {
        grid.updateRowCount();
        grid.render();
    }

    gridView.Reload = function () {
        Loader.show();

        Asyst.API.View.load({
            viewName: viewName,
            data: gridView.DataParams,
            success: function (loadData) {
                gridView.DataView.beginUpdate();
                gridView.QuickFilterVals = [];

                gridView.Data = loadData.data;
                gridView.DataView.setItems(loadData.data);
                gridView.Grid.invalidateAllRows();
                gridView.DataView.endUpdate();

                grid.render();
                dataView.refresh();
                Loader.hide();
            },
            error: function () {
                Loader.hide();
            }
        });
    };

    gridView.AddRow = function () {
        Asyst.Workspace.openEntityDialog({
            entityName: entityName,
            title: entityTitle,
            success: gridView.Reload,
            saveAndGo: true
        });
    }

    gridView.UpdateQuickFilter = function (searchString) {
        var args = gridView.DataView.getFilterArgs();
        args = $.extend(args, { searchString: searchString, gridView: gridView });
        gridView.DataView.setFilterArgs(args);
        gridView.DataView.refresh();
        gridView.DataView.syncGridSelection(grid, true, true);
        grid.invalidate();
    };

    gridView.QuickFilterKeyup = function (e) {
        var that = this;
        var $search = $(that);
        var delay = 1000;

        clearTimeout($search.data('timer'));
        $search.data('timer', setTimeout(function () {
            $search.removeData('timer');

            Slick.GlobalEditorLock.cancelCurrentEdit();

            if (e.which == 27) {
                that.value = "";
            }

            gridView.UpdateQuickFilter(that.value);

        }, delay));
    };

    gridView.QuickFilterClear = function () {
        Slick.GlobalEditorLock.cancelCurrentEdit();

        gridView.UpdateQuickFilter("");
        $('#BrowseSearch').val("");
    };


    gridView.ClearGrouping = function () {
        gridView.DataView.groupBy(null);
    };

    gridView.GetSelectedItems = function () {
        var result = [];

        var rows = this.Grid.getSelectedRows();
        if (jQuery.isArray(rows)) {
            for (var i = 0; i < rows.length; i++)
                result.push(this.Grid.getDataItem(rows[i]));
        }

        return result;
    };

    gridView.DeleteSelected = function () {
        if (!entityName || !keyName)
            return;

        var g = this;
        var items = g.GetSelectedItems();


        if (!items || items.length === 0) {
            alert(Globa.CheckDocumentsDeleting.locale());
            return;
        }

        if (!confirm(Globa.ConfirmDocumentsDeleting.locale()))
            return;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item[keyName]) {

                var success = function (item) {
                    return function () {
                        g.DataView.deleteItem(item.id);
                    }
                }(item);

                var fail = function (item) {
                    return function (errorThrown, text, url, type) {
                       
                            ErrorHandler("Не удалено '" + item.Name + "'", text, null, type);
                        
                        //if (errorThrown === 'ReferenceErorr')
                        //    ErrorHandler(Globa.DeleteReferenceError, text);
                        //else if (errorThrown === 'DeletionRuleError')
                        //    NotifyWarning("Ошибка правила проверки при удалении сущности '" + item.Name + "'", text);
                        //else
                        //    ErrorHandler(Globa.DeletingError, text);
                    }
                }(item);

                Asyst.API.Entity.delete({
                    entityName: entityName,
                    dataId: item[keyName],
                    success: success,
                    error: fail,
                    async: false
                });
            }
        }

        this.ClearSelected();
    };

    gridView.ClearSelected = function () {
        this.Grid.setSelectedRows([]);
        return true;
    };


    gridView.ExtendFilter = function () {
        Grid.ShowFilterWindow(this);
    };

    gridView.getViewSample = function () {
        var viewSample = {};
        var view = this;
        viewSample.version = '0.2';
        viewSample.filterArgs = clone(view.DataView.getFilterArgs());
        delete viewSample.filterArgs.gridView;//в аргументах есть ссылка на вьюху - убираем её.
        viewSample.sortColumns = view.Grid.getSortColumns();
        viewSample.viewport = view.Grid.getViewport();
        var gridColumns = view.Grid.getColumns();
        var viewColumns = view.Columns;

        viewSample.columns = {};
        //сначала по колонкам которые на экране
        for (var c in gridColumns) {
            var columnSettings = {};
            columnSettings.visible = true;
            columnSettings.width = gridColumns[c].width;
            columnSettings.order = c;
            viewSample.columns[gridColumns[c].id] = columnSettings;
        }
        //теперь по колонкам пришедшим с сервера, чтобы найти "выключенные"
        for (var c in viewColumns) {
            if (viewSample.columns.hasOwnProperty(viewColumns[c].id)) continue;

            var columnSettings = {};
            columnSettings.visible = false;
            columnSettings.width = viewColumns[c].width;
            columnSettings.order = -1;
            viewSample.columns[viewColumns[c].id] = columnSettings;
        }
        //теперь сохраняем свернутые группировки
        var collapsedGroups = {};
        var saveGroup2 = function (groups) {
            for (var c = 0; c < groups.length; c++) {
                if (groups[c].collapsed === true) {
                    collapsedGroups[crc32(view.DataView.getGroupPath(groups[c]))] = true;
                } else if (groups[c].collapsed === false) {
                    saveGroup2(groups[c].groups);
                }
            }
            return collapsedGroups;
        };
        viewSample.groups = saveGroup2(view.DataView.getGroups());

        return viewSample;
    };

    gridView.viewSampleMenuRebuild = function () {
        $("#right-menu").find(".dropdown-menu").find("li:not([id],.ext-filter-menu)").show();
        $('#viewSampleMenu .divider').first().nextUntil($('#viewSampleMenu .divider').last()).remove();
        $('#sampleMenuDividerSecond').hide();

        if (Asyst.Workspace.views && Asyst.Workspace.views[this.viewName]) {
            Asyst.Workspace.views[this.viewName].viewSamples = [];
            Asyst.API.ViewSample.loadAll({
                viewName: viewName,
                success: function (data) {
                    for (var idx in data) {
                        var viewSample = data[idx];

                        var sampleId = viewSample.Id;
                        var sampleName = viewSample.Name;

                        Asyst.Workspace.views[this.viewName].viewSamples[sampleId] = sampleName;

                        var s =
                            '<li><a href="javascript: viewName = \'' + viewName + '\'; showBrowser(\'#view\', \'' + viewName + '\', \'' + sampleId + '\');void(0);" data-viewsampleid="' + sampleId + '">' + sampleName + '</a></li>';
                        $('#viewSampleMenu .divider').last().before(s);
                    }
                    if (data.length > 0)
                        $('#sampleMenuDividerSecond').show();
                }
            });
        }
    };

    gridView.viewSampleSetCurrentName = function (value) {
        $('#viewSampleSelectBtn').text(value);
    };

    gridView.saveNamedViewSample = function () {
        var that = this;
        var sendData = function () {
            var name = $('input[type="text"]#sampleName').val();
            if (name == '') {
                setInputWarning('#sampleName', true, Globa.FillField.locale());
                return;
            } else {
                setInputWarning('#sampleName', false);
            }
            name = name.replace('\n', ' ').substring(0, 250);

            var sample = that.getViewSample();

            Asyst.API.ViewSample.save({
                viewName: viewName,
                data: { Name: name, Sample: sample },
                success: function (data) {
                    Asyst.Workspace.views[viewName].viewSamples[data.Id] = name;
                    that.viewSampleMenuRebuild();
                    that.viewSampleSetCurrentName(name);
                    $('#' + requestDialogId).modal('hide');
                },
                async: false
            });
        };
        var requestsHtml = Globa.ViewSampleTypeNameBelow.locale();
        requestsHtml += '  <div class="control-group" style="margin-bottom:5px"><div class="controls"><input type="text" id="sampleName" class="span6" style="width:450px;" rel="tooltip" title=""></textarea>' +
            '<span class="required-input" rel="tooltip" title="" data-html="true" data-original-title="Обязательно"></span>' +
            '<span class="help-inline"></span></div></div>';
        var requestDialogId = Dialog(Globa.ViewSampleTypeName.locale(), requestsHtml, [{
            text: Globa.Continue.locale(),
            cls: 'btn-warning',
            click: sendData,
            close: false
        }, { text: Globa.Cancel.locale() }]);
    };

    gridView.deleteNamedViewSample = function () {
        var that = this;
        var requestHtml = " ";//убираем текст про удаляемую выборку= Globa.ViewSampleSelectForDelete.locale();

        var els = $('#viewSampleMenu li a[data-viewSampleId]');
        requestHtml += '<div class="row-fluid"><select class="selectName span12 chosen-select" id="deletedViewSample">';
        els.each(function () {
            requestHtml += '<option value="' + $(this).data('viewsampleid') + '">' + $(this).text() + '</option>';
        });
        requestHtml += "</select></div>";

        var deleteViewSample = function () {
            var viewSampleId = $('#deletedViewSample').val();
            if (viewSampleId != '') {
                Asyst.API.ViewSample.delete({
                    viewName: viewName,
                    data: { Id: viewSampleId },
                    success: function () {
                        delete Asyst.Workspace.views[viewName].viewSamples[viewSampleId];
                        that.viewSampleMenuRebuild();
                        //if ($('#viewSampleSelectBtn').text() == deletedName) {
                            that.viewSampleSetCurrentName(Globa.ViewSampleDefault.locale());
                            showBrowser('#view', viewName, null);
                        //}
                    },
                    async: true
                });
            }
        };
        var requestDialogId = Dialog(Globa.ViewSampleDelete.locale(), requestHtml, [{
            text: Globa.Continue.locale(),
            cls: 'btn-warning',
            click: deleteViewSample
        }, { text: Globa.Cancel.locale() }]);
        $('#deletedViewSample').kendoDropDownList();
    };

    gridView.saveCurrentSample = function () {
        var that = this;
        var sample = this.getViewSample();
        if (that.DataParams.viewSampleId)
            Asyst.API.ViewSample.update({ viewName: viewName, data: { Id: that.DataParams.viewSampleId, Sample: sample }, async: true });
    };

    window.onbeforeunload = function () {
        //todo что-нибудь, чтобы два вьювера работали сразу
        gridView.saveCurrentSample();
        return undefined;
    };

    gridView.ExportToXlsx = function () {

        var columns = gridView.Grid.getColumns();

        var data = gridView.Grid.getData().getFilteredAndPagedItems(gridView.Data).rows;
        
        var result = {
            data: data,
            columns: columns,
            groups: gridView.Groups
        };

        ViewExport(gridView.title || viewName, result);
    };

    return gridView;
};

Grid.QuickFilter = function (item, args) {
    if (!args.searchString)
        return true;

    for (var i in args.gridView.Columns) {

        var column = args.gridView.Columns[i];
        var val;

        if (item[column.field]) {

            var existedItem;
            var result = $.grep(args.gridView.QuickFilterVals, function (e) { return e["id"] === item.id });
            if (result.length === 0) {
                existedItem = null;
            } else if (result.length === 1) {
                existedItem = result[0];
            } else {
                console.error("Коллекция QuickFilterVals содержит более одного элемента с id = " + item.id);
                return false;
            }

            if (existedItem && existedItem.hasOwnProperty(column.id)) {
                val = existedItem[column.id];
            }
            else {
                if (column.format)
                    val = column.formatter(0, 0, item[column.field], column, item);
                else if (column.expression) {
                    var formed = column.formatter(0, 0, item[column.field], column, item);
                    if (formed[0] === '<' && formed[formed.length - 1] === '>') {
                        val = $(formed).text();
                    } else {
                        val = $("<span>" + formed + "</span>").text();
                    }
                }

                else
                    val = (item[column.field] + '');

                if (!existedItem) {
                    var newItem = [];
                    newItem["id"] = item.id;
                    args.gridView.QuickFilterVals.push(newItem);
                } else {
                    existedItem[column.id] = val;
                }
            }
            if (val.toUpperCase().indexOf(args.searchString.toUpperCase()) >= 0)
                return true;
        }
    }
    return false;
};

Grid.ExtFilterOper = {
    '=': {
        func: function (left, right) {
            return left == right;
        },
        title: Globa.Equal.locale()
    },
    '>': {
        func: function (left, right) {
            return left > right;
        },
        title: Globa.Great.locale()
    },
    '>=': {
        func: function (left, right) {
            return left >= right;
        },
        title: Globa.GreatOrEqual.locale()
    },
    '<': {
        func: function (left, right) {
            return left < right;
        },
        title: Globa.Less.locale()
    },
    '<=': {
        func: function (left, right) {
            return left <= right;
        },
        title: Globa.LesssOrEqual.locale()
    },
    '<>': {
        func: function (left, right) {
            return left != right;
        },
        title: Globa.NotEqual.locale()
    },
    'like': {
        func: function (left, right) {
            var re = new RegExp('.*' + right + '.*', 'gi');
            return re.test(left);
        },
        title: Globa.Contain.locale()
    },
    'notlike': {
        func: function (left, right) {
            var re = new RegExp('.*' + right + '.*', 'gi');
            return !re.test(left);
        },
        title: Globa.NotContain.locale()
    },
    'started': {
        func: function (left, right) {
            var re = new RegExp(right + '.*', 'gi');
            return re.test(left);
        },
        title: Globa.Started.locale()
    },
    /*case 'in':
     {
     var arr;
     var sep = ',';
     if (filterItem.value.constructor == Array)
     arr = filterItem.value;
     else {
     if (filterItem.separator) sep = separator;
     arr = filterItem.value.toString().split(sep);
     }
     result = false;
     for (var i = 0; i < arr.length; i++)
     if (arr[i] == item[filterItem.column]) result = true;
     }*/
};

Grid.ExtFilter = function (item, args) {
    if (!args || !args.filterItems || !args.oper || !args.constructor == Array)
        return true;

    var result;

    for (var ind = 0; ind < args.filterItems.length; ind++) {
        var filterItem = args.filterItems[ind];

        if (!filterItem) continue;

        var left = item[filterItem.column];
        var right = filterItem.value;

        if (left === undefined || left === null || right === undefined) continue;

        var itemType = filterItem.columnOptions && filterItem.columnOptions.kind || left.constructor.name || null;
        var itemFormat = filterItem.columnOptions && filterItem.columnOptions.format || null;
        var columnOptions = filterItem.columnOptions || {};

        //Костыль. Возможность фильтровать даты (без этого сравнивается по строке)
        if (filterItem.oper === "=" || filterItem.oper === "<>" || filterItem.oper === ">" || filterItem.oper === ">=" || filterItem.oper === "<" || filterItem.oper === "<=") {
            left = parseValue(left, itemType, itemFormat) || left;
            right = parseValue(right, itemType, itemFormat) || right;

            //Для фильтрации обе даты должны быть датами или строками
            if (!Grid._isDateType(itemType) || !isValidJSDate(left) || !isValidJSDate(right)
            ) {
                //Конвертация в строку по заданной маске
                left = Grid.DefaultFormatter(null, null, left, columnOptions, item);
                right = Grid.DefaultFormatter(null, null, right, columnOptions, item);
            }
        } else {
            left = Grid.DefaultFormatter(null, null, left, columnOptions, item);
            right = Grid.DefaultFormatter(null, null, right, columnOptions, item);
        }

        left = left.valueOf();
        right = right.valueOf();

        if (Grid.ExtFilterOper.hasOwnProperty(filterItem.oper))
            result = Grid.ExtFilterOper[filterItem.oper].func(left, right);
        else result = false;// если операцию не нашли - шлём лесом

        if (result === false && args.oper === 'and') return result;
        if (result === true && args.oper === 'or') return result;
    }
    //если совместность AND и дошли до конца, значит false нигде не было по ходу выполнения и возвращаем true
    if (args.oper == 'and') return true && Grid.QuickFilter(item, args);

    //если совместность OR и дошли до конца, значит true нигде не было по ходу выполнения и возвращаем false
    if (args.oper == 'or') return false;
    return false;

    function isValidJSDate(date) {
        return Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
    }

    function parseValue(value, type, format) {
        var parser = getParser(type, value);
        if (!parser) return value;

        var parsedValue = parser(value, format);
        return parsedValue;
    }

    function getParser(type, value) {
        if (!type) {
            if (!value) return null;
            type = value.constructor.name;
        }

        if (Grid._isDateType(type))
            return Asyst.date.parse;
        else if (Grid._isNumberType(type))
            return Asyst.number.pasrse;
        else
            return null
    }
};

Grid.DefaultFormatter = function (row, cell, cellValue, columnDef, dataContext) {

    var value = cellValue;

    if (columnDef.expression) {
        try {
            with (dataContext) {
                value = eval(columnDef.expression);
            }
        } catch (error) {
            value = error;
        }
    }

    if (value == null || value === "") {
        return "";
    } else if (value instanceof Date) {
        if (columnDef.format)
            value = Asyst.date.format(value, columnDef.format);
        else if (columnDef.kind == "datetime")
            value = Asyst.date.format(value, Asyst.date.defaultDateTimeFormat);
        else if (columnDef.kind == "date")
            value = Asyst.date.format(value, Asyst.date.defaultDateFormat);
        else if (columnDef.kind == "time")
            value = Asyst.date.format(value, Asyst.date.defaultTimeFormat);
        else
            value = Asyst.date.format(value, Asyst.date.defaultFormat);
    } else if (typeof (value) == "boolean") {
        if (value)
            value = Globa.Yes.locale();
        else
            value = Globa.No.locale();
    } else if (typeof (value) == "number") {
        if (columnDef.format) {
            value = Asyst.number.format(value, columnDef.format);
        }
    }

    return columnDef.expression || columnDef.format === 'html' ? value : Asyst.Utils.EscapeHtml(value);
};

Grid.LinkFormatter = function (row, cell, value, column, data) {
    var s = '';
    if (column.formatter && column.formatter != Grid.LinkFormatter)
        s = column.formatter(row, cell, value, column, data);
    else
        s = Grid.DefaultFormatter(row, cell, value, column, data);

    var url = new LinkService.Url(templateProcessObj(column.url, data));

    return "<a href='" + url.getLink() + "' data-save-tab-and-go='" + url.getLink() + "' target=_blank>" + s + "</a>";
};

Grid.ComboFormatter = function (row, cell, value, columnDef, dataContext) {
    if (value !== undefined && value !== null && value != "") return Grid.DefaultFormatter(row, cell, value, columnDef, dataContext);
    else return '<i>' + Globa.SelectValue.locale() + '</i>';
};





Grid.SelectCellEditor = function (args) {
    var $select;
    var defaultValue;
    var scope = this;
    var onApply = null;
    var values = {};

    this.init = function () {
        var optValues;
        var opts;
        if (args.column.options) {
            optValues = args.column.optionValues.split(',');
            opts = args.column.options.split(',');
        } else {
            optValues = "yes,no".split(',');
            opts = "yes,no".split(',');
        }
        if (args.column.onApply)
            onApply = args.column.onApply;

        var optionStr = "";
        for (var i in optValues) {
            values[optValues[i]] = opts[i];
            optionStr += "<OPTION value='" + optValues[i] + "'>" + opts[i] + "</OPTION>";
        }
        $select = $("<SELECT tabIndex='0' style='margin-top:-4px; margin-left:-4px'  class='chosen-select'>" + optionStr + "</SELECT>");
        $select.appendTo(args.container);
        $select.focus();
        $select.on('change', function () {
            var el = args.grid.getOptions().editorLock;
            if (el.isActive) el.commitCurrentEdit();
        });
        //$select.chosen();
    };

    this.destroy = function () {
        $select.remove();
    };

    this.focus = function () {
        $select.focus();
    };

    this.loadValue = function (item) {
        defaultValue = item[args.column.field];
        $select.val(defaultValue);
    };

    this.serializeValue = function () {
        if (args.column.options) {
            return $select.val();
        } else {
            return ($select.val() == "yes");
        }
    };

    this.applyValue = function (item, state) {
        item["__oldValue"] = item[args.column.field + "Id"];
        item[args.column.field] = values[state];
        item[args.column.field + "Id"] = state;
        if (onApply)
            onApply(item, args.column);
    };

    this.isValueChanged = function () {
        return ($select.val() != defaultValue);
    };

    this.validate = function (data) {
        if (!args.column.validator)
            return { valid: true, msg: null };
        else return args.column.validator(data);
    };

    this.init();
};

Grid.LongTextEditor = function (args) {
    var $input, $wrapper;
    var defaultValue;
    var scope = this;
    var onApply = null;

    this.init = function () {
        var $container = $("body");

        $wrapper = $("<DIV style='z-index:10000;position:absolute;background:white;padding:5px;border:3px solid gray; -moz-border-radius:10px; border-radius:10px;'/>")
            .appendTo($container);

        $input = $("<TEXTAREA hidefocus rows=5 style='background:white;width:250px;height:80px;border:0;outline:0'>")
            .appendTo($wrapper);

        $("<DIV style='text-align:right'><BUTTON>Ok</BUTTON><BUTTON>Отмена</BUTTON></DIV>")
            .appendTo($wrapper);

        $wrapper.find("button:first").bind("click", this.save);
        $wrapper.find("button:last").bind("click", this.cancel);
        $input.bind("keydown", this.handleKeyDown);

        if (args.column.onApply)
            onApply = args.column.onApply;
        scope.position(args.position);
        $input.focus().select();
    };

    this.handleKeyDown = function (e) {
        if (e.which == $.ui.keyCode.ENTER && e.ctrlKey) {
            scope.save();
        } else if (e.which == $.ui.keyCode.ESCAPE) {
            e.preventDefault();
            scope.cancel();
        } else if (e.which == $.ui.keyCode.TAB && e.shiftKey) {
            e.preventDefault();
            grid.navigatePrev();
        } else if (e.which == $.ui.keyCode.TAB) {
            e.preventDefault();
            grid.navigateNext();
        }
    };

    this.save = function () {
        args.commitChanges();
    };

    this.cancel = function () {
        $input.val(defaultValue);
        args.cancelChanges();
    };

    this.hide = function () {
        $wrapper.hide();
    };

    this.show = function () {
        $wrapper.show();
    };

    this.position = function (position) {
        $wrapper
            .css("top", position.top - 5)
            .css("left", position.left - 5);
    };

    this.destroy = function () {
        $wrapper.remove();
    };

    this.focus = function () {
        $input.focus();
    };

    this.loadValue = function (item) {
        $input.val(defaultValue = item[args.column.field]);
        $input.select();
    };

    this.serializeValue = function () {
        return $input.val();
    };

    this.applyValue = function (item, state) {
        item[args.column.field] = state;
        if (onApply)
            onApply(item, args.column);
        item[args.column.field] = state;
    };

    this.isValueChanged = function () {
        return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
        return {
            valid: true,
            msg: null
        };
    };

    this.init();
};

Grid.ShowFilterWindow = function (grid) {
    var filters = grid.Filters;
    var id = 'Filter' + Math.random().toString().substring(2);

    var fieldSelect = '<select class="selectName chosen-select" style="width:200px" data-placeholder="' + Globa.SelectValue.locale() + '">';
    Enumerable.From(filters).OrderBy('$.order').ForEach(function (a) {
        fieldSelect += '<option value="' + a.fieldName + '">' + a.title + '</option>';
    }
    );
    fieldSelect += '</select>';

    var comparisonSelect = '<select class="selectComparison chosen-select" style="width:150px" data-placeholder="' + Globa.SelectValue.locale() + '">';
    for (var c in Grid.ExtFilterOper) {
        comparisonSelect += '<option value="' + c + '">' + Grid.ExtFilterOper[c].title + '</option>';
    }
    comparisonSelect += '</select>';



    function getFilterRow(filterInput) {
        if (!filterInput)
            filterInput = getFilterInputWithTextBox();//Default filter input
        var filterRow =
            '<tr>\
            <td>\
            <a class="icon-trash delete-filter-row"></a>\
            </td>\
            <td>\
                ' + fieldSelect + ' \
            </td>\
            <td>\
                ' + comparisonSelect + ' \
            </td>\
            <td>\
                '+ filterInput + '  \
            </td>\
        </tr>';
        return filterRow;
    }

    function getFilterInputWithCalendar() {
        return '<input type="text" class="value date-picker" style="margin-bottom:-1px;width: 300px;height: 15px;" data-datepicker="datepicker" >';
    }

    function getFilterInputWithTextBox() {
        return '<input type="text" class="value" style="margin-bottom:-1px;width: 300px;height: 15px;">';
    }

    var filterRow = getFilterRow(getHtmlInput(filters[0] && filters[0].kind));

    var message = Globa.ShowLineFrom.locale();
    message += '<br><input type="radio" name="filterType" value="and" checked="true">' + Globa.AndTitle.locale() + '</input>';
    message += '<input type="radio" name="filterType" value="or" style="margin-left:20px">' + Globa.OrTitle.locale() + '</input>';
    message += '<table id="filtersTable">\
  <thead><tr><td></td><td>' + Globa.FieldName.locale() + '</td><td>' + Globa.Comparison.locale() + '</td><td>' + Globa.Value.locale() + '</td></tr></thead>\
  <tbody>';
    var filterArgs = grid.DataView.getFilterArgs();
    var hasFilters = filterArgs != null && filterArgs.hasOwnProperty('filterItems') && filterArgs.filterItems.length > 0;
    if (hasFilters) {
        for (var i = 0; i < filterArgs.filterItems.length; i++) {
            message += filterRow;
        }
    } else {
        message += filterRow;
    }

    message += '<tr><td colspan="4"><a id="addRowButton" class="icon-plus"></a> <br/><td></tr>';
    message +=
        ' </tbody>\
        </table>';

    var extendedFilterId = Dialog(Globa.ExtFilter.locale(),
        message, [{
            text: '&nbsp;' + Globa.Accept.locale() + '&nbsp;',
            cls: 'btn-primary',
            click: acceptFilter,
            close: true
        },
        {
            text: '&nbsp;' + Globa.Cancel.locale() + '&nbsp;',
            click: false,
            close: true
        }],
        id);

    $('.chosen-select').kendoDropDownList();
    $('#' + id).css({ top: '30%', left: '40%', width: '720px' });
    $('#addRowButton').on('click', addFilterRow);
    $('.delete-filter-row').on('click', deleteRow);

    //First filter row
    var extendedFilterElement = $('#' + extendedFilterId);
    extendedFilterElement && extendedFilterElement.find('.date-picker').kendoDatePicker({
        format: Asyst.date.defaultDateFormat,
        dateInput: true
    });
    extendedFilterElement && extendedFilterElement.find('.selectName.chosen-select').change(onFilterSelectChange);

    //если были фильтры - восстанавливаем их значения
    if (hasFilters) {
        if (filterArgs.oper == 'or') {
            $('input[name=filterType][value=or]').attr('checked', 'true');
        }
        var names = $('.selectName');
        var opers = $('.selectComparison');
        var values = $('input.value');
        for (var i = 0; i < filterArgs.filterItems.length; i++) {
            $(names[i]).val(filterArgs.filterItems[i].column);
            $(opers[i]).val(filterArgs.filterItems[i].oper);
            var inputType = filterArgs.filterItems[i].columnOptions && filterArgs.filterItems[i].columnOptions.kind;
            var inputElement = $(values[i]);
            if (inputType) {
                //var inputHtml = getHtmlInput(inputType);
                var currentRow = inputElement.parents('tr');

                inputElement = replaceInput(currentRow, inputType);

                //inputElement.replaceWith(inputHtml);
                //inputElement = currentRow.find('input.value');
                //inputElement.datepicker();
            }

            var val = filterArgs.filterItems[i].value;
            if (val && val.constructor == Date)
                val = Asyst.date.format(val, Asyst.date.defaultDateFormat);
            inputElement.val(val);
        }
        //$('.selectName').trigger('chosen:updated');
        //$('.selectComparison').trigger('chosen:updated');
    }

    function acceptFilter() {
        var filterItems = [];
        var items = $('#filtersTable tbody tr');
        for (var i = 0; i < items.length - 1; i++) {
            var filterItem = {};
            filterItem.column = $(items[i]).find('select.selectName').val();
            filterItem.oper = $(items[i]).find('select.selectComparison').val();

            var col = Enumerable.From(grid.Columns).Where('$.field =="' + filterItem.column + '"').FirstOrDefault();
            var val = $(items[i]).find('input.value').val();

            if (Grid._isDateType(col.kind))
                val = Asyst.date.parse(val, col.format) || val; // In case if Asyst.date.parse return '0'

            filterItem.columnOptions = col;
            filterItem.value = val;

            filterItems.push(filterItem);
        }

        var filterArgs = grid.DataView.getFilterArgs();
        filterArgs = $.extend(filterArgs, { oper: $('[name=filterType]:checked').val(), filterItems: filterItems });
        $('#' + id).modal('hide');
        grid.DataView.setFilter(Grid.ExtFilter);
        grid.DataView.setFilterArgs(filterArgs);
        grid.DataView.refresh();
        MakeFilterLine(filterArgs);
    };

    function deleteRow(event) {
        jQuery(event.target).parents('tr').remove();
    }

    function addFilterRow(event) {
        var filter = findFilter(grid.Filters, filters[0] && filters[0].fieldName);
        if (!filter) return;

        var inputHtml = getHtmlInput(filter.kind);

        var lastRow = jQuery(event.target).parents('tr').before(getFilterRow(inputHtml));
        var currentRow = lastRow.prev();
        currentRow.find('a.delete-filter-row').on('click', deleteRow);

        if (currentRow) {
            var selectedElements = currentRow.find('.chosen-select').kendoDropDownList();
            selectedElements.filter('.selectName').change(onFilterSelectChange);
            currentRow.find('.date-picker').kendoDatePicker({
                format: Asyst.date.defaultDateFormat,
                dateInput: true
            });
        }
    }

    function onFilterSelectChange(event, element) {
        if (!event.currentTarget.selectedOptions) return;
        var filter = findFilter(grid.Filters, event.currentTarget.selectedOptions[0].value);
        if (!filter) return;

        //var inputHtml = getHtmlInput(filter.kind);

        var currentRow = $(event.target).parents('tr');

        replaceInput(currentRow, filter.kind);
        //currentRow.find('input.value').replaceWith(inputHtml);
        //currentRow.find('.date-picker').datepicker();
    }

    function findFilter(filters, fieldName) {
        if (!filters) return null;

        for (var i = 0; i < filters.length; ++i) {
            var filter = filters[i];
            if (!filter || !filter.fieldName) return null;
            if (filter.fieldName === fieldName) return filter;
        }
        return null;
    }

    function getHtmlInput(type) {
        return Grid._isDateType(type) ? getFilterInputWithCalendar() : getFilterInputWithTextBox();
    }

    function replaceInput(filterRow, inputType) {
        if (!filterRow) return null;
        var inputHtml = getHtmlInput(inputType);
        filterRow.find('input.value').replaceWith(inputHtml);
        filterRow.find('.date-picker').kendoDatePicker({
            format: Asyst.date.defaultDateFormat,
            dateInput: true
        });

        var inputElement = filterRow.find('input.value');
        return inputElement;
    }
};

Grid._isDateType = function (format) {
    if (!format) return false;
    return !!~["datetime", "date"].indexOf(format.toLowerCase());
}

Grid._isNumberType = function (format) {
    if (!format) return false;
    return !!~["number", "int"].indexOf(format.toLowerCase());
}

Grid.ClearExtFilter = function (grid) {
    var args = grid.DataView.getFilterArgs();
    delete args.oper;
    delete args.filterItems;
    grid.DataView.setFilter(Grid.QuickFilter);

    grid.DataView.setFilterArgs(args);
    grid.DataView.refresh();
    $('#filter-line').hide();
    $('.wrapper').resize();
    //$('#BrowseSearchGroup').show();
};