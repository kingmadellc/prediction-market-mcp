#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = "https://prediction-market-analyst.vercel.app";

// ─── Tool Definitions ───
// These are what Claude Code, Cursor, Windsurf, etc. see when they discover this server.

const TOOLS = [
  {
    name: "prediction_market_estimate",
    description:
      "Calibrated probability estimate for a prediction market question. Uses the Kalshalyst methodology — a proprietary estimator tuned on 100+ resolved markets with 0.891 trading score and 90.2% edge accuracy. Returns probability estimate, confidence, reasoning, and recommended trade direction. Costs $0.05 via x402 micropayment (USDC on Base).",
    inputSchema: {
      type: "object" as const,
      properties: {
        question: {
          type: "string",
          description:
            "The prediction market question to estimate (e.g. 'Will the Fed cut rates by June 2026?')",
        },
        market_price: {
          type: "number",
          description: "Current market price as a probability (0.0 to 1.0)",
        },
        category: {
          type: "string",
          enum: [
            "policy",
            "crypto",
            "fed",
            "geopolitics",
            "technology",
            "markets",
            "politics",
            "economics",
            "other",
          ],
          description:
            "Market category for improved estimation (optional). Supported: policy, crypto, fed, geopolitics, technology, markets, politics, economics, other",
        },
        context: {
          type: "string",
          description:
            "Additional context or background information to refine the estimate (optional)",
        },
      },
      required: ["question", "market_price"],
    },
  },
  {
    name: "prediction_market_size",
    description:
      "Kelly-optimal position sizing for a prediction market trade. Uses premium Kelly parameters (α=0.75, conf_exp=1.0) that produce 2.6x P&L lift over free defaults. Applies market filter rules (skip fed/ultra-low/short-duration, boost policy/tech/markets). Costs $0.08 via x402 micropayment (USDC on Base).",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimated_prob: {
          type: "number",
          description:
            "Your estimated probability of the event (0.0 to 1.0), typically from prediction_market_estimate",
        },
        market_price: {
          type: "number",
          description: "Current market price as a probability (0.0 to 1.0)",
        },
        confidence: {
          type: "number",
          description:
            "Your confidence in the estimate (0.0 to 1.0), typically from prediction_market_estimate",
        },
        category: {
          type: "string",
          enum: [
            "policy",
            "crypto",
            "fed",
            "geopolitics",
            "technology",
            "markets",
            "politics",
            "economics",
            "other",
          ],
          description: "Market category for filter application (optional)",
        },
        bankroll: {
          type: "number",
          description:
            "Total available capital in USD for kelly sizing (default: 200)",
        },
      },
      required: ["estimated_prob", "market_price", "confidence"],
    },
  },
  {
    name: "prediction_market_scan",
    description:
      "Scan and rank multiple prediction markets by tradeable edge. Applies proprietary market filter (skip rules remove low-quality markets, boost rules amplify high-edge categories). Returns ranked opportunities with Kelly sizing and filter status. Costs $0.10 via x402 micropayment (USDC on Base).",
    inputSchema: {
      type: "object" as const,
      properties: {
        markets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "The market question",
              },
              price: {
                type: "number",
                description: "Current market price (0.0 to 1.0)",
              },
              category: {
                type: "string",
                description: "Market category",
              },
              days_to_close: {
                type: "number",
                description: "Days until market resolves",
              },
            },
            required: ["question", "price", "category", "days_to_close"],
          },
          description: "Array of markets to scan and rank",
        },
      },
      required: ["markets"],
    },
  },
  {
    name: "prediction_market_ensemble",
    description:
      "Full prediction market analysis pipeline — Kalshalyst probability estimation + Xpulse social signal detection + ensemble weighting (0.75/0.25 Kalshalyst/Xpulse) + Kelly position sizing + market filter. The complete stack that produces 0.893 trading score. Costs $0.15 via x402 micropayment (USDC on Base).",
    inputSchema: {
      type: "object" as const,
      properties: {
        question: {
          type: "string",
          description: "The prediction market question",
        },
        market_price: {
          type: "number",
          description: "Current market price as a probability (0.0 to 1.0)",
        },
        category: {
          type: "string",
          enum: [
            "policy",
            "crypto",
            "fed",
            "geopolitics",
            "technology",
            "markets",
            "politics",
            "economics",
            "other",
          ],
          description: "Market category (optional)",
        },
        xpulse_posts: {
          type: "array",
          items: { type: "string" },
          description:
            "X/Twitter posts related to the question for social signal analysis (optional)",
        },
        context: {
          type: "string",
          description: "Additional context to improve analysis (optional)",
        },
      },
      required: ["question", "market_price"],
    },
  },
  {
    name: "prediction_market_info",
    description:
      "Get information about the Prediction Market Analyst service — available endpoints, pricing, methodology overview, and how x402 payment works. Free, no payment required.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// ─── API Caller ───

async function callAPI(
  path: string,
  method: "GET" | "POST",
  params?: Record<string, unknown>
): Promise<string> {
  try {
    let url = `${API_BASE}${path}`;
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (method === "GET" && params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
      url += `?${searchParams.toString()}`;
    } else if (method === "POST" && params) {
      options.body = JSON.stringify(params);
    }

    const response = await fetch(url, options);

    if (response.status === 402) {
      // x402 Payment Required — extract payment details from headers
      const paymentHeader = response.headers.get("x-payment") || "";
      return JSON.stringify(
        {
          status: "payment_required",
          message:
            "This endpoint requires x402 micropayment (USDC on Base network).",
          endpoint: url,
          price: getPriceForPath(path),
          payment_protocol: "x402",
          network: "Base (EVM)",
          currency: "USDC",
          wallet: "0xEbFc61b8b5D2BFaD8938B80cC131d3fA7C6fdd24",
          how_to_pay:
            "Send a request with an x402 payment header. See https://x402.org for protocol details.",
          service_manifest: `${API_BASE}/`,
          payment_header_hint: paymentHeader
            ? paymentHeader.substring(0, 200)
            : "Check response headers for x-payment details",
        },
        null,
        2
      );
    }

    if (!response.ok) {
      return JSON.stringify({
        error: `API returned ${response.status}: ${response.statusText}`,
        body: await response.text(),
      });
    }

    const data = await response.json();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return JSON.stringify({
      error: `Failed to reach Prediction Market API: ${error instanceof Error ? error.message : String(error)}`,
      suggestion:
        "The API may be temporarily unavailable. Try again in a moment.",
    });
  }
}

function getPriceForPath(path: string): string {
  if (path.includes("estimate")) return "$0.05";
  if (path.includes("size")) return "$0.08";
  if (path.includes("scan")) return "$0.10";
  if (path.includes("ensemble")) return "$0.15";
  return "free";
}

// ─── Server Setup ───

const server = new Server(
  {
    name: "prediction-market",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "prediction_market_estimate": {
      const result = await callAPI("/api/estimate", "GET", {
        question: (args as Record<string, unknown>).question,
        market_price: (args as Record<string, unknown>).market_price,
        category: (args as Record<string, unknown>).category,
        context: (args as Record<string, unknown>).context,
      });
      return { content: [{ type: "text" as const, text: result }] };
    }

    case "prediction_market_size": {
      const result = await callAPI("/api/size", "POST", {
        estimated_prob: (args as Record<string, unknown>).estimated_prob,
        market_price: (args as Record<string, unknown>).market_price,
        confidence: (args as Record<string, unknown>).confidence,
        category: (args as Record<string, unknown>).category,
        bankroll: (args as Record<string, unknown>).bankroll || 200,
      });
      return { content: [{ type: "text" as const, text: result }] };
    }

    case "prediction_market_scan": {
      const result = await callAPI("/api/scan", "POST", {
        markets: (args as Record<string, unknown>).markets,
      });
      return { content: [{ type: "text" as const, text: result }] };
    }

    case "prediction_market_ensemble": {
      const result = await callAPI("/api/ensemble", "POST", {
        question: (args as Record<string, unknown>).question,
        market_price: (args as Record<string, unknown>).market_price,
        category: (args as Record<string, unknown>).category,
        xpulse_posts: (args as Record<string, unknown>).xpulse_posts || [],
        context: (args as Record<string, unknown>).context,
      });
      return { content: [{ type: "text" as const, text: result }] };
    }

    case "prediction_market_info": {
      const result = await callAPI("/", "GET");
      return { content: [{ type: "text" as const, text: result }] };
    }

    default:
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${name}. Available tools: prediction_market_estimate, prediction_market_size, prediction_market_scan, prediction_market_ensemble, prediction_market_info`,
          },
        ],
      };
  }
});

// ─── Start ───

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Prediction Market MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
