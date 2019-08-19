/* eslint-disable no-undef */
/* eslint-disable no-loop-func */
/* eslint-disable camelcase */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-prototype-builtins */
/* eslint-disable max-depth */
Asyst.Gantt = function ($Container, ActivityId, userOptions) {
	'use strict';
	/**
     * Обездвиживание графической части:
     * Глобальную настройку GanttControl.options.IsReadOnly не удается применить, ровно как и использовать IsTaskReadOnlyBinding,
     *   так как необходимо сохранить возможность манипулировать связями на графической части;
     * Для различия источника изменений (таблица или графическая часть) используется объект GanttManipulationType
     * Для отката состояния при недопустимом изменении ганта используется следующая схема:
     *   - проверяется GanttManipulationType, если он по умолчанию isGraphical и нет изменения связи (
     *       - меняется ли связь проверяем на этапе onPropertyChanged с помощью флага isLinkChange
     *         - если нет, то на этапе ActivityUpdated отмена
     *         - если да, то сохраняем изменения, стираем Undo стэк, чтобы впоследствии корректное изменение не затереть
     *           (другим изменением, которое внутри RadiantQ ганта не выполняет никакого Action, 
     *           например попытка сдвига таска через ограничение предшественника, следовательно Undo стирает старое)
     *   ), изменение следует отменить
     *   - отмена изменений на ганте осуществляется с помощью GanttControl.ActionManager.Undo()
     *     - игнорируются все сопутствующие изменения в методе onPropertyChanged флагом isUndoActionRunning
     *     - игнорирование в методе ActivityUpdated производится другим способом, так как этот метод вызывается асинхронно
     *   
     */


	// Настройки ганта
	var Options = $.extend({
		Custom_LoadDataSetName: 'LoadGanttData', // Имя датасета, через который будут получаться данные
		Custom_SavePointFormName: 'PointEditForm', // Имя формы редактирования точки

		// Дополнительные поля для отслеживания изменений. В виде массива строк.
		TrackCustomFields: null,

		// Кастомные имена для доп. полей в элементах данных.
		// В виде объекта { ModelFieldName: 'DataFieldName', ... }
		CustomFieldsNames: null,

		// Функция создания объекта из элемента данных (при заполнении гриды и после добавления нового элемента).
		// Параметры функции: createItemOriginal, task, predecessorArr.
		// createItemOriginal - оригинальный вариант функции создания объекта из элемента данных. Ее удобно использовать в случае, когда все старые поля остаются, но нужно добавить несколько новых.
		// task - элемент данных.
		// predecessorArr - предшественники данного элемента.
		Custom_CreateItem: null,

		// Дополнение для функции перекладывания изменившихся полей из объекта модели в объект данных
		// Параметры функции: items, item, updated, changeInfo, gantt, bits.
		// bits - это объект следующей структуры: { isChanged: isChanged, isClearCritical: isClearCritical, isClearIndicator: isClearIndicator }
		// Данные поля в этом объекте можно изменить - и это повлияет на результаты работы метода ActivityUpdated.
		Custom_ActivityUpdated: null,

		// Функция выполняющаяся при наступлении события начала перетаскивания КТ\Таска
		Custom_CanShiftActivity: null,

		/**
         * Функция для задания собственной логики отображения индикаторов
         * При возврате из функции null или undefined, применяется логика по умолчанию
         * @param dataSource источник данных
         * @return индикатор
         */
		Custom_GetIndicator: null,

		/**
         * Объект для добавления собственных индикаторов к индикаторам по умолчанию
         * {
         *  0: 'Завершен',
         * ...
         * }
         */
		Custom_IndicatorTitles: null,
		// Системное поле. Обездвиживаю Таски/КТ с введенным фактом.
		CanShiftInProgressTasks: false

	}, userOptions);



	var self = this;
	var isUndoActionRunning = false;
	var isLinkChange = false;
	var loading;
	var _cachedDefaults = null;



	self.ActivityUpdated = function (activities, activity, updated) {
		// Запрет изменений с ганта, кроме изменения связей
		if (self.GanttManipulationType.isGraphical() && !isLinkChange) {
			// Изменений не происходило (отсеивание повторной отмены изменений)
			// isUndoActionRunning не подходит, так как ActivityUpdated вызывается асинхронно, флаг к этому времени уже false
			if (Object.keys(updated).length === 0) {
				return;
			}

			self.undoLastChanges();
			return;
		}

		var isTaskToMilestoneTransformation = activity.DataSource.IsMilestone !== activity.IsMilestone;
		var activityHasChild = activity.ChildActivities.length > 0;
		// Запрет на превращение таска в КТ
		// Допускается случай, когда Этап превращается в КТ с потомком-КТ
		// Такое изменение не летит на сервер, происходит во внутренней реализации ганта
		if (isTaskToMilestoneTransformation && !activityHasChild) {
			self.undoLastChanges();
			return;
		}

		self.BeginUpdate(activity.ID);

		try {
			var isClearCritical = false;
			var isClearIndicator = false;

			self.GanttControl.fixDependentTaskStartTimes();

			if (!self.GanttControl.hasActivity(activity.id)) {
				self.GanttChanges.addChange(activity.id, 'wasDeleted', true);
			}

			if (updated.hasOwnProperty('PredecessorIndexString')) {
				if (!updated.PredecessorIndexString.OldValue && !activity.PredecessorIndexString) {
					// Изменений не было
				} else {
					var activityIsSummary = activity.ChildActivities.length > 0;

					if (activityIsSummary) {
						activity.DataSource.UndoPredecessorChanges();
						self.undoLastChanges();
					} else {
						self.GanttChanges.addPredecessorChange(activity.id, activity.DataSource.Predecessors, activity.DataSource.PristinePredecessors);
						isClearCritical = true;
					}
				}
			}

			if (updated.hasOwnProperty('ActivityName')) {
				self.GanttChanges.addChange(activity.id, 'Name', activity.ActivityName);
			}

			if (updated.hasOwnProperty('Parent')) {
				isClearCritical = isClearCritical || updated.Parent !== activity.Parent;
				isClearIndicator = isClearIndicator || updated.Parent !== activity.Parent;
				var parentId = activity.Parent ? activity.Parent.ID : ActivityId;
				self.GanttChanges.addChange(activity.id, 'ParentId', parentId);
				/* чото про обновление родителей */
				setTimeout(function () {
					if (updated.Parent.OldValue) {
						if (updated.Parent.OldValue.ChildActivities.length === 0) {
							restoreSummaryDates(updated.Parent.OldValue);
						} else {
							Asyst.Gantt.ActivityManager.updateDatesForParent(updated.Parent.OldValue, self.GanttControl);
						}
					}
					if (activity.Parent) {
						Asyst.Gantt.ActivityManager.updateDatesForParent(activity.Parent, self.GanttControl);
					}
				});
			}

			if (updated.hasOwnProperty('SortOrder')) {
				self.GanttChanges.addChange(activity.id, 'OrderIndex', activity.SortOrder);
			}

			if (activity.DataSource.IsMilestone) {
				if (updated.hasOwnProperty('EndTime')) {
					isClearCritical = true;
					isClearIndicator = true;
					var isSummary = activity.ChildActivities.length > 0;

					if (isSummary) {
						console.warn('ActivityUpdated(ошибочное состояние): у [' + activity.ID + '] КТ имеются потомки!');
					}

					var IsEndTimeChanged = !activity.EndTime.equals(activity.DataSource.ForecastEndTime);

					if (IsEndTimeChanged) {
						Asyst.Gantt.ActivityManager.SetForecastEndTime(activity.DataSource, activity.EndTime, false);
						if (activity.DataSource.FactEndTime) {
							Asyst.Gantt.ActivityManager.SetFactEndTime(activity.DataSource, activity.EndTime, false);
						}

						self.GanttChanges.addChange(activity.id, 'ForecastDate', new Date(activity.EndTime));

						if (activity.DataSource.FactEndTime) {
							// when EndTime was changed by constraints
							// setTime to aviod triggering onPropertyChanged
							self.GanttChanges.addChange(activity.id, 'FactDate', new Date(activity.DataSource.FactEndTime));
							if (activity.DataSource.ActivityPhaseId !== Asyst.Gantt.Helper.CONSTANTS.DONE_ACTIVITY_PHASE_ID) {
								activity.DataSource.ActivtyPhaseId = Asyst.Gantt.Helper.CONSTANTS.DONE_ACTIVITY_PHASE_ID;
								self.GanttChanges.addChange(activity.id, 'ActivityPhaseId', Asyst.Gantt.Helper.CONSTANTS.DONE_ACTIVITY_PHASE_ID);
							}
						}
					}
				}
			} else {
				if (updated.hasOwnProperty('EndTime')) {
					isClearCritical = true;
					isClearIndicator = true;

					Asyst.Gantt.ActivityManager.SetForecastEndTime(activity.DataSource, activity.EndTime, false);
					if (activity.DataSource.FactEndTime) {
						Asyst.Gantt.ActivityManager.SetFactEndTime(activity.DataSource, activity.EndTime, false);
					}

					//суммарной задаче даты не пишем в базу
					if (activity.ChildActivities.length === 0) {
						self.GanttChanges.addChange(activity.id, 'ForecastDate', new Date(activity.EndTime));
						if (activity.DataSource.FactEndTime) {
							self.GanttChanges.addChange(activity.id, 'FactDate', new Date(activity.DataSource.FactEndTime));

							if (activity.DataSource.ActivityPhaseId !== Asyst.Gantt.Helper.CONSTANTS.DONE_ACTIVITY_PHASE_ID) {
								activity.DataSource.ActivtyPhaseId = Asyst.Gantt.Helper.CONSTANTS.DONE_ACTIVITY_PHASE_ID;
								self.GanttChanges.addChange(activity.id, 'ActivityPhaseId', Asyst.Gantt.Helper.CONSTANTS.DONE_ACTIVITY_PHASE_ID);
							}
						}
					}
				}
				if (updated.hasOwnProperty('StartTime')) {
					isClearCritical = true;
					isClearIndicator = true;

					Asyst.Gantt.ActivityManager.SetForecastStartTime(activity.DataSource, activity.StartTime, false);
					if (activity.DataSource.FactStartTime) {
						Asyst.Gantt.ActivityManager.SetFactStartTime(activity.DataSource, activity.StartTime, false);
					}

					//суммарной задаче даты не пишем в базу
					if (activity.ChildActivities.length === 0) {
						self.GanttChanges.addChange(activity.id, 'StartForecastDate', new Date(activity.StartTime));
						if (activity.DataSource.FactStartTime) {
							// when StartTime was changed by constraints
							// setTime to aviod triggering onPropertyChanged
							self.GanttChanges.addChange(activity.id, 'StartFactDate', new Date(activity.DataSource.FactStartTime));
						}
					}
				}
			}

			// Дополнительная логика для кастомных полей
			if (Options.Custom_ActivityUpdated && typeof Options.Custom_ActivityUpdated === 'function') {
				var bits = {
					isClearCritical: isClearCritical,
					isClearIndicator: isClearIndicator
				};
				Options.Custom_ActivityUpdated(activities, activity, updated, self.GanttChanges, self, bits);

				isClearCritical = isClearCritical || bits.isClearCritical;
				isClearIndicator = isClearIndicator || bits.isClearIndicator;
			}

			if (isClearCritical) {
				self.CriticalPathActivities = [];
			}

			if (isClearIndicator) {
				activity.DataSource.MarkBranchIndicatorsAsDirty();

				var pointParentChanged = updated.hasOwnProperty('Parent');
				var pointWasOnFirstLevel = pointParentChanged && updated.Parent.OldValue == null;

				if (pointParentChanged && !pointWasOnFirstLevel) {
					updated.Parent.OldValue.DataSource.MarkBranchIndicatorsAsDirty();
				}
			}
		} finally {
			self.EndUpdate(activity.ID);
		}
	};



	/**
     * Обертка GanttControl
     */
	self.GanttControl = (function ($container, activityUpdated, GanttHelper, GanttActivityManager) {

		var _control;

		var _setOptions = function (ganttOptions) {
			_setLoadedTasks(ganttOptions.DataSource);
			$container.GanttControl(ganttOptions);
		};

		var _enableShowingVerticalScrollBar = function () {
			_control.GetGanttChartInstance().options.ShowVerticalScrollBar = true;
		};

		// Enable record of all actions, undo, redo
		var _enableRecordingActions = function () {
			_control.ActionManager.EnableRecordingActions = true;
		};

		var _enableChartScrollingOnMousewheel = function (speedFactor) {
			var $chart = $(_control.GetGanttChart());
			var $table = _control.GetGanttTable().uiGridBody;

			$chart.mousewheel(function (event, delta) {
				$table.scrollTop($table.scrollTop() - delta * speedFactor);

				event.preventDefault();
			});
		};

		var _disableGanttGridEditingWhenReadOnly = function () {
			var table = _control.GetGanttTable();

			table.isEditableOriginal = table.isEditable;
			table.isEditable = function (ganttActivityView, columnInfo) {
				var isGlobalReadOnly = _control.options.IsReadOnly;
				return !isGlobalReadOnly
					&& table.isEditableOriginal(ganttActivityView, columnInfo)
					&& (!columnInfo.isEditabled || columnInfo.isEditabled(ganttActivityView));
			};
		};

		var _enableTaskImmobilityIfHasFactDate = function (ganttOptions) {
			var preventMovingIfHasFactDate = function (ganttControl, eventArgs) {
				var dataSource = eventArgs.Activity.DataSource;
				var hasAnyFactDate = Boolean(dataSource.FactStartTime || dataSource.FactEndTime);

				eventArgs.Cancel = hasAnyFactDate;
			};

			var canShiftActivity = function (ganttControl, eventArgs) {
				preventMovingIfHasFactDate.call(this, ganttControl, eventArgs);

				ganttOptions.Custom_CanShiftActivity
					&& typeof ganttOptions.Custom_CanShiftActivity === 'function'
					&& ganttOptions.Custom_CanShiftActivity.call(this, ganttControl, eventArgs);
			};

			_control.CanShiftActivity.subscribe(canShiftActivity);
		};

		var _enableRestoringHScrollPositionOnVScroll = function (control, ganttOptions) {
			if (ganttOptions.UseVirtualization) {
				// Отслеживание актуальной позиции горизонтального скролла
				var _lastLeftScrollPosition = 0;

				control.grid.uiGridBody.scroll(function (event) {
					var $target = $(event.currentTarget);
					var leftScrollPosition = $target.scrollLeft();
					var isHorizontalScroll = leftScrollPosition !== _lastLeftScrollPosition;

					if (isHorizontalScroll) {
						_lastLeftScrollPosition = leftScrollPosition;
					}
				});

				// При любом обновлении таблицы ганта восстанавливать позицию leftScroll
				// TODO потенциальное узкое место
				// Также можно отследить избыточные обновления
				control.grid.element.on('refresh', function (event) {
					var $target = $(event.currentTarget);
					var $gridBody = $target.find('div.ui-widget-content.ui-grid-body');
					$gridBody.scrollLeft(_lastLeftScrollPosition);
				});

				// Восстановление позиции горизонтального скролла при вертикальном
				// После обновления контента грида
				control.VerticalScrollEvent.subscribe(function (event) {
					var $target = $(event.currentTarget);
					$target.scrollLeft(_lastLeftScrollPosition);
				});
			}
		};

		var _disableEnforcingDependencyConstraintsByFactTasks = function (control/*, ganttOptions*/) {
			control.ShouldEnforceDependencyConstraintsOnActivity.subscribe(function (control, eventArgs) {
				var dataSource = eventArgs.Activity.DataSource;

				if (dataSource.FactStartTime || dataSource.FactEndTime) {
					// Не соблюдать ограничения
					eventArgs.Enforce = false;
				}
			});
		};

		var _clearTableContextMenu = function (control) {
			control.TableContextMenu.Items.Clear();
		};

		// Хранение статической информации о тасках
		var _LoadedTasks = [];

		function _getLoadedTasks() {
			return _LoadedTasks;
		};

		function _setLoadedTasks(tasks) {
			if (!tasks || !(tasks instanceof Array)) {
				return;
			}

			_LoadedTasks = tasks;
		};

		var _lastPanelWidthProportion = 0.5;
		var _isEditMode = false;

		return {
			init: function (ganttOptions) {
				_setOptions(ganttOptions);

				_control = $container.data('GanttControl');
				_control.Model.ActivityUpdated.subscribe(activityUpdated);

				_disableGanttGridEditingWhenReadOnly();
				_enableShowingVerticalScrollBar();
				_enableChartScrollingOnMousewheel(25);
				_enableRecordingActions();
				_enableTaskImmobilityIfHasFactDate(ganttOptions);
				_enableRestoringHScrollPositionOnVScroll(_control, ganttOptions);
				_disableEnforcingDependencyConstraintsByFactTasks(_control, ganttOptions);
				_clearTableContextMenu(_control);
			},

			setDataSource: function (initDataSource) {
				var dataSource = initDataSource && initDataSource.length > 0 ? initDataSource : [];

				var options = {
					WorkTimeSchedule: null,
					DataSource: dataSource
				};

				_setOptions(options);

				if (dataSource) {
					_control.Model.ActivityUpdated.subscribe(activityUpdated);
					this.fixDependentTaskStartTimes();
				}
			},

			setOption: function (optionName, optionValue) {
				var option = {};
				option[optionName] = optionValue;

				_setOptions(option);
			},

			getActivitiesMinDate: function () {
				if (!_control.Model) {
					return null;
				}

				return new Date(_control.Model.Activities.StartTime);
			},

			getActivitiesMaxDate: function () {
				if (!_control.Model) {
					return null;
				}

				return new Date(_control.Model.Activities.EndTime);
			},

			getActivityByCode: function (code) {
				var filteredActivities = this
					.getAllActivities()
					.filter(function (activity) {
						return activity.DataSource && activity.DataSource.Code === code;
					});

				if (filteredActivities.length === 0) {
					return null;
				}

				return filteredActivities[0];
			},

			getActivityById: function (id) {
				return _control.Model.GetActivityById(Number(id));
			},

			// причина создания: getActivityById не работает в момент движения таска по иерархии вложенности 
			// так как удаляется из коллекции при reparent'е
			getCodeById: function (id) {
				var task = _getLoadedTasks().filter(function (task) { return task.ID === id; });

				return task.length > 0 ? task[0].Code : '';
			},

			getChildActivitiesById: function (id) {
				return this.getActivityById(id).ChildActivities;
			},

			getParentActivitiesById: function (id) {
				var self = this;

				var buildParentActivitiesRecursive = function (id) {
					var currentActivity = self.getActivityById(id);

					if (currentActivity == null) {
						return [];
					}

					var parentId = currentActivity && currentActivity.Parent && currentActivity.Parent.id;

					return parentId == null
						? [currentActivity]
						: [currentActivity].concat(buildParentActivitiesRecursive(parentId));
				};

				return buildParentActivitiesRecursive(id);
			},

			getAllActivities: function () {
				return _control.Model.AllActivities.asArray;
			},

			getAllDependencies: function () {
				return _control.Model.Dependencies;
			},

			hasActivity: function (id) {
				return Boolean(this.getActivityById(id));
			},

			redrawGantt: function () {
				// eslint-disable-next-line no-undef
				if (RadiantQ.Gantt.RowDragDropTracker.IsDragStarted_M()) {
					return;
				}

				this.redrawChartRows();
				this.refreshGrid();

				var left = _control.grid.uiGridBody.scrollLeft();
				_control.grid.uiGridBody.scrollLeft(left);
			},

			redrawChartRow: function (activity) {
				_control.RedrawChartRow(activity);
			},

			redrawChartRows: function () {
				_control.RedrawChartRows();
			},

			refreshGrid: function () {
				this.refreshGrid = Asyst.Utils.debounce(function () {
					_control.grid.Refresh();
				}, 25);

				this.refreshGrid();
			},

			undoLastChanges: function () {
				if (!_control.ActionManager.CanUndo) {
					return;
				}

				_control.ActionManager.Undo();
			},

			getDependencyGraph: function () {
				var allActivities = this.getAllActivities();
				var allDependecies = this.getAllDependencies();

				return allActivities.map(function (activity) {
					var predecessorsIds = allDependecies
						.filter(function (dependency) {
							return dependency.FromActivity.id === activity.id;
						})
						.map(function (dependency) {
							return dependency.ToActivity.id;
						});

					predecessorsIds = predecessorsIds.length > 0 ? predecessorsIds : null;

					return {
						ID: activity.id,
						predecessors: predecessorsIds
					};
				});
			},

			addPoint: function (dataSource, fromTemplate) {
				if (fromTemplate) {
					_control.AddNewItem(dataSource);
					return;
				}

				var selectedActivity = _control.SelectedActivity;
				var ganttHasSelection = Boolean(selectedActivity);

				if (!ganttHasSelection) {
					_control.AddNewItem(dataSource);
					return;
				}

				var dataSourceParentId = dataSource.ParentId;
				var dataSourceParentActivity = this.getActivityById(dataSourceParentId);

				var isHighlevelPointChosen = !dataSourceParentActivity;

				if (!isHighlevelPointChosen) {
					// Вставляю следующей за выбранной на форме КТ
					_control.InsertNewItemAsSiblingBelow(dataSource, dataSourceParentActivity.DisplayIndex, true);
				} else if (ganttHasSelection) {
					// Вставляю следующей за выбранной на гантте КТ
					_control.InsertNewItemAsSiblingBelow(dataSource, selectedActivity.DisplayIndex, true);
				} else {
					// Вставляю последней в списке
					_control.AddNewItem(dataSource);
				}
			},

			indent: function (activityId) {
				var activityView = _control.ActivityViews.GetActivityViewByID(Number(activityId));

				_control.Indent(activityView);
			},

			getSelectedActivity: function () {
				return _control.SelectedActivity;
			},

			getSelectedActivityView: function () {
				return _control.SelectedItem;
			},

			removeActivity: function (activityId) {
				_control.RemoveActivity(activityId);
			},

			removeDependenciesOf: function (activityId) {
				var activity = this.getActivityById(activityId);

				if (!activity) {
					return;
				}

				_control.Model.Dependencies.removeDependenciesOf(activity);
			},

			reparentActivity: function (activityId, activityParentId) {
				var activityView = _control.ActivityViews.GetActivityViewByID(Number(activityId));
				var activityParentView = _control.ActivityViews.GetActivityViewByID(Number(activityParentId));

				_control.ReparentActivity(activityView, activityParentView);
			},

			createNewDependency: function (fromActivityId, toActivityId, linkType, lagInDays) {
				var fromActivity = this.getActivityById(fromActivityId);
				var toActivity = this.getActivityById(toActivityId);

				if (!fromActivity || !toActivity) {
					console.warn('Не наиденa активность.');
					return;
				}

				var fullLinkType = GanttHelper.CONSTANTS.LINKTYPES[linkType].fullName;

				if (!fullLinkType) {
					console.warn('Не наиден тип связи.');
					return;
				}

				// eslint-disable-next-line no-undef
				var lagAsTimeSpan = new RQTimeSpan().addDays(lagInDays);

				_control.Model.CreateNewDependency(fromActivity, toActivity, fullLinkType, lagAsTimeSpan);
			},

			canAddNewDependency: function (fromActivityId, toActivityId, linkType) {
				var fromActivity = this.getActivityById(fromActivityId);
				var toActivity = this.getActivityById(toActivityId);

				if (!fromActivity || !toActivity) {
					console.warn('Не наиденa активность.');
					return false;
				}

				var fullLinkType = GanttHelper.CONSTANTS.LINKTYPES[linkType].fullName;

				if (!fullLinkType) {
					console.warn('Не наиден тип связи.');
					return;
				}

				if (toActivity.ChildActivities.length > 0) {
					console.warn('Работа-последователь - суммарная');
					return;
				}

				return _control.Model.CanAddNewDependency(fromActivity, toActivity, fullLinkType);
			},

			getGanttTable: function () {
				return _control.grid;
			},

			setReadonly: function (isReadonly) {
				$container.GanttControl('option', 'IsReadOnly', isReadonly);
			},

			isReadonly: function () {
				return _control.options.IsReadOnly;
			},

			getActivityByUid: function (uid) {
				var activityViewIndex = _control.ActivityViews.findByPropertyValue('uid', uid);

				if (activityViewIndex === -1) {
					console.warn('ActivityView is not found');
					return null;
				}

				var activityView = _control.ActivityViews[activityViewIndex];
				return activityView.Activity;
			},

			getColumnIndexByField: function (fieldName) {
				var frozenColumns = _control.grid.FrozenColumn;
				var columns = _control.grid.Column;

				var column = columns.filter(function (column) {
					return column.field === fieldName;
				})[0];

				var frozenColumn = frozenColumns.filter(function (column) {
					return column.field === fieldName;
				})[0];

				if (column) {
					return columns.indexOf(column) + frozenColumns.length;
				} else if (frozenColumn) {
					return frozenColumns.indexOf(frozenColumn);
				} else {
					return -1;
				}
			},

			hideColumnByField: function (fieldName) {
				_control.grid.hideColumn(this.getColumnIndexByField(fieldName));
			},

			showColumnByField: function (fieldName) {
				_control.grid.showColumn(this.getColumnIndexByField(fieldName));
			},

			copyForecastToPlan: function () {
				this.getAllActivities()
					.forEach(function (activity) {
						if (!activity.IsMilestone) {
							var startForecastDate = activity.StartTime;
							GanttActivityManager.SetStartPlanDate(activity.DataSource, new Date(startForecastDate), true);
						}

						var forecastDate = activity.EndTime;
						GanttActivityManager.SetPlanDate(activity.DataSource, new Date(forecastDate), true);
					});
			},

			clearUndoStack: function () {
				_control.ActionManager.Clear();
			},

			getContainerWidth: function () {
				var $gantt = $(_control.element);
				var $container = $gantt.find('#ganttplace_TopDivContainer');
				return $container.width();
			},

			updateTablePanelWidth: function (newWidth) {
				var $gantt = $(_control.element);
				var $container = $gantt.find('#ganttplace_TopDivContainer');

				var maxWidth = $container.width();

				var width = newWidth > maxWidth ? maxWidth : newWidth;
				width = width < 1 ? 1 : width;

				var layout = $container.data('layout');
				layout.sizePane('west', width);
			},

			restorePanelWidthByProportion: function (proportion) {
				var resultWidth = this.getContainerWidth() * proportion;

				this.updateTablePanelWidth(resultWidth);
			},

			enableEditing: function () {
				_lastPanelWidthProportion = this.getPanelProportion();

				this.updateTablePanelWidth(this.getContainerWidth());

				_isEditMode = true;
			},

			disableEditing: function () {
				this.restorePanelWidthByProportion(_lastPanelWidthProportion);

				_isEditMode = false;
			},

			isEditMode: function () {
				return _isEditMode;
			},

			getPanelProportion: function () {
				var $gantt = $(_control.element);
				var $container = $gantt.find('#ganttplace_TopDivContainer');
				var layout = $container.data('layout');
				var paneSize = layout.west.state.size;

				return paneSize / this.getContainerWidth();
			},

			getWBSById: function (activityId) {
				if (activityId == null) {
					return activityId;
				}

				var activity = this.getActivityById(activityId);

				if (activity == null) {
					return null;
				}

				return activity.DataSource.WBS;
			},

			getActivityByWBS: function (wbs) {
				if (wbs == null) {
					return wbs;
				}

				var activity = this.getAllActivities()
					.filter(function (activity) {
						return activity.DataSource.WBS === wbs;
					})[0];

				if (!activity) {
					return null;
				}

				return activity == null ? null : activity;
			},

			anyActivities: function () {
				return this.getAllActivities().length > 0;
			},

			getAllDataSources: function () {
				return this
					.getAllActivities()
					.map(function (activity) {
						return activity.DataSource;
					});
			},

			isParent: function (id) {
				if (!id) {
					console.warn('Не передан id');
					return;
				}

				return this.getChildActivitiesById(id).length > 0;
			},

			validate: function () {
				var dataSources = this.getAllDataSources();

				var message = '';

				dataSources.forEach(function (dataSource) {
					var validationResult = dataSource.validate();

					if (validationResult.isValid()) {
						return;
					} else {
						message += validationResult.getDescription() + '<br>';
					}
				});

				return message ? new GanttHelper.ValidationResult(false, message) : GanttHelper.ValidationResult.SUCCESS;
			},

			getTaskActivities: function () {
				var thisGanttControl = this;
				return this
					.getAllActivities()
					.filter(function (activity) {
						var dataSource = activity.DataSource;

						var isTask =
							!dataSource.IsMilestone // не КТ
							&& !thisGanttControl.isParent(dataSource.ID); // не Этап

						return isTask;
					});
			},

			/*
             *  Восстанавливаем даты зависимым таскам.
             *
             * Так как StartTime для зависимых КТ / Тасков(придвинутых вплотную к родителю) проставляется вчерашним днем в 23: 59: 59
             * (Из - за того, что Effort 1.00: 00: 00 -> 0.23: 59.59)
             * */
			fixDependentTaskStartTimes: function () {
				this.getTaskActivities()
					.filter(function (activity) {
						var dataSource = activity.DataSource;
						var hasFactDates = Boolean(dataSource.FactStartTime || dataSource.FactEndTime);

						var startTimeShouldFixed =
							activity.StartTime.getHours() === 23
							&& activity.StartTime.getMinutes() === 59
							&& activity.StartTime.getSeconds() === 59;

						return !hasFactDates && startTimeShouldFixed;
					})
					.forEach(function (activity) {
						activity.StartTime.addSeconds(1);
						activity.EndTime.addSeconds(1);
					});
			},

			removeDependencyFromActivityToActivity: function (fromActivityId, toActivityId) {
				var fromActivity = this.getActivityById(fromActivityId);
				var toActivity = this.getActivityById(toActivityId);

				if (!fromActivity || !toActivity) {
					return;
				}

				var predecessorsOfToActivity = _control.Model.Dependencies.GetPredecessors(toActivity);
				var successorsOfFromActivity = _control.Model.Dependencies.GetSuccessors(fromActivity);

				var intersectionDependency = predecessorsOfToActivity.filter(function (predecessor) {
					return successorsOfFromActivity.some(function (successor) {
						return predecessor === successor;
					});
				})[0];

				if (!intersectionDependency) {
					return;
				}

				_control.Model.Dependencies.remove(intersectionDependency);
			},

			getActivityViews: function () {
				return _control.ActivityViews;
			},

			getModel: function () {
				return _control.Model;
			}

		};
	})($Container, self.ActivityUpdated, Asyst.Gantt.Helper, Asyst.Gantt.ActivityManager);


	/**
     * Источник данных для Ганта
     */
	self.GanttItem = (function (GanttHelper, GanttControl, GanttOptions) {



		var _getIndicatorByStatistics = function (dataSource, hasChilds) {
			if (GanttOptions.Custom_GetIndicator) {
				var customResult = GanttOptions.Custom_GetIndicator(dataSource);

				if (customResult != null) {
					return customResult;
				}
			}

			if (!hasChilds) {
				if (dataSource.IsDone()) {
					return 4;
				} else if (dataSource.IsOverdue()) {
					return 3;
				} else if (dataSource.IsOut()) {
					return 2;
				} else if (dataSource.IsApproved()) {
					return 1;
				} else if (dataSource.IsDeclined()) {
					return 19;
				} else {
					return 0;
				}
			} else {
				if (dataSource.Statistics.Decline === dataSource.Statistics.Total) {
					return 19;
				} else if (dataSource.Statistics.Total === dataSource.Statistics.Done + dataSource.Statistics.Decline) {
					return 4;
				} else if (dataSource.Statistics.Total === dataSource.Statistics.Approve + dataSource.Statistics.Decline) {
					return 1;
				} else if (dataSource.Statistics.Overdue > 0) {
					return 3;
				} else if (dataSource.Statistics.Out > 0) {
					return 2;
				} else {
					return 0;
				}
			}
		};



		var _pairDatesAreValid = function (startDate, endDate, isMilestone) {
			if (!endDate) {
				return false;
			}

			if (!isMilestone) {
				if (!startDate) {
					return false;
				}

				if (startDate > endDate) {
					return false;
				}
			};

			return true;
		};



		var GanttItem = {};

		GanttItem.CreateDefault = function (point, predecessors) {
			if (!point) {
				return {};
			}

			var startPlanDate;
			var startTime;
			var factStartTime;
			var forecastStartTime;

			if (point.IsMilestone) {
				startPlanDate = point.PlanDate;
				startTime = point.ForecastDate || point.PlanDate;
				factStartTime = '';
				forecastStartTime = '';
			} else {
				startPlanDate = point.StartPlanDate;
				startTime = point.StartForecastDate || point.StartPlanDate;
				factStartTime = point.StartFactDate ? new Date(point.StartFactDate) : '';
				forecastStartTime = point.StartForecastDate || point.StartPlanDate;
			}

			var factEndTime = point.FactDate ? GanttHelper.getWithMaxTime(point.FactDate) : '';
			var forecastEndTime = point.ForecastDate || point.PlanDate;
			var endTime = point.ForecastDate || point.PlanDate;
			var planDate = point.PlanDate;

			if (!_pairDatesAreValid(startPlanDate, planDate, point.IsMilestone)) {
				startPlanDate = point.IsMilestone ? GanttHelper.getWithMaxTime(new Date()) : GanttHelper.getWithTruncatedTime(new Date());
				planDate = GanttHelper.getWithMaxTime(new Date());
			}

			if (!_pairDatesAreValid(forecastStartTime, forecastEndTime, point.IsMilestone)) {
				forecastStartTime = point.IsMilestone ? GanttHelper.getWithMaxTime(new Date()) : GanttHelper.getWithTruncatedTime(new Date());
				forecastEndTime = GanttHelper.getWithMaxTime(new Date());
			}

			if (!_pairDatesAreValid(startTime, endTime, point.IsMilestone)) {
				startTime = point.IsMilestone ? GanttHelper.getWithMaxTime(new Date()) : GanttHelper.getWithTruncatedTime(new Date());
				endTime = GanttHelper.getWithMaxTime(new Date());
			}

			var effort = point.IsMilestone ? new TimeSpan() : GanttHelper.calculateEffort(GanttHelper.getWithTruncatedTime(startTime), GanttHelper.getWithMaxTime(endTime));

			var progressPercent = GanttHelper.calculateProgressPercent(Boolean(point.StartFactDate), Boolean(point.FactDate));

			var ganttLinksArray = (predecessors || []).map(function (predecessor) {
				return new self.GanttLink(
					predecessor.id,
					predecessor.previousPointId,
					predecessor.linkType,
					Number(predecessor.lag)
				);
			});

			var ganttLinks = new self.GanttLinks(ganttLinksArray);

			return {
				Name: point.Name,
				ID: point.Id || point.id,
				StartTime: point.IsMilestone ? GanttHelper.getWithMaxTime(startTime) : new Date(startTime),
				PreferredStartTime: new Date(startTime),
				Effort: effort,
				EndTime: GanttHelper.getWithMaxTime(endTime),
				IndentLevel: point.level > 1 ? point.level - 1 : 0,
				PredecessorIndices: ganttLinks.toActivityString(),
				ProgressPercent: progressPercent,
				/* custom fields */
				FactStartTime: factStartTime,
				FactEndTime: factEndTime,
				ForecastStartTime: new Date(forecastStartTime),
				ForecastEndTime: GanttHelper.getWithMaxTime(forecastEndTime),
				StartPlanDate: new Date(startPlanDate),
				PlanDate: GanttHelper.getWithMaxTime(planDate),
				ApprovingDocumentName: point.ApprovingDocumentName,
				ApprovingDocumentId: point.ApprovingDocumentId,
				Responsible: point.Responsible,
				ResponsibleId: point.ResponsibleId,
				Indicator: point.Indicator,
				IndicatorColor: point.IndicatorColor,
				IndicatorTitle: point.IndicatorTitle,
				IsMilestone: point.IsMilestone,
				Code: point.Code || null,
				EntityName: point.EntityName,
				ParentId: point.ParentId,
				WBSID: point.WBS,
				WBS: point.WBS,
				Predecessors: ganttLinks,
				PristinePredecessors: ganttLinks.clone(),
				ActivityPhaseId: point.ActivityPhaseId,
				IsNew: function () {
					return !this.Code;
				},
				FactStartIsEmpty: function () {
					return !this.FactStartTime;
				},
				FactEndIsEmpty: function () {
					return !this.FactEndTime;
				},
				IsDone: function () {
					return this.ActivityPhaseId === GanttHelper.CONSTANTS.DONE_ACTIVITY_PHASE_ID;
				},
				IsOverdue: function () {
					return this.IsInWork()
						&& !this.FactEndTime
						&& GanttHelper.getWithTruncatedTime(this.PlanDate) < GanttHelper.getWithTruncatedTime(new Date());
				},
				IsOut: function () {
					return this.IsInWork()
						&& !this.FactEndTime
						&& GanttHelper.getWithTruncatedTime(this.PlanDate) >= GanttHelper.getWithTruncatedTime(new Date())
						&& GanttHelper.getWithTruncatedTime(this.ForecastEndTime) > GanttHelper.getWithTruncatedTime(this.PlanDate);
				},
				IsDeclined: function () {
					return this.ActivityPhaseId === GanttHelper.CONSTANTS.DECLINE_ACTIVITY_PHASE_ID;
				},
				IsApproved: function () {
					return this.ActivityPhaseId === GanttHelper.CONSTANTS.APPROVED_ACTIVITY_PHASE_ID;
				},
				IsInWork: function () {
					return this.ActivityPhaseId === GanttHelper.CONSTANTS.INWORK_ACTIVITY_PHASE_ID;
				},
				MarkBranchIndicatorsAsDirty: function () {
					GanttControl
						.getParentActivitiesById(this.ID)
						.map(function (activity) {
							return activity.DataSource;
						})
						.forEach(function (dataSource) {
							if (!dataSource) {
								return;
							}

							dataSource.HasIndicator = false;
						});
				},
				// TODO: vli переписать алгоритм
				GetIndicator: function () {
					var getIndicatorRecursive = function (dataSource) {
						if (dataSource.HasIndicator && dataSource.Indicator != null) {
							return dataSource.Indicator;
						}

						var stat = {};

						stat.Total = 0;
						stat.Done = 0;
						stat.Overdue = 0;
						stat.Out = 0;
						stat.Decline = 0;
						stat.Approve = 0;

						// TODO: vli данная строчка не позволяет вынести неймспейс за пределы класса Asyst.Gantt
						// а этот неймспейс не позволяет вынести GanttManager
						var childActivities = GanttControl.getChildActivitiesById(dataSource.ID);
						var hasChilds = childActivities && childActivities.length > 0;

						if (hasChilds) {
							childActivities.forEach(function (child) {
								if (!child || !child.DataSource) {
									return;
								}

								var childDataSource = child.DataSource;

								getIndicatorRecursive(childDataSource);

								stat.Total += childDataSource.Statistics.Total;
								stat.Done += childDataSource.Statistics.Done;
								stat.Overdue += childDataSource.Statistics.Overdue;
								stat.Out += childDataSource.Statistics.Out;
								stat.Decline += childDataSource.Statistics.Decline;
								stat.Approve += childDataSource.Statistics.Approve;
							});
						} else {
							stat.Total = 1;
							stat.Done = dataSource.IsDone() ? 1 : 0;
							stat.Overdue = dataSource.IsOverdue() ? 1 : 0;
							stat.Out = dataSource.IsOut() ? 1 : 0;
							stat.Decline = dataSource.IsDeclined() ? 1 : 0;
							stat.Approve = dataSource.IsApproved() ? 1 : 0;
						}

						dataSource.Statistics = stat;
						dataSource.Indicator = _getIndicatorByStatistics(dataSource, hasChilds);
						dataSource.IndicatorTitle = self.IndicatorTitles[dataSource.Indicator];
						dataSource.HasIndicator = true;

						return dataSource.Indicator;
					};

					return getIndicatorRecursive(this);
				},
				GetPredecessorCodes: function () {
					return this.Predecessors.toWBSString();
				},
				SetPredecessorCodes: function (values, isChangeFromTable) {
					var thisDataSource = this;

					var predecessors = new self.GanttLinks.FromString(values, isChangeFromTable);
					// Восстанавливаю у GanttLink поле id, если связь существовала до
					predecessors.restoreIdByPristinePredecessors(thisDataSource.PristinePredecessors);

					if (isChangeFromTable) {
						var oldPredecessors = this.Predecessors;
						var predecessorsForDelete = oldPredecessors.getNonIncludedIn(predecessors);
						var predecessorsForUpdate = predecessors.getChangedGanttLinks(oldPredecessors);
						var predecessorsForInsert = predecessors.getNewGanttLinks(oldPredecessors);

						predecessorsForDelete
							.concat(predecessorsForUpdate)
							.forEach(function (ganttLink) {
								self.GanttControl.removeDependencyFromActivityToActivity(ganttLink.getActivityId(), thisDataSource.ID);
							});

						predecessorsForUpdate
							.concat(predecessorsForInsert)
							.forEach(function (predecessor) {
								var canAddDependency = self.GanttControl.canAddNewDependency(
									predecessor.getActivityId(),
									thisDataSource.ID,
									predecessor.getLinkType()
								);

								if (canAddDependency) {
									self.GanttControl.createNewDependency(
										predecessor.getActivityId(),
										thisDataSource.ID,
										predecessor.getLinkType(),
										predecessor.getLagInDays()
									);
								}
							});
						return;
					}

					this.Predecessors = predecessors;
				},

				ChangeGanttManipulationType: function (manipulationTypeString) {
					self.GanttManipulationType.set(manipulationTypeString);
				},

				UndoPredecessorChanges: function () {
					this.Predecessors = this.PristinePredecessors.clone();
				},

				validate: function () {
					var isValid = true;
					var description = 'СДР ' + this.WBS + ':<br>';

					var nameIsValid = typeof this.Name === 'string' && this.Name.trim() !== '';
					if (!nameIsValid) {
						isValid = false;
						description += 'Поле \'Наименование\' не заполнено.<br>';
					}

					if (!self.GanttControl.isParent(this.ID)) {
						if (!this.IsMilestone) {
							var startPlanDateIsValid = this.StartPlanDate instanceof Date;
							if (!startPlanDateIsValid) {
								isValid = false;
								description += 'Поле \'Начало (план)\' не заполнено.<br>';
							}

							var startForecastDateIsValid = this.ForecastStartTime instanceof Date;
							if (!startForecastDateIsValid) {
								isValid = false;
								description += 'Поле \'Начало (прогноз)\' не заполнено.<br>';
							}

							var planEndGreaterThanStartValid = this.StartPlanDate <= this.PlanDate;
							if (!planEndGreaterThanStartValid) {
								isValid = false;
								description += '\'Начало (план)\' больше чем \'Окончание (план)\'.<br>';
							}
						}

						var planDateIsValid = this.PlanDate instanceof Date;
						if (!planDateIsValid) {
							isValid = false;
							description += 'Поле \'Окончание (план)\' не заполнено.<br>';
						}

						var forecastDateIsValid = this.ForecastEndTime instanceof Date;
						if (!forecastDateIsValid) {
							isValid = false;
							description += 'Поле \'Окончание (прогноз)\' не заполнено.<br>';
						}
					}

					if (!self.GanttControl.isParent(this.ID)) {
						var responsibleIsValid = typeof this.ResponsibleId === 'number' && !isNaN(this.ResponsibleId) && this.ResponsibleId !== 0;
						if (!responsibleIsValid) {
							isValid = false;
							description += 'Поле \'Исполнитель\' не заполнено.<br>';
						}

						var approvingDocumentIsValid = typeof this.ApprovingDocumentId === 'number' && !isNaN(this.ApprovingDocumentId) && this.ApprovingDocumentId !== 0;
						if (!approvingDocumentIsValid) {
							isValid = false;
							description += 'Поле \'Утв. документ\' не заполнено.<br>';
						}
					}

					return isValid ? GanttHelper.ValidationResult.SUCCESS : new GanttHelper.ValidationResult(false, description);
				}
			};
		};

		GanttItem.CreateCustom = function (customCreateItemFunction, point, predecessors) {
			return customCreateItemFunction(GanttItem.CreateDefault, point, predecessors);
		};

		return GanttItem;

	})(Asyst.Gantt.Helper, self.GanttControl, Options);



	/**
     * Неймспейс-посредник, для инкапсуляции логики взаимодействия с гантом
     * В данный момент является контейнером для кусков логики, вычлененной из старого кода
     */
	self.GanttManager = (function (GanttError, GanttItem, GanttDBManager, GanttOptions, GanttHelper) {
		return {
			CreateGanttItem: function (point, predecessors) {
				if (!point) {
					return {};
				}

				var IsCustomCreateItemSpecified = GanttOptions.Custom_CreateItem
					&& typeof GanttOptions.Custom_CreateItem === 'function';
				// TODO: vli использовать branching
				var item = IsCustomCreateItemSpecified ?
					GanttItem.CreateCustom(GanttOptions.Custom_CreateItem, point, predecessors) :
					GanttItem.CreateDefault(point, predecessors);

				// inject getter & setter with raising onPropertyChanged event
				RadiantQ.Gantt.Utils.InsertPropertyChangedTriggeringProperty(item, self.TrackCustomFields, true);
				item.PropertyChanged.subscribe(onPropertyChanged);

				return item;
			},

			SavePointsWithLinks: function (ganttChanges, isAsync, callback) {
				var referenceMap = {};
				var batch = new Asyst.API.Entity.Batch('Point');

				// Добавление новых точек
				ganttChanges.getNewPointChanges()
					.sort(function (a, b) {
						// Сортирую по WBS в плоский список, сохраняю последовательно исходя из предположения, что 
						// нижняя новая точка всегда будет иметь родителя, суррогатный ID которого уже сопоставлен с reference'ом из batch'а
						return a.WBS > b.WBS ? 1 : -1;
					})
					.forEach(function (newPoint) {
						var oldSurrogateId = newPoint.id;
						delete newPoint.id;

						if (GanttHelper.SurrogateId.isSurrogateId(newPoint.ParentId)) {
							newPoint.ParentId = referenceMap[newPoint.ParentId];
						}

						var newReferenceId = batch.add(null, newPoint);
						referenceMap[oldSurrogateId] = 'ref#' + newReferenceId;
					});

				// Удаление старых связей
				ganttChanges.getLinksForDeletion()
					.forEach(function (linkObject) {
						batch.delete(linkObject.PointPointId, { classname: 'PointPoint' });
					});

				// Удаление точек
				ganttChanges.getDeletedPointIds()
					.forEach(function (deletedPointId) {
						batch.delete(deletedPointId);
					});

				// Изменение старых точек
				ganttChanges.getOldPointChanges()
					.forEach(function (point) {
						if (GanttHelper.SurrogateId.isSurrogateId(point.ParentId)) {
							point.ParentId = referenceMap[point.ParentId];
						}

						batch.add(point.id, point);
					});

				// Добавление/изменение связей
				ganttChanges.getLinksForInsertOrUpdate()
					.forEach(function (linkObject) {
						var id = linkObject.PointPointId || null;
						delete linkObject.PointPointId;

						if (GanttHelper.SurrogateId.isSurrogateId(linkObject.PointId)) {
							linkObject.PointId = referenceMap[linkObject.PointId];
						}

						if (GanttHelper.SurrogateId.isSurrogateId(linkObject.PreviousPointId)) {
							linkObject.PreviousPointId = referenceMap[linkObject.PreviousPointId];
						}

						linkObject.classname = 'PointPoint';

						batch.add(id, linkObject);
					});

				batch.save(function () { callback(null, null); }, function () { callback(new Asyst.Gantt.Error(), null); }, isAsync);
			},

			LoadRestoredDatesOfPoint: function (pointId, isAsync, callback) {
				GanttDBManager.LoadRestoredDatesOfPoint(pointId, null, isAsync, callback);
			},

			LoadGanttData: function (projectId, isAsync, callback) {
				var self = this;

				var loadCallback = function (error, response) {
					if (error) {
						callback(error, null);
						return;
					}

					var dataSource = [];
					var hasLinks = response.Links instanceof Array && response.Links.length > 0;

					for (var i in response.Points) {
						if (!response.Points.hasOwnProperty(i)) {
							continue;
						}

						var point = response.Points[i];

						var pointPredecessors = [];

						if (hasLinks) {
							pointPredecessors = response.Links.filter(function (link) {
								return link.pointId === point.Id;
							});
						}

						dataSource.push(self.CreateGanttItem(point, pointPredecessors));
					}

					var result = {
						Links: response.Links,
						DataSource: dataSource,
						CalendarExceptions: response.CalendarExceptions,
						Users: response.Users,
						ApprovingDocuments: response.ApprovingDocuments
					};

					callback(null, result);
				};

				GanttDBManager.LoadGanttData(projectId, GanttOptions.Custom_LoadDataSetName, isAsync, loadCallback);
			}
		};
	})(Asyst.Gantt.Error, self.GanttItem, Asyst.Gantt.DBManager, Options, Asyst.Gantt.Helper);



	/**
     * Изменения 1 активности, подлежащие сохранению
     */
	self.GanttChangeItem = (function (/*GanttHelper, GanttControl*/) {

		var GanttChangeItem = function (pointId) {
			this.id = pointId;
			this.IsGanttChanged = true;
			this.pristinePredecessors = null;
		};

		GanttChangeItem.prototype.change = function (propName, value) {
			if (this.hasOwnProperty(propName) && this[propName] === value) {
				return false;
			} else {
				this[propName] = value;
				return true;
			}
		};

		GanttChangeItem.prototype.isEmpty = function () {
			for (var propName in this) {
				if (propName !== 'id'
					&& propName !== 'wasDeleted'
					&& propName !== 'pristinePredecessors'
					&& propName !== 'IsGanttChanged'
					&& this.hasOwnProperty(propName)) {
					return false;
				}
			}
			return true;
		};

		GanttChangeItem.prototype.hasChanges = function () {
			return !this.isEmpty();
		};

		GanttChangeItem.prototype.wasDependencyChanged = function () {
			return this.hasOwnProperty('Predecessors');
		};

		GanttChangeItem.prototype.wasWBSChanged = function () {
			return this.hasOwnProperty('WBS');
		};

		GanttChangeItem.prototype.wasParentIdChanged = function () {
			return this.hasOwnProperty('ParentId');
		};

		GanttChangeItem.prototype.getGanttLinksForDeletion = function () {
			if (!this.wasDependencyChanged()) {
				return [];
			}

			if (this.pristinePredecessors.isEmpty()) {
				return [];
			}

			return this.pristinePredecessors.getNonIncludedIn(this.Predecessors);
		};

		GanttChangeItem.prototype.getGanttLinksForInsertOrUpdate = function () {
			if (!this.wasDependencyChanged()) {
				return [];
			}

			if (this.Predecessors.isEmpty()) {
				return [];
			}

			var newGanttLinks = this.Predecessors.getNewGanttLinks(this.pristinePredecessors);
			var changedGanttLinks = this.Predecessors.getChangedGanttLinks(this.pristinePredecessors);

			return newGanttLinks.concat(changedGanttLinks);
		};

		GanttChangeItem.prototype.hasAnyDateChanging = function () {
			for (var attribute in this) {
				if (!this.hasOwnProperty(attribute)) {
					continue;
				}

				if (this[attribute] instanceof Date) {
					return true;
				}
			}

			return false;
		};

		GanttChangeItem.prototype.toPoint = function () {
			var point = {};

			for (var attribute in this) {
				if (!this.hasOwnProperty(attribute)) {
					continue;
				}

				if (attribute === 'PointPoint' || attribute === 'wasDeleted' || attribute === 'Predecessors' || attribute === 'pristinePredecessors') {
					continue;
				}

				point[attribute] = this[attribute];
			}

			return point;
		};

		GanttChangeItem.prototype.shouldBeExcludeFromSaving = function () {
			return this['wasDeleted'];
		};

		return GanttChangeItem;

	})(Asyst.Gantt.Helper, self.GanttControl);



	/*
      Изменения для всех затронутых активностей, подлежащие сохранению.
    */
	self.GanttChanges = (function (GanttChangeItem, GanttHelper, GanttControl) {

		var _changes = {};
		var _addedPoints = [];
		var _deletedPoints = [];

		var _inTransaction = false;
		var _changesOnLastTransactionCommit = {};


		var _getChangeById = function (pointId) {
			return _changes[pointId];
		};
		var _clearChangeById = function (pointId) {
			delete _changes[pointId];
		};

		var _hasNotCycleDependenciesValidation = function () {
			var graph = GanttControl.getDependencyGraph();

			if (Asyst.Utils.graphHasCycles(graph)) {
				return new GanttHelper.ValidationResult(false, 'Попытка создания циклической связи');
			}

			return GanttHelper.ValidationResult.SUCCESS;
		};


		return {
			addChange: function (pointId, parameterName, newValue) {
				var ganttChangeItem = _getChangeById(pointId);

				if (!ganttChangeItem) {
					ganttChangeItem = _changes[pointId] = new GanttChangeItem(pointId);
				}

				ganttChangeItem.change(parameterName, newValue);
			},

			addPredecessorChange: function (pointId, newPredecessors, pristinePredecessors) {
				this.addChange(pointId, 'Predecessors', newPredecessors);

				if (this.pristinePredecessors == null) {
					this.addChange(pointId, 'pristinePredecessors', pristinePredecessors || []);
				}
			},

			addPointDeletionChange: function (pointId) {
				if (!Asyst.Gantt.Helper.SurrogateId.isSurrogateId(pointId)) {
					_deletedPoints.push(pointId);
				} else {
					// Удаление свежедобавленного
					_addedPoints = _addedPoints.filter(function (addedPoint) {
						return addedPoint.id !== pointId;
					});
				}

				_clearChangeById(pointId);
			},

			addPointAddingChange: function (data) {
				_addedPoints.push(data);
				this.addChange(data.id, 'IsGanttChanged', true);
			},

			hasChanges: function () {
				for (var changePointId in _changes) {
					if (!_changes.hasOwnProperty(changePointId)) {
						continue;
					}

					if (this.doesPointHaveChanges(changePointId)) {
						return true;
					}
				}

				if (_deletedPoints.length > 0) {
					return true;
				}

				if (_addedPoints.length > 0) {
					return true;
				}

				return false;
			},

			doesPointHaveChanges: function (pointId) {
				var ganttChangeItem = _getChangeById(pointId);

				return ganttChangeItem ? ganttChangeItem.hasChanges() : false;
			},

			clear: function () {
				_changes = {};
				_changesOnLastTransactionCommit = {};
				_addedPoints = [];
				_deletedPoints = [];
			},

			validate: function () {
				var hasNotCycleDependenciesValidationResult = _hasNotCycleDependenciesValidation();
				if (!hasNotCycleDependenciesValidationResult.isValid()) {
					return hasNotCycleDependenciesValidationResult;
				}

				return GanttHelper.ValidationResult.SUCCESS;
			},

			getLinksForDeletion: function () {
				var result = [];

				for (var pointId in _changes) {
					if (!_changes.hasOwnProperty(pointId)) {
						continue;
					}

					var ganttChangeItem = _getChangeById(pointId);

					if (!ganttChangeItem.wasDependencyChanged()) {
						continue;
					}

					var linkObjectsForDeletion = ganttChangeItem
						.getGanttLinksForDeletion()
						.map(function (ganttLink) {
							return ganttLink.toDeleteObject();
						});

					result = result.concat(linkObjectsForDeletion);
				}

				return result;
			},

			getLinksForInsertOrUpdate: function () {
				var result = [];

				for (var pointId in _changes) {
					if (!_changes.hasOwnProperty(pointId)) {
						continue;
					}

					var ganttChangeItem = _getChangeById(pointId);

					if (!ganttChangeItem.wasDependencyChanged()) {
						continue;
					}

					var linkObjectsForInsertOrUpdate = ganttChangeItem
						.getGanttLinksForInsertOrUpdate()
						.map(function (ganttLink) {
							return ganttLink.toInsertOrUpdateObject(Number(pointId));
						});

					result = result.concat(linkObjectsForInsertOrUpdate);
				}

				return result;
			},

			getPointsWithChangedFields: function () {
				var points = [];

				for (var pointId in _changes) {
					if (!_changes.hasOwnProperty(pointId)) {
						continue;
					}

					var ganttChangeItem = _getChangeById(pointId);

					if (ganttChangeItem.isEmpty() || ganttChangeItem.shouldBeExcludeFromSaving()) {
						continue;
					}

					points.push(ganttChangeItem.toPoint());
				}

				return points;
			},

			isMultipleDateChanging: function () {
				var changeItemNumber = 0;

				for (var pointId in _changes) {
					if (!_changes.hasOwnProperty(pointId)) {
						continue;
					}

					var ganttChangeItem = _getChangeById(pointId);

					if (ganttChangeItem.hasAnyDateChanging()) {
						changeItemNumber++;

						if (changeItemNumber > 1) {
							return true;
						}
					}
				}

				return false;
			},

			IsWBSChange: function () {
				for (var _changeId in _changes) {
					if (!_changes.hasOwnProperty(_changeId)) {
						continue;
					}

					var _change = _changes[_changeId];

					if (_change.wasWBSChanged()) {
						return true;
					}
				}

				return false;
			},

			getDeletedPointIds: function () {
				return _deletedPoints.slice();
			},

			getPointChanges: function () {
				var addedPoints = GanttHelper.cloneArray(_addedPoints);
				var changes = GanttHelper.cloneArray(this.getPointsWithChangedFields());

				addedPoints.forEach(function (addedPoint) {
					// Иначе перезатирает автоматически присвоенный код
					delete addedPoint.Code;
				});

				// Сливаем изначальную информацию по добавленным Таскам/КТ с изменениями
				changes.forEach(function (change) {
					var addedPoint = addedPoints.filter(function (addedPoint) {
						return addedPoint.id === change.id;
					})[0];

					if (addedPoint) {
						$.extend(addedPoint, change);
					} else {
						addedPoints.push(change);
					}
				});

				return addedPoints;
			},

			getNewPointChanges: function () {
				return this.getPointChanges()
					.filter(function (point) {
						return Asyst.Gantt.Helper.SurrogateId.isSurrogateId(point.id);
					});
			},

			getOldPointChanges: function () {
				return this.getPointChanges()
					.filter(function (point) {
						return !Asyst.Gantt.Helper.SurrogateId.isSurrogateId(point.id);
					});
			},

			beginTransaction: function () {
				if (_inTransaction) {
					return;
				}

				_inTransaction = true;
			},

			commitTransaction: function () {
				if (!_inTransaction) {
					return;
				}

				_inTransaction = false;
				_changesOnLastTransactionCommit = GanttHelper.deepClone(_changes);
			},

			rollbackTransaction: function () {
				if (!_inTransaction) {
					return;
				}

				_inTransaction = false;
				_changes = _changesOnLastTransactionCommit;
			},

			restoreState: function () {
				if (_inTransaction) {
					this.rollbackTransaction();
				} else {
					_changes = _changesOnLastTransactionCommit;
				}
			}
		};
	})(self.GanttChangeItem, Asyst.Gantt.Helper, self.GanttControl);



	self.GanttLink = (function (GanttHelper) {
		function GanttLink(id, activityId, linkTypeShort, lagInHours) {
			if (!activityId || !linkTypeShort) {
				throw 'Переданы не все обязательные аргументы';
			}

			this._id = id || null;
			this._activityId = Number(activityId);

			this._linkTypeShort = linkTypeShort;

			if (!lagInHours) {
				this._lagInHours = null;
				this._lagPrefix = null;
			} else {
				this._lagInHours = lagInHours;
				this._lagPrefix = lagInHours > 0 ? '+' : '-';
			}
		}


		GanttLink.FromString = function (rawLinkString, isLinkInUserFriendlyFormat) {
			if (rawLinkString == null) {
				return null;
			}

			var linkString = rawLinkString.replace(/\s+/g, '');

			if (linkString === '') {
				return null;
			}

			var matches = linkString.match(GanttHelper.CONSTANTS.LINK_FROM_STRING_REGEXP);

			if (!matches || !matches.length || matches.length > 4) {
				return null;
			}

			var activityId = isLinkInUserFriendlyFormat ? self.GanttControl.getActivityByWBS(matches[1]).ID : matches[1];

			var lagInHours = (matches[3] || null)
				&& parseInt(matches[3]) * (isLinkInUserFriendlyFormat ? 24 : 1);

			return new GanttLink(
				null,
				activityId,
				matches[2] || 'FS',
				lagInHours
			);
		};

		/**
         * Преобразовывает описание связи точки в строку описания
         * @returns {string} строка описание связи и лага, 20SS+33
         */
		GanttLink.prototype.toWBSString = function () {
			var lag = this._lagInHours ? this._lagPrefix + this._lagInHours / 24 : '';
			var wbs = self.GanttControl.getWBSById(this._activityId);

			if (wbs == null) {
				return '';
			}

			return wbs + this._linkTypeShort + lag;
		};

		/**
         * Преобразовывает описание связи точки в строку описания
         * @returns {string} строка описание связи и лага, 25836SS+33
         */
		GanttLink.prototype.toActivityString = function () {
			var lag = this._lagInHours ? this._lagPrefix + this._lagInHours : '';
			return this._activityId + this._linkTypeShort + lag;
		};

		GanttLink.prototype.getActivityId = function () {
			return this._activityId;
		};

		GanttLink.prototype.equals = function (ganttLink) {
			if (!(ganttLink instanceof GanttLink)) {
				throw 'Неверный аргумент';
			}

			return this._id === ganttLink._id
				&& this._activityId === ganttLink._activityId
				&& this._linkTypeShort === ganttLink._linkTypeShort
				&& this._lagInHours === ganttLink._lagInHours
				&& this._lagPrefix === ganttLink._lagPrefix;
		};

		GanttLink.prototype.toInsertOrUpdateObject = function (linkOwnerId) {
			var result = {
				PointId: linkOwnerId,
				PreviousPointId: this._activityId,
				LinkType: this._linkTypeShort,
				Lag: this._lagInHours ? this._lagPrefix + this._lagInHours / 24 : null
			};

			if (this._id) {
				result.PointPointId = this._id;
			}

			return result;
		};

		GanttLink.prototype.toDeleteObject = function () {
			return {
				PointPointId: this._id
			};
		};

		GanttLink.prototype.clone = function () {
			return new GanttLink(
				this._id,
				this._activityId,
				this._linkTypeShort,
				this._lagInHours
			);
		};

		GanttLink.prototype.restoreIdByPristinePredecessors = function (pristinePredecessors) {
			var thisGanttLink = this;

			var pristinePredecessor = pristinePredecessors
				.filter(function (pristinePredecessor) {
					return pristinePredecessor.getActivityId() === thisGanttLink.getActivityId();
				})[0];

			if (!pristinePredecessor) {
				return;
			}

			this._id = pristinePredecessor._id;
		};

		GanttLink.prototype.setActivityId = function (activityId) {
			this._activityId = activityId;
		};

		GanttLink.prototype.getLinkType = function () {
			return this._linkTypeShort;
		};

		GanttLink.prototype.getLagInDays = function () {
			return this._lagInHours ? this._lagPrefix + this._lagInHours / 24 : null;
		};

		return GanttLink;
	})(Asyst.Gantt.Helper);



	self.GanttLinks = (function (/*GanttHelper*/) {
		function GanttLinks(arrayOfGanttLink) {
			if (arrayOfGanttLink && !(arrayOfGanttLink instanceof Array)) {
				console.warn('Ошибочный аргумент:', arrayOfGanttLink);
				return;
			}

			this._ganttLinks = arrayOfGanttLink || [];
		}

		GanttLinks.FromString = function (rawLinksString, isStringInUserFriendlyFormat) {
			var ganttLinkStrings = !rawLinksString ? [] : rawLinksString.split(',');

			var ganttLinks = ganttLinkStrings
				.map(function (predecessorString) {
					return new self.GanttLink.FromString(predecessorString, isStringInUserFriendlyFormat);
				});

			return new GanttLinks(ganttLinks);
		};

		GanttLinks.prototype.add = function (ganttLink) {
			if (!(ganttlink instanceof self.GanttLink)) {
				console.warn('Ошибочный аргумент:', ganttlink);
				return;
			}

			this._ganttLinks.push(ganttLink);
		};

		GanttLinks.prototype.remove = function (activityId) {
			var ganttLinkIndex = -1;

			this._ganttLinks.forEach(function (ganttLink, index) {
				if (ganttLink.getActivityId() === activityId) {
					ganttLinkIndex = index;
					return;
				}
			})[0];

			if (ganttLinkIndex === -1) {
				return;
			}

			this._ganttLinks.splice(ganttLinkIndex, 1);
		};

		GanttLinks.prototype.getNonIncludedIn = function (otherGanttLinks) {
			if (!(otherGanttLinks instanceof GanttLinks)) {
				console.warn('Ошибочный аргумент:', otherGanttLinks);
				return;
			}

			return this._ganttLinks
				.filter(function (thisGanttLink) {
					return !otherGanttLinks.hasGanttLinkWithActivityId(thisGanttLink.getActivityId());
				});
		};

		GanttLinks.prototype.restoreIdByPristinePredecessors = function (pristineGanttLinks) {
			if (!(pristineGanttLinks instanceof GanttLinks)) {
				console.warn('Ошибочный аргумент:', pristineGanttLinks);
				return;
			}

			this._ganttLinks
				.forEach(function (ganttLink) {
					ganttLink.restoreIdByPristinePredecessors(pristineGanttLinks.asArray());
				});
		};

		GanttLinks.prototype.asArray = function () {
			return this._ganttLinks.map(function (ganttLink) {
				return ganttLink.clone();
			});
		};

		GanttLinks.prototype.toWBSString = function () {
			return this._ganttLinks.map(function (ganttLink) {
				return ganttLink.toWBSString();
			}).join(',');
		};

		GanttLinks.prototype.toActivityString = function () {
			return this._ganttLinks.map(function (ganttLink) {
				return ganttLink.toActivityString();
			}).join(',');
		};

		GanttLinks.prototype.clone = function () {
			var newGanttLinksArray = this._ganttLinks.map(function (ganttLink) {
				return ganttLink.clone();
			});

			return new GanttLinks(newGanttLinksArray);
		};

		GanttLinks.prototype.isEmpty = function () {
			return this._ganttLinks.length === 0;
		};

		GanttLinks.prototype.hasGanttLinkWithActivityId = function (activityId) {
			return this._ganttLinks
				.some(function (thisGanttLink) {
					return thisGanttLink.getActivityId() === activityId;
				});
		};

		GanttLinks.prototype.getChangedGanttLinks = function (pristineGanttLinks) {
			return this._ganttLinks
				.filter(function (thisGanttLink) {
					return pristineGanttLinks.asArray()
						.some(function (pristineGanttLink) {
							return pristineGanttLink.getActivityId() === thisGanttLink.getActivityId()
								&& !thisGanttLink.equals(pristineGanttLink);
						});
				});
		};

		GanttLinks.prototype.getNewGanttLinks = function (pristineGanttLinks) {
			return this._ganttLinks
				.filter(function (thisGanttLink) {
					return !pristineGanttLinks.hasGanttLinkWithActivityId(thisGanttLink.getActivityId());
				});
		};

		return GanttLinks;
	})(Asyst.Gantt.Helper);




	self.GanttManipulationType = (function () {
		var _manipulationTypes = {
			GRAPHICAL: {},
			TABLE: {},
			EXTERNAL: {}
		};

		var _currentManipulationType = _manipulationTypes.GRAPHICAL;

		return {
			set: function (manipulationTypeString) {
				if (!manipulationTypeString || typeof manipulationTypeString !== 'string') {
					console.warn('Неверный аргумент');
					return;
				}

				var newManipulationType = _manipulationTypes[manipulationTypeString.toUpperCase()];

				if (!newManipulationType) {
					console.warn('Не наиден manipulationType');
					return;
				}

				_currentManipulationType = newManipulationType;
			},

			isGraphical: function () {
				return _currentManipulationType === _manipulationTypes.GRAPHICAL;
			},

			clear: function () {
				_currentManipulationType = _manipulationTypes.GRAPHICAL;
			}
		};
	})();



	/**
     * Метод генерации WBSID кода
     * @param {DataBoundGanttModel} sender - Источник событий
     * @param {ProvideDefaultWBSIDEventArgs} args - агргумменты
     */
	self.WBSIDHandler = function (sender, args) {
		var parent = args.Activity.Parent;
		var childIndex = (args.GetActivityChildIndex() + 1).toString();
		if (!parent) {
			if (args.Activity.DataSource.WBSID !== childIndex)
				args.NewWBSID_M(childIndex);
		} else if (args.Activity.DataSource.WBSID !== parent.DataSource.WBSID + '.' + childIndex)
			args.NewWBSID_M(parent.DataSource.WBSID + '.' + childIndex);
	};



	self.Redraw = function () {
		// Memoizing debounce realization
		self.Redraw = Asyst.Utils.debounce(function () {
			self.GanttControl.redrawGantt();
		}, 600);

		self.Redraw();
	};



	self.BeginUpdate = function () {
		self.GanttChanges.beginTransaction();
	};



	self.EndUpdate = Asyst.Utils.debounce(function () {
		self.GanttManipulationType.clear();
		self.GanttChanges.commitTransaction();
		// После успешного обновления гантта запрет отмены изменений
		self.GanttControl.clearUndoStack();
		isLinkChange = false;

		// перерисовка таблицы слева и графической части на случай изменения плановых полосок
		// TODO делать отрисовку точечно
		// TODO GANTTCHANGES должен подсказать следует ли обновлять грид по инкременту изменений
		self.GanttControl.redrawGantt();
	}, 200);



	function restoreSummaryDates(activity) {
		if (!activity) {
			return;
		}

		var callback = function (error, restoredDates) {
			try {
				if (error) {
					throw error instanceof Asyst.Gantt.Error ? error :
						new Asyst.Gantt.Error('Error', null, null, error.message, error.stack);
				}

				// Этап всегда превращается в таск 
				activity.IsMilestone = false;
				activity.DataSource.IsMilestone = false;
				// при ProgressPercent=100 даты не двигаются
				activity.DataSource.ProgressPercent = 0;

				// Если даты содержатся в таблице ChangeLog
				if (restoredDates.length > 0) {
					var startPlanDate = restoredDates.filter(function (date) { return date.Name === 'StartPlanDate'; })[0];
					var planDate = restoredDates.filter(function (date) { return date.Name === 'PlanDate'; })[0];
					var endTime = restoredDates.filter(function (date) { return date.Name === 'EndTime'; })[0];
					var startTime = restoredDates.filter(function (date) { return date.Name === 'StartTime'; })[0];
					var startFactDate = restoredDates.filter(function (date) { return date.Name === 'FactStartTime'; })[0];
					var factDate = restoredDates.filter(function (date) { return date.Name === 'FactEndTime'; })[0];

					if (startPlanDate) {
						activity.DataSource.StartPlanDate = startPlanDate.Value;
					}

					if (planDate) {
						activity.DataSource.PlanDate = planDate.Value;
					}

					if (startFactDate) {
						if (!startFactDate.Value) {
							// Чистим факт (перешедший с дат потомка), в случае если в ChangeLog'е факта не было
							activity.DataSource.FactStartTime = null;
						} else {
							Asyst.Gantt.ActivityManager.SetFactStartTime(activity.DataSource, startFactDate.Value, true);
						}
					}

					if (startTime && startTime.Value) {
						if (!startFactDate || !startFactDate.Value) {
							// Факта не было ставим прогнозную дату
							Asyst.Gantt.ActivityManager.SetStartTime(activity, Asyst.Gantt.Helper.getWithTruncatedTime(startTime.Value));
						}
					} else {
						if (startPlanDate && startPlanDate.Value) {
							// Прогноза нет, ставим плановую дату
							Asyst.Gantt.ActivityManager.SetEndTime(activity,
								Asyst.Gantt.Helper.getWithMaxTime(startPlanDate.Value));
						} else {
							// Плана нет, ставим дату от потомка
							Asyst.Gantt.ActivityManager.SetStartTime(activity, Asyst.Gantt.Helper.getWithMaxTime(Asyst.Gantt.Helper.getWithTruncatedTime(activity.StartTime)));
						}
					}

					if (factDate) {
						if (!factDate.Value) {
							// Чистим факт (перешедший с дат потомка), в случае если в ChangeLog'е факта не было
							activity.DataSource.FactEndTime = null;
							// И откатываем фазу 'Выполнено'
							activity.DataSource.ActivityPhaseId = Asyst.Gantt.Helper.CONSTANTS.INWORK_ACTIVITY_PHASE_ID;
						} else {
							Asyst.Gantt.ActivityManager.SetFactEndTime(activity.DataSource, factDate.Value, true);
						}
					}

					if (endTime && endTime.Value) {
						if (!factDate || !factDate.Value) {
							// Факта не было ставим прогнозную дату
							Asyst.Gantt.ActivityManager.SetEndTime(activity, Asyst.Gantt.Helper.getWithMaxTime(endTime.Value));
						}
					} else {
						if (planDate && planDate.Value) {
							// Прогноза нет, ставим плановую дату
							Asyst.Gantt.ActivityManager.SetEndTime(activity,
								Asyst.Gantt.Helper.getWithMaxTime(planDate.Value));
						} else {
							// Плана нет, ставим дату от потомка
							Asyst.Gantt.ActivityManager.SetEndTime(activity, Asyst.Gantt.Helper.getWithMaxTime(Asyst.Gantt.Helper.getWithMaxTime(activity.EndTime)));
						}
					}
				} else {
					// Чищу фактические даты, которые могли передаться от потомков
					activity.DataSource.FactEndTime = null;
					activity.DataSource.FactStartTime = null;
					// Откатываю фазу
					activity.DataSource.ActivityPhaseId = Asyst.Gantt.Helper.CONSTANTS.INWORK_ACTIVITY_PHASE_ID;
					Asyst.Gantt.ActivityManager.SetStartTime(activity, Asyst.Gantt.Helper.getWithTruncatedTime(activity.StartTime));
					Asyst.Gantt.ActivityManager.SetEndTime(activity, Asyst.Gantt.Helper.getWithMaxTime(activity.EndTime));
				}

			} catch (error) {
				var ganttError = error instanceof Asyst.Gantt.Error ? error :
					new Asyst.Gantt.Error('Error', null, null, error.message, error.stack);
				ganttError.Notify();
			}
		};

		self.GanttManager.LoadRestoredDatesOfPoint(activity.ID.toString(), true, callback);
	};



	function onPropertyChanged(dataSource, args) {
		if (loading) {
			return;
		}

		if (isUndoActionRunning) {
			return;
		}

		if (args.PropertyName === 'PredecessorIndices') {
			isLinkChange = true;
			dataSource.SetPredecessorCodes(args.Value || '', false);
		}

		if (args.PropertyName === 'IndentLevel') {
			return;
		}

		try {
			var activity = self.GanttControl.getActivityById(dataSource.ID);

			if (activity == null) {
				return;
			}

			Asyst.Gantt.Corrector.applyOnPropertyChangedCorrections(activity, args);

			if (args.PropertyName === 'StartPlanDate' || args.PropertyName === 'PlanDate') {
				Asyst.Gantt.ActivityManager.updateDatesForParent(activity.Parent, self.GanttControl);
			}

			if (args.PropertyName === 'FactEndTime') {

				if (!dataSource.FactEndTime) {
					self.GanttChanges.addChange(activity.id, 'FactDate', activity.DataSource.FactEndTime);
					Asyst.Gantt.ActivityManager.updateDatesForParent(activity.Parent, self.GanttControl);
					return;
				}

				if (!dataSource.FactStartTime && !dataSource.IsMilestone) {
					Asyst.Gantt.ActivityManager.SetFactStartTime(dataSource, dataSource.StartTime, true);
				}

				dataSource.ProgressPercent = 100;

				// При срабатывании onPropertyChanged при пересчете суммарного таска FactEndTime = ''
				if (!activity.EndTime.equals(dataSource.FactEndTime)) {
					if (dataSource.IsMilestone) {
						Asyst.Gantt.ActivityManager.SetStartTime(activity, dataSource.FactEndTime, false);
					} else {
						if (dataSource.FactStartTime && (!activity.ChildActivities || activity.ChildActivities.length === 0)) {
							activity.PreferredStartTime = new Date(dataSource.FactStartTime);
							Asyst.Gantt.ActivityManager.SetEndTime(activity, dataSource.FactEndTime);
						}
					}
				}

				Asyst.Gantt.ActivityManager.updateDatesForParent(activity.Parent, self.GanttControl);
			} else if (args.PropertyName === 'FactStartTime') {

				if (!dataSource.FactStartTime) {
					self.GanttChanges.addChange(activity.id, 'StartFactDate', activity.DataSource.FactStartTime);
					Asyst.Gantt.ActivityManager.updateDatesForParent(activity.Parent, self.GanttControl);
					return;
				}

				if (!activity.StartTime.equals(dataSource.FactStartTime) && !activity.IsMilestone) {
					var hasChilds = dataSource.ChildActivities && dataSource.ChildActivities.length > 0;
					if (!hasChilds) {
						Asyst.Gantt.ActivityManager.SetStartTime(activity, dataSource.FactStartTime);
						Asyst.Gantt.ActivityManager.SetEffort(activity, dataSource.Effort, false);
					}
				}
				Asyst.Gantt.ActivityManager.updateDatesForParent(activity.Parent, self.GanttControl);
			}

			if (args.PropertyName === 'WBSID') {
				if (dataSource.WBS !== dataSource.WBSID) {
					dataSource.WBS = dataSource.WBSID;
					self.GanttChanges.addChange(activity.id, 'WBS', dataSource.WBSID);
				}
			} else {
				self.TrackCustomFields.forEach(function (customField) {
					if (customField === 'FactEndTime' || customField === 'FactStartTime') {
						return;
					}

					if (args.PropertyName === customField && args.OldValue !== dataSource[customField]) {
						self.BeginUpdate();

						var hasDifferentName = self.CustomFieldsNames.hasOwnProperty(customField);
						self.GanttChanges.addChange(
							activity.id,
							hasDifferentName ? self.CustomFieldsNames[customField] : customField,
							dataSource[customField]
						);

						self.EndUpdate();
					}
				});
			}
		} catch (error) {
			var ganttError = error instanceof Asyst.Gantt.Error ? error :
				new Asyst.Gantt.Error('Error', null, null, error.message, error.stack);
			ganttError.Notify();
		}
	};



	self.CreateItem = function () {

	};



	self.load = function (async, onsuccess, onerror) {
		var callback = function (error, response) {
			try {
				if (error) {
					if (typeof onerror === 'function') {
						onerror(self);
					} else {
						var ganttError = error instanceof Asyst.Gantt.Error ? error :
							new Asyst.Gantt.Error('Error', null, null, error.message, error.stack);
						ganttError.Notify();
					}
					return;
				}

				Asyst.Gantt.Calendar.init(response.CalendarExceptions);
				Asyst.Gantt.registerDateEditor();
				Asyst.Gantt.registerPredecessorsEditor();
				Asyst.Gantt.registerResponsibleEditor(response.Users || []);
				Asyst.Gantt.registerApprovingDocumentEditor(response.ApprovingDocuments || []);
				Asyst.Gantt.registerTextEditor();


				$.holdReady(false);

				self.GanttChanges.clear();

				self.GanttControl.setDataSource(response.DataSource);

				self.FitToWindow();

				if (typeof onsuccess === 'function') {
					onsuccess(self);
				}
			} finally {
				loading = false;
			}
		};

		loading = true;
		$.holdReady(true);

		self.GanttManager.LoadGanttData(self.ActivityId, async, callback);

		return self;
	};


	/**
     * Метод используется извне, оставлено для совместимости
     */
	self.reload = function (isAsync, onsuccess, onerror) {
		self.load(isAsync, onsuccess, onerror);
	};



	self.deletePoint = function (activityId) {
		self.GanttControl.removeDependenciesOf(activityId);
		self.GanttControl.removeActivity(activityId);
		self.GanttChanges.addPointDeletionChange(activityId);
	};



	self.addPoint = function (data, fromTemplate) {
		data.id = Asyst.Gantt.Helper.SurrogateId.getNext();

		Asyst.Gantt.Helper.restoreObjectOwnAttributesConstructor(data);

		var dataSource = self.GanttManager.CreateGanttItem(data);
		self.GanttControl.addPoint(dataSource, fromTemplate);
		self.GanttChanges.addPointAddingChange(data);

		return data.id;
	};


	self.indent = function (activityId, level) {
		for (var i = 1; i < level; i++) {
			self.GanttControl.indent(activityId);
		}
	};


	self.createNewDependency = function (fromActivityId, toActivityId, linkType, lagInDays) {
		self.GanttControl.createNewDependency(fromActivityId, toActivityId, linkType, lagInDays);
	};


	self.canAddNewDependency = function (fromActivityId, toActivityId, linkType) {
		return self.GanttControl.canAddNewDependency(fromActivityId, toActivityId, linkType);
	};


	self.reparent = function (activityId, parentId) {
		self.GanttControl.reparentActivity(activityId, parentId);
	};


	self.setReadonly = function (isReadonly) {
		self.GanttControl.setReadonly(isReadonly);
	};


	self.isReadonly = function () {
		return self.GanttControl.isReadonly();
	};


	self.refreshGrid = function () {
		self.GanttControl.refreshGrid();
	};


	self.getActivityByUid = function (uid) {
		return self.GanttControl.getActivityByUid(uid);
	};


	self.activityIsNew = function (activity) {
		var id = activity.id;

		if (id == null) {
			throw 'id of activity is null';
		}

		return Asyst.Gantt.Helper.SurrogateId.isSurrogateId(id);
	};


	self.hideColumnByField = function (fieldName) {
		self.GanttControl.hideColumnByField(fieldName);
	};


	self.showColumnByField = function (fieldName) {
		self.GanttControl.showColumnByField(fieldName);
	};


	self.copyForecastToPlan = function () {
		self.GanttManipulationType.set('external');
		self.GanttControl.copyForecastToPlan();
	};

	self.cancelChanges = function (callback) {
		if (!self.GanttChanges.hasChanges()) {
			callback();
			return;
		}

		/**
         * Отмена изменений производится перезагрузкой гантта, так как
         * Через GanttControl.ActionManager нельзя, так как не все действия проходят через ActionManager
         * Через данные в GanttChanges нельзя, так как там сохраняется только состояние до последнего изменения
         */
		self.load(
			true,
			callback,
			callback
		);
	};

	self.hasChanges = function () {
		return self.GanttChanges.hasChanges();
	};

	self.enableEditing = function () {
		self.GanttControl.enableEditing();
	};

	self.disableEditing = function () {
		self.GanttControl.disableEditing();
	};

	self.isEditMode = function () {
		return self.GanttControl.isEditMode();
	};

	self.restorePanelWidthByProportion = function (proportion) {
		self.GanttControl.restorePanelWidthByProportion(proportion);
	};

	self.getPanelProportion = function () {
		return self.GanttControl.getPanelProportion();
	};

	self.loadPointDefaults = function (parentId, isAsync, callback) {
		if (_cachedDefaults != null) {
			callback(null, Asyst.Gantt.Helper.deepClone(_cachedDefaults));
			return;
		}

		var defaults = {
			ParentId: parentId,
			ProjectId: parentId
		};

		var onLoad = function (error, data) {
			if (error) {
				callback(error);
				return;
			}

			// null - наличие пустого атрибута
			Asyst.Gantt.Helper.replaceNullAttributesWithUndefined(data);

			_cachedDefaults = data;
			callback(null, Asyst.Gantt.Helper.deepClone(_cachedDefaults));
		};

		Asyst.Gantt.DBManager.loadPointDefaults(defaults, isAsync, onLoad);
	};

	self.getProjectXML = function (isAsync, callback) {
		$.getJSON('/doctemplates/Project/template.json', function (json) {
			var projectModel = new RadiantQ.ProjectModel.Project(json);
			projectModel.initFrom(self.GanttControl.getModel());

			self.GanttControl
				.getActivityViews()
				.forEach(function (activityView) {
					var activity = activityView.Activity;
					var dataSource = activity.DataSource;

					var task = projectModel.createTask();
					projectModel.Tasks.push(task);

					task.ID = activity.ID;
					task.StartDate = activity.StartTime;
					task.PreferredStartTime = activity.StartTime;
					task.ProgressPercent = activity.ProgressPercent;
					task.Effort = activity.Effort;
					task.Duration = activity.Duration;
					task.EndDate = activity.EndTime;
					task.IndentLevel = activityView.IndentLevel;
					task.SortOrder = activity.SortOrder;
					task.TaskName = activity.ActivityName;
					task.PredecessorIndices = activity.PredecessorIndexString;
					task.AssignedResources = dataSource.Resources;
				});

			var xml = Asyst.Gantt.Helper.json2xml(projectModel.xmlObject);
			callback(null, xml);
		});
	};


	self.getGanttGridDataAsAsystView = function (ganttColumns) {
		var activities = self.GanttControl.getAllActivities();
		var data = Asyst.Gantt.Helper.getViewDataFromActivities(activities);
		var columns = Asyst.Gantt.Helper.getViewColumns(ganttColumns);

		return {
			data: data,
			columns: columns
		};
	};


	self.save = function (async, onsuccess, onerror) {
		if (!self.GanttChanges.hasChanges()) {
			self.GanttChanges.clear();
			typeof onsuccess === 'function' && onsuccess(self);
			return;
		}

		var validationResult = self.GanttChanges.validate();
		if (!validationResult.isValid()) {
			NotifyError('Ошибка валидации', validationResult.getDescription());

			self.undoLastChanges();
			return;
		}

		var dataSourceValidationResult = self.GanttControl.validate();
		if (!dataSourceValidationResult.isValid()) {
			Dialog('Сохранение не возможно', dataSourceValidationResult.getDescription());
			return;
		}

		Loader.show(self.$Container, 'Сохранение...');

		var callback = function (error/*, result*/) {
			if (error) {
				Loader.hide();

				if (typeof onerror === 'function') {
					onerror(self, error.nameForProgrammer, error.descriptionForProgrammer);
				} else {
					var ganttError = error instanceof Asyst.Gantt.Error
						? error
						: new Asyst.Gantt.Error('Error', null, null, error.message, error.stack);
					ganttError.Notify();
				}

				return;
			}

			self.GanttChanges.clear();

			// Полная перезагрузка гантта
			self.load(
				true,
				function () {
					typeof onsuccess === 'function' && onsuccess(self);
					Loader.hide();
				},
				function () {
					typeof onerror === 'function' && onerror(self);
					Loader.hide();
				}
			);
		};

		self.GanttManager.SavePointsWithLinks(self.GanttChanges, async, callback);
	};



	self.TimeScale = function (timeUnitWidth, scroll) {
		var $chart = self.$Container.GanttControl('GetGanttChart');
		var chart = $chart.data('GanttChart');
		var visualStartTime = chart.VisualStartTime;
		var startTime = self.Control.Model.Activities_M().StartTime_M();

		chart.BeginUpdate();
		try {
			var viewWidth = chart.options.ViewWidth;

			// The current visible area width of the chart.
			var width = chart.element.find('.rq-gc-topDiv').width();
			if (width < 20) {
				//дефолтная отрисовка на невидимой панели - искусственно завышаем ширину.
				width = 400;
			}

			self.$Container.data('GanttControl')._setOption('BaseTimeUnitWidth', timeUnitWidth);

			// We now want to center this timespan within the chart's scrollable viewWidth. So, we determine the width of the scrolled out portion on each side:
			var hiddenWidthPerSide = (viewWidth - width) / 2;
			// We convert the hiddenWidthPerSide to a timespan
			var hiddenTimePerSide = new RQTimeSpan(chart.options.ComputedStartTime - chart.ConvertXToTime(hiddenWidthPerSide));

			// We now know what our start time should be for this new view.
			chart.SetStartTime(startTime.clone().addTimeSpan(hiddenTimePerSide));
		} finally {
			chart.EndUpdate();
		}

		var $chartArea = chart.HScrollBar;
		var newXpos = chart.ConvertTimeToX(scroll ? startTime : visualStartTime);
		$chartArea.scrollLeft(newXpos);

		self.Control.RedrawChartRows();
	};



	self.ZoomIn = function () {
		var $chart = self.$Container.GanttControl('GetGanttChart');
		var chart = $chart.data('GanttChart');
		var unitWidth = chart.options.BaseTimeUnitWidth;
		self.TimeScale(unitWidth + unitWidth / 2);
	};



	self.ZoomOut = function () {
		var $chart = self.$Container.GanttControl('GetGanttChart');
		var chart = $chart.data('GanttChart');
		var unitWidth = chart.options.BaseTimeUnitWidth;
		self.TimeScale(unitWidth - unitWidth / 3);
	};



	self.FitToWindow = function (startTime, endTime) {
		if (!self.GanttControl.anyActivities()) {
			return;
		}

		var $chart = self.$Container.GanttControl('GetGanttChart');
		var chart = $chart.data('GanttChart');
		// To Prevent Chart from updating until we are done with everything.
		chart.BeginUpdate();

		var start;
		var end;

		if (!startTime) {
			start = self.GanttControl.getActivitiesMinDate();
		}

		if (!endTime) {
			end = self.GanttControl.getActivitiesMaxDate();
		}

		//var rqUtiles = RadiantQ.Gantt.Utils.TimeComputingUtils;
		var viewWidth = chart.options.ViewWidth;
		//var baseTimeunitWidth = chart.options.BaseTimeUnitWidth;
		var baseTimeScaleType = chart.options.BaseTimeScaleType;

		// To get the no of timeunites required to render this timespan.

		var newTimeUnits = 0;
		if (start && end) {
			newTimeUnits = rqTCUtils.ConvertTimeSpanToTimeUnits(baseTimeScaleType, rqTCUtils.GetTimeSpan(start, end));
		}
		if (newTimeUnits === 0) {
			return;
		}
		// The current visible area width of the chart.
		var width = chart.element.find('.rq-gc-topDiv').width();
		if (width < 20) {
			//дефолтная отрисовка на невидимой панели - искусственно завышаем ширину.
			width = 400;
		}
		// Computes the width of each time unit, if it has to fill the 'width'.
		// This will be our current zoom level (BaseTimeUnitWidth).
		var newBaseUnitwidth = width / newTimeUnits;
		self.$Container.data('GanttControl')._setOption('BaseTimeUnitWidth', newBaseUnitwidth);

		// We now want to center this timespan within the chart's scrollable viewWidth. So, we determine the width of the scrolled out portion on each side:
		var hiddenWidthPerSide = (viewWidth - width) / 2;
		// We convert the hiddenWidthPerSide to a timespan
		var hiddenTimePerSide = new RQTimeSpan(chart.options.ComputedStartTime - chart.ConvertXToTime(hiddenWidthPerSide));

		// We now know what our start time should be for this new view.
		chart.SetStartTime(start.clone().addTimeSpan(hiddenTimePerSide));

		//to refresh the chart.
		chart.EndUpdate();

		// Scroll to align the startTime to the left border.
		var newXpos = chart.ConvertTimeToX(start);
		var $chartArea = chart.HScrollBar;
		$chartArea.scrollLeft(newXpos);

		self.Control.RedrawChartRows();
	};



	self.undoLastChanges = function () {
		self.GanttChanges.restoreState();
		isUndoActionRunning = true;
		self.GanttControl.undoLastChanges();
		isUndoActionRunning = false;
		self.GanttManipulationType.clear();
	};



	self.$Container = $Container;
	self.ActivityId = ActivityId;
	self.CriticalPathActivities = [];
	self.TrackCustomFields = ['FactStartTime', 'FactEndTime', 'ParentId', 'StartPlanDate', 'PlanDate', 'ResponsibleId', 'ApprovingDocumentId'];
	self.IndicatorTitles = {
		0: 'В работе по плану',
		1: 'Подтверждена',
		2: 'Прогноз срыва сроков (прогноз окончания позже плана)',
		4: 'Выполнено',
		3: 'Просрочено (дата планового окончания уже прошла)',
		19: 'Отменена'
	};

	if (Options.Custom_IndicatorTitles) {
		self.IndicatorTitles = $.extend(self.IndicatorTitles, Options.Custom_IndicatorTitles);
	}

	if (Options.TrackCustomFields && Options.TrackCustomFields.length) {
		self.TrackCustomFields = self.TrackCustomFields.concat(Options.TrackCustomFields);
	}

	self.CustomFieldsNames = {
		FactStartTime: 'StartFactDate',
		FactEndTime: 'FactDate',
		ForecastStartTime: 'StartForecastDate',
		ForecastEndTime: 'ForecastDate'
	};

	if (Options.CustomFieldsNames) {
		self.CustomFieldsNames = $.extend(self.CustomFieldsNames, Options.CustomFieldsNames);
	}

	Options.UseVirtualization = true;
	Options.DataSource = [];
	Options.CanInsertPropertyChangeTriggeringPropertiesInData = true;
	Options.RoundTimeEditsTo = RadiantQ.Gantt.RoundToOptions.Day;


	if (!Options.hasOwnProperty('WBSIDBinding'))
		Options.WBSIDBinding = new RadiantQ.BindingOptions('WBSID');
	if (!Options.hasOwnProperty('ProvideWBSID'))
		Options.ProvideWBSID = self.WBSIDHandler;
	if (!Options.hasOwnProperty('ProjectStartDate'))
		Options.ProjectStartDate = new Date();
	if (!Options.hasOwnProperty('ZoomOptions'))
		Options.ZoomOptions = RadiantQ.Gantt.ChartZoomOptions.None;
	if (!Options.hasOwnProperty('TimeRangeHighlightBehavior'))
		Options.TimeRangeHighlightBehavior = RadiantQ.Gantt.TimeRangeHighlightBehavior.HighlightInChartOnHeaderMouseHover;
	if (!Options.hasOwnProperty('WorkTimeSchedule'))
		Options.WorkTimeSchedule = null;
	if (!Options.hasOwnProperty('TaskBarBrowseToCueLeftTemplate'))
		Options.TaskBarBrowseToCueLeftTemplate = '<button></button>';
	if (!Options.hasOwnProperty('TaskBarBrowseToCueRightTemplate'))
		Options.TaskBarBrowseToCueRightTemplate = '<button></button>';
	if (!Options.hasOwnProperty('TablePanelWidth'))
		Options.TablePanelWidth = '600';

	if (!Options.hasOwnProperty('TaskItemTemplate'))
		Options.TaskItemTemplate = Asyst.Gantt.TaskItemTemplate;
	if (!Options.hasOwnProperty('MileStoneTemplate'))
		Options.MileStoneTemplate = Asyst.Gantt.MileStoneTemplate;
	if (!Options.hasOwnProperty('TaskBarBackgroundTemplate'))
		Options.TaskBarBackgroundTemplate = Asyst.Gantt.TaskBarBackgroundTemplate;
	if (!Options.hasOwnProperty('TaskBarAdornerTemplate'))
		Options.TaskBarAdornerTemplate = Asyst.Gantt.TaskBarAdornerTemplate;
	if (!Options.hasOwnProperty('MovingInfoPopup'))
		Options.MovingInfoPopup = Asyst.Gantt.MovingInfoPopupTemplate;
	if (!Options.hasOwnProperty('ResizeInfoPopup'))
		Options.ResizeInfoPopup = Asyst.Gantt.ResizeInfoPopupTemplate;
	if (!Options.hasOwnProperty('ParentTaskItemTemplate'))
		Options.ParentTaskItemTemplate = Asyst.Gantt.ParentTaskItemTemplate;
	if (!Options.hasOwnProperty('TaskTooltipTemplate'))
		Options.TaskTooltipTemplate = Asyst.Gantt.TaskTooltipTemplate;
	if (!Options.hasOwnProperty('DependencyTooltipTemplate'))
		Options.DependencyTooltipTemplate = Asyst.Gantt.DependencyTooltipTemplate;

	if (!Options.hasOwnProperty('IsTaskReadOnlyBinding')) {
		Options.IsTaskReadOnlyBinding = {
			Property: 'activity.DataSource',
			Converter: function (dataSource, activity/*, activityView*/) {
				return activity.ChildActivities.length > 0 || dataSource.IsReadOnly;
			}
		};
	}
	if (!Options.hasOwnProperty('GanttChartTemplateApplied')) {
		Options.GanttChartTemplateApplied = function (sender, args) {
			var $GanttChart = args.element;
			$GanttChart.GanttChart({
				AnchorTime: new Date(),
				ViewWidth: 2000,
				ResizeToFit: false
			});
		};
	}
	if (!Options.hasOwnProperty('TimeScaleHeaders')) {

		var tmshs = new RadiantQ.Gantt.TimeScaleHeaderDefinitions();
		var yearHeader = new RadiantQ.Gantt.TimeScaleHeaderDefinition();
		yearHeader.Type = ns_gantt.TimeScaleType.Years;
		tmshs.add(yearHeader);
		var monthHeader = new RadiantQ.Gantt.TimeScaleHeaderDefinition();
		monthHeader.TextFormat = 'MMM yyyy';
		monthHeader.Type = ns_gantt.TimeScaleType.Months;
		tmshs.add(monthHeader);
		var daysHeader = new RadiantQ.Gantt.TimeScaleHeaderDefinition();
		daysHeader.Type = ns_gantt.TimeScaleType.Days;
		tmshs.add(daysHeader);

		Options.TimeScaleHeaders = tmshs;
	}
	if (!Options.hasOwnProperty('SpecialLineInfos')) {
		var SpecialLineInfos = new ObservableCollection();
		var todayLine = new RadiantQ.Gantt.SpecialLineInfo();
		todayLine.LineDateTime = new Date();
		todayLine.ToolTipText = 'Сегодня';
		todayLine.LineColor = 'green';
		SpecialLineInfos.add(todayLine);

		Options.SpecialLineInfos = SpecialLineInfos;
	}

	self.GanttControl.init(Options);
	self.Control = $Container.data('GanttControl');

	return self;
};

