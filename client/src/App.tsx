import React, { useEffect } from 'react';
import Page from './component/Page';
import TreeNode from './component/TreeNode';
import useStore from './store/useStore';

const rootNode = new TreeNode(0, '0', '000000');
function App() {
  const { rootStore } = useStore();
  const { treeStore } = rootStore;

  useEffect(() => {
    treeStore.getNodeContainer().putNodeToContainer(rootNode);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'z' || e.key === 'Z' || e.key === 'ㅋ') {
        if (e.ctrlKey) {
          if (e.shiftKey) {
            treeStore.reApply();
          } else {
            treeStore.unApply();
          }
        }
      }
    }); 
  });
  return (
    <Page rootNode={rootNode} />
  );
}

export default App;
