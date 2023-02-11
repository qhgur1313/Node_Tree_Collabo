import { observer } from 'mobx-react-lite';
import React from 'react';
import AppendNodeCommand from '../command/AppendNodeCommand';
import MoveNodeCommand from '../command/MoveNodeCommand';
import RemoveNodeCommand from '../command/RemoveNodeCommand';
import useStore from '../store/useStore';
import { getDepthSplit } from '../util/NodeUtil';
import NodeComponentEachDepth from './NodeComponentEachDepth';
import TreeNode from './TreeNode';

interface PageProps {
  rootNode: TreeNode,
}

let timer: any;

function Page(props: PageProps) {
  const { rootNode } = props;
  const { rootStore } = useStore();
  const { treeStore } = rootStore;
  const width: number = 0;
  const nodesSplitWithDepth: TreeNode[][] = getDepthSplit(rootNode);

  const addRandomNode = () => {
    const newId = treeStore.getIdContainer().getId();
    const newNode = new TreeNode(newId, newId as unknown as string, treeStore.getColor());
    const parent = treeStore.getNodeContainer().getRandomNode();
    treeStore.setCommand(new AppendNodeCommand(newNode, parent, parent.getRandomChild()));
    treeStore.apply();
  };

  const removeRandomNode = () => {
    if (treeStore.getNodeContainer().numberOfNodes !== 1) {
      let targetNode = treeStore.getNodeContainer().getRandomNode();
      while (targetNode.getId() === 0) {
        targetNode = treeStore.getNodeContainer().getRandomNode();
      }
      treeStore.setCommand(new RemoveNodeCommand(targetNode, treeStore.getColor()));
      treeStore.apply();
    }
  };

  function checkParent(parent: TreeNode, children: TreeNode[]): boolean {
    for (let i = 0; i < children.length; i += 1) {
      if (children[i] === parent) {
        return true;
      }
    }
    return false;
  }

  const moveRandomNode = () => {
    let targetNode = treeStore.getNodeContainer().getRandomNode();
    while (targetNode.getId() === 0) {
      targetNode = treeStore.getNodeContainer().getRandomNode();
    }

    const children = targetNode.getAllChildren();
    let targetParent = treeStore.getNodeContainer().getRandomNode();

    while (targetParent.getId() === 0 || checkParent(targetParent, children)) {
      targetParent = treeStore.getNodeContainer().getRandomNode();
    }

    treeStore.setCommand(
      new MoveNodeCommand(targetNode, targetParent, targetParent.getRandomChild()));
    treeStore.apply();
  };

  const undo = () => {
    treeStore.unApply();
  };
  
  const redo = () => {
    treeStore.reApply();
  };

  const behavior: string[] = [];

  for (let i = 0; i < 10; i++) {
    behavior.push('add');
  }
  for (let i = 0; i < 3; i++) {
    behavior.push('remove');
  }
  // for (let i = 0; i < 3; i++) {
  //   behavior.push('move');
  // }
  for (let i = 0; i < 5; i++) {
    behavior.push('undo');
  }
  for (let i = 0; i < 2; i++) {
    behavior.push('redo');
  }

  const random = () => {
    const randomBehavior: string = behavior[Math.floor(Math.random() * behavior.length)];
    // console.log(randomBehavior);
    switch (randomBehavior) {
      case 'add':
        addRandomNode();
        break;
      case 'remove':
        removeRandomNode();
        break;
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'move':
        moveRandomNode();
        break;
      default:
        break;
    }
  };

  function start() {
    if (timer !== undefined) {
      clearInterval(timer);
    }
    timer = setInterval(random, 50);
  }

  function stop() {
    clearInterval(timer);
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <div>
          현재 총 node 갯수 :
          {' '}
          {treeStore.getNodeContainer().numberOfNodes}
        </div>
        <div>
          <button type="button" onClick={start} style={{ margin: 10 }}>자동 동작 시작</button>
          <button type="button" onClick={stop} style={{ margin: 10 }}>중지</button>
        </div>
      </div>
      <div style={{ width, display: 'flex', flexDirection: 'column' }}>
        {
        nodesSplitWithDepth.map((value) => <NodeComponentEachDepth nodes={value} />)
      }
      </div>
    </div>
  );
}

export default observer(Page);
