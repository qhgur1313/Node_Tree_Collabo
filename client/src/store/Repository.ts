import axios from 'axios';
import { OperationMessage } from './TreeStore';

const serverUrl = 'http://localhost:4000';

class Repository {
  public postMessage(message: OperationMessage | undefined): void {
    if (message !== undefined) {
      axios.post(`${serverUrl}/message`, message).then((res) => {
        // console.log(res.status);
      });
    }
  }

  public async getInitData(id: string): Promise<number> {
    return axios.get(`${serverUrl}/connect?id=${id}`).then((res) => res.data.order);
  }
}

export default Repository;
