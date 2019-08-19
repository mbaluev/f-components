/*Полифилы*/

Object.values = Object.values ? Object.values : function (obj) {
    var allowedTypes = ["[object String]", "[object Object]", "[object Array]", "[object Function]"];
    var objType = Object.prototype.toString.call(obj);

    if (obj === null || typeof obj === "undefined") {
        throw new TypeError("Cannot convert undefined or null to object");
    } else if (!~allowedTypes.indexOf(objType)) {
        return [];
    } else {
        // if ES6 is supported
        if (Object.keys) {
            return Object.keys(obj).map(function (key) {
                return obj[key];
            });
        }

        var result = [];
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                result.push(obj[prop]);
            }
        }

        return result;
    }
};

if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        enumerable: false,
        value: function (searchElement, fromIndex) {

            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            // 1. Let O be ? ToObject(this value).
            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If len is 0, return false.
            if (len === 0) {
                return false;
            }

            // 4. Let n be ? ToInteger(fromIndex).
            //    (If fromIndex is undefined, this step produces the value 0.)
            var n = fromIndex | 0;

            // 5. If n ≥ 0, then
            //  a. Let k be n.
            // 6. Else n < 0,
            //  a. Let k be len + n.
            //  b. If k < 0, let k be 0.
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            function sameValueZero(x, y) {
                return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
            }

            // 7. Repeat, while k < len
            while (k < len) {
                // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                // b. If SameValueZero(searchElement, elementK) is true, return true.
                if (sameValueZero(o[k], searchElement)) {
                    return true;
                }
                // c. Increase k by 1. 
                k++;
            }

            // 8. Return false
            return false;
        }
    });
}

if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        },
        configurable: true,
        writable: true
    });
}

/* @author: Nik
* IE не поддерживает метод remove() - создадим его
*/
if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function () {
        if (this.parentNode) this.parentNode.removeChild(this);
    };
}

if (!String.prototype.includes) {
    Object.defineProperty(String.prototype, 'includes', {
        value: function (search, start) {
            if (typeof start !== 'number') {
                start = 0;
            }

            if (start + search.length > this.length) {
                return false;
            } else {
                return this.indexOf(search, start) !== -1;
            }
        }
    });
}


Promise.prototype.finally = Promise.prototype.finally || 
    function (fn) {
        var onFinally = function (cb) { return Promise.resolve(fn()).then(cb); };
        return this.then(
            function (result) { return onFinally(function () { return result; }); },
            function (reason) { return onFinally(function () { return Promise.reject(reason); }); }
        );
    };
/*Полифилы END*/

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


//http://slawutich.pp.ua/javascript/47-dynjs.html динамическая подгрузка css/js
dynjs =
    {
        type: { js: "js", css: "css", csstxt: "csstxt" },
        load: function (url_, type_, async_) {
            if (typeof (type_) == "undefined") {
                type_ = dynjs.type.js;
            }

            var is_exist = false;
            var tag = type_ == dynjs.type.js ? "script" : type_ == dynjs.type.css ? "link" : "style";
            var objects = document.getElementsByTagName(tag);
            var src = type_ == dynjs.type.js ? "src" : "href";
            for (var i = 0; i < objects.length; i++) {
                var elem = objects[i];
                if (elem.getAttribute(src) == url_) {
                    is_exist = true;
                }
            }
            if (is_exist) {
                return;
            }
            var _elem = document.createElement(tag);
            var type = type_ == dynjs.type.js ? "text/javascript" : "text/css";

            _elem.setAttribute("type", type);
            _elem.setAttribute(src, url_);

            if (type_ == dynjs.type.css) {
                _elem.setAttribute("rel", "Stylesheet");
            }
            if (type_ == dynjs.type.csstxt) {
                if (typeof (_elem.styleSheet) != "undefined") {
                    _elem.styleSheet.cssText = url_;
                }
                else if (typeof (_elem.innerText) != "undefined") {
                    _elem.innerText = url_;
                }
                else {
                    _elem.innerHTML = url_;
                }
            }

            if (type_ == dynjs.type.js && async_ !== undefined) {
                _elem.async = !!async_;
            }
            document.getElementsByTagName("head")[0].appendChild(_elem);
        }
    };
