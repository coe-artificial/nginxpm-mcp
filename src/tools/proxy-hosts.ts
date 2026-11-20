import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { NpmClient } from '../npm/client.js';
import type { ProxyHost } from '../npm/types.js';

// ── list-proxy-hosts ──

async function listProxyHosts(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const { instanceName } = z
    .object({ instanceName: z.string().min(1) })
    .parse(args);
  const client = clients.get(instanceName);
  if (!client) throw new Error(`Unknown instance: ${instanceName}`);
  const hosts = await client.get<ProxyHost[]>('/nginx/proxy-hosts');
  return { content: [{ type: 'text', text: JSON.stringify(hosts, null, 2) }] };
}

// ── get-proxy-host ──

async function getProxyHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  const host = await client.get<ProxyHost>(`/nginx/proxy-hosts/${parsed.id}`);
  return { content: [{ type: 'text', text: JSON.stringify(host, null, 2) }] };
}

// ── create-proxy-host ──

async function createProxyHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({
      instanceName: z.string().min(1),
      domainNames: z.array(z.string()),
      forwardScheme: z.enum(['http', 'https']),
      forwardHost: z.string(),
      forwardPort: z.number().int().positive(),
      certificateId: z.number().int().min(0).default(0),
      sslForced: z.boolean().default(false),
      blockExploits: z.boolean().default(false),
      cachingEnabled: z.boolean().default(false),
      allowWebsocketUpgrade: z.boolean().default(false),
      http2Support: z.boolean().default(false),
      hstsEnabled: z.boolean().default(false),
      hstsSubdomains: z.boolean().default(false),
      accessListId: z.number().int().min(0).default(0),
      advancedConfig: z.string().default(''),
      enabled: z.boolean().default(true),
      locations: z.string().optional(),
      trustForwardedProto: z.boolean().default(false),
    })
    .parse(args);

  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);

  const body: Record<string, unknown> = {
    domain_names: parsed.domainNames,
    forward_scheme: parsed.forwardScheme,
    forward_host: parsed.forwardHost,
    forward_port: parsed.forwardPort,
    certificate_id: parsed.certificateId,
    ssl_forced: parsed.sslForced,
    block_exploits: parsed.blockExploits,
    caching_enabled: parsed.cachingEnabled,
    allow_websocket_upgrade: parsed.allowWebsocketUpgrade,
    http2_support: parsed.http2Support,
    hsts_enabled: parsed.hstsEnabled,
    hsts_subdomains: parsed.hstsSubdomains,
    access_list_id: parsed.accessListId,
    advanced_config: parsed.advancedConfig,
    enabled: parsed.enabled,
    trust_forwarded_proto: parsed.trustForwardedProto,
  };

  if (parsed.locations !== undefined) {
    body.locations = JSON.parse(parsed.locations);
  }

  const result = await client.post<ProxyHost>('/nginx/proxy-hosts', body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ── update-proxy-host ──

async function updateProxyHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({
      instanceName: z.string().min(1),
      id: z.string(),
      domainNames: z.array(z.string()).optional(),
      forwardScheme: z.enum(['http', 'https']).optional(),
      forwardHost: z.string().optional(),
      forwardPort: z.number().int().positive().optional(),
      certificateId: z.number().int().min(0).optional(),
      sslForced: z.boolean().optional(),
      blockExploits: z.boolean().optional(),
      cachingEnabled: z.boolean().optional(),
      allowWebsocketUpgrade: z.boolean().optional(),
      http2Support: z.boolean().optional(),
      hstsEnabled: z.boolean().optional(),
      hstsSubdomains: z.boolean().optional(),
      accessListId: z.number().int().min(0).optional(),
      advancedConfig: z.string().optional(),
      enabled: z.boolean().optional(),
      locations: z.string().optional(),
      trustForwardedProto: z.boolean().optional(),
    })
    .parse(args);

  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);

  const body: Record<string, unknown> = {};
  if (parsed.domainNames !== undefined) body.domain_names = parsed.domainNames;
  if (parsed.forwardScheme !== undefined) body.forward_scheme = parsed.forwardScheme;
  if (parsed.forwardHost !== undefined) body.forward_host = parsed.forwardHost;
  if (parsed.forwardPort !== undefined) body.forward_port = parsed.forwardPort;
  if (parsed.certificateId !== undefined) body.certificate_id = parsed.certificateId;
  if (parsed.sslForced !== undefined) body.ssl_forced = parsed.sslForced;
  if (parsed.blockExploits !== undefined) body.block_exploits = parsed.blockExploits;
  if (parsed.cachingEnabled !== undefined) body.caching_enabled = parsed.cachingEnabled;
  if (parsed.allowWebsocketUpgrade !== undefined)
    body.allow_websocket_upgrade = parsed.allowWebsocketUpgrade;
  if (parsed.http2Support !== undefined) body.http2_support = parsed.http2Support;
  if (parsed.hstsEnabled !== undefined) body.hsts_enabled = parsed.hstsEnabled;
  if (parsed.hstsSubdomains !== undefined) body.hsts_subdomains = parsed.hstsSubdomains;
  if (parsed.accessListId !== undefined) body.access_list_id = parsed.accessListId;
  if (parsed.advancedConfig !== undefined) body.advanced_config = parsed.advancedConfig;
  if (parsed.enabled !== undefined) body.enabled = parsed.enabled;
  if (parsed.trustForwardedProto !== undefined)
    body.trust_forwarded_proto = parsed.trustForwardedProto;

  if (parsed.locations !== undefined) {
    body.locations = JSON.parse(parsed.locations);
  }

  const result = await client.put<ProxyHost>(`/nginx/proxy-hosts/${parsed.id}`, body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ── delete-proxy-host ──

async function deleteProxyHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  await client.delete(`/nginx/proxy-hosts/${parsed.id}`);
  return { content: [{ type: 'text', text: 'Proxy host deleted successfully' }] };
}

