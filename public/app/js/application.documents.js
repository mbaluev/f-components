$.extend($.fn.typeahead.Constructor.prototype, {
	val: function () {
	}
});//fix smbd

function makeTagRow (tags) {
	if (!tags) tags = [];
	var res = '';
	var d = tags.sort(function (a, b) {
		if (a.toLowerCase() > b.toLowerCase()) return 1; else return -1;
	});
	for (var i = 0, len = d.length; i < len; i++) {
		if (d[i] != '')
			res += '<span class="file-tag">' + d[i] + '</span> ';
	}
	return res == '' ? '' : ('<div class=\'file-tags\'>' + res + '</div>');
}

function filterByTag (tag) {
	$('.file-row').removeClass('no-padding');
	$('.file-row').addClass('no-padding');
	var docs = Asyst.Workspace.currentForm.Documents;
	for (var i = 0, dlen = docs.length; i < dlen; i++) {
		var files = docs[i].files;
		var countfileswithtag = 0;
		for (var j = 0, flen = files.length; j < flen; j++) {
			var f = files[j];
			var tags;
			if (f.tags)
				tags = f.tags;
			else
				tags = [];
			var hastag = false;
			for (var m = 0, tlen = tags.length; m < tlen; m++) {
				if (tags[m] == tag) {
					hastag = true;
					break;
				}
			}
			if (!hastag) {
				$('tr#file' + f.id).hide();
			} else {
				$('tr#file' + f.id).show();
				$('tr#file' + f.id).closest('.file-row').removeClass('no-padding');
				countfileswithtag++;
			}
		}
		$('#document' + docs[i].id + ' span.tag-filter-badge').html(countfileswithtag);
		$('.tag-filter-badge').show();
	}
	$('.tag-filter-head').html(tag + '<span data-role="remove"></span>');
	$('.tag-filter-head').show();
	$('.file-tag').removeClass('filtered-tag');
	$('.file-tag').each(function (ind, el) {
		if ($(el).text() == tag) $(el).addClass('filtered-tag');
	});
	/*
	var ar = $('.accordion-body.collapse');
	for(var i=0;i < ar.length; i++) $(ar[i]).collapse('show')
	*/
}

function clearFilterTag () {
	var docs = Asyst.Workspace.currentForm.Documents;
	for (var i = 0, dlen = docs.length; i < dlen; i++) {
		var files = docs[i].files;
		for (var j = 0, flen = files.length; j < flen; j++) {
			$('tr#file' + files[j].id).show();
		}
	}
	$('.tag-filter-head').hide();
	$('.tag-filter-badge').hide();
	$('.file-tag').removeClass('filtered-tag');
	$('.file-row').removeClass('no-padding');
}

