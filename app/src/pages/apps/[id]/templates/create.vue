<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppDetailHeader from '~/components/app/AppDetailHeader.vue'
import AppNavigation from '~/components/app/AppNavigation.vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useApp } from '~/graphql'
import { useCreateTemplate } from '~/graphql/templates'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)

const { data: appData } = useApp(appId)
const app = computed(() => appData.value)
const { mutateAsync: createTemplate, isLoading } = useCreateTemplate()

const form = ref({
  name: '',
  channelType: 'EMAIL',
  subject: '',
  body: '',
  htmlBody: '',
})

async function handleCreate() {
  await createTemplate({
    appId: appId.value,
    name: form.value.name,
    channelType: form.value.channelType,
    subject: form.value.subject || undefined,
    body: form.value.body,
    htmlBody: form.value.htmlBody || undefined,
  })
  router.push(`/apps/${appId.value}/templates`)
}
</script>

<template>
  <div>
    <AppDetailHeader :app="app" />
    <AppNavigation :app-id="appId" />

    <div class="mb-6">
      <h2 class="text-xl font-semibold">
        Create Template
      </h2>
      <p class="text-sm text-muted-foreground">
        Use <span v-pre class="font-mono bg-muted px-1 rounded text-xs">{{variableName}}</span> for dynamic content
      </p>
    </div>

    <Card class="max-w-2xl">
      <CardHeader>
        <CardTitle>Template Details</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label>Template Name</Label>
          <Input v-model="form.name" placeholder="Welcome Email" />
        </div>
        <div>
          <Label>Channel Type</Label>
          <Select v-model="form.channelType">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">
                Email
              </SelectItem>
              <SelectItem value="PUSH">
                Push
              </SelectItem>
              <SelectItem value="SMS">
                SMS
              </SelectItem>
              <SelectItem value="IN_APP">
                In-App
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="form.channelType === 'EMAIL'">
          <Label>Subject</Label>
          <Input v-model="form.subject" placeholder="Welcome, {{name}}!" />
        </div>
        <div>
          <Label>Body (plain text)</Label>
          <Textarea
            v-model="form.body"
            placeholder="Hello {{name}}, welcome to {{appName}}!"
            :rows="4"
          />
        </div>
        <div v-if="form.channelType === 'EMAIL'">
          <Label>HTML Body (optional)</Label>
          <Textarea
            v-model="form.htmlBody"
            placeholder="<p>Hello <strong>{{name}}</strong>!</p>"
            :rows="6"
            class="font-mono text-sm"
          />
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <Button variant="outline" @click="router.push(`/apps/${appId}/templates`)">
            Cancel
          </Button>
          <Button :disabled="!form.name || !form.body || isLoading" @click="handleCreate">
            Create Template
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
