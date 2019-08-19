new AsystFormData('TaskStepEditForm')
    .onDataLoaded(function () {

        //Создание пространства для функций формы (Для обработчиков)
        Asyst.Workspace.FormFunctions = Asyst.Workspace.FormFunctions || {};
        Asyst.Workspace.FormFunctions.OnChangeControls = Asyst.Workspace.FormFunctions.OnChangeControls || {};

        (function (model, form) {
            model.TypeChanged = function (value) {
                form.Bindings.Context.show(value === 'DataHandler' || value === 'Mail' || value === 'Process' || value === 'Query' || value === 'Report');
                form.Bindings.ExecuteCommand.show(value === 'DataHandler' || value === 'Mail' || value === 'Process' || value === 'Query' || value === 'Report');

                form.Bindings.FileName.show(value === 'Report');
                form.Bindings.FileFormat.show(value === 'Report');

                form.Bindings.ExecuteCommand.setRequired(value === 'DataHandler' || value === 'Mail' || value === 'Process' || value === 'Query' || value === 'Report');

                form.Bindings.FileName.setRequired(value === 'Report');
                form.Bindings.FileFormat.setRequired(value === 'Report');

                switch (value) {
                    case 'DataHandler':
                        form.$('#label-ExecuteCommand').text("Название обработчика");
                        form.$('#label-Context').text("Параметры (Json)");
                        break;
                    case 'Mail':
                        form.$('#label-ExecuteCommand').text("Название настройки рассылки");
                        form.$('#label-Context').text("Параметры (Json)");
                        break;
                    case 'Process':
                        form.$('#label-ExecuteCommand').text("Исполняемая команда ОС");
                        form.$('#label-Context').text("Параметры (строка /p)");
                        break;
                    case 'Query':
                        form.$('#label-ExecuteCommand').text("Запрос sql");
                        form.$('#label-Context').text("Параметры (Json)");
                        break;
                    case 'Report':
                        form.$('#label-ExecuteCommand').text("Название отчета");
                        form.$('#label-Context').text("Параметры (Json)");
                        break;
                    
                }
            };
        })(Asyst.Workspace.FormFunctions.OnChangeControls, this);
    })
    .onBeforeOpen(function () {
        var form = this;

        //Скрытие контролов при открытии
        Asyst.Workspace.FormFunctions.OnChangeControls.TypeChanged(form.Data.Type);
        form.Bindings.Type.Element.on(
            'change',
            function () {
                Asyst.Workspace.FormFunctions.OnChangeControls.TypeChanged(form.Bindings.Type.value());
            }
        );
    }).onBeforeSave(function () {
        var form = this;
        var data = form.Data;
        if (data.Type)
            data.TypeName = form.Bindings.Type.objectValue().Value;
    })
    .Load();