jQuery.fn.documents = function (options) {
	var settings = jQuery.extend({
		dataId: 0,
		documents: [
			{id: 0, name: 'Name', files: [{id: 0, name: 'File.txt', url: '.', icon: '/app/media/document/document.png'}]}
		],
		showInfo: false, showTags: false, deleteRequest: true
	}, options);

	Enumerable.From(settings.documents).ForEach(function (i) {
		settings.phases = settings.phases.concat(i.phases);
	});
	settings.phases = Enumerable.From(settings.phases).Distinct('$.ActivityPhaseId').OrderBy('$.Position').ToArray();

	settings.phases = [{Name: Globa.NoPhase.locale(), ActivityPhaseId: 0, Position: 0}].concat(settings.phases);

	return this.each(function () {

		jQuery(this).data('asystDocuments', settings);
		jQuery(this).html('');
		var htmltext = '';
		var activePhase = 0;
		htmltext += '<div class=\'btn btn-info tag-filter-head\' style=\'display:none\'></div><div class=\'accordion\' id =\'document-accordion\'>';
		var form = Asyst.Workspace.currentForm;
		var fileCount;
		for (var j = 0; j < settings.phases.length; j++) {
			var rowh = '';
			rowh += '<div id="documentPhase' + j + '" class="accordion-group" phaseId=' + settings.phases[j].ActivityPhaseId + '>';
			if (settings.phases.length != 1) {

				rowh += '<div class="accordion-heading acc-phase-head">';
				rowh += '<div class="accordion-toggle">';
				rowh += '<a href="#' + form.FormName + 'doc-acc-body' + j + '" data-toggle="collapse" data-parent="#document-accordion" class="acc-phase-head">' + settings.phases[j].Name + '</a>';
				rowh += '</div></div>';

				rowh += '<div class="accordion-body collapse" id="' + form.FormName + 'doc-acc-body' + j + '">';
				rowh += '<div class="accordion-inner" style="margin-left: 20px; margin-top:-1px">';
			}
			var countDoc = 0;
			for (var i = 0; i < settings.documents.length; i++) {
				var document = settings.documents[i];
				var row = '';

				var phaseInDocument = false;
				// ищем в этапах документа текущий этап settings.phases[j]
				for (var k = 0; k < document.phases.length; k++) {
					if (document.phases[k].ActivityPhaseId == settings.phases[j].ActivityPhaseId) {
						phaseInDocument = true;
						break;
					}
				}

				//если этап есть в документе, или этапов нет и это элемент settings.phases[] "без этапа"
				if (phaseInDocument || (document.phases.length === 0 && settings.phases[j].ActivityPhaseId == 0)) {
					countDoc++;
					fileCount = 0;
					if (jQuery.isArray(document.files))
						fileCount = Enumerable.From(document.files).Where('$.activityPhaseId ==' + settings.phases[j].ActivityPhaseId).Count();

					row += '<div id="document' + document.id + '" class="accordion-group">';
					row += '  <div class="accordion-heading acc-doc-head">';
					row += '    <div class="accordion-toggle">';
					row += '      <a href="#' + form.FormName + 'documentFiles' + document.id + '" data-toggle="collapse">';
					row += '        ' + document.name + '&nbsp;<span class="badge all-badge">' + fileCount + '</span>';
					row += '      </a>';

					row += '      <span class="tag-filter-badge badge" style="display:none"> id="document' + document.id + '"</span>';

					if (!document.readonly) {
						row += '      <div class="documents-action-add pull-right" href="#" onclick="uploadDocument(this, null, ' + document.id + ', \'' + settings.dataId + '\',{activityPhaseId: ' + settings.phases[j].ActivityPhaseId + '})">';
						row += '        <i class="icon-plus" style="margin-top:2px; margin-left: 5px;"/>';
						row += '      </div>';
					}
					if (document.isRequired)
						row += '<span class="required-phase-input required-phase-document" rel="tooltip" title="' + Globa.JSRequiredPhase.locale() + '"></span>';
					row += '    </div>';
					row += '  </div>';
					row += '  <div class="accordion-body in" id="' + form.FormName + 'documentFiles' + document.id + '" style="height: auto;">';
					row += '    <div class="accordion-inner file-row">';
					row += '      <table class="table-condensed" style="width:100%">';
					row += '      <tbody>';

					if (document.files) {
						if (document.files.length > 0) {
							for (var idx in document.files) {
								if (document.files[idx].activityPhaseId != settings.phases[j].ActivityPhaseId)
									continue;

								var file = document.files[idx];
								if (file.name)
									file.name = file.name.replace('<', '&lt;').replace('>', '&gt;');
								if (file.url)
									file.url = file.url.replace('\'', '%27').replace('"', '%22');
								row += '      <tr id="file' + file.id + '">';
								if (file.isLink)
									row += '        <td><a href="' + file.url + '" target="_blank"><img src="/app/media/document/link.png">' + file.name + '</a>' + (settings.showTags ? makeTagRow(file.tags) : '') + '</td>';
								else if (file.icon)
									row += '        <td><a href="' + file.url + '" target="_blank"><img src="' + file.icon + '">' + file.name + '</a>' + (settings.showTags ? makeTagRow(file.tags) : '') + '</td>';
								else
									row += '        <td><a href="' + file.url + '" target="_blank"><img src="/app/media/document/document.png">' + file.name + '</a>' + (settings.showTags ? makeTagRow(file.tags) : '') + '</td>';
								if (file.hasOwnProperty('fileSize'))
									row += '        <td class="filesizecolumn">(' + fileSizeToString(file.fileSize) + ')</td>';
								else
									row += '        <td class="filesizecolumn"></td>';

								if (!document.readonly && (settings.showInfo || settings.showTags))
									row += '        <td style="width:41px; padding-bottom: 0px;">';
								else if (!document.readonly || settings.showInfo || settings.showTags)
									row += '        <td style="width:18px; padding-bottom: 0px;">';
								if (!document.readonly)
									row += '            <a class="documents-action-delete" href="#" onclick="deleteDocument(this, ' + file.id + ', ' + document.id + ', \'' + settings.dataId + '\', \'' + file.name + '\', ' + settings.phases[j].ActivityPhaseId + ', ' + document.files[idx].isLink + ')"><i class="icon-trash"/></a>';
								if (settings.showInfo || settings.showTags)
									row += '            <a class="documents-action-info" href="#" onclick="ShowInfo(' + file.id + ',' + settings.showInfo + ',' + settings.showTags + ')"><i class="icon-info-sign"/></a>';
								row += '        </td>';
								row += '      </tr>';
							}
						} else {
							row += '      <tr class="no-documents">';
							row += '        <td>';
							row += '          <span>Нет документов</span>';
							row += '        </td>';
							row += '      </tr>';
						}
					}

					row += '      </tbody>';
					row += '      </table>';
					row += '    </div>';
					row += '  </div>';
					row += '</div>';


					//jQuery(this).append(row);
					rowh += row;
				}

			}
			if (settings.phases.length != 1) {
				rowh += '</div></div>';
			}
			rowh += '</div>';
			if (countDoc > 0) {
				htmltext += rowh;
				if (form.Data.hasOwnProperty('ActivityPhaseId') && (form.Data.ActivityPhaseId == settings.phases[j].ActivityPhaseId))
					activePhase = j;
			}
		}
		htmltext += '</div>';
		jQuery(this).append(htmltext);

		$('[name="' + form.FormName + '"] #' + form.FormName + 'doc-acc-body' + activePhase).addClass('in');
		$('.required-phase-document').tooltip({container: 'body'});
		$('.required-phase-document').on('hidden', function () {
			return false;
		});
		$('.file-tag').on('click', function (event) {
			var tag = event.target.innerText;
			filterByTag(tag);
		});
		$('.tag-filter-head').on('click', clearFilterTag);
		$('.accordion').on('hidden',
			function (event) {
				event.stopPropagation();
			});
	});
};

