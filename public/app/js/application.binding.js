(function () {
	'use strict';


    /*
     * Привязка данных к полям формы
     * @param {AsystFormData} form Форма с данными 
     * @param {object} initer Конструктор 
     */
	Asyst.Binding = function (form, initer) {
		var that = this;
		var _onChangeEvent = new Asyst.Event({ Context: this });

		this.Form = form;
		this.Element = initer.element;
		this.ElementName = initer.elementName; //Имя элемента на форме, должно совпадать с именем MetaField.Name
		this.Type = initer.type; //тип данных и элемента управления
		this.Block = initer.block; //html блок, в котором лежит элемент и его подпись
		this.PropertyName = initer.propertyName || initer.elementName; //свойство данных откуда бедем данные, по умолчанию совпадает с Name, но может отличаться, например Project.Name
		this.Content = initer.content; //Контент шаблона данных
		this.IsRequired = initer.isRequired; //Обязательность
		this.Title = initer.title; //Отображаемый заголовок
		this.IsShowHyperlink = initer.isShowHyperlink; //Показывать ссылки для Подписи
		this.DisplayMask = initer.displayMask; //Маска отображения для чисел и дат
		this.IsNeedData = initer.isNeedData; //Нужно ли запрашивать данные для Шаблонов
		this.IsSyncDataLoad = initer.isSyncDataLoad; //Асинхронность загрузки
		this.Precision = initer.precision; //количество знаков до запятой
		this.Scale = initer.scale; //количество знаков после запятой

		this.Items = initer.items; //массив значений для выпадашки или функция, которая его создает
		this.SharedSource = initer.sharedSource; //ссылка на источник данных на другую выпадашку - переиспользуем данные
		this.DependOn = initer.dependOn;

		this.Min = initer.min;
		this.Max = initer.max;

		this.Element.data('f-binding', this);

		if (!this.DisplayMask && this.Scale > 0) {
			var displayMask = "##,#";
			displayMask += ".";
			for (var i = 0; i < this.Scale; i++)
				displayMask += "#";

			this.DisplayMask = displayMask;
		}
		else if (this.Type === "number") {
			this.DisplayMask = "0";
		}

		_onChangeEvent.attach(initer.onChange);

		this.onChange = function (callback) {
			_onChangeEvent.attach(callback);
			return that;
		};

		this._onValueChanged = function () {
			_onChangeEvent.fire(that.value());
		};

		if (this.Element.is("textarea")
			|| this.Element.is("input") && (this.Type === "text" || this.Type === "checkbox")) {
			this.Element[0].removeEventListener('change', this._onValueChanged);
			this.Element[0].addEventListener('change', this._onValueChanged);
		}

	};




	Asyst.Binding.prototype.equals = function (a, b) {
		var v1 = a;
		var v2 = b;
		if (this.Type === "date") {
			v1 = Asyst.date.format(v1, Asyst.date.defaultDateFormat);
			v2 = Asyst.date.format(v2, Asyst.date.defaultDateFormat);
		}
		else if (this.Type === "datetime") {
			v1 = Asyst.date.format(v1, Asyst.date.defaultDateTimeFormat);
			v2 = Asyst.date.format(v2, Asyst.date.defaultDateTimeFormat);
		}
		else if (this.Type === "time") {
			v1 = Asyst.date.format(v1, Asyst.date.defaultTimeFormat);
			v2 = Asyst.date.format(v2, Asyst.date.defaultTimeFormat);
		}
		return equals(v1, v2);
	};



	Asyst.Binding.prototype.value = function () {

		var get = function () {

			var $el = this.Element;

			if ($el.length === 0
				|| !$el.is('input') && !$el.is('textarea') && !$el.is('select')) {
				return this.OldValue;
			}

			$el[0].blur();
			var value = $el.val();

			if (this.Type === 'date' && this.kendoDatePicker) {
				value = this.kendoDatePicker.value();
			} else if (this.Type === 'datetime' && this.kendoDateTimePicker) {
				value = this.kendoDateTimePicker.value();
			} else if (this.Type === 'time' && this.kendoTimePicker) {
				value = this.kendoTimePicker.value();
			} else if (this.Type === 'label') {
				value = $el.text();
			} else if (this.Type === 'checkbox') {
				value = $el[0].checked;
			} else if (this.Type === 'number' || this.Type === 'decimal') {
				value = this.kendoNumeric.value();
			} else if (this.Type === 'select' && this.Element.kendoselect) {
				value = this.Element.kendoselect.value();
				if (value === null || value === undefined || value === '')
					return null;

				var field = this.Form.Model && this.Form.Model.fields[this.PropertyName];
				var role = this.Form.Model && this.Form.Model.roles[this.PropertyName.replace('Id', '')];
				var multipleField = this.Form.Model && this.Form.Model.multipleFields[this.PropertyName];
				if (
					field && (field.DataTypeName === 'int' || field.DataTypeName === 'bigint')
					|| role
					|| multipleField && (multipleField.ValueField.DataTypeName === 'int' || multipleField.ValueField.DataTypeName === 'bigint')
				) {
					if (value && Array.isArray(value))
						value = value.map(function (i) { return Number(i); });
					else if (value)
						value = Number(value);
					else
						value = null;

				}
			}

			return value;

		};

		var set = function (value) {

			var $el = this.Element;


			if (this.Type === "date") {
				this.kendoDatePicker = this.kendoDatePicker || $el.kendoDatePicker({
					format: this.DisplayMask || Asyst.date.defaultDateFormat,
					dateInput: true,
					change: this._onValueChanged
				}).data('kendoDatePicker');
				this.kendoDatePicker.value(value);
				return value;
			}
			else if (this.Type === "time") {
				this.kendoTimePicker = this.kendoTimePicker || $el.kendoTimePicker({
					format: this.DisplayMask || Asyst.date.defaultTimeFormat,
					dateInput: true,
					change: this._onValueChanged
				}).data('kendoTimePicker');
				this.kendoTimePicker.value(value);
				return value;
			}
			else if (this.Type === "datetime") {
				this.kendoDateTimePicker = this.kendoDateTimePicker || $el.kendoDateTimePicker({
					format: this.DisplayMask || Asyst.date.defaultDateTimeFormat,
					dateInput: true,
					change: this._onValueChanged
				}).data('kendoDateTimePicker');
				this.kendoDateTimePicker.value(value);
				return value;
			}
			else if (value instanceof Date) {
				var displayMask = this.DisplayMask;
				if (!displayMask) {
					if (value.getHours() === 0 && value.getMinutes() === 0)
						displayMask = Asyst.date.defaultFormat;
					else
						displayMask = Asyst.date.defaultDateTimeFormat;
				}
				value = Asyst.date.format(value, displayMask);
			}
            else if (this.Type === "number" || this.Type === "decimal") {
                var precisionValue = numeral(this.Precision || 0).value();
                var scaleValue = numeral(this.Scale || 0).value();

                var minValue = numeral(this.Min.replace(".", ",")).value();
                var maxValue = numeral(this.Max.replace(".", ",")).value();

				this.kendoNumeric = this.kendoNumeric || $el.kendoNumericTextBox({
					format: this.DisplayMask,
					decimals: this.Scale || 0,
					restrictDecimals: true,
					round: false,
                    step: scaleValue > 0 ? 0.1 : 1,
                    min: minValue,
                    max: maxValue,
					downArrowText: 'Меньше',
					upArrowText: 'Больше',
					change: this._onValueChanged
				}).data("kendoNumericTextBox");

				this.kendoNumeric.value(value);
				return value;

			} else if (this.Type === "checkbox") {
				$el[0].checked = value === true;
				return value;
			} else if (typeof value === "boolean") {
				if (value)
					value = "Да";
				else
					value = "Нет";
			}


			if (this.Type === "template") {
				this.loadTemplate();
			} else if (this.Type === "label" && this.Items && $.isArray(this.Items)) {
				var items = this.Items.filter(function (i) { return String(i.Key) === String(value) || (value.Value && String(i.Key) === String(value.Value)); });
				if (items && items.length) value = items[0].Value;
				$el.html(value);
			} else if (this.Type === "label" && typeof value === 'number') {
				$el.html(kendo.toString(value, this.DisplayMask));
			} else if (this.Type === "label") {
				value = Asyst.Utils.StringToHtml(Asyst.Utils.GetPropertyText(value, this, this.DisplayMask !== 'html'));
				$el.html(value);
			} else if (this.Type === "select" || this.Type === "account") {
				this.loadSelect(value);
			} else if ($el.is("input")) {
				if (value === null || value === undefined) value = "";
				$el.val(value);
			} else {
				if (value === null || value === undefined) value = "";
				$el.text(value);
			}


			return value;
		};

		if (arguments.length > 0) {
			try {
				return set.apply(this, arguments);
			} catch (e) {
				console.error(this, e);
			}
		} else {
			return get.apply(this);
		}
	};


	Asyst.Binding.prototype.loadSelect = function (value, reloadList, callback) {
		var binding = this;

		var error = function (error, text) {
			kendo.ui.progress(binding.Form.Form, false);
			ErrorHandler(Globa.ErrorLoadComboItems.locale(), error + "<br>" + text);
		};

		var success = function (data) {
			binding.processSelectData(data, value);
			if (typeof callback === 'function')
				callback.call();
		};

		kendo.ui.progress(binding.Form.Form, true);
		delete this.Form.SelectData[this.ElementName];

		var kendoElement = this.Element.kendoselect;

		if (!reloadList && kendoElement && kendoElement.dataSource && kendoElement.dataSource.data().length > 0) {
			kendo.ui.progress(binding.Form.Form, false);
			kendoElement.value(value);
		} else if (this.SharedSource) {
			var sharedFunction = this.sharedFunction || (this.sharedFunction = function (sharedElement, sharedData) {
				if (sharedElement === binding.SharedSource) {
					success(sharedData);
				}
			});

			if (this.Form.SelectData[binding.SharedSource]) {
				this.processSelectData(this.Form.SelectData[binding.SharedSource], value);
			}

			this.Form.onSelectLoaded(sharedFunction);
		} else if (this.Items && $.isArray(this.Items)) {
			this.processSelectData(this.Items, value);
		} else if (this.Items) {
			try {
				var script = '"use strict";return (' + this.Items + ')';
				var result = new Function("success", "error", script)(success, error);
				if (result && $.isArray(result)) success(result);
			} catch (e) {
				error(e, e.message);
			}
		} else {

			var callArg = {
				sourceType: 'entity',
				sourceName: this.Form.FormName,
				elementName: this.ElementName,
				data: this.Form.Data,
				success: success,
				error: error,
				async: true,
				isPicklist: true
			};

			Asyst.API.DataSource.load(callArg);
		}
	};

	Asyst.Binding.prototype.processSelectData = function (data, value, callback) {
		var binding = this;
		kendo.ui.progress(binding.Form.Form, false);

		this.Form._setSelectData(this.ElementName, data);
		var isDisabled = this.Element.prop('disabled');
		var isMultiple = this.Element.prop('multiple');
		var selectType = isMultiple ? 'kendoMultiSelect' : 'kendoDropDownList';// 'kendoComboBox';
		this.Element.empty();
		this.Element.val(null);

		var box = this.Element.data(selectType) || this.Element[selectType]({
			dataTextField: "Value",
			dataValueField: "Key",
			filter: "contains",
			clearButton: true || !this.IsRequired,
			virtual: {
				valueMapper: function (options) {
					if (options.value === null || options.value === undefined) {
						options.success(null);
					} else {
						var selected = data.reduce(function (prev, curr, index) {
							if (options.value == curr.Key
								|| $.isArray(options.value) && options.value.some(function (e) { return String(e) === String(curr.Key); }))
								prev.push(index);
							return prev;
						}, []);

						options.success(selected);
					}
				}

			},
			autoBind: false,
			syncValueAndText: false,
			enable: !isDisabled,
			height: 290,
			//optionLabel: !this.IsRequired ? { Key: null, Value: '' } : '',
			template: '<span class="#: data.Disabled ? \'k-state-disabled\': \'\'#">#= Value #</span>',
			itemTemplate: '<span class="#: data.Disabled ? \'k-state-disabled\': \'\'#">#= Value #</span>',
			valueTemplate: function (data) { return String(data.Value).replace(/(&nbsp;|&#0183;)/g, ""); },
			tagTemplate: function (data) { return String(data.Value).replace(/(&nbsp;|&#0183;)/g, ""); },
			noDataTemplate: 'Ничего не найдено',
			autoClose: !isMultiple,
			select: function (e) {
				if (e.dataItem && e.dataItem.Disabled) {
					e.preventDefault();
				}
			},
			open: function () {
				if (binding.Element[0].options.length === 0 || binding.Element.hasClass("reloadable")) {
					var value = binding.Element.val();
					binding.Form.Update();
					binding.loadSelect(value, true);
				}
			},
			change: binding._onValueChanged
		}).data(selectType);

		if (!binding.IsRequired) {
			if (binding.Element.closest('.k-dropdown').find('span.k-clear-value').length === 0) {
				binding.Element.closest('.k-dropdown').find('span.k-input').after('<span unselectable="on" class="k-icon k-clear-value k-i-close" title="Очистить" role="button" tabindex="-1"></span>');
				binding.Element.closest('.k-dropdown').find('span.k-clear-value').on('click', function (e) {
					e.preventDefault();
					e.stopPropagation();
					if (box.text)
						box.text('');
					box.value(null);
					if (box.select)
						box.select(-1);
					binding.Element.val(null);
					binding.Element.change();
					binding._onValueChanged();
				});
			}
		} else {
			this.Element.closest('.k-dropdown').find('span.k-clear-value').remove();
		}


		this.Element.kendoselect = box;

		if (box.text)
			box.text('');
		if (box.select)
			box.select(-1);

		box.setDataSource({ data: data, pageSize: 20 });

		if (!data || data.length === 0) {
			value = null;
		} else {
			if (!$.isArray(value))
				value = [value];
			var keys = data.map(function (v) { return v.Key.toString(); });
			value = value.filter(function (v) { return v !== null && v !== undefined && keys.includes(v.toString()); });
		}

		box.value(value);

		//binding.Element.change();
		if (typeof callback === 'function')
			callback.call();
	};

	Asyst.Binding.prototype.displayValue = function (inValue) {

		var value = inValue === undefined ? this.value() : inValue;

		if (value === null || value === undefined) return '';
		if (value.constructor === Array && value.length === 0) return '';
		if (typeof value === 'string' && value.trim().length === 0) return '';

		if (this.Type === 'datetime') {
			value = Asyst.date.format(value, this.DisplayMask || Asyst.date.defaultDateTimeFormat);
		} else if (this.Type === 'date') {
			value = Asyst.date.format(value, this.DisplayMask || Asyst.date.defaultDateFormat);
		} else if (this.Type === 'time') {
			value = Asyst.date.format(value, this.DisplayMask || Asyst.date.defaultTimeFormat);
		} else if (this.Type === 'checkbox' || typeof value === 'boolean') {
			if (value)
				value = 'Да';
			else
				value = 'Нет';
		} else if (this.Type === 'number' || this.Type === 'decimal') {
			value = Asyst.number.format(value, this.DisplayMask);
		} else if (this.Type === 'select' || this.Type === 'account') {
			if (value.constructor !== Array) {
				value = [value];
			}
			var data = this.Form.SelectData[this.PropertyName] || this.Form.SelectData[this.ElementName] || [];
			value = value.map(function (v) { return String(v); });
			return data.filter(function (v) { return value.includes(String(v.Key)); })
				.map(function (v) { return v.Value.toString().replace(/(&nbsp;|&#0183;)/g, '').trim(); })
				.join('; ');
		} else if (this.Items && $.isArray(this.Items)) {
			return this.Items.filter(function (i) { return String(i.Key) === String(value) || value.Value && String(i.Key) === String(value.Value); })
				.map(function (v) { return v.Value.toString().replace(/(&nbsp;|&#0183;)/g, '').trim(); })
				.join('; ');
		} else if (typeof value === 'object' && value.namefield) {
			return value[value.namefield];
		} else if (value.constructor === Array && value.length > 0 && typeof value[0] === 'object' && value[0].namefield) {
			return value.map(function (v) { return v[v.namefield]; })
				.join('; ');
		}

		return value;
	};

	Asyst.Binding.prototype.loadTemplate = function () {
		try {
			var binding = this;

			var success = function (data) {

				try {
					var s = Asyst.Utils.ProcessTemplate(binding.Content, data, binding.Form);
					binding.Element.html(s);
				} catch (err) {
					console.error({ template: binding.ElementName, error: err });
				}
				if (binding.IsNeedData) {
					kendo.ui.progress(binding.Element, false);
					binding.Form._setTemplateData(binding.ElementName, data);
				}
			};

			if (binding.IsNeedData) {
				kendo.ui.progress(binding.Element, true);

				Asyst.API.DataSource.load({
					sourceType: 'entity',
					sourceName: binding.Form.FormName,
					elementName: binding.ElementName,
					data: binding.Form.Data,
					success: success,
					error: function (error, text) { ErrorHandler(Globa.ErrorDataListLoad.locale(), error + '<br>' + text); },
					async: !binding.IsSyncDataLoad,
					isPicklist: false
				});
			} else {
				success(null);
			}
		} catch (err) {
			console.error({ template: this.ElementName, error: err });
		}
	};

	/**
     * Возвращает связанные объекты для выбранных значений в выпадающем списке
     *
     * @return {Object} - выбран один элемент, Array - выбранно нсколько элементов, null - ничего не выбранно, undefined - в SelectData нет данных об этом поле
     */
	Asyst.Binding.prototype.objectValue = function () {
		var value = this.value();
		var isValArray = $.isArray(value);
		var strVal = String(value);
		var result;

		if (this.Form.SelectData.hasOwnProperty(this.ElementName)) {
			result = this.Form.SelectData[this.ElementName].filter(function (item) {
				return isValArray ? value.includes(String(item.Key)) : String(item.Key) === strVal;
			});

			if (result.length === 1) {
				return result[0];
			} else if (result.length === 0) {
				return null;
			} else {
				return result;
			}
		} else {
			return undefined; //такого элемента у нас в данных нет
		}
	};

	/**
     * Блокирует или разблокирует элемент, связанный с этим биндингом
     *
     * @param {boolean}   value true - разблокировать элемент, не обязательный, по умолчанию true
     *
     * @return {jQuery} jQuery элемент
     */
	Asyst.Binding.prototype.enableInput = function (value) {
		var $el = this.Element;
		if (value !== false) value = true;
		var kendo = $el.kendoselect || $el.data('kendoDatePicker') || $el.data('kendoNumericTextBox');
		if (kendo && kendo.enable) kendo.enable(value);
		if (value) {
			$el.prop('disabled', false);
			$el.removeAttr("disabled");
			$el.removeClass("disabled");
			$el.trigger("chosen:updated.chosen");
			$el.find('*').prop('disabled', false);
			$el.find('*').removeAttr("disabled");
			$el.find('*').removeClass("disabled");
			$el.find('.chosen-select').trigger("chosen:updated.chosen");
		} else {
			$el.attr("disabled", "");
			$el.addClass("disabled");
			$el.prop('disabled', true);
			$el.trigger("chosen:updated.chosen");
			$el.find('*').not('option').attr("disabled", "");
			$el.find('*').not('option').addClass("disabled");
			$el.find('*').not('option').prop('disabled', true);
			$el.find('.chosen-select').trigger("chosen:updated.chosen");
		}
		return $el;
	};

    /**
     * Блокируетэлемент, связанный с этим биндингом
     * @return {jQuery} jQuery элемент
     */
	Asyst.Binding.prototype.disableInput = function () {
		return this.enableInput(false);
	};

    /**
     * Делает элемент обязательным
     *
     * @param {boolean}   value true - разблокировать элемент, не обязательный, по умолчанию true
     * 
     * @return {jQuery} jQuery элемент
     */
	Asyst.Binding.prototype.setRequired = function (value) {
		var el = this.Element;
		if (value !== false) value = true;

		this.IsRequired = value;

		var elRequired = this.Block.find('.required-input');
		if (value && this.Form.IsEditCard()) {
			if (elRequired.length === 0) {
				this.Block.find('.help-inline').before('<span class="required-input" rel="tooltip" title="Обязательно"></span>');
			}
		} else {
			elRequired.remove();
		}

		return el;
	};

    /**
     * Добавляет к элементу предупреждение
     *
     * @param {boolean}  value true - Есть предупреждение, не обязательный, по умолчанию true
     * @param {string}   text Текс предупреждения
     * 
     * @return {jQuery} jQuery элемент
     */
	Asyst.Binding.prototype.setInputWarning = function (value, text) {
		if (value !== false) value = true;

		if (value) {
			this.Block.addClass("warning");
			var last = this.Block.find('.help-inline').html() || '';
			this.Block.find('.help-inline').html(last + text + '<br/>');
		}
		else {
			this.Block.removeClass("warning");
			this.Block.find('.help-inline').html("");
		}

		return this.Element;
	};

	Asyst.Binding.prototype.hide = function () {
		return this.Block.hide();
	};
    /**
     * Показывать или скрывает элемент
     * @param {boolean} value true показать элемент, false скрыть. Если не передавать, то по умолчанию - показать
     * @return {jQuery} jQuery элемент
     */
	Asyst.Binding.prototype.show = function (value) {
		if (value !== false) value = true;
		if (value)
			return this.Block.show();
		else
			return this.Block.hide();
	};

	Object.defineProperty(Asyst.Binding.prototype, "isHidden", {
		get: function () {
			return this.Block.css('display') === 'none';
		}
	});

	Object.defineProperty(Asyst.Binding.prototype, "isEmpty", {
		get: function () {
			var value = this.value();
			if (value === null || value === undefined) return true;
			if (value.constructor === Array && value.length === 0) return true;
			if (typeof value === "string" && value.trim().length === 0) return true;
		}
	});

	Object.defineProperty(Asyst.Binding.prototype, "isChanged", {
		get: function () {
			return !this.equals(this.OldValue, this.value());
		}
	});

	Object.defineProperty(Asyst.Binding.prototype, 'OldDisplayValue', {
		get: function () {
			return this.displayValue(this.OldValue);
		},
		set: function () { }
	});

	Asyst.Binding.prototype.destroy = function () {
		var kendo = this.kendoNumeric
			|| this.kendoDateTimePicker
			|| this.kendoTimePicker
			|| this.kendoDatePicker
			|| this.Element.kendoselect;
		if (kendo) {
			kendo.destroy();
		}
	};

})();