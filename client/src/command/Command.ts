import TreeNode from '../component/TreeNode';
import NodeContainer from '../store/NodeContainer';
import { NodeMessage } from '../store/TreeStore';
import { UndoRedoProps } from './UndoRedoStack';

abstract class Command {
  private undoRedoState: boolean = true;

  private refSeqNum?: number;

  private seqNum: number = -1;

  private clientSeqNum: number = -1;

  public abstract apply(nodeContainer: NodeContainer): void;

  public abstract unApply(urProp: UndoRedoProps): void;

  public abstract reApply(urProp: UndoRedoProps): void;

  public abstract createMessage(): NodeMessage[];

  public abstract createUnApplyMessage(): NodeMessage[];

  public abstract createReApplyMessage(): NodeMessage[];

  public getDeletedNode(): TreeNode | undefined {
    return undefined;
  }

  public getDeletedNodeByUndo(): TreeNode | undefined {
    return undefined;
  }

  public getDeletedNodeByRedo(): TreeNode | undefined {
    return undefined;
  }

  public getUndoRedoState(): boolean {
    return this.undoRedoState;
  }

  public setUndoRedoStateFalse(): void {
    this.undoRedoState = false;
  }

  public getRefSeqNum(): number | undefined {
    return this.refSeqNum;
  }

  public setRefSeqNum(refSeqNum: number): void {
    this.refSeqNum = refSeqNum;
  }

  public getSeqNum(): number {
    return this.seqNum;
  }

  public setSeqNum(seqNum: number): void {
    this.seqNum = seqNum;
  }

  public getClientSeqNum(): number | undefined {
    return this.clientSeqNum;
  }

  public setClientSeqNum(seqNum: number): void {
    this.clientSeqNum = seqNum;
  }
}

export default Command;
