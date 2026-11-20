import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { NpmClient } from '../npm/client.js';
import type { RedirectionHost } from '../npm/types.js';

// ── list-redirection-hosts ──

async function listRedirectionHosts(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const { instanceName } = z
    .object({ instanceName: z.string().min(1) })
    .parse(args);
  const client = clients.get(instanceName);
  if (!client) throw new Error(`Unknown instance: ${instanceName}`);
  const hosts = await client.get<RedirectionHost[]>('/nginx/redirection-hosts');
  return { content: [{ type: 'text', text: JSON.stringify(hosts, null, 2) }] };
}

// ── get-redirection-host ──

async function getRedirectionHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  const host = await client.get<RedirectionHost>(`/nginx/redirection-hosts/${parsed.id}`);
  return { content: [{ type: 'text', text: JSON.stringify(host, null, 2) }] };
}

// ── create-redirection-host ──

async function createRedirectionHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({
      instanceName: z.string().min(1),
      domainNames: z.array(z.string()),
      forwardScheme: z.enum(['auto', 'http', 'https']),
      forwardHttpCode: z.enum(['301', '302', '307', '308']),
      forwardDomainName: z.string(),
      preservePath: z.boolean().default(false),
      certificateId: z.number().int().min(0).default(0),
      sslForced: z.boolean().default(false),
      blockExploits: z.boolean().default(false),
      http2Support: z.boolean().default(false),
      hstsEnabled: z.boolean().default(false),
      hstsSubdomains: z.boolean().default(false),
      advancedConfig: z.string().default(''),
      enabled: z.boolean().default(true),
    })
    .parse(args);

  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);

  const body: Record<string, unknown> = {
    domain_names: parsed.domainNames,
    forward_scheme: parsed.forwardScheme,
    forward_http_code: parsed.forwardHttpCode,
    forward_domain_name: parsed.forwardDomainName,
    preserve_path: parsed.preservePath,
    certificate_id: parsed.certificateId,
    ssl_forced: parsed.sslForced,
    block_exploits: parsed.blockExploits,
    http2_support: parsed.http2Support,
    hsts_enabled: parsed.hstsEnabled,
    hsts_subdomains: parsed.hstsSubdomains,
    advanced_config: parsed.advancedConfig,
    enabled: parsed.enabled,
  };

  const result = await client.post<RedirectionHost>('/nginx/redirection-hosts', body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ── update-redirection-host ──

async function updateRedirectionHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({
      instanceName: z.string().min(1),
      id: z.string(),
      domainNames: z.array(z.string()).optional(),
      forwardScheme: z.enum(['auto', 'http', 'https']).optional(),
      forwardHttpCode: z.enum(['301', '302', '307', '308']).optional(),
      forwardDomainName: z.string().optional(),
      preservePath: z.boolean().optional(),
      certificateId: z.number().int().min(0).optional(),
      sslForced: z.boolean().optional(),
      blockExploits: z.boolean().optional(),
      http2Support: z.boolean().optional(),
      hstsEnabled: z.boolean().optional(),
      hstsSubdomains: z.boolean().optional(),
      advancedConfig: z.string().optional(),
      enabled: z.boolean().optional(),
    })
    .parse(args);

  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);

  const body: Record<string, unknown> = {};
  if (parsed.domainNames !== undefined) body.domain_names = parsed.domainNames;
  if (parsed.forwardScheme !== undefined) body.forward_scheme = parsed.forwardScheme;
  if (parsed.forwardHttpCode !== undefined) body.forward_http_code = parsed.forwardHttpCode;
  if (parsed.forwardDomainName !== undefined) body.forward_domain_name = parsed.forwardDomainName;
  if (parsed.preservePath !== undefined) body.preserve_path = parsed.preservePath;
  if (parsed.certificateId !== undefined) body.certificate_id = parsed.certificateId;
  if (parsed.sslForced !== undefined) body.ssl_forced = parsed.sslForced;
  if (parsed.blockExploits !== undefined) body.block_exploits = parsed.blockExploits;
  if (parsed.http2Support !== undefined) body.http2_support = parsed.http2Support;
  if (parsed.hstsEnabled !== undefined) body.hsts_enabled = parsed.hstsEnabled;
  if (parsed.hstsSubdomains !== undefined) body.hsts_subdomains = parsed.hstsSubdomains;
  if (parsed.advancedConfig !== undefined) body.advanced_config = parsed.advancedConfig;
  if (parsed.enabled !== undefined) body.enabled = parsed.enabled;

  const result = await client.put<RedirectionHost>(`/nginx/redirection-hosts/${parsed.id}`, body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ── delete-redirection-host ──

async function deleteRedirectionHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  await client.delete(`/nginx/redirection-hosts/${parsed.id}`);
  return { content: [{ type: 'text', text: 'Redirection host deleted successfully' }] };
}