// ── enable-proxy-host ──

async function enableProxyHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  await client.post(`/nginx/proxy-hosts/${parsed.id}/enable`, null);
  return { content: [{ type: 'text', text: 'Proxy host enabled' }] };
}

// ── disable-proxy-host ──

async function disableProxyHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  await client.post(`/nginx/proxy-hosts/${parsed.id}/disable`, null);
  return { content: [{ type: 'text', text: 'Proxy host disabled' }] };
}

// ── Registration ──

export function registerProxyHostTools(server: McpServer, clients: Map<string, NpmClient>): void {
  server.registerTool(
    'list-proxy-hosts',
    {
      title: 'list-proxy-hosts',
      description: 'List all proxy hosts on an NPM instance. Returns full host details including domains, forwarding config, SSL, and HSTS settings.',
      inputSchema: { instanceName: z.string().min(1) },
    },
    async (args) => listProxyHosts(server, clients, args)
  );

  server.registerTool(
    'get-proxy-host',
    {
      title: 'get-proxy-host',
      description: 'Get a single proxy host by ID. Use `list-proxy-hosts` to find the ID.',
      inputSchema: { instanceName: z.string().min(1), id: z.string().describe('Proxy host numeric ID') },
    },
    async (args) => getProxyHost(server, clients, args)
  );

  server.registerTool(
    'create-proxy-host',
    {
      title: 'create-proxy-host',
      description: 'Create a new proxy host. Domain names, forward host/port, and scheme are required. SSL, HSTS, caching, and websocket options available.',
      inputSchema: {
        instanceName: z.string().min(1),
        domainNames: z.array(z.string()).describe('List of domain names (e.g. ["app.example.com"])'),
        forwardScheme: z.enum(['http', 'https']),
        forwardHost: z.string().describe('Backend hostname or IP'),
        forwardPort: z.number().int().positive().describe('Backend port'),
        certificateId: z.number().int().min(0).default(0),
        sslForced: z.boolean().default(false),
        blockExploits: z.boolean().default(false),
        cachingEnabled: z.boolean().default(false),
        allowWebsocketUpgrade: z.boolean().default(false),
        http2Support: z.boolean().default(false),
        hstsEnabled: z.boolean().default(false),
        hstsSubdomains: z.boolean().default(false),
        accessListId: z.number().int().min(0).default(0),
        advancedConfig: z.string().default(''),
        enabled: z.boolean().default(true),
        locations: z.string().optional().describe('JSON array of location objects'),
        trustForwardedProto: z.boolean().default(false),
      },
    },
    async (args) => createProxyHost(server, clients, args)
  );

  server.registerTool(
    'update-proxy-host',
    {
      title: 'update-proxy-host',
      description: 'Update an existing proxy host. Only provided fields are updated. Omit read-only fields (id, created_on, etc.).',
      inputSchema: {
        instanceName: z.string().min(1),
        id: z.string(),
        domainNames: z.array(z.string()).optional(),
        forwardScheme: z.enum(['http', 'https']).optional(),
        forwardHost: z.string().optional(),
        forwardPort: z.number().int().positive().optional(),
        certificateId: z.number().int().min(0).optional(),
        sslForced: z.boolean().optional(),
        blockExploits: z.boolean().optional(),
        cachingEnabled: z.boolean().optional(),
        allowWebsocketUpgrade: z.boolean().optional(),
        http2Support: z.boolean().optional(),
        hstsEnabled: z.boolean().optional(),
        hstsSubdomains: z.boolean().optional(),
        accessListId: z.number().int().min(0).optional(),
        advancedConfig: z.string().optional(),
        enabled: z.boolean().optional(),
        locations: z.string().optional(),
        trustForwardedProto: z.boolean().optional(),
      },
    },
    async (args) => updateProxyHost(server, clients, args)
  );

  server.registerTool(
    'delete-proxy-host',
    {
      title: 'delete-proxy-host',
      description: 'Delete a proxy host by ID. Removes the Nginx vhost configuration.',
      inputSchema: { instanceName: z.string().min(1), id: z.string() },
    },
    async (args) => deleteProxyHost(server, clients, args)
  );

  server.registerTool(
    'enable-proxy-host',
    {
      title: 'enable-proxy-host',
      description: 'Enable a disabled proxy host vhost in Nginx.',
      inputSchema: { instanceName: z.string().min(1), id: z.string() },
    },
    async (args) => enableProxyHost(server, clients, args)
  );

  server.registerTool(
    'disable-proxy-host',
    {
      title: 'disable-proxy-host',
      description: 'Disable a proxy host vhost in Nginx (returns 502 for matched domains).',
      inputSchema: { instanceName: z.string().min(1), id: z.string() },
    },
    async (args) => disableProxyHost(server, clients, args)
  );
}
