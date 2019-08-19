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
