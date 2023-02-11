import { boundMethod } from 'autobind-decorator';
import {
  action,
} from 'mobx';
import { v4 as uuid } from 'uuid';
import Command from '../command/Command';
import UndoRedoStack from '../command/UndoRedoStack';
import TreeNode, { NodeInfo } from '../component/TreeNode';
import IdContainer from './IdContainer';
import MessageSubscriber from './MessageSubscriber';
import NodeContainer from './NodeContainer';
import Repository, { InitData } from './Repository';
import SequenceNumberContainer from './SequenceNumberContainer';
import CollaborationContainer from './CollaborationContainer';
import MessageCreator from './MessageCreator';
import RemoteMessageHandler from './RemoteMessageHandler';
import AppendNodeCommand from '../command/AppendNodeCommand';
import RemoveNodeCommand from '../command/RemoveNodeCommand';
import RemoteMessageModifier from './RemoteMessageModifier';
import { parseNode } from '../util/NodeUtil';
import MoveNodeCommand from '../command/MoveNodeCommand';

export interface OperationMessage {
  messages: NodeMessage[];
  seqNum?: number;
  refSeqNum?: number;
  clientSeqNum?: number;
  sessionId?: string;
  color?: string;
}

export interface NodeMessage {
  behavior: string;
  id: number;
  parentId?: number;
  nextId?: number;
  text?: string;
}

class TreeStore {
  private idContainer: IdContainer;

  private nodeContainer: NodeContainer;

  private sequenceNumberContainer: SequenceNumberContainer;

  private command?: Command;

  private commandBeforeConfirmed: Map<number, Command>;

  private undoRedoStack: UndoRedoStack;

  private messageSubscriber: MessageSubscriber;

  private repository: Repository;

  private sessionId: string;

  private collaborationContainer: CollaborationContainer;

  private messageCreator: MessageCreator;

  private remoteMessageHandler: RemoteMessageHandler;

  private remoteMessageModifier: RemoteMessageModifier;

  private userColors: string[] = [
    '#2E81FF',
    '#383FCA',
    '#0EC0F9',
    '#00A889',
    '#AECB00',
    '#FFAA00',
    '#FF6258',
    '#FF46B5',
    '#9D50E5',
    '#737373',
  ];

  public rootNode?: TreeNode;

  constructor() {
    this.idContainer = new IdContainer();
    this.nodeContainer = new NodeContainer();
    this.sequenceNumberContainer = new SequenceNumberContainer();
    this.undoRedoStack = new UndoRedoStack();
    this.messageSubscriber = new MessageSubscriber(this.handleMessage);
    this.repository = new Repository();
    this.collaborationContainer = new CollaborationContainer();
    this.remoteMessageHandler = new RemoteMessageHandler(
      this.collaborationContainer, this.nodeContainer, this.remoteApply, this.setCommand,
    );
    this.commandBeforeConfirmed = new Map();
    this.sessionId = uuid();
    this.messageCreator = new MessageCreator(
      this.sessionId, this.sequenceNumberContainer, this.userColors[this.idContainer.getOrder()],
    );
    this.remoteMessageModifier = 
      new RemoteMessageModifier(this.collaborationContainer, this.nodeContainer);
  }

  @boundMethod
  public initData(res: InitData): void {
    this.idContainer.init(res.order);
    this.messageCreator.setColor(this.userColors[this.idContainer.getOrder()]);
    const loadingData: NodeInfo[] = JSON.parse(res.nodeStringfy);
    const rootNode = parseNode(loadingData);
    this.setRootNode(rootNode);
    this.nodeContainer.putNodeToContainer(rootNode);
  }

  @boundMethod
  public getSessionId(): string {
    return this.sessionId;
  }

  public getRootNode(): TreeNode {
    return this.rootNode as TreeNode;
  }

  public setRootNode(rootNode: TreeNode): void {
    this.rootNode = rootNode;
  }

  public getIdContainer(): IdContainer {
    return this.idContainer;
  }

  public getNodeContainer(): NodeContainer {
    return this.nodeContainer;
  }

