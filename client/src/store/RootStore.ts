import { observable } from 'mobx';
import TreeStore from './TreeStore';

interface Root {
  treeStore: TreeStore;
}

export const rootStore = observable<Root>({
  treeStore: new TreeStore(),
});
