import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { NpmClient } from '../npm/client.js';
import type { Certificate } from '../npm/types.js';

// ── list-certificates ──

async function listCertificates(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const { instanceName } = z
    .object({ instanceName: z.string().min(1) })
    .parse(args);
  const client = clients.get(instanceName);
  if (!client) throw new Error(`Unknown instance: ${instanceName}`);
  const certs = await client.get<Certificate[]>('/nginx/certificates');
  return { content: [{ type: 'text', text: JSON.stringify(certs, null, 2) }] };
}

// ── get-certificate ──

async function getCertificate(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  const cert = await client.get<Certificate>(`/nginx/certificates/${parsed.id}`);
  return { content: [{ type: 'text', text: JSON.stringify(cert, null, 2) }] };
}

// ── create-certificate ──

async function createCertificate(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({
      instanceName: z.string().min(1),
      provider: z.enum(['letsencrypt', 'manual']),
      domainNames: z.array(z.string()),
      niceName: z.string(),
      letsencryptEmail: z.string().email().optional(),
      letsencryptAgreement: z.boolean().default(true),
      dnsChallenge: z.boolean().default(false),
      certificateContent: z.string().optional(),
      certificateKey: z.string().optional(),
    })
    .parse(args);

  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);

  if (parsed.provider === 'manual') {
    throw new Error(
      'Manual certificate creation requires a two-step workflow (create then upload via multipart). This tool only supports Let\'s Encrypt. For manual certs, use the NPM UI or call the API directly.'
    );
  }

  // Let's Encrypt
  const meta: Record<string, unknown> = {
    dns_challenge: parsed.dnsChallenge,
    letsencrypt_agreement: parsed.letsencryptAgreement,
  };

  if (parsed.letsencryptEmail !== undefined) {
    meta.letsencrypt_email = parsed.letsencryptEmail;
  }

  const body: Record<string, unknown> = {
    provider: 'letsencrypt',
    nice_name: parsed.niceName,
    domain_names: parsed.domainNames,
    meta,
  };

  const result = await client.post<Certificate>('/nginx/certificates', body);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ── renew-certificate ──

async function renewCertificate(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  const result = await client.post<Certificate>(`/nginx/certificates/${parsed.id}/renew`, null);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ── delete-certificate ──

async function deleteCertificate(
  server: McpServer,
  clients: Map<string, NpmClient>,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const parsed = z
    .object({ instanceName: z.string().min(1), id: z.string() })
    .parse(args);
  const client = clients.get(parsed.instanceName);
  if (!client) throw new Error(`Unknown instance: ${parsed.instanceName}`);
  await client.delete(`/nginx/certificates/${parsed.id}`);
  return { content: [{ type: 'text', text: 'Certificate deleted successfully' }] };
}

// ── Registration ──

export function registerCertificateTools(server: McpServer, clients: Map<string, NpmClient>): void {
  server.registerTool(
    'list-certificates',
    {
      title: 'list-certificates',
      description: 'List all certificates on an NPM instance. Includes Let\'s Encrypt and manual certificates.',
      inputSchema: { instanceName: z.string().min(1) },
    },
    async (args) => listCertificates(server, clients, args)
  );

  server.registerTool(
    'get-certificate',
    {
      title: 'get-certificate',
      description: 'Get a single certificate by ID. Use `list-certificates` to find the ID.',
      inputSchema: { instanceName: z.string().min(1), id: z.string().describe('Certificate numeric ID') },
    },
    async (args) => getCertificate(server, clients, args)
  );

  server.registerTool(
    'create-certificate',
    {
      title: 'create-certificate',
      description: 'Create a new certificate. Let\'s Encrypt is supported for automatic provisioning. Manual provider requires two-step workflow not exposed here.',
      inputSchema: {
        instanceName: z.string().min(1),
        provider: z.enum(['letsencrypt', 'manual']),
        domainNames: z.array(z.string()).describe('Domain names for the certificate'),
        niceName: z.string().describe('Human-readable name for this certificate'),
        letsencryptEmail: z.string().email().optional(),
        letsencryptAgreement: z.boolean().default(true),
        dnsChallenge: z.boolean().default(false),
        certificateContent: z.string().optional().describe('PEM certificate for manual provider'),
        certificateKey: z.string().optional().describe('PEM private key for manual provider'),
      },
    },
    async (args) => createCertificate(server, clients, args)
  );

  server.registerTool(
    'renew-certificate',
    {
      title: 'renew-certificate',
      description: 'Renew a Let\'s Encrypt certificate. Returns the updated certificate details.',
      inputSchema: { instanceName: z.string().min(1), id: z.string() },
    },
    async (args) => renewCertificate(server, clients, args)
  );

  server.registerTool(
    'delete-certificate',
    {
      title: 'delete-certificate',
      description: 'Delete a certificate by ID. Only certificates not referenced by proxy hosts can be deleted.',
      inputSchema: { instanceName: z.string().min(1), id: z.string() },
    },
    async (args) => deleteCertificate(server, clients, args)
  );
}
