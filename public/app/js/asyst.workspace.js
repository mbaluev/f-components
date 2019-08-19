(function () {
	'use strict';

	if (!Asyst.Workspace) {
		Asyst.Workspace = {};
	}

	var _forms = [];
	var _windowTitles = []; //будем хранить историю заголовков окна, чтобы при закрытии диалога восстанавливать что было до него

	Asyst.Workspace.getCurrentForm = function () {
		if (_forms.length === 0)
			return undefined;
		else
			return _forms[_forms.length - 1];
	};

	Asyst.Workspace.getFormCount = function () {
		return _forms.length;
	};

	Asyst.Workspace.getForm = function (index) {
		return _forms[index];
	};

	Asyst.Workspace.addCurrentForm = function (form) {
		_forms.push(form);
		Asyst.Workspace.currentForm = form;
	};

	Asyst.Workspace.removeCurrentForm = function () {
		Asyst.Workspace.removeForm(Asyst.Workspace.getCurrentForm());

	};

	Asyst.Workspace.removeForm = function (form) {
		$(document).triggerHandler('AsystFormBeforeClosed', form);
		form.onBeforeClosedFire();

		var i = jQuery.inArray(form, _forms);
		if (i >= 0)
			_forms.splice(i, 1);

		Asyst.Workspace.currentForm = Asyst.Workspace.getCurrentForm();

		document.title = _windowTitles.pop();

		$(document).trigger('AsystFormClosed', form);
		form.onClosedFire();
	};

	Asyst.Workspace.showTab = function (tabName) {
		if (!tabName)
			return false;

		var $tab = Asyst.Workspace.currentForm.$('#tabs a[href="' + tabName + '"]');

		if ($tab.length === 0)
			$tab = Asyst.Workspace.currentForm.$('#tabs a[href="#' + tabName + '"]');
		if ($tab.length === 0)
			$tab = Asyst.Workspace.currentForm.getTabByText(tabName);

		if ($tab.length === 0)
			$tab = Asyst.Workspace.currentForm.getTabByName(tabName);

		if ($tab.length === 0)
			$tab = Asyst.Workspace.currentForm.getNestedTabByName(tabName);

		if ($tab.length === 0)
			$tab = Asyst.Workspace.currentForm.getNestedTabByText(tabName);

		//try nested open
		var prnts = $tab.parents('.tab-pane');
		if (prnts.length > 0)
			Asyst.Workspace.showTab(prnts[0].id);

		if ($tab.length > 0) {
			$tab.tab('show');

			return true;
		} else
			return false;
	};

	Asyst.Workspace.openEntityDialog = function (/*entityName, title, id, success, fields, notsave => moved to settings object*/) {
		var entityName; var title; var id; var success; var fields; var notsave; var tab; var onClose; var saveAndGo; var saveNoClose = true;
		var savedAndNeedSuccess = false;

		_windowTitles.push(document.title); //сохраним текущее название окна
		if (arguments.length === 1 && typeof arguments[0] === 'object') {
			var settings = arguments[0];
			entityName = settings.entityName;
			title = settings.title;
			id = settings.id;
			success = settings.success;
			fields = settings.fields;
			notsave = settings.notsave;
			tab = settings.tab;
			onClose = settings.close;
			saveAndGo = !notsave && settings.saveAndGo;
			saveNoClose = !notsave && (settings.saveNoClose || saveNoClose);
		} else {
			console.warn('[Deprecated] Asyst.Workspace.openEntityDialog необходимо вызывать с одним параметром в виде объекта!');
			entityName = arguments[0];
			title = arguments[1];
			id = arguments[2];
			success = arguments[3];
			fields = arguments[4];
			notsave = arguments[5];
		}

		if (!id)
			id = 'new';

		var prevform = Asyst.Workspace.currentForm;
		if (prevform && !tab) {
			tab = prevform.getActiveTab().text().trim();
		}

		if (tab) {
			var openTab = function () {
				if (tab) Asyst.Workspace.showTab(tab);
				$(document).off('AsystFormAfterOpen', openTab);
			};

			$(document).on('AsystFormAfterOpen', openTab);
		}

		if (!title)
			title = '';

		title = $('<div/>').text(title).html();

		// Для новых окон, для которых title нельзя будет сформировать из данных и для которых название задается при вызове функции - сразу его подставим.
		// Для карточек редактирования оно будет потом изменено в form.Reset
		if (title)
			document.title = title;

		//Запустим сразу предполучение данных карточки в паралельный запрос
		Asyst['preload' + entityName + id] = Asyst.API.Entity.load({
			entityName: entityName,
			dataId: id,
			isAccessNeed: true,
			defaults: fields
		});

		var container = $('.f-application__middle').length > 0 ? $('.f-application__middle') : $('body');
		var dims = container.offset();
		var defaultWidth = 1024;
		dims.padding = kendo.support.mobileOS ? 4 : 12;
		dims.containerWidth = container.outerWidth() - dims.padding * 2;
		dims.width = dims.containerWidth < defaultWidth ? dims.containerWidth : defaultWidth;
		dims.height = container.outerHeight() - dims.padding * 2;
		var url = '/' + entityName + '/form/edit/' + id + '?refreshrandom=' + new Date().valueOf();
		var modalEdit = $('<div min-width max-width></div>');
		kendo.ui.progress(modalEdit, true);

		modalEdit.appendTo('body');
		var buttons = ['Maximize', 'Minimize', 'Save', 'Close'];
		if (saveNoClose) buttons.splice(2, 0, 'Check');
		if (saveAndGo) buttons.splice(2, 0, 'hyperlink-open');

		var dialog = modalEdit.kendoWindow({
			title: title,
			actions: buttons,
			modal: true,
			visible: false,
			isMaximized: false,
			width: dims.width,
			height: dims.height,
			position: {
				top: dims.top + dims.padding,
				left: (dims.containerWidth - dims.width) / 2 + dims.left + dims.padding
			},
			activate: function (e) {
				$.get(url, function (fromHtml) {
					dialog.content(fromHtml);
					AsystFormData.AutoLoad();
				});
				e.sender.wrapper.find('.k-window-title').dotdotdot({ height: 80 });
			},
			deactivate: function (e) {
				var form = dialog.wrapper.find('form').data('AsystFormData');
				e.sender.wrapper.remove();
				modalEdit.empty();
				if (form) {
					Asyst.Workspace.removeForm(form);
					if (savedAndNeedSuccess && typeof success === 'function') success(form);
				}
				if (typeof onClose === 'function') onClose();
				dialog.destroy();
			},
			resize: function (e) {
				e.sender.wrapper.find('.k-window-title').dotdotdot({ height: 80 });
				$('body').fTooltip('clear');
			},
			maximize: function () {
				dialog.wrapper.find('.k-i-window-restore').parent().attr('data-tooltip', Globa.Restore);
			},
			open: function () {
				dialog.wrapper.find('.k-i-window-maximize').parent().attr('data-tooltip', Globa.Maximize);
				dialog.wrapper.find('.k-i-window-minimize').parent().attr('data-tooltip', Globa.Minimize);
				dialog.wrapper.find('.k-i-hyperlink-open').parent().hide().attr('data-tooltip', Globa.SaveAndOpen);
				dialog.wrapper.find('.k-i-check').parent().hide().attr('data-tooltip', Globa.SaveNoClose);
				dialog.wrapper.find('.k-i-save').parent().hide().attr('data-tooltip', Globa.Save);
				dialog.wrapper.find('.k-i-close').parent().attr('data-tooltip', Globa.Close);
			},
			close: function (e) {
				if (e.userTriggered) {
					var form = e.sender.wrapper.find('form').data('AsystFormData');
					if (form && form.HasChanges()) {
						e.preventDefault();
						$('<div/>').appendTo(document.body).kendoConfirm({
							messages: {
								okText: 'Закрыть без сохранения',
								cancel: 'Вернуться к редактированию'
							},
							content: 'На карточке есть несохранённые изменения. Вы действительно хотите её закрыть?',
							title: 'Закрыть карточку'
						}).data('kendoConfirm').result
							.done(function () {
								dialog.close();
							});
					}
				}
				$('body').fTooltip('clear');
			}
		}).data('kendoWindow');
		dialog.open();
		dialog.wrapper.find('.k-i-check').parent().on('click', function () {
			if (this.hasAttribute('disabled')) return;
			var form = dialog.wrapper.find('form').data('AsystFormData');
			if (!form) return;
			form.Save(function () {
				savedAndNeedSuccess = true;
			}, Boolean(notsave));
		});
		dialog.wrapper.find('.k-i-save').parent().on('click', function () {
			if (this.hasAttribute('disabled')) return;
			var form = dialog.wrapper.find('form').data('AsystFormData');
			if (!form) return;
			form.Save(function () {
				dialog.close();
				savedAndNeedSuccess = true;
			}, Boolean(notsave));
		});
		dialog.wrapper.find('.k-i-hyperlink-open').parent().on('click', function (e) {
			if (this.hasAttribute('disabled')) return;
			var form = dialog.wrapper.find('form').data('AsystFormData');
			if (!form) return;
			form.Save(function () {
				saveTabAndGo('/' + entityName + '/form/auto/' + form.id);
			});
		});
	};

	Asyst.Workspace.currentFormEdit = function (settings) {
		var form = Asyst.Workspace.getCurrentForm();
		settings = $.extend(settings,
			{
				entityName: form.EntityName,
				title: '[' + form.Data.classtitle + '] ' + form.Data[form.Data.namefield],
				id: form.EntityId
			});

		settings.success = function () { form.Load(); };
		Asyst.Workspace.openEntityDialog(settings);
	};

	Asyst.Workspace.currentFormClose = function (back) {
		var historySuperBack = function () {
			if (history.length > 1)
				history.back();
			else {
				window.open('', '_self', '');
				window.close();
			}
		};

		var backRules = ['view', 'back', 'home', 'close'];

		var form = Asyst.Workspace.currentForm;
		var nowUrl = new LinkService.Url(location.href);

		if (form) {
			form.onBeforeClosedFire();
			form.onClosedFire();
		}

		var backStack = nowUrl.getBackStack();
		back = backStack.shift() || 'view';
		back = decodeURIComponent(back);
		if (back && backRules.indexOf(back) === -1) {
			var backUrl = new LinkService.Url(back);


			if (backStack.length > 0) {
				backUrl.addParam('back', backStack.join('!'));
			} else {
				backUrl.addParam('back', 'view');
			}

			back = backUrl.getLink();
		}

		if (back) {
			if (back === 'back') {
				historySuperBack();
				//history.back();
			} else if (back === 'view') {
				window.location.href = '/page/register?view=' + form.EntityName;
			} else if (back === 'home') {
				window.location.href = '/';
			} else if (back === 'close') {
				window.close();
			} else
				location.href = back;
		} else historySuperBack();

	};


	var _pages = [];

	Asyst.Workspace.addCurrentPage = function (page) {
		_pages.push(page);
		Asyst.Workspace.currentPage = page;
	};


	Asyst.Workspace._currentUser = null;
	Asyst.Workspace.initUser = function (user) {
		Asyst.Workspace._currentUser = user;
	};
	if (!Asyst.Workspace.currentUser) {
		Object.defineProperty(Asyst.Workspace, 'currentUser', {
			get: function () {
				if (this._currentUser === null) {
					this._currentUser = Asyst.API.AdminTools.getCurrentUser();
				}
				return this._currentUser;
			}
		});
	}

	window.addEventListener('unload', function () {
		if (Asyst.Workspace.currentForm) {
			Asyst.Workspace.currentForm.onBeforeClosedFire();
			Asyst.Workspace.currentForm.onClosedFire();
		}
		return undefined;
	}, false);


}());
