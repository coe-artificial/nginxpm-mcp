import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NpmClient } from './npm/client.js';
import { registerTools } from './tools/index.js';
import { loadConfig } from './config/index.js';

async function main(): Promise<void> {
  // Load configuration
  const config = await loadConfig();

  // Create MCP server
  const server = new McpServer(
    { name: 'nginx-proxy-manager', version: '1.0.0' },
    {
      capabilities: { tools: {} },
    }
  );

  // Instantiate one client per config entry
  const clients = new Map<string, NpmClient>();
  for (const [name, instanceConfig] of Object.entries(config)) {
    clients.set(name, new NpmClient(instanceConfig));
  }

  // Register all tools
  registerTools(server, clients);

  // Connect stdio transport
  const transport = new StdioServerTransport(process.stdin, process.stdout);
  await server.connect(transport);

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    process.stderr.write('Shutting down...\n');
    await server.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Fatal error: ${msg}\n`);
  process.exit(1);
});
