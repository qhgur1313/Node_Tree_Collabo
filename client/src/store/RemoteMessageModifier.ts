import { boundMethod } from 'autobind-decorator';
import TreeNode from '../component/TreeNode';
import CollaborationContainer from './CollaborationContainer';
import NodeContainer from './NodeContainer';
import { NodeMessage } from './TreeStore';

class RemoteMessageModifier {
  private collaborationContainer: CollaborationContainer;

  private nodeContainer: NodeContainer;

  constructor(collaborationConatiner: CollaborationContainer, nodeContainer: NodeContainer) {
    this.collaborationContainer = collaborationConatiner;
    this.nodeContainer = nodeContainer;
  }

  @boundMethod
  public changeTargetNextSiblingForRemoteMessage(
    seqNum: number,
    refSeqNum: number,
    msg: NodeMessage,
  ): NodeMessage {
    let { nextId } = msg;

    let go = true;
    while (go) {
      if (nextId === undefined) {
        break;
      }
      const nextSiblingId = this
        .collaborationContainer
        .isTargetNextSiblingInDeletedPoolForRemoteMessage(seqNum, refSeqNum, nextId);
      if (nextSiblingId === null) {
        go = false;
      } else {
        nextId = nextSiblingId;
      }
    }
    const result: NodeMessage = Object.assign(msg, { nextId });
    return result;
  }

  @boundMethod
  public checkTargetPrevSiblingSeqNumAndTargetChange(
    msg: NodeMessage,
  ): NodeMessage {
    const nextSiblingNode = this.nodeContainer.getNodeById(msg.nextId);
    const parentNode = this.nodeContainer.getNodeById(msg.parentId);
    if (parentNode === undefined) {
      return msg;
    }
    let prevSiblingNode = 
      nextSiblingNode === undefined ? parentNode.getLastChild() : nextSiblingNode.getPrevSibling();

    let go = true;
    while (go) {
      if (this.isNextNodePositionFirst(prevSiblingNode)) {
        const result: NodeMessage = Object.assign(msg, {
          nextId: parentNode?.getFirstChild()?.getId(),
        });
        return result;
      }
      if (this.isNotConfirmedBySeqNum(prevSiblingNode as TreeNode)) {
        prevSiblingNode = prevSiblingNode?.getPrevSibling();
      } else {
        go = false;
      }
    }
    const result: NodeMessage = Object.assign(msg, {
      nextId: prevSiblingNode?.getNextSibling()?.getId(),
    });
    return result;
  }

  private isNextNodePositionFirst(node?: TreeNode): boolean {
    return node === undefined;
  }

  private isNotConfirmedBySeqNum(node: TreeNode): boolean {
    return node.getSeqNum() === -1;
  }
}

export default RemoteMessageModifier;
