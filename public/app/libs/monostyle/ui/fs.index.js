$(function(){
    var title = '[Проект] 500-004. Городская целевая программа по созданию окружных и районных центров обслуживания населения и организаций по принципу "одного окна".';
    document.title = title;

    /* popup callback
    show.fsTab
    shown.fsTab
    hide.fsTab
    hidden.fsTab
    */
    $('[data-toggle="f-popup"]').on('shown.fPopup', function(e, obj){});

    /* menu callback
     show.fsTab
     shown.fsTab
     hide.fsTab
     hidden.fsTab
     */
    $('[data-toggle="f-menu"]').on('shown.fMenu', function(e, obj){});

    /* tab callbacks
    hide.fsTab
    hidden.fsTab
    show.fsTab
    load.fsTab
    shown.fsTab
    loaded.fsTab
    */
    $('[data-toggle="f-tab"]')
        .on('load.fTab', function(e, obj){
            $('#tabs-spinner').remove();
        })
        .on('show.fTab', function(e, obj){
            obj._target.find('.f-widget').each(function(){
                var widget = $(this);
                if (!widget.data('collapsed')) {
                    widget.data('resizable', true);
                }
            });
        })
        .on('shown.fTab', function(e, obj){
            $(window).trigger('resize');
        })
        .on('hide.fTab', function(e, obj){
            obj._target.find('.f-widget').data('resizable', false);
        });

    // activate components
    $('body')
        .fEllipsis('activate')
        .fMenu('activate')
        .fPopup('activate')
        .fWidgetGrid('activate')
        .fTab('activate')
        .fTooltip('activate')
        .fSearch('activate')
        .fSlide('activate');

    // modal edit (window load from html)
    var modal_edit_form = '/modal.edit.html';
    var modal_edit = $('<div min-width max-width></div>');
    $('[data-toggle="modal-edit"]').on('click', function(){
        var container = $('.f-application__middle');
        var dims = container.offset();
        dims.padding = (kendo.support.mobileOS ? 4 : 8);
        dims.width = container.outerWidth() - dims.padding * 2;
        dims.height = container.outerHeight() - dims.padding * 2;
        if (modal_edit.data('kendoWindow')) {
            modal_edit.data('kendoWindow').setOptions({
                isMaximized: false,
                position: {
                    top: dims.top + dims.padding,
                    left: dims.left + dims.padding
                },
                width: dims.width,
                height: dims.height
            });
            modal_edit.data('kendoWindow').open();
        } else {
            modal_edit.appendTo('body');
            modal_edit.kendoWindow({
                title: title,
                content: modal_edit_form,
                actions: ['Save', 'Minimize', 'Maximize', 'Close'],
                modal: true,
                visible: false,
                isMaximized: false,
                width: dims.width,
                height: dims.height,
                position: {
                    top: dims.top + dims.padding,
                    left: dims.left + dims.padding
                },
                activate: function(e){
                    e.sender.element.trigger('resize');
                    e.sender.wrapper.find('.k-window-title').dotdotdot({ height: 80 });
                },
                resize: function(e){
                    e.sender.element.trigger('resize');
                    e.sender.wrapper.find('.k-window-title').dotdotdot({ height: 80 });
                },
                deactivate: function(e){
                    kendo_controls_destroy();
                    e.sender.wrapper.remove();
                    modal_edit.empty();
                },
                close: function(e){}
            });
            modal_edit.data('kendoWindow').open();
            modal_edit.fResizeListener('activate');
        }
        modal_edit.data('kendoWindow').wrapper.find('.k-i-save').parent().on('click', function(e){
            // kendo.alert('Изменения сохранены');

            $('<div></div>').appendTo('body').kendoDialog({
                title: "Информация",
                animation: true,
                closable: true,
                modal: true,
                content: 'Изменения сохранены',
                size: 'auto',
                actions: [
                    { text: 'Закрыть' }
                ],
                close: function(e){
                    e.sender.wrapper.remove();
                }
            });
        });
        modal_edit.trigger('resize');
    });

    // documents grid
    var documents = [
        {
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 1,
            DocumentName: 'Проектная инициатива',
            DocumentRequired: false,
            DocTypeImage: 'document-word.png',
            Id : 1,
            Name : "Приказ 001.docx",
            Type: 'docx',
            Size: 11,
            Author: 'mbaluev',
            Tags: ['tag1', 'tag2', 'tag3'],
            Version: 1
        },
        {
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 1,
            DocumentName: 'Проектная инициатива',
            DocumentRequired: false,
            DocTypeImage: 'document-pdf.png',
            Id : 2,
            Name : "Приказ 001.pdf",
            Type: 'pdf',
            Size: 286,
            Author: 'mbaluev',
            Tags: ['tag2', 'tag3', 'tag4'],
            Version: 1
        },
        {
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 2,
            DocumentName: 'Приказ о назначении куратора проекта и руководителя',
            DocumentRequired: true,
            DocTypeImage: 'document-word.png',
            Id : 3,
            Name : "Приказ 001.docx",
            Type: 'docx',
            Size: 11,
            Author: 'mbaluev',
            Tags: ['tag3', 'tag4', 'tag5'],
            Version: 1
        },
        {
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 2,
            DocumentName: 'Приказ о назначении куратора проекта и руководителя',
            DocumentRequired: true,
            DocTypeImage: 'document-pdf.png',
            Id : 4,
            Name : "Приказ 001.pdf",
            Type: 'pdf',
            Size: 286,
            Author: 'mbaluev',
            Tags: ['tag4', 'tag5', 'tag6'],
            Version: 1
        },
        {
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 3,
            DocumentName: 'Приказ',
            DocumentRequired: null,
            DocTypeImage: null,
            Id : null,
            Name : null,
            Type: null,
            Size: null,
            Tags: null,
            Version: 1
        }
    ];
    $("#document-tree").kendoGrid({
        columns: [
            {
                attributes: { style: 'text-overflow: unset; padding: 5px 4px 4px; line-height: 1; text-align: right;' },
                template: '# if (Type) { # <img src="/app/media/document/#: DocTypeImage #"> # } #',
                width: 30
            },
            {
                field: 'Name',
                title: 'Название документа',
                template: '# if (Name) { # <a href="/#: Id#">#: Name #</a> # } else { # <span class="f-color_grey">Нет документов</span> # } #'
            },
            {
                field: 'Size',
                title: 'Размер',
                template: '# if (Id) { # #: Size# Кб # } #'
            },
            {
                field: 'Author',
                title: 'Автор',
                template: '# if (Id) { # #: Author # # } #'
            },
            {
                attributes: { style: 'text-overflow: unset;' },
                template:  '# if (Tags) { #' +
                    '# for (var i = 0; i < Tags.length; i++) { #' +
                    '<div class="f-tag f-pointer f-background-color_green">#= Tags[i] # </div>' +
                    '# } #' +
                    '# } #'
            },
            {
                groupHeaderTemplate: '#= value #',
                field: 'PhaseName',
                title: 'Стадия',
                hidden: true
            },
            {
                groupHeaderTemplate:
                    '# items.forEach(function (item) { #' +
                    '# if (!item.Id) { count--; } #' +
                    '# }); #' +

                    '#= value # (#= count #)' +
                    '# if (data.items[0].DocumentRequired) { #' +
                    '<div class="f-icon f-i-star f-color_green" data-tooltip="Обязательно" style="margin: 0 6px;"></div>' +
                    '# } #' +

                    '<div class="f-icon f-pointer k-icon k-i-file-add" data-tooltip="Загрузить документ" style="margin: 0 6px;"></div>',
                field: 'DocumentName',
                title: 'Документ',
                hidden: true
            },
            {
                attributes: { style: 'text-overflow: unset; padding: 7px 3px 6px; line-height: 1;' },
                template: '# if (Id) { # <div class="f-icon f-pointer k-icon m-i-quill f-color_red"></div> # } #',
                width: 22
            },
            {
                attributes: { style: 'text-overflow: unset; padding: 7px 3px 6px; line-height: 1;' },
                template: '# if (Id) { # <div class="f-icon f-pointer k-icon m-i-shield f-color_red"></div> # } #',
                width: 22
            },
            {
                attributes: { style: 'text-overflow: unset; padding: 7px 3px 6px; line-height: 1;' },
                template: '# if (Id) { # <div class="f-icon f-pointer k-icon f-i-info f-color_blue"></div> # } #',
                width: 22
            },
            {
                attributes: { style: 'text-overflow: unset; padding: 7px 3px 6px; line-height: 1;' },
                template: '# if (Id) { # <div class="f-icon f-pointer k-icon m-i-pencil2"></div> # } #',
                width: 22
            },
            {
                attributes: { style: 'text-overflow: unset; padding: 7px 3px 6px; line-height: 1;' },
                template: '# if (Id) { # <div class="f-icon f-pointer k-icon k-i-trash"></div> # } #',
                width: 22
            }
        ],
        dataSource: {
            data: documents,
            schema: {
                model: {
                    id: 'Id',
                    fields: {
                        Type: { type: 'string' },
                        Name: { type: 'string' },
                        Size: { type: 'number' },
                        Phase: { type: 'string' },
                        Document: { type: 'string' }
                    }
                }
            },
            group: [
                { field: 'PhaseName' },
                { field: 'DocumentName', aggregates: [{ field: "DocumentName", aggregate: "count" }] }
            ]
        },
        groupabale: true,
        resizable: true,
        sortable: true
    });
});
