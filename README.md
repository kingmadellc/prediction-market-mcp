# Prediction Market Analyst — MCP Server

Calibrated probability estimation, Kelly criterion sizing, multi-market scanning, and sports-specific models for prediction markets. Powered by backtested methodology via the Prediction Market Analyst API.

For informational and educational purposes only — not investment or trading advice.

## Tools

| Tool | Price | Description |
|------|-------|-------------|
| `prediction_estimate` | $0.05 | Statistical probability estimate with edge analysis and conviction level |
| `prediction_size` | $0.08 | Kelly criterion fraction analysis (you apply your own bankroll) |
| `prediction_scan` | $0.15 | Scan and rank multiple markets by estimated edge |
| `prediction_sports` | $0.05 | Sports-specific analysis using ELO and market-anchored methodology |
| `prediction_info` | Free | Service information, pricing, and methodology overview |

Payment: USDC on Base network via [x402 protocol](https://x402.org).

## Install

### npx (no install needed)

```bash
npx @kingmadellc/prediction-market-mcp
```

### Claude Code

```bash
claude mcp add prediction-market -- npx @kingmadellc/prediction-market-mcp
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "prediction-market": {
      "command": "npx",
      "args": ["@kingmadellc/prediction-market-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "prediction-market": {
      "command": "npx",
      "args": ["@kingmadellc/prediction-market-mcp"]
    }
  }
}
```

## About

Built by KingMade LLC. API: https://prediction-market-analyst.vercel.app