  public getSeqNumContainer(): SequenceNumberContainer {
    return this.sequenceNumberContainer;
  }

  public setCommand(command: Command): void {
    this.command = command;
  }

  @boundMethod
  public clearContext(): void {
    this.checkTree();
    this.command = undefined;
  }

  private checkTree(): void {
    if (this.rootNode?.getAllChildren().length !== this.nodeContainer.numberOfNodes - 1) {
      console.error(this.command);
      throw new Error('Tree problem occured');
    }
  }

  @action
  public apply(): void {
    if (this.command !== undefined) {
      this.sequenceNumberContainer.incrementClientSeqNum();
      this.command?.apply(this.nodeContainer);
      this.putNodeToClientSeqPool(this.command.getDeletedNode(), this.command.getMovedNode());
      this.setSeqNumToCommand();
      this.repository.postMessage(
        this.messageCreator.getMessage(this.command.createMessage()),
      );
      this.undoRedoStack.appendUndo(this.command);
      this.commandBeforeConfirmed.set(this.sequenceNumberContainer.getClientSeqNum(), this.command);
      this.clearContext();
    }
  }

  private putNodeToClientSeqPool(
    deletedNode: TreeNode | undefined, movedNode: TreeNode | undefined): void {
    this.collaborationContainer.putNodesToClientSeqDeletedPoolAsDeleted(
      this.sequenceNumberContainer.getClientSeqNum(), deletedNode
    );
    this.collaborationContainer.putNodesToClientSeqDeletedPoolAsMoved(
      this.sequenceNumberContainer.getClientSeqNum(), movedNode
    );
  }

  private setSeqNumToCommand(): void {
    this.command?.setRefSeqNum(this.sequenceNumberContainer.getSeqNum());
    this.command?.setClientSeqNum(this.sequenceNumberContainer.getClientSeqNum());
  }

  @action
  public unApply(): void {
    this.undoRedo(true);
  }

  @action
  public reApply(): void {
    this.undoRedo(false);
  }

  private undoRedo(undoRedo: boolean): void {
    if (!this.undoRedoStack.isRedoable()) {
      return;
    }
    this.command = undoRedo ? 
      this.undoRedoStack.getUndoCommand() : this.undoRedoStack.getRedoCommand();
    if (this.command === undefined) {
      return;
    }
    if (!this.command.getUndoRedoState()) {
      return;
    }
    this.sequenceNumberContainer.incrementClientSeqNum();
    const apply = undoRedo ? this.command.unApply : this.command.reApply;
    apply(
      { 
        nodeContainer: this.nodeContainer, 
        currentSeqNum: this.sequenceNumberContainer.getSeqNum(), 
        collaborationContainer: this.collaborationContainer 
      });
    if (!this.command.getUndoRedoState()) {
      return;
    }
    const deletedNode = undoRedo ? 
      this.command?.getDeletedNodeByUndo() : this.command?.getDeletedNodeByRedo();
    this.putNodeToClientSeqPool(deletedNode, this.command.getMovedNode());
    this.setSeqNumToCommand();
    const message = undoRedo ?
      this.command?.createUnApplyMessage() : this.command?.createReApplyMessage();
    this.repository.postMessage(
      this.messageCreator.getMessage(message),
    );
    this.commandBeforeConfirmed.set(this.sequenceNumberContainer.getClientSeqNum(), this.command);
    this.clearContext();
  }

  @action
  private remoteApply(): void {
    if (this.command !== undefined) {
      this.command?.apply(this.nodeContainer);
      this.clearContext();
    }
  }

  @boundMethod
  public handleMessage(message: OperationMessage): void {
    const { sessionId, seqNum } = message;
    if (seqNum === undefined) {
      return;
    }
    this.sequenceNumberContainer.setSeqNum(seqNum);
    this.collaborationContainer.setCurrentRefSeqNumForProcessingMessage(seqNum);
    if (sessionId === this.sessionId) {
      this.handleOwnMessage(message);
    } else {
      this.handleRemoteMessage(message);
    }
  }