var fileSizeToString = function (size) {
	if (size < 1024)
	//return size + ' &nbsp;B';
		return size + ' B';
	else if (size < 1024 * 1024)
		return Math.round(size / 1024) + ' KB';
	else if (size < 1024 * 1024 * 1024)
		return Math.round(size / 1024 / 1024) + ' MB';
	else
		return Math.round(size / 1024 / 1024 / 1024) + ' GB';
};

function deleteDocument (owner, fileId, documentId, dataId, filename, activityPhaseId, isLink) {
	var settings = $(owner).parents('.documents').data('asystDocuments');
	var dialogId;

	var continuee = function () {
		parent.$('#' + dialogId).modal('hide');

		var form = Asyst.Workspace.currentForm;
		var el = $('#' + form.FormName + ' #file' + fileId + ' td a.documents-action-delete');
		var handler = el.attr('onclick');
		el.attr('onclick', '');
		var docFile = {};
		for (var i = 0; i < form.Documents.length; i++) {
			for (var j = 0; j < form.Documents[i].files.length; j++)
				if (form.Documents[i].files[j].id == fileId)
					docFile = form.Documents[i].files[j];
		}

		if (docFile && docFile.hasOwnProperty('isLink') && docFile.isLink == 1)
			Loader.show($('#' + form.FormName), Globa.DeleteLink.locale());
		else
			Loader.show($('#' + form.FormName), Globa.DeleteDocument.locale());
		var success = function (data) {
			Loader.hide();
			var table = jQuery(owner).parents('tbody');
			var $cnt = $(owner).parents('#document' + documentId).find('.all-badge');
			table.find('#file' + fileId).remove();
			var phaseId = (typeof activityPhaseId == 'undefined') ? 0 : activityPhaseId;
			$cnt.text(parseFloat($cnt.text()) - 1);
			for (var i in form.Documents) {
				var document = form.Documents[i];
				if (document.id == documentId) {
					for (var j in document.files) {
						var file = document.files[j];
						if (file.id == fileId) {
							document.files.splice(j, 1);
							break;
						}
					}
				}
			}
			el.attr('onclick', handler);

			form.Events.onDocumentChange.fire({
				fileId: fileId,
				documentId: documentId,
				filename: filename,
				dataId: dataId,
				deleted: true
			});

			if (table.find('tr').length == 0) {
				var row_no_documents = '';
				row_no_documents += '      <tr class="no-documents">';
				row_no_documents += '        <td>';
				row_no_documents += '          <span>Нет документов</span>';
				row_no_documents += '        </td>';
				row_no_documents += '      </tr>';
				table.append(row_no_documents);
			}
		};
		var error = function (message, info, context) {
			Loader.hide();
			if (message == Globa.LicenseError) {
				return;
			} else {
				ErrorHandler(Globa.ErrorDelete.locale(), message + '<br>' + info);
			}
			el.attr('onclick', handler);
		};
		Asyst.API.Document.deleteFile({
			data: {files: [{fileId: fileId, fileName: filename}]},
			async: true,
			success: success,
			error: error
		});
	};

	if (settings.deleteRequest) {
		if (isLink) {
			dialogId = Dialogs.Confirm('Подтверждение', 'Вы действительно хотите удалить ссылку?', continuee);
		} else {
			dialogId = Dialogs.Confirm('Подтверждение', 'Вы действительно хотите удалить документ?', continuee);
		}

	} else {
		continuee();
	}
}

