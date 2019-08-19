Asyst.Page = function (extPage) {
    page = this;
    page.pageName = extPage.Name;
    page.pageTitle = extPage.Title;
    page.pageId = extPage.PageId;

    page.templates = {};
    page.TemplateData = {};

    this.buildPageTemplate = function (elementName) {
        //var PageName = откуда-то взять.

        var success = function (data) {
            var c = arguments.callee;
            page.TemplateData[c.ElementName] = data;
            var el = $(/*'#' + page.pageName + */" #" + c.ElementName);

            var s = Asyst.Utils.ProcessTemplate(page.templates[c.ElementName].content, data, {});
            el.html(s);

        };
        success.ElementName = elementName;

        var gets = Asyst.Utils.splitGETString();

        for (var c in gets) {
            if (gets.hasOwnProperty(c) && gets[c].constructor === String) {
                gets[c] = decodeURIComponent(gets[c]);
            }
        }

        Asyst.API.DataSource.load({
            sourceType: 'page',
            sourceName: page.pageName,
            elementName: elementName,
            data: gets,
            success: success,
            error: function (error, text) { ErrorHandler(Globa.ErrorDataListLoad.locale(), error + "<br>" + text); },
            async: true,
            isPicklist: false
        });
    };

    this.Load = function () {
        Asyst.Workspace.addCurrentPage(page);
        Asyst.API.AdminTools.saveStats({ page: location.href, pageTitle: page.pageTitle, type: 'asystPage', action: 'open' }, true);

        for (var c in this.templates) {
            this.buildPageTemplate(c);
        }

    };
    return this;
};

//надо как-нибудь неймспейс прикрутить чтоли..
var showView = function (viewName, elementName) {
    var el = $('#' + elementName);
    var success = function (html) {
        var s = html;

        var sel = document.createElement("div");
        $(sel).html(s).find('script[src]').each(function (_, elem) {
            var path = elem.getAttribute('src');
            if ($("script[src='" + path + "']").length > 0)
                elem.remove();
        });
        el.html(sel);
    };

    var error = function (req) {
        el.html(req.responseText);
    };

    var gets = Asyst.Utils.splitGETString();
    viewName = gets['view'] || viewName;

    $.ajax({ url: '/browse/' + viewName + '?nojscss=true&rand=' + Math.round(Math.random() * 10000000), type: 'get', success: success, error: error });
};

/* получаем весь построенный контент страницы по имени */
function getDashboardHTML(pageName) {

    var result = "";
    var gets = Asyst.Utils.splitGETString();

    /* считываем get-параметры */
    for (var c in gets) {
        if (gets.hasOwnProperty(c) && gets[c].constructor === String) {
            gets[c] = decodeURIComponent(gets[c]);
        }
    }

    /* считываем все элементы выбранной страницы (из специального представления)*/
    Asyst.API.View.load({
        viewName: "MetaPageElementByPageView",
        data: { PageName: pageName },
        success: function (view) {
            /* если элементы страницы получены, то получаем для каждого источник */
            $.each(view.data, function (key, value) {
                var elData = Asyst.API.DataSource.load({
                    sourceType: "page",
                    sourceName: pageName,
                    elementName: value.Name,
                    data: gets,
                    success: function (data) {
                        /* если источник получен, то применяем данные к шаблону; итоговую html запоминаем*/
                        result += ProcessTemplate(value.Content, data, {});
                    },
                    error: function (error, text) {
                        /* если данные не удалось применить, бросаем ошибку */
                        ErrorHandler(Globa.Error.locale(), error + "<br>" + text);
                    },
                    isPicklist: false,
                    async: false,
                });
            })
        },
        error: function (error, text) {
            /* если данные не удалось получить, бросаем ошибку */
            ErrorHandler(Globa.ErrorDataListLoad.locale(), error + "<br>" + text);
        },
        async: false
    });

    /* полученный html отдаем странице*/
    return result;
}