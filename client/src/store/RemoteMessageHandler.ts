import { boundMethod } from 'autobind-decorator';
import AppendNodeCommand from '../command/AppendNodeCommand';
import Command from '../command/Command';
import RemoveNodeCommand from '../command/RemoveNodeCommand';
import TreeNode from '../component/TreeNode';
import CollaborationContainer from './CollaborationContainer';
import NodeContainer from './NodeContainer';
import RemoteMessageModifier from './RemoteMessageModifier';
import { NodeMessage, OperationMessage } from './TreeStore';

class RemoteMessageHandler {
  private remoteMessageModifier: RemoteMessageModifier;

  private collaborationContainer: CollaborationContainer;

  private nodeContainer: NodeContainer;

  private apply:() => void;

  private setCommand:(command: Command) => void;

  constructor(
    collaborationContainer: CollaborationContainer,
    nodeContainer: NodeContainer,
    apply: () => void,
    setCommand: (command: Command) => void) {
    this.collaborationContainer = collaborationContainer;
    this.nodeContainer = nodeContainer;
    this.remoteMessageModifier = new RemoteMessageModifier(collaborationContainer, nodeContainer);
    this.apply = apply;
    this.setCommand = setCommand;
  }

  @boundMethod
  public handleRemoteMessage(message: OperationMessage): void {
    const { messages } = message;
    messages.forEach((msg) => {
      switch (msg.behavior) {
        case 'insert':
          this.handleInsertMessage(message, msg);
          break;
        case 'delete':
          this.handleDeleteMessage(message, msg);
          break;
        default:
          break;
      }
      this.apply();
    });
  }

  private handleInsertMessage(message: OperationMessage, nodeMessage: NodeMessage): void {
    const { seqNum, color, refSeqNum } = message;
    const { id, parentId, nextId } = nodeMessage;

    if (parentId === undefined
      || id === undefined
      || seqNum === undefined
      || refSeqNum === undefined) {
      return;
    }

    const nextIdConvertedMsgByDeletedPool =
      this.remoteMessageModifier.changeTargetNextSiblingForRemoteMessage(
        seqNum, refSeqNum, nodeMessage
      );
    const nextIdConvertedMsgByPrevSibling = 
      this.remoteMessageModifier.checkTargetPrevSiblingSeqNumAndTargetChange(
        nextIdConvertedMsgByDeletedPool,
      );
    const parentNode = this.nodeContainer.getNodeById(parentId);
    const nextSibling = this.nodeContainer.getNodeById(nextIdConvertedMsgByPrevSibling.nextId);
    const newNode = new TreeNode(id, id as unknown as string, color as string);
    newNode.setSeqNum(seqNum);
    if (parentNode !== undefined) {
      this.setCommand(new AppendNodeCommand(newNode, parentNode, nextSibling));
    }
  }

  private handleDeleteMessage(message: OperationMessage, nodeMessage: NodeMessage): void {
    const { seqNum, color } = message;
    const { id } = nodeMessage;
    if (id === undefined || seqNum === undefined || color === undefined) {
      return;
    }

    const targetNode = this.nodeContainer.getNodeById(id);
    if (targetNode !== undefined) {
      this.setCommand(new RemoveNodeCommand(targetNode, color));
      this.collaborationContainer.putNodeToDeletedPool(seqNum, targetNode);
    }
  }
}

export default RemoteMessageHandler;
