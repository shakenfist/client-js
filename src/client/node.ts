import { Client as RawClient, SFNode as RawSFNode } from '../rawclient';

export class SFNode {
  constructor(
    private rawClient: RawClient,
    readonly name: string,
    readonly ip: string,
    readonly lastseen: Date,
  ) {}
  static fromRaw(rawClient: RawClient, rawNode: RawSFNode): SFNode {
    const { name, ip, lastseen } = rawNode;
    return new SFNode(rawClient, name, ip, new Date(lastseen * 1000));
  }
}
