import { observer } from 'mobx-react-lite';
import React, { MouseEvent, ReactElement } from 'react';
import AppendNodeCommand from '../command/AppendNodeCommand';
import RemoveNodeCommand from '../command/RemoveNodeCommand';
import useStore from '../store/useStore';
import './NodeComponent.css';
import { TextNodeProps } from './NodeComponentWithChildrenWidth';
import TreeNode from './TreeNode';

function NodeComponent(props: TextNodeProps): ReactElement {
  const { node } = props;
  const { rootStore } = useStore();
  const { treeStore } = rootStore;

  const addNode = () => {
    const newId = treeStore.getIdContainer().getId();
    const newNode = new TreeNode(newId, newId as unknown as string, treeStore.getColor());
    treeStore.setCommand(new AppendNodeCommand(newNode, node));
    treeStore.apply();
  };

  const removeNode = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (node.getId() !== 0) {
      treeStore.setCommand(new RemoveNodeCommand(node, treeStore.getColor()));
      treeStore.apply();
    }
  };

  return (
    <div>
      {node.getId() !== -1 ? (
        <button style={{ borderColor: node.getColor() }} type="button" className="Node" onClick={addNode} onContextMenu={removeNode}>
          <div style={{ color: node.getColor() }} className="Node-text">
            {' '}
            {node.getText()}
          </div>
        </button>
      ) : <div className="Node-blink" />}
    </div>
  );
}

export default observer(NodeComponent);
