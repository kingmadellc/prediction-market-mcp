#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = "https://prediction-market-analyst.vercel.app";

// ─── Tool Definitions ───

const TOOLS = [
  {
    name: "prediction_estimate",
    description:
      "Get a statistical probability estimate for a prediction market event. Uses backtested calibration methodology (90.2% edge accuracy, 0.127 Brier score on historical backtest of 100+ resolved markets — hypothetical results, not indicative of future performance). Returns estimated probability, edge vs market, conviction level, and analysis. For informational and educational purposes only — not investment or trading advice. Not a registered CTA. Costs $0.05 via x402 micropayment (USDC on Base). Full terms: /terms",
    inputSchema: {
      type: "object" as const,
      properties: {
        market_question: {
          type: "string",
          description: 'The prediction market question (e.g. "Will Bitcoin drop below $50,000 by June 2026?")',
        },
        market_price: {
          type: "number",
          description: "Current market price in cents (e.g. 35 for 35¢)",
        },
        category: {
          type: "string",
          enum: ["fed", "crypto", "policy", "technology", "geopolitics", "sports", "general"],
          description: "Market category for calibration rule selection",
        },
        expiry_days: {
          type: "number",
          description: "Days until market expires (default 30)",
        },
        context: {
          type: "string",
          description: "Additional context about the market or current events",
        },
      },
      required: ["market_question", "market_price"],
    },
  },
  {
    name: "prediction_size",
    description:
      "Kelly criterion mathematical analysis for a prediction market scenario. Returns sizing FRACTIONS and formulas only — does NOT calculate specific dollar amounts or contract counts. Users apply their own bankroll and risk tolerance. Uses backtested parameters (alpha=0.75, conf_exp=1.0) from historical optimization (hypothetical results, not indicative of future performance). For educational purposes only — not personalized trading advice. Not a registered CTA. Costs $0.08 via x402 micropayment (USDC on Base). Full terms: /terms",
    inputSchema: {
      type: "object" as const,
      properties: {
        market_question: {
          type: "string",
          description: "The prediction market question",
        },
        market_price: {
          type: "number",
          description: "Current market price in cents",
        },
        estimated_probability: {
          type: "number",
          description: "Your probability estimate (0.0-1.0)",
        },
        confidence: {
          type: "number",
          description: "Confidence level (0.0-1.0, default 0.5)",
        },
      },
      required: ["market_question", "market_price", "estimated_probability"],
    },
  },
  {
    name: "prediction_scan",
    description:
      "Scan multiple prediction markets for statistical edge analysis. Runs estimation, filtering, and ranking pipeline using backtested calibration methodology. Filters by category, price, and horizon. Returns ranked analysis — not trade recommendations. For informational and educational purposes only — not investment or trading advice. Not a registered CTA. Costs $0.15 via x402 micropayment (USDC on Base). Full terms: /terms",
    inputSchema: {
      type: "object" as const,
      properties: {
        markets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              price: { type: "number", description: "Price in cents" },
              category: { type: "string" },
              expiry_days: { type: "number" },
            },
            required: ["question", "price"],
          },
          description: "Array of markets to scan",
        },
      },
      required: ["markets"],
    },
  },
  {
    name: "prediction_sports",
    description:
      "Sports-specific probability analysis using market-anchored methodology. Hockey uses team ELO (backtested Brier 0.2426 vs market 0.2432 — hypothetical results, not indicative of future performance). Other sports use center-nudge (favorite-longshot bias correction). For informational and educational purposes only — not investment or trading advice. Not a registered CTA. Costs $0.05 via x402 micropayment (USDC on Base). Full terms: /terms",
    inputSchema: {
      type: "object" as const,
      properties: {
        market_question: {
          type: "string",
          description: 'The sports market question (e.g. "Rangers at Bruins")',
        },
        market_price: {
          type: "number",
          description: "Current market price in cents",
        },
        sport: {
          type: "string",
          description: 'The sport (e.g. "hockey", "basketball", "soccer", "tennis")',
        },
        teams_or_players: {
          type: "array",
          items: { type: "string" },
          description: 'Teams or players involved (e.g. ["Rangers", "Bruins"])',
        },
        context: {
          type: "string",
          description: "Additional context (injuries, recent form, etc.)",
        },
      },
      required: ["market_question", "market_price", "sport"],
    },
  },
  {
    name: "prediction_info",
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
      const paymentHeader = response.headers.get("x-payment") || "";
      return JSON.stringify(
        {
          status: "payment_required",
          message: "This endpoint requires x402 micropayment (USDC on Base network).",
          endpoint: url,
          price: getPriceForPath(path),
          payment_protocol: "x402",
          network: "Base (EVM)",
          currency: "USDC",
          wallet: "0xEbFc61b8b5D2BFaD8938B80cC131d3fA7C6fdd24",
          how_to_pay: "Send a request with an x402 payment header. See https://x402.org for protocol details.",
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
      error: `Failed to reach Prediction Market Analyst API: ${error instanceof Error ? error.message : String(error)}`,
      suggestion: "The API may be temporarily unavailable. Try again in a moment.",
    });
  }
}

function getPriceForPath(path: string): string {
  if (path.includes("estimate")) return "$0.05";
  if (path.includes("size")) return "$0.08";
  if (path.includes("scan")) return "$0.15";
  if (path.includes("sports")) return "$0.05";
  return "free";
}

// ─── Server Setup ───

const server = new Server(
  {
    name: "prediction-market-analyst",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = args as Record<string, unknown>;

  switch (name) {
    case "prediction_estimate": {
      const result = await callAPI("/api/estimate", "POST", {
        market_question: a.market_question,
        market_price: a.market_price,
        category: a.category || "general",
        expiry_days: a.expiry_days || 30,
        context: a.context || "",
      });
      return { content: [{ type: "text" as const, text: result }] };
    }

    case "prediction_size": {
      const result = await callAPI("/api/size", "POST", {
        market_question: a.market_question,
        market_price: a.market_price,
        estimated_probability: a.estimated_probability,
        confidence: a.confidence || 0.5,
      });
      return { content: [{ type: "text" as const, text: result }] };
    }

    case "prediction_scan": {
      const result = await callAPI("/api/scan", "POST", {
        markets: a.markets,
      });
      return { content: [{ type: "text" as const, text: result }] };
    }

    case "prediction_sports": {
      const result = await callAPI("/api/sports", "POST", {
        market_question: a.market_question,
        market_price: a.market_price,
        sport: a.sport,
        teams_or_players: a.teams_or_players || [],
        context: a.context || "",
      });
      return { content: [{ type: "text" as const, text: result }] };
    }

    case "prediction_info": {
      const result = await callAPI("/", "GET");
      return { content: [{ type: "text" as const, text: result }] };
    }

    default:
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${name}. Available: prediction_estimate, prediction_size, prediction_scan, prediction_sports, prediction_info`,
          },
        ],
      };
  }
});

// ─── Start ───

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Prediction Market Analyst MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
