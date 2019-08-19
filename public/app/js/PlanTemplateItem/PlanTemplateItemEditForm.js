$(function () {
	'use strict';

	new AsystFormData('PlanTemplateItemEditForm')
		.onDataLoaded(function () {
			var form = this;
			var data = form.Data;

			if (form.isNew) {
				// новый шаблон не может быть этапом
			} else {
				var onSuccess = function (isStage) {
					if (isStage) {
						// этап не может являться КТ
						form.Bindings.IsMilestone.disableInput();
						// этап не может иметь связей
						form.Bindings.PredecessorId.disableInput();
						form.Bindings.Lag.disableInput();
					}
				};

				var onError = function () {
					NotifyError('Ошибка', 'Ошибка при проверке правила rulePlanTemplateItemIsStage.');
				};

				var ruleCheckPromise = Asyst.API.Rule.check({
					ruleName: 'rulePlanTemplateItemIsStage',
					data: {
						PlanTemplateId: data.PlanTemplateId,
						PlanTemplateItemId: data.PlanTemplateItemId
					},
					success: onSuccess,
					error: onError
				});

				return ruleCheckPromise;
			}
		})
		.onAfterValidate(function (errors) {
			var form = this;
			var data = form.Data;
			return new Promise(function (pass, fail) {
				var onSuccess = function (_, planTemplateItems) {
					var planTemplateItemsWithoutCurrent = planTemplateItems.filter(function (planTemplateItem) {
						return planTemplateItem.PlanTemplateItemId !== data.PlanTemplateItemId;
					});

					/*
					 * Проверка на дублирование порядков
					 */
					var orderIndexIsAlreadyUsed = planTemplateItemsWithoutCurrent.some(function (planTemplateItem) {
						return planTemplateItem.SortIndex === data.SortIndex;
					});

					if (orderIndexIsAlreadyUsed) {
						errors.push({
							message: 'Элемент с таким порядком уже существует',
							binding: form.Bindings.SortIndex
						});
					}

					// добавление текущего измененного элемента
					var planTemplateItemsModified = planTemplateItemsWithoutCurrent.concat([data]);

					/*
					 * Проверка на циклические связи
					 */
					if (form.isNew) {
						// добавление нового шаблона точки не сможет сделать цикл (он не может фигурировать где-либо как родитель)
					} else {
						// строим граф из всех элементов
						var dependencyGraph = planTemplateItemsModified.map(function (planTemplateItem) {
							var predecessors = [];

							if (planTemplateItem.PredecessorId) {
								predecessors.push(planTemplateItem.PredecessorId);
							}

							return {
								ID: planTemplateItem.PlanTemplateItemId,
								predecessors: predecessors
							};
						});

						if (Asyst.Utils.graphHasCycles(dependencyGraph)) {
							errors.push({
								message: 'Присутствуют циклические связи',
								binding: form.Bindings.PredecessorId
							});
						}
					}

					/*
					 * Проверка на правильную последовательность элементов с учетом зависимостей родитель-потомок
					 *
					 * Алгоритм проверки исходит из предположения, что
					 *
					 * Текущий дочерний элемент может идти
					 *      либо после своего родителя,
					 *      либо после элемента, у которого в цепочке его родителей есть родитель текущего.
					 */
					planTemplateItemsModified
						// сортировка по возрастанию
						.sort(function (a, b) {
							return a.SortIndex > b.SortIndex ? 1 : -1;
						})
						.reduce(function (prevPlanTemplateItem, planTemplateItem) {
							// добавляемый элемент - первый
							if (prevPlanTemplateItem === null) {
								var firstItemHasParent = Boolean(planTemplateItem.ParentId);

								if (firstItemHasParent) {
									errors.push({
										message: 'Первый элемент шаблона плана не может иметь родителя.',
										binding: form.Bindings.PredecessorId
									});
								}
							} else {
								// добавляемый элемент имеет родителя
								if (planTemplateItem.ParentId != null) {
									var prevPlanTemplateItemIsParentOfCurrent = planTemplateItem.ParentId === prevPlanTemplateItem.PlanTemplateItemId;

									var prevPlanTemplateItemParentIds = getParentsOfPlanTemplateItem(prevPlanTemplateItem, planTemplateItemsModified)
										.map(function (planTemplateItem) {
											return planTemplateItem.PlanTemplateItemId;
										});

									var currentParentIncludedInPrevParents = prevPlanTemplateItemParentIds.some(function (parentId) {
										return parentId === planTemplateItem.ParentId;
									});

									// если предыдущий элемент не родитель текущего и не является потомком родителя текущего
									if (!prevPlanTemplateItemIsParentOfCurrent && !currentParentIncludedInPrevParents) {
										errors.push({
											message: 'Элемент шаблона плана "' + planTemplateItem.Name + '" находится не под своим родителем.',
											binding: form.Bindings.PredecessorId
										});
									}
								}
							}

							return planTemplateItem;
						}, null);

					var hasOwner = !(data.OwnerId == null);
					var hasRoleOwner = !(data.RoleOwnerId == null);
					var ownerSpecifiedTwoTimes = hasOwner && hasRoleOwner;

					if (ownerSpecifiedTwoTimes) {
						errors.push({
							message: 'Инициатор указан 2 раза.',
							binding: form.Bindings.OwnerId
						});
					}

					var hasResponsible = !(data.ResponsibleId == null);
					var hasRoleResponsible = !(data.RoleResponsibleId == null);
					var responsibleSpecifiedTwoTimes = hasResponsible && hasRoleResponsible;

					if (responsibleSpecifiedTwoTimes) {
						errors.push({
							message: 'Исполнитель указан 2 раза.',
							binding: form.Bindings.ResponsibleId
						});
					}

					var hasResponsibleAssistant = !(data.ResponsibleAssistantId == null);
					var hasRoleResponsibleAssistant = !(data.RoleResponsibleAssistantId == null);
					var responsibleAssistantSpecifiedTwoTimes = hasResponsibleAssistant && hasRoleResponsibleAssistant;

					if (responsibleAssistantSpecifiedTwoTimes) {
						errors.push({
							message: 'Ответственный за ввод указан 2 раза.',
							binding: form.Bindings.ResponsibleAssistantId
						});
					}

					var hasAcceptor = !(data.AcceptorId == null);
					var hasRoleAcceptor = !(data.RoleAcceptorId == null);
					var acceptorSpecifiedTwoTimes = hasAcceptor && hasRoleAcceptor;

					if (acceptorSpecifiedTwoTimes) {
						errors.push({
							message: 'Приемщик указан 2 раза.',
							binding: form.Bindings.AcceptorId
						});
					}

					pass();
				};

				var onError = function (e) {
					NotifyError('Ошибка', 'Ошибка при выполнении датасета PlanTemplateItemData.');
					fail(e);
				};

				Asyst.API.DataSet.load({
					name: 'PlanTemplateItemData',
					data: { PlanTemplateId: data.PlanTemplateId },
					success: onSuccess,
					error: onError,
					async: true
				});

			});
		})
		.Load();

	function getParentsOfPlanTemplateItem (planTemplateItem, planTemplateItems) {
		var result = [];
		var currentPlanTemplateItem = planTemplateItem;

		while (currentPlanTemplateItem.ParentId != null) {
			var parentPlanTemplateItem = planTemplateItems.filter(function (planTemplateItem) {
				return planTemplateItem.PlanTemplateItemId === currentPlanTemplateItem.ParentId;
			})[0];

			result.push(parentPlanTemplateItem);

			currentPlanTemplateItem = parentPlanTemplateItem;
		}

		return result;
	}

});