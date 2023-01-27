/* eslint-disable react/require-default-props */
import { observer } from 'mobx-react-lite';
import React, { ReactElement } from 'react';
import countLeafNodes from '../util/NodeUtil';
import { nodeWidth } from '../util/Variables';
import NodeComponent from './NodeComponent';
import './NodeComponent.css';
import TreeNode from './TreeNode';

export interface TextNodeProps {
  node: TreeNode;
  // eslint-disable-next-line react/no-unused-prop-types
  width?: number;
}

function NodeComponentWithChildrenWidth(props: TextNodeProps): ReactElement {
  const { node } = props;
  const leafNodeCount = countLeafNodes(node) || 1;
  const width = leafNodeCount * nodeWidth;

  const lineHeight = 40;
  const points: string[] = [];
  const counts: number[] = [];
  let count = 0;
  for (let child = node.getFirstChild(); child !== undefined; child = child.getNextSibling()) {
    const current = countLeafNodes(child) === 0 ? 1 : countLeafNodes(child);
    let bottom = 0;
    if (count !== 0) {
      counts.push(counts[count - 1] + current);
      bottom = nodeWidth * (counts[count - 1] + current / 2);
    } else {
      counts.push(current);
      bottom = nodeWidth * (counts[count] / 2);
    }
    points.push(`${width / 2},0 ${bottom}, ${lineHeight}`);
    count += 1;
  }

  return (
    <div>
      <div className="Node-container-row" style={{ width }}>
        <NodeComponent node={node} />
      </div>
      <svg height={lineHeight} width={width}>
        {points.length !== 0 ? points.map((value, index) => <polyline points={points[index]} style={{ fill: 'white', stroke: 'black', strokeWidth: 2 }} />) : undefined}
      </svg>
    </div>
  );
}

export default observer(NodeComponentWithChildrenWidth);
