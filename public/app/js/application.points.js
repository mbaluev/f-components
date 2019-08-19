/* В данном файле должны лежать функции для взаимодействия с этапами/работами/КТ,
 * которые должны быть в ТГР, но не в ядре.
 * 
 * P.S. Пожалуйста, удаляйте debugger
 * 
 * have a nice day
 */

/* ==============================================================================================================================
   Компонент для создания обязательных контрольных точек
   ============================================================================================================================== */

jQuery.fn.requiredPoints = function (options) {

    var settings = jQuery.extend({
        title: Globa.PointTitle.locale(),
        id: 0,
        pointTemplates: []
    }, options);


    var entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    //декодирование строки для html
    function escapeHtml(string) {
        return String(string).replace(/[&<>"'`=\/]/g, function (s) {
            return entityMap[s];
        });
    }

    return this.each(function () {

        var el = $(this);
        var form = Asyst.Workspace.currentForm;

        var selector = el[0].nodeName;

        var id = el.attr("id");
        if (id) {
            selector += "#" + id;
        }

        var classNames = el.attr("class");
        if (classNames) {
            selector += "." + $.trim(classNames).replace(/\s/gi, ".");
        }

        var $row = $('<div class="row"></div>');
        var cnt = 0;

        if (settings.pointTemplates && settings.pointTemplates.length > 0) {
            var lastPhaseId = -1;

            var $stage_col = $('<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"></div>');
            $stage = $('<div class="stage all-done"><div class="stage-name"><div class="text">' + Globa.FinishPointsCreated.locale() + '</div></div></div>');

            for (var i = 0; i < settings.pointTemplates.length; i++) {
                var pointTemplate = settings.pointTemplates[i];

                var flag = true;
                var isRequired = pointTemplate.IsRequired && form.Data.ActivityPhaseId == pointTemplate.ActivityPhaseId;
                var isTooltip = pointTemplate.Tooltip != null && pointTemplate.Tooltip != "";
                if (typeof form !== "undefined" && form.Access) {
                    if (form.Access.hasOwnProperty('point' + pointTemplate.PointTemplateId)) {
                        flag = form.Access['point' + pointTemplate.PointTemplateId].IsVisible;
                        isRequired = (form.Access['point' + pointTemplate.PointTemplateId].IsRequired) || isRequired;
                    }
                }
                if (flag) {

                    //создаем имя точки
                    var $point_name = $('<div class="point-name" rel="tooltip" data-container="body" data-html="true" title="' + escapeHtml(pointTemplate.Tooltip || "") + '"></div>');
                    var $point_text = $('<span class="text">' + pointTemplate.Name + '</span>');
                    var $info_icon = $('<span class="info-icon"></span>');
                    if (isTooltip) { $point_text.append($info_icon) };
                    $point_name.append($point_text);

                    //создаем поле ввода даты
                    var $point_date = $('<div class="point-date"></div>');

                    var $field_name = $('<span class="field-name">' + Globa.Plan.locale() + '</span>');

                    if (!pointTemplate.PlanDate) {
                        var $field_input = $('<input id="requiredPointTemplate' + pointTemplate.PointTemplateId + 'PlanDate" ' +
                            'name="requiredPointTemplate' + pointTemplate.PointTemplateId + 'PlanDate" ' +
                            'type="text" class="date-picker" data-datepicker="datepicker">');
                        cnt++;
                    } else {
                        var $field_input = $('<span class="field-name">' + Asyst.date.format(pointTemplate.PlanDate) + '</span>');
                    }
                    var $required = $('<span class="required-phase-input" rel="tooltip" data-container="body" title="' + Globa.JSRequiredPhase.locale() + '"></span>');
                    if (isRequired) { $field_name.append($required); }
                    $point_date.append($field_name, $field_input);

                    //если начались точки нового этапа - пишем предыдущий этап и создаем заголовок нового этапа
                    if (lastPhaseId !== pointTemplate.ActivityPhaseId) {

                        //пишем предыдущий этап
                        if (lastPhaseId !== -1) {
                            $stage_col.append($stage);
                            $row.append($stage_col);
                        }

                        //создаем заголовок нового этапа
                        $stage_col = $('<div class="col-lg-2 col-md-4 col-sm-6 col-xs-6"></div>');
                        $stage = $('<div class="stage stage' + pointTemplate.PhasePosition + '"></div>');

                        /*
                        if (pointTemplate.PlanDate) {
                          $stage.addClass('created');
                          }
                          */

                        var $stage_name = $('<div class="stage-name"></div>');
                        var $stage_arrow = $('<span class="c-btn arrow-right"></span>');
                        var $stage_text = $('<span class="text">' + pointTemplate.PhasePosition + '. ' + pointTemplate.ActivityPhaseName + '</span>');
                        $stage_name.append($stage_arrow, $stage_text);
                        $stage.append($stage_name, $point_name, $point_date);

                        lastPhaseId = pointTemplate.ActivityPhaseId;
                    } else {
                        //пишем точку и поле ввода даты в этап
                        $stage.append($point_name, $point_date);
                    }
                }
            }
            $stage_col.append($stage);
            $row.append($stage_col);
        }

        if (cnt > 0) {
            el.append($row);
            el.find('.date-picker').kendoDatePicker({
                format: Asyst.date.defaultDateFormat,
                dateInput: true
            });
            el.find('select').kendoDropDownList();
            el.data('requiredPoints', settings);

            //добавляем data-html для нового тултипа bootstrapа
            el.find('[rel="tooltip"]').attr('data-html', 'true');
            el.find('[rel="tooltip"]').tooltip();
            el.find('[rel="tooltip"]').on('hidden', function () { return false; });
        } else {
            $('#PointCreation').css('display', 'none');
        }

    });
};