/// Editors

Asyst.Gantt.registerDateEditor = function () {
	'use strict';

	// eslint-disable-next-line no-undef
	RadiantQ.Binder.dateEditor = function () {
		this.init = function ($elem, role, value, data) {
			var setDate = function ($input) {
				var inputDate = $input.val();

				if (!inputDate) {
					return;
				}

				inputDate = moment(inputDate, 'DD.MM.YYYY').toDate();

				var activity = data.Activity;
				var field = $input.data('field');

				activity.DataSource.ChangeGanttManipulationType('table');

				if (field === 'EndTime') {
					if (activity.DataSource.IsMilestone) {
						Asyst.Gantt.ActivityManager.SetStartTime(activity, inputDate, true);
					} else {
						Asyst.Gantt.ActivityManager.SetEndTime(activity, inputDate);
					}
				} else if (field === 'StartTime') {
					Asyst.Gantt.ActivityManager.SetStartTime(activity, inputDate);
				} else if (field === 'FactEndTime') {
					Asyst.Gantt.ActivityManager.SetFactEndTime(activity.DataSource, inputDate, true);
				} else if (field === 'FactStartTime') {
					Asyst.Gantt.ActivityManager.SetFactStartTime(activity.DataSource, inputDate, true);
				} else if (field === 'PlanDate') {
					Asyst.Gantt.ActivityManager.SetPlanDate(activity.DataSource, inputDate, true);
				} else if (field === 'StartPlanDate') {
					Asyst.Gantt.ActivityManager.SetStartPlanDate(activity.DataSource, inputDate, true);
				} else {
					console.warn('Изменение дат данного поля не учитывается.');
					return;
				}
			};

			$elem.change(function () {
				setDate($(this));
			});

			$elem.datepicker({
				showButtonPanel: true,
				changeMonth: true,
				changeYear: true,
				dateFormat: 'dd.mm.yy',
				dayNamesMin: Asyst.date.shortDayNames,
				monthNamesShort: Asyst.date.shortMonthNames,
				currentText: 'Сегодня',
				closeText: 'Закрыть'
			});

			$elem.datepicker('setDate', Asyst.date.format(value.getter(data)));
		};
	};
};


