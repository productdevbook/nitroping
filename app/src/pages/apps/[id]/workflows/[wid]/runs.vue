<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useWorkflow, useWorkflowExecutions } from '~/graphql/workflows'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)
const workflowId = computed(() => route.params.wid as string)

const { data: workflowData } = useWorkflow(workflowId)
const workflow = computed(() => workflowData.value)
const { data: executionsData, isLoading } = useWorkflowExecutions(workflowId)
const executions = computed(() => executionsData.value || [])

const statusColors: Record<string, string> = {
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">
          Workflow Runs
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ workflow?.name }}
        </p>
      </div>
      <Button variant="outline" @click="router.push(`/apps/${appId}/workflows/${workflowId}`)">
        ← Back to Editor
      </Button>
    </div>

    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Execution ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="6" class="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
            <TableRow v-else-if="executions.length === 0">
              <TableCell colspan="6" class="text-center py-8 text-muted-foreground">
                No runs yet
              </TableCell>
            </TableRow>
            <TableRow v-for="exec in executions" :key="exec.id">
              <TableCell class="font-mono text-xs">
                {{ exec.id.slice(0, 8) }}...
              </TableCell>
              <TableCell>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusColors[exec.status]">
                  {{ exec.status }}
                </span>
              </TableCell>
              <TableCell>{{ exec.currentStepOrder }}</TableCell>
              <TableCell class="text-sm">
                {{ new Date(exec.startedAt).toLocaleString() }}
              </TableCell>
              <TableCell class="text-sm">
                {{ exec.completedAt ? new Date(exec.completedAt).toLocaleString() : '—' }}
              </TableCell>
              <TableCell class="text-xs text-red-600 max-w-[200px] truncate">
                {{ exec.errorMessage || '—' }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
