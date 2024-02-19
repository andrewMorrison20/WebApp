


var yvals = [1, 2, 3, 4, 5, 6, 7, 8];
var xlabels = [1, 2, 3, 4, 5, 6, 7, 8];
const chartdata = {
    labels: xlabels,
    datasets: [{
        data: yvals,
        lineTension: 0,
        pointRadius: 3,
        backgroundColor: 'lightgray',
        bordercColor: 'red',
        borderWidth: 1
    }]
};

const chartconfig = {
    type: 'line',
    data: chartdata,
    options: {
        animation: true,
        maintainAspectRatio: true,
        scales: { y: { min: 0, max: 20 } },
        plugins: {
            legend: { display: false },
            tooltips: { enabled: true },
            tile: {
                display: true,
                text: "Emotions over time",
                font: { size: 20 },
            }
        }
    }

};
var yvals2 = [1, 2, 3, 4, 5, 6, 7, 8];
var xlabels2 = [1, 2, 3, 4, 5, 6, 7, 8];
const chartdata2 = {
    labels: xlabels2,
    datasets: [{
        data: yvals2,
        lineTension: 0,
        pointRadius: 3,
        backgroundColor: 'lightgray',
        bordercColor: 'red',
        borderWidth: 1
    }]
};

const chartconfig2 = {
    type: 'bar',
    data: chartdata2,
    options: {
        animation: true,
        maintainAspectRatio: true,
        scales: { y: { min: 0, max: 20 } },
        plugins: {
            legend: { display: false },
            tooltips: { enabled: true },
            tile: {
                display: true,
                text: " Triggers",
                font: { size: 20 },
            }
        }
    }

};

const chart = new Chart('emotionChart', chartconfig);

const chart2 = new Chart('triggersChart', chartconfig2);