// Dialog ----------
function Dialog(title, body, buttons, id, width, height) {
    if (!id) {
        id = 'f-dialog_' + guid();
    }
    if (buttons) {
        for (var i in buttons) {
            if (!buttons.hasOwnProperty(i)) continue;
            var action = buttons[i];
            if (jQuery.isFunction(action.click)) {
                var funcId = '__' + guid();
                Dialogs[funcId] = action.click;
                action.action = Dialogs[funcId];
            } else if (action.click) {
                action.action = action.click;
            }
            if (action.close == false) {
                var fn = action.action;
                action.action = function (e) {
                    fn(e);
                    return false;
                };
            }
        }
    } else {
        buttons = [
            { text: Globa.Close.locale(), primary: true }
        ];
    }
    var dialog = $('<div min-width max-width></div>').attr('id', id);
    dialog.appendTo('body');
    dialog.kendoDialog({
        title: title,
        closable: true,
        modal: true,
        width: width,
        height: height,
        //maxWidth: $(window).width() - 12,
        //maxHeight: $(window).height() - 12,
        content: body,
        actions: buttons,
        close: function (e) {
            e.sender.wrapper.remove();
            dialog.empty();
        }
    });
    dialog.fResizeListener('activate');
    dialog.resize();
    return id;
}
if (typeof Dialogs === typeof undefined) {
    Dialogs = {};
}
Dialogs.Message = function (message, title) {
    return Dialog(title || Globa.Message.locale(), message, [{ text: '&nbsp ' + Globa.Close.locale() + ' &nbsp;', primary: false, click: null, close: null }]);
};
Dialogs.Confirm = function (title, message, yes, no, id) {
    return Dialog(title, message, [
        { text: '&nbsp;' + Globa.Yes.locale() + '&nbsp;', primary: true, click: yes },
        { text: '&nbsp;' + Globa.No.locale() + '&nbsp;', click: no }
    ], id);
};
Dialogs.Dock = function (id, width) {
    if (!width) {
        width = '300px';
    }
    var dialog = $('#' + id).data('kendoDialog');
    dialog.wrapper.css({ left: 0, top: 0, width: width });
    dialog._overlayedNodes.each(function () {
        if ($(this).hasClass('k-overlay')) {
            $(this).remove();
        }
    });
};
Dialogs.Support = function (title, message, showUserContacts, addSystemInfo) {
    var dims = { width: 600 };
    dims.width = (dims.width > $(window).width() ? $(window).width() : dims.width);
    dims.width = dims.width - 12 * 2; // minus paddings
    var body = [
        '<form class="f-form" id="form-support" name="form-support">',
        '<div class="f-row">',
        '<div class="f-control__wrapper">',

        '<div class="f-control f-control_direction_column">',
        '<div class="f-control__caption f-control__caption_padding">',
        '<div class="f-control__text">' + message + '</div>',
        '</div>',
        '</div>',

        '<div class="f-control">',
        '<div class="f-control__caption f-control__caption_padding">',
        '<div class="f-control__text">Ваш email</div>',
        '<div class="f-control__icons">',
        '<span class="f-icon f-icon_svg_star_red"></span>',
        '</div>',
        '</div>',
        '<div class="f-control__container">',
        '<input id="email" class="k-textbox" type="text" name="email" required validationMessage="Введите email" style="width: 100%;" value="' + (showUserContacts ? Asyst.Workspace.currentUser.EMail : '') + '">',
        '</div>',
        '</div>',

        '<div class="f-control">',
        '<div class="f-control__caption f-control__caption_padding">',
        '<div class="f-control__text">Номер телефона</div>',
        '<div class="f-control__icons">',
        '<span class="f-icon f-icon_svg_star_red"></span>',
        '</div>',
        '</div>',
        '<div class="f-control__container">',
        '<input id="phone" class="k-textbox" type="text" name="phone" required validationMessage="Введите номер телефона" style="width: 100%;">',
        '</div>',
        '</div>',

        '<div class="f-control">',
        '<div class="f-control__caption f-control__caption_padding">',
        '<div class="f-control__text">Текст сообщения</div>',
        '<div class="f-control__icons">',
        '<span class="f-icon f-icon_svg_star_red"></span>',
        '</div>',
        '</div>',
        '<div class="f-control__container">',
        '<textarea id="name" class="k-textbox" type="text" name="name" rows="5" required validationMessage="Введите текст сообщения" style="width: 100%;"></textarea>',
        '</div>',
        '</div>',

        '</div>',
        '</div>',
        '</form>'
    ].join('');
    var buttons = [
        {
            text: 'Отправить', primary: true,
            click: function (e) {
                e.sender.wrapper.find('#form-support').submit();
            },
            close: false
        },
        { text: 'Отмена', click: null, close: null }
    ];
    var id = Dialog(title, body, buttons, null, 600);
    var dialog = $('#' + id).data('kendoDialog');
    dialog.wrapper.find('#form-support').kendoValidator();
    dialog.wrapper.find('#form-support').submit(function (e) {
        e.preventDefault();
        var browserString = '';
        $.each($.browser, function (i, val) { browserString += i + ': ' + val + ', '; });
        browserString = browserString.substring(0, browserString.length - 2);
        var systemInfo = null;
        if (addSystemInfo) { systemInfo = JSON.stringify(window._errs); }
        var data = {
            'Name': dialog.wrapper.find('#email').val(),
            'AuthorId': Asyst.Workspace.currentUser.Id,
            'Phone': dialog.wrapper.find('#phone').val(),
            'Email': dialog.wrapper.find('#name').val(),
            'Browser': browserString,
            'URL': window.location.href,
            'SystemInfo': systemInfo
        };
        Asyst.API.Entity.save({
            entityName: 'Support',
            dataId: undefined,
            data: data,
            success: function () {
                Dialogs.Message('Ваш вопрос принят и будет обработан в скором времени.');
            }
        });
        dialog.close();
    });
    return id;
};
Dialogs.SetPassword = function (userId) {
    var dims = { width: 600 };
    dims.width = (dims.width > $(window).width() ? $(window).width() : dims.width);
    dims.width = dims.width - 12 * 2; // minus paddings
    var body = [
        '<form class="f-form" id="form-set-password" name="form-set-password">',
        '<div class="f-row">',
        '<div class="f-control__wrapper">',

        '<div class="f-control">',
        '<div class="f-control__caption f-control__caption_padding">',
        '<div class="f-control__text">Введите пароль</div>',
        '<div class="f-control__icons">',
        '<span class="f-icon f-icon_svg_star_red"></span>',
        '</div>',
        '</div>',
        '<div class="f-control__container">',
        '<input id="pass1" class="k-textbox" type="password" name="pass1" required validationMessage="Введите пароль" style="width: 100%;">',
        '</div>',
        '</div>',

        '<div class="f-control">',
        '<div class="f-control__caption f-control__caption_padding">',
        '<div class="f-control__text">Повторно введите пароль</div>',
        '<div class="f-control__icons">',
        '<span class="f-icon f-icon_svg_star_red"></span>',
        '</div>',
        '</div>',
        '<div class="f-control__container">',
        '<input id="pass2" class="k-textbox" type="password" name="pass2" required validationMessage="Повторно введите пароль" data-compare-msg="Пароли не совпадают" style="width: 100%;">',
        '</div>',
        '</div>',

        '</div>',
        '</div>',
        '</form>'
    ].join('');
    var buttons = [
        {
            text: Globa.Continue.locale(),
            primary: true,
            click: function (e) { e.sender.wrapper.find('#form-set-password').submit(); },
            close: false
        },
        {
            text: Globa.Cancel.locale(),
            click: null,
            close: null
        }
    ];
    var id = Dialog('Смена пароля', body, buttons, null, 600);
    var dialog = $('#' + id).data('kendoDialog');
    dialog.wrapper.find('#form-set-password').kendoValidator({
        rules: {
            compare: function (input) {
                var pass1 = dialog.wrapper.find('#pass1').val();
                var pass2 = input.val();
                return pass1 === pass2;
            }
        }
    });
    dialog.wrapper.find('#form-set-password').submit(function (e) {
        e.preventDefault();
        var pass2 = dialog.wrapper.find('#pass2').val();
        Asyst.API.AdminTools.setNewPassword(userId, pass2);
        dialog.close();
        Dialogs.Message('Пароль успешно изменен', 'Смена пароля');
    });
    return id;
};

