import { readFileSync } from 'node:fs';
import { NpmConfig, InstanceConfig } from './types.js';

function isValidUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function loadConfig(): Promise<NpmConfig> {
  const configPath = process.env.NPMCP_CONFIG;
  if (!configPath) {
    throw new Error('NPMCP_CONFIG environment variable is not set');
  }

  let raw: string;
  try {
    raw = readFileSync(configPath, 'utf-8');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Config file not found: ${configPath} (${message})`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in config file: ${message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Config JSON must be an object');
  }

  const config = parsed as Record<string, InstanceConfig>;

  const instanceNames = Object.keys(config);
  if (instanceNames.length === 0) {
    throw new Error('Config must define at least one instance');
  }

  for (const name of instanceNames) {
    const instance = config[name];
    if (!instance?.address || !instance?.username || !instance?.password) {
      throw new Error(`Instance '${name}': address, username, and password are required`);
    }
    if (!isValidUri(instance.address)) {
      throw new Error(`Instance '${name}': '${instance.address}' is not a valid http(s) URI`);
    }
  }

  return config;
}
