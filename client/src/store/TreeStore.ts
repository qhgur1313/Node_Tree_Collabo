import { boundMethod } from 'autobind-decorator';
import {
  action,
} from 'mobx';
import { v4 as uuid } from 'uuid';
import Command from '../command/Command';
import UndoRedoStack from '../command/UndoRedoStack';
import TreeNode from '../component/TreeNode';
import IdContainer from './IdContainer';
import MessageSubscriber from './MessageSubscriber';
import NodeContainer from './NodeContainer';
import Repository from './Repository';
import SequenceNumberContainer from './SequenceNumberContainer';
import CollaborationContainer from './CollaborationContainer';
import MessageCreator from './MessageCreator';
import RemoteMessageHandler from './RemoteMessageHandler';
import AppendNodeCommand from '../command/AppendNodeCommand';
import RemoveNodeCommand from '../command/RemoveNodeCommand';
import RemoteMessageModifier from './RemoteMessageModifier';

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

  private undoRedoStack: UndoRedoStack;

  private messageSubscriber: MessageSubscriber;

  private repository: Repository;

  private sessionId: string;

  private collaborationContainer: CollaborationContainer;

  private messageCreator: MessageCreator;

  private remoteMessageHandler: RemoteMessageHandler;

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
    this.sessionId = uuid();
    this.init();
    this.messageCreator = new MessageCreator(
      this.sessionId, this.sequenceNumberContainer, this.userColors[this.idContainer.getOrder()],
    );
    this.remoteMessageModifier = 
      new RemoteMessageModifier(this.collaborationContainer, this.nodeContainer);
  }

  private async init(): Promise<void> {
    await this.repository.getInitData(this.sessionId).then((res) => {
      this.idContainer.init(res);
      this.messageCreator.setColor(this.userColors[this.idContainer.getOrder()]);
    });
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
    this.command = undefined;
  }

  @action
  public apply(): void {
    if (this.command !== undefined) {
      this.sequenceNumberContainer.incrementClientSeqNum();
      this.command?.apply(this.nodeContainer);
      this.putNodeToClientSeqPool(this.command.getDeletedNode());
      this.setSeqNumToCommand();
      this.repository.postMessage(
        this.messageCreator.getMessage(this.command.createMessage()),
      );
      this.undoRedoStack.appendUndo(this.command);
      this.clearContext();
    }
  }

  private putNodeToClientSeqPool(node: TreeNode | undefined): void {
    this.collaborationContainer.putNodesToClientSeqDeletedPoolAsDeleted(
      this.sequenceNumberContainer.getClientSeqNum(), node,
    );
  }

  private setSeqNumToCommand(): void {
    this.command?.setRefSeqNum(this.sequenceNumberContainer.getSeqNum());
    this.command?.setClientSeqNum(this.sequenceNumberContainer.getClientSeqNum());
  }

  @action
  public unApply(): void {
    if (!this.undoRedoStack.isUndoable()) {
      return;
    }
    this.command = this.undoRedoStack.getUndoCommand();
    if (this.command === undefined) {
      return;
    }
    this.sequenceNumberContainer.incrementClientSeqNum();
    this.command?.unApply(
      { 
        nodeContainer: this.nodeContainer, 
        currentSeqNum: this.sequenceNumberContainer.getSeqNum(), 
        collaborationContainer: this.collaborationContainer 
      });
    this.putNodeToClientSeqPool(this.command?.getDeletedNodeByUndo());
    this.setSeqNumToCommand();
    this.repository.postMessage(
      this.messageCreator.getMessage(this.command?.createUnApplyMessage()),
    );
    this.clearContext();
  }

  @action
  public reApply(): void {
    if (!this.undoRedoStack.isRedoable()) {
      return;
    }
    this.command = this.undoRedoStack.getRedoCommand();
    if (this.command === undefined) {
      return;
    }
    this.sequenceNumberContainer.incrementClientSeqNum();
    this.command?.reApply(
      {
        nodeContainer: this.nodeContainer, 
        currentSeqNum: this.sequenceNumberContainer.getSeqNum(), 
        collaborationContainer: this.collaborationContainer 
      });
    this.putNodeToClientSeqPool(this.command?.getDeletedNodeByRedo());
    this.setSeqNumToCommand();
    this.repository.postMessage(
      this.messageCreator.getMessage(this.command?.createReApplyMessage()),
    );
    this.clearContext();
  }

  @action
  private remoteApply = (): void => {
      if (this.command !== undefined) {
        this.command?.apply(this.nodeContainer);
        this.clearContext();
      }
    };

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
    messages.forEach((msg) => {
      switch (msg.behavior) {
        case 'insert':
          this.setSeqNum(msg, seqNum);
          break;
        case 'delete':
          this.deletedPoolChange(clientSeqNum, seqNum);
          break;
        default:
          break;
      }
    });
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

  private remoteMessageModifier: RemoteMessageModifier;

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
      this.remoteApply();
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

export default TreeStore;
