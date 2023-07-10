
const chromeVersion = document.getElementById('chrome-version');
const nodeVersion = document.getElementById('node-version');
const electronVersion = document.getElementById('electron-version');

chromeVersion.innerText = versions.chrome();
nodeVersion.innerText = versions.node();
electronVersion.innerText = versions.electron();

const txtHost = document.getElementById('txtHost');
const txtPortFrom = document.getElementById('txtPortFrom');
const txtPortTo = document.getElementById('txtPortTo');


// 将console.log打印至页面
const logger = document.getElementById('log');
console.log = function (message) {
    if (typeof message == 'object') {
        logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
    } else {
        logger.innerHTML += message + '<br />';
    }
}

console.error = function (err) {
    if (typeof err == 'object') {
        logger.innerHTML += '<font color="#FF0000">' + (JSON && JSON.stringify ? JSON.stringify(err) : err) + '</font><br />';
    } else {
        logger.innerHTML += '<font color="#FF0000">' + err + '</font><br />';
    }
}


const _start = document.getElementById('btnServiceStart');
const _stop = document.getElementById('btnServiceStop');
const _logClear = document.getElementById('btnLogClear');


_start.addEventListener('click', () => {
    const host = txtHost.value;
    const portFrom = parseInt(txtPortFrom.value);
    const portTo = parseInt(txtPortTo.value);

    allowEdit(false);

    let args = [];
    for (let index = portFrom; index <= portTo; index++) {
        let arg = { host, port: index };
        args = [ ... args, arg];
    }

    const promise = window.serviceAPI.start(args);
    promise.then(result => {
        const msg = `服务启动...`
        console.log(msg);
    }).catch(error => {
        const err = `服务启动失败！`;
        console.error(error);
        allowEdit(ture);
    });    

});

function allowEdit(allow) {
    _start.disabled = !allow;
    _stop.disabled = allow;

    txtHost.disabled = !allow;
    txtPortFrom.disabled = !allow;
    txtPortTo.disabled = !allow;
}


_stop.addEventListener('click', () => {
    const promise = window.serviceAPI.stop();
    promise.then(results => {
        if (results) {
            const msg = `服务停止`;
            console.log(msg);
        }
    }).catch(err => {
        const msg = `服务停止失败！${err}`;
        console.log(msg);
    });

    allowEdit(true);

});

_logClear.addEventListener('click', () => {
    logger.innerHTML = "";
});

window.serviceAPI.message((event, value) => {
    console.log(value);
});

window.serviceAPI.error((event, value) => {
    console.error(value);
});