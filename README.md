## simple-atomfeed-poster-cfw

### About
Simple Atom and RSS2 feed poster for Cloudflare Workers

Atom / RSS2  <---watch---  Cloudflare Worker  ---post--->  Webhook, etc...

### Usage:
1. Setup `wrangler`.
2. Copy `wrangler_example.toml` into `wrangler.toml`.
3. Execute `wrangler kv:namespace create SIMPLE_ATOMFEED_POSTER_CFW_STATE_KV` and update `wrangler.toml`.
4. Copy `generator_example.ts` into `generator.ts`.
5. Customize `generator.ts`.
6. Execute `npm run deploy`.
