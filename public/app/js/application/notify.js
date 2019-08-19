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