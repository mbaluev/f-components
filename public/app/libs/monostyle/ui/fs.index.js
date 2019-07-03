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
            Id : 1,
            Name : "Приказ 001.docx",
            Type: 'docx',
            DocTypeImage: 'document-word.png',
            Size: 11,
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 1,
            DocumentName: 'Проектная инициатива'
        },
        {
            Id : 2,
            Name : "Приказ 001.pdf",
            Type: 'pdf',
            DocTypeImage: 'document-pdf.png',
            Size: 286,
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 1,
            DocumentName: 'Проектная инициатива'
        },
        {
            Id : 3,
            Name : "Приказ 001.docx",
            Type: 'docx',
            DocTypeImage: 'document-word.png',
            Size: 11,
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 2,
            DocumentName: 'Приказ о назначении куратора проекта и руководителя'
        },
        {
            Id : 4,
            Name : "Приказ 001.pdf",
            Type: 'pdf',
            DocTypeImage: 'document-pdf.png',
            Size: 286,
            PhaseId: 1,
            PhaseName: 'Инициация',
            DocumentId: 2,
            DocumentName: 'Приказ о назначении куратора проекта и руководителя'
        }
    ];
    $("#document-tree").kendoGrid({
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
                { field: 'DocumentName' }
            ]
        },
        groupabale: true,
        sortable: true,
        columns: [
            { field: 'Type', title: 'Тип', template: '<img src="/app/media/docs/#: DocTypeImage #">', width: 50 },
            { field: 'Name', title: 'Название документа', template: '<a href="/#: Id#">#: Name #</a>' },
            { field: 'Size', title: 'Размер', template: '#: Size# Кб' },
            { field: 'PhaseName', title: 'Стадия', groupHeaderTemplate: '#= value #', hidden: true },
            { field: 'DocumentName', title: 'Документ', groupHeaderTemplate: '#= value #', hidden: true }
        ]
    });
});
