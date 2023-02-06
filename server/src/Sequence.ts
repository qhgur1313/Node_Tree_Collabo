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

  private nodeStringfy: string;

  constructor() {
    this.clients = [];
    this.seqNum = 1;
    this.nodeStringfy = `[{"id":0,"text":"0","seqNum":-1,"color":"000000"}]`;
  }

  public updateNodes(nodeStringfy: string): void {
    this.nodeStringfy = nodeStringfy;
  }

  public getNodes(): string {
    return this.nodeStringfy;
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
