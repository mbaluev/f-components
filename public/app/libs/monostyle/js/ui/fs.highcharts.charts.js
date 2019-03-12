// point chart
$(function(){
    var id = 'PointChartContainer';
    var data = [
        {
            name: 'В работе по плану',
            y: 42,
            color: '#666',
            url: '/asyst/page/register?view=MyPoint&Field1Name=IndicatorId&Field1Value=0&Field2Name=IsMilestone&Field2Value=Да&ExpandGroup=true&hideFilterPanel=1&ViewSampleId=null'
        },
        {
            name: 'Выполнено',
            y: 118,
            color: '#5faf61',
            url: '/asyst/page/register?view=MyPoint&Field1Name=IndicatorId&Field1Value=4&Field2Name=IsMilestone&Field2Value=Да&ExpandGroup=true&hideFilterPanel=1&ViewSampleId=null'
        },
        {
            name: 'Подтверждено',
            y: 62,
            color: '#ffd246',
            url: '/asyst/page/register?view=MyPoint&Field1Name=IndicatorId&Field1Value=1&Field2Name=IsMilestone&Field2Value=Да&ExpandGroup=true&hideFilterPanel=1&ViewSampleId=null'
        },
        {
            name: 'Просрочено',
            y: 607,
            color: '#ff5940',
            url: '/asyst/page/register?view=MyPoint&Field1Name=IndicatorId&Field1Value=3&Field2Name=IsMilestone&Field2Value=Да&ExpandGroup=true&hideFilterPanel=1&ViewSampleId=null'
        }
    ];
    var chart = new Highcharts.Chart({
        chart: {
            renderTo: id,
            type: 'pie',
            width: getWidgetSize(id).width,
            height: getWidgetSize(id).height
        },
        plotOptions: {
            series: {
                point: {
                    events: {
                        click: function() {
                            location.href = this.options.url;
                        }
                    }
                }
            }
        },
        series: [{
            data: data
        }]
    });
    bindWidgetResize(id, chart);
});

// order chart
$(function(){
    var id = 'OrderChartContainer';
    var data = [
        {
            name: 'Новое',
            y: 26,
            color: '#5faf61',
            url: '/asyst/page/register?view=MyOrder&Field1Name=IndicatorId&Field1Value=8&ExpandGroup=true&hideFilterPanel=1&ViewSampleId=null'
        },
        {
            name: 'Просрочено',
            y: 4,
            color: '#ff5940',
            url: '/asyst/page/register?view=MyOrder&Field1Name=IndicatorId&Field1Value=3&ExpandGroup=true&hideFilterPanel=1&ViewSampleId=null'
        }
    ];
    var chart = new Highcharts.Chart({
        chart: {
            renderTo: id,
            type: 'column',
            width: getWidgetSize(id).width,
            height: getWidgetSize(id).height,
        },
        plotOptions: {
            series: {
                pointPadding: -0.15,
                point: {
                    events: {
                        click: function() { location.href = this.options.url; }
                    }
                }
            }
        },
        series: [{
            data: data
        }]
    });
    bindWidgetResize(id, chart);
});

// change request chart
$(function(){
    var id = 'ChangeRequestChartContainer';
    var data = [
        {
            name: 'Регистрация просрочена',
            y: 5,
            color: '#ff5940',
            url: '/asyst/page/register?view=ForMeInitiativeView&Field1Name=IndicatorId&Field1Value=3&hideFilterPanel=1&ViewSampleId=null'
        },
        {
            name: 'Отправлено на ПК',
            y: 2,
            color: '#ffd246',
            url: '/asyst/page/register?view=ForMeInitiativeView&Field1Name=IndicatorId&Field1Value=8&hideFilterPanel=1&ViewSampleId=null'
        },
        {
            name: 'Утверждено',
            y: 1,
            color: '#5faf61',
            url: '/asyst/page/register?view=ForMeInitiativeView&Field1Name=IndicatorId&Field1Value=4&hideFilterPanel=1&ViewSampleId=null'
        }
    ];
    var chart = new Highcharts.Chart({
        chart: {
            renderTo: id,
            type: 'pie',
            width: getWidgetSize(id).width,
            height: getWidgetSize(id).height
        },
        plotOptions: {
            pie: {
                innerSize: '50%'
            },
            series: {
                point: {
                    events: {
                        click: function() {
                            location.href = this.options.url;
                        }
                    }
                }
            }
        },
        series: [{
            data: data
        }]
    });
    bindWidgetResize(id, chart);
});
