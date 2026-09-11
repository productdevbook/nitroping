# NitroPing

Kullanıcının sesi, ürünün pusulası.

NitroPing; web, iOS ve Android uygulamalarına gömülebilen, open-core geri bildirim toplama platformudur.

## Başlangıç

```bash
bun install
bun run check
bun run dev:api
```

API health check:

```bash
curl http://localhost:8787/health
```

Local D1 migration:

```bash
bunx wrangler d1 migrations apply nitroping --local --config apps/api/wrangler.jsonc
```

Alchemy infrastructure plan/deploy:

```bash
NITROPING_STAGE=production ALCHEMY_STAGE=production bun run infra:plan
NITROPING_STAGE=staging ALCHEMY_STAGE=staging bun run infra:deploy
```

Production Alchemy adoption requires a Cloudflare token with Workers Scripts Edit and Queues Edit permissions. Wrangler deploy remains the operational production path until that token is available.

## Paketler

- `@nitroping/contracts`: ortak domain tipleri
- `@nitroping/web`: web widget ve headless client
- `apps/api`: Effect servis sınırları ve Cloudflare Worker API
- `migrations`: D1 şeması
- `openapi.yaml`: public API sözleşmesi

## Not

Production kaynakları Cloudflare üzerinde oluşturulmuştur. Dashboard landing asset’i Worker üzerinden, API ise `/api/v1` altında servis edilir. Native SDK’lar aynı OpenAPI sözleşmesini kullanır.
