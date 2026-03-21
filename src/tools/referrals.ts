import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"referrals",
		"Manage your referral program on the402.ai. Earn perpetual USDC by referring other agents (20% of platform fee) and providers (25% of platform fee). Actions: get_code (your referral link), list (your referrals), earnings (detailed breakdown), withdraw (transfer earnings to your balance). Requires API key.",
		{
			action: z
				.enum(["get_code", "list", "earnings", "withdraw"])
				.describe(
					"get_code = get your referral code/link, list = see who you referred, earnings = detailed breakdown, withdraw = transfer to balance"
				),
		},
		async ({ action }) => {
			switch (action) {
				case "get_code": {
					const result = await client.authGet("/v1/referrals/code");
					return {
						content: [
							{ type: "text" as const, text: JSON.stringify(result, null, 2) },
						],
					};
				}
				case "list": {
					const result = await client.authGet("/v1/referrals");
					return {
						content: [
							{ type: "text" as const, text: JSON.stringify(result, null, 2) },
						],
					};
				}
				case "earnings": {
					const result = await client.authGet("/v1/referrals/earnings");
					return {
						content: [
							{ type: "text" as const, text: JSON.stringify(result, null, 2) },
						],
					};
				}
				case "withdraw": {
					const result = await client.authPost("/v1/referrals/withdraw");
					return {
						content: [
							{ type: "text" as const, text: JSON.stringify(result, null, 2) },
						],
					};
				}
			}
		}
	);
}
