
// Extracting emotion keys dynamically
const emotionKeys = Object.keys(log[0]).filter(key => key !== 'snapshot_id' && key !== 'user_id' && key !== 'time_stamp' && key !== 'notes');
console.log(emotionKeys);
// Initialize chart data object
const chartData = {
    labels: log.map(entry => {
        const date = new Date(entry.time_stamp);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }),
    datasets: emotionKeys.map((key, index) => {
        return {
            label: key,
            data: log.map(entry => entry[key]),
            borderColor: '#' + (Math.random().toString(16) + '000000').substring(2, 8), // Random color
            fill: false
        };
    })
};

// Create chart canvas element
const canvas = document.getElementById('emotionChart');
const ctx = canvas.getContext('2d');

// Create chart
new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'Emotions Over Time'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Emotion Value'
                }
            }]
        }
    }
});