  private handleOwnMessage(message: OperationMessage): void {
    const { messages, seqNum, clientSeqNum } = message;
    if (seqNum === undefined || clientSeqNum === undefined) {
      return;
    }
    this.commandBeforeConfirmed.get(clientSeqNum)?.setSeqNum(seqNum);
    this.commandBeforeConfirmed.delete(clientSeqNum);
    messages.forEach((msg) => {
      switch (msg.behavior) {
        case 'insert':
        case 'move':
          this.setSeqNum(msg, seqNum);
          break;
        case 'delete':
          this.deletedPoolChange(clientSeqNum, seqNum);
          break;
        default:
          break;
      }
    });
    const nodeInfo: NodeInfo[] = [];
    this.nodeContainer.nodeList.forEach((node: TreeNode) => {
      if (node.getParent() === undefined && node.getId() !== 0) {
        console.error();
      }
      nodeInfo.push(node.serialize());
    });
    this.repository.updateNode(JSON.stringify(nodeInfo));
  }

  private setSeqNum(message: NodeMessage, seqNum: number): void {
    this.nodeContainer.getNodeById(message.id)?.setSeqNum(seqNum);
  }

  private deletedPoolChange(clientSeqNum: number, seqNum: number): void {
    this.collaborationContainer.moveToDeletedPoolFromClientSeqDeletedPool(clientSeqNum, seqNum);
  }

  public getColor(): string {
    return this.userColors[this.idContainer.getOrder()];
  }

  @boundMethod
  public handleRemoteMessage(message: OperationMessage): void {
    const { messages } = message;
    console.log(messages);
    for (let i = 0; i < messages.length; i += 1) {
      switch (messages[i].behavior) {
        case 'insert':
          this.handleInsertMessage(message, messages[i]);
          break;
        case 'delete':
          this.handleDeleteMessage(message, messages[i]);
          break;
        case 'move':
          this.handleMoveMessage(message, messages[i]);
          break;
        default:
          break;
      }
      this.remoteApply();
      this.clearContext();
    }
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

    if (nextId !== nextIdConvertedMsgByPrevSibling.nextId) {
      console.error(`next id ${nextId} has converted to ${nextIdConvertedMsgByPrevSibling.nextId}`);
    }

    const parentNode = this.nodeContainer.getNodeById(parentId);
    const nextSibling = this.nodeContainer.getNodeById(nextIdConvertedMsgByPrevSibling.nextId);
    const newNode = new TreeNode(id, id as unknown as string, color as string);
    newNode.setSeqNum(seqNum);
    if (parentNode === undefined) {
      console.error(`parent node ${parentId} is not in node container`);
      return;
    }
  
    this.setCommand(new AppendNodeCommand(newNode, parentNode, nextSibling));
  }

  private handleDeleteMessage(message: OperationMessage, nodeMessage: NodeMessage): void {
    const { seqNum, color } = message;
    const { id, parentId } = nodeMessage;
    if (id === undefined || seqNum === undefined || color === undefined) {
      return;
    }

    const targetNode = this.nodeContainer.getNodeById(id);
    if (targetNode === undefined) {
      console.error(`target node ${id} is not in node container`);
      return;
    }
    if (targetNode.getParent()?.getId() !== parentId) {
      console.error(`node ${parentId} and node ${id}} are not parent-child relation`);
      return;
    }
    this.setCommand(new RemoveNodeCommand(targetNode, color));
    this.collaborationContainer.putNodeToDeletedPool(seqNum, targetNode);
  }

  private handleMoveMessage(message: OperationMessage, nodeMessage: NodeMessage): void {
    const { seqNum, refSeqNum } = message;
    const { id, parentId } = nodeMessage;

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
    const targetNode = this.nodeContainer.getNodeById(id);
    if (targetNode === undefined) {
      return;
    }
    targetNode.setSeqNum(seqNum);
    if (parentNode !== undefined) {
      this.setCommand(new MoveNodeCommand(targetNode, parentNode, nextSibling));
    }
  }
}

export default TreeStore;