function uploadDocument (owner, fileId, documentId, dataId, extParams, complete) {
	var params = {
		owner: owner,
		fileId: fileId,
		documentId: documentId,
		dataId: dataId,
		extParams: extParams,
		complete: complete,
		form: Asyst.Workspace.currentForm

	};
	innerUploadDocument(params);
}

function innerUploadDocument (innerParams) {
	var checkName = function (fileName) {
		var result = '';
		var cont = ['~', '#', '%', '&', '*', '{', '}', '\\', ':', '<', '>', '?', '/', '|', '"', '\'', '..'];
		var ending = ['.Files', '_files', '-Dateien', '_fichiers', '_bestanden', '_file', '_archivos', '-filer', '_tiedostot', '_pliki', '_soubory', '_elemei', '_ficheiros',
			'_arquivos', '_dosyalar', '_datoteke', '_fitxers', '_failid', '_fails', '_bylos', '_fajlovi', '_fitxategiak'];
		for (var i = 0; i < cont.length; i++) {
			if (fileName.indexOf(cont[i]) >= 0)
				result += '<li>' + Globa.JSRestrictContains.locale() + cont[i] + '</li>';
		}
		if (fileName[fileName.length - 1] == '.' || fileName[0] == '.')
			result += '<li>' + Globa.JSRestrictDotAround.locale() + '</li>';

		for (var i = 0; i < ending.length; i++) {
			var pos = fileName.indexOf(ending[i]);
			if (pos >= 0 && pos == fileName.length - ending[i].length)
				result += '<li>' + Globa.JSRestrictEnding.locale() + ending[i] + '</li>';
		}
		if (result != '')
			result = '<ul>' + result + '</ul>';
		return result;
	};
	//var form = Asyst.Workspace.currentForm;
	var activityPhaseId = innerParams.extParams.activityPhaseId;
	var settings = $(innerParams.owner).parents('.documents').data('asystDocuments');
	var formDocument = Enumerable.From(innerParams.form.Documents).Where('$.id == ' + innerParams.documentId).First();
	var $table = $('#' + innerParams.form.FormName + ' [phaseid=\'' + activityPhaseId + '\'] #' + innerParams.form.FormName + 'documentFiles' + innerParams.documentId).find('.accordion-inner tbody');

	var filePane = ((formDocument.isFile == 1) ? '\
        <div class="tab-pane active" id="tabUploadFile">\
          <div id="file-uploader"></div>\
        </div>' : '');
	var linkPane = ((formDocument.isLink == 1) ? '\
        <div class="tab-pane' + ((formDocument.isFile == 1) ? '' : ' active ') + '" id="tabUploadLink">\
          <div class="control-group" id="control-group-LinkName">\
            <label class="control-label" for="LinkName">' + Globa.LinkName.locale() + '</label>\
            <div class="controls">\
            <input type="text" id="LinkName" name="LinkName" class="span4"><span class="help-inline"><span></div>\
          </div>\
          <div class="control-group" id="control-group-LinkUrl">\
            <label class="control-label" for="LinkUrl">' + Globa.Link.locale() + '</label>\
            <div class="controls">\
            <input type="text" id="LinkUrl" name="LinkUrl" class="span4" title="' + Globa.JSLinkToolip.locale() + '" rel="tooltip"><span class="help-inline"><span></div>\
          </div>\
          <div class="control-group" id="control-group-LinkBtn">\
            <div class="controls">\
			<a id="uploadLinkButton" href="#" class="btn btn-success" >' + Globa.Add.locale() + '</a>\
			</div>\
          </div>\
		  <div id="uploadedLink">\
			<ul>\
			</ul>\
		  </div>\
        </div>' : '');

	var html = '' +
		'<div class="modal modal hide fade" id="documentUpload">' +
		'<input name="FileId" type="hidden" value"' + innerParams.fileId + '"/>' +
		'<input name="DocumentId" type="hidden" value"' + innerParams.documentId + '"/>' +
		'<input name="DataId" type="hidden" value"' + innerParams.dataId + '"/>' +
		'<div class="modal-header">' +
		'    <a class="close" data-dismiss="modal">×</a>' +
		'    <h3>' + Globa.FileLoading.locale() + '</h3>' +
		'</div>' +
		'<div class="modal-body form-horizontal" id="loadDocumentEditForm">' +
		'   <div class="tabbable"> \
			  <ul class="nav nav-tabs">\
				' + ((formDocument.isFile == 1) ? '<li class="active"><a href="#tabUploadFile" data-toggle="tab">' + Globa.Files.locale() + '</a></li>' : '') + '\
                ' + ((formDocument.isLink == 1) ? '<li><a href="#tabUploadLink" data-toggle="tab">' + Globa.Links.locale() + '</a></li>' : '') + '\
              </ul>\
              <div class="tab-content">' + filePane + linkPane + '\
              </div>\
            </div>' +
		'</div>' +
		'<div class="modal-footer">' +
		'   <a href="#" class="btn" data-dismiss="modal">' + Globa.Close.locale() + '</a>' +
		'</div>' +
		'</div>';

	var exists = $('#' + innerParams.form.FormName + ' #documentUploadForm').html();
	if (!exists)
		$('body').append('<div id="documentUploadForm"></div>');
	$('#documentUploadForm').html(html);
	$('#documentUpload').modal({backdrop: 'static', show: true});
	$('[rel="tooltip"]').tooltip({container: 'body'});


	var params = {fileId: innerParams.fileId, documentId: innerParams.documentId, dataId: innerParams.dataId};
	if (innerParams.extParams)
		for (var prop in innerParams.extParams)
			if (innerParams.extParams.hasOwnProperty(prop))
				params[prop] = innerParams.extParams[prop];

	function addFileLink (event, addParams) {
		var newParams = jQuery.extend({}, addParams);
		if (!newParams.hasOwnProperty('activityPhaseId'))
			newParams.activityPhaseId = 0;
		newParams.linkName = $('#LinkName').val();
		newParams.linkURL = $('#LinkUrl').val();
		//проверяем что не пустые

		if (newParams.linkName == '') {
			setInputWarning('#LinkName', true, Globa.JSEnterLinkName.locale());
			return;
		}
		var invalidLink = false;

		if ((newParams.linkURL.indexOf('http://') === -1) &&
			(newParams.linkURL.indexOf('https://') === -1) &&
			(newParams.linkURL.indexOf('ftp://') === -1) &&
			(newParams.linkURL.indexOf('ftps://') === -1) &&
			(newParams.linkURL.indexOf('file://') === -1) &&
			(newParams.linkURL.indexOf('mailto://') === -1) &&
			(newParams.linkURL.indexOf('/') === -1) &&
			(newParams.linkURL.indexOf(':\\') !== 1)) {
			invalidLink = true;
		}

		if (invalidLink) {
			setInputWarning('#LinkUrl', true, Globa.JSInvalidLinkFormat.locale());
			return;
		}

		setInputWarning('#LinkUrl', false);
		setInputWarning('#LinkName', false);
		Asyst.API.Document.saveLink({
			data: newParams,
			async: true,
			success: onComplete,
			error: function () {
				//error
			}
		});
	}

	function onComplete (response) {
		var row = '';

		Asyst.API.AdminTools.saveStats({page: response.url, pageTitle: response.name, type: 'document', action: 'save'}, true);
		response.icon = '/app/media/document/document.png';
		if (!(innerParams.extParams.hasOwnProperty('IsChangeRequest') && innerParams.extParams.IsChangeRequest == true)) {
			if (response.name)
				response.name = response.name.replace('<', '&lt;').replace('>', '&gt;');
			if (response.url)
				response.url = response.url.replace('\'', '%27').replace('"', '%22');

			$table.find('.no-documents').remove();

			if ($table.find('tr#file' + response.id).length === 0) {

				row += '      <tr id="file' + response.id + '">';
				row += '        <td><a href="' + response.url + '" target="_blank"><img src="' + response.icon + '">' + response.name + '</a></td>';
				row += '        <td></td>';
				row += '        <td style="width:41px">';
				row += '            <a class="documents-action-delete" href="#" onclick="deleteDocument(this, ' + response.id + ', ' + response.documentId + ', \'' + response.dataId + '\',\'' + response.name + '\')"><i class="icon-trash"/></a>';
				row += !(settings.showInfo || settings.showTags) ? '' : ('            <a class="documents-action-info" href="#" onclick="ShowInfo(' + response.id + ',' + settings.showInfo + ',' + settings.showTags + ')"><i class="icon-info-sign"/></a>');
				row += '        </td>';
				row += '      </tr>';

				$table.append(row);
				var $cnt = $(innerParams.owner).parents('#document' + innerParams.documentId).find('.all-badge');
				$cnt.text(parseFloat($cnt.text()) + 1);

				for (var i in innerParams.form.Documents) {
					var document = innerParams.form.Documents[i];
					if (document.id == innerParams.documentId) {
						if (document.files)
							document.files.push(response);
						else
							document.files = [response];
					}
				}
			}

			$('#uploadedLink ul').append('<li><a href=\'' + response.url + '\' target=\'_blank\'>' + response.name + '</a></li>');


			$('#LinkName').val('');
			$('#LinkUrl').val('');
		}

		if (innerParams.complete)
			innerParams.complete(response);

		innerParams.form.Events.onDocumentChange.fire({
			fileId: response.id,
			documentId: response.documentId,
			url: response.url,
			filename: response.name,
			dataId: response.dataId
		});
	}

	$('#uploadLinkButton').on('click', function (event) {
		addFileLink(event, params);
	});
	if (!document.getElementById('file-uploader')) return; // у нас только добавление ссылки, документы не прикладываются
	var uploader = new qq.FileUploader({
		element: document.getElementById('file-uploader'),
		action: '/api/file/upload',
		params: jQuery.extend({}, params),
		onComplete: function (id, fileName, response) {
			var row = '';
			if (response.success != true) {
				if (response.message == Globa.LicenseError) {
					LicenseErrorHandler(response.message, response.info);
					return;
				}
			} else {
				Asyst.API.AdminTools.saveStats({page: response.url, pageTitle: fileName, type: 'document', action: 'save'}, true);
				if (response.isNew) {
					if ((!response.icon) || response.icon == '')
						response.icon = '/app/media/document/document.png';
					if (!(innerParams.extParams.hasOwnProperty('IsChangeRequest') && innerParams.extParams.IsChangeRequest == true)) {

						$table.find('.no-documents').remove();

						if ($table.find('tr#file' + response.id).length === 0) {
							row += '      <tr id="file' + response.id + '">';
							row += '        <td><a href="' + response.url + '" target="_blank"><img src="' + response.icon + '">' + fileName + '</a></td>';
							row += '        <td></td>';
							row += '        <td style="width:41px">';
							row += '            <a class="documents-action-delete" href="#" onclick="deleteDocument(this, ' + response.id + ', ' + response.documentId + ', \'' + response.dataId + '\',\'' + fileName + '\')"><i class="icon-trash"/></a>';
							row += !(settings.showInfo || settings.showTags) ? '' : ('            <a class="documents-action-info" href="#" onclick="ShowInfo(' + response.id + ',' + settings.showInfo + ',' + settings.showTags + ')"><i class="icon-info-sign"/></a>');
							row += '        </td>';
							row += '      </tr>';

							$table.append(row);
							var $cnt = $(innerParams.owner).parents('#document' + innerParams.documentId).find('.all-badge');
							$cnt.text(parseFloat($cnt.text()) + 1);

							for (var i in innerParams.form.Documents) {
								var document = innerParams.form.Documents[i];
								if (document.id == innerParams.documentId) {
									if (document.files)
										document.files.push(response);
									else
										document.files = [response];
								}
							}
						}
					}
				}
			}
			if (innerParams.complete)
				innerParams.complete(response);

			innerParams.form.Events.onDocumentChange.fire({
				fileId: response.id,
				documentId: response.documentId,
				url: response.url,
				filename: response.name,
				dataId: response.dataId
			});

		},
		debug: false,
		onSubmit: function (id, filename) {
			var nameResult = checkName(filename);
			if (nameResult != '') {
				var item = uploader._addToList(id, filename);
				$(item).addClass(uploader._classes.fail);
				$(item).find('.' + uploader._classes.spinner).remove();
				$(item).find('.' + uploader._classes.cancel).remove();
				$(item).find('.qq-upload-failed-text').html(nameResult);
				return false;
			}

			var flag = true;
			var flagId = null;
			var document;
			Enumerable.From(innerParams.form.Documents).Where('$.id ==' + innerParams.documentId).ForEach(function (i) {
				document = i;
				if (Enumerable.From(i.files).Any(function (x) {
					if (x.name == filename) {
						flag = false;
						flagId = x.id;
					}
					return !flag;
				}))
					flag = false;
			});

			if (!flag) {
				this.params.fileId = flagId;
				this.params.isOverwrite = true;
			} else {
				delete this.params.fileId;
				delete this.params.isOverwrite;
			}

			try {
				innerParams.form.Events.onBeforeDocumentUpload.fire({document: document, filename: filename, fileId: this.params.fileId});
				return true;
			} catch (e) {
				return false;
			}
		},
		showMessage: function (message) {
			alert(message);
		},
		messages: {
			typeError: Globa.FileInvalidExtenstion.locale(),
			sizeError: Globa.FileTooLarge.locale(),
			minSizeError: Globa.FileTooSmall.locale(),
			emptyError: Globa.FileEmpty.locale(),
			onLeave: Globa.FileLeaveWarning.locale()
		}
	});
};

