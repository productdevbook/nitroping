{{/*
Expand the name of the chart.
*/}}
{{- define "nitroping.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "nitroping.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "nitroping.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "nitroping.labels" -}}
helm.sh/chart: {{ include "nitroping.chart" . }}
{{ include "nitroping.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "nitroping.selectorLabels" -}}
app.kubernetes.io/name: {{ include "nitroping.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name
*/}}
{{- define "nitroping.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "nitroping.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
CNPG cluster name
*/}}
{{- define "nitroping.cnpgClusterName" -}}
{{- printf "%s-postgres" (include "nitroping.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
PostgreSQL hostname:
  - CNPG: uses the -rw service (primary read-write endpoint)
  - External: uses externalDatabase.host
*/}}
{{- define "nitroping.databaseHost" -}}
{{- if .Values.cnpg.enabled }}
{{- printf "%s-rw" (include "nitroping.cnpgClusterName" .) }}
{{- else }}
{{- required "externalDatabase.host is required when cnpg.enabled is false" .Values.externalDatabase.host }}
{{- end }}
{{- end }}

{{/*
Database URL
*/}}
{{- define "nitroping.databaseUrl" -}}
{{- if .Values.cnpg.enabled }}
{{- printf "postgresql://%s@%s:5432/%s" .Values.cnpg.owner (include "nitroping.databaseHost" .) .Values.cnpg.database }}
{{- else }}
{{- printf "postgresql://%s:%s@%s:%d/%s" .Values.externalDatabase.user .Values.externalDatabase.password .Values.externalDatabase.host (.Values.externalDatabase.port | int) .Values.externalDatabase.database }}
{{- end }}
{{- end }}

{{/*
Redis hostname
*/}}
{{- define "nitroping.redisHost" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s-redis" (include "nitroping.fullname" .) }}
{{- else }}
{{- required "externalRedis.host is required when redis.enabled is false" .Values.externalRedis.host }}
{{- end }}
{{- end }}

{{/*
Redis port
*/}}
{{- define "nitroping.redisPort" -}}
{{- if .Values.redis.enabled }}6379{{- else }}{{ .Values.externalRedis.port }}{{- end }}
{{- end }}