var copyRoles = function (from, to) {
    for (var ind in from) {
        //проверяем, что свойство - массив с пользователями - скорее всего роль
        if (from[ind] !== null && from[ind].constructor == Array) {
            if (from[ind].length > 0 && from[ind][0].hasOwnProperty("classname")) {
                if ((from[ind][0]["classname"] == "Account" || from[ind][0]["classname"] == "User" || from[ind][0]["classname"] == "OrgUnit") && from.hasOwnProperty(ind + "Id")) {
                    var add = {};
                    add[ind + "Id"] = from[ind + "Id"];
                    to = jQuery.extend(to, add);
                }
            }
        }
    }
};

var mergeRoles = function (pointTemplate, formData, data) {
    var union_arrays = function (x, y) {
        if (typeof x === "undefined")
            x = [];
        if (typeof y === "undefined")
            y = [];

        var obj = {};
        for (var i = x.length - 1; i >= 0; --i)
            obj[x[i]] = x[i];
        for (var i = y.length - 1; i >= 0; --i)
            obj[y[i]] = y[i];
        var res = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k))  // <-- optional
                res.push(obj[k]);
        }
        return res;
    };

    for (var ind in pointTemplate) {
        //поле есть и непустое
        if (pointTemplate.hasOwnProperty(ind) && (pointTemplate[ind] != null)) {
            //поле - действительно роль
            if ((ind.indexOf('Role') == 0) && pointTemplate[ind].hasOwnProperty('entityname') && (pointTemplate[ind].entityname == 'Role'))
                //значение поля есть
                if (pointTemplate[ind].hasOwnProperty('Identifier') && (pointTemplate[ind].Identifier != null))
                    //данные формы содержат нужную роль
                    if (formData.hasOwnProperty(pointTemplate[ind].Identifier) && formData.hasOwnProperty(pointTemplate[ind].Identifier + "Id")) {
                        var add = {};
                        add[ind.substring(4) + "Id"] = formData[pointTemplate[ind].Identifier + "Id"];
                        data = jQuery.extend(data, add);
                    }
        }

        //множественные поля
        if (pointTemplate.hasOwnProperty(ind) && (pointTemplate[ind] != null)) {
            //поле - действительно роль
            if ((ind.indexOf('Role') == 0) && ind.indexOf('PointTemplateItems' != -1) &&
                pointTemplate[ind].constructor == Array && pointTemplate[ind].length > 0 &&
                pointTemplate[ind][0].hasOwnProperty('entityname') && (pointTemplate[ind][0].entityname == 'Role') &&
                pointTemplate.hasOwnProperty(ind.substring(0, ind.indexOf('Items')))) {
                var fieldName = ind.substr(4, ind.indexOf('PointTemplateItems') - 4) + "Id";
                var addM = {};
                addM[fieldName] = data[fieldName];
                for (var i = 0; i < pointTemplate[ind].length; i++) {
                    var roleItem = pointTemplate[ind][i];
                    if (roleItem.hasOwnProperty('Identifier') && (roleItem.Identifier != null))
                        //данные формы содержат нужную роль
                        if (formData.hasOwnProperty(roleItem.Identifier) && formData.hasOwnProperty(roleItem.Identifier + "Id")) {
                            var unionArr = union_arrays(addM[fieldName], formData[roleItem.Identifier + "Id"]);
                            addM[fieldName] = unionArr;
                        }
                }
                data = jQuery.extend(data, addM);
            }
        }
    }
};