// ── enable-redirection-host ──

async function enableRedirectionHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  await client.post(`/nginx/redirection-hosts/${parsed.id}/enable`, null);
  return { content: [{ type: 'text', text: 'Redirection host enabled' }] };
}

// ── disable-redirection-host ──

async function disableRedirectionHost(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  await client.post(`/nginx/redirection-hosts/${parsed.id}/disable`, null);
  return { content: [{ type: 'text', text: 'Redirection host disabled' }] };
}

// ── Registration ──

export function registerRedirectionHostTools(
  server: McpServer,
  clients: Map<string, NpmClient>
): void {
  server.registerTool(
    'list-redirection-hosts',
    {
      title: 'list-redirection-hosts',
      description: 'List all redirection hosts on an NPM instance. Redirection hosts forward domains to another URL.',
      inputSchema: { instanceName: z.string().min(1) },
    },
    async (args) => listRedirectionHosts(server, clients, args)
  );

  server.registerTool(
    'get-redirection-host',
    {
      title: 'get-redirection-host',
      description: 'Get a single redirection host by ID. Use `list-redirection-hosts` to find the ID.',
      inputSchema: { instanceName: z.string().min(1), id: z.string().describe('Redirection host numeric ID') },
    },
    async (args) => getRedirectionHost(server, clients, args)
  );

  server.registerTool(
    'create-redirection-host',
    {
      title: 'create-redirection-host',
      description: 'Create a new redirection host. Forwards matched domains to a target URL with configurable HTTP status code.',
      inputSchema: {
        instanceName: z.string().min(1),
        domainNames: z.array(z.string()).describe('List of domain names to redirect'),
        forwardScheme: z.enum(['auto', 'http', 'https']),
        forwardHttpCode: z.enum(['301', '302', '307', '308']),
        forwardDomainName: z.string().describe('Target domain to forward to'),
        preservePath: z.boolean().default(false),
        certificateId: z.number().int().min(0).default(0),
        sslForced: z.boolean().default(false),
        blockExploits: z.boolean().default(false),
        http2Support: z.boolean().default(false),
        hstsEnabled: z.boolean().default(false),
        hstsSubdomains: z.boolean().default(false),
        advancedConfig: z.string().default(''),
        enabled: z.boolean().default(true),
      },
    },
    async (args) => createRedirectionHost(server, clients, args)
  );

  server.registerTool(
    'update-redirection-host',
    {
      title: 'update-redirection-host',
      description: 'Update an existing redirection host. Only provided fields are updated.',
      inputSchema: {
        instanceName: z.string().min(1),
        id: z.string(),
        domainNames: z.array(z.string()).optional(),
        forwardScheme: z.enum(['auto', 'http', 'https']).optional(),
        forwardHttpCode: z.enum(['301', '302', '307', '308']).optional(),
        forwardDomainName: z.string().optional(),
        preservePath: z.boolean().optional(),
        certificateId: z.number().int().min(0).optional(),
        sslForced: z.boolean().optional(),
        blockExploits: z.boolean().optional(),
        http2Support: z.boolean().optional(),
        hstsEnabled: z.boolean().optional(),
        hstsSubdomains: z.boolean().optional(),
        advancedConfig: z.string().optional(),
        enabled: z.boolean().optional(),
      },
    },
    async (args) => updateRedirectionHost(server, clients, args)
  );

  server.registerTool(
    'delete-redirection-host',
    {
      title: 'delete-redirection-host',
      description: 'Delete a redirection host by ID.',
      inputSchema: { instanceName: z.string().min(1), id: z.string() },
    },
    async (args) => deleteRedirectionHost(server, clients, args)
  );

  server.registerTool(
    'enable-redirection-host',
    {
      title: 'enable-redirection-host',
      description: 'Enable a disabled redirection host vhost in Nginx.',
      inputSchema: { instanceName: z.string().min(1), id: z.string() },
    },
    async (args) => enableRedirectionHost(server, clients, args)
  );

  server.registerTool(
    'disable-redirection-host',
    {
      title: 'disable-redirection-host',
      description: 'Disable a redirection host vhost in Nginx (returns 502 for matched domains).',
      inputSchema: { instanceName: z.string().min(1), id: z.string() },
    },
    async (args) => disableRedirectionHost(server, clients, args)
  );
}
