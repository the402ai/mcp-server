import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"list_plans",
		"Browse subscription plans on the402.ai. Plans bundle one or more services at a recurring price (monthly or annual). Subscribing gives access to all bundled services for the billing period. No authentication required.",
		{
			limit: z.number().optional().describe("Results per page (default: 20)"),
			offset: z.number().optional().describe("Pagination offset"),
		},
		async ({ limit, offset }) => {
			const params: Record<string, string> = {};
			if (limit !== undefined) params.limit = String(limit);
			if (offset !== undefined) params.offset = String(offset);

			const result = await client.get("/v1/plans", params);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"subscribe_to_plan",
		"Subscribe to a plan on the402.ai. Pays the first billing period from your pre-funded balance. Gives access to all services bundled in the plan until the period ends, with auto-renewal. Requires API key.",
		{
			plan_id: z.string().describe("The plan ID to subscribe to"),
		},
		async ({ plan_id }) => {
			const result = await client.balancePost(`/v1/plans/${plan_id}/subscribe`);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"manage_subscription",
		"Manage your subscription on the402.ai — cancel, pause auto-renewal, or resume a paused subscription. Cancelling still gives access until the current period ends. Requires API key.",
		{
			subscription_id: z.string().describe("The subscription ID"),
			action: z
				.enum(["cancel", "pause", "resume", "details"])
				.describe(
					"cancel = end at period end, pause = stop auto-renewal, resume = restart auto-renewal, details = view subscription info"
				),
		},
		async ({ subscription_id, action }) => {
			if (action === "details") {
				const result = await client.authGet(
					`/v1/subscriptions/${subscription_id}`
				);
				return {
					content: [
						{ type: "text" as const, text: JSON.stringify(result, null, 2) },
					],
				};
			}

			const result = await client.authPost(
				`/v1/subscriptions/${subscription_id}/${action}`
			);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"create_plan",
		"Create a subscription plan as a provider on the402.ai. Bundle one or more of your services at a recurring price. Agents can subscribe for monthly or annual access. Requires API key (provider account).",
		{
			name: z.string().describe("Plan name"),
			description: z.string().describe("What the plan includes"),
			price: z.string().describe("Recurring price in USD (e.g., '9.99')"),
			billing_period: z
				.enum(["monthly", "annual"])
				.describe("Billing frequency"),
			service_ids: z
				.array(z.string())
				.describe("Service IDs included in this plan"),
		},
		async ({ name, description, price, billing_period, service_ids }) => {
			const result = await client.authPost("/v1/plans", {
				name,
				description,
				price,
				billing_period,
				service_ids,
			});
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"manage_plan",
		"Update or delete a subscription plan on the402.ai. Only the provider who created the plan can modify it. Requires API key (plan owner).",
		{
			plan_id: z.string().describe("The plan ID"),
			action: z
				.enum(["update", "delete"])
				.describe("update = modify plan details, delete = remove plan"),
			name: z.string().optional().describe("New plan name (for update)"),
			description: z
				.string()
				.optional()
				.describe("New description (for update)"),
			price: z.string().optional().describe("New price (for update)"),
		},
		async ({ plan_id, action, name, description, price }) => {
			if (action === "delete") {
				const result = await client.authDelete(`/v1/plans/${plan_id}`);
				return {
					content: [
						{ type: "text" as const, text: JSON.stringify(result, null, 2) },
					],
				};
			}

			const body: Record<string, unknown> = {};
			if (name) body.name = name;
			if (description) body.description = description;
			if (price) body.price = price;

			const result = await client.authPut(`/v1/plans/${plan_id}`, body);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);
}
