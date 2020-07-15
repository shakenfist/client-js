import { Client as RawClient, Instance as RawInstance } from '../rawclient';

export class Instance {
  private rawClient: RawClient;
  id: string;
  name: string;
  cpus: number;
  memory: number;
  vdiPort: number;
  state: string;
  stateUpdated: Date;

  constructor(rawClient: RawClient, instance: RawInstance) {
    this.rawClient = rawClient;
    this.id = instance.uuid;
    this.name = instance.name;
    this.cpus = instance.cpus;
    this.memory = instance.memory;
    this.vdiPort = instance.vdi_port;
    this.state = instance.state;
    this.stateUpdated = new Date(instance.state_updated * 1000);
  }

  private useFieldsFrom(instance: RawInstance) {
    this.id = instance.uuid;
    this.name = instance.name;
    this.cpus = instance.cpus;
    this.memory = instance.memory;
    this.vdiPort = instance.vdi_port;
    this.state = instance.state;
    this.stateUpdated = new Date(instance.state_updated * 1000);
  }

  async refreshFields() {
    this.useFieldsFrom(await this.rawClient.getInstance(this.id));
  }

  async start() {
    await this.rawClient.instanceAction(this.id, 'poweron');
  }
  async stop() {
    await this.rawClient.instanceAction(this.id, 'poweroff');
  }
  async reboot() {
    await this.rawClient.instanceAction(this.id, 'reboot');
  }
  async pause() {
    await this.rawClient.instanceAction(this.id, 'pause');
  }
  async unpause() {
    await this.rawClient.instanceAction(this.id, 'unpause');
  }
}
