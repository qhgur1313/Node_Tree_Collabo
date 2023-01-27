import CollaborationContainer from '../store/CollaborationContainer';
import NodeContainer from '../store/NodeContainer';
import Command from './Command';

export interface UndoRedoProps {
  currentSeqNum: number;
  collaborationContainer: CollaborationContainer;
  nodeContainer: NodeContainer;
}

class UndoRedoStack {
  private undoStack: Command[];

  private redoStack: Command[];

  private size: number = 20;

  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  public appendUndo(command: Command): void {
    this.undoStack.push(command);
    this.clearRedoStack();
    if (this.undoStack.length > this.size) {
      this.undoStack.shift();
    }
  }

  public isUndoable(): boolean {
    return this.undoStack.length > 0;
  }

  public isRedoable(): boolean {
    return this.redoStack.length > 0;
  }

  private clearRedoStack(): void {
    this.redoStack = [];
  }

  public getUndoCommand(): Command | undefined {
    const undoCommand = this.undoStack.pop();
    if (undoCommand !== undefined) {
      this.redoStack.push(undoCommand);
    }
    return undoCommand;
  }

  public getRedoCommand(): Command | undefined {
    const redoCommand = this.redoStack.pop();
    if (redoCommand !== undefined) {
      this.undoStack.push(redoCommand);
    }
    return redoCommand;
  }

  public setSeqNumForCommand(seqNum: number, clientSeqNum: number): void {
    this.undoStack.forEach((command) => {
      if (command.getClientSeqNum() === clientSeqNum) {
        command.setSeqNum(seqNum);
      }
    });
  }
}

export default UndoRedoStack;
