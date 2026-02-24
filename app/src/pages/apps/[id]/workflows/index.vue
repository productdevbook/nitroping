<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppDetailHeader from '~/components/app/AppDetailHeader.vue'
import AppNavigation from '~/components/app/AppNavigation.vue'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useApp } from '~/graphql'
import { useCreateWorkflow, useDeleteWorkflow, useUpdateWorkflow, useWorkflows } from '~/graphql/workflows'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)

const { data: appData } = useApp(appId)
const app = computed(() => appData.value)
const { data: workflowsData, isLoading } = useWorkflows(appId)
const workflowList = computed(() => workflowsData.value || [])

const { mutateAsync: createWorkflow, isLoading: isCreating } = useCreateWorkflow()
const { mutateAsync: deleteWorkflow } = useDeleteWorkflow()
const { mutateAsync: updateWorkflow } = useUpdateWorkflow()

const showCreate = ref(false)
const form = ref({ name: '', triggerIdentifier: '' })

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  ARCHIVED: 'bg-red-100 text-red-700',
}

async function handleCreate() {
  const wf = await createWorkflow({
    appId: appId.value,
    name: form.value.name,
    triggerIdentifier: form.value.triggerIdentifier,
  })
  showCreate.value = false
  form.value = { name: '', triggerIdentifier: '' }
  if (wf?.id) {
    router.push(`/apps/${appId.value}/workflows/${wf.id}`)
  }
}

async function toggleStatus(wf: any) {
  const newStatus = wf.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
  await updateWorkflow({ id: wf.id, input: { status: newStatus }, appId: appId.value })
}
</script>

<template>
  <div>
    <AppDetailHeader :app="app" />
    <AppNavigation :app-id="appId" />

    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">
          Workflows
        </h2>
        <p class="text-sm text-muted-foreground">
          Visual multi-step notification workflows
        </p>
      </div>
      <Button @click="showCreate = true">
        New Workflow
      </Button>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-muted-foreground">
      Loading...
    </div>

    <div v-else-if="workflowList.length === 0" class="text-center py-12">
      <p class="text-muted-foreground">
        No workflows yet
      </p>
      <Button class="mt-4" @click="showCreate = true">
        Create your first workflow
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="wf in workflowList" :key="wf.id" class="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader @click="router.push(`/apps/${appId}/workflows/${wf.id}`)">
          <div class="flex items-start justify-between">
            <CardTitle class="text-base">
              {{ wf.name }}
            </CardTitle>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusColors[wf.status]">
              {{ wf.status }}
            </span>
          </div>
          <CardDescription class="font-mono text-xs">
            {{ wf.triggerIdentifier }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-xs text-muted-foreground">
            {{ wf.steps?.length || 0 }} step{{ (wf.steps?.length || 0) !== 1 ? 's' : '' }}
          </p>
          <div class="mt-3 flex gap-2">
            <Button size="sm" variant="outline" @click="router.push(`/apps/${appId}/workflows/${wf.id}`)">
              Edit
            </Button>
            <Button size="sm" variant="outline" @click="toggleStatus(wf)">
              {{ wf.status === 'ACTIVE' ? 'Pause' : 'Activate' }}
            </Button>
            <Button size="sm" variant="outline" @click="router.push(`/apps/${appId}/workflows/${wf.id}/runs`)">
              Runs
            </Button>
            <Button size="sm" variant="destructive" @click="deleteWorkflow({ id: wf.id, appId })">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="showCreate">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Workflow</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label>Workflow Name</Label>
            <Input v-model="form.name" placeholder="Welcome Series" />
          </div>
          <div>
            <Label>Trigger Identifier</Label>
            <Input v-model="form.triggerIdentifier" placeholder="user-signed-up" />
            <p class="text-xs text-muted-foreground mt-1">
              Unique key used to trigger this workflow via API
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreate = false">
            Cancel
          </Button>
          <Button :disabled="!form.name || !form.triggerIdentifier || isCreating" @click="handleCreate">
            Create &amp; Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
