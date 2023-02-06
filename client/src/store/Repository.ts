import axios from 'axios';
import { OperationMessage } from './TreeStore';

const serverUrl = 'http://localhost:4000';

export interface InitData {
  order: number;
  nodeStringfy: string;
}

class Repository {
  public postMessage(message: OperationMessage | undefined): void {
    if (message !== undefined) {
      axios.post(`${serverUrl}/message`, message).then((res) => {
        // console.log(res.status);
      });
    }
  }

  public async getInitData(id: string): Promise<InitData> {
    return axios.get(`${serverUrl}/connect?id=${id}`).then((res) => ({ order: res.data.order, nodeStringfy: res.data.nodeStringfy }));
  }

  public updateNode(nodeStringfy: string): void {
    axios.post(`${serverUrl}/update`, { nodeStringfy }).then((res) => {
      // console.log(res.status);
    });
  }
}

export default Repository;
