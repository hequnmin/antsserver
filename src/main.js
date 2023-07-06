const { app, BrowserWindow, ipcMain } = require('electron');
const { Socket } = require('dgram');
const net = require('net');
const Buffer = require('buffer').Buffer;
const path = require('path');
const { request } = require('http');

let win;
let SOCKETS = [];
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

        SOCKETS = [];
        SERVERS = [];
        args.forEach(s => {
            const server = net.createServer();
            server.listen(s.port, s.host);
            SOCKETS = [...SOCKETS, { ...s, listen: 1, error: 0 }];
            server.on('connection', (socket) => connection(socket));
            SERVERS.push(server);
            
        });
    
        return SOCKETS;
    }

    async function handleServiceStop(event, args) {
        for (let index = 0; index < SERVERS.length; index++) {
            const srv = SERVERS[index];

            SOCKETS[index] = { ...SOCKETS[index], listen: 0, error : 0};

            srv.close();
        }
    
        return SOCKETS;
    }

})


function connection(socket) {
    const { address, port } = socket.address();

    socket.on('data', function (request) {
		let req = Buffer.from(request);
        let res;

        let msg = `${address}:${port} REC. ${bufToHex(req, '-')}`;
        win.webContents.send('message', msg);

		const addr = socket.address();
		let chn = addr.port % 100;
		let cnn = chn;
		
		if (!isJsonString(req.toString())) {
			// 通道连接指令
			if (req.toString('hex') == 'dddddddddd') {
				res = Buffer.from([ 0xB1, 0x0E, chn, cnn, 0xD0, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x95 ]);
			} else {
				const reqBody = JSON.stringify(req.toString());
				res = Buffer.from([ 0xB2, 0x0e, chn, cnn, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00  ]);
			}
            socket.write(res);
		} else {
		}
		
        msg = `${address}:${port} SEN. ${bufToHex(res, '-')}`;
        win.webContents.send('message', msg);
		
	});
    
	socket.on('error', (err) => {
		// console.log("Caught flash policy server socket error: ");
		// console.log(err.stack);
        let msg = `${address}:${port} ERR. ${err.stack.toString()}`;
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
 
