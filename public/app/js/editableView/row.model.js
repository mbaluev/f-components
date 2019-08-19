if (!Asyst.Models) {
    Asyst.Models = {};
}
if (!Asyst.Models.EditableView) {
    Asyst.Models.EditableView = {};
}

(function () {
    var Column, Row, EditableGrid, AsystSelectFactory, emptyFn, errorFn, utils, ColumnValidator;

    utils = Asyst.Utils;
    errorFn = function (title, message) {
        NotifyError((title || "Ошибка получения данных"), (message || "При загрузке данных произошла ошибка, перезагрузите страницу для корректной работы приложения <button class='btn btn-default' onclick='location.reload()'>Перезагрузить<i class='icon-refresh'></i></button>"));
    };
    emptyFn = function () {
    };

    //region class AsystSelectFactory
    /**
     * Фабрика для создания класса AsystSelect необходимо для описания колонок handsontable
     * */
    AsystSelectFactory = (function () {
        var editors = {};


        return {
            /**
             * Возвращает ссылку на новый экземпляр AsystSelect
             * @return {AsystSelect}
             * */
            makeNew: function () {
                var editorId = (new Date()).getTime().toString();
                editors[editorId] = new AsystSelect();
                return editors[editorId];
            }
        }
    })();
    //endregion

    //region class Validators
    ColumnValidator = (function () {
        function isDate(value) {
            return Asyst.date.isDate(value, Asyst.date.defaultDateFormat) || Asyst.date.isDate(value, "dd.MM.yy");
        }

        return {
            notNullValidator: function (value, callback) {
                return callback(!!value);
            },
            dateValidator: function (value, callback) {
                //допустимо пустое значение или корректная дата
                callback(!value || isDate(value));
            },
            notNullDateValidator: function (value, callback) {
                //допустимо заполненное значение с корректной датой
                callback(!!value && isDate(value));
            },
            numValidator: function (value, callback) {
                var num = Number(value);
                callback(!value || !isNaN(num));
            },
            notNullNumValidator: function (value, callback) {
                var num = Number(value);
                callback(!!value && !isNaN(num));
            }
        }
    })();
    //endregion

    //region class Column
    (function () {
        /**
         * Mетаданныe для отрисовки колонок Handsontable
         * */
        Column = function (source) {
            var self = this;
            self.width = source.width || 80;
            self.header = source.name || "";
            self.isSortable = source.sortable || false;
            self.isReadOnly = !(!!(source.editField));
            self.data = source.id || "";
            self.editField = source.editField || "";
            self.isNullable = source.isNullable === undefined ? true : source.isNullable;
            self.hasFormat = !!(source.format);
            self.format = source.format || "";
            self.isExpression = !!(source.expression) || false;
            self.expression = source.expression || "";
            self.type = source.kind || "";
            self.isSelect = self.type === "object";
            self.isDate = ["date", "datetime"].indexOf(self.type) !== -1;
            self.isNumeric = ["integer", "decimal"].indexOf(self.type) !== -1;
            self.isCheckbox = "boolean" === self.type;
        };

        Column.create = function (source) {
            return new Column(source);
        };
    })();
    //endregion

    //region class Row
    (function () {
        /**
         * Модель строки Handsontable
         * */
        Row = function (options) {
            var self = this;
            options = options || {};
            $.extend(self, options);
        };

        /**
         * Заполнение свойств на основании метаданнх из коллекции Column
         * @param grid
         * @param rawRow {Object} DTO объект полученный с сервера
         * */
        Row.prototype.fillFromCols = function (grid, rawRow) {
            var self = this,
                cols = grid.cols,
                rowVal = null;

            cols.forEach(function (col) {
                var colId = col.data;
                self[grid.keyName] = rawRow[grid.keyName];
                rowVal = (rawRow[colId] === "Нет") ? null : rawRow[colId];
                //TODO move formatter class
                if (col.isDate) {
                    self[colId] = rowVal === null ? null : typeof rowVal === "object" ? Asyst.date.format(rowVal, Asyst.date.defaultDateFormat, true) : (rowVal || null);
                } else if (col.isSelect) {
                    self[colId] = {};
                    self[colId].name = typeof rowVal === "object" ? "" : rowVal;
                    self[colId].id = null;
                    self[colId].field = col.editField;
                } else {
                    self[colId] = rowVal;
                }
            });
        };

        Row.isValid = function (row, handson) {
            var colIndex = handson.countCols(),
                result = 0;
            while (colIndex--) {
                !handson.getCellMeta(row, colIndex).valid && result++;
            }
            return result === 0;
        };

        Row.prototype.update = function (changeSet) {
            var self = this,
                selectedId = changeSet.selectedId;

            if (selectedId !== undefined) {
                utils.deepValue(self, utils.getFieldIdPath(changeSet.prop), (selectedId === -1 ? null : selectedId));
            }
            utils.deepValue(self, changeSet.prop, changeSet.newVal);
        };

        Row.prototype.toDto = function (editableFields) {
            var self = this,
                dto = {};

            for (var propKey in self) {
                if (self.hasOwnProperty(propKey)) {
                    var prop = self[propKey];
                    if (prop && typeof prop === "object") {
                        dto[prop.field] = prop.id;
                    } else {
                        dto[editableFields[propKey]] = prop;
                    }
                }
            }
            return dto;
        };

        Row.prototype.save = function (grid) {
            var self = this;
            Asyst.API.Form.save({
                formName: grid.editFormName,
                dataId: self[grid.keyName],
                data: self.toDto(grid.editableFileds),
                success: function(e) {
                    self[grid.keyName] = e.id;
                },
                error: errorFn,
                async: true
            });
        };

        Row.create = function (grid, source) {
            var emptyRow = new Row();
            emptyRow.fillFromCols(grid, source);
            return emptyRow;
        };
    })();
    //endregion

    //region class EditableGrid
    (function () {
        var dataTypeMapping = {
            "text": "text",
            "datetime": "date",
            "date": "date",
            "integer": "numeric",
            "decimal": "numeric",
            "boolean": "checkbox"
        };

        //region FUNC

        function loadOptions(form, field, callback) {
            Asyst.API.DataSource.load({
                sourceType: "form",
                sourceName: form,
                elementName: field,
                data: {},
                success: function(data) {
                    callback && callback.call(null, data);
                },
                error: errorFn,
                async: true,
                isPicklist: true
            });
        }

        function setOptions(options, container) {
            options.forEach(function (item, index) {
                container[item["Key"]] = {
                    name: item.Value,
                    position: (index + 1)
                }
            });
        }

        function gridSearch(table) {
            if (table) {
                var handson = table.handson;
                handson.search.query($("#BrowseSearch").val());
                handson.render();
            }
        }

        function initTable(editableGrid) {
            var schema = editableGrid.getHandsonSchema();
            var table = new Table({
                containerId: editableGrid.containerId,
                columns: schema.columns,
                colHeaders: schema.colHeaders,
                data: [],
                search: true
            });

            table.on("afterCreateRow", function (newRowIndex) {
                var handson = this,
                    rows = handson.getSourceData(),
                    row = rows[newRowIndex];
                if (!(row instanceof Row)) {
                    rows[newRowIndex] = Row.create(editableGrid, row);
                }
            });

            table.on("afterChange", function (changeSet, source) {
                var handson = this;

                if (source === "custom") {
                    return;
                }

                handson.validateCells(function () {
                    var rowIndex = changeSet[0].row,
                        rowModel = handson.getSourceDataAtRow(rowIndex);

                    changeSet.forEach(function (changeSet) {
                        rowModel.update(changeSet);
                    });
                    Row.isValid(rowIndex, handson) && rowModel.save(editableGrid);
                });
            });

            table.on("beforeRemoveRow", function (index, amount, logicalRows) {
                var handson, count, i, row;

                handson = this;
                count = logicalRows.length;
                for (i = 0; i < count; i++) {
                    row = handson.getSourceDataAtRow(logicalRows[i]);
                    var entityId = row[editableGrid.keyName];
                    if (entityId) {
                        Asyst.API.Entity.delete({ entityName: editableGrid.entityName, dataId: entityId, error: errorFn, async:false });
                    }
                }
            });

            table.on("afterSelection", function (rowStart, colStart, rowEnd) {
                var handson = this,
                    minIndex = Math.min(rowStart, rowEnd),
                    maxIndex = Math.max(rowStart, rowEnd);

                for (var i = minIndex; i <= maxIndex; i++) {
                    var row = handson.getSourceDataAtRow(i);
                    for (var prop in row) {
                        if (row.hasOwnProperty(prop)) {
                            var value = row[prop];
                            if (value && typeof(value) === "object") {
                                if (!value.id || value.id === -1) {
                                    var cellMeta = handson.getCellMeta(i, handson.propToCol(prop + ".name"));
                                    value.id = AsystSelectUtils.getValueFromMapByText(cellMeta.optionsHashMap, value.name);
                                }
                            }
                        }
                    }
                }

            });

            return table;
        }

        //endregion

        EditableGrid = function (options) {
            var self = this;
            self.containerId = options.containerId || "";
            self.editFormName = options.editFormName || "";
            self.keyName = options.keyName || "";
            self.cols = options.cols && options.cols.length ? options.cols : [];
            self.rows = options.rows && options.rows.length ? options.rows : [];
            self.editableFileds = {};
            self.entityName = options.entityName || "";
            self.table = null;
            self.QuickFilterKeyup = function () {
                return gridSearch(self.table);
            };
            self.QuickFilterClear = function () {
                $("#BrowseSearch").val("");
                return gridSearch(self.table);
            };
            self.UpdateQuickFilter = function (searchString) {
                $("#BrowseSearch").val(searchString);
                return gridSearch(self.table);
            };
            self.CollapseAllGroups = emptyFn;
            self.SetGroupsCollapsed = emptyFn;
            self.ExpandAllGroups = emptyFn;
            self.saveCurrent = emptyFn;
            self.viewSampleMenuRebuild = function () {
                $("#right-menu").find(".dropdown-menu").find("li:not([id],.ext-filter-menu)").hide();
            };
            self.DeleteSelected = function () {
                self.table && self.table.removeRow();
            };
            self.Reload = function (viewName) {
                Loader.show();
                Asyst.API.View.load({
                    viewName: viewName,
                    data: {},
                    success: function(view) {
                        self.rows = view.data.map(function(rawRow) {
                            return Row.create(self, rawRow);
                        });
                        self.table.updateData(self.rows);
                        Loader.hide();
                    },
                    async:false
                });
            };
            self.Grid = {
                scrollToRow: emptyFn,
                invalidate: emptyFn
            };
        };


        EditableGrid.prototype.loadAsystOptions = function (form, field, reserveField, container) {
            loadOptions(form, field, function (data) {
                if (data && data.length) {
                    setOptions(data, container);
                } else {
                    loadOptions(form, reserveField, function (data) {
                        setOptions(data, container);
                    })
                }
            });
        };

        EditableGrid.prototype.getHandsonSchema = function () {
            var self = this,
                cols = self.cols,
                schema = {
                    columns: [],
                    colHeaders: []
                };

            for (var colKey in cols) {
                if (cols.hasOwnProperty(colKey)) {
                    var col = cols[colKey];
                    var handsonColDescriptor = {
                        width: col.width
                    };

                    if (col.isSelect && col.editField) {
                        var asystSelect = AsystSelectFactory.makeNew(),
                            options = {};

                        self.loadAsystOptions(self.editFormName, col.editField, col.data, options);

                        handsonColDescriptor.optionsHashMap = options;
                        handsonColDescriptor.renderer = asystSelect.renderer;
                        handsonColDescriptor.editor = asystSelect.editor;
                        handsonColDescriptor.validator = asystSelect.validator;
                        handsonColDescriptor.optionsSortProp = "position";
                    } else if (col.isDate) {
                        handsonColDescriptor.dateFormat = Asyst.date.defaultDateFormat.toUpperCase();
                        handsonColDescriptor.validator = col.isNullable ? ColumnValidator.dateValidator : ColumnValidator.notNullDateValidator;
                        handsonColDescriptor.datePickerConfig = {
                            i18n: {
                                previousMonth: "Предыдущий!".locale(),
                                nextMonth: "Следующий".locale(),
                                months: Asyst.date.monthNames,
                                weekdays: Asyst.date.dayNames,
                                weekdaysShort: Asyst.date.shortDayNames
                            },
                            firstDay: Asyst.date.startOfWeek
                        };
                    } else if (col.isNumeric) {
                        handsonColDescriptor.language = "ru";
                        handsonColDescriptor.format = col.format || "0,0.00";
                        handsonColDescriptor.validator = col.isNullable ? ColumnValidator.numValidator : ColumnValidator.notNullNumValidator;
                    }

                    if (!col.isNullable && !handsonColDescriptor.validator) {
                        handsonColDescriptor.validator = ColumnValidator.notNullValidator;
                    }

                    handsonColDescriptor.data = col.isSelect ? col.data + ".name" : col.data;
                    handsonColDescriptor.editField = col.editField;
                    handsonColDescriptor.isNullable = col.isNullable;
                    handsonColDescriptor.type = dataTypeMapping[col.type] || "text";
                    col.isReadOnly && (handsonColDescriptor.readOnly = true);

                    schema.columns.push(handsonColDescriptor);
                    schema.colHeaders.push(col.header);
                }
            }

            return schema;
        };


        EditableGrid.prototype.dispose = function () {
            this.table.handson.destroy();
        };

        EditableGrid.create = function (element, data, columns, editFormName, keyName, entityName) {
            var currentGrid = window[viewName];
            if (currentGrid && currentGrid.constructor.name === "EditableGrid") {
                currentGrid.dispose();
            }

            var editableGrid = new EditableGrid({
                editFormName: editFormName,
                keyName: keyName,
                containerId: element[0].id,
                entityName: entityName
            });

            editableGrid.cols = columns.map(function (colSource) {
                return Column.create(colSource);
            });
            editableGrid.table = initTable(editableGrid);
            editableGrid.rows = data.map(function (rawRow) {
                return Row.create(editableGrid, rawRow);
            });
            editableGrid.editableFileds = utils.arrayToMap(editableGrid.cols, "data", function (item) {
                return item.editField;
            });
            editableGrid.table.handson.updateSettings({maxRows: editableGrid.rows.length});
            editableGrid.table.updateData(editableGrid.rows);
            editableGrid.table.handson.render();

            return editableGrid;
        };
    })();
    //endregion

    Asyst.Models.EditableView = {
        Column: Column,
        Row: Row,
        EditableGrid: EditableGrid
    };
})();