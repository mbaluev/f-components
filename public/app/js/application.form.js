/* eslint-disable max-lines-per-function */
/*
 Событийная модель
 */
Asyst.Event = function (container, name) {
	'use strict';
	this.handlers = [];
	this.container = container;
	this.name = name;
};

Asyst.Event.prototype.attach = function (callback) {
	'use strict';
	if (typeof callback === 'function' && this.handlers.indexOf(callback) < 0) {
		this.handlers.push(callback);
		var string = callback.toString();
		if (string.indexOf('.off()') > -1) {
			console.warn('В коде обработчика найден код, отписывающий все события ".off()". Потенциально это может вызывать проблемы с другим кодом.', this.name || string);
		}
		if (string.indexOf('\'change\'') > -1) {
			console.warn('В коде обработчика найден код, навешивающий обработчик на изменение прямо на элемент jquery, это недопустимо. Используйте Binding.onDataChanged в событии onInited', this.name || string);
		}
		if (string.indexOf('onDataChanged(function') > -1) {
			console.warn('onDataChanged используется в обработчике, который запускается несколько раз во время работы формы. Это потенциальная проблема многократного навешивания обработчика. Используйте Binding.onDataChanged в событии onInited', this.name || string);
		}
	}
};
Asyst.Event.prototype.fire = function () {
	'use strict';
	try {
		var args = arguments;
		var context = this.container.Context;
		return this.handlers.map(function (h) { return h.apply(context, Array.prototype.slice.call(args)); });
	} catch (e) {
		console.error(e, this.name);
	}

};

Asyst.EventContainer = function (context) {
	'use strict';
	this.Context = context;

	this.onDataLoaded = new Asyst.Event(this, 'onDataLoaded');
	this.onBeforeOpen = new Asyst.Event(this, 'onBeforeOpen');
	this.onAfterOpen = new Asyst.Event(this, 'onAfterOpen');
	this.onTemplatesLoaded = new Asyst.Event(this, 'onTemplatesLoaded');
	this.onSelectLoaded = new Asyst.Event(this, 'onSelectLoaded');
	this.onSelectsLoaded = new Asyst.Event(this, 'onSelectsLoaded');
	this.onBeforeValidate = new Asyst.Event(this, 'onBeforeValidate');
	this.onAfterValidate = new Asyst.Event(this, 'onAfterValidate');
	this.onBeforeSave = new Asyst.Event(this, 'onBeforeSave');
	this.onAfterSave = new Asyst.Event(this, 'onAfterSave');
	this.onBeforeClosed = new Asyst.Event(this, 'onBeforeClosed');
	this.onClosed = new Asyst.Event(this, 'onClosed');
	this.onDocumentChange = new Asyst.Event(this, 'onDocumentChange');
	this.onBeforeDocumentUpload = new Asyst.Event(this, 'onBeforeDocumentUpload');
	this.onDataChanged = new Asyst.Event(this, 'onDataChanged');

};

