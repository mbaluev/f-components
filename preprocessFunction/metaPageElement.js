if (!window['GridFunc']) window['GridFunc'] = {};
GridFunc.onMetaPageElementEditClick = function(PageElementId){
	Asyst.Workspace.openEntityDialog({
		entityName: 'MetaPageElement',
		title: 'MetaPageElement',
		id: PageElementId,
		success: gridView.Reload
	});
};
GridFunc.onMetaPageElementViewClick = function(PageElementId){
	var formData = Asyst.API.Entity.load({entityName: 'MetaPageElement', dataId: PageElementId, async:false});
	var fields = {
		PageId: formData.PageId,
		Name: formData.Name,
		Title: formData.Title,
		Description: formData.Description,
		ElementType: formData.ElementType,
		Position: formData.Position,
		IsTemplate: formData.IsTemplate,
		PicklistQuery: formData.PicklistQuery
	};
	Asyst.Workspace.openEntityDialog('MetaPageElement', '<<НОВЫЙ ЭЛЕМЕНТ>>', undefined, gridView.Reload, fields);
	//т.к. передача content через fields не всегда возможна из-за длины get-запроса, внедряем его явно в коде.
	var setContent = function(){
		var form = Asyst.Workspace.currentForm;
		if (form && form.hasOwnProperty('myCodeMirror') && form.Data && (form.Data.hasOwnProperty('Content') || form.Data.hasOwnProperty('PicklistQuery'))){
			if (!form.Data.Content){
				form.Data.Content = formData.Content;
                form.myCodeMirror.setValue(formData.Content);
			}
			if (!form.Data.PicklistQuery && formData.PicklistQuery){
				form.Data.PicklistQuery = formData.PicklistQuery;
                form.myCodeMirror.setValue(formData.PicklistQuery);
			}
		}
		else
		setTimeout(setContent, 100);
	};
	setContent();
};
GridFunc.onCopyPath = function(PageElementId){
	var item = data.filter(function(a){return a.PageElementId === PageElementId})[0];
	var s = item.PageTitle + ' [' + item.PageName + ']' + item.Title + ' [' + $(item.Name).text() +']';
	var d = $('<textarea id=\"tempel\">');
	d.val(s);
	$('body').append(d);
	d[0].select();
	document.execCommand('copy');
	d[0].parentNode.removeChild(d[0]);
};