function RequiredPoints(selector, options) {

    Asyst.API.View.load({
        viewName: 'PointTemplatesRequiredView',
        data: Asyst.Workspace.currentForm.Data,
        success: function (data) {
            $(selector).empty();
            $(selector).requiredPoints($().extend({ id: Asyst.Workspace.currentForm.EntityId, pointTemplates: data.data }, options));
        }
    });

}

function SaveRequiredPoints(selector) {
    var settings = $(selector).data("requiredPoints");
    var form = Asyst.Workspace.currentForm;
    var formData = form.Data;
    var data = [];
    var inputsWithPlanDate = [];
    var pointTemplate;
    var testDate;
    var i;
    var isOverwrites;
    var filledPlanDates = 0;

    var $saveButton = form.$('#requiredPointsSave');

    if ($saveButton.hasClass('disabled')) return;
    $saveButton.addClass('disabled');

    var closeButton = [{
        cls: 'btn btn-primary',
        text: 'Закрыть',
        click: function () {
            $saveButton.removeClass('disabled');
        }
    }];

    Asyst.API.View.load({
        async: true,
        viewName: 'PointTemplatesRequiredView',
        data: Asyst.Workspace.currentForm.Data,
        success: function (inData) {
            settings.pointTemplates = inData.data;

            var arrPromise = [];
            settings.pointTemplates.reduce(function (current, next) {
                current.push(Asyst.API.Entity.load({ entityName: "PointTemplate", dataId: next.PointTemplateId, async: true }));
                return current;
            }, arrPromise);
            $.when.apply(null, arrPromise).done(function () {
                var dataArray = (arguments.length === 3 && arguments[1] === "success" ? [arguments] : Array.apply(null, arguments));
                var dataFormPointTemplates = dataArray.map(function (item) {
                    return item[0];
                });

                for (i = 0; i < settings.pointTemplates.length; i++) {
                    pointTemplate = settings.pointTemplates[i];

                    var $requiredPointTemplate = $('#' + form.FormName + ' #requiredPointTemplate' + pointTemplate.PointTemplateId + 'PlanDate');

                    var dateFromInputForm = Asyst.date.parse($requiredPointTemplate.val());

                    if (dateFromInputForm !== null && pointTemplate.PlanDate) {
                        isOverwrites = true;
                    }

                    if (pointTemplate.PlanDate) {
                        pointTemplate.TestDate = pointTemplate.PlanDate;
                    } else {
                        pointTemplate.TestDate = dateFromInputForm;
                    }

                    if (!pointTemplate.PlanDate) {
                        var planDate = Asyst.date.parse($requiredPointTemplate.val());
                        if (planDate) {
                            var j;
                            for (j = i - 1; j >= 0; j--) {
                                testDate = settings.pointTemplates[j].TestDate;
                                //введенная дата меньше чем даты точек предыдущих этапов
                                if (testDate && planDate < testDate && settings.pointTemplates[j].PhasePosition < pointTemplate.PhasePosition) {
                                    Dialog(Globa.Error.locale()
                                        , Globa.ErrorDatePoint.locale() + ' "' + pointTemplate.Name + '" ' + Globa.ErrorLesserThen.locale() + ' "' + settings.pointTemplates[j].Name + '".'
                                        , closeButton);
                                    return;
                                }
                            }
                            for (j = i + 1; j < settings.pointTemplates.length; j++) {
                                testDate = settings.pointTemplates[j].TestDate;
                                //введенная дата больше чем даты точек следующих этапов или завершающей этап точки
                                if (testDate && planDate > testDate && (settings.pointTemplates[j].PhasePosition > pointTemplate.PhasePosition || settings.pointTemplates[j].IsPhaseFinish == 1)) {
                                    Dialog(Globa.Error.locale()
                                        , Globa.ErrorDatePoint.locale() + ' "' + pointTemplate.Name + '" ' + Globa.ErrorGreaterThen.locale() + ' "' + settings.pointTemplates[j].Name + '".'
                                        , closeButton);
                                    return;
                                }
                            }

                            pointTemplate.TestDate = planDate;

                            var dataFormPointTemplate = dataFormPointTemplates[i];

                            data[data.length] = {
                                ParentId: formData.ActivityId,
                                ProjectId: formData.ActivityId,
                                BlockId: formData.BlockId,
                                FunctionId: formData.FunctionId,
                                PointTemplateId: dataFormPointTemplate.PointTemplateId,
                                PlanDate: planDate,
                                ForecastDate: planDate,
                                Name: dataFormPointTemplate.Name,
                                PointLevelId: dataFormPointTemplate.PointLevelId,
                                LeaderId: formData.LeaderId,
                                OwnerId: formData.OwnerId,
                                ResponsibleAssistantId: formData.ResponsibleAssistantId,
                                IsMilestone: 1,
                                PointTypeId: dataFormPointTemplate.PointTypeId,
                                ApprovingDocumentId: dataFormPointTemplate.ApprovingDocumentId //4
                            };
                            copyRoles(dataFormPointTemplate, data[data.length - 1]);
                            mergeRoles(dataFormPointTemplate, formData, data[data.length - 1]);

                            inputsWithPlanDate[i] = { Id: pointTemplate.PointTemplateId, PlanDate: planDate };
                        }
                    }

                    if (pointTemplate.TestDate) filledPlanDates++;
                }


                {
                    var errorCount = 0;

                    var finish = function () {
                        if (errorCount > 0)
                            NotifyError(Globa.CreatingError.locale(), " ");
                        form.Reset();
                        form.$('#TimelinePanelPoint').show();

                        if (!isOverwrites) {
                            if (filledPlanDates > 4) {
                                form.$('#PointCreation').hide();
                            }
                            else {
                                inputsWithPlanDate.forEach(function (input) {
                                    form.$('#requiredPointTemplate' + input.Id + 'PlanDate')
                                        .replaceWith('<span class="field-name">' + Asyst.date.format(input.PlanDate) + '</span>');
                                });
                            }
                        }

                        $saveButton.removeClass('disabled');

                        if (window["ganttframe"]) {
                            ganttframe.Gantt.reload();
                            ganttframe.makeToolbar();
                            ganttframe.makeTooltips();
                            ganttframe.fitGanttViewHeight();
                            ganttframe.Loader.hide();
                        }
                    };

                    if (isOverwrites) {
                        var buttonForDialog = [{
                            text: 'Обновить страницу',
                            click: finish
                        }];

                        Dialog(Globa.Error.locale(), "Ошибка. Некоторые обязательные контрольные точки уже созданы в системе, вероятно, это произошло в другой вкладке или точки создал другой пользователь. Обновите страницу.", buttonForDialog)

                    } else if (data.length == 0) {

                        Dialog(Globa.Error.locale(), "Ошибка. Введите даты контрольных точек", closeButton);

                    } else {
                        var batchPoint = new Asyst.API.Entity.Batch("PointEditForm");
                        for (var d in data) {
                            batchPoint.add(null, data[d]);
                        }
                        batchPoint.save(function () {
                            finish();
                        }, function () {
                            errorCount++;
                            finish();
                        }, true);
                    }
                }

            });

        }
    });
}