// Notify ----------
var notification;
$(function () {
    var f_notification = $('<span id="f-notification"></span>');
    notification = f_notification.kendoNotification({
        allowHideAfter: 5000,
        autoHideAfter: 0,
        position: {
            top: 12,
            right: 12
        },
        show: function (e) {
            e.element.find('.f-notify__message').dotdotdot({ height: 200 });
            if (e.sender.getNotifications().length !== 1) {
                var element = e.element.parent(),
                    offset = element.offset();
                element.css({ top: offset.top + 12 });
            }
        },
        stacking: 'down',
        templates: [{
            type: 'success',
            template: '<div class="f-notify f-notify_success"><div class="f-notify__title">#= title #</div><div class="f-notify__message">#= message #</div></div>'
        }, {
            type: 'info',
            template: '<div class="f-notify f-notify_info"><div class="f-notify__title">#= title #</div><div class="f-notify__message">#= message #</div></div>'
        }, {
            type: 'warning',
            template: '<div class="f-notify f-notify_warning"><div class="f-notify__title">#= title #</div><div class="f-notify__message">#= message #</div></div>'
        }, {
            type: 'error',
            template: '<div class="f-notify f-notify_error"><div class="f-notify__title">#= title #</div><div class="f-notify__message">#= message #</div></div>'
        }],
        //width: 400
    }).data("kendoNotification");
    $('body').append(f_notification);
});
function Notify(title, text) {
    NotifyInfo(title, text);
}
function NotifyInfo(title, text) {
    notification.info({
        title: title,
        message: text
    });
}
function NotifySuccess(title, text) {
    notification.success({
        title: title,
        message: text
    });
}
function NotifyWarning(title, text) {
    notification.warning({
        title: title,
        message: text
    });
}
function NotifyError(title, text) {
    notification.error({
        title: title,
        message: text
    });
}

