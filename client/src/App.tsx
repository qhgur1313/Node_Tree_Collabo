import React, { useEffect, useState } from 'react';
import Page from './component/Page';
import TreeNode from './component/TreeNode';
import { InitData } from './store/Repository';
import useStore from './store/useStore';

const { rootStore } = useStore();
const { treeStore } = rootStore;

function App() {
  useEffect(() => {
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

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:4000/connect?id=${treeStore.getSessionId()}`)
      .then((response) => response.json())
      .then((response: InitData) => {
        setIsLoading(false);
        treeStore.initData(response);
      });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <Page rootNode={treeStore.rootNode as TreeNode} />
    </div>
  );
}

export default App;
