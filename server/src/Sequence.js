"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Sequence {
    constructor() {
        this.clients = [];
        this.seqNum = 1;
        this.nodeStringfy = `[{"id":0,"text":"0","seqNum":-1,"color":"000000"}]`;
    }
    updateNodes(nodeStringfy) {
        this.nodeStringfy = nodeStringfy;
    }
    getNodes() {
        return this.nodeStringfy;
    }
    addClient(id) {
        this.clients.push(id);
    }
    removeClient(id) {
        this.clients.filter((value) => value !== id);
    }
    getOrder() {
        return this.clients.length;
    }
    handleMessage(message) {
        return this.ticket(message);
    }
    ticket(message) {
        message.seqNum = this.seqNum;
        this.seqNum++;
        return message;
    }
}
exports.default = Sequence;
