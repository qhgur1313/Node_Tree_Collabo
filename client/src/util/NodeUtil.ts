import TreeNode, { NodeInfo } from '../component/TreeNode';

export default function countLeafNodes(node: TreeNode): number {
  let cnt = 0;
  const list: TreeNode[] = [];
  list.push(node);

  while (list.length > 0) {
    let child = list.pop()?.getFirstChild();
    if (child !== undefined) {
      for (;child !== undefined; child = child.getNextSibling()) {
        if (child.getFirstChild() !== undefined) {
          list.push(child);
        } else {
          cnt += 1;
        }
      }
    }
  }

  return cnt;
}
export function getDepthSplit(node: TreeNode): TreeNode[][] {
  const nodesSplitWithDepth: TreeNode[][] = [];
  nodesSplitWithDepth.push([node]);
  let doMore = true;

  let depth = 0;
  while (doMore) {
    const tempList: TreeNode[] = [];
    const currentList = nodesSplitWithDepth[depth];
    currentList.map((value, index) => {
      if (value.getId() !== -1) {
        let child = value.getFirstChild();
        if (child !== undefined) {
          for (;child !== undefined; child = child.getNextSibling()) {
            tempList.push(child);
          }
        } else {
          tempList.push(new TreeNode(-1, '', ''));
        }
      } else {
        tempList.push(new TreeNode(-1, '', ''));
      }
    });

    if (tempList.every((child: TreeNode) => child.getId() === -1)) {
      doMore = false;
    } else {
      nodesSplitWithDepth.push(tempList);
      depth += 1;
    }
  }

  return nodesSplitWithDepth;
}

export function parseNode(nodeDatas: NodeInfo[]): TreeNode {
  const nodeMap = new Map<number, TreeNode>();
  let rootNode = new TreeNode(0, '0', '#000000');
  nodeDatas.forEach((info: NodeInfo) => {
    const node = new TreeNode(info.id, info.text, info.color);
    node.setSeqNum(0);
    nodeMap.set(info.id, node);
    if (info.id === 0) {
      rootNode = node;
    }
  });

  nodeDatas.forEach((info: NodeInfo) => {
    const node = nodeMap.get(info.id);
    if (info.parentId) {
      node?.setParent(nodeMap.get(info.parentId));
    }
    if (info.firstChildId) {
      node?.setFirstChild(nodeMap.get(info.firstChildId));
    }
    if (info.lastChildId) {
      node?.setLastChild(nodeMap.get(info.lastChildId));
    }
    if (info.prevId) {
      node?.setPrevSibling(nodeMap.get(info.prevId));
    }
    if (info.nextId) {
      node?.setNextSibling(nodeMap.get(info.nextId));
    }
  });
  return rootNode;
}
