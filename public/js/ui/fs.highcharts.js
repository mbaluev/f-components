// highcharts default
Highcharts.setOptions({
    legend: {
        enabled: false,
        itemStyle: {
            fontSize: '13px',
            fontWeight: 'normal',
            color: '#666'
        }
    },
    credits: { enabled: false },
    exporting: { enabled: false },
    colors: ['#ff5940', '#fa8f42', '#ffd246', '#faf61', '#3880ff', '#8e6bf5', '#d644d6', '#666666'],
    chart: {
        zoomType: 'xy',
        spacing: [0,2,5,2],
        backgroundColor: '#fff'
    },
    title: { text: '' },
    lang: {
        noData: "Нет данных"
    },
    noData: {
        style: {
            fontFamily: 'Roboto Mono',
            fontSize: '13px',
            color: '#333'
        }
    },
    xAxis: {
        title: {
            text: '',
            style: {
                color: '#666'
            }
        },
        gridLineColor: '#eee',
        lineColor: '#eee',
        tickColor: '#eee',
        labels: {
            enabled: false,
            style: {
                fontFamily: 'Roboto Mono',
                fontSize: '12px',
                color: '#666'
            }
        }
    },
    yAxis: {
        title: {
            text: '',
            style: {
                color: '#666'
            }
        },
        gridLineColor: '#eee',
        lineColor: '#eee',
        tickColor: '#eee',
        labels: {
            enabled: false,
            style: {
                fontFamily: 'Roboto Mono',
                fontSize: '12px',
                color: '#666'
            }
        }
    },
    plotOptions: {
        pie: {
            size: '100%',
            showInLegend: true,
            borderWidth: 1,
            borderColor: '#fff',
            shadow: false,
            dataLabels: {
                enabled: true,
                inside: true,
                distance: -15,
                format: '{point.y}',
                style: {
                    fontFamily: 'Roboto Mono',
                    fontSize: '13px',
                    fontWeight: 'normal',
                    color: '#fff',
                    textOutline: 'none'
                }
            }
        },
        column: {
            shadow: false,
            dataLabels: {
                enabled: true,
                style: {
                    fontFamily: 'Roboto Mono',
                    fontSize: '13px',
                    color: '#666',
                    textOutline: 'none'
                },
                formatter: function() { return this.y; }
            }
        },
        series: {
            cursor: 'pointer'
        }
    },
    tooltip: {
        pointFormat: '{point.name} - {point.y}',
        headerFormat: '',
        backgroundColor: 'rgba(0,0,0,.9)',
        borderColor: 'transparent',
        shadow: false,
        outside: true,
        style: {
            fontFamily: 'Roboto Mono',
            fontSize: '13px',
            color: '#fff',
            width: 250,
            whiteSpace: 'normal'
        }
    }
});

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

function bindWidgetResize(id, chart){
    $(window).on('resize', function(){
        var resizable = $('#'+id).closest('.f-widget').data('resizable');
        if (resizable) {
            chart.setSize(getWidgetSize(id).width, getWidgetSize(id).height, true);
        }
    });
}
function getWidgetSize(id){
    return {
        width: $('#'+id).width(),
        height: $('#'+id).height()
    };
}
