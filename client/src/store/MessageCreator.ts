import SequenceNumberContainer from './SequenceNumberContainer';
import { NodeMessage, OperationMessage } from './TreeStore';

class MessageCreater {
  private readonly sessionId: string;

  private readonly seqNumContainer: SequenceNumberContainer;

  private color: string;

  constructor(sessionId: string, seqNumContainer: SequenceNumberContainer, color: string) {
    this.sessionId = sessionId;
    this.seqNumContainer = seqNumContainer;
    this.color = color;
  }

  public getMessage(message: NodeMessage[]): OperationMessage {
    return {
      messages: message,
      sessionId: this.sessionId,
      color: this.color,
      refSeqNum: this.seqNumContainer.getSeqNum(),
      clientSeqNum: this.seqNumContainer.getClientSeqNum(),
    };
  }

  public setColor(color: string): void {
    this.color = color;
  }
}

export default MessageCreater;
