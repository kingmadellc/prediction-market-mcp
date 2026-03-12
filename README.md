# prediction-market-mcp

MCP server for prediction market analysis. Probability estimation, Kelly sizing, signal detection, market filtering. Pays per-call via x402 (USDC on Base).

## Install

```bash
npm install -g @kingmadellc/prediction-market-mcp
```

## Add to Claude Code

```bash
claude mcp add prediction-market -- npx @kingmadellc/prediction-market-mcp
```

## Tools

| Tool | What it does | Price |
|------|--------------|-------|
| `prediction_market_estimate` | Kalshalyst probability estimate | $0.05 |
| `prediction_market_size` | Kelly-optimal position sizing (2.6x P&L lift) | $0.08 |
| `prediction_market_scan` | Rank markets by tradeable edge | $0.10 |
| `prediction_market_ensemble` | Full stack: estimate + Xpulse + ensemble + Kelly | $0.15 |
| `prediction_market_info` | Service info, endpoints, pricing | Free |

## Performance

- **Kalshalyst trading score**: 0.891 on 100+ resolved markets
- **Xpulse composite score**: 0.9146
- **Edge accuracy**: 90.2%
- **Kelly 2.6x P&L lift** vs defaults

## Wallet

All payments: `0xEbFc61b8b5D2BFaD8938B80cC131d3fA7C6fdd24` (Base network, USDC)

## API

https://prediction-market-analyst.vercel.app

## License

MIT

Powered by [prediction-market-analyst.vercel.app](https://prediction-market-analyst.vercel.app)