Asyst.Gantt.registerResponsibleEditor = function (users) {
	'use strict';

	var selectOptions = users.reduce(function (result, user) {
		return result + '<option value=' + user.UserId + '>' + user.Name + '</option>\n';
	}, '');

	RadiantQ.Binder.responsibleEditor = function () {
		this.init = function ($elem, role, value, data) {
			$elem.append(selectOptions);
			$elem.val(value.getter(data));
			$elem.change(function () {
				data.Activity.DataSource.ResponsibleId = parseInt($(this).val());
				data.Activity.DataSource.Responsible = $(this).find('option:selected').text();
			});
		};
	};
};


Asyst.Gantt.registerApprovingDocumentEditor = function (approvingDocuments) {
	'use strict';

	var selectOptions = approvingDocuments.reduce(function (result, approvingDocument) {
		return result + '<option value=' + approvingDocument.ApprovingDocumentId + '>' + approvingDocument.Name + '</option>\n';
	}, '');

	RadiantQ.Binder.approvingDocumentEditor = function () {
		this.init = function ($elem, role, value, data) {
			$elem.append(selectOptions);
			$elem.val(value.getter(data));
			$elem.change(function () {
				data.Activity.DataSource.ApprovingDocumentId = parseInt($(this).val());
				data.Activity.DataSource.ApprovingDocumentName = $(this).find('option:selected').text();
			});
		};
	};
};


