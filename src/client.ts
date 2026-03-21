/**
 * the402.ai API client for MCP server.
 * Thin HTTP wrapper — handles auth headers and error formatting.
 */

export class The402Client {
	private apiBase: string;
	private apiKey: string | undefined;

	constructor(apiBase: string, apiKey?: string) {
		this.apiBase = apiBase.replace(/\/$/, "");
		this.apiKey = apiKey;
	}

	/** Throws a descriptive error if no API key is configured. */
	requireAuth(): void {
		if (!this.apiKey) {
			throw new Error(
				"This action requires authentication. Set THE402_API_KEY in your MCP server config:\n\n" +
					'{\n  "mcpServers": {\n    "the402": {\n      "command": "npx",\n' +
					'      "args": ["-y", "@the402/mcp-server"],\n      "env": {\n' +
					'        "THE402_API_KEY": "your_api_key_here"\n      }\n    }\n  }\n}\n\n' +
					"Get an API key by registering at https://the402.ai or via the /v1/register endpoint."
			);
		}
	}

	/** Public GET — no auth required. */
	async get(path: string, params?: Record<string, string>): Promise<unknown> {
		const url = new URL(`${this.apiBase}${path}`);
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				if (v !== undefined && v !== "") url.searchParams.set(k, v);
			}
		}

		const res = await fetch(url.toString(), {
			headers: { "User-Agent": "the402-mcp-server/1.0" },
		});
		return this.handleResponse(res);
	}

	/** Authenticated GET — requires API key. */
	async authGet(
		path: string,
		params?: Record<string, string>
	): Promise<unknown> {
		this.requireAuth();
		const url = new URL(`${this.apiBase}${path}`);
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				if (v !== undefined && v !== "") url.searchParams.set(k, v);
			}
		}

		const res = await fetch(url.toString(), {
			headers: {
				"X-API-Key": this.apiKey!,
				"User-Agent": "the402-mcp-server/1.0",
			},
		});
		return this.handleResponse(res);
	}

	/** Authenticated POST — requires API key (free endpoints). */
	async authPost(path: string, body?: unknown): Promise<unknown> {
		this.requireAuth();
		const res = await fetch(`${this.apiBase}${path}`, {
			method: "POST",
			headers: {
				"X-API-Key": this.apiKey!,
				"Content-Type": "application/json",
				"User-Agent": "the402-mcp-server/1.0",
			},
			body: body ? JSON.stringify(body) : undefined,
		});
		return this.handleResponse(res);
	}

	/** Authenticated PUT — requires API key. */
	async authPut(path: string, body?: unknown): Promise<unknown> {
		this.requireAuth();
		const res = await fetch(`${this.apiBase}${path}`, {
			method: "PUT",
			headers: {
				"X-API-Key": this.apiKey!,
				"Content-Type": "application/json",
				"User-Agent": "the402-mcp-server/1.0",
			},
			body: body ? JSON.stringify(body) : undefined,
		});
		return this.handleResponse(res);
	}

	/** Authenticated DELETE — requires API key. */
	async authDelete(path: string): Promise<unknown> {
		this.requireAuth();
		const res = await fetch(`${this.apiBase}${path}`, {
			method: "DELETE",
			headers: {
				"X-API-Key": this.apiKey!,
				"User-Agent": "the402-mcp-server/1.0",
			},
		});
		return this.handleResponse(res);
	}

	/** Balance-auth POST — uses X-BALANCE-AUTH header to pay from pre-funded balance. */
	async balancePost(path: string, body?: unknown): Promise<unknown> {
		this.requireAuth();
		const res = await fetch(`${this.apiBase}${path}`, {
			method: "POST",
			headers: {
				"X-BALANCE-AUTH": this.apiKey!,
				"Content-Type": "application/json",
				"User-Agent": "the402-mcp-server/1.0",
			},
			body: body ? JSON.stringify(body) : undefined,
		});
		return this.handleResponse(res);
	}

	private async handleResponse(res: Response): Promise<unknown> {
		if (res.ok) {
			return res.json();
		}

		let errorBody: string;
		try {
			const json = (await res.json()) as { error?: string };
			errorBody = json.error || JSON.stringify(json);
		} catch {
			errorBody = await res.text();
		}

		throw new Error(`API error ${res.status}: ${errorBody}`);
	}
}