function Notify(title, text, image, time, sticky, cssClass, beforeOpen, afterOpen, beforeClose, afterClose) {
    //cause gritter has "if(!params.title || !params.text)" check
    title = title || " ";
    text = text || " ";

    $.gritter.add({
        title: title,
        text: text,
        image: image,
        sticky: sticky,
        time: time,
        class_name: cssClass,

        before_open: beforeOpen,
        after_open: afterOpen,
        before_close: beforeClose,
        after_close: afterClose
    });

    return false;

}

//function NotifyError(title, text, time, sticky) {
//    if (sticky == undefined)
//        sticky = true;
//    Notify(title, text, '/app/media/notify-icon-error.png', time, sticky);
//}

//function NotifyInfo(title, text, time, sticky) {
//    if (sticky == undefined)
//        sticky = true;
//    $.extend($.gritter.options, { position: 'bottom-right' });
//    Notify(title, text, '/app/media/chat-mail.png', time, sticky);
//    $.extend($.gritter.options, { position: 'top-right' });
//}

////Grey popup with yellow triangle 'Warning' icon
//function NotifyWarning(title, text, time, sticky) {
//    if (sticky === undefined)
//        sticky = true;
//    var cssClass = 'gritter-light';
//    Notify(title, text, '/app/media/notify-icon-warning.png', time, sticky, cssClass);
//}
Loader = {};