Asyst.Gantt.registerPredecessorsEditor = function () {
	'use strict';

	RadiantQ.Binder.predecessorsEditor = function () {
		this.init = function ($elem, role, value, data) {
			$elem.val(data.Activity.DataSource.GetPredecessorCodes());

			$elem.change(function () {
				var $element = $(this);

				var rawCodes = $element.val();

				// Вырезание пробелов
				rawCodes = rawCodes.replace(/\s+/g, '');

				if (rawCodes !== '' && !Asyst.Gantt.Helper.CONSTANTS.PREDECESSOR_VALIDATION_REGEXP.test(rawCodes)) {
					return;
				}

				data.activity.DataSource.ChangeGanttManipulationType('table');

				data.Activity.DataSource.SetPredecessorCodes(rawCodes || '', true);
			});
		};
	};
};

Asyst.Gantt.registerTextEditor = function () {
	'use strict';

	RadiantQ.Binder.textEditor = function () {
		this.init = function ($elem, role, value, data) {
			$elem.append('<input type="text" />');
			$elem.val(value.getter(data));
			$elem.one('change', function () {
				data.activity.DataSource.ChangeGanttManipulationType('table');

				var newValue = $(this).val();
				value.setter(data, newValue);
			});
		};
	};
};

/// Templates


Asyst.Gantt.TaskItemTemplate = '<div class="taskbar-style ${Asyst.Gantt.UpdateCritical(data)}" onclick="Asyst.Gantt.StopPropagation(event)" />';
Asyst.Gantt.MileStoneTemplate = '<div class="rq-gc-milestoneBar ${Asyst.Gantt.UpdateCritical(data)} ${Asyst.Gantt.UpdateCompleted(data)}"/>';
Asyst.Gantt.TaskBarBackgroundTemplate = '${Asyst.Gantt.BaselineUniversal(data)}';
Asyst.Gantt.TaskBarAdornerTemplate = '${Asyst.Gantt.GetAdornerTemplate(data)}';
Asyst.Gantt.MovingInfoPopupTemplate = '${Asyst.Gantt.GetMovingInfoPopupTemplate(data)}';
Asyst.Gantt.ResizeInfoPopupTemplate = '${Asyst.Gantt.GetResizeInfoPopupTemplate(data)}';

