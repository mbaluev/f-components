var LinkService = {};
//#region LinkService.Url


/**
 * Разбираем ссылку на клиенте средствами самого браузера
 *
 * @constructor
 * @param {String} href - ссылка
 */

LinkService.Url = function (href) {
	if (href == undefined) {
		href = window.location.href;
	}
	var url = document.createElement('a');
	url.href = href;
	this.href = url.href || '';
	this.protocol = url.protocol || '';
	this.hostname = url.hostname || '';
	this.port = url.port || '';
	this.pathname = url.pathname || '';
	this.search = url.search || '';
	this.hash = url.hash || '';
	//Hi, ie
	if (this.pathname.indexOf('/') !== 0) {
		this.pathname = '/' + this.pathname;
	}
	//Bye, ie
	//Максимальная длина запроса
	//https://github.com/dreikanter/paradigm.ru/blob/master/posts/2007-12-19_url-max-length.md
	this.maxLength = 2000;
};
/**
 * Возвращает все get параметры запроса
 *
 * @returns {Array} - get параметры
 */
LinkService.Url.prototype.getParams = function () {
	var search = this
		.search
		.replace('?', '')
		.split('&');

	var params = {};
	for (var i = 0; i < search.length; i++) {
		var row = search[i].split('=');
		if (row[0] && row[0] !== '')
			params[row[0]] = row[1];

	}

	return params;

};
/**
 * Удаляет параметр из url
 *
 * @param {String} param - имя параметра, который будет удалён
 * @returns {LinkService.Url}
 */
LinkService.Url.prototype.delParam = function (param) {
	var search = this
		.search
		.replace('?', '')
		.split('&');
	for (var i = 0; i < search.length; i++) {

		if (search[i].split('=')[0] == param) {
			search.splice(i, 1);
		}
	}
	if (search.length > 0 && search[0] && search[0] !== '') {
		this.search = '?' + search.join('&');
	} else {
		this.search = '';
	}
	return this;
};
/**
 * Добавляет get параметр в url
 * @param {String} key - имя параметра
 * @param {String} value - значение параметра
 * @returns {LinkService.Url}
 */
LinkService.Url.prototype.addParam = function (key, value) {
	var params = this.getParams();
	params[key] = value;
	var search = '';
	for (var k in params) {
		search += '&' + k + '=' + params[k];
	}

	if (search.length > 0) {
		search = '?' + search.substring(1, search.length);
	} else {
		search = '';
	}

	this.search = search;

	return this;
};
/**
 * Получает указанный параметр из url
 *
 * @param {String} param имя параметра
 * @returns {string} - параметр
 */
LinkService.Url.prototype.getParam = function (param) {
	var params = this.getParams();
	return (params[param] === undefined) ? '' : params[param];
};
/**
 * Возвращает стек обратных вызовов составленный из параметра back
 *
 * @returns {Array} - параметры
 */
LinkService.Url.prototype.getBackStack = function () {
	var back = this.getParam('back');
	if (back.length > 0)
		return back.split('!');
	else
		return [];
};


/**
 * Возвращает не подрезаную ссылку
 *
 * @returns {string} - полная ссылка
 */
LinkService.Url.prototype.getFullLink = function () {
	return this.protocol + '//' + this.hostname + (this.port ? ':' + this.port : '') + this.pathname + this.search + this.hash;
};

/**
 * Подрезает и возвращает ссылку в текстовом представлении
 * @returns {string} - ссылка
 */
LinkService.Url.prototype.getLink = function () {
	while (this.getFullLink().length > this.maxLength) {
		var back = this.getBackStack();
		back.pop();
		this.delParam('back').addParam('back', back.join('!'));
	}

	return this.pathname + this.search;
};

//#endregion LinkService.Url

LinkService.Handler = function () {
	var element = $(this);

	var url = element.data('save-tab-and-go');

	element.attr('href', saveTabAndLink(url));
};
LinkService.CreateByDataAttr = function (e, form) {
	$(document)
		.off('.LinkService', 'a[data-save-tab-and-go]')
		.on('click.LinkService contextmenu.LinkService', 'a[data-save-tab-and-go]', LinkService.Handler);
	form.$('a[data-save-tab-and-go]').each(LinkService.Handler);
};

$(document).off('.LinkService')
	.on('AsystFormAfterOpen.LinkService AsystFormTemplatesLoaded.LinkService AsystInlineTableViewLoaded.LinkService', LinkService.CreateByDataAttr);

function saveTabAndLink (href, tab) {
	var nowUrl = new LinkService.Url(location.href);
	var redirectUrl = new LinkService.Url(href);
	var back = nowUrl.getBackStack();
	var $tab;
	if (tab) {
		$tab = tab;
	} else if (Asyst.Workspace.currentForm !== undefined) {
		$tab = (Asyst.Workspace.currentForm.getActiveTab()[0]
			&& Asyst.Workspace.currentForm.getActiveTab()[0].hash)
			? Asyst.Workspace.currentForm.getActiveTab()[0].hash.replace(/\#/g, '')
			: '';
	}
	nowUrl.delParam('back').delParam('tab');
	if ($tab && $tab.length > 0) {
		nowUrl.addParam('tab', $tab);
	}
	back.unshift(encodeURIComponent(nowUrl.getLink()));
	redirectUrl.addParam('back', back.join('!'));
	return redirectUrl.getLink();
}
function saveTabAndGo (href, tab) {
	location.href = saveTabAndLink(href, tab);
}
function saveParamsAndLink (href, params) {
	var nowUrl = new LinkService.Url(location.href);
	var redirectUrl = new LinkService.Url(href);
	var back = nowUrl.getBackStack();
	nowUrl.delParam('back');
	params.forEach(function (param) {
		nowUrl.delParam(param.key);
		nowUrl.addParam(param.key, param.value);
	});
	back.unshift(encodeURIComponent(nowUrl.getLink()));
	redirectUrl.addParam('back', back.join('!'));
	return redirectUrl.getLink();
}
