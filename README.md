# Prediction Market Analyst MCP Server

An MCP (Model Context Protocol) server that wraps the Prediction Market Analyst x402 API, making it discoverable as native tools in Claude Code, Cursor, Windsurf, and any MCP-compatible AI tool.

## Overview

The Prediction Market Analyst service provides calibrated probability estimates, Kelly-optimal position sizing, market scanning, and full ensemble analysis for prediction markets (Kalshi, Polymarket, etc.). All endpoints are paid via x402 micropayments in USDC on Base network. The underlying models are tuned on 100+ resolved prediction markets with 0.891 trading score and 90.2% edge accuracy.

## Installation

Install the MCP server globally or per-project, then add it to Claude Code:

```bash
npm install -g @kingmadellc/prediction-market-mcp
claude mcp add prediction-market -- node $(npm list -g @kingmadellc/prediction-market-mcp --prefix)/bin/prediction-market-mcp
```

Or, if installed locally:

```bash
npm install @kingmadellc/prediction-market-mcp
claude mcp add prediction-market -- node ./node_modules/.bin/prediction-market-mcp
```

## Available Tools

| Tool | Price | Description |
|------|-------|-------------|
| `prediction_market_estimate` | $0.05 | Calibrated probability estimate for a prediction market question using the proprietary Kalshalyst methodology. Returns estimate, confidence, reasoning, and trade direction. |
| `prediction_market_size` | $0.08 | Kelly-optimal position sizing with premium parameters (α=0.75, conf_exp=1.0) producing 2.6x P&L lift over defaults. Applies market filter rules. |
| `prediction_market_scan` | $0.10 | Scan and rank multiple markets by tradeable edge. Applies market filter rules and returns ranked opportunities with Kelly sizing. |
| `prediction_market_ensemble` | $0.15 | Full analysis pipeline: Kalshalyst estimation + Xpulse social signals + ensemble weighting (0.75/0.25) + Kelly sizing + market filter. Complete 0.893 trading score stack. |
| `prediction_market_info` | Free | Service information, endpoints, pricing, and methodology overview. |

## Example Usage in Claude Code

```typescript
// Estimate probability for a prediction market
const estimate = await tools.prediction_market_estimate({
  question: "Will the Fed cut rates by June 2026?",
  market_price: 0.62,
  category: "fed",
  context: "CPI cooling, labor market softening"
});

// Size a position using Kelly criterion
const sizing = await tools.prediction_market_size({
  estimated_prob: 0.68,
  market_price: 0.62,
  confidence: 0.85,
  category: "fed",
  bankroll: 1000
});

// Scan multiple markets for tradeable opportunities
const scan = await tools.prediction_market_scan({
  markets: [
    { question: "Will the Fed cut rates by June 2026?", price: 0.62, category: "fed", days_to_close: 87 },
    { question: "Will BTC hit $100k by EOY 2026?", price: 0.45, category: "crypto", days_to_close: 294 }
  ]
});

// Full analysis with social signals
const ensemble = await tools.prediction_market_ensemble({
  question: "Will the Fed cut rates by June 2026?",
  market_price: 0.62,
  category: "fed",
  xpulse_posts: [
    "Breaking: Inflation falls to 2.1%, lowest in 3 years",
    "Fed Governor hints at rate flexibility in Q2"
  ]
});
```

## How x402 Payment Works

When you call a paid endpoint, the MCP server checks the API response status. If the API returns HTTP 402 (Payment Required), the server extracts payment details and returns them to Claude Code as structured JSON.

Claude Code (or Cursor/Windsurf with x402-aware middleware) then:

1. Reads the payment details: wallet address (`0xEbFc61b8b5D2BFaD8938B80cC131d3fA7C6fdd24`), network (Base), and price (USDC)
2. Constructs an x402 payment request header (see https://x402.org)
3. Resends the request with the payment header
4. The API processes the payment and returns the result

This happens transparently — you don't manually manage wallets or transactions.

## Wallet Address

All micropayments are received at: `0xEbFc61b8b5D2BFaD8938B80cC131d3fA7C6fdd24`

Network: Base (EVM-compatible, low fees)

## API Base URL

https://prediction-market-analyst.vercel.app

## Building from Source

```bash
npm install
npm run build
npm start
```

## License

MIT

## Author

KingMade LLC — https://kingmadellc.com
