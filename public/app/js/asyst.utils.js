/* eslint-disable max-lines-per-function */
(function () {
	'use strict';
	var root = Asyst;
	root.Utils = {
		GetPropertyValue: function (data, propPath) {
			var result;

			if (propPath.indexOf('(') !== -1) {
				result = new Function(Object.keys(data).toString(), 'return ' + propPath).apply(null, Object.values(data));
			} else if (propPath.indexOf('.') !== -1) {

				var pathArray = propPath.split('.');
				result = data;
				for (var idx in pathArray) {
					if (!result) break;

					var propName = pathArray[idx];

					if (result instanceof Array) {
						var tmp = [];

						for (var i = 0; i < result.length; i++) {
							var v = result[i];

							if (v) {
								v = v[propName];
								if (v) tmp.push(v);
							}
						}

						result = tmp;
					} else
						result = result[propName];
				}
			} else
				result = data[propPath];

			return result;
		},
		GetPropertyText: function (value, binding, escapeHtml) {
			if (escapeHtml === undefined) escapeHtml = false;
			var idx;
			var fieldName;
			var entityName;
			var keyName;
			var link;

			var result = value;

			if (result instanceof Array) {
				if (binding === null || binding === undefined || !binding.IsShowHyperlink || !binding.Form.Data.hasOwnProperty(binding.ElementName + 'Items')) {
					for (idx in result) {
						result[idx] = Asyst.Utils.GetValueText(result[idx], escapeHtml);
					}
					result.sort();

					result = result.join(', ');
				} else {
					//обрамление мультиполей в ссылки
					fieldName = binding.ElementName + 'Items';
					var item = binding.Form.Data[fieldName];
					for (idx in result) {
						entityName = item[idx].entityname;
						keyName = item[idx].keyfield;
						if (entityName) {
							link = '/' + entityName + '/form/auto/' + item[idx][keyName];
							result[idx] = '<li><a href="#" data-save-tab-and-go="' + link + '">' + root.Utils.GetValueText(result[idx], escapeHtml) + '</a></li>';
						} else result[idx] = root.Utils.GetValueText(result[idx], escapeHtml);
					}
					result = '<ul>' + result.join(' ') + '</ul>';
				}
			} else if (binding && binding.IsShowHyperlink && binding.Form.Data.hasOwnProperty(binding.ElementName.replace('Id', ''))) {
				fieldName = binding.ElementName.replace('Id', '');
				if (binding.Form.Data[fieldName] && binding.Form.Data[fieldName].entityname) {
					entityName = binding.Form.Data[fieldName].entityname;
					keyName = binding.Form.Data[fieldName].keyfield;
					link = '/' + entityName + '/form/auto/' + binding.Form.Data[fieldName][keyName];
					result = '<a href="#" data-save-tab-and-go="' + link + '">' + root.Utils.GetValueText(result, escapeHtml) + '</a>';
				} else {
					result = root.Utils.GetValueText(result, escapeHtml);
				}
			} else
				result = root.Utils.GetValueText(result, escapeHtml);

			return result;
		},
		GetValueText: function (value, escapeHtml) {
			if (escapeHtml === undefined) escapeHtml = false;

			if (value instanceof Date) {
				if (value.getHours() === 0 && value.getMinutes() === 0)
					value = Asyst.date.format(value);
				else
					value = Asyst.date.format(value, Asyst.date.defaultDateTimeFormat);
				return value;
			} else if (typeof value === 'boolean') {
				if (value)
					value = Globa.Yes.locale();
				else
					value = Globa.No.locale();
				return value;
			} else if (typeof value === 'number') //#10307 Каров 15.10.2015 Ошибка в обработке подстановочных значений в Подписе - не выводилось значение 0
				return value;
			else if (value && value.constructor === String) {
				return escapeHtml ? root.Utils.EscapeHtml(value) : value;
			} else if (value)
				return value;
			else
				return '';
		},
		/**
		 * Экранирует все html теги для безопасного вывода страницах
		 * @param {string} value Входная строка
		 * @returns {string} Преобразованная строка
		 */
		EscapeHtml: function (value) {
			if (!this.EscapeHtmldiv)
				this.EscapeHtmldiv = $('<div/>');
			return this.EscapeHtmldiv.text(value === null || value === undefined ? '' : value).html();
		},
		/**
		 * Убрает все теги и приводит к чистому тексту
		 * @param {string} value Входная строка
		 * @returns {string} Преобразованная строка
		 */
		ClearHtml: function (value) {
			if (!this.ClearHtmldiv)
				this.ClearHtmldiv = document.createElement('div');
			this.ClearHtmldiv.innerHTML = value === null || value === undefined ? '' : value;
			return this.ClearHtmldiv.innerText;
		},
		StringToHtml: function (s) {
			if (typeof s === 'string')
				return s.replace(/\n\r?/g, '<br />');
			else
				return s;
		},
		/**
		 * Преобразовывает потенциально опасные теги в текст (img, script, form, iframe, input)
		 * @param {string} value Входная строка
		 * @returns {string} Преобразованная строка
		 */
		SanitazeHtml: function (value) {
			var html = $.parseHTML(value);

			function clear (arr) {
				for (var i = 0; i < arr.length; i++) {
					var tagName = arr[i].tagName;
					if (tagName === 'IMG' || tagName === 'SCRIPT' || tagName === 'FORM' || tagName === 'IFRAME' || tagName === 'INPUT')
						arr[i] = new Text(root.Utils.EscapeHtml(arr[i].outerHTML));
					clear(arr[i].childNodes);
				}
			}

			clear(html);

			return html.map(function (e) { return e.outerHTML || e.nodeValue; }).join('');
		},
		ProcessTemplate: function (content, data, context) {
			if (!content) return;
			//content = $("<div/>").html(content).text();
			var us = content.toUpperCase();
			var start = us.indexOf('<HTMLROW>');
			var finish = us.indexOf('</HTMLROW>');
			var left;
			var right;
			var rowTemplate;
			var rowsStr;

			if (start > -1)
				console.warn('[Deprecated] Использование htmlrow устарело и вскоре будет удалено! Используйте templateData для доступа к массиву данных вместо этого!');

			//Проход по таблицам
			while (start >= 0 && finish >= 0) {
				left = content.substr(0, start);
				right = content.substr(finish + 10);
				rowTemplate = content.substring(start + 9, finish);
				rowsStr = '';

				/*Для хранения выражений*/
				var functionsArray = {};

				//Проход по данным
				for (var idx in data) {
					var item = data[idx];

					if (item) {
						var rowStr = rowTemplate;


						/*
						PMF-430 В поле Встроенный HTML с галкой Шаблон добавить возможность простых программных выражений
						можно писать простые выражения {(IsSuccess == 1 ? 'Успешно' : 'Неуспешно')}
						*/
						rowStr = rowStr.replace(/{(\(.*?\))}/g, function (str, exp, offset) {
							if (!functionsArray[offset]) {
								functionsArray[offset] = new Function(Object.keys(item).toString(), 'return ' + exp);
							}
							return functionsArray[offset].apply(null, Object.values(item));
						});

						//#10306 Каров 16.10.2015 Поддержка форматирования в htmlrow
						/*
						При обработке htmlrow можно задавать маску отображения и замену, в случае пустого (null) значение
						Общий вид выражения {propName:mask?Default value}
						Пример: {StartDate:dd.MM.yyyy?(Не начато)}
						Параметры mask и Default необязательные

						Отдельно добавлен формат B для булевых данных, преобразует в Да/Нет
						{boolValProp:B}
						*/

						for (var prop in item) {
							rowStr = rowStr.replace(new RegExp('{' + prop + '(?:\\:(.+?))?(?:\\?(.+?))?}', 'g'), function (match, mask, def) {

								var value = item[prop];

								//console.log('%s %s %s %s', match, prop, value, value === undefined);

								if (value === undefined) return match;

								if (mask) {
									if (value instanceof Date) {
										value = Asyst.date.format(value, mask);
									} else if (typeof value === 'number') {
										value = Asyst.number.format(value, mask);
									} else if (typeof value === 'boolean' && mask === 'B') {
										value = value ? Globa.Yes.locale() : Globa.No.locale();
									}
								}

								if (!value && value !== 0 && def)
									value = def;

								return mask === 'html' ? value : root.Utils.EscapeHtml(value);
							});
						}
					}
					rowsStr += rowStr;
				}

				content = left + rowsStr + right;

				us = content.toUpperCase();
				start = us.indexOf('<HTMLROW>');
				finish = us.indexOf('</HTMLROW>');
			}

			start = us.indexOf('<IFEMPTY>');
			finish = us.indexOf('</IFEMPTY>');
			while (start >= 0 && finish >= 0) {
				left = content.substr(0, start);
				right = content.substr(finish + 10);
				rowTemplate = content.substring(start + 9, finish);
				rowsStr = '';

				if (data.length === 0)
					rowsStr = rowTemplate;

				content = left + rowsStr + right;

				us = content.toUpperCase();
				start = us.indexOf('<HTMLROW>');
				finish = us.indexOf('</HTMLROW>');
			}

			start = us.indexOf('<IFNOTEMPTY>');
			finish = us.indexOf('</IFNOTEMPTY>');
			while (start >= 0 && finish >= 0) {
				left = content.substr(0, start);
				right = content.substr(finish + 13);
				rowTemplate = content.substring(start + 12, finish);
				rowsStr = '';

				if (data.length > 0)
					rowsStr = rowTemplate;

				content = left + rowsStr + right;

				us = content.toUpperCase();
				start = us.indexOf('<HTMLROW>');
				finish = us.indexOf('</HTMLROW>');
			}

			content = root.Utils.TemplateProcessNames(content, context.Data);

			return content;
		},
		TemplateProcessObj: function (template, obj) {
			var s = template;
			for (var prop in obj) {
				if (prop) {
					while (s.indexOf('{' + prop + '}') >= 0)
						s = s.replace('{' + prop + '}', obj[prop]);
				}
			}
			return s;
		},
		TemplateProcessNames: function (template, data) {
			var value;
			var text;

			var start = template.indexOf('{%');
			var finish = template.indexOf('%}');
			while (start >= 0 && finish >= 0) {
				var left = template.substr(0, start);
				var right = template.substr(finish + 2);
				var name = template.substring(start + 2, finish);

				var escapeHtml = true;
				if (name.indexOf(':html') > 0) {
					escapeHtml = false;
					name = name.replace(':html', '');
				}

				if (name === 'origin')
					text = location.protocol + '//' + location.host;
				else {
					value = root.Utils.GetPropertyValue(data, name);
					text = root.Utils.GetPropertyText(value, null, escapeHtml);
				}

				template = left + text + right;

				start = template.indexOf('{%');
				finish = template.indexOf('%}');
			}
			return template;
		},
		/**
		* Поверхностное клонирование
		* @param {any} obj Объект для клонирования
		* @returns {any} Новый объект
		*/
		clone: function (obj) {

			if (obj === null)
				return obj;
			else if (obj.constructor === Array)
				return [].concat(obj);
			else if (typeof obj !== 'object')
				return obj;
			else {
				var temp = {};
				for (var key in obj)
					temp[key] = obj[key];
				return temp;
			}
		},
		/**
         * Формирует из массива объектов один объект
         * где ключем будет или key или Id внутреннего объекта, значением или Name или результат функции mapFn
         * @param {Array} data массив объектов
         * @param {String} key свойство внутреннего объекта, используется как ключ для нового по умолчанию ключ "Id"
         * @param {Function} mapFn функция для формирования выборки из объекта, по умолчанию значение из поля "Name"
         * @return {Object} missing description
         * */
		arrayToMap: function (data, key, mapFn) {
			var map = {};

			key = key || null;
			mapFn = mapFn || null;

			data.forEach(function (item, index) {
				map[item[key] || item.id] = mapFn && mapFn.call(null, item, index) || item.name;
			});
			return map;
		},
		/**
         * Получение или обновление значения в объекте по переданному пути к свойству
         * @param {Object} obj объект где искать свойства
         * @param {String} path строка с путем до свойства
         * @param {Any} newVal новое значение, если оно не передано будет возвращено текущее
         * @return {Any} missing description
         * */
		deepValue: function (obj, path, newVal) {
			var i; var pathArr; var count;

			pathArr = path.split('.');
			count = pathArr.length - 1;

			for (i = 0; i < count; i++) {
				obj = obj[pathArr[i]];
			}
			if (newVal !== undefined) {
				obj[pathArr[count]] = newVal;
			}
			return obj[pathArr[count]];
		},
		/**
         * Заменяет последнюю часть пути у объекта на Id, используется для обновления значений Id модели
         * для справочников
         * @param {string} fieldName путь в для замены
         * @return {string} string путь с конечным свойством Id
         * @example
         * getFieldIdPath("MyTestObj.InnerObject.name") -> "MyTestObj.InnerObject.id"
         * */
		getFieldIdPath: function (fieldName) {
			var fieldNameArr = fieldName.split('.');

			if (fieldNameArr.length < 2) {
				return fieldName;
			}

			var lastIndex = fieldNameArr.length - 1;
			if (fieldNameArr[lastIndex] === 'name') {
				fieldNameArr[lastIndex] = 'id';
			}
			return fieldNameArr.join('.');
		},
		/**
         * Округление числа до переданного порядка.
         * @param {number} num число для округления
         * @param {number} order порядок округления
         * @return {number} number
         * */
		round: function (num, order) {
			if (isNaN(num)) {
				console.error('Function Utils.round - argument "num" is NaN');
			}
			order = order || 2;
			var multiplier = Math.pow(10, order);
			return Math.round(num * multiplier) / multiplier;
		},
		/**
         * Возвращает индекс в массиве по передааному предикату
         * @param {array} array массив для поиска индекса
         * @param {function} predicate функция - предикат, которой на вход передается элемент массива
         * @return {number} number индекс первого найденного элемента или -1
         * */
		indexByPredicate: function (array, predicate) {
			var i; var count;
			count = array.length;
			for (i = 0; i < count; i++) {
				if (predicate(array[i])) {
					return i;
				}
			}
			return -1;
		},
		/**
         * Возвращает новый пустой объект заглушку с полями id,name
         * @returns {object} missing description
         */
		newIdName: function () {
			return {
				id: null,
				name: ''
			};
		},
		/**
         * Вызывает стандартное окно ошибки для приложения с заданным
         * заголовком и сообщением
         * @param {string} title заголовок сообщения
         * @param {string} message текст сообщения
         */
		errorFn: function (title, message) {
			NotifyError(title || 'Ошибка получения данных', message || "При загрузке данных произошла ошибка, перезагрузите страницу для корректной работы приложения <button class='btn btn-default' onclick='location.reload()'>Перезагрузить<i class='icon-refresh'></i></button>");
		},

		/**
         * Получает значение куки по её имени
         * @param {string} name имя куки для получения
         * @returns {string} значение установленной куки. undefined в случае отсутствия
         */
		getCookie: function (name) {
			var matches = document.cookie.match(new RegExp(
				'(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
			));
			return matches ? decodeURIComponent(matches[1]) : undefined;
		},
		/**
         *
         * @param {Any} name missing description
         * @param {Any} value missing description
         * @param {Any} options missing description
         */
		setCookie: function (name, value, options) {
			options = options || {};

			var expires = options.expires;

			if (typeof expires == 'number' && expires) {
				var d = new Date();
				d.setTime(d.getTime() + expires * 1000);
				expires = options.expires = d;
			}
			if (expires && expires.toUTCString) {
				options.expires = expires.toUTCString();
			}

			value = encodeURIComponent(value);

			var updatedCookie = name + '=' + value;

			for (var propName in options) {
				updatedCookie += '; ' + propName;
				var propValue = options[propName];
				if (propValue !== true) {
					updatedCookie += '=' + propValue;
				}
			}

			document.cookie = updatedCookie;
		},
		deleteCookie: function (name, options) {
			options.expires = -1;
			setCookie(name, '', options);
		},
		/**
        * Возвращает обертку, которая позволяет вызвать функцию
        * не чаще чем через определенный интервал времени.
        * @param {function} func - оборачиваемая функция
        * @param {number} timeInMs - время в миллисекудах
        * @returns {func} - обернутая функция
        */
		throttle: function (func, timeInMs) {
			var timeout;
			var lastRunDateTime;

			return function () {
				var args = arguments;
				var context = this;

				if (!lastRunDateTime) {
					func.apply(context, args);
					lastRunDateTime = Date.now();
				} else {
					clearTimeout(timeout);
					timeout = setTimeout(function () {
						if (Date.now() - lastRunDateTime >= timeInMs) {
							func.apply(context, args);
							lastRunDateTime = Date.now();
						}
					}, timeInMs - (Date.now() - lastRunDateTime));
				}
			};
		},
		/**
         * Возвращает обертку, которая позволяет вызвать функцию
         * только через определенный интервал времени после последней попытки вызова функции.
         * @param {function} func - оборачиваемая функция
         * @param {number} timeInMs - время в миллисекудах
         * @returns {func} - обернутая функция
         */
		debounce: function (func, timeInMs) {
			var timeout;

			return function () {
				var args = arguments;
				var context = this;

				if (timeout) {
					clearTimeout(timeout);
				}

				timeout = setTimeout(function () {
					func.apply(context, args);
				}, timeInMs);
			};
		},
		/**
        * Возвращает обертку, которая по аргументам вызываемой функции кэширует результат.
        * (использовать только для чистых функций)
        * @param {function} func - оборачиваемая функция
        * @param {Object} userOptions - пользовательские опции
        * @returns {func} - обернутая функция
        */
		memoize: function (func, userOptions) {
			var options = $.extend({
				objectsDisableCaching: true // Аргумент-объект отключает кэширование
			}, userOptions);

			var cache = {};

			/**
             * Хэш-функция
             * @param {Array} args - аргументы вызова
             * @returns {String} - ключ
             */
			var makeKeyFromArguments = function (args) {
				return args.map(function (argument) {
					var isToStringable = typeof argument === 'number' || typeof argument === 'string' || typeof argument === 'boolean';
					return isToStringable ? argument.toString() : '';
				}).join(',');
			};

			return function () {
				var args = [].slice.call(arguments);
				var context = this;

				if (options.objectsDisableCaching) {
					var argsHaveSomeObject = args.some(function (argument) {
						// null - тоже объект
						return typeof argument === 'object' && argument !== null;
					});

					if (argsHaveSomeObject) {
						func.apply(context, args);
						return;
					}
				}

				var key = makeKeyFromArguments(args);
				var isCached = cache.hasOwnProperty(key);
				var cached = cache[key];

				return isCached ? cached : cache[key] = func.apply(context, args);
			};
		},

		/**
         * Растягивает элемент на весь экран
         * @param {Object} userOptions пользовательские настройки
         */
		FullScreenResizer: (function () {
			var _isFullScreen = false;
			var _$element = null;

			var _getAllParentElements = function ($element) {
				return $element.parents();
			};

			return {
				enterFullScreen: function ($element) {
					var elementIsEmpty = !$element;
					var elementIsNotJQuery = !($element instanceof jQuery);
					var elementIsEmptyJQuery = $element.length === 0;
					var hasMultipleElements = $element.length > 1;

					if (elementIsEmpty || elementIsNotJQuery || elementIsEmptyJQuery || hasMultipleElements) {
						throw 'Неправильный аргумент';
					}

					var parents = _getAllParentElements($element);

					parents.each(function () {
						var current$element = $(this);
						current$element.addClass('asyst-z-index-maximized');
					});

					$element.addClass('asyst-full-screened');

					_isFullScreen = true;
					_$element = $element;
				},

				exitFullScreen: function () {
					if (!_isFullScreen) {
						return;
					}

					var zIndexMazximizedElements = $('.asyst-z-index-maximized');
					zIndexMazximizedElements.removeClass('asyst-z-index-maximized');

					_$element.removeClass('asyst-full-screened');

					this.clear();
				},

				isFullScreen: function () {
					return _isFullScreen;
				},

				clear: function () {
					_isFullScreen = false;
					_$element = null;
				}
			};
		})(),

		/**
         * Содержит ли граф циклы.
         * http://cybern.ru/proverka-orgrafa-na-aciklichnost-realizaciya-na-java.html
         * @param {Array} graph - проверяемый граф - массив объектов следующей структуры: { ID, predecessors[] }, где predecessors - массив идентификаторов предшествующих элементов.
         * @returns {Boolean} - содержит ли?
         */
		graphHasCycles: function (graph) {
			if (!graph || !graph.length) { return false; }

			//массив для хранения цветов вершин
			var color = [];
			//флаг, показывающий содержит орграф цикл или нет
			var hasCycle = false;

			//процедура обхода в глубину
			function dfsCycle (graphElementId) {
				//если вершина является черной, то не производим из нее вызов процедуры
				if (color[graphElementId] === 2) {
					return;
				}
				//выходим из процедуры, если уже нашли один из циклов
				if (hasCycle) {
					return;
				}
				//если вершина является серой, то орграф содержит цикл
				if (color[graphElementId] === 1) {
					hasCycle = true;
					return;
				}
				//помечаем вершину как серую
				color[graphElementId] = 1;

				// Проходим по связанным записям
				var graphElement = graph.filter(function (el) { return el.ID == graphElementId; });
				if (graphElement && graphElement.length) {
					graphElement = graphElement[0];
					if (graphElement.predecessors && graphElement.predecessors.length) {
						//запускаем обход из всех вершин, смежных с вершиной graphElement
						for (var i = 0; i < graphElement.predecessors.length; i++) {
							var predecessor = graphElement.predecessors[i];
							//вызов обхода от вершины predecessor, смежной с вершиной graphElement
							dfsCycle(predecessor);
							if (hasCycle) {
								return;
							}
						}
					}
				}

				//помечаем вершину как черную
				color[graphElementId] = 2;
			}

			for (var v = 0; v < graph.length; v++) {
				dfsCycle(graph[v].ID);
			}

			return hasCycle;
		},
		/**
        * Получение кэшированого объекта в браузере
        * @param {string} name Ключ объекта кэширования
        * @param {Number} experation Время жизни кэшированного объекта в минутах
        * @param {function} callback Колбэк, который будет вызван если объекта в кэше нет или он уже испортился. Функция может вернуть как объект, так и Promise
        * @returns {Promise} Промис, в onfullfilled будет передан кэшированный объект. Если объект получен из кэша или колбэка не будет - failed
        */
		getCachedData: function (name, experation, callback) {
			var data;
			if (window.localStorage) {
				var lsItem = JSON.parse(window.localStorage.getItem(name), JSON.dateParser);
				if (lsItem !== null && lsItem.expDate > new Date().getTime()) {
					data = lsItem.Data;
				} else {
					window.localStorage.removeItem(name);
				}
			}

			if ((data === null || data === undefined) && typeof callback === 'function') {
				var expDate = new Date().getTime() + experation * 60000;
				var cRes = callback.call();
				if (cRes !== null && cRes !== undefined) {
					if (cRes.then) {
						return new Promise(function (resolve, reject) {
							cRes.catch(reject);
							cRes.then(function (data) {
								window.localStorage.setItem(name, JSON.stringify({
									expDate: expDate,
									Data: data
								}));
								resolve(data);
							});
						}
						);
					} else {
						window.localStorage.setItem(name, JSON.stringify({
							expDate: expDate,
							Data: cRes
						}));
						return Promise.resolve(data);
					}
				}
			}

			return Promise[data === undefined ? 'reject' : 'resolve'](data);
		},
		/**
        * Получение sessionid для текущей страницы. Обновление страницы будет вести к геренации новогой сессии
        * @returns {String} guid сессии текущей страницы
        */
		getSessionId: function () {
			window.memoryStorage = window.memoryStorage || {};
			var sid = window.memoryStorage['f-sessionid'];
			if (sid === null || sid === undefined) {
				sid = guid();
				window.memoryStorage['f-sessionid'] = sid;
			}
			return sid;
		},
		/**
	 	* получение разобранной строки get-запроса
	 	* */
		splitGETString: function () {
			var tmp;
			var tmp2;
			var param = {};

			var get = location.search; // строка GET запроса
			if (get !== '') {
				tmp = get.substr(1).split('&'); // разделяем переменные
				for (var i = 0; i < tmp.length; i++) {
					tmp2 = tmp[i].split('='); // массив param будет содержать
					param[tmp2[0]] = tmp2[1]; // пары ключ(имя переменной)->значение
				}
			}
			return param;
		},
		countWordForm: function (number, oneForm, fourForm, fiveForm) {
			var result;
			number = number % 100;
		
			if (number >= 11 && number <= 19)
				result = fiveForm;
			else {
				number = number % 10;
				if (number == 1)
					result = oneForm;
				else if (number == 2 || number == 3 || number == 4)
					result = fourForm;
				else
					result = fiveForm;
			}
		
			return result;
		},
		initHandsonTablesOnForm: (function () {

			/**
			 * Инициализация handsontable.table по клику на элемент
			 * @param {AsystForm} form - форма
			 */
			function _initOnClicking(form, handsonTableOptions) {
				handsonTableOptions
					.filter(function (handsonTableOption) {
						return handsonTableOption.initOnClickingSelector && typeof handsonTableOption.initOnClickingSelector === 'string';
					})
					.forEach(function (handsonTableOption) {
						_initHandsonTableOnClicking(form, handsonTableOption);
					});
			}

			/**
			 * Инициализация handsontable.table немедленно, если хэш открытого таба совпадает с указанным
			 * @param {AsystForm} form - форма
			 */
			function _initImmediatelyIfHasSameHash(form, handsonTableOptions) {
				var activeTabHash = form.getActiveTab().prop('hash');

				handsonTableOptions
					.filter(function (handsonTableOption) {
						return handsonTableOption.initImmediatelyIfHasSameHash && typeof handsonTableOption.hash === 'string';
					})
					.forEach(function (handsonTableOption) {
						if (activeTabHash === handsonTableOption.hash) {
							_initHandsonTable(form, handsonTableOption);
						}
					});
			}

			function _initHandsonTableOnClicking(form, handsonTableOption) {
				if (handsonTableOption.doRefreshOnClickingSelector) {
					form.$(handsonTableOption.initOnClickingSelector).on('click', function () {
						if (handsonTableOption._isInited) {
							handsonTableOption.handsonTable.resetForm();
						} else {
							_initHandsonTable(form, handsonTableOption);
						}
					});
				} else {
					form.$(handsonTableOption.initOnClickingSelector).one('click', function () {
						_initHandsonTable(form, handsonTableOption);
					});
				}
			}

			function _initHandsonTable(form, handsonTableOption) {
				if (handsonTableOption.ruleName) {
					$.when(_checkRule(form, handsonTableOption))
						.then(function (result) {
							if (result) {
								handsonTableOption.init(form);
								handsonTableOption._isInited = true;

								if (handsonTableOption.errorBoxSelector) {
									form.$(handsonTableOption.errorBoxSelector).hide();
								}

								if (handsonTableOption.disabledElementsSelectorWhenError) {
									form.$(handsonTableOption.disabledElementsSelectorWhenError).removeAttr('disabled');
								}
							} else {
								if (handsonTableOption.errorBoxSelector) {
									form.$(handsonTableOption.errorBoxSelector).show();
								}

								if (handsonTableOption.disabledElementsSelectorWhenError) {
									form.$(handsonTableOption.disabledElementsSelectorWhenError).attr('disabled', 'disabled');
								}

							}

						}, function (error) { console.error(error); });
				} else {
					handsonTableOption.init(form);
				}
			}

			/**
			 * Проверка правила
			 * @param {AsystForm} form - форма 
			 * @param {Object} handsonTableObject - объект с данными о handsontable  
			 */
			function _checkRule(form, handsonTableOption) {
				var deferred = $.Deferred();

				Asyst.API.Rule.check({
					ruleName: handsonTableOption.ruleName,
					data: { ActivityId: form.Data.ActivityId },
					success: deferred.resolve,
					error: deferred.reject,
					async: true
				});

				return deferred.promise();
			}

			/**
			 * Переинициализация handson'ов с правилами при следующем их показе
			 */
			function _reInitRuleHandsonTablesOnNextShow(handsonTableOptions) {
				handsonTableOptions
					.filter(function (handsonTableOption) {
						return handsonTableOption.ruleName;
					})
					.forEach(function (handsonTableOption) {
						handsonTableOption._isInited = false;
					});
			}

			function _getHandsonTableOptionsArray(handsonTableOptions) {
				var names = Object.keys(handsonTableOptions);

				return names
					.map(function (name) {
						return handsonTableOptions[name];
					});
			}

			return function (form, handsonTableOptions) {
				var opts = _getHandsonTableOptionsArray(handsonTableOptions);

				form
					.onInited(function () {
						_initOnClicking(form, opts);
					})
					.onAfterOpen(function () {
						// Переинициализация для повторной проверки правила после Reset
						_reInitRuleHandsonTablesOnNextShow(opts);
						_initImmediatelyIfHasSameHash(form, opts);
					});
			};
		}()),
		initGanttOnForm: (function () {

			function _init(form, options) {
				if (!form.Access[options.accessName] || !form.Access[options.accessName].IsVisible) {
					return;
				}

				form.$(options.containerSelector).html("<iframe id='ganttframe' class='iframe-auto-height' name='ganttframe' width='100%' height='750px'></iframe>");
				var $ganttframe = form.$('#ganttframe');

				var href = '/Gantt.html?ActivityId=' + form.Data.ActivityId + '&IsReadOnly=' + form.Access[options.accessName].IsReadonly;
				$ganttframe.attr('src', href);

				$ganttframe.bind('ganttframe.resize', function () {
					var frameHeight = $(document).height() - $ganttframe.offset().top - 20;
					$ganttframe.height(frameHeight);
				});

				$(window).resize(Asyst.Utils.throttle(function () {
					$ganttframe.trigger('ganttframe.resize');
				}, 300));
			}

			function _initOnClicking(form, options) {
				form.$(options.initOnClickingSelector).on('click', function () {
					if (options._isInited) {
						_refresh(form, options);
					} else {
						_init(form, options);
						options._isInited = true;
					}

					var $ganttframe = form.$('#ganttframe');
					$ganttframe.trigger('ganttframe.resize');
					$ganttframe.css('overflow', 'auto');
				});
			}

			function _refresh(form, options) {
				if (!options._isInited) {
					return;
				}

				var $ganttframe = form.$('#ganttframe');
				var iframeWindow = $ganttframe.prop('contentWindow');
				iframeWindow && iframeWindow.Gantt && iframeWindow.Gantt.reload(true);
			}

			return function (form, options) {
				form
					.onInited(function () {
						_initOnClicking(form, options);
					})
					.onAfterOpen(function () {
						_refresh(form, options);
					});
			};
		}())
	};
})();