/* ==============================================================================================================================
   Компонент для создания любых контрольных точек
   ============================================================================================================================== */

jQuery.fn.quickPointCreator = function (options) {
    var settings = jQuery.extend({
        title: Globa.OtherPointTitle.locale(),
        id: 0,
        pointTemplates: [],
        isPlanDateRequired: true,
        isPlanDateVisible: true,
        isPointTemplateRequired: false,
        isPointTemplateVisible: true,
        filter: []
    }, options);

    return this.each(function () {

        var el = $(this);
        var form = Asyst.Workspace.currentForm;

        var selector = '#' + form.FormName + ' ' + el[0].nodeName;

        var id = el.attr("id");
        if (id) {
            selector += "#" + id;
        }

		var uid = 'qpc' + guid();

        var classNames = el.attr("class");
        if (classNames) {
            selector += "." + $.trim(classNames).replace(/\s/gi, ".");
        }

        var s = '';
        s += '<div class="well quick-point-creator">';
        s += '<table class="quick-point-creator-header table table-condensed">';
        s += '	<thead>';
        s += '		<tr>';
        s += '			<th>' + settings.title + '</th>';
        s += '		</tr>';
        s += '	</thead>';
        s += '</table>';
        s += '<div class="quick-point-creator-body collapse in">';
        s += '	<table class="table table-condensed quick-point-creator-content">';
        s += '		<tr>';
        if (settings.isPointTemplateVisible) {
            s += '			<td colspan="2">';
            s += '			    <div class="control-group">';
            s += '				    <label for="' + uid + 'PointTemplateId">' + Globa.TemplatePoints.locale() + '</label>';
            s += '				    <select class="chosen-select-deselect" style="width: 300px;" id="' + uid + 'PointTemplateId">';
            s += '				        <option value=""></option>';

            for (var i = 0; i < settings.pointTemplates.length; i++) {
                var pointTemplate = settings.pointTemplates[i];
                var flag = true;
                var isRequired;
                if (form.Access) {
                    if (form.Access.hasOwnProperty('point' + pointTemplate.PointTemplateId)) {
                        flag = form.Access['point' + pointTemplate.PointTemplateId].IsVisible;
                        isRequired = form.Access['point' + pointTemplate.PointTemplateId].IsRequired;
                    }
                }
                var reqStr = isRequired ? '<span class="required-phase-input" style="margin-right: -15px;"></span>' : '';
                if (flag) {
                    if (pointTemplate.ActivityPhaseName)
                        s += '				<option value=' + pointTemplate.PointTemplateId + '>' + pointTemplate.ActivityPhaseName + '. ' + pointTemplate.Name + reqStr + '</option>';
                    else
                        s += '				<option value=' + pointTemplate.PointTemplateId + '>' + pointTemplate.Name + reqStr + '</option>';
                }
            }

            s += '				    </select>';
            s += '              </div>';
            s += '			</td>';
            s += '			</tr>';
        }

        if (settings.isPlanDateVisible) {
            s += '			<tr>';
            s += '			<td>';
            s += '			    <div class="control-group">';
            s += '				<label for="qpcPointPlanDate">' + Globa.Plan.locale() + '</label>';
            s += '				<input id="qpcPointPlanDate" type="text" class="date-picker input-small" data-datepicker="datepicker"/>';
            s += '			</td>';
        }
        s += '			<td>';
        s += '				<label>&nbsp;</label>';
        s += '				<a id="qpcPointSave" class="btn btn-small input-mini" onclick="QuickCreatePoint(\'' + selector + '\', \'' + uid + '\')">' + Globa.Create.locale() + '</a>';
        s += '			</td>';
        s += '		</tr>';
        s += '	</table>';
        s += '</div>';
        s += '</div>';

        el.html(s);
        el.find('.date-picker').kendoDatePicker({
            format: Asyst.date.defaultDateFormat,
            dateInput: true
        });
        el.find('#' + uid + 'PointTemplateId').kendoDropDownList();
        el.data("quickPointCreator", settings);

    });
};