function ShowInfo (id, showInfo, showTags) {
	var form = Asyst.Workspace.currentForm;

	var readonly = true;
	var isLink = false;
	for (var i = 0, len = form.Documents.length; i < len; i++) {
		var item = form.Documents[i];
		for (var j = 0, lenf = item.files.length; j < lenf; j++) {
			if (item.files[j].id == id) {
				readonly = item.readonly;
				isLink = item.files[j].isLink == 1;
			}
		}
	}

	var html = '' +
		'<div class="modal modal hide fade" id="documentInfo">' +
		'<div class="modal-header">' +
		'    <a class="close" data-dismiss="modal">×</a>' +
		'    <h3>Свойства</h3>' +
		'</div>' +
		'<div class="modal-body form-horizontal">' +
		(showTags ?
				' <legend class="file-tag-head"> Тэги </legend>' +
				'   <div id="fileTags"> <input type="text" id="tagsInput" class="span7"/> </div>' : ''
		) +
		(showInfo && !isLink ?
				'   <legend class="file-info-head" style="display:none"> Версии </legend>' +
				'   <div id="fileInfo"> </div>' : ''
		) +
		'</div>' +
		'<div class="modal-footer">' +
		(showTags ? ('   <a href="javascript:SaveTags()" class="btn">' + Globa.Save.locale() + '</a>') : '') +
		'   <a href="#" class="btn" data-dismiss="modal">' + Globa.Close.locale() + '</a>' +
		'</div>' +
		'</div>';
	var exists = $('#' + form.FormName + ' #documentInfoForm').html();
	if (!exists)
		$('body').append('<div id="documentInfoForm"></div>');
	$('#documentInfoForm').html(html);
	$('#documentInfo').modal({backdrop: 'static', show: true});
	$('[rel="tooltip"]').tooltip({container: 'body'});
	$('#documentInfo').data('id', id);
	Asyst.API.Document.getInfo({
			data: {id: id},
			async: true,
			success: function (infos) {
				if (!isLink && infos.length > 0 && showInfo) {
					var infoHtml = '<div id="fileInfo"> ';
					var tags;
					for (var i = 0, len = infos.length; i < len; i++) {
						var item = infos[i];
						if (item.Version) {
							infoHtml += '<div>\
<a href="/api/file/getVersion/' + item.guid + '/' + item.Version + '/' + item.Name + '.' + item.Ext + '" >\
<span class="file-info-version"> Версия ' + item.Version + '</span></a>\
<span class="file-info-author"> ' + item.CreationAuthorName + '</span>\
<span class="file-info-date"> ' + Asyst.date.format(item.CreationDate, 'dd.MM.yyyy HH:mm:ss') + '</span>\
<span class="file-info-size"> ' + fileSizeToString(item.FileSize) + '</span>\
    </div>';
							tags = item.Tags;
							$('#documentInfo h3').text('Свойства ' + item.Name);
						}
					}

					$('#fileInfo').html(infoHtml);
					$('.file-info-head').show();
					$('#documentInfo h3').text('Свойства ' + item.Name);
				}
				if (showTags) {
					Asyst.API.Hashtag.getTagsInfo({
						data: {},
						async: true,
						success: function (tagsInfo) {
							var val = undefined;
							if (infos.length > 0)
								val = infos[0].Tags;
							if (readonly) {
								$('#tagsInput').val(val);
								$('#tagsInput').attr('readonly', true);
							} else {
								$('#tagsInput').val(val);
								$('#tagsInput').tagsinput({
									/*tagClass: function (item) {
								},*/
									//itemValue: 'HashtagId',
									//itemText: 'Name',
									confirmKeys: [13, 32],
									trimValue: true,
									typeahead: {
										source: function (query) {
											//return tagsInfo;
											return Enumerable.From(tagsInfo).Select('$.Name').Except(Enumerable.From($('#tagsInput').tagsinput('items'))).ToArray();
										}
									},
									interactive: !readonly
								});
								$('#tagsInput').on('beforeItemAdd', function () {
									setTimeout(function () {
										$('#tagsInput').parent().find('input').val('');
									}, 0);
								});
							}
						}
					});
				}
			}
		}
	);
}

