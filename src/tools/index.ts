import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { NpmClient } from '../npm/client.js';
import { registerProxyHostTools } from './proxy-hosts.js';
import { registerCertificateTools } from './certificates.js';
import { registerRedirectionHostTools } from './redirection-hosts.js';

export function registerTools(server: McpServer, clients: Map<string, NpmClient>): void {
  registerProxyHostTools(server, clients);
  registerCertificateTools(server, clients);
  registerRedirectionHostTools(server, clients);
}