Asyst.Gantt.ParentTaskItemTemplate =
	'<div class="rq-gc-parentBar">' +
	'    <div class="rq-gc-parentBar-leftCue"/>' +
	'    <div class="rq-gc-parentBar-middle"><div class="parentbar-progress" style="width:${data.ProgressPercent}%"></div></div>' +
	'    <div class="rq-gc-parentBar-rightCue"/>' +
	'${ Asyst.Gantt.ParentBaselineTemplate(data) }';

Asyst.Gantt.TaskTooltipTemplate =
	'<div align="left">' +
	'    <table class="TaskTooltip" style="white-space:nowrap;border:none;">' +
	'        <tr>' +
	'            <td colspan="2"><b>${ data.DataSource.Code || "" } ${ data.ActivityName_M() }</b></td>' +
	'        </tr>' +

	'        <tr>' +
	'            <td style="color: gray">План:</td>' +
	'			 <td>' +
	'                   #if (data.IsMilestone) { # #= data.DataSource.PlanDate.toString("dd.MM.yyyy") # #}#	' +
	'                   #if (!data.IsMilestone) { # #if (data.DataSource.StartPlanDate){# с #= data.DataSource.StartPlanDate.toString("dd.MM.yyyy") # #}# #if (data.DataSource.PlanDate){# по #= data.DataSource.PlanDate.toString("dd.MM.yyyy") # #}# #}#	' +
	'			 </td>' +
	'        </tr>' +

	'        <tr>' +
	'            <td style="color: gray">Прогноз:</td>' +
	'			 <td>' +
	'                   #if (data.IsMilestone) { # #= data.DataSource.ForecastEndTime.toString("dd.MM.yyyy")# #}#	' +
	'                   #if (!data.IsMilestone) { # #if (data.DataSource.ForecastStartTime){# c #= data.DataSource.ForecastStartTime.toString("dd.MM.yyyy") # #}# #if (data.DataSource.ForecastEndTime){# по #= data.DataSource.ForecastEndTime.toString("dd.MM.yyyy") # #}# #}#	' +
	'			 </td>' +
	'        </tr>' +

	'        <tr>' +
	'            <td style="color: gray">Факт:</td>' +
	'			 <td>' +
	'                   #if (data.IsMilestone && data.DataSource.FactEndTime) { # #= data.DataSource.FactEndTime.toString("dd.MM.yyyy")# #}#	' +
	'                   #if (!data.IsMilestone) { # #if (data.DataSource.FactStartTime){# c #= data.DataSource.FactStartTime.toString("dd.MM.yyyy") # #}# #if (data.DataSource.FactEndTime){# по #= data.DataSource.FactEndTime.toString("dd.MM.yyyy") # #}# #}#	' +
	'			 </td>' +
	'        </tr>' +

	'		 #if (!data.IsMilestone) { #' +
	'        <tr>' +
	'            <td style="color: gray">Длительность:</td>' +
	'            <td>${Asyst.Gantt.Calendar.getEffortInDays(data)} дн. &nbsp;</td>' +
	'        </tr>' +
	'		 #}#' +
	'    </table>' +
	'</div>';

