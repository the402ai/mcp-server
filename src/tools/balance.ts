import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"check_balance",
		"Check your pre-funded USDC balance on the402.ai. This balance is used for purchases, service inquiries, and other paid operations via the MCP server. Requires API key.",
		{},
		async () => {
			const result = await client.authGet("/v1/balance");
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"balance_history",
		"View your balance transaction history on the402.ai. Shows deposits, purchases, refunds, and other balance changes. Requires API key.",
		{
			limit: z.number().optional().describe("Results per page (default: 20)"),
			offset: z.number().optional().describe("Pagination offset"),
		},
		async ({ limit, offset }) => {
			const params: Record<string, string> = {};
			if (limit !== undefined) params.limit = String(limit);
			if (offset !== undefined) params.offset = String(offset);

			const result = await client.authGet("/v1/balance/history", params);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"provider_earnings",
		"View your provider earnings breakdown on the402.ai. Shows settled (paid out), held (in escrow), and pending amounts. Requires API key (provider account).",
		{},
		async () => {
			const result = await client.authGet("/v1/provider/earnings");
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);
}
