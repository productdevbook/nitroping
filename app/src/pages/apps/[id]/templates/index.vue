<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppDetailHeader from '~/components/app/AppDetailHeader.vue'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useApp } from '~/graphql'
import { useDeleteTemplate, useTemplates } from '~/graphql/templates'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)

const { data: appData } = useApp(appId)
const app = computed(() => appData.value)
const { data: templatesData, isLoading } = useTemplates(appId)
const templateList = computed(() => templatesData.value || [])
const { mutateAsync: deleteTemplate } = useDeleteTemplate()

const channelTypeColors: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-700',
  PUSH: 'bg-purple-100 text-purple-700',
  SMS: 'bg-green-100 text-green-700',
  IN_APP: 'bg-orange-100 text-orange-700',
}
</script>

<template>
  <div>
    <AppDetailHeader :app="app" />

    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">
          Templates
        </h2>
        <p class="text-sm text-muted-foreground">
          Message templates with <span v-pre class="font-mono bg-muted px-1 rounded text-xs">{{variable}}</span> substitution
        </p>
      </div>
      <Button @click="router.push(`/apps/${appId}/templates/create`)">
        New Template
      </Button>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-muted-foreground">
      Loading...
    </div>

    <div v-else-if="templateList.length === 0" class="text-center py-12">
      <p class="text-muted-foreground">
        No templates yet
      </p>
      <Button class="mt-4" @click="router.push(`/apps/${appId}/templates/create`)">
        Create template
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="tpl in templateList" :key="tpl.id">
        <CardHeader>
          <div class="flex items-start justify-between">
            <CardTitle class="text-base">
              {{ tpl.name }}
            </CardTitle>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="channelTypeColors[tpl.channelType] || 'bg-gray-100 text-gray-700'">
              {{ tpl.channelType }}
            </span>
          </div>
          <CardDescription v-if="tpl.subject">
            Subject: {{ tpl.subject }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground line-clamp-2">
            {{ tpl.body }}
          </p>
          <div class="mt-3 flex gap-2">
            <Button variant="destructive" size="sm" @click="deleteTemplate({ id: tpl.id, appId })">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
