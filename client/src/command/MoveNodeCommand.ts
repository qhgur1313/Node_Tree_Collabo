import TreeNode from '../component/TreeNode';
import NodeContainer from '../store/NodeContainer';
import { NodeMessage } from '../store/TreeStore';
import Command from './Command';
import { UndoRedoProps } from './UndoRedoStack';

class MoveNodeCommand extends Command {
  private target: TreeNode;

  private targetClone?: TreeNode;

  private oldParent?: TreeNode;

  private oldNextSibling?: TreeNode;

  private newParent: TreeNode;

  private newNextSibling?: TreeNode;

  constructor(target: TreeNode, newParent: TreeNode, newNextSibling: TreeNode | undefined) {
    super();
    this.target = target;
    this.newParent = newParent;
    this.newNextSibling = newNextSibling;
  }

  public apply(nodeContainer: NodeContainer): void {
    this.targetClone = this.target.clone();

    this.oldParent = this.target.getParent();
    this.oldNextSibling = this.target.getNextSibling();
    this.moveNode();
  }

  private moveNode(): void {
    if (this.oldParent) this.target.remove(this.oldParent);
    this.target.append(this.newParent, this.newNextSibling);
  }

  public unApply(urProp: UndoRedoProps): void {
    if (!this.getUndoRedoState()) {
      return;
    }

    const { nodeContainer, currentSeqNum, collaborationContainer } = urProp;
    if (collaborationContainer.checkApplyImmediateAvailable(this.getSeqNum(), currentSeqNum)) {
      this.targetClone = this.target.clone();
      this.changeOldAndNewRelation();
      this.moveNode();
      return;
    }

    if (
      nodeContainer.getNodeById(this.oldParent?.getId()) !== undefined ||
      nodeContainer.getNodeById(this.target.getId()) !== undefined
    ) {
      this.setUndoRedoStateFalse();
      return;
    }

    if (this.oldNextSibling !== undefined) {
      this.oldNextSibling = collaborationContainer.changeTargetNextSibilingForUndoRedo(
        this.getRefSeqNum(),
        currentSeqNum,
        this.oldNextSibling
      );
    }
    this.targetClone = this.target.clone();
    this.changeOldAndNewRelation();
    this.moveNode();
  }

  private changeOldAndNewRelation(): void {
    this.newParent = this.oldParent as TreeNode;
    this.newNextSibling = this.oldNextSibling;

    this.oldParent = this.target.getParent();
    this.oldNextSibling = this.target.getNextSibling();
  }

  public reApply(urProp: UndoRedoProps): void {
    this.unApply(urProp);
  }

  public createMessage(): NodeMessage[] {
    const messages: NodeMessage[] = [];

    const message: NodeMessage = this.target.createMessage();
    message.behavior = 'move';
    messages.push(message);

    return messages;
  }

  public createUnApplyMessage(): NodeMessage[] {
    return this.createMessage();
  }

  public createReApplyMessage(): NodeMessage[] {
    return this.createMessage();
  }

  public getMovedNode(): TreeNode | undefined {
    return this.targetClone;
  }
}

export default MoveNodeCommand;
