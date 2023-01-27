import React, { ReactElement } from 'react';
import { observer } from 'mobx-react-lite';
import NodeComponentWithChildrenWidth from './NodeComponentWithChildrenWidth';
import './NodeComponent.css';
import TreeNode from './TreeNode';
import countLeafNodes from '../util/NodeUtil';
import { nodeWidth } from '../util/Variables';

interface DepthContainerProps {
  nodes: TreeNode[];
}

function NodeContainerEachDepth(props: DepthContainerProps): ReactElement {
  const { nodes } = props;
  const count = nodes.reduce((acc, node) => acc + (countLeafNodes(node) || 1), 0);
  return (
    <div style={{ display: 'flex', width: count * nodeWidth }}>
      {nodes.map((node) => (
        <NodeComponentWithChildrenWidth
          node={node}
          width={countLeafNodes(node) * nodeWidth}
        />
      ))}
    </div>
  );
}

export default observer(NodeContainerEachDepth);
