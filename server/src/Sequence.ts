export interface OperationMessage {
  behavior: string;
  id: number;
  parentId?: number;
  nextId?: number;
  text?: string;
  seqNum?: number;
  refSeqNum?: number;
  clientSeqNum?: number;
  sessionId: string;
}

class Sequence {
  private clients: string[];

  private seqNum: number;

  constructor() {
    this.clients = [];
    this.seqNum = 1;
  }

  public addClient(id: string): void {
    this.clients.push(id);
  }

  public removeClient(id: string): void {
    this.clients.filter((value) => value !== id);
  }

  public getOrder(): number {
    return this.clients.length;
  }

  public handleMessage(message: OperationMessage): OperationMessage {
    return this.ticket(message);
  }

  private ticket(message: OperationMessage): OperationMessage {
    message.seqNum = this.seqNum;
    this.seqNum++;
    return message;
  }
}

export default Sequence;
