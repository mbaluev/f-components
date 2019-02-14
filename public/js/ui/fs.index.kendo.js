// - kendo controls -
$(function(){
    kendo.culture('ru-RU');

    // auto complete
    var data = [
        "Albania",
        "Andorra",
        "Armenia",
        "Austria",
        "Azerbaijan",
        "Belarus",
        "Belgium",
        "Bosnia & Herzegovina",
        "Bulgaria",
        "Croatia",
        "Cyprus",
        "Czech Republic",
        "Denmark",
        "Estonia",
        "Finland",
        "France",
        "Georgia",
        "Germany",
        "Greece",
        "Hungary",
        "Iceland",
        "Ireland",
        "Italy",
        "Kosovo",
        "Latvia",
        "Liechtenstein",
        "Lithuania",
        "Luxembourg",
        "Macedonia",
        "Malta",
        "Moldova",
        "Monaco",
        "Montenegro",
        "Netherlands",
        "Norway",
        "Poland",
        "Portugal",
        "Romania",
        "Russia",
        "San Marino",
        "Serbia",
        "Slovakia",
        "Slovenia",
        "Spain",
        "Sweden",
        "Switzerland",
        "Turkey",
        "Ukraine",
        "United Kingdom",
        "Vatican City"
    ];
    $("#input-country").kendoAutoComplete({
        dataSource: data,
        filter: "startswith",
        placeholder: "Выберите страну...",
        separator: ", "
    });

    // create ComboBox from input HTML element
    $("#input-combobox").kendoComboBox({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: [
            { text: "Хлопок", value: "1" },
            { text: "Полиэстер", value: "2" },
            { text: "Хлопок/Полиэстер", value: "3" }
        ],
        filter: "contains",
        suggest: true,
        index: 3
    });

    // create ComboBox from select HTML element
    $("#select-combobox").kendoComboBox();

    // date input
    $("#input-date").kendoDateInput();

    // form validate
    var validator_edit = $('#form-main-edit').kendoValidator().data('kendoValidator');
    var validator_fields = $('#form-main-fields').kendoValidator().data('kendoValidator');

    // create DatePicker from input HTML element
    $("#input-datepicker").kendoDatePicker();
    $("#input-monthpicker").kendoDatePicker({
        // defines the start view
        start: "year",

        // defines when the calendar should return date
        depth: "year",

        // display month and year in the input
        format: "MMMM yyyy",

        // specifies that DateInput is used for masking the input element
        dateInput: true
    });

    // create DateTimePicker from input HTML element
    $("#input-datetimepicker").kendoDateTimePicker({
        value: new Date(),
        dateInput: true
    });

    // date range picker
    $("#div-daterangepicker").kendoDateRangePicker({
        labels: false,
        messages: {
            startLabel: "Начало",
            endLabel: "Окончание"
        }
    });

    // create DropDownList from input HTML element
    data = [
        { text: "Black", value: "1" },
        { text: "Orange", value: "2" },
        { text: "Grey", value: "3" }
    ];
    $("#input-dropdownlist").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: data,
        index: 0,
        change: function(e){
            console.log($("#input-dropdownlist").val());
        }
    });

    // create DropDownList from select HTML element
    $("#select-dropdownlist").kendoDropDownList();

    // create kendoDropDownTree from input HTML element
    $("#input-dropdowntree").kendoDropDownTree({
        placeholder: "Выберите ...",
        height: "auto",
        dataSource: [
            {
                text: "Furniture",
                expanded: true,
                items: [
                    { text: "Tables & Chairs" },
                    { text: "Sofas" },
                    { text: "Occasional Furniture" }
                ]
            },
            {
                text: "Decor",
                items: [
                    { text: "Bed Linen" },
                    { text: "Curtains & Blinds" },
                    { text: "Carpets" }
                ]
            }
        ]
    });

    // masked textbox
    $("#phone_number").kendoMaskedTextBox({
        mask: "(999) 000-0000"
    });
    $("#credit_card").kendoMaskedTextBox({
        mask: "0000 0000 0000 0000"
    });
    $("#ssn").kendoMaskedTextBox({
        mask: "000-00-0000"
    });
    $("#postcode").kendoMaskedTextBox({
        mask: "L0L 0LL"
    });

    // multiColumnCombobox virtualization
    /*
    $("#input-multicolumncombobox").kendoMultiColumnComboBox({
        dataTextField: "ContactName",
        dataValueField: "CustomerID",
        height: 400,
        columns: [
            {
                field: "ContactName", title: "Contact Name", template: "<div class='customer-photo'" +
            "style='background-image: url(../content/web/Customers/#:data.CustomerID#.jpg);'></div>" +
            "<span class='customer-name'>#: ContactName #</span>", width: 200
            },
            { field: "ContactTitle", title: "Contact Title", width: 200 },
            { field: "CompanyName", title: "Company Name", width: 200 },
            { field: "Country", title: "Country", width: 200 }
        ],
        footerTemplate: 'Total #: instance.dataSource.total() # items found',
        filter: "contains",
        filterFields: ["ContactName", "ContactTitle", "CompanyName", "Country"],
        dataSource: {
            type: "odata",
            transport: {
                read: "https://demos.telerik.com/kendo-ui/service/Northwind.svc/Customers"
            }
        }
    });
    */
    $("#input-multicolumncombobox").kendoMultiColumnComboBox({
        dataTextField: "ShipName",
        dataValueField: "OrderID",
        columns: [
            { field: "OrderID", title: "Order", width: 100 },
            { field: "ShipName", title: "Ship", width: 300 },
            { field: "ShipCountry", title: "Country", width: 200 }
        ],
        virtual: {
            itemHeight: 33,
            valueMapper: function(options) {
                $.ajax({
                    url: "https://demos.telerik.com/kendo-ui/service/Orders/ValueMapper",
                    type: "GET",
                    dataType: "jsonp",
                    data: convertValues(options.value),
                    success: function (data) {
                        options.success(data);
                    }
                })
            }
        },
        height: 290,
        dataSource: {
            type: "odata",
            transport: {
                read: "https://demos.telerik.com/kendo-ui/service/Northwind.svc/Orders"
            },
            schema: {
                model: {
                    fields: {
                        OrderID: { type: "number" },
                        Freight: { type: "number" },
                        ShipName: { type: "string" },
                        OrderDate: { type: "date" },
                        ShipCity: { type: "string" }
                    }
                }
            },
            pageSize: 80,
            serverPaging: true,
            serverFiltering: true
        }
    });
    function convertValues(value) {
        var data = {};
        value = $.isArray(value) ? value : [value];
        for (var idx = 0; idx < value.length; idx++) {
            data["values[" + idx + "]"] = value[idx];
        }
        return data;
    }

    // create MultiSelect from select HTML element
    $("#select-multiselect").kendoMultiSelect();

    // create NumericTextBox from input HTML element
    $("#input-numeric").kendoNumericTextBox();

    // create Curerncy NumericTextBox from input HTML element
    $("#input-currency").kendoNumericTextBox({
        format: "c",
        decimals: 3
    });

    // create Percentage NumericTextBox from input HTML element
    $("#input-percentage").kendoNumericTextBox({
        format: "p0",
        min: 0,
        max: 0.1,
        step: 0.01
    });

    // create NumericTextBox from input HTML element using custom format
    $("#input-weight").kendoNumericTextBox({
        format: "#.00 kg"
    });

    // slider
    $("#input-slider").kendoSlider({
        increaseButtonTitle: "Right",
        decreaseButtonTitle: "Left",
        min: -10,
        max: 10,
        smallStep: 2,
        largeStep: 1
    })

    // create TimePicker from input HTML element
    $("#input-timepicker").kendoTimePicker({
        dateInput: true
    });

    // create uploader
    $("#input-files").kendoUpload();

    // create switch
    $("#input-switch").kendoSwitch();
});
