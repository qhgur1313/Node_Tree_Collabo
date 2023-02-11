import { makeObservable, observable, runInAction } from 'mobx';
import TreeNode from '../component/TreeNode';

class NodeContainer {
  public nodeList: TreeNode[] = [];

  @observable
  public numberOfNodes: number = 0;

  constructor() {
    makeObservable(this);
  }

  public putNodeToContainer(node: TreeNode): void {
    const nodeList: TreeNode[] = [];
    nodeList.push(node);
    while (nodeList.length !== 0) {
      const currentNode: TreeNode | undefined = nodeList.shift();
      if (currentNode === undefined) {
        break;
      }
      this.nodeList.push(currentNode);
      currentNode.getChildren().forEach((child) => {
        nodeList.push(child);
      });
    }

    runInAction(() => { this.numberOfNodes = this.nodeList.length; });
  }

  public removeNodeFromContainer(node: TreeNode): void {
    const children = node.getAllChildren();
    children.push(node);
    this.nodeList = this.removeNodes(this.nodeList, children);
    runInAction(() => { this.numberOfNodes = this.nodeList.length; });
  }

  private removeNodes(A: TreeNode[], B: TreeNode[]): TreeNode[] {
    const nodeIdsToRemove = new Set(B.map((node) => node.getId()));
    return A.filter((node) => !nodeIdsToRemove.has(node.getId()));
  }

  public getNodeById = (id: number | undefined): TreeNode | undefined => {
    if (id === undefined) {
      return undefined;
    }

    for (let i = 0; i < this.nodeList.length; i++) {
      if (this.nodeList[i].getId() === id) {
        return this.nodeList[i];
      }
    }
    return undefined;
  };

  public getRandomNode(): TreeNode {
    return this.nodeList[Math.floor(Math.random() * this.nodeList.length)];
  }
}

export default NodeContainer;
