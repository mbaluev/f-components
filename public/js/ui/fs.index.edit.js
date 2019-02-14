// - edit form controls
$(function(){
    kendo_controls_init();
    $('#form-edit [data-toggle="f-tab"][data-active="true"]').trigger('click', false);
});
function kendo_controls_init(){
    $('#StrategicDirectionId').kendoDropDownList({ autoWidth: true });
    $('#PriorityId').kendoDropDownList({ autoWidth: true });
    $('#ProjectTypeId').kendoDropDownList({ autoWidth: true });
    $('#ActivityPhaseId').kendoDropDownList({ autoWidth: true });
    $('#ParentId').kendoDropDownList({ autoWidth: true });
    $('#ActivityGoal').kendoMultiSelect({ autoWidth: true });
    $('#Customer').kendoDropDownList({ filter: 'startwith' });
    $('#Owner').kendoDropDownList();
    $('#Leader').kendoDropDownList();
    $('#Administrator').kendoMultiSelect();
    $('#WorkGroup').kendoMultiSelect();
    $('#PassportDeveloper').kendoDropDownList();
    $('#SummaryPlanDeveloper').kendoDropDownList();
}
function kendo_controls_destroy(){
    $("#StrategicDirectionId").data("kendoDropDownList").destroy();
    $("#PriorityId").data("kendoDropDownList").destroy();
    $("#ProjectTypeId").data("kendoDropDownList").destroy();
    $("#ActivityPhaseId").data("kendoDropDownList").destroy();
    $("#ParentId").data("kendoDropDownList").destroy();
    $("#ActivityGoal").data("kendoMultiSelect").destroy();
    $("#Customer").data("kendoDropDownList").destroy();
    $("#Owner").data("kendoDropDownList").destroy();
    $("#Leader").data("kendoDropDownList").destroy();
    $("#Administrator").data("kendoMultiSelect").destroy();
    $("#WorkGroup").data("kendoMultiSelect").destroy();
    $("#PassportDeveloper").data("kendoDropDownList").destroy();
    $("#SummaryPlanDeveloper").data("kendoDropDownList").destroy();
}
