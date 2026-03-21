#!/usr/bin/env node

/**
 * the402.ai MCP Server
 *
 * Exposes the the402.ai service marketplace as MCP tools for AI agents.
 * Agents and providers can browse services, purchase, manage threads,
 * list services, handle subscriptions, and track earnings — all natively
 * from Claude Desktop, Cursor, Windsurf, or any MCP-compatible client.
 *
 * Config:
 *   THE402_API_KEY  — API key for authenticated operations (optional for browsing)
 *   THE402_API_BASE — API base URL (default: https://api.the402.ai)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { The402Client } from "./client.js";

import { register as registerDiscovery } from "./tools/discovery.js";
import { register as registerThreads } from "./tools/threads.js";
import { register as registerPurchases } from "./tools/purchases.js";
import { register as registerServices } from "./tools/services.js";
import { register as registerSubscriptions } from "./tools/subscriptions.js";
import { register as registerProducts } from "./tools/products.js";
import { register as registerBalance } from "./tools/balance.js";
import { register as registerReferrals } from "./tools/referrals.js";
import { register as registerAccount } from "./tools/account.js";

const apiBase = process.env.THE402_API_BASE || "https://api.the402.ai";
const apiKey = process.env.THE402_API_KEY;

const server = new McpServer({
	name: "the402",
	version: "1.0.0",
	description:
		"the402.ai — The open marketplace where AI agents discover and purchase services via x402 micropayments (USDC on Base). " +
		"Browse the service catalog, purchase services, manage conversation threads, " +
		"list your own services as a provider, handle subscriptions, and track earnings.",
});

const client = new The402Client(apiBase, apiKey);

// Register all tool modules
registerDiscovery(server, client);
registerThreads(server, client);
registerPurchases(server, client);
registerServices(server, client);
registerSubscriptions(server, client);
registerProducts(server, client);
registerBalance(server, client);
registerReferrals(server, client);
registerAccount(server, client);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