function AsystFormData(formName) {
	'use strict';

	this.Form = $('form[name=' + formName + ']');

	if (this.Form.length === 0)
		$.error('Имя формы задано неверно, форма не найдена!');

	if (this.Form.data('AsystFormData'))
		$.error('Форма помечена как автозапускаемая и вы вызываете ее кодом или форма заупускается из кода дважды!. Уберите атрибут data-auto-load у элемента form в разметке!');

	var _events = new Asyst.EventContainer(this);

	var currentForm = this;
	this.FormName = formName;
	this.Data = {};
	this.Bindings = {};
	this.Events = _events;

	var _selectCount = 0;
	this.SelectData = {};
	var _templateCount = 0;
	this.TemplateData = {};

	this.EntityId = this.Form.attr('data-binding-entity-data-id');
	this.EntityName = this.Form.attr('data-binding-entity-name');
	this.TitleFormula = this.Form.attr('data-binding-title-formula');

	if (this.Form.attr('data-binding-title')) {
		this.Title = this.Form.attr('data-binding-title');
		document.title = this.Title;
	}

	Asyst.Workspace.addCurrentForm(this);
	this.Form.data('AsystFormData', this);

	this.onInited = function (callback) {
		if (typeof callback === 'function')
			callback.apply(this);
		return currentForm;
	};

	this.onDataLoaded = function (callback) {
		_events.onDataLoaded.attach(callback);
		return currentForm;
	};
	this.onBeforeOpen = function (callback) {
		_events.onBeforeOpen.attach(callback);
		return currentForm;
	};
	this.onAfterOpen = function (callback) {
		_events.onAfterOpen.attach(callback);
		return currentForm;
	};
	this.onBeforeValidate = function (callback) {
		_events.onBeforeValidate.attach(callback);
		return currentForm;
	};
	this.onAfterValidate = function (callback) {
		_events.onAfterValidate.attach(callback);
		return currentForm;
	};
	this.onBeforeSave = function (callback) {
		_events.onBeforeSave.attach(callback);
		return currentForm;
	};
	this.onAfterSave = function (callback) {
		_events.onAfterSave.attach(callback);
		return currentForm;
	};
	this.onClosed = function (callback) {
		_events.onClosed.attach(callback);
		return currentForm;
	};
	this.onClosedFire = function () {
		_events.onClosed.fire();
		return currentForm;
	};
	this.onBeforeClosed = function (callback) {
		_events.onBeforeClosed.attach(callback);
		return currentForm;
	};
	this.onBeforeClosedFire = function () {
		_events.onBeforeClosed.fire();
		if (!currentForm._closeStated) {
			Asyst.API.AdminTools.saveStats({ page: location.href, pageTitle: currentForm.GetTitle(), type: currentForm.IsEditCard() ? 'editCard' : 'viewCard', action: 'close', entityId: currentForm.Data.classid, dataId: currentForm.Data.id }, false);
			currentForm._closeStated = true;
			for (var b in currentForm.Bindings) {
				currentForm.Bindings[b].destroy();
			}
		}
		return currentForm;
	};
	this.onTemplatesLoaded = function (callback) {
		_events.onTemplatesLoaded.attach(callback);
		return currentForm;
	};
	this.onSelectLoaded = function (callback) {
		_events.onSelectLoaded.attach(callback);
		return currentForm;
	};
	this.onSelectsLoaded = function (callback) {
		_events.onSelectsLoaded.attach(callback);
		return currentForm;
	};
	this.onBeforeDocumentUpload = function (callback) {
		_events.onBeforeDocumentUpload.attach(callback);
		return currentForm;
	};
	this.onDocumentChange = function (callback) {
		_events.onDocumentChange.attach(callback);
		return currentForm;
	};

	this.onDataChanged = function (callback) {
		_events.onDataChanged.attach(callback);
		return currentForm;
	};


	var isEditCard;
	this.IsEditCard = function () {
		if (isEditCard === undefined) isEditCard = currentForm.hasOwnProperty('FormName') && this.FormName.indexOf('EditForm') !== -1;
		return isEditCard;
	};

	this.HasChanges = function () {
		for (var b in currentForm.Bindings) {
			if (currentForm.Bindings[b].isChanged) return true;
		}
		return false;
	};

	function _onValueChagned(newValue) {
		var binding = this;
		var access = currentForm.Access && currentForm.Access[binding.ElementName];
		if (access && (access.IsReadonly === true || access.IsVisible === false)) return;

		if (binding.Type !== 'label' && binding.Type !== 'template') {
			currentForm.Data[binding.PropertyName] = newValue;
			_events.onDataChanged.fire(binding, newValue);
		}

		currentForm.ProcessDataBindDataAttributes();
	}

	/**
     * Обработка data-bind-* атрибутов реактивного изменения разметки
     */
	var _databind_cache = {};
	this.ProcessDataBindDataAttributes = function () {
		/*
         +data-bind-enabled
         +data-bind-disabled
         +data-bind-visible
         +data-bind-invisible
         +data-bind-css
         +data-bind-class
         +data-bind-value
         +data-bind-html
         +data-bind-text
         +data-bind-attr
		 +data-bind-required
         */

		var attribues = {
			'data-bind-enabled': function (el, result) {
				var value = Boolean(result);
				var binding = $(el).data('f-binding');
				if (binding) binding.enableInput(value);
				else el[value ? 'removeAttribute' : 'setAttribute']('disabled', 'disabled');
			},
			'data-bind-disabled': function (el, result) {
				var value = Boolean(result);
				var binding = $(el).data('f-binding');
				if (binding) binding.enableInput(!value);
				else el[value ? 'setAttribute' : 'removeAttribute']('disabled', 'disabled');
			},
			'data-bind-visible': function (el, result) {
				var value = Boolean(result);
				var element = $(el);
				var binding = element.data('f-binding');
				if (binding) binding.show(value);
				else element[result ? 'show' : 'hide']();
			},
			'data-bind-invisible': function (el, result) {
				var value = Boolean(result);
				var element = $(el);
				var binding = element.data('f-binding');
				if (binding) binding.show(!value);
				else element[result ? 'hide' : 'show']();
			},
			'data-bind-class': function (el, arr) {
				for (var key in arr) {
					var result = Boolean(arr[key]);
					el.classList[result ? 'add' : 'remove'](key);
				}
			},
			'data-bind-value': function (el, result) {
				$(el).val(result);
			},
			'data-bind-html': function (el, result) {
				var html = String(result);
				if (el.innerHTML !== html) el.innerHTML = html;
			},
			'data-bind-text': function (el, result) {
				el.textContent = result;
			},
			'data-bind-attr': function (el, result) {
				for (var key in result) {
					var value = result[key];
					el[value != null && value !== '' ? 'setAttribute' : 'removeAttribute'](key, value);
				}
			},
			'data-bind-required': function (el, result) {
				var value = Boolean(result);
				var element = $(el);
				var binding = element.data('f-binding');
				if (binding) binding.setRequired(value);
				else el[value !== null && value !== '' ? 'setAttribute' : 'removeAttribute']('required', 'required');
			},
			'data-bind-css': function (el, result) {
				for (var key in result) {
					var value = result[key];
					el.style[key] = value;
				}
			}
		};

		for (var key in attribues) {
			currentForm.$('[' + key + ']').each(function (_, el) {
				try {
					var cache = _databind_cache;
					var keys = Object.keys(currentForm.Data).toString();
					var source = el.getAttribute(key);
					var func = cache[keys + source] || (cache[keys + source] = new Function(keys, 'return ' + source));
					var result = func.apply(currentForm, Object.values(currentForm.Data));
					attribues[key](el, result);
				} catch (e) {
					console.error('processDataBindDataAttributes failed', e, key, el);
				}
			});
		}
	};

	var _loadDefaults = function () {
		if (!currentForm.defaults) {
			var dafaultElement = document.querySelector('form[id=' + currentForm.FormName + ']');
			if (dafaultElement) {
				var val = dafaultElement.getAttribute('data-binding-default-fields');
				if (val && val.length > 0) {
					val = JSON.parse(val);
					if (val) currentForm.defaults = val;
				}
			}
		}
	};

	this.CreateBindings = function () {
		//Add bindings.
		currentForm.Bindings = {};
		//Because every element contains "input-type" attribute
		currentForm.$('[data-binding-input-type],[data-binding-property-name]').each(function () {
			var that = $(this);
			var dataset = that.data();
			var binding = {};

			//если нам попались элементы, которые просто html, но на них навешена матрица и в них есть контент - не нужно их брать в биндиг
			var skip = that.attr('name') && dataset.bindingTitle !== undefined && dataset.bindingInputType === undefined;
			if (!skip) {


				if (!that.attr('name')) {
					that.attr('name', guid());
				}

				binding.element = that;
				binding.elementName = that.attr('name');
				binding.propertyName = dataset.bindingPropertyName || binding.elementName;
				binding.type = dataset.bindingInputType || (that.is('select') ? 'select' : that.is('input') || that.is('textarea') ? 'text' : 'label');
				binding.content = dataset.bindingContent;
				binding.isRequired = dataset.bindingIsRequired || this.hasAttribute('required');
				binding.title = dataset.bindingTitle;
				binding.isShowHyperlink = dataset.hasOwnProperty('bindingIsShowHyperlink') && dataset.bindingIsShowHyperlink !== false || this.hasAttribute('data-binding-is-show-hyperlink');
				binding.displayMask = dataset.bindingDisplayMask;
				binding.isNeedData = dataset.bindingIsNeedData;
				binding.isSyncDataLoad = dataset.bindingIsSyncDataLoad;
				binding.precision = dataset.bindingPrecision;
				binding.scale = dataset.bindingScale;
				binding.items = dataset.bindingSourceItems;
				binding.sharedSource = dataset.bindingSharedSource;
				binding.dependOn = dataset.bindingDependOn;
				binding.max = that.attr('max') || that.attr('maxlength');
				binding.min = that.attr('min') || that.attr('minlength');

				binding.block = that.closest('.control-group, .f-control');
				if (binding.block.length === 0)
					binding.block = that.closest('[id]');
				if (binding.block.length === 0)
					binding.block = that;

				binding.onChange = _onValueChagned;

				currentForm.Bindings[binding.elementName] = new Asyst.Binding(currentForm, binding);

				if (binding.type === 'select' || binding.type === 'account') {
					_selectCount++;
				}

				if (binding.type === 'template' && binding.isNeedData === true) {
					_templateCount++;
				}
			}
		});

		for (var b in currentForm.Bindings) {
			if (currentForm.Bindings[b].DependOn) {
				new Asyst.DependentCombobox(currentForm.Bindings[b]);
			}
		}
	};
	this.Load = function () {
		_loadDefaults();

		currentForm.Form.attr('data-form-loaded', false);

		//Затравка на будущее, можно в карточку сразу вставлять данные,а не дергать сервер два раза, но это может сказаться на суммарном времени открытия окна
		//var inlineData = this.$("script[name=entityData]").html();

		//Если это карточка редактирования, открытая через openEntityDialog, то у нас должен быть в окне объект с предзагрузкой данных для карточки
		var promise = Asyst['preload' + currentForm.EntityName + (currentForm.EntityId || 'new')] ||
			Asyst['preload' + currentForm.FormName + (currentForm.EntityId || 'new')] ||
			//(inlineData ? Promise.resolve(inlineData) : null) ||
			Asyst.API.Entity.load({
				entityName: currentForm.FormName,
				dataId: currentForm.EntityId,
				isAccessNeed: true,
				defaults: currentForm.defaults
			});

		delete Asyst['preload' + currentForm.EntityName + (currentForm.EntityId || 'new')];
		delete Asyst['preload' + currentForm.FormName + (currentForm.EntityId || 'new')];

		promise.then(currentForm.ApplyData).catch(Asyst.protocol.ProcessError);
	};



	this.ApplyData = function (data) {
		currentForm.TemplateData = {};
		currentForm.SelectData = {};

		currentForm.Data = data;
		currentForm.InitialData = JSON.parse(JSON.stringify(data), JSON.dateParser);

		Asyst.API.AdminTools.saveStats({ page: location.href, pageTitle: currentForm.GetTitle(), type: currentForm.IsEditCard() ? 'editCard' : 'viewCard', action: 'open', entityId: currentForm.Data.classid, dataId: currentForm.Data.id }, true);

		if (data['__access__']) {
			currentForm.Access = data['__access__'];
		}

		if (data['__lockers__']) {
			currentForm.Lockers = data['__lockers__'];
		}

		if (data['__model__']) {
			currentForm.Model = data['__model__'];
		}

		if (data['__defaults__']) {
			currentForm.defaults = data['__defaults__'];
		} else {
			delete currentForm['defaults'];
		}


		currentForm.LockSaveButton();

		currentForm.userId = Asyst.Workspace.currentUser.Id;

		if (_selectCount === 0)
			currentForm.EnableSaveButton();
		else
			currentForm.DisableSaveButton();

		$(document).triggerHandler('AsystFormDataLoaded', currentForm);
		_events.onDataLoaded.fire();
		currentForm.Reset();
	};

	// Загружает данные в форму
	this.Reset = function () {
		$(document).triggerHandler('AsystFormBeforeOpen', currentForm);
		_events.onBeforeOpen.fire();

		var access;
		var $cr;

		currentForm.Form.attr('data-form-loaded', false);
		currentForm.$('.required-change-request,.required-phase-input,.required-input,.on-change-request').remove();

		if (this.Access) {
			for (var a in this.Access) {
				if (a && this.Access.hasOwnProperty(a)) {
					access = this.Access[a];

					if (access.ItemType === 'FormElement') {
						var $a = currentForm.$('[name=' + a + ']');
						if ($a.length === 0)
							$a = currentForm.$('[name=' + a + 'Id]');
						if ($a.length === 0)
							$a = currentForm.$('#' + a);
						if ($a.length === 0)
							$a = currentForm.$('#' + a + 'Id');

						//для скрытых элементов скипаем дальнейшую обработку - матрица для них неприменима
						if ($a.attr('type') === 'hidden') continue;

						if (!access.IsVisible) {
							$a.hide().addClass('access-matrix-hidden');
						} else if ($a.hasClass('access-matrix-hidden')) {
							$a.show().removeClass('access-matrix-hidden');
						}
						if (access.IsReadonly) {
							$a.addClass('disabled access-matrix-disabled').attr('disabled', '');
						} else if ($a.hasClass('access-matrix-disabled')) {
							$a.removeClass('disabled access-matrix-disabled').removeAttr('disabled');
						}
					}
				}
			}
		}

		for (var elementName in currentForm.Bindings) {
			try {

				var binding = currentForm.Bindings[elementName];
				var value = Asyst.Utils.GetPropertyValue(currentForm.Data, binding.PropertyName);
				binding.OldValue = Asyst.Utils.GetPropertyValue(currentForm.InitialData, binding.PropertyName);


				if (binding.Block.find('.help-inline').length === 0)
					binding.Element.after('<span class=".help-inline"/>');

				if (currentForm.Access && binding.Element.attr('type') !== 'hidden') {

					access = currentForm.Access[binding.PropertyName] || currentForm.Access[binding.ElementName];

					if (access) {

						if (!access.IsVisible) {
							binding.hide().addClass('access-matrix-hidden');
						} else if (binding.Block.hasClass('access-matrix-hidden')) {
							binding.show().removeClass('access-matrix-hidden');
						}

						if (access.IsReadonly) {
							binding.disableInput().addClass('disabled access-matrix-disabled');
						} else if (binding.Element.hasClass('access-matrix-disabled')) {
							binding.enableInput().removeClass('disabled access-matrix-disabled');
						}

						if (access.IsRequired) {
							binding.Block.find('.help-inline').before('<span class="required-phase-input" rel="tooltip" title="' + Globa.JSRequiredPhase + '"></span>');
						}

						if (access.ChangeRequestId && access.ChangeRequestId > 0) {
							$cr = currentForm.$('#' + a + 'ChangeRequest');
							if ($cr.length === 0) {
								binding.Block.find('.help-inline').before('<a href="#" class="on-change-request" rel="tooltip" title="' + Globa.ChangeRequest + '" onclick="ChangeRequestDialogById(Asyst.Workspace.getForm(Asyst.Workspace.getFormCount() - 2), ' + access.ChangeRequestId + ', true); void(0)">' + '</a>');
							}
						} else if (access.ReviewCycleId > 0 && this.IsEditCard() && !access.ChangeRequestId) {
							binding.Block.find('.help-inline').before('<span class="required-change-request" rel="tooltip" title="' + Globa.JSRequiredChangeRequest + '"></span>');
						}
					}
				}

				binding.setRequired(binding.IsRequired);

				binding.value(value);

				binding.OldDisplayValue = binding.displayValue();

			} catch (e) {
				console.error('reset on element failed', elementName, e);
				throw e;
			}
		}

		currentForm.ProcessDataBindDataAttributes();
		_markFormLoadedForTests();

		$(document).triggerHandler('AsystFormAfterOpen', currentForm);
		_events.onAfterOpen.fire();

		try {
			document.title = currentForm.GetTitle();
		} catch (e) {
			// continue regardless of error
		}


		//добавляем data-html для нового тултипа bootstrapа
		$('[rel="tooltip"]')
			.attr({ 'data-html': 'true', 'data-container': 'body' })
			.on('hidden', function () { return false; })
			.tooltip();

		Asyst.Workspace.showTab(getParameterByName('tab'));

	};

	function _markFormLoadedForTests() {
		if (_selectCount === 0 && _templateCount === 0
			|| (!currentForm.TemplateData || _templateCount === Object.keys(currentForm.TemplateData).length)
			&& (!currentForm.SelectData || _selectCount === Object.keys(currentForm.SelectData).length))
			currentForm.Form.attr('data-form-loaded', true);
	}

	this.GetTitle = function () {

		if (currentForm.TitleFormula) {
			currentForm.Title = new Function(Object.keys(currentForm.Data).toString(), 'return ' + currentForm.TitleFormula).apply(null, Object.values(currentForm.Data));
		}

		if (currentForm.Data) {
			if (currentForm.Data.Name) {
				currentForm.Title = currentForm.Data.classtitle + (currentForm.Data.Code ? ' ' + currentForm.Data.Code + '. ' : '. ') + currentForm.Data.Name;
			} else if (currentForm.defaults && currentForm.defaults.Title) {
				currentForm.Title = currentForm.defaults.Title;
			} else if (currentForm.defaults && currentForm.defaults.Name) {
				currentForm.Title = currentForm.Data.classtitle + (currentForm.defaults.Code ? ' ' + currentForm.defaults.Code + '. ' : '. ') + currentForm.defaults.Name;
			}
		}

		return currentForm.Title;
	};

	this.LockSaveButton = function () {
		if (this.IsEditCard() && this.Lockers && this.Lockers.length) {
			currentForm.Form.parents('.k-window')
				.find('.k-window-actions a .k-i-hyperlink-open, .k-window-actions a .k-i-check, .k-window-actions a .k-i-save')
				.parents('a').remove();
			var lockers = 'Данная карточка открыта на редактировании у пользователей: <br>' + this.Lockers.map(function (item) {
				return item.UserName + ' ' + moment(item.Date).format('DD.MM.YYYY HH:mm');
			}).join('<br>') + '<br> и поэтому вы не можете вносить в нее изменения. Дождитесь, пока карточка будет закрыта или обратитесь к вашему Функциональному администратору для принудительного разблокирования.';
			currentForm.Form.prepend('<div class="f-notify f-notify_warning f-notify_inline f-notify_margin">' + lockers + '</div>');
		} else {
			currentForm.Form.parents('.k-window')
				.find('.k-window-actions a .k-i-hyperlink-open, .k-window-actions a .k-i-check, .k-window-actions a .k-i-save')
				.parents('a').show();
		}
	};

	this.DisableSaveButton = function () {
		if (!currentForm.IsEditCard()) {
			return;
		}

		var $saveButton = currentForm.Form.parents('.k-window')
			.find('.k-window-actions a .k-i-save, .k-window-actions a .k-i-check, .k-window-actions a .k-i-hyperlink-open').parents('a');
		$saveButton.attr({ disabled: 'disabled' });
	};

	this.EnableSaveButton = function () {
		if (!currentForm.IsEditCard()) {
			return;
		}

		var $saveButton = currentForm.Form.parents('.k-window')
			.find('.k-window-actions a');
		$saveButton.attr({ disabled: null });
	};


	this.Save = function (success, notsave) {
		currentForm.DisableSaveButton('Сохранение...');

		var batch = new Asyst.API.Entity.Batch(currentForm.EntityName);
		currentForm.Update();

		Promise.resolve('gogogo').then(function () {
			$(document).triggerHandler('AsystFormBeforeValidate', currentForm);
			return Promise.all(_events.onBeforeValidate.fire());
		}).then(function () {
			return currentForm.Validate();
		}).then(function (errors) {
			$(document).triggerHandler('AsystFormAfterValidate', [currentForm, errors]);
			return new Promise(function (pass, fail) {
				Promise.all(_events.onAfterValidate.fire(errors)).then(function () {
					if (errors === null || errors.length === 0) {
						pass();
					} else {
						currentForm.EnableSaveButton();
						currentForm.ShowErrors(errors, function (error) {
							Dialogs.Dock('validate-modal');
							currentForm.selectElement(error.binding.ElementName);
						});
					}
				}).catch(fail);
			});
		}).then(function () {
			batch.add(currentForm.EntityId, currentForm.Data);
			$(document).triggerHandler('AsystFormBeforeSave', [currentForm, batch]);
			return Promise.all(_events.onBeforeSave.fire(batch));
		}).then(function () {
			if (!$.isEmptyObject(currentForm.RequestsNeeded)) {
				return new Promise(function (next) {
					var postData = $.extend({}, currentForm.Data);
					currentForm.ShowChangeRequestDialog(currentForm.RequestsNeeded, postData, next, postData);
				});
			} else return currentForm.Data;
		}).then(function (postData) {
			if (notsave === true) return;

			batch.DataPacket.__packet__[0]['data'] = postData;
			return batch.save();
		}).then(function (data) {
			if (notsave === true) return;

			data = data[0];
			$.extend(currentForm.Data, data);

			var stats = {
				page: location.href, pageTitle: currentForm.GetTitle(), type: currentForm.IsEditCard() ? 'editCard' : 'viewCard',
				action: 'save', entityId: currentForm.Data.classid, dataId: currentForm.Data.id
			};
			if (currentForm.isNew) {
				currentForm.EntityId = data.id;
				currentForm.id = data.id;
				$('#' + currentForm.FormName + 'EntityId').val(data.id);
				stats = $.extend(stats, { action: 'create', dataId: data.id });
			}
			Asyst.API.AdminTools.saveStats(stats, true);

		}).then(function () {
			$(document).triggerHandler('AsystFormAfterSave', currentForm);
			return Promise.all(_events.onAfterSave.fire());
		}).then(function () {
			if (typeof success === 'function') success();
		}).catch(Asyst.protocol.ProcessError)
			.finally(function () {
				currentForm.EnableSaveButton();
			});
	};

	// Обновляет данные из формы
	this.Update = function () {
		for (var elementName in currentForm.Bindings) {
			var binding = currentForm.Bindings[elementName];
			var access = currentForm.Access && currentForm.Access[binding.ElementName];

			if (access && (access.IsReadonly === true || access.IsVisible === false)) continue;

			if (binding.Type !== 'label' && binding.Type !== 'template') {
				currentForm.Data[binding.PropertyName] = binding.value();
			}
		}
	};

	this.Validate = function (highlight) {

		if (highlight === undefined || highlight === null) highlight = true;
		var min;
		var max;
		var errors = [];
		this.RequestsNeeded = {};
		for (var elementName in this.Bindings) {
			var binding = this.Bindings[elementName];

			binding.setInputWarning(false);

			if (binding.Type !== 'label' && binding.Type !== 'template') {
				var value = binding.value();

				if (binding.Type === 'number' || binding.Type === 'decimal') {
					var val = binding.Element.val();

					if (!Asyst.number.validate(val, binding)) {
						binding.setInputWarning(true, Globa.IncorrectNumberFormat.locale());
						errors.push({ binding: binding, message: Globa.IncorrectNumberFormat.locale() + ' "' + binding.Title + '"' });
					}

					min = Number(binding.Min);
					if (binding.Min && !isNaN(min) && value < min) {
						binding.setInputWarning(true, 'Значение не может быть меньше ' + Asyst.number.format(min, '#,#.[000000]'));
						errors.push({ binding: binding, message: 'Значение в поле "' + binding.Title + '" не может быть меньше ' + Asyst.number.format(min, '#,#.[000000]') });
					}
					max = Number(binding.Max);
					if (binding.Max && !isNaN(max) && value > max) {
						binding.setInputWarning(true, 'Значение не может быть больше ' + Asyst.number.format(max, '#,#.[000000]'));
						errors.push({ binding: binding, message: 'Значение в поле "' + binding.Title + '" не может быть больше ' + Asyst.number.format(max, '#,#.[000000]') });
					}
				} else if (binding.Type === 'date' || binding.Type === 'datetime') {
					if (value != null && value.constructor !== Date) {
						binding.setInputWarning(true, Globa.IncorrectDateFormat.locale());
						errors.push({ binding: binding, message: Globa.WrongDateFieldFormat.locale() + ' "' + binding.Title + '"' });
					}

					min = Asyst.date.parse(binding.Min, Asyst.date.defaultDateFormat);
					if (min && value < min) {
						binding.setInputWarning(true, 'Значение не может быть меньше ' + binding.Min);
						errors.push({ binding: binding, message: 'Значение в поле "' + binding.Title + '" не может быть меньше ' + binding.Min });
					}
					max = Asyst.date.parse(binding.Max, Asyst.date.defaultDateFormat);
					if (max && value > max) {
						binding.setInputWarning(true, 'Значение не может быть больше ' + binding.Max);
						errors.push({ binding: binding, message: 'Значение в поле "' + binding.Title + '" не может быть больше ' + binding.Max });
					}
				} else if (binding.Type === 'text') {
					var length = (value || '').length;
					min = Number(binding.Min);
					if (binding.Min && !isNaN(min) && length < min) {
						binding.setInputWarning(true, 'Недостаточное количество символов. Введено  ' + length + ', допустимо ' + min);
						errors.push({ binding: binding, message: 'Недостаточное количество символов в поле "' + binding.Title + '". Введено  ' + length + ', допустимо от ' + min });
					}
					max = Number(binding.Max);
					if (binding.Max && !isNaN(max) && max > 0 && length > max) {
						binding.setInputWarning(true, 'Превышено количество символов. Введено  ' + length + ', допустимо ' + max);
						errors.push({ binding: binding, message: 'Превышено количество символов в поле "' + binding.Title + '". Введено  ' + length + ', допустимо до ' + max });
					}
				}

				if (this.Access && binding.isChanged) {
					var access = this.Access[binding.PropertyName ? binding.PropertyName : binding.ElementName];

					if (access && access.ReviewCycleId > 0) {
						this.RequestsNeeded[binding.ElementName] = {
							ElementName: binding.ElementName,
							PropertyName: binding.PropertyName,
							ReviewCycleId: access.ReviewCycleId,
							ReviewCycleName: access.ReviewCycleName,
							ReviewCycleIsGrouping: access.ReviewCycleIsGrouping,
							Title: binding.Title,
							NewValue: value,
							OldValue: binding.OldValue,
							OldDisplayValue: binding.OldDisplayValue,
							NewDisplayValue: binding.displayValue(),
							Reviewers: access.Reviewers,
							Description: '',
							ChangeRequestType: 0,
							DocumentId: access.DocumentId
						};

					}
				}

				if (binding.IsRequired) {
					if (binding.isEmpty) {
						binding.setInputWarning(true, 'Обязательное поле');
						errors.push({ binding: binding, message: Globa.FillField.locale() + ' "' + binding.Title + '"' });
						if (highlight) currentForm.$(binding.Block).addClass('error');
					} else {
						currentForm.$(binding.Block).removeClass('error');
					}
				}
			}
		}

		return errors;
	};

	this.ShowErrors = function (errors, clickFunc) {
		var msg = '<ul>';
		for (var i in errors) {
			if (!errors.hasOwnProperty(i)) continue;
			var convertedError = $('<div />').html(errors[i].message).text();
			if (errors[i].binding)
				msg += '<li><a href="#" errorid="' + i + '">' + convertedError + '</a></li>';
			else
				msg += '<li>' + convertedError + '</li>';
		}
		msg += '</ul>';


		Dialog(Globa.Saving.locale(), msg, undefined, 'validate-modal');


		var click = function (event) {
			if (clickFunc)
				clickFunc(event.data);
			event.preventDefault();
		};
		for (var j in errors) {
			if (!errors.hasOwnProperty(j)) continue;
			$('#validate-modal [errorid=' + j + ']').on('click', errors[j], click);
		}
	};



	//создание элемента ЗИ по элементу form.Document
	this.MakeFileChangeRequest = function (document, filename) {
		if (document && document.access && document.access.ReviewCycleId > 0) {
			return {
				ElementName: document.identifier,
				PropertyName: document.identifier,
				ReviewCycleId: document.access.ReviewCycleId,
				ReviewCycleName: document.access.ReviewCycleName,
				ReviewCycleIsGrouping: document.access.ReviewCycleIsGrouping,
				Title: document.name,
				NewValue: filename,
				OldValue: filename,
				OldDisplayValue: filename,
				NewDisplayValue: filename,
				Reviewers: document.access.Reviewers,
				Description: '',
				ChangeRequestType: 0,
				DocumentId: document.access.DocumentId
			};
		}
	};

	this.MakeActivityPhaseChangeRequest = function (access, binding, nextPhaseId, nextPhaseName) {
		return {
			ElementName: binding.ElementName,
			PropertyName: binding.PropertyName,
			ReviewCycleId: access.ReviewCycleId,
			ReviewCycleName: access.ReviewCycleName,
			ReviewCycleIsGrouping: access.ReviewCycleIsGrouping,
			Title: binding.Title,
			NewValue: nextPhaseId,
			OldValue: binding.Form.Data[binding.ElementName], //binding.OldValue,
			OldDisplayValue: binding.OldDisplayValue,
			NewDisplayValue: nextPhaseName,
			Reviewers: access.Reviewers,
			Description: '',
			ChangeRequestType: 0,
			DocumentId: access.DocumentId
		};
	};

	//создание ЗИ
	//список запросов и набор данных, из которого нужно удалять данные попавшие под ЗИ(опционально)
	//doSave - функция с одни аргументом success, которая будет вызвана по OK в диалоге.
	this.ShowChangeRequestDialog = function (requestsNeeded, postData, doSave, success) {



		//чистим отправляемые на сохранение данные от идущих через ЗИ
		var processPostData = function (postData, requestsNeeded) {
			for (var r in requestsNeeded) {
				var request = requestsNeeded[r];

				if (postData && postData.hasOwnProperty(request.ElementName)) {
					delete postData[request.ElementName];
					delete postData[request.ElementName + 'Id'];
					delete postData[request.ElementName + 'Items'];
				}
			}
		};
		processPostData(postData, requestsNeeded);

		var form = currentForm;
		var allRequests = Asyst.Utils.clone(requestsNeeded);

		var hasGrouping = false; var needGrouping = false;
		var grouper = {};
		for (var ctx in requestsNeeded) {
			if (requestsNeeded[ctx].ReviewCycleIsGrouping && grouper.hasOwnProperty(requestsNeeded[ctx].ReviewCycleId)) {
				hasGrouping = true;
			} else {
				grouper[requestsNeeded[ctx].ReviewCycleId] = [];
			}
			grouper[requestsNeeded[ctx].ReviewCycleId].push(Asyst.Utils.clone(requestsNeeded[ctx]));
		}

		function showCRCard(ctx) {
			var request = requestsNeeded[ctx];
			var fields = Asyst.Utils.clone(request);
			$.extend(fields, {
				State: 1,
				EntityId: form.Data.classid,
				DataId: form.Data.id
			});

			var changeRequestformName = 'ChangeRequestEditForm';
			Asyst.API.Entity.load({
				entityName: 'reviewCycle',
				dataId: request.ReviewCycleId,
				isAccessNeed: false,
				async: false,
				success: function (reviewCycle) {
					if (reviewCycle.ReviewCycleCard && reviewCycle.ReviewCycleCard.EditForm) {
						changeRequestformName = reviewCycle.ReviewCycleCard.EditForm;
					}
				}
			});


			Asyst.ChangeRequest.Storage = {
				form: form,
				request: fields,
				requestsNeeded: allRequests,
				groupedCR: needGrouping ? grouper[requestsNeeded[ctx].ReviewCycleId] : undefined,
				needGrouping: needGrouping

			};
			Asyst.Workspace.openEntityDialog({
				entityName: changeRequestformName,
				title: 'Запрос на изменение',
				id: null,
				fields: fields,
				notsave: true,
				saveNoClose: false
			}); //changeRequestformName, 'Запрос на изменение', 'new', function () { }, fields);

			//если включена группировка, то вычищаем из основного массива полей для ЗИ уже попавшие в группу
			var rcId = request.ReviewCycleId;
			for (var c in requestsNeeded) {
				if (c === ctx || needGrouping && requestsNeeded[c].ReviewCycleId === rcId) {
					delete requestsNeeded[c];
				}
			}

			var nextCard = function (_, form) {
				if (form.FormName === changeRequestformName) {
					$(document).off('AsystFormClosed', nextCard);
					var next = null;
					for (var c in requestsNeeded) {
						next = c;
						break;
					}
					if (next) {
						showCRCard(next);
					} else { /* все пукнты ЗИ обработаны - теперь принятие ЗИ, если нужно */

						Loader.show(null, 'Обработка запроса на изменение');
						setTimeout(function () {
							doSave(success);

							Asyst.API.DataSet.load({
								name: 'CRAutoAgree',
								data: { DataId: Asyst.ChangeRequest.Storage.form.Data.id, UserId: Asyst.Workspace.currentUser.Id },
								async: true,
								success: function (_, d) {
									for (var i = 0; i < d.length; i++) {
										var item = d[i];
										Asyst.API.ChangeRequest.agree({ dataId: item.DataId, requestId: item.ChangeRequestId, comment: 'Автосогласование', async: false });
									}
									if (d.length > 0) {
										currentForm.Load();
									}
									Loader.hide();
								}
							});
						}, 50);
					}
				}
			};

			$(document).on('AsystFormClosed', nextCard);
		}

		var groupContinue = function () {
			needGrouping = true;
			$('#CRNeedGroupingDialog').modal('hide');
			showCRCard(Object.keys(requestsNeeded)[0]);
		};

		var noGroupContinue = function () {
			needGrouping = false;
			$('#CRNeedGroupingDialog').modal('hide');
			showCRCard(Object.keys(requestsNeeded)[0]);
		};

		if (hasGrouping) {
			//needGrouping = confirm('Группировать ЗИ по цепочкам согласования?');
			needGrouping = Dialogs.Confirm('Групповые ЗИ', 'Группировать запросы на изменение по согласующим?', groupContinue, noGroupContinue, 'CRNeedGroupingDialog');
		} else {
			noGroupContinue();
		}

	};



	this._setSelectData = function (elementName, data) {
		currentForm.SelectData[elementName] = data;

		$(document).triggerHandler('AsystFormSelectLoaded', [currentForm, elementName, data]);
		_events.onSelectLoaded.fire(elementName, data);

		if (_selectCount === Object.keys(currentForm.SelectData).length) {
			currentForm.EnableSaveButton();
			$(document).triggerHandler('AsystFormSelectsLoaded', currentForm);
			_events.onSelectsLoaded.fire();
			_markFormLoadedForTests();
		}
	};

	this._setTemplateData = function (elementName, data) {
		currentForm.TemplateData[elementName] = data;

		if (_templateCount === Object.keys(currentForm.TemplateData).length) {
			$(document).triggerHandler('AsystFormTemplatesLoaded', currentForm);
			_events.onTemplatesLoaded.fire();
			_markFormLoadedForTests();
		}


	};


	this.getActiveTab = function () {
		var el = this.$('#tabs li.active a[data-toggle="tab"]');
		var el2 = $(el.attr('href')).find('.nav-tabs li.active a[data-toggle="tab"]');
		return el2.length > 0 ? el2 : el;
	};

	this.getTabByText = function (text) {
		return this.$('#tabs a:contains("' + text + '")');
	};

	this.getTabByName = function (name) {
		return this.$('#tabs a[href*="' + this.FormName + name + '"]');
	};

	this.getNestedTabByName = function (name) {
		return this.$('#tabs a[href*="' + this.FormName + name + '"]');
	};

	this.getNestedTabByText = function (text) {
		return this.$('#tabs a:contains("' + text + '")');
	};

	this.getRolesEmail = function () {
		var items; var item;
		var emails = {};
		var result = [];
		var i;
		for (var binding in currentForm.Bindings) {
			items = currentForm.Data[currentForm.Bindings[binding].ElementName];
			if (jQuery.isArray(items)) {
				for (i = 0; i < items.length; i++) {
					item = items[i];
					if (item && (item.entityname === 'Account' || item.entityname === 'User') && item.EMail && !emails[item.EMail]) {
						emails[item.EMail] = item.EMail;
						result[result.length] = item.EMail;
					}
				}
			}
		}
		if (result.length > 0) {
			return result.join(';');
		} else
			return '';
	};

	this.selectElement = function (elementName) {

		var selector = elementName;
		if (selector[0] !== '#') selector = '#' + selector;

		var $tab;
		var $el = currentForm.$(selector);
		var $parent = $el.parent();
		while ($parent.length > 0) {
			if ($parent.hasClass('tab-pane')) {
				var tabName = $parent[0].id;
				$tab = currentForm.$('#tabs a[href="#' + tabName + '"]');
				$tab.tab('show');
				break;
			}
			$parent = $parent.parent();
		}

		if ($el.length > 0)
			$el[0].focus();

		return $tab;
	};

	//механизм для клиентских обработчиков.
	//использование: form.ClientHandlers.addHandler(form.ClientHandlers.onDocumentChange,function(){alert('документы изменились!'});
	//альтернатива: form.ClientHandlers.addHandler('MyEvent',myfunc); - добавление обработчика
	//              form.ClientHandlers.raiseEvent('MyEvent') -вызов обработчика
	this.ClientHandlers = {
		handlers: {},
		onDocumentChange: 'onDocumentChange',
		onBeforeDocumentUpload: 'onBeforeDocumentUpload', //при возникновении исключения в обработке - происходит отказ от загрузки

		addHandler: function (eventName, func) {
			if (!this.handlers.hasOwnProperty(eventName))
				this.handlers[eventName] = [];
			this.handlers[eventName].push(func);
		},
		addUniqueHandler: function (eventName, func) {
			if (!this.handlers.hasOwnProperty(eventName))
				this.handlers[eventName] = [];
			var flag = 0;
			for (var i = 0; i < this.handlers[eventName].length; i++) {
				if (this.handlers[eventName][i] === func) flag = 1;
			}
			if (!flag)
				this.handlers[eventName].push(func);
		},
		raiseEvent: function (eventName, args) {
			var handlersArray = this.handlers[eventName];
			if (!handlersArray || !Array.isArray(handlersArray)) return;
			for (var i = 0; i < handlersArray.length; i++) {
				handlersArray[i](args);
			}
		}
	};

	this.beforeDocumentUploadHandler = function (args) {
		var CR = [];
		if (args.document) {
			var cr = currentForm.MakeFileChangeRequest(args.document, args.filename, 'add');
			if (!$.isEmptyObject(cr))
				CR.push(cr);
		}
		if (CR.length > 0) {
			var doSave = function (success) {
				if (success)
					success();
			};
			currentForm.ShowChangeRequestDialog(CR, null, doSave);
		}
	};
	this.ClientHandlers.addUniqueHandler(this.ClientHandlers.onBeforeDocumentUpload, this.beforeDocumentUploadHandler);

	this.$ = function (selector) {
		return currentForm.Form.find(selector);
	};

	this.CreateBindings();
	setTimeout(function () {
		$(document).triggerHandler('AsystFormInited', currentForm);
	}, 0);
}

Object.defineProperty(AsystFormData.prototype, 'isNew', {
	get: function () {
		'use strict';
		return !this.EntityId;
	}
});

AsystFormData.AutoLoad = function () {
	'use strict';
	$('form[data-binding-is-auto-form],form[data-auto-load]').each(function (_, form) {
		if (!$(form).data('AsystFormData')) {
			new AsystFormData($(form).attr('name')).Load();
		}
	});
};

$(AsystFormData.AutoLoad);
