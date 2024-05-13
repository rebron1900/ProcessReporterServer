const express = require("express");
const axios = require("axios").default;
const { WebSocketServer, WebSocket } = require("ws");
const app = express();

// 允许解析JSON格式的请求体
app.use(express.json());

// 存放所有WebSocket客户端的对象，键为客户端的唯一编号
let wsclients = {};
//APP白名单
let whitelist = {};
// key
let apikey = "";
// 当前储存的进程信息
let currentProcess = {}

// 定义给客户端的消息体
var message = {
    message: "通知",
    list: "",
};

//更新白名单
//这种写法应该是错的，不过目前执行没问题...
async function updateAppList() {
    try {
        await axios.get("https://yourdomain/app.json").then((response) => {
            whitelist = response.data;
        });
    } catch (error) {
        return "error";
    }
}

//初始化白名单
updateAppList()

// 启动WebSocket服务器，端口8081
const wss = new WebSocketServer({ port: 8081 });
console.log(`WebSocket is running on port ${wss.options.port}`);

// 新连接事件
wss.on("connection", function connection(ws) {
    // 分配一个唯一的编号给新的客户端
    const clientId = Date.now();
    // 放进清单里
    wsclients[clientId] = ws;

    console.log(`Client ${clientId} connected`);

    // 收消息的处理
    ws.on("message", function incoming(message) {
        console.log(`Received message from client ${clientId}: ${message}`);
    });

    // 当客户端断开连接时，从clients对象中移除
    ws.on("close", (code, reason) => {
        console.log(`WebSocket closed ${code}, ${reason}`);
        delete wsclients[clientId];
    });

    // 可以在这里发送欢迎消息给特定的客户端
    message.list = `Welcome! You are client number ${clientId}.`;
    console.log(`new client join number ${clientId}.`);

    // 首次建立连接时下发当前的程序信息
    ws.send(JSON.stringify(currentProcess))
});

// 定义一个接口，接受PC的进程信息
app.post("/update", (req, res) => {
    // 获取当前app，所有字母最小化处理
    let processName = req.body.process.toLowerCase();
    // 验证apikey
    if (req.body.key == apikey) {
        // 从消息体中删除key
        delete req.body.key;
        console.log("Received Data:", req.body);

        // 如果当前app在白名单内就转发
        if (processName in whitelist) {
            // 更新当前进程信息
            currentProcess = req.body;
            message.list =
                "已将消息转发给：" + Object.keys(wsclients).join(", ") + "客户端";
            // 发送JSON响应
            res.status(200).json(message); 
        } else {
            // 不在白名单里就清空数据再转发
            req.body.process = "";
            req.body.media = "";
            req.body.timestamp = "";
            // 同时也更新当前进程信息
            currentProcess = req.body;
        }
    } else {
        // 验证失败处理
        message.list = "apikey验证失败";
        res.status(401).json(message);
    }

    // 将处理好的数据作为消息发送给所有WebSocket客户端
    Object.values(wsclients).forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(req.body));
        }
    });
});

// 为了方便更新白名单，定义一个接口
app.get('/listUpdate', (req, res) => {
    res.status(200).json(updateAppList());
})

// 启动HTTP服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`HTTP Server is running on port ${PORT}`);
});
