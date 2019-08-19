/*
 Заменяет на расширенных формах пользователей в ролях на более информативный шаблон
 */
$(document).on('AsystFormAfterOpen', function (e, currentForm) {
    if (!currentForm.Model || !currentForm.Model.roles || currentForm.Model.roles.length === 0 || currentForm.$('#RoleDivContent').length === 0) return;
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
                currentForm.$('#RoleDivContent [name=' + role.Identifier + ']').empty();
                for (var i = 0; i < data.length; i++) {
                    users.forEach(function (user) {
                        if (data[i].AccountId === user.AccountId) {
                            currentForm.$('#RoleDivContent [name=' + role.Identifier + ']')
                                .addClass('userWithPhoto')
                                .append(data[i].IsGroup ? make_content_group(data[i]) : make_content_user(data[i]));
                        }
                    });
                }
            }
            /*
            if ($.fn.niceScroll) {
                currentForm.$('#RoleDivContent')
                    .niceScroll({
                        cursorcolor: "#58c9f3",
                        cursorborder: "0px solid #fff",
                        cursorborderradius: "0px",
                        cursorwidth: "3px"
                    });
            }
            */
        }
    });
    function make_content_user(userdata) {
        var $content_user = $('<div class="user"></div>');
        var fullname = '';
        if (userdata.FullName) fullname = userdata.FullName.replace(/"/g, "'") + '<br><br>';
        var title = '';
        if (userdata.Title) title = userdata.Title.replace(/"/g, "'") + '<br><br>';
        var phone = '';
        if (userdata.Phone) phone = userdata.Phone.replace(/"/g, "'") + '<br><br>';
        var company = '';
        if (userdata.Company) company = userdata.Company.replace(/"/g, "'") + '<br><br>';
        var $content_user_a = $('<a class="user-tooltip" href="/User/form/auto/' +
            userdata.AccountId +
            '?back=back" ' +
            'data-tooltip="' +
            '<b>ФИО:</b><br> ' + fullname +
            '<b>Должность:</b><br> ' + title +
            '<b>Телефон:</b><br> ' + phone +
            '<b>Подразделение:</b><br> ' + company +
            '"></a>').fTooltip();
        var $content_user_name = $('<div class="name">' + fullname + '&nbsp;</div>');

        var f_icon = $('<span class="f-icon"></span>');
        if (userdata.Url) {
            f_icon.addClass('f-spinner');
            var img = document.createElement('img');
            img.onload = function(){
                f_icon.removeClass('f-spinner');
                f_icon.addClass('f-icon_photo').css({
                    'background-image': 'url("' + userdata.Url + '")'
                });
            };
            img.onerror = function(){
                f_icon.removeClass('f-spinner');
                if (userdata.IsGroup) {
                    f_icon.addClass('m-i-users');
                } else {
                    f_icon.addClass('m-i-user');
                }
            };
            img.src = userdata.Url;
        } else {
            if (userdata.IsGroup) {
                f_icon.addClass('m-i-users');
            } else {
                f_icon.addClass('m-i-user');
            }
        }
        var $content_user_img = f_icon;

        if (userdata.Email) {
            var $content_user_email = $('<div class="email"></div>');
            var $content_user_email_a = $('<a href="mailto:' + userdata.Email + '">' + userdata.Email + '&nbsp;</a>');
            $content_user_email.append($content_user_email_a);
        } else {
            var $content_user_email = $('<div class="email"><нет почты>&nbsp;</div>');
        }

        $content_user_a.append($content_user_img);
        $content_user_a.tooltip();
        $content_user.append($content_user_a, $content_user_name, $content_user_email);
        return $content_user;
    };
    function make_content_group(groupdata) {
        if (!groupdata.Url)
            groupdata.Url = '/app/media/img_group.png';
        var $content_group = $('<div class="user"></div>');
        var fullname = '';
        if (groupdata.FullName) fullname = groupdata.FullName.replace(/"/g, "'") + '<br><br>';
        var title = '';
        if (groupdata.Title) title = groupdata.Title.replace(/"/g, "'") + '<br><br>';
        var phone = '';
        if (groupdata.Phone) phone = groupdata.Phone.replace(/"/g, "'");
        var $content_group_a = $('<a class="user-tooltip" href="/OrgUnit/form/auto/' +
            groupdata.AccountId +
            '?back=back" data-trigger="hover" data-toggle="tooltip" data-html="true" data-placement="right" ' +
            'title="<b>Руководитель</b><br><br>' +
            '<b>ФИО:</b><br> ' + fullname +
            '<b>Должность:</b><br> ' + title +
            '<b>Телефон:</b><br> ' + phone +
            '"></a>');
        var $content_group_img = $('<img class="img" src="' + groupdata.Url + '">');
        var $content_group_name = $('<div class="name group">' + groupdata.Name + '&nbsp;</div>');
        $content_group_a.append($content_group_img);
        $content_group_a.tooltip();
        $content_group.append($content_group_a, $content_group_name);
        return $content_group;
    };
});