$(function () {
    'use strict';

    new AsystFormData('UserViewForm')
		.onAfterOpen(function () {
       var form = this;
        var user = Asyst.Workspace.currentUser;

        if (!user.IsFunctionalAdministrator) {
            this.$("#Rights,#Doc").hide();
			
			this.Bindings.Name.hide();
            this.Bindings.Rank.hide();
        }

        if (user.IsFunctionalAdministrator && this.Data.Account) {
            this.$("#deputyBtn").show();
        }

        $('#GradeDivContent').inlineTableView({
            viewName: 'UserGrade',
            isDeferSave: false,
            canAdd: 'GradeDivContent',
            canEdit: 'GradeDivContent',
            canRemove: 'GradeDivContent',
            canExport: false,
            search: false,
            newItemData: {
                UserId: this.Data.UserId 
            },
            strings: {
                addButton: 'Добавить грейд',
                removeDialogTitle: 'Удалить?',
                removeDialogMessage: function () { return 'Вы уверены, что хотите удалить грейд?' }
            },
            afterSave: function () { form.Reset(); }
        });
       
    })
	.onDataLoaded(function () {
        
        Documents('#UserViewForm .documents', 'UserViewForm', true, true);
    })
	.Load();
});