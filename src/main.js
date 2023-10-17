const { app, BrowserWindow, ipcMain } = require('electron');
const { Socket } = require('dgram');
const net = require('net');
const Buffer = require('buffer').Buffer;
const path = require('path');
const { request } = require('http');
const { Console } = require('console');

let win;
let SERVERS = [];

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
    win.maximize();

    win.webContents.openDevTools();

}

app.whenReady().then(() => {

    // 使用 ipcMain.on API 设置一个 IPC 监听器，接收渲染器进程ipcRenderer.send发送的消息
    ipcMain.handle('service-start', handleServiceStart);    //双向
    ipcMain.handle('service-stop', handleServiceStop);

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    })

    async function handleServiceStart(event, args) {

        args.forEach(arg => {
            const now = new Date();
            const server = net.createServer();
            serverListen(arg).then(result => {
                if (result) {
                    const msg = `${formatTime(now)} ${arg.host}:${arg.port} 监听开始...`;
                    win.webContents.send('message', msg);
                }
            }).catch(e => {
                err = `${formatTime(now)} ${e.host}:${e.port} 发生错误：${e.error}`;
                win.webContents.send('error', err);
            });
        });
    
        return true;
    }

    async function handleServiceStop(event, args) {
        while (SERVERS.length > 0) {
            const now = new Date();
            const server = SERVERS.pop();
            const host = server.address().address;
            const port = server.address().port;

            server.close();
            const msg = `${formatTime(now)} ${host}:${port} 监听结束！`;
            win.webContents.send('message', msg);
        }
        return true;
    }

    async function serverListen(arg) {
        return new Promise((resolve, reject) => {
            let { port, host } = arg;
            const server = net.createServer();
            server.on('connection', (socket) => connection(socket));
            server.on('error', (e) => {
                reject({ ...arg, listen: 0, error: e.message});
            });
            server.listen(port, host, () => {
                SERVERS.push(server);
                const result = { ...arg, listen: 1, error: 0 };
                resolve(result);
            });
            
        });
    }

})

function connection(socket) {
    const { address, port } = socket.address();

    const now = new Date();
    const msg = `${formatTime(now)} ${address}:${port} 客户端已连接!`;
    win.webContents.send('message', msg);

    socket.on('data', function (request) {
        let now = new Date();
		let req = Buffer.from(request);
        let res;

        let msg = `${formatTime(now)} ${address}:${port} 接收: ${bufToHex(req, '-')}`;
        win.webContents.send('message', msg);

        const addr = socket.address();
		let chn = addr.port % 100;
		let cnn = chn;
		
		if (!isJsonString(req.toString())) {
			// 通道连接指令
			if (req.toString('hex') == 'dddddddddd') {
				res = Buffer.from([ 0xB1, 0x0E, chn, cnn, cnn, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x95 ]);
			} else {
				const reqBody = JSON.stringify(req.toString());
				//res = Buffer.from([ 0xB2, 0x0e, chn, cnn, cnn, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00  ]);
                res = Buffer.from([ 0xAB, 0x03, 0xFF, 0x00, 0x06  ]);
                
			}
            now = new Date();
            socket.write(res);

            msg = `${formatTime(now)} ${address}:${port} 发送: ${bufToHex(res, '-')}`;
            win.webContents.send('message', msg);
            } else {
		}
	});

    socket.on('close', () => {
        let now = new Date();
        const msg = `${formatTime(now)} ${address}:${port} 客户端已断开!`;
        win.webContents.send('message', msg);
    });

	socket.on('error', (err) => {
        const now = new Date();
        let msg = `${formatTime(now)} ${address}:${port} 发生错误: ${err.toString()}`;
        win.webContents.send('message', msg);
	});
}

function isJsonString(value) {
	try {
		if (typeof JSON.parse(value) == "object") {
			return true;
		}
	}
	catch {

	}
	return false;
}


// JavaScript bufToHex, hexToBuf, hexToString, stringToHex
 
function bufToHex (buffer,split) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join(split);
}
 
function hexToBuf (hex) {
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    }));
    
    return typedArray.buffer;
}
 
function hexToString (hex) {
    var arr = hex.split("");
    var out = "";
    
    for (var i = 0; i < arr.length / 2; i++) {
      var tmp = "0x" + arr[i * 2] + arr[i * 2 + 1];
      var charValue = String.fromCharCode(tmp);
      out += charValue;
    }
    
    return out;
}
 
function stringToHex (str) {
    var val = "";
    
    for (var i = 0; i < str.length; i++) {
      if (val == "")
        val = str.charCodeAt(i).toString(16);
      else
        val += str.charCodeAt(i).toString(16);
    }
    val += "0a";
    
    return val;
}

function formatDateTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

function formatTime(date) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const milli = date.getMilliseconds();
    return `${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(milli,3)}`;
}

function pad(num, len = 2) {
    return num.toString().padStart(len, '0');
}