Asyst.Gantt.DependencyTooltipTemplate = function (line) {
	'use strict';

	return '<div>' +
		'    <table>' +
		'        <tr>' +
		'            <td style="color: gray">' + window.RadiantQ_TaskLinkString + ':</td>' +
		'            <td colspan="3">' + window['RadiantQ_' + line.options.DependencyView.DependencyType_M()] + '</td>' +
		'        </tr>' +
		'        <tr>' +
		'            <td style="color: gray">Пред:</td>' +
		'            <td style="min-width: 30px">' + line.options.DependencyView.StartActivity.WBSID_M() + '</td>' +
		'            <td style="min-width: 50px">' + (line.options.DependencyView.StartActivity.DataSource.Code || '') + '</td>' +
		'            <td>' + line.options.DependencyView.StartActivity.ActivityName_M() + '</td>' +
		'        </tr>' +
		'        <tr>' +
		'            <td style="color: gray">Cлед:</td>' +
		'            <td>' + line.options.DependencyView.EndActivity.WBSID_M() + '</td>' +
		'            <td>' + (line.options.DependencyView.EndActivity.DataSource.Code || '') + '</td>' +
		'            <td>' + line.options.DependencyView.EndActivity.ActivityName_M() + '</td>' +
		'        </tr>' +
		'    </table>' +
		'</div>';
};

Asyst.Gantt.UpdateBackgroundColorBinding = function (data) {
	'use strict';

	var isCritical = Gantt.CriticalPathActivities.indexOf(data) !== -1;
	// for background-image
	if (isCritical)
		return 'url(jsControls/radiantQ/Images/redBar.png)';
	return 'url(jsControls/radiantQ/Src/Styles/Images/TaskBar.png)';
};

Asyst.Gantt.UpdateBorderColorBinding = function (data) {
	'use strict';

	var isCritical = Gantt.CriticalPathActivities.indexOf(data) !== -1;
	// for background-color
	if (isCritical)
		return 'red';
	return '#050DFA';
};

Asyst.Gantt.UpdateCritical = function (data) {
	'use strict';

	var isCritical = Gantt.CriticalPathActivities.indexOf(data) !== -1;
	if (isCritical)
		return 'critical';
	else
		return 'notcritical';
};

Asyst.Gantt.UpdateCompleted = function (data) {
	'use strict';

	return data.DataSource.FactEndTime ? 'completed' : 'notcompleted';
};

Asyst.Gantt.BaselineUniversal = function (data) {
	'use strict';

	var $ganttChart = $('#ganttplace').GanttControl('GetGanttChart');
	var ganttChart = $ganttChart.data('GanttChart');
	var DataSource = data.DataSource;
	var plannedEnd;
	var plannedStart;
	var rightX;
	var leftX;

	if (!DataSource)
		DataSource = data.ActivityView.Activity.DataSource;
	if (DataSource.IsMilestone) {
		plannedEnd = Asyst.Gantt.Helper.getWithMaxTime(DataSource.PlanDate);
		rightX = ganttChart.ConvertTimeToX(plannedEnd);
		return '<div class="baselineMilestone" style="margin-left: ' + (rightX - 7) + 'px;"/>';
	} else {
		plannedStart = DataSource.StartPlanDate;
		plannedEnd = DataSource.PlanDate;
		rightX = plannedEnd ? ganttChart.ConvertTimeToX(plannedEnd) - 1 : 0;
		leftX = plannedStart ? ganttChart.ConvertTimeToX(plannedStart) : 0;
		return '<div class="backgroundBaseline-style" style="width: ' + (rightX - leftX) + 'px; margin:1px 0px 1px ' + leftX + 'px"/>';
	}
};

Asyst.Gantt.GetAdornerTemplate = function (data) {
	'use strict';

	var $ganttChart = $('#ganttplace').GanttControl('GetGanttChart');
	var ganttChart = $ganttChart.data('GanttChart');
	var DataSource = data.DataSource;
	var rightX;

	if (!DataSource) {
		DataSource = data.ActivityView.Activity.DataSource;
	}

	if (DataSource.IsMilestone) {
		if (DataSource.FactEndTime) {
			rightX = ganttChart.ConvertTimeToX(DataSource.FactEndTime);
			return '<div class="adorner milestoneAdorner" style="margin-left: ' + (rightX - 9) + 'px;" onclick="Asyst.Gantt.StopPropagation(event);" />';
		} else return null;
	} else {
		if (DataSource.FactEndTime) {

			var forecastStartTime = DataSource.ForecastStartTime;
			var forecastEndTime = Asyst.date.addDay(DataSource.ForecastEndTime, 1);
			var leftX = forecastStartTime ? ganttChart.ConvertTimeToX(forecastStartTime) - 1 : 0;
			rightX = forecastEndTime ? ganttChart.ConvertTimeToX(forecastEndTime) + 1 : 0;

			// '+3' для перекрытия элементов rq-pg-gc-taskBarResizer и rq-gc-progressbar-resizer
			var result = '<div class="adorner taskAdorner" style="width: ' + (rightX - leftX) + 'px; margin-left:' + leftX + 'px;" onclick="Asyst.Gantt.StopPropagation(event);" />';

			return result;

		} else return null;
	}
};

Asyst.Gantt.GetTaskItemTemplate = function (/*data*/) {
	'use strict';

	return '<div class="taskbar-style ${Asyst.Gantt.UpdateCritical(data)}" onclick="Asyst.Gantt.StopPropagation(event);"/>';

};

Asyst.Gantt.StopPropagation = function (event) {
	'use strict';

	event.stopPropagation();
};

Asyst.Gantt.ParentBaselineTemplate = function (data) {
	'use strict';

	var $ganttChart = $('#ganttplace').GanttControl('GetGanttChart');
	var ganttChart = $ganttChart.data('GanttChart');
	var DataSource = data.DataSource;

	if (!DataSource) {
		DataSource = data.DataSource;
	}

	var startTime = DataSource.StartTime;
	var plannedStart = DataSource.StartPlanDate;
	var plannedEnd = DataSource.PlanDate;
	if (!plannedStart || !plannedEnd || plannedStart === plannedEnd)
		return null;

	var offsetX = startTime ? ganttChart.ConvertTimeToX(startTime) : 0;
	var rightX = plannedEnd ? ganttChart.ConvertTimeToX(plannedEnd) - 1 - offsetX : 0;
	var leftX = plannedStart ? ganttChart.ConvertTimeToX(plannedStart) - offsetX : 0;
	return '<div class="parentBaseline" style="width: ' + (rightX - leftX) + 'px; margin-left:' + (leftX + 7/*ПОЧЕМУ!??!*/) + 'px"><div class="parentBaseline-middle"/></div>';
};

Asyst.Gantt.WidthConverter = function (data) {
	'use strict';

	var ganttChart = data.GanttChart;
	var DataSource = data.ActivityView.Activity_M().DataSource_M();
	if (DataSource.IsMilestone)
		return '0px';
	var plannedStart = DataSource.StartPlanDate;
	var plannedEnd = Asyst.date.addDay(DataSource.PlanDate, 1);
	// Use this utility in GanttChart to determine the location of the past due bar.
	var rightX = plannedEnd ? ganttChart.ConvertTimeToX(plannedEnd) - 1 : 0;
	var leftX = plannedStart ? ganttChart.ConvertTimeToX(plannedStart) : 0;
	return rightX - leftX + 'px';
};

Asyst.Gantt.GetMovingInfoPopupTemplate = function (data) {
	'use strict';

	// В объекте data нет поля IsMilestone
	var isMilestone = data.StartTime.equals(data.EndTime);

	var result = '<div>' +
		'    <table class="rq-gc-taskbar-popup" style="white-space:nowrap;">' +
		'        <tr><td colspan="2" align="center"><b>' + window.RadiantQ_TaskString + '</b></td></tr>' +
		'        <tr>' +
		'            <td style="float:right;"><b>' + window.RadiantQ_StartString + ' :</b></td>';

	if (isMilestone) {
		var correctedMilestoneStartDate = (new Date(data.StartTime)).addDays(-1);
		result += '  <td> ' + correctedMilestoneStartDate.toString('yyyy-MM-dd') + ' </td>';
	} else {
		result += '  <td> ' + data.StartTime.toString('yyyy-MM-dd') + ' </td>';
	};

	result +=
		'        </tr>' +
		'        <tr>' +
		'            <td style="float:right;"><b>' + window.RadiantQ_FinishString + ' :</b> </td>';

	if (isMilestone) {
		// Так как КТ отображается в конце дня, стандартная карта перемещений не подходит
		// ||   30   ||   01   ||   02   ||   03   ||
		//                 ....<>.... <---- 2 число
		//       ..........           <---- 1 число
		// Если нажать на КТ, но не перемещать или просто проставить связь, КТ уедет на 1 день вперед
		// Костыль: сдвигаю дату во всплывающей подсказке и модели на 1 день назад
		var correctedMilestoneEndDate = (new Date(data.EndTime)).addDays(-1);
		result += '  <td> ' + correctedMilestoneEndDate.toString('yyyy-MM-dd') + '</td>';
	} else {
		// Так как таски:   2018-01-01 00:00:00  -  2018-01-03 23:59:59
		// Конечную дату на всплывающем окне необходимо поставить прошлым днем - 2018-01-03 (по умолчанию 2018-01-04)
		var correctedTaskEndDate = (new Date(data.EndTime)).addDays(-1);
		result += '  <td> ' + correctedTaskEndDate.toString('yyyy-MM-dd') + '</td>';
	}

	result +=
		'        </tr>' +
		'    </table>' +
		'</div>';

	return result;
};