function QuickPointCreator(selector, options) {

    Asyst.API.View.load({
        viewName: 'PointTemplatesAllowedView',
        data: Asyst.Workspace.currentForm.Data,
        success: function (data) {
            var pointTemplates = data.data;
            if (options.filter && options.filter.length > 0) {
                pointTemplates = Enumerable.From(data.data).Where(function (a) { return options.filter.indexOf(a.Identifier) >= 0; }).ToArray();
            }
            $(selector).quickPointCreator($().extend({ id: Asyst.Workspace.currentForm.EntityId, pointTemplates: pointTemplates }, options));
        }
    });

}

function QuickCreatePoint(selector, uid) {
    var settings = $(selector).data("quickPointCreator");
    var form = Asyst.Workspace.currentForm;
    var formData = form.Data;
    var input;

    input = $(selector).find('#' + uid + 'PointTemplateId');

    input_txt = $(selector).find('#' + uid + 'PointTemplateId :selected');
    var pointTemplateId = input.val();
    var pointTemplateName = input_txt.text();

    var pointTemplate;
    var pointTypeId;
    if (settings.isPointTemplateVisible) {

        pointTemplate = Asyst.API.Entity.load({ entityName: "PointTemplateEditForm", dataId: pointTemplateId, async: false });
        if (typeof (pointTemplate) !== "undefined" && pointTemplateId != "")
            pointTypeId = pointTemplate.PointTypeId;
        else {
            if (settings.isPointTemplateRequired) {
                input.parents('.control-group').addClass('error');
                input.change(function (el) {
                    var nameDate = $(el.target).val();
                    if (nameDate)
                        $(el.target).parents('.control-group').removeClass('error');
                });
                return;
            }
        }
    }

    input = $(selector).find('#qpcPointPlanDate');
    var txtPlanDate = input.val();
    var planDate;
    if (settings.isPlanDateVisible) {
        if (!txtPlanDate && settings.isPlanDateRequired) {
            input.parents('.control-group').addClass('error');
            input.change(function (el) {
                var nameDate = $(el.target).val();
                if (nameDate)
                    $(el.target).parents('.control-group').removeClass('error');
            });
            return;
        } else {
            //переводим в американский стандарт для парса
            planDate = Asyst.date.parse(txtPlanDate);
            //и добавляем смещение таймзоны
            planDate.setMinutes(-planDate.getTimezoneOffset());

            input.parents('.control-group').removeClass('error');
        }
    }

    var fields = {
        PlanDate: planDate,
        ForecastDate: planDate,
        Name: pointTemplate ? pointTemplate.Name : pointTemplateName,
        BlockId: formData.BlockId,
        FunctionId: formData.FunctionId,
        PointTemplateId: pointTemplateId,
        ParentId: formData.ActivityId,
        ProjectId: formData.ActivityId,
        LeaderId: formData.LeaderId,
        OwnerId: formData.OwnerId,
        PointTypeId: pointTypeId,
        PointLevelId: pointLevelId,
        IsMilestone: 1
    };
    //copyRoles(formData, fields);
    if (settings.isPointTemplateVisible) {
        copyRoles(pointTemplate, fields);
        mergeRoles(pointTemplate, formData, fields);
    }

    Asyst.Workspace.openEntityDialog("Point", Globa.NewPoint.locale(), null, function () {
        form.Reset();
        if (window["ganttframe"])
            ganttframe.Gantt.reloadData();
    }, fields);
}


