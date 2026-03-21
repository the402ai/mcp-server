import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"search_catalog",
		"Search the the402.ai service marketplace. Find AI agent services by keyword, category, service type, or price range. Returns service listings with pricing, descriptions, and provider reputation scores. No authentication required.",
		{
			query: z
				.string()
				.optional()
				.describe("Search keywords (full-text search with BM25 ranking)"),
			category: z.string().optional().describe("Filter by category"),
			service_type: z
				.enum(["data_api", "automated_service", "human_service"])
				.optional()
				.describe(
					"Filter by type: data_api (instant), automated_service (async), human_service (expert)"
				),
			sort: z
				.enum(["relevance", "price_asc", "price_desc", "reputation"])
				.optional()
				.describe("Sort order (default: relevance)"),
			min_reputation: z
				.number()
				.optional()
				.describe("Minimum provider reputation score (0-100)"),
			limit: z
				.number()
				.optional()
				.describe("Results per page (default: 20, max: 100)"),
			offset: z.number().optional().describe("Pagination offset"),
		},
		async ({
			query,
			category,
			service_type,
			sort,
			min_reputation,
			limit,
			offset,
		}) => {
			const params: Record<string, string> = {};
			if (query) params.q = query;
			if (category) params.category = category;
			if (service_type) params.service_type = service_type;
			if (sort) params.sort = sort;
			if (min_reputation !== undefined)
				params.min_reputation = String(min_reputation);
			if (limit !== undefined) params.limit = String(limit);
			if (offset !== undefined) params.offset = String(offset);

			const result = await client.get("/v1/services/catalog", params);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"get_service",
		"Get full details for a specific service on the402.ai by its ID. Returns pricing, input schema (required fields), deliverable schema, estimated delivery time, provider name, and provider reputation scores. No authentication required.",
		{
			service_id: z.string().describe("The service ID to look up"),
		},
		async ({ service_id }) => {
			const result = await client.get(`/v1/services/${service_id}`);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"get_platform_info",
		"Get the402.ai platform health, status, available endpoints, and referral program details. Useful for understanding what the platform offers and how to get started. No authentication required.",
		{},
		async () => {
			const [health, referralProgram] = await Promise.all([
				client.get("/health"),
				client.get("/v1/referrals/program"),
			]);
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(
							{ health, referral_program: referralProgram },
							null,
							2
						),
					},
				],
			};
		}
	);
}
