$(function () {
    'use strict';

    new AsystFormData('UserEditForm')
    .onTemplatesLoaded(function () {
        this.$('#UserOrgUnitId').kendoMultiSelect();
    })
	.onAfterValidate(function (errors) {
		var form = this;
        Asyst.API.Rule.check({
            ruleName: 'ruleAccountUnique',
            data: {
                Account: form.Data.Account,
                UserId: form.Data.UserId
            },
            async: false,
            success: function (accountExists) {
                if (accountExists) {
                    errors.push({
                        'binding': form.Bindings['Account'],
                        'message': 'Пользователь с такой учетной записью уже существует. Придумайте, пожалуйста, другую'
                    });
                }
            }
        });
    })
	.onAfterSave(function () {
        
        var $orgUnits = this.$('select#UserOrgUnitId').val();
        var orgUnitIds = ($orgUnits == null) ? '' : $orgUnits.join(',');

        Asyst.API.DataSet.load({
            name: 'AppendUserOrgUnit',
            data: {
                OrgUnitIds: orgUnitIds,
                AccountId: this.Data.UserId
            },
            async: true
        });
    })
	.Load();
});