/* ==============================================================================================================================
   Компонент для создания этапов / задач
   ============================================================================================================================== */

jQuery.fn.quickTaskCreator = function (options) {
    var settings = jQuery.extend({
        title: '',
        id: 0
    }, options);


    return this.each(function () {
        var el = $(this);
        var form = Asyst.Workspace.currentForm;

        var selector = '#' + form.FormName + ' ' + el[0].nodeName;

        var id = el.attr("id");
        if (id) {
            selector += "#" + id;
        }

		var uid = 'tsk' + guid();

        var classNames = el.attr("class");
        if (classNames) {
            selector += "." + $.trim(classNames).replace(/\s/gi, ".");
        }

        var s = '';
        s += '<div class="quick-point-creator well task-creator">';
        s += '<table class="quick-point-creator-header table table-condensed">';
        s += '	<thead>';
        s += '		<tr>';
        s += '			<th>' + settings.title + '</th>';
        s += '		</tr>';
        s += '	</thead>';
        s += '</table>';
        s += '<div class="quick-point-creator-body collapse in">';
        s += '	<table class="table table-condensed quick-point-creator-content">';
        s += '		<tr>';
        s += '			<td>';
        s += '			    <div class="control-group">';
        s += '				<label for="tskStartDate">Начало</label>';
        s += '				<input id="tskStartDate" type="text" class="date-picker input-small" data-datepicker="datepicker"/>';
        s += '			</td>';
        s += '			<td>';
        s += '			    <div class="control-group">';
        s += '				<label for="tskFinishDate">Окончание</label>';
        s += '				<input id="tskFinishDate" type="text" class="date-picker input-small" data-datepicker="datepicker"/>';
        s += '			</td>';
        s += '			<td>';
        s += '				<label>&nbsp;</label>';
        s += '				<a id="tskSave" class="btn btn-small input-mini" onclick="CreateTask(\'' + selector + '\', \'' + uid + '\')">' + Globa.Create.locale() + '</a>';
        s += '			</td>';
        s += '		</tr>';
        s += '	</table>';
        s += '</div>';
        s += '</div>';

        el.html(s);
        el.find('.date-picker').kendoDatePicker({
            format: Asyst.date.defaultDateFormat,
            dateInput: true
        });
        el.data("quickTaskCreator", settings);

    });
};

