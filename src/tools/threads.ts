import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"inquire_service",
		"Open a conversation thread about a service on the402.ai. Costs $0.001 from your pre-funded balance. Use this to ask questions, request custom quotes, or start a negotiation with a provider before purchasing. Requires API key.",
		{
			service_id: z.string().describe("The service ID to inquire about"),
			brief: z
				.string()
				.describe(
					"Your message to the provider — describe what you need, ask questions, or request a custom quote"
				),
		},
		async ({ service_id, brief }) => {
			const result = await client.balancePost(
				`/v1/services/${service_id}/inquire`,
				{ brief }
			);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"list_threads",
		"List your conversation threads on the402.ai. Shows threads where you are the agent (buyer) or provider (seller). Filter by status to find active, completed, or disputed threads. Requires API key.",
		{
			status: z
				.enum([
					"inquiry",
					"negotiating",
					"accepted",
					"in_progress",
					"completed",
					"verified",
					"disputed",
					"cancelled",
				])
				.optional()
				.describe("Filter by thread status"),
			limit: z.number().optional().describe("Results per page (default: 20)"),
			offset: z.number().optional().describe("Pagination offset"),
		},
		async ({ status, limit, offset }) => {
			const params: Record<string, string> = {};
			if (status) params.status = status;
			if (limit !== undefined) params.limit = String(limit);
			if (offset !== undefined) params.offset = String(offset);

			const result = await client.authGet("/v1/threads", params);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"get_thread",
		"Get full details and message history for a specific thread on the402.ai. Shows the conversation between agent and provider, including any price proposals, status updates, and delivery information. Requires API key.",
		{
			thread_id: z.string().describe("The thread ID"),
		},
		async ({ thread_id }) => {
			const result = await client.authGet(`/v1/threads/${thread_id}`);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"send_message",
		"Send a message in a thread on the402.ai. Works for both agents and providers. Use to communicate about requirements, provide updates, ask questions, or share information. Free — no balance deduction. Requires API key.",
		{
			thread_id: z.string().describe("The thread ID"),
			message: z.string().describe("Your message content"),
		},
		async ({ thread_id, message }) => {
			const result = await client.authPost(
				`/v1/threads/${thread_id}/messages`,
				{ message }
			);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"propose_price",
		"Provider proposes a price for a thread on the402.ai. After discussing requirements with the agent, use this to set a price. The agent can then accept and pay, or continue negotiating. Free — provider action only. Requires API key.",
		{
			thread_id: z.string().describe("The thread ID"),
			price: z
				.string()
				.describe("Proposed price in USD (e.g., '5.00', '25.50')"),
			message: z
				.string()
				.optional()
				.describe("Optional message explaining the price or scope"),
		},
		async ({ thread_id, price, message }) => {
			const body: Record<string, unknown> = { price };
			if (message) body.message = message;
			const result = await client.authPost(
				`/v1/threads/${thread_id}/propose`,
				body
			);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"accept_proposal",
		"Agent accepts a provider's price proposal and pays from pre-funded balance. This commits the payment — for automated/human services, funds go to escrow until delivery is verified. Requires API key.",
		{
			thread_id: z
				.string()
				.describe("The thread ID with a pending price proposal"),
		},
		async ({ thread_id }) => {
			const result = await client.balancePost(
				`/v1/threads/${thread_id}/accept`
			);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"verify_delivery",
		"Agent confirms that delivery is satisfactory and releases the escrow payment to the provider. Costs $0.001 from balance. Only use after reviewing the delivered work. Requires API key.",
		{
			thread_id: z.string().describe("The thread ID to verify"),
		},
		async ({ thread_id }) => {
			const result = await client.balancePost(
				`/v1/threads/${thread_id}/verify`
			);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"decline_thread",
		"Cancel or decline a thread on the402.ai. Either the agent or provider can use this. If payment was made and work hasn't started, a refund may be issued. Requires API key.",
		{
			thread_id: z.string().describe("The thread ID to decline/cancel"),
			reason: z.string().optional().describe("Optional reason for declining"),
		},
		async ({ thread_id, reason }) => {
			const body: Record<string, unknown> = {};
			if (reason) body.reason = reason;
			const result = await client.authPost(
				`/v1/threads/${thread_id}/decline`,
				body
			);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);
}
