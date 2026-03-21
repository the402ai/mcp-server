import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"create_service",
		"List a new service on the the402.ai marketplace as a provider. Define the service name, description, pricing, category, and input requirements. Your service will be discoverable by AI agents worldwide. Requires API key (provider account).",
		{
			name: z
				.string()
				.describe("Service name (clear, descriptive, max 100 chars)"),
			description: z
				.string()
				.describe(
					"Detailed description of what the service does, who it's for, and what agents will receive"
				),
			category: z
				.string()
				.describe(
					"Service category (e.g., 'data', 'development', 'content', 'security')"
				),
			price: z.string().describe("Price in USD (e.g., '0.50', '25.00')"),
			pricing_model: z
				.enum(["fixed", "quote_required"])
				.optional()
				.describe(
					"fixed = set price, quote_required = negotiate per request (default: fixed)"
				),
			service_type: z
				.enum(["data_api", "automated_service", "human_service"])
				.optional()
				.describe(
					"data_api = instant, automated_service = async processing, human_service = expert work"
				),
			fulfillment_type: z
				.enum(["instant", "async", "human"])
				.optional()
				.describe("How the service is fulfilled"),
			estimated_delivery: z
				.string()
				.optional()
				.describe(
					"Estimated delivery time (e.g., '< 1 minute', '24 hours', '3-5 days')"
				),
			tags: z.array(z.string()).optional().describe("Tags for discoverability"),
			input_schema: z
				.record(z.unknown())
				.optional()
				.describe(
					"JSON Schema defining required input fields agents must provide when purchasing"
				),
			webhook_url: z
				.string()
				.optional()
				.describe("URL to receive webhook notifications for new orders"),
		},
		async ({
			name,
			description,
			category,
			price,
			pricing_model,
			service_type,
			fulfillment_type,
			estimated_delivery,
			tags,
			input_schema,
			webhook_url,
		}) => {
			const body: Record<string, unknown> = {
				name,
				description,
				category,
				price,
			};
			if (pricing_model) body.pricing_model = pricing_model;
			if (service_type) body.service_type = service_type;
			if (fulfillment_type) body.fulfillment_type = fulfillment_type;
			if (estimated_delivery) body.estimated_delivery = estimated_delivery;
			if (tags) body.tags = tags;
			if (input_schema) body.input_schema = input_schema;
			if (webhook_url) body.webhook_url = webhook_url;

			const result = await client.authPost("/v1/services", body);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"update_service",
		"Update an existing service listing on the402.ai. Change price, description, status (active/inactive), or any other field. Requires API key (service owner only).",
		{
			service_id: z.string().describe("The service ID to update"),
			name: z.string().optional().describe("New service name"),
			description: z.string().optional().describe("New description"),
			price: z.string().optional().describe("New price in USD"),
			status: z
				.enum(["active", "inactive"])
				.optional()
				.describe("Set active or inactive"),
			estimated_delivery: z
				.string()
				.optional()
				.describe("New estimated delivery time"),
			tags: z.array(z.string()).optional().describe("New tags"),
			input_schema: z
				.record(z.unknown())
				.optional()
				.describe("New input schema"),
			webhook_url: z.string().optional().describe("New webhook URL"),
		},
		async ({
			service_id,
			name,
			description,
			price,
			status,
			estimated_delivery,
			tags,
			input_schema,
			webhook_url,
		}) => {
			const body: Record<string, unknown> = {};
			if (name) body.name = name;
			if (description) body.description = description;
			if (price) body.price = price;
			if (status) body.status = status;
			if (estimated_delivery) body.estimated_delivery = estimated_delivery;
			if (tags) body.tags = tags;
			if (input_schema) body.input_schema = input_schema;
			if (webhook_url) body.webhook_url = webhook_url;

			const result = await client.authPut(`/v1/services/${service_id}`, body);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"delete_service",
		"Remove a service listing from the402.ai marketplace. This is permanent — the service will no longer be discoverable or purchasable. Requires API key (service owner only).",
		{
			service_id: z.string().describe("The service ID to delete"),
		},
		async ({ service_id }) => {
			const result = await client.authDelete(`/v1/services/${service_id}`);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);
}
