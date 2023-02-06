import { makeObservable, observable } from 'mobx';
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

    this.numberOfNodes = this.nodeList.length;
  }

  public removeNodeFromContainer(node: TreeNode): void {
    for (let i = 0; i < this.nodeList.length; i++) {
      if (this.nodeList[i] === node) {
        this.nodeList.splice(i, 1);
        break;
      }
    }

    if (node.getFirstChild() === undefined) {
      this.numberOfNodes = this.nodeList.length;
      return;
    }
    for (let child = node.getFirstChild(); child !== undefined; child = child.getNextSibling()) {
      this.removeNodeFromContainer(child);
    }
    this.numberOfNodes = this.nodeList.length;
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