/**
 * Перенесено из application.js
 * */

function setParameter (href, name, value) {
	var url = href;
	var newAdditionalURL = '';
	var tempArray = url.split('?');
	var baseURL = tempArray[0];
	var aditionalURL = tempArray[1];
	var temp = '';
	if (aditionalURL) {
		tempArray = aditionalURL.split('&');
		for (var i in tempArray) {
			if (tempArray[i].indexOf(name) !== 0) {
				newAdditionalURL += temp + tempArray[i];
				temp = '&';
			}
		}
	}
	return baseURL + '?' + newAdditionalURL + temp + name + '=' + encodeURIComponent(value);
}

function getParameterByName (name) {
	name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
	var regexS = '[\\?&]' + name + '=([^&#]*)';
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.search);
	if (results == null)
		return '';
	else
		return decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function equals (a, b) {
	var v1 = a;
	var v2 = b;

	if (v1 === null || v1 === undefined || jQuery.isArray(v1) && v1.length === 0)
		v1 = '';
	else if (jQuery.isArray(v1) && v1.length === 1)
		v1 = v1[0];

	if (v2 === null || v2 === undefined || jQuery.isArray(v2) && v2.length === 0)
		v2 = '';
	else if (jQuery.isArray(v2) && v2.length === 1)
		v2 = v2[0];

	if (v1 == v2)
		return true;
	else if (jQuery.isArray(v1) && jQuery.isArray(v2)) {
		return arrayEquals(v1, v2);
	} else
		return false;
}

