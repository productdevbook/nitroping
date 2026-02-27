# Kubernetes (Helm)

NitroPing ships a first-class Helm chart for Kubernetes deployments. PostgreSQL is managed by the **CloudNativePG** operator — a fully open-source, cloud-native PostgreSQL operator with no licensing restrictions. Redis runs as a lightweight bundled Deployment.

## Why CloudNativePG?

[CloudNativePG](https://cloudnative-pg.io) (CNPG) is the recommended way to run PostgreSQL on Kubernetes:

- Fully open-source (Apache 2.0 license)
- Manages PostgreSQL 18 clusters natively
- Automatic failover, streaming replication, point-in-time recovery
- No dependency on third-party commercial chart repositories

---

## Prerequisites

- **Kubernetes** 1.26+
- **Helm** 3.12+
- **cert-manager** (recommended, for TLS)
- `kubectl` configured against your cluster

```bash
kubectl version --client
helm version
```

---

## Step 1 — Install CloudNativePG Operator

The CNPG operator must be installed once per cluster before deploying NitroPing.

```bash
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm repo update
helm install cnpg cnpg/cloudnative-pg \
  --namespace cnpg-system \
  --create-namespace \
  --wait
```

Verify the operator is running:

```bash
kubectl get pods -n cnpg-system
```

---

## Step 2 — Add the NitroPing Repository

```bash
helm repo add nitroping https://productdevbook.github.io/nitroping
helm repo update
```

---

## Step 3 — Install NitroPing

### Quick install (single-node, for evaluation)

```bash
helm install nitroping nitroping/nitroping \
  --namespace nitroping \
  --create-namespace \
  --set config.jwtSecret=$(openssl rand -hex 64) \
  --set config.encryptionKey=$(openssl rand -hex 32) \
  --set config.webhookSecret=$(openssl rand -hex 32) \
  --wait
```

This creates:
- A CNPG `Cluster` with 1 PostgreSQL 18 instance
- A Redis Deployment
- The NitroPing server Deployment

### Verify

```bash
kubectl get cluster -n nitroping          # CNPG cluster status
kubectl get pods -n nitroping             # all pods
kubectl rollout status deployment/nitroping -n nitroping
```

---

## Production Setup with `values.yaml`

For real deployments, manage everything in a `values.yaml` file. Keep secrets out of plain files — see [Secrets Management](#secrets-management).

```yaml
# values.yaml

replicaCount: 2

image:
  repository: ghcr.io/productdevbook/nitroping
  tag: "1.2.0"   # always pin in production

ingress:
  enabled: true
  className: traefik   # or nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: notify.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: nitroping-tls
      hosts:
        - notify.example.com

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

# CloudNativePG — 3-instance HA cluster
cnpg:
  enabled: true
  instances: 3
  imageName: "ghcr.io/cloudnative-pg/postgresql:18"
  database: nitroping
  owner: nitroping
  storage:
    size: 20Gi
  parameters:
    max_connections: "300"
    shared_buffers: "512MB"
  enablePodMonitor: true   # requires prometheus-operator

# Redis — bundled lightweight deployment
redis:
  enabled: true
  image: redis:7-alpine
  storage: 4Gi
```

```bash
helm upgrade --install nitroping nitroping/nitroping \
  --namespace nitroping \
  --create-namespace \
  --values values.yaml \
  --set config.jwtSecret=$JWT_SECRET \
  --set config.encryptionKey=$ENCRYPTION_KEY \
  --set config.webhookSecret=$WEBHOOK_SECRET \
  --wait
```

---

## Using External PostgreSQL and Redis

Disable the bundled services when using managed databases (RDS, Cloud SQL, Upstash, etc.).

```yaml
cnpg:
  enabled: false

externalDatabase:
  host: my-rds.us-east-1.rds.amazonaws.com
  port: 5432
  user: nitroping
  database: nitroping
  password: ""   # use existingSecret instead

redis:
  enabled: false

externalRedis:
  host: my-redis.upstash.io
  port: 6379
  password: ""   # use existingSecret instead
```

---

## Secrets Management

Never store secrets in plain `values.yaml`. Use one of these approaches:

### Option A — Sealed Secrets

```bash
# Install Sealed Secrets controller
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets -n kube-system sealed-secrets/sealed-secrets

# Create the secret manifest and seal it
kubectl create secret generic nitroping-secrets -n nitroping \
  --from-literal=JWT_SECRET=$(openssl rand -hex 64) \
  --from-literal=ENCRYPTION_KEY=$(openssl rand -hex 32) \
  --from-literal=WEBHOOK_SECRET=$(openssl rand -hex 32) \
  --from-literal=DATABASE_URL="postgresql://nitroping@nitroping-postgres-rw:5432/nitroping" \
  --from-literal=REDIS_HOST=nitroping-redis \
  --from-literal=REDIS_PORT=6379 \
  --from-literal=SCHEDULER_ENABLED=true \
  --from-literal=NITRO_HOST=0.0.0.0 \
  --dry-run=client -o yaml \
  | kubeseal --format yaml > sealed-secret.yaml

kubectl apply -f sealed-secret.yaml
```

Reference in `values.yaml`:

```yaml
existingSecret: nitroping-secrets
```

### Option B — External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: nitroping-secrets
  namespace: nitroping
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend   # or aws-parameter-store, gcp-secrets, etc.
    kind: ClusterSecretStore
  target:
    name: nitroping-secrets
  data:
    - secretKey: JWT_SECRET
      remoteRef:
        key: nitroping/jwt-secret
    - secretKey: ENCRYPTION_KEY
      remoteRef:
        key: nitroping/encryption-key
    - secretKey: WEBHOOK_SECRET
      remoteRef:
        key: nitroping/webhook-secret
    - secretKey: DATABASE_URL
      remoteRef:
        key: nitroping/database-url
```

---

## Ingress with Traefik

Traefik is the default ingress controller on k3s and many managed clusters:

```yaml
ingress:
  enabled: true
  className: traefik
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: notify.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: nitroping-tls
      hosts:
        - notify.example.com
```

Or use Traefik's native CRD (`IngressRoute`) for more control — see the [Reverse Proxy guide](/docs/self-hosting/reverse-proxy).

## Ingress with NGINX

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
  hosts:
    - host: notify.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: nitroping-tls
      hosts:
        - notify.example.com
```

---

## How Migrations Work on Kubernetes

Migrations run automatically inside every new pod on startup — before the pod becomes ready and before any traffic is routed to it.

The Helm Deployment is configured with:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # spin up 1 new pod
    maxUnavailable: 0  # never kill old pods until new pod is Ready
```

The full startup flow during a `helm upgrade`:

```
New pod starts
     ↓
migrate.ts runs — applies pending migrations
(uses pg_advisory_lock, safe if multiple pods start simultaneously)
     ↓
Migrations complete → server starts
     ↓
readinessProbe passes → Kubernetes routes traffic to new pod
     ↓
Old pod is terminated
```

Old pods keep serving traffic until the new pod fully passes its readiness probe — which only happens after migrations succeed. This gives you **zero-downtime upgrades with automatic migrations**.

---

## Upgrading

```bash
helm repo update

# Preview what will change
helm diff upgrade nitroping nitroping/nitroping \
  --namespace nitroping \
  --values values.yaml

# Apply — triggers a rolling update, migrations run automatically on new pods
helm upgrade nitroping nitroping/nitroping \
  --namespace nitroping \
  --values values.yaml \
  --set config.jwtSecret=$JWT_SECRET \
  --set config.encryptionKey=$ENCRYPTION_KEY \
  --set config.webhookSecret=$WEBHOOK_SECRET
```

---

## Backups with CloudNativePG

CNPG supports continuous WAL archiving and scheduled base backups to object storage (S3, GCS, Azure Blob):

```yaml
# Add to your cnpg Cluster spec (advanced — edit the CRD directly or extend the chart)
backup:
  barmanObjectStore:
    destinationPath: "s3://my-bucket/nitroping-backups"
    s3Credentials:
      accessKeyId:
        name: s3-credentials
        key: ACCESS_KEY_ID
      secretAccessKey:
        name: s3-credentials
        key: SECRET_ACCESS_KEY
  retentionPolicy: "30d"
```

---

## Uninstalling

```bash
# Remove the Helm release (keeps PVCs and CNPG Cluster by default)
helm uninstall nitroping -n nitroping

# Delete the CNPG cluster (irreversible — deletes all PostgreSQL data)
kubectl delete cluster nitroping-postgres -n nitroping

# Delete PVCs
kubectl delete pvc -n nitroping --all

# Delete namespace
kubectl delete namespace nitroping
```

---

## Chart Values Reference

| Key | Default | Description |
|---|---|---|
| `replicaCount` | `1` | NitroPing server replicas |
| `image.tag` | `""` | Pin to a specific version (uses appVersion if empty) |
| `config.jwtSecret` | `""` | **Required.** JWT signing secret |
| `config.encryptionKey` | `""` | **Required.** Data encryption key |
| `config.webhookSecret` | `""` | **Required.** Webhook HMAC secret |
| `ingress.enabled` | `false` | Create an Ingress resource |
| `ingress.className` | `""` | Ingress class (`traefik`, `nginx`, …) |
| `cnpg.enabled` | `true` | Create a CloudNativePG Cluster |
| `cnpg.instances` | `1` | PostgreSQL instances (3+ for HA) |
| `cnpg.imageName` | `ghcr.io/cloudnative-pg/postgresql:18` | PostgreSQL image |
| `cnpg.storage.size` | `10Gi` | Storage per PostgreSQL instance |
| `redis.enabled` | `true` | Deploy bundled Redis |
| `redis.image` | `redis:7-alpine` | Redis image |
| `autoscaling.enabled` | `false` | Enable HorizontalPodAutoscaler |
| `existingSecret` | `""` | Use an existing Kubernetes Secret for all env vars |