function SaveTags () {
	var items = $('#tagsInput').tagsinput('items');

	var successSaveHashtag = function () {
		var docs = Asyst.Workspace.currentForm.Documents;
		for (var i = 0, dlen = docs.length; i < dlen; i++) {
			var files = docs[i].files;
			for (var j = 0, flen = files.length; j < flen; j++) {
				var f = files[j];
				if (f.id == $('#documentInfo').data('id'))
					f.tags = items;
			}
		}

		var el = $('#file' + $('#documentInfo').data('id') + ' td:first');
		el.find('.file-tags').remove();
		el.append(makeTagRow(items));
		el.find('.file-tag').on('click', function (event) {
			var tag = event.target.innerText;
			filterByTag(tag);
		});

		$('#documentInfo').modal('hide');
	};

	Asyst.API.Document.setHashtag({data: {fileId: $('#documentInfo').data('id'), hashtags: items}, success: successSaveHashtag});
}

function Documents (selector, formName, showInfo, showTags, deleteRequest) {
	if (typeof selector === 'object') {
		var options = selector;
		innerDocuments(options);
	} else {
		innerDocuments({
			selector: selector,
			formName: formName,
			showInfo: showInfo,
			showTags: showTags,
			deleteRequest: deleteRequest
		});
	}
}