function arrayEquals (a, b) {
	a.sort();
	b.sort();

	if (a === b) {
		return true;
	}
	if (a == null || b == null || a.length != b.length) {
		return false;
	}

	for (var i = 0; i < a.length; ++i) {
		if (a[i] != b[i]) {
			return false;
		}
	}
	return true;
}

function guid () {
	function s4 () {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	return String(s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}

//http://stackoverflow.com/questions/18638900/javascript-crc32
function crc32 (str) {
	var makeCRCTable = function () {
		var c;
		var crcTable = [];
		for (var n = 0; n < 256; n++) {
			c = n;
			for (var k = 0; k < 8; k++) {
				c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
			}
			crcTable[n] = c;
		}
		return crcTable;
	};
	var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
	var crc = 0 ^ -1;

	for (var i = 0; i < str.length; i++) {
		crc = crc >>> 8 ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
	}
	return (crc ^ -1) >>> 0;
}





function getPageCookie (name) {
	return getCookie(window.location.pathname + name);
}

function getCookie (name) {
	var cookie = ' ' + document.cookie;
	var search = ' ' + name + '=';
	var setStr = null;
	var offset = 0;
	var end = 0;
	if (cookie.length > 0) {
		offset = cookie.indexOf(search);
		if (offset != -1) {
			offset += search.length;
			end = cookie.indexOf(';', offset);
			if (end == -1) {
				end = cookie.length;
			}
			setStr = unescape(cookie.substring(offset, end));
		}
	}
	return setStr;
}

function setPageCookie (name, value, expires) {
	setCookie(window.location.pathname + name, value, expires);
}

function setCookie (name, value, expires, path, domain, secure) {
	document.cookie = name + '=' + escape(value) +
		(expires ? '; expires=' + expires : '') +
		(path ? '; path=' + path : '') +
		(domain ? '; domain=' + domain : '') +
		(secure ? '; secure' : '');
}

function removeCookie (name) {
	setCookie(name, '', -1);
}

/**
 * Удаляет из даты компонету времени (обнуляет часы, минуты, секунды, милисекунды)
 * @returns {Date} Новая дата без времени
 */
Date.prototype.trimTime = function () {
	var date = new Date(this);
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);
	return date;
};

if (window.JSON && !window.JSON.dateParser) {
	

	JSON.dateParser = function (key, value) {
		'use strict';
		if (typeof value === 'string') {
			var a = JSON.dateParser.reISO.exec(value);
			if (a)
				return new Date(value);
			a = JSON.dateParser.reMsAjax.exec(value);
			if (a) {
				var b = a[1].split(/[-+,.]/);
				return new Date(b[0] ? Number(b[0]) : 0 - Number(b[1]));
			}
		}
		return value;
	};

	JSON.dateParser.reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
	JSON.dateParser.reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;

}

$.fn.closestChild = function (selector) {
	'use strict';
	var $found = $();
	var $currentSet = this;
	while ($currentSet.length) {
		$found = $currentSet.filter(selector);
		if ($found.length) break;
		$currentSet = $currentSet.children();
	}
	return $found.first();
};
$.fn.closestChildren = function (selector) {
	'use strict';
	var $found = $();
	var $currentSet = this;
	while ($currentSet.length) {
		$found = $currentSet.filter(selector);
		if ($found.length) break;
		$currentSet = $currentSet.children();
	}
	return $found;
};