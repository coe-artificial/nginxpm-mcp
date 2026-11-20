export interface InstanceConfig {
  address: string;
  username: string;
  password: string;
}

export interface NpmConfig {
  [instanceName: string]: InstanceConfig;
}
