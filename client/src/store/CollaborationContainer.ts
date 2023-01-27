import { boundMethod } from 'autobind-decorator';
import TreeNode from '../component/TreeNode';
import DeletedPool from './DeletedPool';

class CollaborationContainer {
  private currentRefSeqNumForProcessingMessage: number | undefined;

  private deletedPool: DeletedPool;

  private clientSeqDeletedPool: DeletedPool;

  constructor() {
    this.deletedPool = new DeletedPool();
    this.clientSeqDeletedPool = new DeletedPool();
  }

  @boundMethod
  public putNodesToClientSeqDeletedPoolAsDeleted(
    cliSeqNum: number,
    node: TreeNode | undefined,
  ): void {
    if (node !== undefined) {
      this.clientSeqDeletedPool.putNodeAsDeleted(cliSeqNum, node);
    }
  }

  @boundMethod
  public putNodesToClientSeqDeletedPoolAsMoved(
    cliSeqNum: number,
    node: TreeNode,
  ): void {
    this.clientSeqDeletedPool.putNodeAsMoved(cliSeqNum, node);
  }

  @boundMethod
  public putNodeToDeletedPool(seqNum: number, node: TreeNode): void {
    this.deletedPool.putNodeAsDeleted(seqNum, node);
  }

  @boundMethod
  public putNodeToMovedPool(seqNum: number, node: TreeNode): void {
    this.deletedPool.putNodeAsMoved(seqNum, node);
  }

  @boundMethod
  public moveToDeletedPoolFromClientSeqDeletedPool(clientSeqNum: number, seqNum: number): void {
    const clientInnerPool = this.clientSeqDeletedPool.getDeletedPoolMatchingSeqNum(clientSeqNum);
    if (clientInnerPool !== undefined) {
      clientInnerPool.isMine = true;
      this.deletedPool.setDeletedPoolMatchingSeqNum(seqNum, clientInnerPool);
      this.clientSeqDeletedPool.deleteInnerPool(clientSeqNum);
    }
  }

  @boundMethod
  public isTargetNextSiblingInDeletedPoolForRemoteMessage(
    seqNum: number,
    refSeqNum: number,
    nextId: number | undefined | null,
  ): number | null | undefined {
    if (nextId === undefined || nextId === null) {
      return undefined;
    }

    const resultForClientSeqDeletePool = 
      this.clientSeqDeletedPool.isTargetNextSiblingInDeletedPoolForRemoteMessage(nextId);
    if (resultForClientSeqDeletePool === null) {
      return this.deletedPool.isTargetNextSiblingInDeletedPoolByRange(seqNum, refSeqNum, nextId);
    }

    return resultForClientSeqDeletePool;
  }

  @boundMethod
  public changeTargetNextSibilingForUndoRedo(
    refSeqNumForCommand: number | undefined,
    currentSeqNum: number,
    nextSibling: TreeNode,
  ): TreeNode | undefined {
    if (refSeqNumForCommand === undefined) {
      return undefined;
    }
    return this.deletedPool.changeTargetNextSibilingForUndoRedo(
      refSeqNumForCommand,
      currentSeqNum,
      nextSibling,
    );
  }

  @boundMethod
  public checkApplyImmediateAvailable(seqNumForCommand: number, currentSeqNum: number): boolean {
    return (
      this.noOtherUsersCommand(seqNumForCommand, currentSeqNum)
      || this.commandBeforeAck(seqNumForCommand)
    );
  }

  private noOtherUsersCommand(
    seqNumForCommand: number,
    currentSeqNum: number | undefined,
  ): boolean {
    return seqNumForCommand === currentSeqNum;
  }

  private commandBeforeAck(seqNumForCommand: number): boolean {
    return seqNumForCommand === -1;
  }

  @boundMethod
  public getCurrentRefSeqNumForProcessingMessage(): number | undefined {
    return this.currentRefSeqNumForProcessingMessage;
  }

  @boundMethod
  public setCurrentRefSeqNumForProcessingMessage(refSeqNum: number): void {
    this.currentRefSeqNumForProcessingMessage = refSeqNum;
  }

  @boundMethod
  public clearCurrentRefSeqNumForProcessingMessage(): void {
    this.currentRefSeqNumForProcessingMessage = undefined;
  }
}

export default CollaborationContainer;
