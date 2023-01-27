import { OperationMessage } from './TreeStore';

const WS_URL = 'ws://localhost:4001';
class MessageSubscriber {
  private ws: WebSocket;

  private handleMessageProvided: (message: OperationMessage) => void;

  constructor(handleMessage: (message: OperationMessage) => void) {
    this.ws = new WebSocket(WS_URL);
    this.handleMessageProvided = handleMessage;
    this.initSocket();
  }

  private initSocket(): void {
    this.ws.onmessage = (e: MessageEvent) => {
      this.handleMessage(e);
    };
  }

  public handleMessage(ev: MessageEvent): void {
    const msg: OperationMessage = JSON.parse(ev.data);
    this.handleMessageProvided(msg);
  }
}

export default MessageSubscriber;