Loader.show = function (container, text) {

    if (!Loader.count)
        Loader.count = 1;
    else {
        Loader.count++;
    }

    if (!text)
        text = Globa.Loading.locale();

    var c;
    //if (container)
    //    c = $(container);
    //else
    c = $('body');
    if (Loader.count === 1)
        kendo.ui.progress(c, true, text);
};

Loader.hide = function (force) {

    if (Loader.count && Loader.count > 0)
        Loader.count--;

    if (force || !Loader.count || Loader.count === 0) {
        kendo.ui.progress($('body'), false);
        Loader.count = 0;
    }

};

//зависимые комбобоксы
Asyst.DependentCombobox = function (binding) {
    'use strict';

    var currentForm = binding.Form,
        //$dependsOnSelect = currentForm.$("select[name=" + binding.DependOn + "]"),
        dependonbinding = currentForm.Bindings[binding.DependOn],
        idIndex = binding.ElementName.indexOf("Id"),
        accessName = idIndex === (binding.ElementName.length - 2) ? binding.ElementName.substring(0, idIndex) : binding.ElementName;

    if (dependonbinding == null) return;

    function checkAndDisable() {
        var value = currentForm.Data[dependonbinding.PropertyName];
        var access = currentForm.Access,
            accessReadonly = (typeof access !== 'undefined' && access.hasOwnProperty(accessName) && access[accessName].IsReadonly);
        var enabled = !accessReadonly && value !== null && value !== undefined && value !== '';
        binding.enableInput(enabled);

    }

    function changeHandler() {
        var access = currentForm.Access,
            accessReadonly = (typeof access !== 'undefined' && access.hasOwnProperty(accessName) && access[accessName].IsReadonly);

        var enabled = !accessReadonly && !dependonbinding.isEmpty;
        binding.enableInput(enabled);

        currentForm.Update();
        binding.loadSelect(null, true, function () {
            binding.Element.change();
        });

        return true;
    };

    currentForm.onDataLoaded(checkAndDisable);
    dependonbinding.onChange(changeHandler);
    
};


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
var Timeline = {};

Timeline.Create = function (selector, width, isAdaptiveContainer) {

    if (typeof width === "undefined")
        width = 590;
    var form = Asyst.Workspace.currentForm;
    var context = form.Data;
    isAdaptiveContainer = isAdaptiveContainer || false;

    Asyst.protocol.send(
        '/phase/' + form.EntityName + "/" + form.Data.ActivityId,
        "GET",
        null,
        true,
        function (result) {
            form.CurrentPhaseName = "";
            form.NextPhaseName = "";

            if (jQuery.isArray(result) && result.length > 0) {

                result.forEach(function (item) {
                    item.finish = item.finish || '';
                });

                var start = Asyst.date.parse(result[0].finish.substr(0, 10));
                if (start) {
                    if (start.getMonth() < 2) {
                        start.setFullYear(start.getFullYear() - 1);
                        start.setMonth(11 + start.getMonth() - 1);
                    }
                    else
                        start.setMonth(start.getMonth() - 2);

                    start = Asyst.date.format(start);
                }

                for (var i = 0; i < result.length; i++) {
                    var phase = result[i];
                    if (phase.status == 2 || phase.status == -1) {
                        form.CurrentPhaseName = phase.name;
                        if (result[i + 1])
                            form.NextPhaseName = result[i + 1].name;
                    }
                }

                //пока комментируем добавление липовой строчки "за два месяца до"
                //result.unshift({ name: "", tooltip: "", finish: start, status: 0 });
                try {
                    var options = { width: width, array: result, isAdaptiveContainer: isAdaptiveContainer };
                    $(selector).empty();
                    $(selector).timeline(options);
                } catch (error) {
                    void (0);
                }
            }
        }, function (jqXHR, textStatus, errorThrown) {
            if (Asyst.GlobalPageStateStopped) {
                //пробуем скипать ошибки после выгрузки страницы
                return;
            }
            ErrorHandler(Globa.ErrorLoad.locale(), textStatus);
        }
    );
};

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
	if (tab)
		$tab = tab;
	else if (Asyst.Workspace.currentForm !== undefined) {
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
