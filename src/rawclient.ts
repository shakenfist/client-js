import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as jwt from 'jsonwebtoken';

declare module 'axios' {
  interface AxiosResponse<T = any> extends Promise<T> {}
}

interface AuthRequest {
  ns: string;
  key: string;
}

export interface Instance {
  uuid: string;
  name: string;
  cpus: number;
  memory: number;
  disk_spec: DiskSpec[];
  ssh_key: string;
  node: string;
  console_port: number;
  vdi_port: number;
  user_data: string;
  state: string;
  state_updated: number;
}

export interface InstanceEvent {
  timestamp: number;
  fqdn: string;
  operation: string;
  phase: string;
  duration: number;
  message: string;
}

interface DiskSpec {
  base: string;
  size: number;
  bus: string;
  type: string;
}

type vmAction = 'reboot' | 'poweroff' | 'poweron' | 'pause' | 'unpause';

// Method decorator to ensure a valid auth token
function authed(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  const originalMethod = descriptor.value;
  descriptor.value = async function (this: Client, ...args: any[]) {
    if (this.needsTokenRefresh()) {
      await this.connect();
    }
    return originalMethod.apply(this, args);
  };
  return descriptor;
}

export class Client {
  httpClient: AxiosInstance;
  apiKey: string;
  ns: string;
  tokenExpiry: Date = new Date(0);
  constructor(url: string, apiKey: string, ns: string = 'system') {
    this.apiKey = apiKey;
    this.ns = ns;
    this.httpClient = axios.create({ baseURL: url });
    this.httpClient.interceptors.response.use(
      ({ data }) => data,
      (error: any) => Promise.reject(error),
    );
  }

  async connect() {
    if (!(await this.canConnect())) {
      throw new Error('shakenfist-client: Unable to connect');
    }
    await this.authenticate();
  }

  async canConnect(): Promise<boolean> {
    try {
      const message = await this.httpClient.get<string>('/');
      return message === 'Shaken Fist REST API service';
    } catch (err) {
      return false;
    }
  }

  async authenticate() {
    const authToken = await this.getToken({ ns: this.ns, key: this.apiKey });
    this.setTokenExpiry(authToken);
    this.httpClient.defaults.headers.common.Authorization = `Bearer ${authToken}`;
  }

  private async getToken({ ns, key }: AuthRequest): Promise<string> {
    try {
      const { access_token: token } = await this.httpClient.post<{ access_token: string }>('auth', {
        namespace: ns,
        key,
      });
      return token;
    } catch (err) {
      throw new Error('shakenfist-client: Unable to authenticate');
    }
  }

  private setTokenExpiry(token: string) {
    const decoded = jwt.decode(token);
    if (decoded == null || typeof decoded === 'string') {
      throw new Error('shakenfist-client: Invalid JWT');
    }
    this.tokenExpiry = new Date(decoded.exp * 1000);
  }

  needsTokenRefresh(): boolean {
    return this.tokenExpiry < new Date();
  }

  @authed
  async listInstances(): Promise<Instance[]> {
    const instances = await this.httpClient.get<Instance[]>('instances');
    return instances;
  }

  @authed
  async getInstance(uuid: string): Promise<Instance> {
    const instance = await this.httpClient.get<Instance>(`instances/${uuid}`);
    return instance;
  }

  @authed
  async instanceAction(uuid: string, action: vmAction) {
    await this.httpClient.post(`instances/${uuid}/${action}`);
  }

  @authed
  async getInstanceHistory(uuid: string): Promise<InstanceEvent[]> {
    const events = await this.httpClient.get<InstanceEvent[]>(`instances/${uuid}/events`);
    return events;
  }
}