Asyst.Gantt.GetResizeInfoPopupTemplate = function (data) {
	'use strict';

	var duration = Asyst.Gantt.Helper.computeDurationInDays(data.StartTime, data.EndTime);
	var correctedTaskEndTime = duration === 0 ? data.EndTime : (new Date(data.EndTime)).addDays(-1);

	var result = '<div>' +
		'    <table class="rq-gc-taskbar-popup" style="white-space:nowrap;">' +
		'        <tr><td colspan="2" align="center"><b>' + window.RadiantQ_TaskString + '</b></td></tr>' +
		'        <tr>' +
		'            <td style="float:right;"><b>' + window.RadiantQ_DurationString + ' :</b></td>';

	if (data.Duration) {
		result += '  <td> ' + Asyst.Gantt.Calendar.getEffortInDays(data).toString() + '</td>';
	};

	result +=
		'        </tr>' +
		'        <tr>' +
		'            <td style="float:right;"><b>' + window.RadiantQ_StartTimeString + ' :</b> </td>' +
		'            <td> ' + data.StartTime.toString('yyyy-MM-dd') + '</td>' +
		'        </tr>' +
		'        <tr>' +
		'            <td style="float:right;"><b>' + window.RadiantQ_EndTimeString + ' :</b> </td>' +
		'            <td> ' + correctedTaskEndTime.toString('yyyy-MM-dd') + '</td>' +
		'        </tr>' +
		'    </table>' +
		'</div>';

	return result;
};



/*
    Методы для работы с датами на ганте
*/
Asyst.Gantt.Helper = (function () {
	'use strict';

	var CONSTANTS = {};
	CONSTANTS.MILLISECOND = 1;
	CONSTANTS.SECOND = 1000 * CONSTANTS.MILLISECOND;
	CONSTANTS.MINUTE = 60 * CONSTANTS.SECOND;
	CONSTANTS.HOUR = 60 * CONSTANTS.MINUTE;
	CONSTANTS.DAY = 24 * CONSTANTS.HOUR;

	CONSTANTS.DONE_ACTIVITY_PHASE_ID = 10018;
	CONSTANTS.INWORK_ACTIVITY_PHASE_ID = 10012;
	CONSTANTS.DECLINE_ACTIVITY_PHASE_ID = 40031;
	CONSTANTS.APPROVED_ACTIVITY_PHASE_ID = 40041;

	/**
     * Возвращает имя функции по тексту функции
     * function makeItem( ...
     * */
	CONSTANTS.FUNCTION_NAME_EXTRACT_REGEXP = new RegExp(
		'function' // начинаем с первого вхождения слова function
		+ '\\*?' // для функций-генераторов
		// группы возможных комментариев (не выводить в match)
		+ '(?:'

		// однострочный комментарий (не выводить в match)
		+ '(?:'
		+ '\\s*' // пробелы, табы, переносы строк до комментария
		+ '\\/\\/.*?' // текст комментария (ленивый режим, чтобы не захватить лишнего)
		+ '\\s*' // пробелы, табы, переносы строк после комментария
		+ ')'

		+ '|' // или

		// многострочный комментарий (не выводить в match)
		+ '(?:'
		+ '\\s*' // пробелы, табы, переносы строк до комментария
		+ '\\/\\*' // начало многострочного комментария
		+ '[\\S\\s]*?' // текст комментария (ленивый режим) символ '.' не соответствует новым строкам в JS, использую хак [\\S\\s]
		+ '\\*\\/' // конец многострочного комментария
		+ '\\s*' // пробелы, табы, переносы строк после комментария
		+ ')'

		+ '|' // или

		// пробелы, табы, переносы строк
		+ '\\s*'

		+ ')*' // возможно 0 и более комментариев

		// имя функции
		+ '('
		// идентификатор
		+ '[a-zA-Z_$]' // первый символ буква или _ или $
		+ '[a-zA-Z0-9_$]*' // последующие символы также могут содержать цифры (жадный режим)
		+ ')' // группа захватывается до первого символа, который не может содержаться в идентификаторах
		, 'm' // входная строка может содержать переносы строк 
	);


	/**
     * Проверяет валидность строки со связями
     * 255743FF+10,243413SF-9 ...
     * */
	CONSTANTS.PREDECESSOR_VALIDATION_REGEXP = new RegExp(
		'^' // начало строки

		// ID активности, либо WBS
		+ '-?' // суррогатные ID с отрицательным знаком для созданных, но не сохраненных тасков (может отсутствовать)
		+ '\\d+' // ID активности, либо первое число в WBS
		+ '(?:' // группа возможных подчисел WBS (не выводить в match)
		+ '\\.\\d+' // '.число'
		+ ')*' // возможно 0 и более подчисел WBS

		+ '(?:' // группа 'Тип связи'
		+ '[SF]{2}' // доступны: SS, SF, FS, FF
		+ ')?' // тип связи FS, считающийся radiantQ типом по умолчанию, может и отсутствовать

		// лаг (не выводить в match)
		+ '(?:'
		+ '[+-]\\d+' // знак лага и число
		+ ')?' // может отсутствовать

		// если в строке присутствует перечнь связей
		+ '(?:'
		+ ',' // разделитель
		+ '-?\\d+(?:\\.\\d+)*(?:[SF]{2})?(?:[+-]\\d+)?' // дубляж регулярки строки-связи
		+ ')*' // возможно 0 и более строк-связей

		+ '$' // конец строки
	);


	CONSTANTS.LINK_FROM_STRING_REGEXP = new RegExp(
		'^' // начало строки

		// 1 группа: ID активности / WBS
		+ '('
		+ '-?' // суррогатные ID с отрицательным знаком для созданных, но не сохраненных тасков (может отсутствовать)
		+ '\\d+' // ID активности, либо первое число в WBS
		+ '(?:' // группа возможных подчисел WBS (не выводить в match)
		+ '\\.\\d+' // '.число'
		+ ')*' // возможно 0 и более подчисел WBS
		+ ')'

		// 2 группа: тип связи
		+ '('
		+ '[SF]{2}' // доступны: SS, SF, FS, FF
		+ ')?' // тип связи FS, считающийся radiantQ типом по умолчанию, может и отсутствовать

		// 3 группа: лаг
		+ '('
		+ '[+-]\\d+' // знак лага и число
		+ ')?' // может отсутствовать

		+ '$' // конец строки
	);


	CONSTANTS.PCD = {
		milestone: {
			id: 4,
			name: 'К',
			title: 'Контрольная точка',
			color: '#00B7F4'
		},

		task: {
			id: 3,
			name: 'Р',
			title: 'Работа',
			color: '#5A97F2'
		},

		stage: {
			id: 2,
			name: 'Э',
			title: 'Этап',
			color: '#8E6BF5'
		}
	};

	CONSTANTS.LINKTYPES = {
		FS: { fullName: 'FinishToStart' },
		FF: { fullName: 'FinishToFinish' },
		SF: { fullName: 'StartToFinish' },
		SS: { fullName: 'StartToStart' }
	};


	/**
     * Результат валидации
     */
	var ValidationResult = (function () {
		var ValidationResult = function (isValid, description) {
			this._isValid = isValid;
			this._description = description;
		};

		ValidationResult.prototype.isValid = function () {
			return this._isValid;
		};

		ValidationResult.prototype.getDescription = function () {
			return this._description;
		};

		ValidationResult.prototype.equals = function (validationResult) {
			if (!validationResult) {
				return false;
			}

			if (!(validationResult instanceof ValidationResult)) {
				return false;
			}

			var bothIsTrue = this.isValid() && validationResult.isValid();

			if (bothIsTrue) {
				return true;
			}

			var bothIsFalse = !this.isValid() && !validationResult.isValid();
			var bothHaveNoDescriptions = !this.getDescription() && !validationResult.getDescription();
			var bothHaveSameDescriptions = this.getDescription() === validationResult.getDescription();

			if (bothIsFalse && (bothHaveNoDescriptions || bothHaveSameDescriptions)) {
				return true;
			}

			return false;
		};

		ValidationResult.SUCCESS = new ValidationResult(true, null);

		return ValidationResult;
	})();



	var getWithTruncatedTime = function (date) {
		if (!(date instanceof Date)) return date;
		var result = new Date(date);
		result.setHours(0, 0, 0, 0);
		return result;
	};


	var calculateEffort = function (startDate, endDate) {
		if (!startDate || !endDate) {
			return '';
		}

		return new TimeSpan(endDate - startDate);
	};


	var setMaxTime = function (date) {
		if (!date) {
			console.warn('Параметр date не задан.');
			return date;
		}

		if (!(date instanceof Date)) {
			console.warn('Параметр date ожидает переменную типа Date.');
			return;
		}

		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);
	};


	var getWithMaxTime = function (date) {
		if (!date) {
			return date;
		}

		var resultDate = new Date(date);
		setMaxTime(resultDate);
		return resultDate;
	};


	var computeDurationInDays = function (startDate, endDate) {
		return (endDate - startDate) / CONSTANTS.DAY;
	};


	var mergeCommonAttributes = function (objectTo, objectFrom) {
		for (var attribute in objectFrom) {
			if (!objectFrom.hasOwnProperty(attribute)) {
				continue;
			}

			if (objectTo[attribute] === undefined) {
				continue;
			}

			objectTo[attribute] = objectFrom[attribute];
		}
	};


	var calculateProgressPercent = function (hasFactStartTime, hasFactEndTime) {
		if (hasFactEndTime) {
			return 100;
		}

		if (hasFactStartTime) {
			// Таски с фактической датой начала не перетаскиваются.
			return 1;
		}

		return 0;
	};



	/**
     * Аналог async.parallel.
     * Последовательно запускает функции на исполнение,
     * по возвращению всех результатов выполнения функций,
     * вызывает коллбэк, в который передается массив результатов.
     * Поддерживать единообразность входных параметров с executeSerial
     * @param {Array} functions        массив выполняемых функций
     * @param {Function} callback      функция - коллбэк
     */
	var executeParallel = function (functions, callback) {
		if (!(functions instanceof Array)) {
			throw 'Массив функций не является массивом';
		}

		var hasSomeNotFunction = functions.some(function (func) {
			return !(func instanceof Function);
		});

		if (hasSomeNotFunction) {
			throw 'Массив функций содержит элемент - не функцию';
		}

		if (!(callback instanceof Function)) {
			throw 'Функция callback не является функцией';
		}

		if (functions.length === 0) {
			callback(null, []);
			return;
		}

		var _executionResults = [];
		var _numberOfExecutions = 0;

		var _trackingCallback = function (_index, error, result) {
			if (error) {
				callback(error, null);
				return;
			}

			_executionResults[_index] = result;
			_numberOfExecutions++;

			var wasExecutedLastFunction = _numberOfExecutions === functions.length;
			if (wasExecutedLastFunction) {
				callback(null, _executionResults);
				return;
			}
		};

		try {
			functions.forEach(function (func, index) {
				var trackingCallback = _trackingCallback.bind(null, index);
				func(trackingCallback);
			});
		} catch (error) {
			callback(error, null);
		}
	};



	/**
     * Аналог async.serial.
     * Выполняет функции последовательно, по срабатыванию последней функции
     * вызывает коллбэк, в который передается массив результатов выполнения.
     * Поддерживать единообразность входных параметров с executeParallel
     * @param {Array} functions        массив выполняемых функций
     * @param {Function} callback      функция - коллбэк
     */
	var executeSerial = function (functions, callback) {
		if (!(functions instanceof Array)) {
			throw 'Массив функций не является массивом';
		}

		var hasSomeNotFunction = functions.some(function (func) {
			return !(func instanceof Function);
		});

		if (hasSomeNotFunction) {
			throw 'Массив функций содержит элемент - не функцию';
		}

		if (!(callback instanceof Function)) {
			throw 'Функция callback не является функцией';
		}

		if (functions.length === 0) {
			callback(null, []);
			return;
		}

		var _executionResults = [];
		var _numberOfLastExecutedFunction = 0;

		var _trackingCallback = function (error, result) {
			if (error) {
				callback(error, null);
				return;
			}

			_executionResults.push(result);

			var isLastExecution = _numberOfLastExecutedFunction === functions.length - 1;
			if (isLastExecution) {
				callback(null, _executionResults);
				return;
			} else {
				functions[++_numberOfLastExecutedFunction](_trackingCallback);
			}
		};

		try {
			functions[_numberOfLastExecutedFunction](_trackingCallback);
		} catch (err) {
			callback(err, null);
		}
	};



	/**
     * Аналог async.waterfall.
     * Выполняет функции последовательно, результат выполнения каждой функции
     * идет аргументом в следующую. По срабатыванию последней функции
     * вызывает коллбэк, в который передается результат выполнения последней функции.
     * @param  {Array} functions       массив выполняемых функций
     * @param  {Function} callback      функция - коллбэк
     */
	var executeWaterfall = function (functions, callback) {
		if (!(functions instanceof Array)) {
			throw 'Массив функций не является массивом';
		}

		var hasSomeNotFunction = functions.some(function (func) {
			return !(func instanceof Function);
		});

		if (hasSomeNotFunction) {
			throw 'Массив функций содержит элемент - не функцию';
		}

		if (!(callback instanceof Function)) {
			throw 'Функция callback не является функцией';
		}

		if (functions.length === 0) {
			callback(null, []);
			return;
		}

		var _numberOfLastExecutedFunction = 0;

		var _trackingCallback = function (error, result) {
			if (error) {
				callback(error, null);
				return;
			}

			var isLastExecution = _numberOfLastExecutedFunction === functions.length - 1;
			if (isLastExecution) {
				callback(null, result);
				return;
			} else {
				functions[++_numberOfLastExecutedFunction](_trackingCallback, result);
			}
		};

		try {
			functions[_numberOfLastExecutedFunction](_trackingCallback);
		} catch (err) {
			callback(err, null);
		}
	};



	var _surrogateId = -1;

	var SurrogateId = {
		getNext: function () {
			return _surrogateId--;
		},
		isSurrogateId: function (id) {
			return typeof id === 'number' && id < 0;
		}
	};


	function cloneArray(array) {
		return array.map(function (item) {
			var cloned = {};
			$.extend(true, cloned, item);
			return cloned;
		});
	}


	function deepClone(object) {
		var clone = {};
		$.extend(true, clone, object);
		return clone;
	}


	/**
     * Восстанавливает конструкторы собственных атрибутов объекта
     * @param {Object} object - объект
     */
	function restoreObjectOwnAttributesConstructor(object) {
		for (var attributeName in object) {
			if (!object.hasOwnProperty(attributeName)) {
				continue;
			}

			restoreObjectConstructor(object[attributeName]);
		}
	}

	/**
     * Восстанавливает конструктор объекта, после пересечения границ iframe
     * @param {Object} object - объект
     */
	function restoreObjectConstructor(object) {
		if (typeof object !== 'object' || object === null) {
			return;
		}

		if (typeof object.constructor !== 'function') {
			return;
		}

		var functionName = getFunctionName(object.constructor);

		if (window[functionName] && window[functionName] !== object.constructor) {
			object.constructor = window[functionName];
		}
	}

	/**
     * @param {Function} func функция
     * @return {String} Имя функции
     */
	function getFunctionName(func) {
		if (!func || typeof func !== 'function') {
			return '';
		}

		var match = func.toString().match(CONSTANTS.FUNCTION_NAME_EXTRACT_REGEXP);

		return match[1] || '';
	}


	function getPcdObject(pcdType) {
		var pcd = CONSTANTS.PCD[pcdType];
		return {
			pcdId: pcd.id,
			pcdName: pcd.name,
			pcdColor: pcd.color,
			pcdTitle: pcd.title
		};
	}


	function replaceNullAttributesWithUndefined(object) {
		for (var attributeName in object) {
			if (!object.hasOwnProperty(attributeName)) {
				continue;
			}

			var attribute = object[attributeName];

			if (attribute === null) {
				object[attributeName] = undefined;
			}
		}
	}

	/*	This work is licensed under Creative Commons GNU LGPL License.

	    License: http://creativecommons.org/licenses/LGPL/2.1/
        Version: 0.9
	    Author:  Stefan Goessner/2006
	    Web:     http://goessner.net/ 
    */
	var json2xml = function (o, tab) {
		var toXml = function (v, name, ind) {
			var xml = '';
			if (v instanceof Array) {
				for (var i = 0, n = v.length; i < n; i++)
					xml += ind + toXml(v[i], name, ind + '\t') + '\n';
			} else if (typeof v === 'object') {
				var hasChild = false;
				xml += ind + '<' + name;
				for (var k in v) {
					if (k.charAt(0) === '@')
						xml += ' ' + k.substr(1) + '=\'' + v[k].toString() + '\'';
					else
						hasChild = true;
				}
				xml += hasChild ? '>' : '/>';
				if (hasChild) {
					for (var m in v) {
						if (m === '#text')
							xml += v[m];
						else if (m === '#cdata')
							xml += '<![CDATA[' + v[m] + ']]>';
						else if (m.charAt(0) !== '@')
							xml += toXml(v[m], m, ind + '\t');
					}
					xml += (xml.charAt(xml.length - 1) === '\n' ? ind : '') + '</' + name + '>';
				}
			} else {
				xml += ind + '<' + name + '>' + v.toString() + '</' + name + '>';
			}
			return xml;
		}; var xml = '';
		for (var m in o)
			xml += toXml(o[m], m, '');
		return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, '');
	};


	var getViewColumns = function (ganttColumns) {
		return ganttColumns.map(function (ganttColumn) {
			return {
				field: ganttColumn.excelIdentifier,
				id: ganttColumn.excelIdentifier,
				name: ganttColumn.title,
				width: ganttColumn.width || 0
			};
		});
	};


	var getViewDataFromActivities = function (activities) {
		return activities.map(function (activity) {
			var dataSource = activity.DataSource;

			return {
				IndicatorId: dataSource.Indicator,
				IndicatorTitle: dataSource.IndicatorTitle,
				IndicatorColor: dataSource.IndicatorColor,
				WBSID: dataSource.WBSID,
				pcdId: dataSource.pcdId,
				pcdTitle: dataSource.pcdTitle,
				pcdColor: dataSource.pcdColor,
				Code: dataSource.Code,
				Name: dataSource.Name,
				StartPlanDate: dataSource.StartPlanDate,
				StartTime: activity.StartTime,
				FactStartTime: dataSource.FactStartTime,
				Effort: activity.Effort,
				PlanDate: dataSource.PlanDate,
				EndTime: activity.EndTime,
				FactEndTime: dataSource.FactEndTime,
				PredecessorIndices: dataSource.GetPredecessorCodes(),
				Responsible: dataSource.Responsible,
				ApprovingDocumentName: dataSource.ApprovingDocumentName
			};
		});
	};


	return {
		getWithTruncatedTime: getWithTruncatedTime,
		calculateEffort: calculateEffort,
		setMaxTime: setMaxTime,
		getWithMaxTime: getWithMaxTime,
		computeDurationInDays: computeDurationInDays,
		mergeCommonAttributes: mergeCommonAttributes,
		calculateProgressPercent: calculateProgressPercent,
		executeParallel: executeParallel,
		executeSerial: executeSerial,
		executeWaterfall: executeWaterfall,
		ValidationResult: ValidationResult,
		CONSTANTS: CONSTANTS,
		SurrogateId: SurrogateId,
		cloneArray: cloneArray,
		restoreObjectOwnAttributesConstructor: restoreObjectOwnAttributesConstructor,
		restoreObjectConstructor: restoreObjectConstructor,
		getFunctionName: getFunctionName,
		getPcdObject: getPcdObject,
		deepClone: deepClone,
		replaceNullAttributesWithUndefined: replaceNullAttributesWithUndefined,
		json2xml: json2xml,
		getViewColumns: getViewColumns,
		getViewDataFromActivities: getViewDataFromActivities
	};
})();

