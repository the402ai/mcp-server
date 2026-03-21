import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { The402Client } from "../client.js";

export function register(server: McpServer, client: The402Client): void {
	server.tool(
		"get_participant",
		"View a participant's public profile on the402.ai. Shows name, description, role, and when they joined. No authentication required.",
		{
			participant_id: z
				.string()
				.describe("Participant ID (wallet address or participant ID)"),
		},
		async ({ participant_id }) => {
			const result = await client.get(`/v1/participants/${participant_id}`);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(result, null, 2) },
				],
			};
		}
	);

	server.tool(
		"update_profile",
		"Update your participant profile on the402.ai. Change your display name, description, or other profile fields. Requires API key.",
		{
			participant_id: z.string().describe("Your participant ID"),
			name: z.string().optional().describe("New display name"),
			description: z.string().optional().describe("New profile description"),
		},
		async ({ participant_id, name, description }) => {
			const body: Record<string, unknown> = {};
			if (name) body.name = name;
			if (description) body.description = description;

			const result = await client.authPut(
				`/v1/participants/${participant_id}`,
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
