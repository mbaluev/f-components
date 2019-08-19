; (function () {


    var Gantt = (function () {

        /**
         * Загрузка данных через датасет
         * @param {string} datasetName - название датасета
         * @param {Number} activityId - id активности
         * @param {Function} callback - функция обратного вызова
         */
        var _loadViaDataset = function (datasetName, activityId, callback) {
            Asyst.API.DataSet.load({
                name: datasetName,
                data: { ActivityId: activityId },
                async: true,
                success: function (results) {
                    callback(null, results);
                },
                error: function (errorTitle, errorText) {
                    callback(new Gantt.Error(errorTitle, errorText, null, 'Ошибка при загрузке данных'));
                }
            });
        };

        /**
         * Расчет даты начала таска
         * @param {Object} item - источник данных
         * @returns {Date} - дата начала таска
         */
        var _getDisplayedStart = function (item) {
            var displayedDate = item.StartFactDate || item.StartForecastDate;

            if (!displayedDate) {
                return null;
            }

            var resultDate = new Date(displayedDate);

            if (!item.IsTask) {
                // КТ немного смещаем влево
                resultDate.setHours(22, 0, 0);
            }

            return resultDate;
        };

        /**
         * Расчет плановой даты начала
         * @param {Object} item - источник данных
         * @returns {Date} - плановая дата начала
         */
        var _getDisplayedPlanStart = function (item) {
            var displayedDate = item.StartPlanDate;

            if (!displayedDate) {
                return null;
            }

            var resultDate = new Date(displayedDate);

            if (!item.IsTask) {
                // КТ немного смещаем влево
                resultDate.setHours(22, 0, 0);
            }

            return resultDate;
        };

        /**
         * Расчет даты окончания таска
         * @param {Object} item - источник данных
         * @returns {Date} - дата окончания таска
         */
        var _getDisplayedEnd = function (item) {
            var displayedDate;

            if (item.IsParent) {
                if (item.IsFactDateEnding) {
                    displayedDate = item.FactDate;
                } else {
                    displayedDate = item.ForecastDate > item.FactDate ? item.ForecastDate : item.FactDate;
                }
            } else {
                displayedDate = item.FactDate || item.ForecastDate;
            }

            if (!displayedDate) {
                return null;
            }

            var resultDate = new Date(displayedDate);

            if (!item.IsTask) {
                // КТ немного смещаем влево
                resultDate.setHours(22, 0, 0);
            } else {
                resultDate.setHours(23, 59, 59);
            }

            return resultDate;
        };

        /**
         * Расчет плановой даты окончания
         * @param {Object} item - источник данных
         * @returns {Date} - плановая дата окончания
         */
        var _getDisplayedPlanEnd = function (item) {
            var displayedDate = item.PlanDate;

            if (!displayedDate) {
                return null;
            }

            var resultDate = new Date(displayedDate);

            if (!item.IsTask) {
                // КТ немного смещаем влево
                resultDate.setHours(22, 0, 0);
            } else {
                resultDate.setHours(23, 59, 59);
            }

            return resultDate;
        };

        /**
         * Преобразование зависимостей к типу kendoGantt
         * @param {string} type - тип зависимости
         * @returns {Number} - тип зависимости для ганта
         */
        var _typeToKendoDependencyType = function (type) {
            var typeToKendoDependencyType = {
                'FF': 0,
                'FS': 1,
                'SF': 2,
                'SS': 3
            };

            return typeToKendoDependencyType[type || 'FS'];
        };

        /**
         * Преобразование входных тасков к требуемому формату для kendoGantt
         * @param {Object} options - настройки
         * @param {Array} sourceTasks - массив тасков
         * @returns {Array} - массив тасков для ганта
         */
        var _sourceTasksToDataSource = function (options, sourceTasks) {
            var isExpand = sourceTasks.length <= options.expandHierarchyTreshold;

            return sourceTasks.map(function (i, _, a) {
                return {
                    // kendo gantt internal parameters
                    id: i.ActivityId,
                    parentId: i.ParentId,
                    start: _getDisplayedStart(i),
                    end: _getDisplayedEnd(i),
                    title: i.Name,
                    summary: i.IsParent ? true : false,
                    expanded: isExpand,

                    // all other parameters for templates
                    source: i
                };
            });
        };

        /**
         * Преобразование входных связей к требуемому формату для kendoGantt
         * @param {Array} sourceDeps - массив связей
         * @returns {Array} - массив связей для ганта
         */
        var _sourceDepsToDependencies = function (sourceDeps) {
            return sourceDeps.map(function (i) {
                return {
                    // kendo gantt internal parameters
                    id: i.PointPointId,
                    predecessorId: i.PreviousPointId,
                    successorId: i.PointId,
                    type: _typeToKendoDependencyType(i.LinkType),

                    // all other parameters for templates
                    source: i
                };
            });
        };

        /**
         * Опции, заданные пользователем
         * @param {Object} options - настройки
         * @returns {Object} - пользовательские опции
         */
        var _getCustomOptions = function (options) {
            var result = {};
            $.extend(true, result, options);
            delete result.kendoOptions;
            return result;
        };

        /**
         * Установка диапазона всем представлениям ганта
         * @param {Object} options - настройки
         * @param {Object} range - диапазон
         */
        var _setViewRangeToOptions = function (options, range) {
            options.kendoOptions.views.forEach(function (view) {
                view.range = range;
            });
        };

        /**
         * Установка выбранного представления
         * @param {Object} options - настройки
         * @param {string} viewType - выбранное представление
         */
        var _setSelectedViewToOptions = function (options, viewType) {
            options.kendoOptions.views.forEach(function (view) {
                if (viewType === view.type) {
                    view.selected = true;
                }
            });
        };

        /**
         * Расчет диапазона просмотра ганта на основе источника
         * @param {Array} dataSource - обработанный массив тасков
         * @returns {Object} - диапазон
         */
        var _calculateViewRange = function (dataSource) {
            if (dataSource.length <= 0) {
                return;
            }

            var _MIN_DATE = new Date(0);
            var _MAX_DATE = new Date(9999, 11, 31);

            var firstEndDate = dataSource[0].end || _MIN_DATE;
            var maxDate = dataSource.reduce(function (max, item) {
                var end = item.end || _MIN_DATE;
                var planEnd = item.source.PlanDate || _MIN_DATE;
                return Math.max(max, end, planEnd);
            }, firstEndDate);
            maxDate = new Date(maxDate) === _MIN_DATE ? new Date() : new Date(maxDate);

            var firstStartDate = dataSource[0].start || _MAX_DATE;
            var minDate = dataSource.reduce(function (min, item) {
                var start = item.start || _MAX_DATE;
                var planStart = item.source.StartPlanDate || _MAX_DATE;
                return Math.min(min, start, planStart);
            }, firstStartDate);
            minDate = new Date(minDate) === _MAX_DATE ? new Date() : new Date(minDate);

            var range = {
                start: minDate,
                end: maxDate
            };

            return range;
        };


        /**
         * Обновление источника данных для ганта
         * @param {Object} options - настройки
         * @param {Array} sourceTasks - массив тасков
         * @param {Array} sourceDeps - массив зависимостей
         */
        var _updateTasksAndDeps = function (options, sourceTasks, sourceDeps) {
            var dataSource = _sourceTasksToDataSource(options, sourceTasks);
            var dependencies = _sourceDepsToDependencies(sourceDeps);
            var viewRange = _calculateViewRange(dataSource);

            var $kendoGantt = options.element.getKendoGantt();

            if (options.element.is(':hidden')) {
                this._needFullReloadOnRefresh = true;
                this._refreshDeferredOnShow();
            }

            $kendoGantt.setOptions({
                dataSource: dataSource,
                dependencies: dependencies,
                range: viewRange
            });

            $kendoGantt.view(options.selectedView);
        };

        /**
         * template для работ по умолчанию
         * @param {Object} task - Дата
         * @returns {string} - template
         */
        var _defaultTaskTemplate = function (task) {
            // Отключение отображения наименования таска на полосках ганта по умолчанию
            return '';
        };

        /**
         * Кастомизация: template для работ
         * @param {Object} options - настройки
         */
        var _customizeTaskTemplate = function (options) {
            var customTaskTemplateDefined = options.customTaskTemplate
                && typeof options.customTaskTemplate === 'function';

            options.kendoOptions.taskTemplate = customTaskTemplateDefined ?
                options.customTaskTemplate : _defaultTaskTemplate;
        };

        /**
         * template для всплывающих подсказок по умолчанию
         * @param {Object} taskInfo - информация по таску
         * @returns {string} - template
         */
        var _defaultTooltipTemplate = function (taskInfo) {
            var t = taskInfo.task;
            var s = t.source;

            return '<strong>' + t.title + '</strong><br />'
                + '<span style="white-space:nowrap;">' + (s.IsTask ? 'Факт. начало: ' + (Asyst.date.format(s.StartFactDate, 'dd.MM.yyyy') || '<нет>') + ' ' : '')
                + ' Факт. окончание: ' + (Asyst.date.format(s.FactDate, 'dd.MM.yyyy') || '<нет>') + '</span><br />'
                + '<span style="white-space:nowrap;">' + (s.IsTask ? 'Прог. начало: ' + (Asyst.date.format(s.StartForecastDate, 'dd.MM.yyyy') || '<нет>') + ' ' : '')
                + ' Прог. окончание: ' + (Asyst.date.format(s.ForecastDate, 'dd.MM.yyyy') || '<нет>') + '</span><br />'
                + '<span style="white-space:nowrap;">' + (s.IsTask ? 'План. начало: ' + (Asyst.date.format(s.StartPlanDate, 'dd.MM.yyyy') || '<нет>') + ' ' : '')
                + ' План. окончание: ' + (Asyst.date.format(s.PlanDate, 'dd.MM.yyyy') || '<нет>') + '</span><br />';
        };

        /**
         * Кастомизация: template для всплывающих подсказок
         * @param {Object} options - настройки
         */
        var _customizeTooltipTemplate = function (options) {
            var customTooltipTemplateDefined = options.customTooltipTemplate
                && typeof options.customTooltipTemplate === 'function';

            options.kendoOptions.tooltip = {
                visible: true,
                template: customTooltipTemplateDefined ? options.customTooltipTemplate : _defaultTooltipTemplate
            };
        };

        /**
         * Считать ли день рабочим?
         * @param {Date} date - Дата
         * @returns {Boolean} - День рабочий
         */
        var _defaultIsWorkDay = function (date) {
            // все рабочие
            return true;
        };

        /**
         * Кастомизация: считать ли день рабочим?
         * @param {Object} options - настройки
         */
        var _customizeIsWorkDay = function (options) {
            var customIsWorkDayDefined = options.customIsWorkDay
                && typeof options.customIsWorkDay === 'function';

            kendo.ui.GanttView.prototype._isWorkDay = customIsWorkDayDefined ?
                options.customIsWorkDay : _defaultIsWorkDay;
        };

        /**
         * Инициализация kendoGantt
         * @param {Object} options - настройки
         * @param {Array} sourceTasks - массив тасков
         * @param {Array} sourceDeps - массив зависимостей
         */
        var _initializeKendoGantt = function (options, sourceTasks, sourceDeps) {
            var dataSource = _sourceTasksToDataSource(options, sourceTasks);
            var dependencies = _sourceDepsToDependencies(sourceDeps);
            var viewRange = _calculateViewRange(dataSource);

            options.kendoOptions.dataSource = dataSource;
            options.kendoOptions.dependencies = dependencies;

            _setViewRangeToOptions(options, viewRange);
            _setSelectedViewToOptions(options, options.selectedView);
            _customizeIsWorkDay(options);
            _customizeTaskTemplate(options);
            _customizeTooltipTemplate(options);

            if (options.element.is(':hidden')) {
                this._needFullReloadOnRefresh = true;
                this._refreshDeferredOnShow();
            }

            options.element.kendoGantt(options.kendoOptions);

            // пользовательские настройки хранятся в ганте  
            options.element.getKendoGantt().options.custom = _getCustomOptions(options);
        };

        /**
         * Подготовка настроек
         * @param {Object} options - результирующие настройки
         * @param {Object} userOptions - пользовательские настройки
         */
        var _prepareOptions = function (options, userOptions) {
            $.extend(true, options, Gantt.getDefaultOptions(), userOptions);

            options.kendoOptions.dataBound = _onDataBound;
            options.kendoOptions.height = options.height;
        };

        /**
         * Инициализация ганта
         * @param {Object} options - настройки
         */
        var _initialize = function (options) {
            var asystGantt = this;

            _initializeCustomViews();

            options.element.empty();

            if (options.datasetName) {
                var afterLoad = function (error, results) {
                    if (error) {
                        error.Notify();
                        return;
                    }

                    var sourceTasks = results[0];
                    var sourceDeps = results[1];

                    _updateTasksAndDeps.call(asystGantt, options, sourceTasks, sourceDeps);
                };

                _loadViaDataset(options.datasetName, options.activityId, afterLoad);
            }

            _initializeKendoGantt.call(this, options, options.customDataSource || [], options.customDependencies || []);
        };

        /**
         * Инициализация кастомных представлений
         */
        var _initializeCustomViews = function () {
            kendo.ui.GanttCustomYearView = kendo.ui.GanttView.extend({
                name: "customYear",

                options: {
                    emptyHeaderTemplate: kendo.template(""),
                    yearHeaderTemplate: kendo.template("#=kendo.toString(start, 'yyyy')#")
                },

                range: function (_) {
                    // предлагаемый в аргументе range считается неправильно
                    var range = this.options.range;

                    if (!range.start || !range.end) {
                        return;
                    }

                    // плюс/минус 1 год
                    this.start = new Date(range.start.getFullYear() - 1, 0, 1);
                    this.end = new Date(range.end.getFullYear() + 1, 0, 1);
                },

                _generateSlots: function (incrementCallback, _) {
                    var slots = [];

                    var slotStart = new Date(this.start);
                    var slotEnd;

                    while (slotStart < this.end) {
                        slotEnd = new Date(slotStart);
                        incrementCallback(slotEnd);

                        slots.push({ start: slotStart, end: slotEnd, span: 1 });

                        slotStart = slotEnd;
                    }

                    return slots;
                },

                _createSlots: function () {
                    var slots = [];

                    slots.push([]);
                    slots.push(this._generateSlots(function (date) { date.setFullYear(date.getFullYear() + 1); }, 12));

                    return slots;
                },

                _layout: function () {
                    var rows = [];

                    rows.push(this._slotHeaders(this._slots[0], kendo.template(this.options.emptyHeaderTemplate)));
                    rows.push(this._slotHeaders(this._slots[1], kendo.template(this.options.yearHeaderTemplate)));

                    return rows;
                }
            });
        };

        /**
         * Форматирование грида слева.
         * Обусловлено отсутствием template columns
         * @param {Object} kendoGantt - Гантт
         */
        var _customizeColumns = function (kendoGantt) {
            var $container = kendoGantt.element.find('tbody[role="rowgroup"]');

            $container.hide();

            var $rows = $container.children();

            $rows.find('.k-icon')
                .off('click')
                .removeClass('k-column-clickable');

            $rows.each(function (i, row) {
                var $row = $(row);
                var taskUid = $row.attr("data-uid");
                var task = kendoGantt.dataSource.getByUid(taskUid);
                var s = task.source;

                // наименование
                var nameUrl = saveTabAndLink('/' + s.EntityName + '/form/auto/' + s.ActivityId);

                var $namePlace = $row.children().eq(1).children().last();

                $namePlace.addClass('k-column-clickable');

                $namePlace.off('click').on('click', function () {
                    window.open(nameUrl, '_blank');
                });


                // индикаторы
                var indicatorTag = '<img src="/app/media/' + s.IndicatorId + '.png" title="' + s.IndicatorTitle + '" />';

                var $indicatorPlace = $row.children().first();
                $indicatorPlace.empty();
                $indicatorPlace.append(indicatorTag);
            });

            $container.show();
        };

        /**
         * Форматирование рабочей области ганта.
         * @param {Object} kendoGantt - Гантт
         */
        var _customizeGridContent = function (kendoGantt) {
            var $ganttTasks = kendoGantt.element.find('.k-gantt-tasks');
            var $tasksAndMilestones = $ganttTasks.find('.k-task.k-task-milestone:not(.k-task-plan),.k-task.k-task-single:not(.k-task-plan)');
            var $taskWraps = $ganttTasks.find('.k-task-wrap:has(.k-task-single)');
            var $summaryWarps = $ganttTasks.find('.k-task-wrap:has(.k-task-summary)');

            $ganttTasks.hide();

            /* Через css не получатеся, отсутствует селектор аналог :has */
            $summaryWarps.addClass('k-task-summary-wrap');
            $taskWraps.addClass('k-task-single-wrap');

            $tasksAndMilestones.each(function (i, taskElement) {
                var $task = $(taskElement);
                var taskUid = $task.attr("data-uid");
                var task = kendoGantt.dataSource.getByUid(taskUid);
                var s = task.source;

                $task.css({
                    'background-color': s.IndicatorColor,
                    'border-color': s.IndicatorColor
                });
            });

            $ganttTasks.show();
        };

        /**
         * Разница в днях между двумя датами
         * @param {Date} date1 - Дата
         * @param {Date} date2 - Дата
         * @returns {Number} - разница в днях между двумя датами
         */
        var _getDiffInDays = function (date1, date2) {
            if (!date1 || !date2) {
                return 0;
            }

            var diffInMs = date1.getTime() - date2.getTime();
            return Math.abs(diffInMs / (1000 * 60 * 60 * 24));
        };

        /**
         * Добавление плановых тасков
         * @param {Object} kendoGantt - Гантт 
         */
        var _addPlanTasks = function (kendoGantt) {
            // удаление плана с прошлой вкладки
            kendoGantt.element.find('.k-task-wrap-plan').remove();

            if (kendoGantt.options.dataSource.length === 0) {
                return;
            }

            var view = kendoGantt.timeline._selectedView;
            var viewStart = view.start;
            var viewEnd = view.end;

            var viewWidth = view._tableWidth;

            var pixelsPerDay = viewWidth / _getDiffInDays(viewEnd, viewStart);

            var $ganttTasks = kendoGantt.element.find('.k-gantt-tasks .k-task');

            var taskBorderWidths = 1 * 2;

            $ganttTasks.each(function (i, taskElement) {
                var $task = $(taskElement);
                var taskUid = $task.attr("data-uid");
                var task = kendoGantt.dataSource.getByUid(taskUid);
                var s = task.source;

                var startPlanDate = _getDisplayedPlanStart(s);
                var endPlanDate = _getDisplayedPlanEnd(s);

                var leftInPixels = Math.round(_getDiffInDays(startPlanDate, viewStart) * pixelsPerDay) || 0;

                var widthInPixels = Math.ceil(_getDiffInDays(endPlanDate, startPlanDate) * pixelsPerDay - taskBorderWidths) || 0;

                var $rowContainer = $task.parent().parent();

                var template = '';

                if (!s.IsTask) {
                    template =
                        '<div class="k-task-wrap-plan k-milestone-wrap" style="left: ' + leftInPixels.toString() + 'px;">'
                        + '<div class="k-task-plan k-task-milestone">'
                        + '</div></div>';
                } else if (s.IsTask || s.IsParent) {
                    template =
                        '<div class="k-task-wrap-plan k-task-single-wrap" style="left: ' + leftInPixels.toString() + 'px;">'
                        + '<div class="k-task-plan k-task-single" style="width: ' + widthInPixels.toString() + 'px;">'
                        + '</div></div>';
                } else {
                    // do nothing
                }

                $rowContainer.append(template);
            });
        };

        /**
         * Переместить панель с выбором view в шапку таблицы слева
         */
        var _moveViewToolBar = function () {
            var $toolbar = $('.k-floatwrap.k-header.k-gantt-toolbar');
            var $toolbarContainer = $('.k-header[data-field=title]');

            if ($toolbarContainer.has($toolbar).length !== 0) {
                return;
            }

            var columnNameTextNode = $toolbarContainer.text();

            $toolbar.detach();
            $toolbar.append(columnNameTextNode);
            $toolbarContainer.empty().append($toolbar);
        };

        /**
         * Событие привязки данных
         * Используется для кастомизации внешнего вида
         * @param {Object} event - Объект события
         */
        var _onDataBound = function (event) {
            var kendoGantt = this;

            _moveViewToolBar();
            _customizeColumns(kendoGantt);
            _addPlanTasks(kendoGantt);
            _customizeGridContent(kendoGantt);

            var customOnDataBound = this.options.customOnDataBound;

            if (customOnDataBound && typeof customOnDataBound === 'function') {
                var context = this;
                var args = [].slice.call(arguments);

                customOnDataBound.apply(context, args);
            }
        };

        /**
         * Конструктор объекта
         * @param {Object} userOptions - Настройки пользователя
         */
        return function (userOptions) {
            if (!userOptions.element) {
                new Gantt.Error('Ошибка в параметрах', 'Не указано поле element').Notify();
                return;
            }

            userOptions.element = userOptions.element instanceof jQuery ? userOptions.element : $(userOptions.element);

            if (!userOptions.activityId) {
                new Gantt.Error('Ошибка в параметрах', 'Не указано поле activityId').Notify();
                userOptions.element.empty();
                return;
            }

            /**
             * Нужна ли полная перезагрузка ганта при показе
            */
            this._needFullReloadOnRefresh = false;

            /**
             * Обновление ганта
            */
            this.refresh = function () {
                if (this._needFullReloadOnRefresh) {
                    var $gantt = options.element.getKendoGantt();

                    $gantt.setOptions({});
                    this._needFullReloadOnRefresh = false;
                }
            };

            /**
             * Обновление ганта с переподтягиванием данных из датасета
            */
            this.reset = function () {
                if (!options.datasetName) {
                    console.warn("Датасет не указан.");
                    return;
                }

                var asystGantt = this;

                var afterLoad = function (error, results) {
                    if (error) {
                        error.Notify();
                        return;
                    }

                    var sourceTasks = results[0];
                    var sourceDeps = results[1];

                    _updateTasksAndDeps.call(asystGantt, options, sourceTasks, sourceDeps);
                };

                _loadViaDataset(options.datasetName, options.activityId, afterLoad);
            };

            /**
             * Обновление тасков и зависимостей
             * @param {Array} sourceTasks - массив тасков
             * @param {Array} sourceDeps -  масси зависимостей
             */
            this.updateTasksAndDeps = function (sourceTasks, sourceDeps) {
                _updateTasksAndDeps.call(this, options, sourceTasks, sourceDeps);
            };

            /**
             * Установка view
             * @param {string} viewName - название view
             */
            this.setView = function (viewName) {
                var kendoGantt = options.element.getKendoGantt();
                var views = kendoGantt.timeline.views;

                if (views[viewName]) {
                    kendoGantt.view(viewName);
                } else {
                    new Gantt.Error('Не наидена ' + viewName + ' view', 'Попытка установки отсутствующей view').Notify();
                }
            };

            /**
             * Отложенное обновление ганта при инициализации на скрытой вкладке
             * Причина создания: отсутствие события onshow
            */
            this._refreshDeferredOnShow = function () {
                if (!this._needFullReloadOnRefresh) {
                    return;
                }

                var asystGantt = this;

                var interval = setInterval(function () {
                    if (options.element.is(':visible')) {
                        asystGantt.refresh();
                        clearInterval(interval);
                    }
                }, 500);
            };

            /* Ресайз грида */
            this.resize = function () {
                var kendoGantt = options.element.getKendoGantt();
                kendoGantt.resize();
            };

            var options = {};
            _prepareOptions(options, userOptions);
            _initialize.call(this, options);
        };
    })();

    Gantt.getDefaultOptions = function () {
        return {
            element: null, // Обязательно, Id элемента на форме
            activityId: null, // Обязательно, Id сущности
            datasetName: 'dataset_PortfolioGantt', // Имя датасета, загружающего данные для ганта 
            customDataSource: null, // Данные, если датасет не указан
            customDependencies: null, // Связи, если датасет не указан
            customOnDataBound: null, // Событие привязки данных
            customIsWorkDay: null, // считать ли день рабочим?
            customTaskTemplate: null, // template для работ 
            customTooltipTemplate: null, // template для всплывающих подсказок 
            height: 700,
            selectedView: 'kendo.ui.GanttCustomYearView', // масштаб
            expandHierarchyTreshold: 200, // при открытии скрывать вложенность, если число элементов превышает порог
            kendoOptions: {
                dataSource: [],
                dependencies: [],
                views: [
                    {
                        type: "week",
                        title: "День",
                        slotSize: 35,
                        dayHeaderTemplate: kendo.template("#=kendo.toString(start, 'd').slice(0, 2)#")
                    },
                    { type: "year", title: "Месяц" },
                    { type: "kendo.ui.GanttCustomYearView", title: "Год" }
                ],
                columns: [
                    { field: "indicator", title: " ", width: 30 },
                    {
                        field: "title",
                        title: "Наименование"
                    }
                ],
                rowHeight: 26,
                editable: false, // только просмотр
                resizable: false, // ресайз колонок
                selectable: false, // выбор тасков
                showWorkDays: false // отображение только рабочих дней
            }
        };
    };

    Gantt.Error = (function () {
        return function (hiddenTitle, hiddenText, displayedTitle, displayedText) {
            this.hiddenTitle = hiddenTitle;
            this.hiddenText = hiddenText;
            this.displayedTitle = displayedTitle || 'Ошибка';
            this.displayedText = displayedText || 'Обратитесь за помощью к руководителю';
        };
    })();

    Gantt.Error.prototype.Notify = function () {
        NotifyWarning(this.displayedTitle, this.displayedText);
        console.warn(this.hiddenTitle + ': ' + this.hiddenText);
    };

    Asyst = Asyst || {};
    Asyst.kendo = Asyst.kendo || {};
    Asyst.kendo.Gantt = Gantt;
})();