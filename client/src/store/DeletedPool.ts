import { boundMethod } from 'autobind-decorator';
import TreeNode from '../component/TreeNode';

export interface InnerDeletedPoolWrapper {
  isMine: boolean;
  innerPool: Map<number, InnerPoolElement>;
}

export interface InnerPoolElement {
  node: TreeNode;
  isDeleted: boolean;
}

class DeletedPool {
  private deletedPool: Map<number, InnerDeletedPoolWrapper>;

  constructor() {
    this.deletedPool = new Map();
  }

  @boundMethod
  public putNodeAsDeleted(seqNum: number, node: TreeNode): void {
    const deletedPool = this.deletedPool.get(seqNum);
    if (deletedPool === undefined) {
      const newPool: Map<number, InnerPoolElement> = new Map();
      newPool.set(node.getId(), { node, isDeleted: true });
      const innerDeletedPool: InnerDeletedPoolWrapper = {
        isMine: false,
        innerPool: newPool,
      };
      this.deletedPool.set(seqNum, innerDeletedPool);
    } else {
      deletedPool.innerPool.set(node.getId(), { node, isDeleted: true });
    }
  }

  @boundMethod
  public putNodeAsMoved(seqNum: number, node: TreeNode): void {
    const deletedPool = this.deletedPool.get(seqNum);
    if (deletedPool === undefined) {
      const newPool: Map<number, InnerPoolElement> = new Map();
      newPool.set(node.getId(), { node, isDeleted: false });
      const innerDeletedPool: InnerDeletedPoolWrapper = {
        isMine: false,
        innerPool: newPool,
      };
      this.deletedPool.set(seqNum, innerDeletedPool);
    } else {
      deletedPool.innerPool.set(node.getId(), { node, isDeleted: false });
    }
  }

  @boundMethod
  public isTargetNextSiblingInDeletedPoolByRange(
    seqNum: number,
    refSeqNum: number,
    nextId: number,
  ): number | null | undefined {
    for (let i = refSeqNum + 1; i < seqNum; i += 1) {
      const innerPoolWrapper = this.deletedPool.get(i);
      if (innerPoolWrapper !== undefined) {
        const innerElement = innerPoolWrapper.innerPool.get(nextId);
        if (innerElement !== undefined) {
          return innerElement.node.getNextSibling()?.getId();
        }
      }
    }
    return null;
  }

  @boundMethod
  public isTargetNextSiblingInDeletedPoolForRemoteMessage(
    elementId: number,
  ): number | null | undefined {
    let result: number | null | undefined = null;
    this.deletedPool.forEach((map) => {
      if (result === null) {
        const innerElement = map.innerPool.get(elementId);
        if (innerElement !== undefined) {
          result = innerElement.node.getNextSibling()?.getId();
        }
      }
    });
    return result;
  }

  @boundMethod
  public getDeletedPoolMatchingSeqNum(seqNum: number): InnerDeletedPoolWrapper | undefined {
    return this.deletedPool.get(seqNum);
  }

  @boundMethod
  public setDeletedPoolMatchingSeqNum(seqNum: number, innerPool: InnerDeletedPoolWrapper): void {
    this.deletedPool.set(seqNum, innerPool);
  }

  @boundMethod
  public deleteInnerPool(seqNum: number): void {
    this.deletedPool.delete(seqNum);
  }

  @boundMethod
  public isTargetNodeInDeletedPoolForUndoRedo(
    refSeqNumForCommand: number,
    currentSeqNum: number,
    targetNode: TreeNode,
  ): boolean {
    // 가장 높은 sequence number 기준으로 확인, 역탐색
    for (let i = currentSeqNum; i > refSeqNumForCommand; i -= 1) {
      const innerPoolWrapper = this.deletedPool.get(i);
      if (innerPoolWrapper !== undefined && !innerPoolWrapper.isMine) {
        const innerElement = innerPoolWrapper?.innerPool.get(targetNode.getId());
        if (innerElement !== undefined) {
          if (innerElement.isDeleted) {
            return true;
          }
        }
      }
    }

    return false;
  }

  @boundMethod
  public changeTargetNextSibilingForUndoRedo(
    refSeqNumForCommand: number,
    currentSeqNum: number,
    nextSibling: TreeNode,
  ): TreeNode | undefined {
    let changedNextSibling: TreeNode | undefined = nextSibling;
    for (let i = refSeqNumForCommand + 1; i <= currentSeqNum; i += 1) {
      if (changedNextSibling === undefined) {
        return undefined;
      }
      const innerPoolWrapper = this.deletedPool.get(i);
      if (innerPoolWrapper !== undefined && !innerPoolWrapper.isMine) {
        changedNextSibling = this.changeTargetNextSiblingInInnerPool(
          innerPoolWrapper.innerPool,
          changedNextSibling,
        );
      }
    }

    return changedNextSibling;
  }

  private changeTargetNextSiblingInInnerPool(
    innerPool: Map<number, InnerPoolElement>,
    nextSibling: TreeNode,
  ): TreeNode | undefined {
    let changedNextSibling: TreeNode | undefined = nextSibling;
    while (true) {
      if (changedNextSibling === undefined) {
        return undefined;
      }
      const innerElement = innerPool.get(changedNextSibling.getId());
      if (innerElement === undefined) {
        break;
      }
      changedNextSibling = innerElement.node.getNextSibling();
    }
    return changedNextSibling;
  }
}

export default DeletedPool;
