/*-----------------------*/
/*--- функции импорта ---*/
/*-----------------------*/
Asyst.importMPP = {};
Asyst.importMPP.Create = function (options) {    
    options = $.extend({
        title: 'Импорт календарного плана (mpp-файла)',
        validationComplete: function () { },
        loadComplete: function () { }
    }, options);
	uploadMpp();

    function uploadMpp() {
        var modalId = 'modal-upload-mpp-' + guid();

        var profile_str = '<select id="mppProfile" name="mppProfile" data-placeholder="Профиль" style="width:100%;">';
        options.profiles.forEach(function (profile) {
            profile_str += '<option value="' + profile.id + '">' + profile.name + '</option>';
        });
        profile_str += '</select>';

        var modal_str = '<div class="modal"  id="' + modalId + '">' +
                        //'  <input name="activityId" type="hidden" value="' + options.activityId + '"/>' +
                        '  <div class="modal-header">' +
                        '    <a class="close" data-dismiss="modal">×</a>' +
                        '    <h3>' + options.title + '</h3>' +
                        '  </div>' +

                        '  <div class="modal-body form-horizontal no-padding">' +
                        '    <section class="top">' +
                        '      <div class="section-head">Профиль загрузки</div>' +
                        '      <div class="section-content">' + profile_str + '</div>' +
                        '    </section>'+

                        '    <section class="file-uploader">' +
                        '      <div class="section-content">' +
                        '        <div id="file-uploader"></div>' +
                        '      </div>' +
                        '    </section>' +
                        '  </div>' +

                        '  <div class="modal-footer">' +
                        //'    <a href="#" class="btn btn-primary" id="btn-submit">' + Globa.Save.locale() + '</a>' +
                        '    <a href="#" class="btn" data-dismiss="modal">' + Globa.Cancel.locale() + '</a>' +
                        '  </div>' +
                        '</div>';
        var $modal = $(modal_str);
        $modal.find("select").kendoDropDownList();

        $modal.modal({ backdrop: 'static', show: true });
        $('[rel="tooltip"]').tooltip({ container: 'body' });
        var uploader = new qq.FileUploader({
            element: $modal.find('#file-uploader')[0],
            allowedExtensions: ['mpp'],
            action: '/office/import/Start',
            onComplete: function (id, fileName, response) {
                $modal.modal('hide');
                options.validationComplete(response);
                showMppValidation(response);

            },
            debug: false,
            onSubmit: function (id, filename) {
                uploader.setParams({ activityId: options.activityId, configName: $modal.find('#mppProfile').val() });		
            },
            showMessage: function (message) {
                alert(message);
            }
        });
    }

    function showMppValidation(results) {
        var modalid = 'modal-show-mpp-validation-' + guid();

        var info_str = '';
        if (results.FileName)
            info_str += '<div class="file-name">' + results.FileName + '</div>';
        if (results.ConfigName)
            info_str += '<div class="config-name">' + results.ConfigName + '</div>';

        var errors_str = '<table class="table"><tbody>';
        if (results.Errors.length > 0) {
            results.Errors.forEach(function (item, i, arr) {
                errors_str += '<tr>';
                errors_str += '<td>';
                if (item.Name)
                    errors_str += '<div class="task-name">' + item.Name  + '</div>';
                item.Messages.forEach(function (error) {
                    errors_str += '<div class="task task-error">' + error + ';</div>';
                });
                errors_str += '</td>';
                errors_str += '</tr>';
            });
        } else {
            errors_str += '<tr>';
            errors_str += '<td><div>Ошибок не выявлено.</div></td>';
            errors_str += '</tr>';
        }
        errors_str += '</tbody></table>';

        var warnings_str = '<table class="table"><tbody>';
        if (results.Warnings.length > 0) {
            results.Warnings.forEach(function (item, i, arr) {
                warnings_str += '<tr>';
                warnings_str += '<td>';
                if (item.Name)
                    warnings_str += '<div class="task-name">' + item.Name + '</div>';
                item.Messages.forEach(function (error) {
                    warnings_str += '<div class="task task-warning">' + error + ';</div>';
                });
                warnings_str += '</td>';
                warnings_str += '</tr>';
            });
        } else {
            warnings_str += '<tr>';
            warnings_str += '<td><div>Предупреждений не выявлено.</div></td>';
            warnings_str += '</tr>';
        }
        warnings_str += '</tbody></table>';

        var modal_str = '<div class="modal fade"  id="' + modalid + '">' +
                        '  <div class="modal-header">' +
                        '    <a class="close" data-dismiss="modal">×</a>' +
                        '    <h3>' + options.title + '</h3>' +
                        '  </div>' +

                        '  <div class="modal-body form-horizontal no-padding bg-footer">' +
                        '    <section>' +
                        '      <div class="section-content">' + info_str + '</div>' +
                        '    </section>' +
                        '    <section class="error panel">' +
                        '      <div class="section-head">Ошибки подготовки импорта:</div>' +
                        '      <div class="section-content-table" id="valid-errors">' + errors_str + '</div>' +
                        '    </section>' +
                        '    <section class="warning panel">' +
                        '      <div class="section-head">Предупреждения подготовки импорта:</div>' +
                        '      <div class="section-content-table" id="valid-warnings">' + warnings_str + '</div>' +
                        '    </section>' +
                        '  </div>' +

                        '  <div class="modal-footer">' +
                        '    <a href="#" class="btn pull-left" id="btn-export">Сохранить замечания в файл</a>' +
                        (results.Errors.length === 0 ? '    <a href="#" class="btn btn-primary" id="btn-submit">' + Globa.Continue.locale() + '</a>' : '') +
                        '    <a href="#" class="btn" data-dismiss="modal">' + Globa.Cancel.locale() + '</a>' +
                        '  </div>' +
                        '</div>';
        var $modal = $(modal_str);
        
            $modal.find('#btn-submit').bind('click', function () {
                $modal.modal('hide');
                Loader.show(null, options.title);
                Asyst.protocol.send('/office/import/Continue?SessionId=' + results.SessionId, 'get', null, true, function (data) {
                    Loader.hide();
                    options.loadComplete(data);
                    showMppImport(data);
                }, function (err) {
                    Loader.hide();
                });

            });
        
        $modal.find('#btn-export').bind('click', function () {
            var txt = '';
            if (results.Errors.length > 0) {
                txt = 'Ошибки подготовки импорта:\r\n';
                results.Errors.forEach(function (item, i, arr) {
                    if (item.Name)
                        txt += ('\t' + item.Name + '\r\n');
                    item.Messages.forEach(function (error) {
                        txt += ('\t\t' + error + '\r\n');
                    });
                });
            } else {
                txt += 'Ошибок не выявлено.\r\n';
            }

            txt += '\r\n';

            if (results.Warnings.length > 0) {
                txt += 'Предупреждения подготовки импорта:\r\n';
                results.Warnings.forEach(function (item, i, arr) {
                    if (item.Name)
                        txt += ('\t' + item.Name + '\r\n');
                    item.Messages.forEach(function (error) {
                        txt += ('\t\t' + error + '\r\n');
                    });
                });
            } else {
                txt += 'Предупреждений не выявлено.';
            }

            kendo.saveAs({
                dataURI: "data:text/plain," + txt,
                fileName: window.document.title.substring(0, 30) + ' mpp import ' + Asyst.date.format(new Date(), 'yyyyMMddHHmm') + '.txt'
            });
           
        });
        $modal.modal({ backdrop: 'static', show: true });
        $modal.find('#valid-errors').panelscroll({ cursorcolor: '#ff6666', autohidemode: true });
        $modal.find('#valid-warnings').panelscroll({ cursorcolor: '#ff9300', autohidemode: true });
        $('[rel="tooltip"]').tooltip({ container: 'body' });
    }

    function showMppImport(results) {		
        var modalid = 'modal-show-mpp-validation-' + guid();

        var info_str = '';
        if (results.FileName)
            info_str += '<div class="file-name">' + results.FileName + '</div>';
        if (results.ConfigName)
            info_str += '<div class="config-name">' + results.ConfigName + '</div>';

        var results_str = '<table class="table"><tbody>';
        results.Errors.concat(results.Warnings.concat(results.Results)).forEach(function (item, i, arr) {
            results_str += '<tr>';
            results_str += '<td>';
            if (item.Name)
                results_str += '<div class="task-name">' + item.Name + '</div>';
            if (item.Messages.length > 0) {
                item.Messages.forEach(function (result) {
                    results_str += '<div class="task task-error">' + result + ';</div>';
                });
            }
            //else {
            //    results_str += '<div class="task task-ok">Ok</div>';
            //}
            results_str += '</td>';
            results_str += '</tr>';
        });
        results_str += '</tbody></table>';

        var modal_str = '<div class="modal fade"  id="' + modalid + '">' +
                        '  <div class="modal-header">' +
                        '    <a class="close" data-dismiss="modal">×</a>' +
                        '    <h3>' + options.title + '</h3>' +
                        '  </div>' +

                        '  <div class="modal-body form-horizontal no-padding bg-footer">' +
                        '    <section>' +
                        '      <div class="section-content">' + info_str + '</div>' +
                        '    </section>' +
                        '    <section class="info panel double">' +
                        '      <div class="section-head">Результат импорта плана:</div>' +
                        '      <div class="section-content-table" id="import-info">' + results_str + '</div>' +
                        '    </section>' +
                        '  </div>' +

                        '  <div class="modal-footer">' +
                        '    <a href="#" class="btn" id="btnImportClose" data-dismiss="modal">' + Globa.Close.locale() + '</a>' +
                        '  </div>' +
                        '</div>';
        var $modal = $(modal_str);
        $modal.modal({ backdrop: 'static', show: true });
        $modal.find('#import-info').panelscroll({ cursorcolor: '#58c9f3', autohidemode: true });
        $('[rel="tooltip"]').tooltip({ container: 'body' });
        $modal.find('#btnImportClose').on('click', function () {
			options.context.Gantt.reload();
		});
    }
}
/*------------------------*/
/*--- /функции импорта ---*/
/*------------------------*/
