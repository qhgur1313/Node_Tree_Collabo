import TreeNode from '../component/TreeNode';
import NodeContainer from '../store/NodeContainer';
import { NodeMessage } from '../store/TreeStore';
import Command from './Command';
import { UndoRedoProps } from './UndoRedoStack';

class AppendNodeCommand extends Command {
  private target: TreeNode;

  private parent: TreeNode;

  private nextSibling?: TreeNode;

  constructor(target: TreeNode, parent: TreeNode, nextSibling?: TreeNode) {
    super();
    this.target = target;
    this.parent = parent;
    this.nextSibling = nextSibling;
  }

  public apply(nodeContainer: NodeContainer): void {
    this.target.append(this.parent, this.nextSibling);
    nodeContainer.putNodeToContainer(this.target);
  }

  public unApply(urProp: UndoRedoProps): void {
    if (!this.getUndoRedoState()) {
      return;
    }

    const { nodeContainer, currentSeqNum, collaborationContainer } = urProp;
    if (collaborationContainer.checkApplyImmediateAvailable(this.getSeqNum(), currentSeqNum)) {
      this.removeNode(nodeContainer);
      return;
    }

    if (nodeContainer.getNodeById(this.target.getId()) !== undefined) {
      this.setUndoRedoStateFalse();
      return;
    }

    this.removeNode(nodeContainer);
  }

  private removeNode(nodeContainer: NodeContainer): void {
    this.parent = this.target.getParent() as TreeNode;
    this.nextSibling = this.target.getNextSibling();
    this.target.remove(this.parent);
    nodeContainer.removeNodeFromContainer(this.target);
  }

  public reApply(urProp: UndoRedoProps): void {
    if (!this.getUndoRedoState()) {
      return;
    }
    
    const { nodeContainer, currentSeqNum, collaborationContainer } = urProp;

    if (collaborationContainer.checkApplyImmediateAvailable(this.getSeqNum(), currentSeqNum)) {
      this.apply(nodeContainer);
      return;
    }

    if (nodeContainer.getNodeById(this.parent.getId()) === undefined) {
      this.setUndoRedoStateFalse();
      return;
    }

    if (this.nextSibling !== undefined) {
      this.nextSibling = collaborationContainer.changeTargetNextSibilingForUndoRedo(
        this.getRefSeqNum(),
        currentSeqNum,
        this.nextSibling
      );
    }

    this.apply(nodeContainer);
  }

  public createMessage(): NodeMessage[] {
    const messages: NodeMessage[] = [];
    const message: NodeMessage = this.target.createMessage();
    message.behavior = 'insert';
    messages.push(message);
    return messages;
  }

  public createUnApplyMessage(): NodeMessage[] {
    const messages: NodeMessage[] = [];
    const message: NodeMessage = this.target.createMessage();
    message.behavior = 'delete';
    messages.push(message);
    return messages;
  }

  public createReApplyMessage(): NodeMessage[] {
    const messages: NodeMessage[] = [];
    const nodeList: TreeNode[] = [];
    const color = this.target.getColor();
    nodeList.push(this.target);
    while (nodeList.length !== 0) {
      const node: TreeNode | undefined = nodeList.shift();
      if (node === undefined) {
        break;
      }
      node.setColor(color);
      const message = node.createMessage();
      message.behavior = 'insert';
      messages.push(message);
      node.getChildren().forEach((child) => {
        nodeList.push(child);
      });
    }
    
    return messages;
  }

  public getDeletedNodeByUndo(): TreeNode | undefined {
    return this.target;
  }
}

export default AppendNodeCommand;
