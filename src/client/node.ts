import { Client as RawClient, SFNode as RawSFNode } from '../rawclient';

export class SFNode {
  name: string;
  ip: string;
  lastseen: Date;
  private rawClient: RawClient;
  constructor(rawClient: RawClient, name: string, ip: string, lastseen: Date) {
    this.name = name;
    this.ip = ip;
    this.lastseen = lastseen;
    this.rawClient = rawClient;
  }
}
