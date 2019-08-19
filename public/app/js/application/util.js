
function toHtml(text) {
    if (text || text === false) {
        var $html = $('<div/>').html(text);
        return $html.text().replace(/'/g, '&apos;').replace(/"/g, '&quot;');
    }
    else
        return '';
}

function StringToHtml(s) {
    if (typeof s === "string")
        return s.replace(/\n\r?/g, '<br />');
    else
        return s;
}

//http://stackoverflow.com/questions/1634748/how-can-i-delete-a-query-string-parameter-in-javascript
function removeURLParameter(url, parameter) {
    var urlparts = url.split('?');
    if (urlparts.length >= 2) {

        var prefix = encodeURIComponent(parameter) + '=';
        var pars = urlparts[1].split(/[&;]/g);

        for (var i = pars.length; i-- > 0;) {
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }

        url = urlparts[0] + '?' + pars.join('&');
        return url;
    } else {
        return url;
    }
}

function MoveToNextPhase() {
    var form = Asyst.Workspace.currentForm;

    if (form.Access.ActivityPhaseId.ChangeRequestId > 0) {
        Dialogs.Message(Globa.DeniedDoubleMove.locale());
        return;
    }

    var msg = Globa.ConfirmEndPhase.locale();

    if ($('#phase-modal').length > 0)
        $('#phase-modal').remove();
    Dialogs.Confirm(
        Globa.MoveToNextPhase.locale(),
        msg,
        function () {
            var error = function (message, info, context) {

                Loader.hide();
  
                Dialogs.Message(info, message);

            };

            var success = function (result) {
                var access = form.Access;
                var nextPhaseId = result.nextPhaseId;
                if (access.hasOwnProperty('ActivityPhaseId') && access.ActivityPhaseId.ReviewCycleId) {

                    var doSave = function (locSuccess) {

                        var successF = function (data) {
                            if (form.isNew) {
                                form.EntityId = data.id;
                                form.isNew = false;
                                $("#" + form.FormName + "EntityId").val(data.id);
                                Asyst.API.AdminTools.saveStats({
                                    page: location.href,
                                    pageTitle: form.GetTitle(),
                                    type: 'editCard',
                                    action: 'create',
                                    entityId: form.Data.classid,
                                    dataId: data.id
                                }, true);
                            }
                            else
                                Asyst.API.AdminTools.saveStats({
                                    page: location.href,
                                    pageTitle: form.GetTitle(),
                                    type: 'editCard',
                                    action: 'save',
                                    entityId: form.Data.classid,
                                    dataId: form.Data.id
                                }, true);

                            if (locSuccess)
                                locSuccess();
                            form.Load();
                        };

                        var errorF = function (error, text) {
                            if (error == Globa.LicenseError) {
                                return;
                            }
                            ErrorHandler(Globa.SavingError.locale(), error);
                        };

                        Asyst.API.Entity.save({ entityName: form.EntityName, dataId: form.EntityId, data: postData, success: successF, error: errorF, async: false });
                    };
                    var postData = { ActivityPhaseId: nextPhaseId };
                    var crElement = form.MakeActivityPhaseChangeRequest(access.ActivityPhaseId, form.Bindings["ActivityPhaseId"], nextPhaseId, form.NextPhaseName);
                    Loader.hide();
                    $('.modal').modal('hide');
                    form.ShowChangeRequestDialog([crElement], postData, doSave, null);

                } else {
                    var moveSuccess = function (result) {
                        Loader.hide();
                        $('.modal').modal('hide');
                        form.Load();
                    };
                    Asyst.API.Phase.moveNext({ entityName: form.EntityName, activityId: form.Data.ActivityId, data: form.Data, async: true, success: moveSuccess, error: error });
                }

            };

            Loader.show(undefined, Globa.MoveToNextPhase.locale());

            Asyst.API.Phase.check({ entityName: form.EntityName, activityId: form.Data.ActivityId, data: form.Data, async: true, success: success, error: error });
        }, undefined, "phase-modal");
}

function MoveToPrevPhase() {
    var form = Asyst.Workspace.currentForm;
    var access = form.Access;

    if (access.hasOwnProperty('ActivityPhaseId') && access.ActivityPhaseId.ReviewCycleId) {
        Dialogs.Message(Globa.DeniedDoubleMove.locale());
        return;
    }
    var msg = Globa.ConfirmReturn.locale();


    if ($('#phase-modal').length > 0)
        $('#phase-modal').remove();
    Dialogs.Confirm(
        Globa.ReturnPrev.locale(),
        msg,
        function () {
            var success = function (result) {
                Loader.hide();
                $('.modal').modal('hide');
                form.Load();
            };

            var error = function (message, info, context) {
                Loader.hide();

                Dialogs.Message(info, message);
            };

            Loader.show(undefined, Globa.ReturnPrev.locale());

            Asyst.API.Phase.movePrev({ entityName: form.EntityName, activityId: form.Data.ActivityId, success: success, error: error});
        }, undefined, "phase-modal");
}

//по alt+ctrl+b показываем последнюю ошибку
$(document).bind('keydown', 'ctrl+b', function (event) {
    if (event.ctrlKey && event.altKey && event.keyCode === 66 && localStorage) {
        var d = Dialog('Last error', localStorage.getItem('/LastError'));
        $('#' + d).css({ 'width': '900px', 'margin-left': '-450px' });

    }
});

function setInputWarning(selector, value, text) {
    console.warn('[Depreceted] Использйте метод setInputWarning класса Binding');
    var $el = $(selector);

    if (value)
        $el.parents('.control-group').addClass("warning");
    else
        $el.parents('.control-group').removeClass("warning");

    if (value && text)
        $el.siblings('.help-inline').html(text);
    else
        $el.siblings('.help-inline').html("");

    return $el;
}

function ErrorHandler(message, text, url, type) {
    if (window['localStorage']) {
        localStorage.setItem('/LastError', new Date().toString() + ' ' + (url || '') + '\n' + message + '\n' + text);
    }
    if (type === "warning")
        NotifyWarning(message, text);
    else
        NotifyError(message, Asyst.date.format(new Date(), 'yyyy.MM.dd HH:mm:ss') + ' ' + text + '</br>' + Globa.ErrorDescription.locale());
}

function LicenseErrorHandler(error, text) {
    NotifyWarning(Globa.LicenseError.locale(), Globa.JSLicenseExpired.locale());
}

/**
 * Поверхностное клонирование
 * @param {any} obj Объект для клонирования
 * @returns {any} Новый объект
 */
function clone(obj) {

    if (obj === null || typeof (obj) !== 'object')
        return obj;
    if (obj.constructor === Array)
        return [].concat(obj);
    var temp = {};
    for (var key in obj)
        temp[key] = obj[key];
    return temp;
}

