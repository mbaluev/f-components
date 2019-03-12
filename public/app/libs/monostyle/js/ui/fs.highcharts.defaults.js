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
