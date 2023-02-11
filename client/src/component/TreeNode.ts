import { NodeMessage } from '../store/TreeStore';

export interface NodeInfo {
  id: number;
  parentId?: number;
  firstChildId?: number;
  lastChildId?: number;
  prevId?: number;
  nextId?: number;
  text: string;
  color: string;
}

class TreeNode {
  private id: number;

  private parent?: TreeNode;

  private firstChild?: TreeNode;

  private lastChild?: TreeNode;

  private prevSibling?: TreeNode;

  private nextSibling?: TreeNode;

  private text: string;

  private seqNum: number;

  private color: string;

  constructor(id: number, text: string, color: string) {
    this.id = id;
    this.text = text;
    this.color = color;
    this.seqNum = -1;
  }

  public clone(): TreeNode {
    const cloneNode = new TreeNode(this.id, this.text, this.color);
    cloneNode.setParent(this.getParent());
    cloneNode.setPrevSibling(this.getPrevSibling());
    cloneNode.setNextSibling(this.getNextSibling());
    return cloneNode;
  }

  public setId(id: number): void {
    this.id = id;
  }

  public getId(): number {
    return this.id;
  }

  public getParent(): TreeNode | undefined {
    return this.parent;
  }

  public setParent(parent: TreeNode | undefined): void {
    this.parent = parent;
  }

  public getText(): string {
    return this.text;
  }

  public getFirstChild(): TreeNode | undefined {
    return this.firstChild;
  }

  public setFirstChild(node: TreeNode | undefined): void {
    this.firstChild = node;
  }

  public getLastChild(): TreeNode | undefined {
    return this.lastChild;
  }

  public setLastChild(node: TreeNode | undefined): void {
    this.lastChild = node;
  }

  public getNextSibling(): TreeNode | undefined {
    return this.nextSibling;
  }

  public setNextSibling(node: TreeNode | undefined): void {
    this.nextSibling = node;
  }

  public getPrevSibling(): TreeNode | undefined {
    return this.prevSibling;
  }

  public setPrevSibling(node: TreeNode | undefined): void {
    this.prevSibling = node;
  }

  public append(parent: TreeNode, nextSibling?: TreeNode): void {
    if (nextSibling !== undefined) {
      if (nextSibling.getParent() !== parent) {
        return;
      }
    }
    if (nextSibling !== undefined) {
      parent.appendChildBefore(this, nextSibling);
    } else {
      parent.appendChildAtLastPosition(this);
    }
  }

  private appendChildBefore(newNode: TreeNode, refChild: TreeNode): void {
    newNode.setParent(refChild.getParent());
    if (refChild === this.firstChild) {
      this.firstChild = newNode;
      newNode.setPrevSibling(undefined);
    } else {
      newNode.setPrevSibling(refChild.getPrevSibling());
      refChild.getPrevSibling()?.setNextSibling(newNode);
    }
    newNode.setNextSibling(refChild);
    refChild.setPrevSibling(newNode);
  }

  private appendChildAtLastPosition(newNode: TreeNode): void {
    newNode.setParent(this);
    if (this.firstChild === undefined) {
      this.firstChild = newNode;
      this.lastChild = newNode;
      newNode.setPrevSibling(undefined);
      newNode.setNextSibling(undefined);
    } else {
      this.lastChild?.setNextSibling(newNode);
      newNode.setPrevSibling(this.lastChild);
      newNode.setNextSibling(undefined);
      this.lastChild = newNode;
    }
  }

  public remove(parent: TreeNode): void {
    if (this.parent === parent) {
      parent.removeChild(this);
    } else {
      console.error(`node ${parent.getId()} and node ${this.id} are not parent-child relation`);
    }
    // if (parent?.getFirstChild()?.getId() === this.getId()) {
    //   parent.setFirstChild(this.getNextSibling());
    // }
    // if (parent?.getLastChild()?.getId() === this.getId()) {
    //   parent.setLastChild(this.getPrevSibling());
    // }
    // this.getPrevSibling()?.setNextSibling(this.getNextSibling());
    // this.getNextSibling()?.setPrevSibling(this.getPrevSibling());
    // this.setParent(undefined);
    // this.setNextSibling(undefined);
    // this.setPrevSibling(undefined);
  }

  private removeChild(child: TreeNode): void {
    if (this.firstChild === child) {
      if (this.lastChild === child) {
        // Only one
        this.firstChild = undefined;
        this.lastChild = undefined;
      } else {
        // First
        this.firstChild = child.getNextSibling();
        this.firstChild?.setPrevSibling(undefined);
      }
    } else if (this.lastChild === child) {
      // Last
      this.lastChild = child.getPrevSibling();
      this.lastChild?.setNextSibling(undefined);
    } else {
      // Middle
      child.getPrevSibling()?.setNextSibling(child.getNextSibling());
      child.getNextSibling()?.setPrevSibling(child.getPrevSibling());
    }
  }

  public createMessage(): NodeMessage {
    const message: NodeMessage = {
      behavior: '',
      id: this.getId(),
      parentId: this.getParent()?.getId(),
      nextId: this?.getNextSibling()?.getId(),
      text: this.getText(),
    };
    return message;
  }

  public getChildren(): TreeNode[] {
    const children: TreeNode[] = [];
    let node = this.getFirstChild();
    for (; node !== undefined; node = node.getNextSibling()) {
      children.push(node);
    }
    return children;
  }

  public getAllChildren(): TreeNode[] {
    const children: TreeNode[] = [];
    this.getChildrenAll(this, children);
    return children;
  }

  private getChildrenAll(node: TreeNode, children: TreeNode[]): void {
    let child = node.getFirstChild();
    for (; child !== undefined; child = child.getNextSibling()) {
      children.push(child);
      this.getChildrenAll(child, children);
    }   
  }

  public getColor(): string {
    return this.color;
  }

  public setColor(color: string): void {
    this.color = color;
  }

  public getSeqNum(): number {
    return this.seqNum;
  }

  public setSeqNum(seqNum: number | undefined): void {
    if (seqNum !== undefined) {
      this.seqNum = seqNum;
    }
  }

  public getRandomChild(): TreeNode | undefined {
    const children = this.getChildren();
    const index = Math.floor(Math.random() * (children.length + 1));
    if (index > children.length || children.length === 0) {
      return undefined;
    }
    return children[index];
  }

  public serialize(): NodeInfo {
    const message: NodeInfo = {
      id: this.getId(),
      parentId: this.getParent()?.getId(),
      firstChildId: this.getFirstChild()?.getId(),
      lastChildId: this.getLastChild()?.getId(),
      prevId: this.getPrevSibling()?.getId(),
      nextId: this?.getNextSibling()?.getId(),
      text: this.getText(),
      color: this.getColor()
    };
    return message;
  }
}

export default TreeNode;
