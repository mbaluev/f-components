/* Согласование ЗИ в карточке сущности. Создание ЗИ ищите в application.model.js*/
function ChangeRequestsView (selector, form) {
	if (!form)
		form = Asyst.Workspace.currentForm;

	var $el = $(selector);
	$el.empty();

	form.ChangeRequests = [];

	Asyst.API.View.load({
		viewName: 'ChangeRequestsView',
		data: form.Data,
		success: function (view) {
			if (view && view.data && view.data.length > 0) {
				form.ChangeRequests = view.data;

				var html = '';
				html += '    <div class="accordion-group" style="margin-left:8px; margin-right:8px;">';
				html += '      <div class="accordion-heading">';
				html += '        <a href="#changerequests-body" data-toggle="collapse" class="accordion-toggle">';
				html += '          ' + Globa.ChangeRequests.locale();
				html += '        </a>';
				html += '      </div>';
				html += '      <div class="accordion-body in collapse" id="changerequests-body" style="height: auto;">';
				html += '        <div class="accordion-inner" style="padding: 0px 4px;">';
				html += '<table class="table table-condensed" style="margin-bottom:0px;">';
				html += '<thead>';
				html += '<tr><th></th><th>' + Globa.State.locale() + '</th><th>' + Globa.Description.locale() + '</th><th>' + Globa.Field.locale() + '</th><th>' + Globa.OldValue.locale() + '</th><th>' + Globa.NewValue.locale() + '</th></tr>';
				html += '</thead>';
				html += '<tbody>';
				for (var r in view.data) {
					var request = view.data[r];
					var isParent = request.hasOwnProperty('ChildChangeRequest') && request.ChildChangeRequest != null && request.ChildChangeRequest != '';
					var img = '';
					if (request.ExternalReviewState == 1)
						img = 'hourglass.png';
					else if (request.ExternalReviewState == 3)
						img = 'fail-small.png';
					else if (request.State == 1)
						img = 'hourglass.png';
					else if (request.State == 2)
						img = 'tick-small.png';
					else if (request.State == 3)
						img = 'fail-small.png';
					html += '<tr data-index="' + r + '" class="changerequest-row" style="cursor:pointer;">' +
						'<td><img src="/app/media/' + img + '"></td>' +
						'<td>' + request.StateName.locale() + '</td>' +
						'<td>' + request.Description + '</td>';
					if (isParent) {
						html += '<td colspan=\'3\' style=\'text-align:center\'>Комплексный запрос</td>';
					} else {
						html += '<td>' + Globa.localString2(request.ElementTitle) + '</td>' +
							'<td><div style="max-width:150px; white-space: nowrap; text-overflow:ellipsis;overflow:hidden;" >' + request.OldDisplayValue + '</div></td>' +
							'<td><div style="max-width:150px; white-space: nowrap; text-overflow:ellipsis;overflow:hidden;">' + request.NewDisplayValue + '</div></td>';
						//'<td>' + '<a href="' + location.origin+location.pathname + '?mode=view&ChangeRequestId=' + request.ChangeRequestId + '">Ссылка на ЗИ</a> </td>' +
					}
					html += '</tr>';

				}
				html += '</tbody>';
				html += '</table>';
				html += '        </div>';
				html += '      </div>';
				html += '    </div>';

				$el.html(html);
				$('.changerequest-row').click(function () {
					var index = $(this).data('index');
					var request = view.data[index];

					ChangeRequestDialog(form, request);

				});

				if (!form.changeRequestsInitialized) {
					form.changeRequestsInitialized = true;

					var id = getParameterByName('ChangeRequestId');
					if (id) {
						for (r in form.ChangeRequests) {
							if (form.ChangeRequests[r].ChangeRequestId == id) {
								ChangeRequestDialog(form, form.ChangeRequests[r]);
								break;
							}
						}
					}
				}
			}
		},
		error: function () {
		}
	});
}

function ChangeRequestDialogById (form, requestId, noaction) {
	for (var r in form.ChangeRequests) {
		if (form.ChangeRequests[r].ChangeRequestId == requestId) {
			ChangeRequestDialog(form, form.ChangeRequests[r], noaction);
			break;
		}
	}
}

