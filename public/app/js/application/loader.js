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
