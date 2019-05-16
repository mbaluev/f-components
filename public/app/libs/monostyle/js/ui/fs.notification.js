var notification;
$(function(){
    notification = $("#f-notification").kendoNotification({
        allowHideAfter: 0,
        autoHideAfter: 0,
        position: { top: 12, right: 12 },
        show: function(e) {
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
        width: 350
    }).data("kendoNotification");
});