# NitroPing

Kullanıcının sesi, ürünün pusulası.

NitroPing; web, iOS ve Android uygulamalarına gömülebilen, open-core geri bildirim toplama platformudur.

## Başlangıç

```bash
pnpm install
pnpm check
pnpm dev:api
```

API health check:

```bash
curl http://localhost:8787/health
```

Local D1 migration:

```bash
pnpm --filter @nitroping/api exec wrangler d1 migrations apply nitroping-dev --local
```

## Paketler

- `@nitroping/contracts`: ortak domain tipleri
- `@nitroping/web`: web widget ve headless client
- `apps/api`: Effect servis sınırları ve Cloudflare Worker API
- `migrations`: D1 şeması
- `openapi.yaml`: public API sözleşmesi

## Not

Production deploy öncesinde `wrangler.jsonc` içindeki gerçek D1/R2/KV/Queue kimlikleri Alchemy stack output’larıyla doldurulmalıdır. Dashboard, iOS ve Android paketleri aynı OpenAPI sözleşmesi üzerinden eklenecektir.
