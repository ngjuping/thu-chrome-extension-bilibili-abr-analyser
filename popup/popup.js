let abr_logs = {}

chrome.runtime.sendMessage({action: 'get_logs'}, function (response) {

    abr_logs = response.data

    if (Object.keys(abr_logs).length === 0) {
        document.getElementById('logs_selection').style.display = 'none'
    } else {
        document.getElementById('empty_logs_hint').style.display = 'none'

        let logs = document.getElementById('logs')
        for (const [key, log] of Object.entries(abr_logs)) {
            let option = document.createElement('option')
            option.text = log['title']
            option.value = key
            logs.add(option)
        }
    }

});

document.getElementById('download_log').addEventListener("click", download_csv)

function download_csv() {

    let log_key = document.getElementById('logs').value

    let csv = abr_logs[log_key]['header'] + '\n';
    abr_logs[log_key]['data'].forEach(function (row) {
        csv += row + '\n';
    });

    let hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = `ABR-LOG-${abr_logs[log_key]['title']}.csv`;
    hiddenElement.click();
}

document.getElementById('clear_logs').addEventListener("click", clear_logs)

function clear_logs(){
    abr_logs = {}
    document.getElementById('logs_selection').style.display = 'none'
    document.getElementById('empty_logs_hint').style.display = 'initial'
    let logs = document.getElementById('logs')
    while (logs.options.length > 0) {
        logs.remove(0);
    }
    chrome.runtime.sendMessage({action: 'clear_logs'})
}