function deleteOrAttachUnattachedFilesOnForm (form, isDeleting) {
	var documents = form && form.Documents;

	if (!(documents instanceof Array)) {
		return;
	}

	var files = getUnattachedFiles(documents);

	if (files.length === 0) {
		return;
	}

	if (isDeleting) {
		var filesToDeleting = files.map(function (file) {
			return {
				fileId: file.id,
				fileName: file.name
			};
		});

		Asyst.API.Document.deleteFile({
			data: {files: filesToDeleting},
			success: function () {
			},
			async: true
		});
	} else {
		var dataId = form && form.Data.id;
		var fileIdsToAttachment = files.map(function (file) {
			return file.id;
		});

		Asyst.API.Document.attachToCard({
			data: {dataId: dataId, arrOfNewDocs: fileIdsToAttachment},
			async: true,
			success: function () {
			},
			error: function (err) {
				Dialogs.Message('Ошибка при сохранении прикрепленных файлов.');
			}
		});
	}
}

function getUnattachedFiles (documents) {
	return documents.reduce(function (result, document, i, a) {
		var files = document.files;

		if (!files || files instanceof Array && files.length === 0) {
			return result;
		}

		return result.concat(
			files.filter(function (file) {
				return file.dataId === '';
			})
		);
	}, []);
}

