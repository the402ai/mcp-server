import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"purchase_service",
		"Purchase a fixed-price service on the402.ai. Creates an async job and conversation thread. Payment is deducted from your pre-funded balance. For data_api services, results are returned immediately. For automated/human services, the provider fulfills the work asynchronously. Requires API key.",
		{
			service_id: z.string().describe("The service ID to purchase"),
			brief: z
				.string()
				.describe(
					"Description of what you need — must include all required fields defined in the service's input_schema"
				),
		},
		async ({ service_id, brief }) => {
			const result = await client.balancePost(
				`/v1/services/${service_id}/purchase`,
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
		"purchase_product",
		"Purchase a digital product on the402.ai. Payment is deducted from your pre-funded balance. After purchase, use list_purchases to find the product and download it. Requires API key.",
		{
			product_id: z.string().describe("The product ID to purchase"),
		},
		async ({ product_id }) => {
			const result = await client.balancePost(
				`/v1/products/${product_id}/purchase`
			);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);
}