function QuickTaskCreator(selector, options) {
    $(selector).quickTaskCreator($().extend({ id: Asyst.Workspace.currentForm.EntityId, title: '' }, options));
}

function CreateTask(selector, uid) {
    var settings = $(selector).data("quickTaskCreator");
    var form = Asyst.Workspace.currentForm;
    var formData = form.Data;
    var input = "";
    var pointTypeId = 4;

    input = $(selector).find('#tskStartDate');
    var txtStartDate = input.val();
    var startDate;
    if (!txtStartDate) {
        input.parents('.control-group').addClass('error');
        input.change(function (el) {
            var nameDate = $(el.target).val();
            if (nameDate)
                $(el.target).parents('.control-group').removeClass('error');
        });
        return;
    } else {
        startDate = Asyst.date.parse(txtStartDate);
        startDate.setMinutes(-startDate.getTimezoneOffset());
        input.parents('.control-group').removeClass('error');
    }

    input = $(selector).find('#tskFinishDate');
    var txtFinishDate = input.val();
    var finishDate;
    if (!txtFinishDate) {
        input.parents('.control-group').addClass('error');
        input.change(function (el) {
            var nameDate = $(el.target).val();
            if (nameDate)
                $(el.target).parents('.control-group').removeClass('error');
        });
        return;
    } else {
        finishDate = Asyst.date.parse(txtFinishDate);
        finishDate.setMinutes(-finishDate.getTimezoneOffset());
        input.parents('.control-group').removeClass('error');
    }

    var fields = {
        StartPlanDate: startDate,
        StartForecastDate: startDate,
        PlanDate: finishDate,
        ForecastDate: finishDate,
        ParentId: formData.ActivityId,
        ProjectId: formData.ActivityId,
        LeaderId: formData.LeaderId,
        OwnerId: formData.OwnerId,
        PointTypeId: pointTypeId,
        PointLevelId: pointLevelId,
        IsMilestone: 0
    };

    Asyst.Workspace.openEntityDialog("Point", Globa.NewPoint.locale(), null, function () {
        form.Reset();
        if (window["ganttframe"])
            ganttframe.Gantt.reloadData();
    }, fields);
}