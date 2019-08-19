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
