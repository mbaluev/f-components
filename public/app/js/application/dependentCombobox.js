//зависимые комбобоксы
Asyst.DependentCombobox = function (binding) {
    'use strict';

    var currentForm = binding.Form,
        //$dependsOnSelect = currentForm.$("select[name=" + binding.DependOn + "]"),
        dependonbinding = currentForm.Bindings[binding.DependOn],
        idIndex = binding.ElementName.indexOf("Id"),
        accessName = idIndex === (binding.ElementName.length - 2) ? binding.ElementName.substring(0, idIndex) : binding.ElementName;

    if (dependonbinding == null) return;

    function checkAndDisable() {
        var value = currentForm.Data[dependonbinding.PropertyName];
        var access = currentForm.Access,
            accessReadonly = (typeof access !== 'undefined' && access.hasOwnProperty(accessName) && access[accessName].IsReadonly);
        var enabled = !accessReadonly && value !== null && value !== undefined && value !== '';
        binding.enableInput(enabled);

    }

    function changeHandler() {
        var access = currentForm.Access,
            accessReadonly = (typeof access !== 'undefined' && access.hasOwnProperty(accessName) && access[accessName].IsReadonly);

        var enabled = !accessReadonly && !dependonbinding.isEmpty;
        binding.enableInput(enabled);

        currentForm.Update();
        binding.loadSelect(null, true, function () {
            binding.Element.change();
        });

        return true;
    };

    currentForm.onDataLoaded(checkAndDisable);
    dependonbinding.onChange(changeHandler);
    
};

