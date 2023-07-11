
const chromeVersion = document.getElementById('chrome-version');
const nodeVersion = document.getElementById('node-version');
const electronVersion = document.getElementById('electron-version');

chromeVersion.innerText = versions.chrome();
nodeVersion.innerText = versions.node();
electronVersion.innerText = versions.electron();

const txtHost = document.getElementById('txtHost');
const txtPortFrom = document.getElementById('txtPortFrom');
const txtPortTo = document.getElementById('txtPortTo');

const logview = document.getElementById('logview');
// 将console.log打印至页面
const logger = document.getElementById('log');
console.log = function (message) {
    if (typeof message == 'object') {
        logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
    } else {
        logger.innerHTML += message + '<br />';
    }
    logview.scrollTop = logview.scrollHeight;
}

console.error = function (message) {
    if (typeof message == 'object') {
        logger.innerHTML += '<font color="#FF0000">' + (JSON && JSON.stringify ? JSON.stringify(message) : message) + '</font><br />';
    } else {
        logger.innerHTML += '<font color="#FF0000">' + message + '</font><br />';
    }
    logview.scrollTop = logview.scrollHeight;
}


const _start = document.getElementById('btnServiceStart');
const _stop = document.getElementById('btnServiceStop');
const _logClear = document.getElementById('btnLogClear');


_start.addEventListener('click', () => {
    const host = txtHost.value;
    const portFrom = parseInt(txtPortFrom.value);
    const portTo = parseInt(txtPortTo.value);

    // const args = [
    //     { host: '127.0.0.1', port: 10001 },
    //     { host: '127.0.0.1', port: 10002 },
    //     { host: '127.0.0.1', port: 10003 },
    //     { host: '127.0.0.1', port: 10004 }];

    let args = [];
    for (let index = portFrom; index <= portTo; index++) {
        args = [ ... args, { host, port: index }];      
    }
    
    //window.serviceAPI.start(args);  //主进程到渲染器进程（单向）
    const promise = window.serviceAPI.start(args);  //（双向）
    
    promise.then(results => {
        _start.disabled = true;
        _stop.disabled = false;

        txtHost.disabled = true;
        txtPortFrom.disabled = true;
        txtPortTo.disabled = true;

        results.forEach(result => {
            if (result.error <= 0 && result.listen === 1) {
                const msg = `${result.host}:${result.port} 开启监听...`;
                console.log(msg);
            } else {
                const msg = `${result.host}:${result.port} 开启失败！错误代码：${result.error}`;
                console.error(msg);
            }
        });
    }).catch(err => {
            const msg = `服务开启失败！${err}`;
            console.error(msg);
        });
    });

_stop.addEventListener('click', () => {
    const args = [];

    const promise = window.serviceAPI.stop(args);
    promise.then(results => {
        _start.disabled = false;
        _stop.disabled = true;

        txtHost.disabled = false;
        txtPortFrom.disabled = false;
        txtPortTo.disabled = false;

        results.forEach(result => {
            if (result.error <= 0 && result.listen === 0) {
                const msg = `${result.host}:${result.port} 关闭监听...`;
                console.log(msg);
            } else {
                const msg = `${result.host}:${result.port} 关闭失败！错误代码：${result.error}`;
                console.error(msg);
            }
        });
    }).catch(err => {
        const msg = `服务关闭失败！${err}`;
        console.log(msg);
    });
});

_logClear.addEventListener('click', () => {
    logger.innerHTML = "";
});

window.serviceAPI.message((event, value) => {
    console.log(value);
});

