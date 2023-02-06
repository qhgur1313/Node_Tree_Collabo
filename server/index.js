"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Sequence_1 = __importDefault(require("./src/Sequence"));
const { WebSocketServer } = require("ws");
const bodyParser = require('body-parser');
const cors = require("cors");
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true
};
const app = (0, express_1.default)();
app.use(cors(corsOptions));
app.use(bodyParser.json());
const port = 4000;
const sequence = new Sequence_1.default();
const wss = new WebSocketServer({ port: 4001 });
wss.on("connection", (ws, request) => {
    // wss.clients.forEach((client: any) => {
    //   client.send(`새로운 유저가 접속했습니다. 현재 유저 ${wss.clients.size} 명`)
    // });
    // console.log(`새로운 유저 접속: ${request.socket.remoteAddress}`);
    ws.on("close", () => {
        wss.clients.forEach((client) => {
            client.send(`유저 한명이 떠났습니다. 현재 유저 ${wss.clients.size} 명`);
        });
    });
});
app.post('/message', (req, res) => {
    const message = sequence.handleMessage(req.body);
    wss.clients.forEach((client) => {
        client.send(JSON.stringify(message));
    });
    res.send({ result: 'ok' });
});
app.post('/update', (req, res) => {
    sequence.updateNodes(req.body.nodeStringfy);
    res.send({ result: 'ok' });
});
app.get('/connect', (req, res) => {
    sequence.addClient(req.params.id);
    res.json({ order: sequence.getOrder(), nodeStringfy: sequence.getNodes() });
});
app.listen(port, () => {
    console.log(`[server]: Server is running at <https://localhost>:${port}`);
});
