/*
 Заменяет на расширенных формах пользователей в ролях на более информативный шаблон
 */
$(document).on('AsystFormAfterOpen', function (e, currentForm) {
    if (!currentForm.Model || !currentForm.Model.roles || currentForm.Model.roles.length === 0 || currentForm.$('#Roles').length === 0) return;
    Asyst.API.DataSet.load({
        name: 'AllUsersForRole',
        data: {
            DataId: currentForm.EntityId,
            EntityName: currentForm.EntityName
        },
        success: function (_, data) {
            for (var key in currentForm.Model.roles) {
                var role = currentForm.Model.roles[key];
                var users = currentForm.Data[role.Identifier];
                var f_control = currentForm.$('#Roles [name=' + role.Identifier + ']').closest('.f-control');
                f_control.find('.f-control__container').remove();
                for (var i = 0; i < data.length; i++) {
                    users.forEach(function (user) {
                        if (data[i].AccountId === user.AccountId) {
                            make_content(f_control, data[i]);
                        }
                    });
                }
            }
        }
    });
    function make_content(f_control, data){
        var f_control__container = $('<div class="f-control__container f-control__container_direction_row"></div>'),
            f_control__icons = $('<div class="f-control__icons"></div>'),
            f_icon = $('<span class="f-icon"></span>'),
            f_control__text = $('<a class="f-control__text"></a>'),
            tooltip;

        if (data.FullName) data.FullName = data.FullName.replace(/"/g, "'");
        if (data.Title) data.Title = data.Title.replace(/"/g, "'");
        if (data.Phone) data.Phone = data.Phone.replace(/"/g, "'");
        if (data.Company) data.Company = data.Company.replace(/"/g, "'");
        if (data.Email) data.Email = data.Email.replace(/"/g, "'");
        if (data.Url) {
            f_icon.addClass('f-spinner');
            var img = document.createElement('img');
            img.onload = function(){
                f_icon.removeClass('f-spinner');
                f_icon.addClass('f-icon_photo').css({
                    'background-image': 'url("' + data.Url + '")'
                });
            };
            img.onerror = function(){
                f_icon.removeClass('f-spinner');
                if (data.IsGroup) {
                    f_icon.addClass('m-i-users');
                } else {
                    f_icon.addClass('m-i-user');
                }
            };
            img.src = data.Url;
        } else {
            if (data.IsGroup) {
                f_icon.addClass('m-i-users');
            } else {
                f_icon.addClass('m-i-user');
            }
        }
        if (data.IsGroup) {
            f_control__text.attr('href', '/OrgUnit/form/auto/' + data.AccountId + '?back=back');
            tooltip = [
                '<b>Руководитель</b><br><br>',
                (data.FullName ? '<b>ФИО: </b>' + data.FullName + '<br>' : ''),
                (data.Title ? '<b>Должность: </b>' + data.Title + '<br>' : ''),
                (data.Phone ? '<b>Телефон: </b>' + data.Phone + '<br>' : '')
            ].join('');
        } else {
            f_control__text.attr('href', '/User/form/auto/' + data.AccountId + '?back=back');
            tooltip = [
                (data.FullName ? '<b>ФИО: </b>' + data.FullName + '<br>' : ''),
                (data.Title ? '<b>Должность: </b>' + data.Title + '<br>' : ''),
                (data.Phone ? '<b>Телефон: </b>' + data.Phone + '<br>' : ''),
                (data.Email ? '<b>Email: </b>' + data.Email + '<br>' : '')
            ].join('');
        }

        f_control.append(
            f_control__container.append(
                f_control__icons.append(f_icon),
                f_control__text.append(data.FullName)
            ).attr('data-tooltip', tooltip).fTooltip('activate')
        );
    }
});
