import TreeNode from '../component/TreeNode';
import NodeContainer from '../store/NodeContainer';
import { NodeMessage } from '../store/TreeStore';
import Command from './Command';
import { UndoRedoProps } from './UndoRedoStack';

class RemoveNodeCommand extends Command {
  private target: TreeNode;

  private parent?: TreeNode;

  private nextSibling?: TreeNode;

  private color: string;

  constructor(target: TreeNode, color: string) {
    super();
    this.target = target;
    this.color = color;
  }

  public apply(nodeContainer: NodeContainer): void {
    this.removeNode(nodeContainer);
  }

  private removeNode(nodeContainer: NodeContainer): void {
    this.parent = this.target.getParent() as TreeNode;
    this.nextSibling = this.target.getNextSibling();
    this.target.remove();
    nodeContainer.removeNodeFromContainer(this.target);
  }

  public unApply(urProp: UndoRedoProps): void {
    if (!this.getUndoRedoState() || this.parent === undefined) {
      return;
    }
    
    const { nodeContainer, currentSeqNum, collaborationContainer } = urProp;

    if (collaborationContainer.checkApplyImmediateAvailable(this.getSeqNum(), currentSeqNum)) {
      this.target.append(this.parent, this.nextSibling);
      nodeContainer.putNodeToContainer(this.target);
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

    this.target.append(this.parent, this.nextSibling);
    nodeContainer.putNodeToContainer(this.target);
  }

  public reApply(urProp: UndoRedoProps): void {
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

  public createMessage(): NodeMessage[] {
    const messages: NodeMessage[] = [];

    const message: NodeMessage = this.target.createMessage();
    message.behavior = 'delete';
    messages.push(message);

    return messages;
  }

  public createUnApplyMessage(): NodeMessage[] {
    const messages: NodeMessage[] = [];

    const nodeList: TreeNode[] = [];
    nodeList.push(this.target);
    while (nodeList.length !== 0) {
      const node: TreeNode | undefined = nodeList.shift();
      if (node === undefined) {
        break;
      }
      node.setColor(this.color);
      const message = node.createMessage();
      message.behavior = 'insert';
      messages.push(message);
      node.getChildren().forEach((child) => {
        nodeList.push(child);
      });
    }

    return messages;
  }

  public createReApplyMessage(): NodeMessage[] {
    const messages: NodeMessage[] = [];

    const message: NodeMessage = this.target.createMessage();
    message.behavior = 'delete';
    messages.push(message);
    return messages;
  }

  public getDeletedNode(): TreeNode | undefined {
    return this.target;
  }

  public getDeletedNodeByRedo(): TreeNode | undefined {
    return this.getDeletedNode();
  }
}

export default RemoveNodeCommand;
