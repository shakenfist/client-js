import {
  Client as RawClient,
  Instance as RawInstance,
  InstanceEvent as RawInstanceEvent,
} from '../rawclient';
import { SFNode } from './node';

export interface InstanceEvent {
  readonly timestamp: Date;
  readonly fqdn: string;
  readonly operation: string;
  readonly phase: string;
  readonly duration: number;
  readonly message: string;
}

function rawInstanceEventToInstanceEvent(ev: RawInstanceEvent): InstanceEvent {
  const { timestamp, fqdn, operation, phase, duration, message } = ev;
  return {
    timestamp: new Date(timestamp * 1000),
    fqdn,
    operation,
    phase,
    duration,
    message,
  };
}

interface PowerState {
  readonly current: string;
  readonly previous?: string;
  readonly updated: Date;
}

export class Instance {
  readonly id: string;
  name: string;
  cpus: number;
  memory: number;
  vdiPort: number;
  state: string;
  stateUpdated: Date;
  powerState: PowerState;
  events?: InstanceEvent[];
  private nodeName: string;
  node?: SFNode;

  constructor(private rawClient: RawClient, instance: RawInstance) {
    this.id = instance.uuid;
    this.name = instance.name;
    this.cpus = instance.cpus;
    this.memory = instance.memory;
    this.vdiPort = instance.vdi_port;
    this.state = instance.state;
    this.stateUpdated = new Date(instance.state_updated * 1000);
    this.powerState = {
      current: instance.power_state,
      previous: instance.power_state_previous || undefined,
      updated: new Date(instance.power_state_updated * 1000),
    };
    this.nodeName = instance.node;
  }

  private useFieldsFrom(instance: RawInstance) {
    this.name = instance.name;
    this.cpus = instance.cpus;
    this.memory = instance.memory;
    this.vdiPort = instance.vdi_port;
    this.state = instance.state;
    this.stateUpdated = new Date(instance.state_updated * 1000);
    this.powerState = {
      current: instance.power_state,
      previous: instance.power_state_previous || undefined,
      updated: new Date(instance.power_state_updated * 1000),
    };
    this.nodeName = instance.node;
  }

  async refreshFields() {
    this.useFieldsFrom(await this.rawClient.getInstance(this.id));
    // If they've refreshed fields, they probably want the latest
    // events, so we invalidate our current list of events
    this.events = undefined;
    this.node = undefined;
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
  async getEvents(): Promise<InstanceEvent[]> {
    if (this.events == null) {
      const events = await this.rawClient.getInstanceHistory(this.id);
      this.events = events.map(rawInstanceEventToInstanceEvent);
    }
    return this.events;
  }
  async getNode(): Promise<SFNode> {
    if (this.node == null) {
      const nodes = await this.rawClient.listNodes();
      const rawNode = nodes.find(({ name }) => name === this.nodeName);
      if (rawNode == null) {
        throw new Error('Unable to get node for instance');
      }
      this.node = SFNode.fromRaw(
        this.rawClient,
        rawNode,
      );
    }
    return this.node;
  }
  async getVDI(): Promise<string> {
    const { ip } = await this.getNode();
    return `${ip}:${this.vdiPort}`;
  }
}