function attachFileEventHandlers (attachedForm) {

	var attachOrDeleteHandler = function ($event, closedForm) {

		// Exclude attaching or deleting files on events of nested forms
		if (attachedForm !== closedForm) {
			return;
		}

		var isClosingWithoutSaving = !closedForm.Data.id;

		deleteOrAttachUnattachedFilesOnForm(closedForm, isClosingWithoutSaving);

		$(document).off('AsystFormClosed', attachOrDeleteHandler);
		$(window).off('beforeunload', deleteHandler);
	};

	var deleteHandler = function ($event, closedForm) {
		deleteOrAttachUnattachedFilesOnForm(closedForm, true);
	};

	$(document).on('AsystFormClosed', attachOrDeleteHandler);
	$(window).on('beforeunload', deleteHandler);
}

function innerDocuments (options) {
	if (!options.hasOwnProperty('selector')) {
		throw 'argument selector empty';
	}
	if (!options.hasOwnProperty('formName')) {
		throw 'argument formName empty';
	}

	var reg = function (_, form) {
		var success = function (data) {
			//если вызов пришел с другой формы - игнорируем его
			if (form.FormName !== options.formName) return;

			if (data) {

				form.Documents = data.documents;
				form.Documents.fileCount = function () {
					var cnt = 0;
					for (var d in form.Documents)
						if (jQuery.isArray(form.Documents[d].files))
							cnt += form.Documents[d].files.length;
					return cnt;
				};
			}
			var phases = [];
			options.documents = data.documents;

			var settings = jQuery.extend({
				dataId: form.EntityId,
				entityId: form.Data.classid,
				phases: phases,
				documents: [
					{id: 0, name: 'Name', files: [{id: 0, name: 'File.txt', url: '.', icon: '/app/media/document/document.png'}]}
				],
				showInfo: false, showTags: false, deleteRequest: true
			}, options);

			$(options.selector).documents(settings);
			if (form.isNew) {
				attachFileEventHandlers(form);
			}
		};

		Asyst.API.Document.getFiles({
			data: {id: form.Data.id, classname: form.Data.classname, activityPhaseId: form.Data.ActivityPhaseId},
			async: true,
			success: success,
			error: null
		});
	};

	$(document).on('AsystFormBeforeOpen', reg);
}