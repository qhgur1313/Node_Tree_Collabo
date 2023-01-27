class SequenceNumberContainer {
  private clientSeqNum: number;

  private seqNum: number;

  constructor() {
    this.clientSeqNum = 0;
    this.seqNum = 0;
  }

  public getClientSeqNum(): number {
    return this.clientSeqNum;
  }

  public incrementClientSeqNum(): void {
    this.clientSeqNum += 1;
  }

  public setSeqNum(seqNum: number): void {
    this.seqNum = seqNum;
  }

  public getSeqNum(): number {
    return this.seqNum;
  }
}

export default SequenceNumberContainer;
