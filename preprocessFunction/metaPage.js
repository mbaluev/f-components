if (!window['GridFunc']) window['GridFunc'] = {};
GridFunc.onMetaPageEditClick = function(PageId){
	Asyst.Workspace.openEntityDialog({
		entityName: 'MetaPage',
		title: 'MetaPage',
		id: PageId,
		success: gridView.Reload
	});
};
GridFunc.onMetaPageViewClick = function(PageId){
	var formData = Asyst.API.Entity.load({entityName: 'MetaPage', dataId: PageId, async:false});
	var fields = {
		Name: formData.Name,
		Title: formData.Title,
		Description: formData.Description,
		IsMaster: formData.IsMaster,
		PlaceholderName: formData.PlaceholderName,
		MasterPageId: formData.MasterPageId
	};
	Asyst.Workspace.openEntityDialog('MetaPage', '<<НОВАЯ СТРАНИЦА>>', undefined, gridView.Reload, fields);
};
GridFunc.onCopyPath = function(PageId){
	var item = data.filter(function(a){return a.PageId === PageId})[0];
	var s = item.Title + ' [' + item.Name + ']';
	var d = $('<textarea id=\"tempel\">');
	d.val(s);
	$('body').append(d);
	d[0].select();
	document.execCommand('copy');
	d[0].parentNode.removeChild(d[0]);
};