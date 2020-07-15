import { Client as RawClient } from '../rawclient';
import { Instance } from './instance';

export class Client {
  rawClient: RawClient;

  constructor(url: string, apiKey: string, ns: string = 'system') {
    this.rawClient = new RawClient(url, apiKey, ns);
  }

  async getInstance(id: string): Promise<Instance> {
    const inst = await this.rawClient.getInstance(id);
    return new Instance(this.rawClient, inst);
  }

  async listInstances(): Promise<Instance[]> {
    const instances = await this.rawClient.listInstances();
    return instances.map((i) => new Instance(this.rawClient, i));
  }
}
