$(function () {
    'use strict';

    new AsystFormData('SubstitutionEditForm', false)
        .onAfterOpen(function () {
            if (!Asyst.Workspace.currentUser.IsFunctionalAdministrator) {
                this.Bindings["ReplacedUser"].disableInput();
            }
        })

        .onAfterValidate(function (errors) {
            var form = this;
            if (form.Data.BeginDate > form.Data.EndDate) {
                errors.push({ 'binding': form.Bindings['Duration'], 'message': 'Начало должно быть меньше окончания' });
            }

            if (form.Data.ReplacedUserId === form.Data.DeputyUserId) {
                errors.push({
                    'binding': form.Bindings['Duration'],
                    'message': 'Пользователь не может замещать самого себя.'
                });
            }

            var prom1 = Asyst.API.Rule.check({
                ruleName: 'SubstitutionCheckReplaced',
                data: form.Data,
               

                success: function (check) {
                    if (check)
                        errors.push({
                            'binding': form.Bindings['ReplacedUser'],
                            'message': 'Замещаемый пользователь уже является заместителем в указанный период'
                        });
                }
            });

            var prom2 = Asyst.API.Rule.check({
                ruleName: 'SubstitutionCheckDeputy',
                data: form.Data,
               
                success: function (check) {
                    if (check)
                        errors.push({
                            'binding': form.Bindings['DeputyUser'],
                            'message': 'Пользователь заместитель уже замещается в указанный период'
                        });
                }
            });

            
            var prom3 = Asyst.API.Rule.check({
                ruleName: 'SubstitutionCheckFA',
                data: form.Data,
               
                success: function (check) {
                    if (check)
                        errors.push({
                            'binding': form.Bindings['ReplacedUser'],
                            'message': 'Функционального админстратора может заменять только другой Функциональный администратор'
                        });
                }
            });

            return Promise.all([prom1, prom2, prom3]);


        })
        .Load();

});