function ChangeRequestDialog (form, request, noaction) {
	if (Asyst.ChangeRequest.showCard) {
		if (noaction !== null && noaction !== undefined) {
			Asyst.ChangeRequest.noaction = noaction;
		} else {
			delete Asyst.ChangeRequest.noaction;
		}

		var dialog = Asyst.Workspace.openEntityDialog('ChangeRequestViewForm', Globa.ChangeRequestTitle.locale(), request.ChangeRequestId, function () {
			form.Reset();
		});
	} else {
		var agree = function () {
			var $comment = $('#change-request-dialog #changerequest-review-comment');
			var comment = $comment.val();
			Asyst.API.View.load({
				viewName: 'ChangeRequestChildView',
				data: {ChangeRequestId: request.ChangeRequestId},
				success: function (data) {
					Enumerable.From(data.data).ForEach(function (row) {
						Asyst.API.ChangeRequest.agree({requestId: row.ChangeRequestId, comment: comment, async: false});
					});
				},
				async: false
			});

			Asyst.API.ChangeRequest.agree({
					requestId: request.ChangeRequestId,
					comment: comment,
					success: function () {
						form.Load();
					},
					error: function () {
					},
					async: false
				}
			);
		};

		var decline = function () {
			var $comment = $('#change-request-dialog #changerequest-review-comment');
			var comment = $comment.val();

			if (!comment) {
				Dialog(Globa.Error.locale(), Globa.EnterComment.locale());
				return;
			}

			$comment.parents('.control-group').removeClass('error');

			Asyst.API.View.load({
				viewName: 'ChangeRequestChildView',
				data: {ChangeRequestId: request.ChangeRequestId},
				success: function (data) {
					Enumerable.From(data.data).ForEach(function (row) {
						Asyst.API.ChangeRequest.decline({requestId: row.ChangeRequestId, comment: comment, async: false});
					});
				},
				async: false
			});
			Asyst.API.ChangeRequest.decline({
					requestId: request.ChangeRequestId,
					comment: comment,
					success: function () {
						$('#change-request-dialog').modal('hide');
						form.Load();
					},
					error: function () {
					},
					async: false
				}
			);
		};

		var externalReviewStart = function () {

			Asyst.API.ChangeRequest.externalReviewStart({
				requestId: request.ChangeRequestId,
				success: function () {
					form.Load();
				},
				error: function () {
				}
			});
		};

		var externalReviewAgree = function () {

			Asyst.API.ChangeRequest.externalReviewAgree({
				requestId: request.ChangeRequestId,
				success: function () {
					form.Load();
				},
				error: function () {
				},
				async: false
			});
		};

		var externalReviewAgreeWithIssues = function () {

			Asyst.API.ChangeRequest.externalReviewAgreeWithIssues({
				requestId: request.ChangeRequestId,
				success: function () {
					form.Load();
				},
				error: function () {
				},
				async: false
			});
		};

		var externalReviewDecline = function () {

			Asyst.API.ChangeRequest.externalReviewDecline({
				requestId: request.ChangeRequestId,
				success: function () {
					form.Load();
				},
				error: function () {
				},
				async: false
			});
		};

		var buttons = [{text: Globa.Close.locale()}];
		var body = '<div class="well form-horizontal">';

		body += '<div class="control-group"><label class="control-label">' + Globa.Field.locale() + '</label><div class="controls"><span>' + Globa.localString2(request.ElementTitle) + '</span></div></div>';
		body += '<div class="control-group"><label class="control-label">' + Globa.OldValue.locale() + '</label><div class="controls"><span>' + request.OldDisplayValue + '</span></div></div>';
		body += '<div class="control-group"><label class="control-label">' + Globa.NewValue.locale() + '</label><div class="controls"><span>' + request.NewDisplayValue + '</span></div></div>';
		var reportLink = $('#changetLog').attr('href');
		if (typeof reportLink == 'undefined')
			reportLink = '/ReportServer/Pages/ReportViewer.aspx?%2fReports%2fChangeRequest&rs:Command=Render&ActivityId=' + (form.Data.ActivityId ^ 78645433);
		body += '<div class="control-group"><label class="control-label">' + Globa.ChangeHistory.locale() + '</label><div class="controls"><a href="' + reportLink + '" style="width:100%" target="_blank">' + Globa.ChangeHistory.locale() + '</a></div></div>';
		body += '<div class="control-group"><label class="control-label">' + Globa.Description.locale() + '</label><div class="controls"><span>' + request.Description + '</span></div></div>';
		body += '<div class="control-group"><label class="control-label">' + Globa.Comment1.locale() + '</label><div class="controls"><span>' + request.Comment1 + '</span></div></div>';
		body += '<div class="control-group"><label class="control-label">' + Globa.Comment2.locale() + '</label><div class="controls"><span>' + request.Comment2 + '</span></div></div>';
		body += '<div class="control-group"><label class="control-label">' + Globa.Comment3.locale() + '</label><div class="controls"><span>' + request.Comment3 + '</span></div></div>';
		if (request.hasOwnProperty('FileUrl') && request.FileUrl != null && request.FileUrl != '')
			body += '<div class="control-group"><label class="control-label">' + Globa.AttachedFile.locale() + '</label><div class="controls"><a href="' + request.FileUrl + '" target="_blank"><img src="/app/media/document.png"/>' + request.FileName + '</a></div></div>';

		body += '<div id="changerequest-reviews"></div>';
		body += '</div>';
		if (request.ExternalReviewState === 1) {
			if (request.UserAllowExternal) {
				buttons.unshift({text: Globa.PCDecline.locale(), cls: 'btn-danger', click: externalReviewDecline});
				buttons.unshift({text: Globa.PCAgree.locale(), cls: 'btn-success', click: externalReviewAgree});
				buttons.unshift({text: Globa.PCNotice.locale(), cls: 'btn-warning', click: externalReviewAgreeWithIssues});
			}
		} else if (request.State === 1 && request.UserRequestState === 1) {
			if (!request.hasOwnProperty('ParentId') || request.ParentId == null || request.ParentId == '') {
				body += '<div class="form-horizontal"><div class="control-group"><label class="control-label">' + Globa.Comment.locale() + '</label><div class="controls"><textarea id="changerequest-review-comment" type="text" rows="4" style="width:95%"></textarea></div></div></div>';
				buttons.unshift({text: Globa.Decline.locale(), cls: 'btn-danger', click: decline, close: false});
				buttons.unshift({text: Globa.Agree.locale(), cls: 'btn-success', click: agree});
			}
			//скрываем отправку запроса на изменение на проектный комитет
			//if (request.State === 1)
			//    buttons.unshift({ text: Globa.SendToPC.locale(), cls: 'pull-left', click: externalReviewStart });
		}

		Dialog(Globa.ChangeRequestFrom.locale() + ' ' + Asyst.date.format(request.CreationDate) + ' - ' + request.AuthorName, body, buttons, 'change-request-dialog');
		$('#change-request-dialog').css({'top': '10px'});
		$('#change-request-dialog').attr('data-backdrop', 'static');

		//костылёк для причесывания таблицы ЗИ от проджекта
		if ($('#change-request-dialog').find('div#fromProject') != null && $('#change-request-dialog').find('div#fromProject').length > 0) {
			$('label:contains(\'Поле\')').parent().hide();
			$('label:contains(\'Старое значение\')').parent().hide();
			$('label:contains(\'Новое значение\')').hide();
			$('label:contains(\'Новое значение\')').parent().find('.controls').css('margin-left', '0px');
			var el = $('#fromProject').parent();
			el.replaceWith(el[0].innerHTML);
		}

		Asyst.API.View.load({
			viewName: 'ChangeRequestReviews',
			data: {ChangeRequestId: request.ChangeRequestId},
			success: function (view) {
				var table = '<table class="table table-condensed" style="margin-bottom:0px;"><thead></thead><tbody>';
				for (var r in view.data) {
					var review = view.data[r];

					var img = '';
					if (review.State == 1)
						img = 'hourglass.png';
					else if (review.State == 2)
						img = 'tick-small.png';
					else if (review.State == 3)
						img = 'fail-small.png';

					table += '<tr><td><img src="/app/media/' + img + '"></td><td>' + review.StateName.locale() + '</td><td>' + review.UserName + '</td><td>' + review.Comment + '</td></tr>';
				}
				table += '</tbody></table>';
				var $dlg = $('#change-request-dialog #changerequest-reviews');
				$dlg.html(table);
				$('[rel="tooltip"]').tooltip();
				$('[rel="tooltip"]').on('hidden', function () {
					return false;
				});
			},
			error: function () {
			}
		});
	}
}

function changeRequestDialogFileUploaded (file) {
	var $label = $('#change-request-dialog #changerequest-file');
	$label.text(file.name);
}