import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"browse_products",
		"Search the digital product catalog on the402.ai. Find downloadable files, datasets, templates, and other digital goods sold by providers. Supports keyword search. No authentication required.",
		{
			query: z
				.string()
				.optional()
				.describe("Search keywords (full-text search)"),
			limit: z.number().optional().describe("Results per page (default: 20)"),
			offset: z.number().optional().describe("Pagination offset"),
		},
		async ({ query, limit, offset }) => {
			const params: Record<string, string> = {};
			if (query) params.q = query;
			if (limit !== undefined) params.limit = String(limit);
			if (offset !== undefined) params.offset = String(offset);

			const result = await client.get("/v1/products", params);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"list_purchases",
		"List your purchased digital products on the402.ai. Shows products you've bought with download status. Requires API key.",
		{},
		async () => {
			const result = await client.authGet("/v1/purchases");
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"manage_product",
		"Create, update, or delete a digital product on the402.ai as a provider. Products are one-time purchasable digital goods (files, datasets, templates). Requires API key (provider account).",
		{
			action: z
				.enum(["create", "update", "delete"])
				.describe(
					"create = new product, update = modify existing, delete = remove"
				),
			product_id: z
				.string()
				.optional()
				.describe("Product ID (required for update/delete)"),
			name: z
				.string()
				.optional()
				.describe("Product name (required for create)"),
			description: z
				.string()
				.optional()
				.describe("Product description (required for create)"),
			price: z
				.string()
				.optional()
				.describe("Price in USD (required for create)"),
			category: z.string().optional().describe("Product category"),
		},
		async ({ action, product_id, name, description, price, category }) => {
			if (action === "delete") {
				if (!product_id) throw new Error("product_id is required for delete");
				const result = await client.authDelete(`/v1/products/${product_id}`);
				return {
					content: [
						{ type: "text" as const, text: JSON.stringify(result, null, 2) },
					],
				};
			}

			if (action === "update") {
				if (!product_id) throw new Error("product_id is required for update");
				const body: Record<string, unknown> = {};
				if (name) body.name = name;
				if (description) body.description = description;
				if (price) body.price = price;
				if (category) body.category = category;
				const result = await client.authPut(`/v1/products/${product_id}`, body);
				return {
					content: [
						{ type: "text" as const, text: JSON.stringify(result, null, 2) },
					],
				};
			}

			// create
			if (!name || !description || !price)
				throw new Error(
					"name, description, and price are required to create a product"
				);
			const body: Record<string, unknown> = { name, description, price };
			if (category) body.category = category;

			// Note: file upload requires multipart — for CLI creation, product metadata only.
			// File can be uploaded separately via the dashboard.
			const result = await client.authPost("/v1/products", body);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);
}
