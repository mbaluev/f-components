/* eslint-disable max-lines-per-function */
var Asyst;

if (!Asyst) {
	Asyst = {
		Workspace: {
			FormFunctions: {},
			Handsontable: {},
			Utils: {}
		}
	};
}

(function () {
	'use strict';

	if (!Asyst.protocol) {
		Asyst.protocol = {};
	}

	if (!Asyst.zimbar) {
		Asyst.zimbar = {};
		Asyst.zimbar.isAsyst = false;
		Asyst.zimbar.isAsystPage = false;
		Asyst.zimbar.isAsystForm = false;
		Asyst.zimbar.isAsystAdminka = false;
		Asyst.zimbar.isAsystView = false;
		Asyst.zimbar.isAsystReport = false;
		Asyst.zimbar.isSharePoint = false;
		Asyst.zimbar.init = function (callback) {
			var callback_result;
			if (callback) {
				callback_result = callback();
			}
			if (!callback_result) {
				Asyst.zimbar.initFlags();
				if (Asyst.protocol.zimbar.hasZimbar) {
					Asyst.zimbar.createTopPanel();
				} else {
					Asyst.protocol.zimbar.clearZimbar();
				}

				Asyst.API.AdminTools.getZimbarList(true, function (list) {
					if (list && list.constructor === Array && list.length > 0) {
						Asyst.zimbar.createMenuItems(list);
					}
				});
			}
		};
		Asyst.zimbar.initFlags = function () {
			if (Asyst.Workspace) {
				if (Asyst.Workspace.currentForm || Asyst.Workspace.currentPage || !isEmpty(Asyst.Workspace.views))
					Asyst.zimbar.isAsyst = true;
				if (Asyst.Workspace.currentPage)
					Asyst.zimbar.isAsystPage = true;
				if (Asyst.Workspace.currentForm)
					Asyst.zimbar.isAsystForm = true;
			}
			if ($('head meta[name=\'GENERATOR\']').attr('content') === 'Asyst.Adminka')
				Asyst.zimbar.isAsystAdminka = true;
			if ($('head meta[name=\'GENERATOR\']').attr('content') === 'Asyst.View')
				Asyst.zimbar.isAsystView = true;
			if ($('head meta[name=\'GENERATOR\']').attr('content') === 'Asyst.Report')
				Asyst.zimbar.isAsystReport = true;
			if ($('head meta[name=\'GENERATOR\']').attr('content') === 'Microsoft SharePoint')
				Asyst.zimbar.isSharePoint = true;
			if ($('head meta[name=\'GENERATOR\']').attr('content') === 'Monostyle')
				Asyst.zimbar.isAsystMonostyle = true;

			function isEmpty (obj) {
				// null and undefined are "empty"
				if (obj === null) return true;
				if (obj === undefined) return true;

				// Assume if it has a length property with a non-zero value
				// that that property is correct.
				if (obj.length > 0) return false;
				if (obj.length === 0) return true;

				// If it isn't an object at this point
				// it is empty, but it can't be anything *but* empty
				// Is it empty?  Depends on your application.
				if (typeof obj !== 'object') return true;

				// Otherwise, does it have any properties of its own?
				// Note that this doesn't handle
				// toString and valueOf enumeration bugs in IE < 9
				for (var key in obj) {
					if (hasOwnProperty.call(obj, key)) return false;
				}
				return true;
			}
		};
		Asyst.zimbar.createMenuItems = function (ar) {
			var appendHtml = '';
			if (ar && ar.length > 0) {
				if (Asyst.zimbar.isAsystMonostyle) {
					appendHtml += '<li class="f-menu__item f-menu__item_separate"></li>';
					for (var i = 0; i < ar.length; i++) {
						appendHtml +=
							'<li class="f-menu__item">\n' +
							'<a href="#" class="f-menu__link" onclick="Asyst.protocol.zimbar.setZimbar(\'' + ar[i].Account.replace('\\', '\\\\') + '\'); location.reload();">\n' +
							'<span class="f-menu__text">Замещать ' + ar[i].FullName + '</span>\n' +
							'</a>\n' +
							'</li>';
					}
					$('#f_popup_account .f-menu__list').append(appendHtml);
				} else if (Asyst.zimbar.isAsystPage) {
					appendHtml = '<li><br/></li>';
					for (var i = 0; i < ar.length; i++) {
						appendHtml += '<li> <a href="#" onclick="Asyst.protocol.zimbar.setZimbar(\'' + ar[i].Account.replace('\\', '\\\\') + '\'); location.reload();">Замещать ' + ar[i].FullName + '</a></li>';
					}
					$('header ul.extended.logout').append($(appendHtml));
				} else if (Asyst.zimbar.isSharePoint) {
					for (var i = 0; i < ar.length; i++) {
						var $ie_menuitem = $('<ie:menuitem id="zimbar' + i + '" type="option" ' +
							'onmenuclick="javascript:Asyst.protocol.zimbar.setZimbar(\'' + ar[i].Account.replace('\\', '\\\\') + '\'); location.reload();" ' +
							'onmenuclick_original="javascript:Asyst.protocol.zimbar.setZimbar(\'' + ar[i].Account.replace('\\', '\\\\') + '\'); location.reload();" ' +
							'text="Замещать ' + ar[i].FullName + '" ' +
							'text_original="Замещать ' + ar[i].FullName + '" ' +
							'description="Замещать ' + ar[i].FullName + '" ' +
							'description_original="Замещать ' + ar[i].FullName + '" ' +
							'menugroupid="300" ' +
							'enabled="true" ' +
							'checked="false" ' +
							'valorig=""></ie:menuitem>');
						$('#welcomeMenuBox menu').append($ie_menuitem);
					}
				}
			}
		};
		Asyst.zimbar.createTopPanel = function (ar) {
			var curZimbar = Asyst.protocol.zimbar.getZimbar();
			if (curZimbar) {
				var $zimbar_user_title = Asyst.zimbar.appendTopPanelHtml();
				$zimbar_user_title.text(Asyst.Workspace.currentUser.FullName);
			}
		};
		Asyst.zimbar.appendTopPanelHtml = function () {
			var $zimbar =
				$('<div id="zimbargation" class="info">' +
					'	<div class="z-btn z-close" id="clearZimbar" onclick="Asyst.protocol.zimbar.clearZimbar(); location.reload();" title="Прекратить замещение"></div>' +
					'	<div class="z-btn z-text pull-right z-border" id="zimbarusertitle">Пользователь</div>' +
					'	<div class="z-btn z-text pull-right z-transparent">Вы работаете в системе как</div>' +
					'</div>');
			$('body').addClass('zimbargate');
			if (Asyst.zimbar.isAsystMonostyle) {
				$('body').addClass('static');
				$('body').find('.f-application').prepend($zimbar);
			} else if (Asyst.zimbar.isAsystPage || Asyst.zimbar.isAsystForm) {
				$('body').addClass('fixed');
				$('body').prepend($zimbar);
			} else if (Asyst.zimbar.isAsystAdminka || Asyst.zimbar.isAsystView) {
				$('body').addClass('static');
				$('body').prepend($zimbar);
			} else if (Asyst.zimbar.isAsystReport) {
				$('body').addClass('fixed');
				$('.main-container').prepend($zimbar);
			} else if (Asyst.zimbar.isSharePoint) {
				$('body').addClass('static');
				$('body').addClass('sharepoint');
				$('#ms-designer-ribbon').before($zimbar);
			} else {
				$('body').addClass('static');
				$('body').prepend($zimbar);
			}
			$zimbar.find('#clearZimbar').on('click', function () {
				Asyst.protocol.zimbar.clearZimbar();
				location.reload();
			});
			if ($().fTooltip) {
				$zimbar.find('#clearZimbar').attr('data-tooltip', $zimbar.find('#clearZimbar').attr('title'));
			} else if ($().tooltip) {
				$zimbar.find('#clearZimbar').tooltip({container: 'body', placement: 'bottom'});
			}
			return $zimbar.find('#zimbarusertitle');
		};
		$(function () {
			Asyst.zimbar.init();
		});
	}

	if (!Asyst.protocol.zimbar) {
		Asyst.protocol.zimbar = {};
		Asyst.protocol.zimbar.NAME = 'Asyst.zimbar';
		Asyst.protocol.zimbar.hasZimbar = function () {
			var zimbar = Asyst.Utils.getCookie(Asyst.protocol.zimbar.NAME);
			return (zimbar !== null);
		};
		Asyst.protocol.zimbar.getZimbar = function () {
			var zimbar = getCookie(Asyst.protocol.zimbar.NAME);
			return zimbar;
		};
		Asyst.protocol.zimbar.setZimbar = function (substitution) {
			Asyst.Utils.setCookie(Asyst.protocol.zimbar.NAME, substitution, {path: '/'});
		};
		Asyst.protocol.zimbar.clearZimbar = function () {
			Asyst.Utils.setCookie(Asyst.protocol.zimbar.NAME, '', {path: '/', expires: -1});
		};
	}

	Asyst.protocol.toFormData = Asyst.protocol.toFormData ||
		function (data) {
			var formData = new FormData();
			for (var key in data) {
				formData.append(key, data[key]);
			}
			return formData;
		};

	if (typeof Asyst.protocol.format !== 'function') {

		Asyst.protocol.format = function (obj) {
			var prop, value;
			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {

					value = obj[prop];

					if (value) {
						if (typeof (value) === 'string') {
							var reg = value.match(/\/Date\((-?\d+)(?:([\-+])(\d+))?\)\//);
							if (reg !== null && reg.constructor === Array && reg.length > 0) {
								//reg[0] = /Date(955238400000+0700)/   reg[1] = 955238400000   reg[2] = 0700
								value = new Date(Number(reg[1]));
							}
						} else if (typeof (value) === 'object') {
							Asyst.protocol.format(value);
						} else if (value.constructor === Array) {
							Asyst.protocol.format(value);
						}
						obj[prop] = value;
					}
				}
			}
			return obj;
		};
	}

	//If Data is a "__packet__" - don't thin IT
	Asyst.protocol.thinDataIfNotPacket = Asyst.protocol.thinDataIfNotPacket
		|| function (data, isAggressive) {
			if (data === null || data === undefined) return data;
			if (data['__packet__'])
				return {
					'__packet__': data['__packet__'].map(function (item) {
						return {id: item.id, '_dataset_': item._dataset_, data: Asyst.protocol.thiningData(item.data, isAggressive)};
					})
				};

			return Asyst.protocol.thiningData(data, isAggressive);
		};

	if (typeof Asyst.protocol.thiningData !== 'function') {

		//упрощение объекта.
		//если aggressive = true, остаются только простые типы - числа, строки, даты, булевские.
		//если aggressive = false, остаются простые типы и массивы из простых типов.
		Asyst.protocol.thiningData = function (data, aggressive) {

			function isSimple (obj) {
				return obj === undefined || obj === null || obj.constructor === String || obj.constructor === Date || obj.constructor === Number || obj.constructor === Boolean;
			}

			if (data === null || data === undefined)
				return data;

			if (isSimple(data))
				return data;

			var result;
			if (data.constuctor === Array) {
				result = [];
				for (var i = 0, len = data.length; i < len; i++) {
					if (isSimple(data[i])) result.push(data[i]);
				}
				return result;
			} else if (true) {
				result = {};
				for (var c in data) {
					if (data.hasOwnProperty(c)) {
						if (isSimple(data[c])) {
							result[c] = data[c];
						} else if (!aggressive) {
							if (data[c].constructor === Array) {
								var subresult = [];
								var arr = data[c];
								for (var i = 0, len = arr.length; i < len; i++) {
									if (isSimple(arr[i])) subresult.push(arr[i]);
								}
								//if (subresult.length > 0) //опционально - вырезает пустые массивы - может быть слишком агрресиве )
								result[c] = subresult;
							}
						}
					}

				}
				return result;
			}
		};
	}

	if (typeof Asyst.protocol.ProcessError !== 'function') {
		Asyst.protocol.ProcessError = function (error) {
			var text = error.responseText || error.toString();
			var json = error.responseJSON;
			if (json && json.message)
				text = json.message;

			if (json && json._type_ === 'warning') {
				NotifyWarning(Globa.ErrorOnCheckSave, text);
			} else {
				ErrorHandler(Globa.SavingError, text);
				console.error(error);
			}
		};
	}

	if (typeof Asyst.protocol.send !== 'function') {

		Asyst.protocol.send = function (url, type, data, asyncreq, callback, error, context, headers) {
			var result;
			if (asyncreq !== false) asyncreq = true;

			headers = $.extend({'Content-Type': 'application/json; charset=utf-8'}, headers);
			$.extend(data, {'__sessionId__': Asyst.Utils.getSessionId()});
			var params = {
				url: url,
				type: type,
				async: asyncreq,
				cache: false,
				data: JSON.stringify(data),
				dataType: 'json',
				processData: false,
				headers: headers,
				success: function (response, statusText, jqXHR) {
					if (response !== null && response !== undefined) {
						result = Asyst.protocol.format(response);

						if (result && result._type_) { //так приходят ошибки и предупреждения - в общем запрос не обработался

							if (error)
								error(result.message, result.info, url, result._type_);
							else if (!asyncreq)
								throw {
									error: result.message,
									info: result.info,
									type: result._type_,
									url: url,
									toString: function () {
										return result.message;
									}
								};
							else {
								Loader.hide();
							}
							return;
						}

					}
					if (callback)
						callback(result);

					if (jqXHR.getResponseHeader('asyst-license-expire')) {
						Asyst.protocol.LicenseCenter.ShowExpireLicenseMessage(
							jqXHR.getResponseHeader('asyst-license-expire'));
					}


				},
				error: function (jqXHR, textStatus, errorThrown) {
					if (Asyst.GlobalPageStateStopped) {
						//пробуем скипать ошибки после выгрузки страницы
						return;
					}

					var text = '', title = errorThrown, _type_, json;
					if (jqXHR) {
						text = jqXHR.responseText;
						json = jqXHR.responseJSON;
					}

					if (json && json.message) {
						text = json.message;
						title = json.info;
						_type_ = json._type_;
					}


					if (json && json._type_ === 'warning') {
						Loader.hide();
						NotifyWarning(json.info, json.message);
						return;
					}

					if (error)
						error(title, text, url, _type_);
					else if (!asyncreq)
						throw {
							_type_: _type_,
							error: errorThrown,
							info: text,
							url: url,
							toString: function () {
								return errorThrown;
							}
						};
					else {
						Loader.hide();
						//ErrorHandler(errorThrown, text, url);
					}
				}
			};

			if (!asyncreq) {
				$.ajax(params);
				return result;
			} else {
				return $.ajax(params);
			}
		};
	}

	if (typeof Asyst.protocol.get !== 'function') {
		Asyst.protocol.get = function (url, type, data) {
			return Asyst.protocol.send(url, type, data, false, null, null);
		};
	}

	if (typeof Asyst.protocol.LicenseCenter !== 'object') {
		Asyst.protocol.LicenseCenter = {};
		Asyst.protocol.LicenseCenter.ShowExpireLicenseMessage = function (days) {
			if (!Asyst.protocol.LicenseCenter.isShowed) {
				if ($('.asyst-license-expire-block').length === 0) {
					$('body').append('  <div class="alert alert-warning asyst-license-expire-block">' +
						'<a href="#" class="close" data-dismiss="alert"></a>' +
						'<strong>' + Globa.ASPXLicenseExpired.locale().replace('{0}', days) + '</strong>' +
						'</div>');
					Asyst.protocol.LicenseCenter.isShowed = true;
				}
			}
		};
	}

	/* отсечка по ошибкам загрузки на выгрузке страницы */
	var prevOnunload = window.onunload;
	window.onunload = function (evt) {
		//console.log('onunload');
		Asyst.GlobalPageStateStopped = true;
		if (prevOnunload)
			return prevOnunload(evt);
		return;
	};

	$(document).on('keydown', function (evt) {
		if (evt.keyCode === 27) {
			//console.log('esc pressed');
			Asyst.GlobalPageStateStopped = true;
		}
		return;
	});

	//----------------------------------------------------------------------------
	//  API к серверным handler'ам
	//----------------------------------------------------------------------------

	{//region Asyst.API

		Asyst.API ? null : Asyst.API = {};


		Asyst.API.Entity ? null : Asyst.API.Entity = {};

		if (!Asyst.API.Entity.load) {
			Asyst.API.Entity.load = function (params) {
				var dataId = params.dataId;
				if (!params.dataId) {
					params.dataId = 'new';
				}

				var success = function (data, context) {
					data.id = dataId;

					if (params.success)
						params.success(data, context);
				};

				var httpRequestMethod = $.isEmptyObject(params.defaults) ? 'GET' : 'PUT';
				var data = $.extend({}, {defaultFields: params.defaults, isAccessNeed: false}, {isAccessNeed: params.isAccessNeed});
				var error = params.error;
				return Asyst.protocol.send('/entity/' + params.entityName + '/' + params.dataId, httpRequestMethod, data, params.async, success, error, null, params.headers);
			};
		}
		if (!Asyst.API.Entity.save) {
			Asyst.API.Entity.save = function (params) {
				var thinnedData = Asyst.protocol.thinDataIfNotPacket(params.data);
				if (!params.dataId) {
					params.dataId = 'new';
				}
				return Asyst.protocol.send('/entity/' + params.entityName + '/' + params.dataId, 'POST', thinnedData, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Entity.delete) {
			Asyst.API.Entity.delete = function (params) {
				return Asyst.protocol.send('/entity/' + params.entityName + '/' + params.dataId, 'DELETE', null, params.async, params.success, params.error, null, params.headers);
			};
		}

		Asyst.API.Entity.Batch = function (entityName) {
			this.EntityName = entityName || 'batch';
			this.DataPacket = {'__packet__': []};
		};

		/**
		 * Добавляет объект для сохранения и возращает номер в массиве
		 * @param {any} id Ключ
		 * @param {any} data Объект для сохранения
		 * @returns {Number} Номер объекта в массиве
		 */
		Asyst.API.Entity.Batch.prototype.add = function (id, data) {
			var key = id;
			if (!key)
				key = 'new';
			this.DataPacket.__packet__.push({'id': key, 'data': data});
			return this.DataPacket.__packet__.length - 1;
		};

		/**
		 * Добавляет объект для удаления и возращает номер в массиве
		 * @param {any} id Ключ
		 * @param {any} data Объект с названием сущности { classname: 'someEntityName' }
		 * @returns {Number} Номер объекта в массиве
		 */
		Asyst.API.Entity.Batch.prototype.delete = function (id, data) {
			var key = id;
			data = $.extend({}, data, {'_removed_': true});
			this.DataPacket.__packet__.push({'id': key, '_removed_': true, 'data': data});
			return this.DataPacket.__packet__.length - 1;
		};

		/**
		 * Вызывает датасет
		 * @param {any} name Название датасета
		 * @param {any} data Объект с названием сущности { classname: 'someEntityName' }
		 * @returns {Number} Номер объекта в массиве
		 */
		Asyst.API.Entity.Batch.prototype.dataset = function (name, data) {
			this.DataPacket.__packet__.push({'_dataset_': name, 'data': data});
			return this.DataPacket.__packet__.length - 1;
		};

		Object.defineProperty(Asyst.API.Entity.Batch.prototype, 'length', {
			get: function () {
				return this.DataPacket.__packet__.length;
			}
		});

		/**
		 * Возвращает ссылку для адресации к переданному объекту
		 * @param {any} item Объект, к которму нужно найти адрес
		 * @returns {string} ссылка в заданном формате ref# с номером указанного объекта
		 */
		Asyst.API.Entity.Batch.prototype.getRefId = function (item) {
			return 'ref#' + this.DataPacket.__packet__.indexOf(item);
		};

		Asyst.API.Entity.Batch.prototype.save = function (success, error, async) {
			var packet = this.DataPacket.__packet__;
			var callback = function (ids) {
				if (typeof success !== 'function') return;
				packet = packet.map(function (item, i) {
					return $.extend(item.data, ids[i]);
				});
				success(packet);
			};
			var id = packet.length === 1 ? packet[0]['id'] : 'batch';
			return Asyst.API.Entity.save({entityName: this.EntityName, dataId: id, data: this.DataPacket, success: callback, error: error, async: async});
		};


		Asyst.API.Rule ? null : Asyst.API.Rule = {};

		if (!Asyst.API.Rule.check) {
			Asyst.API.Rule.check = function (params) {
				var thinnedData = Asyst.protocol.thinDataIfNotPacket(params.data);
				params = $.extend({
					async: true,
					ruleType: 'FormsRules'
				}, params);
				return Asyst.protocol.send('/rule/' + params.ruleType + '/' + params.ruleName, 'POST', thinnedData, params.async, params.success, params.error, null, params.headers);
			};
		}

		Asyst.API.Hashtag ? null : Asyst.API.Hashtag = {};

		if (!Asyst.API.Hashtag.getTagsInfo) {
			Asyst.API.Hashtag.getTagsInfo = function (params) {
				return Asyst.protocol.send('/api/hashtag/getTagsInfo/', 'POST', {}, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Hashtag.add) {
			Asyst.API.Hashtag.add = function (params) {
				return Asyst.protocol.send('/api/hashtag/', 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}


		Asyst.API.View ? null : Asyst.API.View = {};

		if (!Asyst.API.View.load) {
			Asyst.API.View.load = function (params) {
				var thinnedData = Asyst.protocol.thinDataIfNotPacket(params.data);
				return Asyst.protocol.send('/view/' + params.viewName, 'POST', thinnedData, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.View.getAvailable) {
			Asyst.API.View.getAvailable = function (params) {
				return Asyst.protocol.send('/view/list/' + params.viewName, 'POST', null, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.View.list) {
			Asyst.API.View.list = function (params) {
				return Asyst.protocol.send('/view/list/', 'POST', params, params.async, params.success, params.error, null, params.headers);
			};
		}

		Asyst.API.ViewSample ? null : Asyst.API.ViewSample = {};

		if (!Asyst.API.ViewSample.save) {
			Asyst.API.ViewSample.save = function (params) {
				return Asyst.protocol.send('/api/viewSample/' + params.viewName, 'PUT', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.ViewSample.update) {
			Asyst.API.ViewSample.update = function (params) {
				return Asyst.protocol.send('/api/viewSample/' + params.viewName, 'PATCH', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.ViewSample.load) {
			Asyst.API.ViewSample.load = function (params) {
				return Asyst.protocol.send('/api/viewSample/' + params.viewName, 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.ViewSample.loadAll) {
			Asyst.API.ViewSample.loadAll = function (params) {
				return Asyst.protocol.send('/api/viewSample/' + params.viewName + '/list', 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.ViewSample.delete) {
			Asyst.API.ViewSample.delete = function (params) {
				return Asyst.protocol.send('/api/viewSample/' + params.viewName, 'DELETE', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		Asyst.API.DataSource ? null : Asyst.API.DataSource = {};

		if (!Asyst.API.DataSource.load) {
			Asyst.API.DataSource.load = function (params) {
				params = $.extend({async: true, isPicklist: false}, params);
				params.headers = $.extend({isPicklist: params.isPicklist}, params.headers);
				var thinnedData = Asyst.protocol.thinDataIfNotPacket(params.data);
				return Asyst.protocol.send('/datasource/' + params.sourceType + '/' + params.sourceName + '/' + params.elementName, 'POST', thinnedData, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.DataSource.allViews) {
			Asyst.API.DataSource.allViews = function (params) {
				if (params.data === undefined)
					params.data = {};
				params.data.all = true;
				return Asyst.protocol.send('/api/view/list', 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.DataSource.visibleViews) {
			Asyst.API.DataSource.visibleViews = function (params) {
				return Asyst.protocol.send('/api/view/list', 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.DataSource.visibleViewsForSelect) {
			Asyst.API.DataSource.visibleViewsForSelect = function (cb, error) {
				var success = function (data) {
					if (typeof cb === 'function') {
						if (data)
							cb(data.map(function (item) {
								return {Key: item.Name, Value: item.Title};
							}));
						else
							cb(null);
					}
				};
				return Asyst.API.DataSource.visibleViews({success: success, error: error});
			};
		}


		Asyst.API.Comments ? null : Asyst.API.Comments = {};

		if (!Asyst.API.Comments.load) {
			Asyst.API.Comments.load = function (params) {
				return Asyst.protocol.send('/api/comments/' + params.entityName + '/' + params.dataId, 'GET', {}, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Comments.save) {
			Asyst.API.Comments.save = function (params) {
				return Asyst.protocol.send('/api/comments/' + params.entityName + '/' + params.dataId, 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Comments.delete) {
			Asyst.API.Comments.delete = function (params) {
				return Asyst.protocol.send('/api/comments/' + params.entityName + '/' + params.dataId, 'DELETE', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}
		if (!Asyst.API.Comments.getCount) {
			Asyst.API.Comments.getCount = function (params) {
				var data = {commentId: params.commentId};
				return Asyst.protocol.send('/api/comments/' + params.entityName + '/' + params.dataId + '/count', 'POST', data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Comments.updateRead) {
			Asyst.API.Comments.updateRead = function (params) {
				return Asyst.protocol.send('/api/comments/' + params.entityName + '/' + params.dataId + '/updateread', 'POST', {}, params.async, params.success, params.error, null, params.headers);
			};
		}
		if (!Asyst.ChangeRequest) {
			Asyst.ChangeRequest = {Storage: {}};
		}

		Asyst.API.ChangeRequest ? null : Asyst.API.ChangeRequest = {};

		if (!Asyst.API.ChangeRequest.save) {
			Asyst.API.ChangeRequest.save = function (params) {
				params.data = $.extend({EntityName: params.entityName, DataId: params.dataId}, params.data);
				return Asyst.protocol.send('/api/changerequest/create', 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.ChangeRequest.agree) {
			Asyst.API.ChangeRequest.agree = function (params) {
				var data = {ActionType: 'agree', ChangeRequestId: params.requestId, Comment: params.comment, UserId: params.userId};
				return Asyst.protocol.send('/api/changerequest/agree/' + params.requestId, 'POST', data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.ChangeRequest.decline) {
			Asyst.API.ChangeRequest.decline = function (params) {
				var data = {ActionType: 'decline', ChangeRequestId: params.requestId, Comment: params.comment, UserId: params.userId};
				return Asyst.protocol.send('/api/changerequest/decline/' + params.requestId, 'POST', data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.ChangeRequest.externalReviewStart) {
			Asyst.API.ChangeRequest.externalReviewStart = function (params) {
				var data = {ActionType: 'externalReviewStart', ChangeRequestId: params.requestId};
				return Asyst.protocol.send('/api/changerequest/externalReviewStart/' + params.requestId, 'POST', data, params.async, params.success, params.error, null, params.headers);
			};
		}


		if (!Asyst.API.ChangeRequest.externalReviewAgree) {
			Asyst.API.ChangeRequest.externalReviewAgree = function (params) {
				var data = {ActionType: 'externalReviewAgree', ChangeRequestId: params.requestId, Issues: params.issues};
				return Asyst.protocol.send('/api/changerequest/externalReviewAgree/' + params.requestId, 'POST', data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.ChangeRequest.externalReviewDecline) {
			Asyst.API.ChangeRequest.externalReviewDecline = function (params) {
				var data = {ActionType: 'externalReviewDecline', ChangeRequestId: params.requestId};
				return Asyst.protocol.send('/api/changerequest/externalReviewDecline/' + params.requestId, 'POST', data, params.async, params.success, params.error, null, params.headers);
			};
		}

		Asyst.API.Phase ? null : Asyst.API.Phase = {};


		if (!Asyst.API.Phase.moveNext) {
			Asyst.API.Phase.moveNext = function (params) {
				return Asyst.protocol.send('/phase/next/' + params.entityName + '/' + params.activityId, 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Phase.movePrev) {
			Asyst.API.Phase.movePrev = function (params) {
				return Asyst.protocol.send('/phase/prev/' + params.entityName + '/' + params.activityId, 'POST', null, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Phase.check) {
			Asyst.API.Phase.check = function (params) {
				return Asyst.protocol.send('/phase/check/' + params.entityName + '/' + params.activityId, 'POST', params.data, params.async, params.success, params.error);
			};
		}


		Asyst.API.DataSet ? null : Asyst.API.DataSet = {};

		if (!Asyst.API.DataSet.load) {
			Asyst.API.DataSet.load = function (params) {
				var thinnedData = Asyst.protocol.thinDataIfNotPacket(params.data);
				var success = function (datasets) {
					if (datasets && params.success !== undefined && params.success !== null) {
						var newArgs = [datasets];
						for (var i = 0; i < datasets.length; i++) {
							newArgs.push(datasets[i]);
						}
						params.success.apply(this, newArgs);
					}
				};
				return Asyst.protocol.send('/api/dataset/' + params.name, 'POST', thinnedData, params.async, success, params.error);
			};
		}


		Asyst.API.Document ? null : Asyst.API.Document = {};

		if (!Asyst.API.Document.getFiles) {
			Asyst.API.Document.getFiles = function (params) {
				//POST - чтобы передать нормальной длинный параметр data
				var thinnedData = Asyst.protocol.thiningData(params.data, true);
				return Asyst.protocol.send('/api/file/getFilesInfo/', 'POST', thinnedData, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Document.deleteFile) {
			Asyst.API.Document.deleteFile = function (params) {
				return Asyst.protocol.send('/api/file/delete/', 'POST', params.data, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Document.attachToCard) {
			Asyst.API.Document.attachToCard = function (params) {
				var thinnedData = Asyst.protocol.thiningData(params.data, false);
				return Asyst.protocol.send('/api/file/attachToCard/', 'POST', thinnedData, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Document.getInfo) {
			Asyst.API.Document.getInfo = function (params) {
				var thinnedData = Asyst.protocol.thiningData(params.data, true);
				return Asyst.protocol.send('/api/file/getFileInfo/', 'POST', thinnedData, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Document.saveLink) {
			Asyst.API.Document.saveLink = function (params) {
				var thinnedData = Asyst.protocol.thiningData(params.data, true);
				return Asyst.protocol.send('/api/file/saveLink/', 'POST', thinnedData, params.async, params.success, params.error, null, params.headers);
			};
		}

		if (!Asyst.API.Document.setHashtag) {
			Asyst.API.Document.setHashtag = function (params) {
				return Asyst.protocol.send('/api/file/setHashtag/', 'POST', params.data, params.async, params.success, params.error, null, params.headers);

			};
		}


		Asyst.API.Report ? null : Asyst.API.Report = {};
		if (!Asyst.API.Report.open) {
			Asyst.API.Report.open = function (name, paramNames, paramValues, newWindow) {
				if (newWindow !== false) newWindow = true;
				var my_form = document.createElement('FORM');
				my_form.method = 'POST';
				my_form.action = '/report/view/' + name;
				if (newWindow === true)
					my_form.target = '_blank';
				for (var i = 0; paramNames && paramValues && i < paramNames.length; i++) {
					var input = document.createElement('INPUT');
					input.type = 'TEXT';
					input.name = paramNames[i];
					if (Array.isArray(paramValues[i]))
						input.value = paramValues[i].join(',');
					else
						input.value = paramValues[i];
					my_form.appendChild(input);
				}

				document.body.appendChild(my_form);
				my_form.submit();
				my_form.remove();

			};
		}

		if (!Asyst.API.Search) {
			Asyst.API.Search = {};
		}

		if (typeof Asyst.API.Search.find !== 'function') {
			Asyst.API.Search.find = function (params) {
				return Asyst.protocol.send('/api/search/find/', 'POST', params, params.async, params.success, params.error, null, params.headers);
			};
		}


		// AdminTools
		if (!Asyst.API.AdminTools)
			Asyst.API.AdminTools = {};

		if (typeof Asyst.API.AdminTools.saveStats !== 'function') {
			Asyst.API.AdminTools.saveStats = function (data, async, success, error) {
				if ('sendBeacon' in navigator) {
					$.extend(data, {'__sessionId__': Asyst.Utils.getSessionId()});
					return navigator.sendBeacon('/api/admin/saveStats', Asyst.protocol.toFormData(data));
				} else {
					return Asyst.protocol.send('/api/admin/saveStats', 'POST', data, async, success, error, null);
				}

			};
		}


		if (typeof Asyst.API.AdminTools.getZimbarList !== 'function') {
			Asyst.API.AdminTools.getZimbarList = function (async, callback) {
				return Asyst.protocol.send('/api/account/getZimbarList', 'GET', {}, async, callback, null, this);
			};
		}

		if (typeof Asyst.API.AdminTools.logout !== 'function') {
			Asyst.API.AdminTools.logout = function () {
				var success = function () {
					var redirFunc = function () {
						location.href = '/logout';
					};
					document.execCommand('ClearAuthenticationCache');
					location.href = '/logout';
					$.ajax({
						// This can be any path on your same domain which requires HTTPAuth
						url: '/logout',
						type: 'POST',
						async: false,
						username: 'reset',
						password: 'reset',
						success: redirFunc,
						error: redirFunc,
						// If the return is 401, refresh the page to request new details.
						statusCode: {
							401: redirFunc
						}
					});
				};
				Asyst.protocol.zimbar.clearZimbar();
				$.ajax({
					url: '/logout',
					type: 'POST',
					async: false,
					success: success,
					error: success,
					username: 'reset',
					password: 'reset',
					statusCode: {
						401: success
					}
				});
			};
		}

		if (typeof Asyst.API.AdminTools.getCurrentUser !== 'function') {
			Asyst.API.AdminTools.getCurrentUser = function (async, success, error) {
				return Asyst.protocol.send('/api/account/currentUser', 'GET', null, async || false, success, error, this);
			};
		}

		if (typeof Asyst.API.AdminTools.setNewPassword !== 'function') {
			Asyst.API.AdminTools.setNewPassword = function (userId, password) {
				return Asyst.protocol.send('/api/account/setNewPassword', 'POST', {userId: userId, password: password}, false, null, null, this);
			};
		}


		if (typeof Asyst.API.AdminTools.LogType !== 'object') {
			Asyst.API.AdminTools.LogType = {
				Error: 'Error',
				Information: 'Information',
				Warning: 'Warning',
				Debug: 'Debug',
				Trace: 'Trace'
			};
		}
		if (typeof Asyst.API.AdminTools.appendLog !== 'function') {
			Asyst.API.AdminTools.appendLog = function (options, error) {
				return Asyst.protocol.send('/api/admin/appendLog', 'POST', options, true, null, error, this);
			};
		}

	}
	// ----------------------------------------------------------------------------
	// Даты
	// ----------------------------------------------------------------------------

	if (!Asyst.date) {
		Asyst.date = {};
	}

	//Asyst.date.monthNames = new Array('Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь');
	//Asyst.date.shortMonthNames = new Array('Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек');
	//Asyst.date.dayNames = new Array('Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота');
	//Asyst.date.shortDayNames = new Array('Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб');

	Asyst.date.monthNames = new Array(Globa.January.locale(), Globa.February.locale(), Globa.March.locale(), Globa.April.locale(),
		Globa.May.locale(), Globa.June.locale(), Globa.Jule.locale(), Globa.August.locale(),
		Globa.September.locale(), Globa.October.locale(), Globa.November.locale(), Globa.December.locale());
	Asyst.date.shortMonthNames = new Array(Globa.January3.locale(), Globa.February3.locale(), Globa.March3.locale(), Globa.April3.locale(),
		Globa.May3.locale(), Globa.June3.locale(), Globa.Jule3.locale(), Globa.August3.locale(),
		Globa.September3.locale(), Globa.October3.locale(), Globa.November3.locale(), Globa.December3.locale());
	Asyst.date.dayNames = new Array(Globa.Sunday.locale(), Globa.Monday.locale(), Globa.Tuesday.locale(), Globa.Wednesday.locale(),
		Globa.Thursday.locale(), Globa.Friday.locale(), Globa.Saturday.locale());
	Asyst.date.shortDayNames = new Array(Globa.Sunday2.locale(), Globa.Monday2.locale(), Globa.Tuesday2.locale(), Globa.Wednesday2.locale(),
		Globa.Thursday2.locale(), Globa.Friday2.locale(), Globa.Saturday2.locale());

	Asyst.date.startOfWeek = 1;
	Asyst.date.defaultFormat = 'dd.MM.yyyy';
	Asyst.date.defaultDateFormat = 'dd.MM.yyyy';
	Asyst.date.defaultTimeFormat = 'HH:mm';
	Asyst.date.defaultDateTimeFormat = Asyst.date.defaultDateFormat + ' ' + Asyst.date.defaultTimeFormat;


	function LZ (x) {
		return (x < 0 || x > 9 ? '' : '0') + x;
	}

	Asyst.date.isDate = function (val, format) {
		var date = Asyst.date.parse(val, format);
		if (date === 0) {
			return false;
		}
		return true;
	};

	Asyst.date.compare = function (date1, dateformat1, date2, dateformat2) {
		var d1 = Asyst.date.parse(date1, dateformat1);
		var d2 = Asyst.date.parse(date2, dateformat2);
		if (d1 === 0 || d2 === 0) {
			return -1;
		} else if (d1 > d2) {
			return 1;
		}
		return 0;
	};

	Asyst.date.ajustToDay = function (datetime) {
		if ((datetime.getHours() * 60 + datetime.getMinutes() + datetime.getTimezoneOffset()) % (60 * 24) !== 0) {
			return new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
		} else return new Date(datetime);
	};

	Asyst.date.ajustToUtc = function (datetime) {
		if (datetime === null || datetime.constructor !== Date) return datetime;

		var newDate = new Date(datetime.getTime() + datetime.getTimezoneOffset() * 60000);
		if (newDate.getFullYear() === datetime.getFullYear())
			return newDate;
		else {
			return new Date(date.getTime() + (date.getTimezoneOffset() + 60) * 60000);
		}
	};

	Asyst.date.addDay = function (datetime, count) {
		if (datetime === null || datetime.constructor !== Date) return datetime;

		return new Date(datetime - 0 + 86400000 * count);
	};

	Asyst.date.format = function (date, format, adjustUtc) {
		if (!date)
			return '';

		if (adjustUtc) {
			var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
			if (newDate.getFullYear() == date.getFullYear())
				date = newDate;
			else {
				date = new Date(date.getTime() + (date.getTimezoneOffset() + 60) * 60000);
			}
		}

		if (!format)
			format = this.defaultFormat;

		var result = '';
		var i_format = 0;
		var c = '';
		var token = '';
		var y = date.getYear() + '';
		var M = date.getMonth() + 1;
		var d = date.getDate();
		var E = date.getDay();
		var H = date.getHours();
		var m = date.getMinutes();
		var s = date.getSeconds();
		var yyyy, yy, MMM, MM, dd, hh, h, mm, ss, ampm, HH, KK, K, kk, k;
		// Convert real date parts into formatted versions
		var value = {};
		if (y.length < 4) {
			y = '' + (y - 0 + 1900);
		}
		value['y'] = '' + y;
		value['yyyy'] = y;
		value['yy'] = y.substring(2, 4);
		value['M'] = M;
		value['MM'] = LZ(M);
		value['MMM'] = Asyst.date.shortMonthNames[M - 1];
		value['MMMM'] = Asyst.date.monthNames[M - 1];
		value['d'] = d;
		value['dd'] = LZ(d);
		value['W'] = Asyst.date.shortDayNames[E];
		value['WW'] = Asyst.date.dayNames[E];
		value['H'] = H;
		value['HH'] = LZ(H);
		if (H === 0) {
			value['h'] = 12;
		} else if (H > 12) {
			value['h'] = H - 12;
		} else {
			value['h'] = H;
		}
		value['hh'] = LZ(value['h']);
		if (H > 11) {
			value['K'] = H - 12;
		} else {
			value['K'] = H;
		}
		value['k'] = H + 1;
		value['KK'] = LZ(value['K']);
		value['kk'] = LZ(value['k']);
		if (H > 11) {
			value['a'] = 'PM';
		} else {
			value['a'] = 'AM';
		}
		value['m'] = m;
		value['mm'] = LZ(m);
		value['s'] = s;
		value['ss'] = LZ(s);
		while (i_format < format.length) {
			c = format.charAt(i_format);
			token = '';
			while ((format.charAt(i_format) == c) && (i_format < format.length)) {
				token += format.charAt(i_format++);
			}
			if (value[token] != null) {
				result = result + value[token];
			} else {
				result = result + token;
			}
		}
		return result;
	};

	// ------------------------------------------------------------------
	// Utility functions for parsing in Asyst.date.parse()
	// ------------------------------------------------------------------
	function _isInteger (val) {
		var digits = '1234567890';
		for (var i = 0; i < val.length; i++) {
			if (digits.indexOf(val.charAt(i)) === -1) {
				return false;
			}
		}
		return true;
	}

	function _getInt (str, i, minlength, maxlength) {
		for (var x = maxlength; x >= minlength; x--) {
			var token = str.substring(i, i + x);
			if (token.length < minlength) {
				return null;
			}
			if (_isInteger(token)) {
				return token;
			}
		}
		return null;
	}

	Asyst.date.validate = function (val) {
		return val && val.constructor === Date;
		//if (val === undefined) return false;
		//if (val === 0) return false;
		//return true;
	};

	Asyst.date.parse = function (val, format) {
		if (!val)
			return null;

		if (!format)
			format = Asyst.date.defaultFormat;

		val = val + '';
		format = format + '';
		var i;
		var r;
		var i_val = 0;
		var i_format = 0;
		var c = '';
		var token = '';
		var token2 = '';
		var x, y;
		var now = new Date();
		var year = now.getYear();
		var month = now.getMonth() + 1;
		var date = 1;
		var hh = 0;
		var mm = 0;
		var ss = 0;
		var ampm = '';
		var day_name;
		var month_name;

		while (i_format < format.length) {
			// Get next token from format string
			c = format.charAt(i_format);
			token = '';
			while ((format.charAt(i_format) == c) && (i_format < format.length)) {
				token += format.charAt(i_format++);
			}
			// Extract contents of value based on format token
			if (token == 'yyyy' || token == 'yy' || token == 'y') {
				if (token == 'yyyy') {
					x = 4;
					y = 4;
				}
				if (token == 'yy') {
					x = 2;
					y = 2;
				}
				if (token == 'y') {
					x = 2;
					y = 4;
				}
				year = _getInt(val, i_val, x, y);
				if (year == null) {
					return 0;
				}
				i_val += year.length;
				if (year.length === 2) {
					if (year > 70) {
						year = 1900 + (year - 0);
					} else {
						year = 2000 + (year - 0);
					}
				}
			} else if (token == 'MMM') {
				month = 0;
				for (i = 0; i < Asyst.date.shortMonthNames.length; i++) {
					month_name = Asyst.date.shortMonthNames[i];
					if (val.substring(i_val, i_val + month_name.length).toLowerCase() == month_name.toLowerCase()) {
						month = i + 1;
						if (month > 12) {
							month -= 12;
						}
						i_val += month_name.length;
						break;
					}
				}
				if ((month < 1) || (month > 12)) {
					return 0;
				}
			} else if (token == 'MMMM') {
				month = 0;
				for (i = 0; i < Asyst.date.monthNames.length; i++) {
					month_name = Asyst.date.monthNames[i];
					if (val.substring(i_val, i_val + month_name.length).toLowerCase() == month_name.toLowerCase()) {
						month = i + 1;
						if (month > 12) {
							month -= 12;
						}
						i_val += month_name.length;
						break;
					}
				}
				if ((month < 1) || (month > 12)) {
					return 0;
				}
			} else if (token == 'WW') {
				for (i = 0; i < Asyst.date.dayNames.length; i++) {
					day_name = Asyst.date.dayNames[i];
					if (val.substring(i_val, i_val + day_name.length).toLowerCase() == day_name.toLowerCase()) {
						i_val += day_name.length;
						break;
					}
				}
			} else if (token == 'W') {
				for (i = 0; i < Asyst.date.shortDayNames.length; i++) {
					day_name = Asyst.date.shortDayNames[i];
					if (val.substring(i_val, i_val + day_name.length).toLowerCase() == day_name.toLowerCase()) {
						i_val += day_name.length;
						break;
					}
				}
			} else if (token == 'MM' || token == 'M') {
				month = _getInt(val, i_val, token.length, 2);
				if (month == null || (month < 1) || (month > 12)) {
					return 0;
				}
				i_val += month.length;
			} else if (token == 'dd' || token == 'd') {
				date = _getInt(val, i_val, token.length, 2);
				if (date == null || (date < 1) || (date > 31)) {
					return 0;
				}
				i_val += date.length;
			} else if (token == 'hh' || token == 'h') {
				hh = _getInt(val, i_val, token.length, 2);
				if (hh == null || (hh < 1) || (hh > 12)) {
					return 0;
				}
				i_val += hh.length;
			} else if (token == 'HH' || token == 'H') {
				hh = _getInt(val, i_val, token.length, 2);
				if (hh == null || (hh < 0) || (hh > 23)) {
					return 0;
				}
				i_val += hh.length;
			} else if (token == 'KK' || token == 'K') {
				hh = _getInt(val, i_val, token.length, 2);
				if (hh == null || (hh < 0) || (hh > 11)) {
					return 0;
				}
				i_val += hh.length;
			} else if (token == 'kk' || token == 'k') {
				hh = _getInt(val, i_val, token.length, 2);
				if (hh == null || (hh < 1) || (hh > 24)) {
					return 0;
				}
				i_val += hh.length;
				hh--;
			} else if (token == 'mm' || token == 'm') {
				mm = _getInt(val, i_val, token.length, 2);
				if (mm == null || (mm < 0) || (mm > 59)) {
					return 0;
				}
				i_val += mm.length;
			} else if (token == 'ss' || token == 's') {
				ss = _getInt(val, i_val, token.length, 2);
				if (ss == null || (ss < 0) || (ss > 59)) {
					return 0;
				}
				i_val += ss.length;
			} else if (token == 'a') {
				if (val.substring(i_val, i_val + 2).toLowerCase() == 'am') {
					ampm = 'AM';
				} else if (val.substring(i_val, i_val + 2).toLowerCase() == 'pm') {
					ampm = 'PM';
				} else {
					return 0;
				}
				i_val += 2;
			} else {
				if (val.substring(i_val, i_val + token.length) != token) {
					return 0;
				} else {
					i_val += token.length;
				}
			}
		}
		// If there are any trailing characters left in the value, it doesn't match
		if (i_val != val.length) {
			return 0;
		}
		// Is date valid for month?
		if (month === 2) {
			// Check for leap year
			if (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) { // leap year
				if (date > 29) {
					return 0;
				}
			} else {
				if (date > 28) {
					return 0;
				}
			}
		}
		if ((month === 4) || (month === 6) || (month === 9) || (month === 11)) {
			if (date > 30) {
				return 0;
			}
		}
		// Correct hours value
		if (hh < 12 && ampm == 'PM') {
			hh = hh - 0 + 12;
		} else if (hh > 11 && ampm == 'AM') {
			hh -= 12;
		}
		var newdate;

		/*Chrome 46 до .хх.хх.хх.90 имеет проблему
		https://code.google.com/p/chromium/issues/detail?id=543320
		Если ошибка детектируется, делаем дельту.

		var testDate = new Date(2015, 1, 1);
		if (testDate.getTimezoneOffset != 0 && testDate.getUTCHours() != 0) {
			newdate.setHours(newdate.getHours() - newdate.getTimezoneOffset() / 60);
		}*/
		/*сделаем чуток по другому
		if (jQuery.browser.webkit && hh == 0 && mm == 0 && ss == 0)
			newdate = new Date(year + '-' + month + '-' + date);
		else*/
		{
			newdate = new Date(year, month - 1, date, hh, mm, ss);
			newdate.setHours(newdate.getHours() - newdate.getTimezoneOffset() / 60);
		}


		return newdate;
	};

	Asyst.date.convertToGenitive = function (dateStr) {
		var regex = new RegExp(Asyst.date.monthNames.join('|'), 'gi');
		var matches = dateStr.match(regex);
		matches.map(function (d) {
			var dGenitive = d;
			var lastChar = d.slice(-1);
			if (lastChar == 'ь' || lastChar == 'й') {
				dGenitive = d.substr(0, d.length - 1) + 'я';
			} else {
				dGenitive = d + 'а';
			}
			dateStr = dateStr.replace(d, dGenitive);
		});
		return dateStr;
	};


	// ----------------------------------------------------------------------------
	// Цифирки
	// ----------------------------------------------------------------------------

	if (!Asyst.number) {
		Asyst.number = {};
	}

	Asyst.number.validate = function (val, binding) {
		if (!val)
			return true;

		var val1 = val.toString().replace(/\s+/g, '').replace(/,/, '.');
		var num = Number(val1);

		if (isNaN(num) || num != Asyst.number.parse(val)) {
			return false;
		} else if (binding) {
			// precision[.scale] precision - вся длина, scale - дробная часть
			if (binding.Type === 'number' && binding.Kind === 'decimal') {
				if (Math.ceil(Math.log(Math.abs(num)) / Math.LN10) > (binding.Precision - binding.Scale)) return false;
				else return true;
			} else return true;

		}

		return true;
	};

	if (numeral) {
		numeral.locale('ru');
	}
	//numeral.language('ru-it');
	Asyst.number.format = function (val, format) {
		if (format === undefined || format === null)
			format = '0,0.[00]';
		return numeral(val).format(format);
	};

	Asyst.number.parse = function (val, format) {
		//return numeral().unformat(val);
		return numeral(val).value();
	};

	if (kendo)
		kendo.culture('ru');
})();