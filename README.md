# Prediction Market MCP — legacy experimental client

Source and support destination for `@kingmadellc/prediction-market-mcp@1.0.1`, previously published on npm. This repository is in maintenance mode. It is an MCP wrapper around a separate hosted API; it does not contain that service, a wallet, or an automatic payment signer.

```sh
npm install -g @kingmadellc/prediction-market-mcp@1.0.1
```

```sh
claude mcp add prediction-market -- npx @kingmadellc/prediction-market-mcp@1.0.1
```

The client exposes estimation, sizing, scanning, ensemble, and service-information tools. Calls to paid endpoints return payment-required information when the service responds with HTTP 402. The client does not make the payment or retry with a signed payment. Check the service response for current requirements; do not rely on old hard-coded pricing as an offer.

## Support boundary

The published npm version is historical and is not automatically updated by source commits here. Service availability, paid execution, and previously advertised performance figures have not been validated end to end. Treat outputs as experimental research. No live financial transaction is part of repository verification.

Report reproducible client bugs through this repository's Issues tab. Do not post credentials, wallet keys, account exports, or personal contact information. No response-time commitment is offered for this legacy client.

## Development

```sh
npm ci
npm run build
npm pack --dry-run
```

CI builds the client and inspects the package without calling the service or publishing to npm. License: MIT; see LICENSE.