/**
 * Ошибки
 */
Asyst.Gantt.Error = (function () {
	'use strict';

	function GanttError(level, nameForUser, descriptionForUser
		, nameForProgrammer, descrptionForProgrammer) {

		var _level = level || 'Error';
		var _nameForUser = nameForUser || 'Техническая ошибка';
		var _descriptionForUser = descriptionForUser || 'Обратитесь за помощью к руководителю';
		var _nameForProgrammer = nameForProgrammer || 'Имя не указано';
		var _descrptionForProgrammer = descrptionForProgrammer || 'Описание не указано';

		this.Notify = function () {
			switch (_level) {
				case 'Warning':
					NotifyWarning(_nameForUser, _descriptionForUser);
					break;
				case 'Error':
				default:
					NotifyError(_nameForUser, _descriptionForUser);
					break;
			}

			console.warn(_nameForProgrammer, _descrptionForProgrammer);
		};
	}

	return GanttError;
})();

/**
 * Правила изменения на ганте, приводящие к корректным результатам
 */
Asyst.Gantt.ActivityManager = (function (GanttError, GanttHelper) {
	'use strict';

	var _setTime = function (object, timeAttributeName, newTime, shouldCallRecalculation, allowEmptyNewTime) {
		if (!object) {
			throw new GanttError('Error', null, null, 'Неправильный аргумент object', null);
		}

		if (!timeAttributeName || typeof timeAttributeName !== 'string') {
			throw new GanttError('Error', null, null, 'Неправильный аргумент timeAttributeName', null);
		}

		if (!allowEmptyNewTime) {
			if (!newTime || !(newTime instanceof Date)) {
				throw new GanttError('Error', null, null, 'Неправильный аргумент newTime', null);
			}
		}

		if (typeof shouldCallRecalculation !== 'boolean') {
			throw new GanttError('Error', null, null, 'Неправильный аргумент shouldCallRecalculation', null);
		}

		if (shouldCallRecalculation) {
			object[timeAttributeName] = new Date(newTime);
		} else {
			object[timeAttributeName].setTime(newTime.getTime());
		}
	};

	var _setEffort = function (object, newEffort, shouldCallRecalculation) {
		if (!object) {
			throw new GanttError('Error', null, null, 'Неправильный аргумент object', null);
		}

		if (!newEffort || !(newEffort instanceof TimeSpan) && typeof newEffort !== 'string') {
			throw new GanttError('Error', null, null, 'Неправильный аргумент newEffort', null);
		}

		if (typeof shouldCallRecalculation !== 'boolean') {
			throw new GanttError('Error', null, null, 'Неправильный аргумент shouldCallRecalculation', null);
		}

		if (shouldCallRecalculation) {
			object.Effort = new TimeSpan(newEffort);
		} else {
			GanttHelper.mergeCommonAttributes(object.Effort, newEffort);
		}
	};

	return {
		SetStartTime: function (activity, startTime, shouldCompensateCorrection) {
			var newTime = new Date(startTime);

			if (activity.IsMilestone) {
				if (shouldCompensateCorrection) {
					// Компенсирую корректировку GanttCorrector
					newTime.addDays(1);
				}
			}

			_setTime(activity, 'PreferredStartTime', newTime, true, false);
			_setTime(activity, 'StartTime', newTime, true, false);
		},

		SetEndTime: function (activity, endTime) {
			var newEffort;
			var newTime = new Date(endTime);

			GanttHelper.setMaxTime(newTime);

			if (activity.IsMilestone) {
				// Компенсирую корректировку GanttCorrector
				newTime.addDays(1);
				newEffort = new TimeSpan(0);
			} else {
				var startTime = activity['StartTime'];
				newEffort = GanttHelper.calculateEffort(startTime, newTime);
			}

			_setEffort(activity, newEffort, false);
			_setTime(activity, 'EndTime', newTime, true, false);
		},

		SetEffort: function (activity, newEffort) {
			_setEffort(activity, newEffort, false);
		},


		SetForecastStartTime: function (dataSource, newTime, shouldCallOnPropertyChanged) {
			_setTime(dataSource, 'ForecastStartTime', newTime, shouldCallOnPropertyChanged, false);
		},

		SetForecastEndTime: function (dataSource, newTime, shouldCallOnPropertyChanged) {
			_setTime(dataSource, 'ForecastEndTime', newTime, shouldCallOnPropertyChanged, false);
		},

		SetFactStartTime: function (dataSource, startTime, shouldCallOnPropertyChanged) {
			var newTime = new Date(startTime);

			_setTime(dataSource, 'FactStartTime', newTime, shouldCallOnPropertyChanged, true);
		},

		SetFactEndTime: function (dataSource, endTime, shouldCallOnPropertyChanged) {
			var newTime = new Date(endTime);

			dataSource.ProgressPersent = 100;
			GanttHelper.setMaxTime(newTime);

			_setTime(dataSource, 'FactEndTime', newTime, shouldCallOnPropertyChanged, true);
		},

		SetPlanDate: function (dataSource, endTime, shouldCallOnPropertyChanged) {
			var newTime = new Date(endTime);

			GanttHelper.setMaxTime(newTime);

			_setTime(dataSource, 'PlanDate', newTime, shouldCallOnPropertyChanged, false);
		},

		SetStartPlanDate: function (dataSource, startTime, shouldCallOnPropertyChanged) {
			var newTime = new Date(startTime);

			_setTime(dataSource, 'StartPlanDate', newTime, shouldCallOnPropertyChanged, true);
		},

		updateDatesForParent: function (parentActivity, ganttControl) {
			var thisActivityManager = this;

			var updatableDates = {
				StartPlanDate: {
					isStart: true,
					value: null,
					pairDateName: 'PlanDate'
				},
				PlanDate: {
					isStart: false,
					value: null,
					pairDateName: 'StartPlanDate'
				},
				FactStartTime: {
					isStart: true,
					value: null,
					pairDateName: 'FactEndTime'
				},
				FactEndTime: {
					isStart: false,
					value: null,
					pairDateName: 'FactStartTime'
				}
			};

			var updateDatesForParentRecursive = function (activity, updatableDates) {
				var isParent = activity && activity.ChildActivities && activity.ChildActivities.length > 0;

				if (!isParent) {
					return;
				}

				activity.ChildActivities.forEach(function (childActivity) {
					for (var dateName in updatableDates) {
						if (!updatableDates.hasOwnProperty(dateName)) {
							continue;
						}

						var updatableDate = updatableDates[dateName];

						var activityDate = updatableDate.isStart && childActivity.DataSource.IsMilestone ?
							childActivity.DataSource[updatableDate.pairDateName] : childActivity.DataSource[dateName];

						if (!activityDate) {
							continue;
						}

						var currentValueIsLesserThanStart = updatableDate.isStart && updatableDate.value > activityDate;
						var currentValueIsGreaterThanEnd = !updatableDate.isStart && updatableDate.value < activityDate;

						if (updatableDate.value == null || currentValueIsLesserThanStart || currentValueIsGreaterThanEnd) {
							updatableDate.value = new Date(activityDate);
						} else {
							// Do Nothing
						}
					}
				});

				for (var dateName in updatableDates) {
					if (!updatableDates.hasOwnProperty(dateName)) {
						continue;
					}

					var updatableDate = updatableDates[dateName].value;
					var activityDate = activity.DataSource[dateName];

					var shouldRecalculate =
						updatableDate && !activityDate ||
						!updatableDate && activityDate ||
						updatableDate && activityDate && !updatableDate.equals(activityDate);

					if (shouldRecalculate) {
						var recalculateFunction = thisActivityManager['Set' + dateName];
						recalculateFunction && recalculateFunction(activity.DataSource, updatableDate, true);
					}
				}

				// Перерисовка плановой полоски для суммарных тасков (не срабатывает перерисовка шаблона для суммарных тасков)
				ganttControl.redrawChartRow(activity);

				updateDatesForParentRecursive(activity.Parent, updatableDates);
			};

			updateDatesForParentRecursive(parentActivity, updatableDates);
		}

	};
})(Asyst.Gantt.Error, Asyst.Gantt.Helper);

/**
 * Корректировка поведения Ганта по умолчанию
 */
Asyst.Gantt.Corrector = (function (GanttHelper, ActivityManager) {
	'use strict';

	/**
     * Отменяет изменение длительности у таска, имеющего фактическую дату окончания.
     * @param {DataBoundActivity} activity RadiantQ активность
     * @param {Object} changed изменения активности
     */
	var undoEffortChangesIfHasFactDate = function (activity, changed) {
		if (changed.PropertyName !== 'Effort') {
			return;
		}

		if (!activity.DataSource.FactEndTime) {
			return;
		}

		var oldEffort = new TimeSpan(activity.EndTime - activity.StartTime);
		if (!activity.DataSource.Effort.equals(oldEffort)) {
			ActivityManager.SetEffort(activity, oldEffort, false);
		}
	};



	/**
     * Корректирую дату в модели КТ (1 день назад)
     *
     * Так как КТ отображается в конце дня, стандартная карта перемещений не подходит
     * ||   30   ||   01   ||   02   ||   03   ||
     *                 ....<>.... <---- 2 число
     *       ..........           <---- 1 число
     * Если нажать на КТ, но не перемещать или просто проставить связь, КТ уедет на 1 день вперед
     * @param {DataBoundActivity} activity RadiantQ активность
     * @param {Object} changed изменения активности
     */
	var correctShiftingRoadmapForMilestone = function (activity, changed) {
		if (!activity.DataSource.IsMilestone) {
			return;
		}

		if (changed.PropertyName !== 'StartTime') {
			return;
		}

		var IsNotMovingThroughRestrictionByParent = activity.DataSource.IsMilestone
			&& activity.PreferredStartTime.equals(activity.StartTime);

		if (IsNotMovingThroughRestrictionByParent) {
			activity.StartTime.addDays(-1);
		}
	};



	/**
     * Сдвигаю время в модели КТ на конец дня (для отображения)
     * @param {DataBoundActivity} activity RadiantQ активность
     */
	var correctPositionForMilestone = function (activity) {
		if (!activity.DataSource.IsMilestone) {
			return;
		}

		GanttHelper.setMaxTime(activity.PreferredStartTime);
		GanttHelper.setMaxTime(activity.StartTime);
	};



	/**
     * Уменьшаю длительность таска на 1 секунду (для отображения зависимых сущностей)
     *
     * При изменении продолжительности таска Effort меняется в днях:
     * 1.00:00:00 -> 4.00:00:00
     * А чтобы зависимые элементы этой же даты конца не улетали на следующий день, необходимо:
     * 1.00:00:00 -> 3.23:59:59
     *
     * @param {DataBoundActivity} activity RadiantQ активность
     */
	var correctEffort = function (activity) {
		var effort = activity.Effort;
		var isTransformToMilestone = effort.days === 0;
		var isEffortHasDaysOnly =
			effort._hours === 0
			&& effort._minutes === 0
			&& effort._seconds === 0;

		if (!isTransformToMilestone && isEffortHasDaysOnly) {
			effort.days--;
			effort._hours = 23;
			effort._minutes = 59;
			effort._seconds = 59;
		}
	};



	/**
     * Корректировка внутреннего поведения ганта
     * Содержащиеся методы не вызывают пересчет активностей
     * @param {any} activity активность RadiantQ
     * @param {any} changed изменения
     */
	var applyOnPropertyChangedCorrections = function (activity, changed) {
		correctShiftingRoadmapForMilestone(activity, changed);
		correctPositionForMilestone(activity);
		correctEffort(activity);

		undoEffortChangesIfHasFactDate(activity, changed);
	};
	return {
		applyOnPropertyChangedCorrections: applyOnPropertyChangedCorrections
	};
})(Asyst.Gantt.Helper, Asyst.Gantt.ActivityManager);

Asyst.Gantt.DBManager = (function (GanttError) {
	'use strict';

	return {
		DeletePointLink: function (linkObject, customDatasetName, isAsync, callback) {
			var errorCallback = function (errorName, errorDescription) {
				callback(new GanttError('Error', null, null, errorName, errorDescription), null);
			};

			var successCallback = function (/*result*/) {
				callback(null, null);
			};

			Asyst.API.DataSet.load({
				name: customDatasetName || 'PointPoint_PointEditForm-Gantt_Delete',
				data: linkObject,
				success: successCallback,
				error: errorCallback,
				async: isAsync
			});
		},

		AppendPointLink: function (linkObject, customDatasetName, isAsync, callback) {
			var errorCallback = function (errorName, errorDescription) {
				callback(new GanttError('Error', null, null, errorName, errorDescription), null);
			};

			var successCallback = function (result) {
				var error;

				var doesResponseExist =
					result &&
					result instanceof Array &&
					result.length > 0 &&
					result[0] &&
					result[0] instanceof Array &&
					result[0].length > 0;

				if (!doesResponseExist) {
					error = new GanttError(
						'Error', null, null,
						'Ошибка создания связи между КТ',
						'Не ожидаемая структура ответа от сервера');

					callback(error, null);
					return;
				}

				var response = result[0][0];

				if (response.hasOwnProperty('text')) {
					error = new GanttError(
						'Warning', 'Логическая ошибка', response.text,
						'Ошибка создания связи между КТ',
						'Созданная связь не прошла валидацию в CheckAfterSave');

					callback(error, null);
				}

				callback(null, null);
			};

			Asyst.API.DataSet.load({
				name: customDatasetName || 'PointPoint_PointEditForm-Gantt_AppendPointLink',
				data: linkObject,
				success: successCallback,
				error: errorCallback,
				async: isAsync
			});
		},

		LoadRestoredDatesOfPoint: function (pointId, customDatasetName, isAsync, callback) {
			var errorCallback = function (errorName, errorDescription) {
				callback(new GanttError('Error', null, null, errorName, errorDescription), null);
			};

			var successCallback = function (response) {
				var restoredDates = response[0];

				callback(null, restoredDates);
			};

			Asyst.API.DataSet.load({
				name: customDatasetName || 'General_Gantt_RestoreSummaryDates',
				data: { PointId: pointId },
				async: isAsync,
				success: successCallback,
				error: errorCallback
			});
		},

		LoadGanttData: function (projectId, customDatasetName, isAsync, callback) {
			var errorCallback = function (errorName, errorDescription) {
				callback(new GanttError('Error', null, null, errorName, errorDescription), null);
			};

			var successCallback = function (all, points, links, calendarExceptions, users, approvingDocuments) {
				var response = {
					Points: points,
					Links: links,
					CalendarExceptions: calendarExceptions,
					Users: users,
					ApprovingDocuments: approvingDocuments
				};

				callback(null, response);
			};

			Asyst.API.DataSet.load({
				name: customDatasetName || 'LoadGanttData',
				data: { ActivityId: projectId },
				success: successCallback,
				error: errorCallback,
				async: isAsync
			});
		},

		LoadCalendarExceptions: function (isAsync, callback) {
			var errorCallback = function (errorName, errorDescription) {
				callback(new GanttError('Error', null, null, errorName, errorDescription), null);
			};

			var successCallback = function (response) {
				var doesResponseExist = response &&
					response.data;

				if (!doesResponseExist) {
					var error = new GanttError(
						'Error', null, null,
						'Ошибка при загрузке представления AllCalendarExceptionView',
						'Не ожидаемая структура ответа от сервера');

					callback(error, null);
					return;
				}


				callback(null, response.data);
			};

			Asyst.API.View.load({
				viewName: 'AllCalendarExceptionView',
				data: null,
				async: isAsync,
				success: successCallback,
				error: errorCallback
			});
		},

		loadPointDefaults: function (defaults, isAsync, callback) {
			Asyst.API.Entity.load({
				entityName: 'Point',
				defaults: defaults,
				success: function (data) {
					callback(null, data);
				},
				error: function () {
					callback(new Asyst.Gantt.Error('Ошибка при подтягивании значений по умолчанию'));
				},
				async: isAsync
			});
		}
	};
})(Asyst.Gantt.Error);

Asyst.Gantt.Calendar = (function (GanttCalendar) {
	'use strict';

	var _WEEK_DAYS_DEFAULT = 'MON; TUE; WED; THU; FRI;';

	var _getCalendarExceptionsAsString = function (calendarExceptions) {
		return calendarExceptions
			.map(function (calendarException) { return calendarException.Date.toISOString().slice(0, 10); })
			.join('; ');
	};



	var _ganttCalendar;
	var _workDayDates;



	var init = function (calendarExceptions) {
		var holidays = calendarExceptions.filter(
			function (calendarException) { return !calendarException.IsWork; });

		_workDayDates = calendarExceptions
			.filter(function (calendarException) { return calendarException.IsWork; })
			.map(function (workday) { return workday.Date; });

		_ganttCalendar = new GanttCalendar(
			_WEEK_DAYS_DEFAULT
			+ ' HOL '
			+ _getCalendarExceptionsAsString(holidays)
		);
	};



	var _calculateWorkDaysEffort = function (activity) {
		if (activity.IsMilestone) {
			return new TimeSpan(0);
		}

		var startTime = activity.StartTime;
		var endTime = activity.EndTime;

		if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
			return 'Invalid dates';
		}

		if (startTime > endTime) {
			return 'Invalid dates';
		}

		// Effort за исключением выходных и праздничных дней
		var effort = _ganttCalendar.Schedule.GetEffort(startTime, endTime);

		var isEffortCorrected = effort.hours === 23
			&& effort.minutes === 59
			&& effort.seconds === 59;
		effort = isEffortCorrected ? effort.addSeconds(1) : effort;

		// Возвращаем выходные, которые считаются рабочими
		var workdaysCount = _workDayDates.filter(function (date) {
			return date > startTime && date < endTime;
		}).length;

		return effort.addDays(workdaysCount);
	};

	return {

		init: init,

		getEffortInDays: function (activity) {
			return _calculateWorkDaysEffort(activity).days || 0;
		},

		getCalendar: function () {
			return _ganttCalendar;
		}

	};
})(ns_gantt.Calendar);