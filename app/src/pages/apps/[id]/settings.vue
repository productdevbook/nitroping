<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePush } from 'notivue'
import Icon from '~/components/common/Icon.vue'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { useApp, useDeleteApp, useRegenerateApiKey, useUpdateApp } from '~/graphql'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)
const push = usePush()

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

const { mutateAsync: updateAppMutation, isLoading: isUpdatingApp } = useUpdateApp()
const { mutateAsync: regenerateApiKeyMutation, isLoading: isRegeneratingKey } = useRegenerateApiKey()
const { mutateAsync: deleteAppMutation, isLoading: isDeletingApp } = useDeleteApp()

// Reactive data
const appForm = ref({
  name: '',
  description: '',
  isActive: true,
})

const showDeleteDialog = ref(false)
const showRegenerateDialog = ref(false)
const deleteConfirmText = ref('')

// Watch for app data changes
watch(app, (newApp) => {
  if (newApp) {
    appForm.value = {
      name: newApp.name || '',
      description: newApp.description || '',
      isActive: newApp.isActive ?? true,
    }
  }
}, { immediate: true })

async function updateApp() {
  try {
    await updateAppMutation({
      id: appId.value,
      input: {
        name: appForm.value.name.trim(),
        description: appForm.value.description?.trim() || null,
        isActive: appForm.value.isActive,
      },
    })
    push.success({ title: 'App settings saved' })
  }
  catch (error) {
    console.error('Error updating app:', error)
    push.error({ title: 'Failed to save settings', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

async function regenerateApiKey() {
  try {
    await regenerateApiKeyMutation(appId.value)
    showRegenerateDialog.value = false
    push.success({ title: 'API key regenerated' })
  }
  catch (error) {
    console.error('Error regenerating API key:', error)
    push.error({ title: 'Failed to regenerate API key', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

async function deleteApp() {
  if (deleteConfirmText.value !== app.value?.slug) {
    return
  }

  try {
    await deleteAppMutation(appId.value)
    showDeleteDialog.value = false
    push.success({ title: 'App deleted' })
    router.push('/apps')
  }
  catch (error) {
    console.error('Error deleting app:', error)
    push.error({ title: 'Failed to delete app', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

const isFormDirty = computed(() => {
  if (!app.value)
    return false

  return (
    appForm.value.name !== app.value.name
    || appForm.value.description !== (app.value.description || '')
    || appForm.value.isActive !== app.value.isActive
  )
})

const canDelete = computed(() => {
  return deleteConfirmText.value === app.value?.slug
})
</script>

<template>
  <div v-if="app">
    <!-- App Header -->

    <!-- Navigation -->

    <!-- Settings Content -->
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold mb-2">
          App Settings
        </h2>
        <p class="text-muted-foreground">
          Configure your application settings and preferences.
        </p>
      </div>

      <!-- General Settings -->
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Basic information about your application</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <Label for="app-name">App Name</Label>
              <Input
                id="app-name"
                v-model="appForm.name"
                placeholder="My Awesome App"
                :disabled="isUpdatingApp"
              />
            </div>
            <div class="space-y-2">
              <Label for="app-slug">Slug</Label>
              <Input
                id="app-slug"
                :model-value="app.slug"
                readonly
                class="bg-muted"
              />
              <p class="text-xs text-muted-foreground">
                Slug cannot be changed after creation
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="app-description">Description</Label>
            <Textarea
              id="app-description"
              v-model="appForm.description"
              placeholder="A brief description of your app..."
              rows="3"
              :disabled="isUpdatingApp"
            />
          </div>

          <div class="flex items-center space-x-2">
            <Switch
              id="app-active"
              v-model:checked="appForm.isActive"
              :disabled="isUpdatingApp"
            />
            <Label for="app-active">App is active</Label>
          </div>
          <p class="text-xs text-muted-foreground">
            Inactive apps cannot receive or send notifications
          </p>

          <div class="flex justify-end">
            <Button
              :disabled="!isFormDirty || isUpdatingApp || !appForm.name.trim()"
              @click="updateApp"
            >
              <Icon v-if="isUpdatingApp" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
              <Icon v-else name="lucide:save" class="mr-2 size-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- API Key Management -->
      <Card>
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>Manage your application's API key for authentication</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between p-4 border rounded-lg">
            <div class="space-y-1">
              <h4 class="font-medium">
                Current API Key
              </h4>
              <p class="text-sm text-muted-foreground">
                Key ID: <code class="bg-muted px-1 rounded">{{ app.apiKey?.substring(0, 12) }}...</code>
              </p>
              <p class="text-xs text-muted-foreground">
                Created: {{ new Date(app.createdAt).toLocaleDateString() }}
              </p>
            </div>
            <Button variant="outline" :disabled="isRegeneratingKey" @click="showRegenerateDialog = true">
              <Icon name="lucide:key" class="mr-2 size-4" />
              Regenerate
            </Button>
          </div>

          <Alert>
            <Icon name="lucide:alert-triangle" class="size-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Regenerating your API key will invalidate the current key. Make sure to update your applications with the new key.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <!-- Usage Statistics -->
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Current usage and limits for your application</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <Label class="text-sm font-medium">Total Devices</Label>
              <div class="text-2xl font-bold">
                {{ app.stats?.totalDevices || 0 }}
              </div>
            </div>
            <div class="space-y-2">
              <Label class="text-sm font-medium">Notifications Sent</Label>
              <div class="text-2xl font-bold">
                {{ app.stats?.sentToday || 0 }}
              </div>
            </div>
            <div class="space-y-2">
              <Label class="text-sm font-medium">API Calls</Label>
              <div class="text-2xl font-bold">
                {{ app.stats?.apiCalls || 0 }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Danger Zone -->
      <Card class="border-destructive">
        <CardHeader>
          <CardTitle class="text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between p-4 border border-destructive rounded-lg">
            <div class="space-y-1">
              <h4 class="font-medium text-destructive">
                Delete Application
              </h4>
              <p class="text-sm text-muted-foreground">
                Permanently delete this application and all its data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" :disabled="isDeletingApp" @click="showDeleteDialog = true">
              <Icon name="lucide:trash-2" class="mr-2 size-4" />
              Delete App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Regenerate API Key Dialog -->
    <Dialog v-model:open="showRegenerateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate API Key</DialogTitle>
          <DialogDescription>
            This will generate a new API key and invalidate the current one. Make sure to update your applications with the new key.
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <Icon name="lucide:alert-triangle" class="size-4" />
          <AlertTitle>This action cannot be undone</AlertTitle>
          <AlertDescription>
            Your current API key will stop working immediately after regeneration.
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button variant="outline" @click="showRegenerateDialog = false">
            Cancel
          </Button>
          <Button :disabled="isRegeneratingKey" @click="regenerateApiKey">
            <Icon v-if="isRegeneratingKey" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
            <Icon v-else name="lucide:key" class="mr-2 size-4" />
            Regenerate Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete App Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the application and all its data.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <Alert variant="destructive">
            <Icon name="lucide:alert-triangle" class="size-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This will delete all devices, notifications, and settings associated with this app.
            </AlertDescription>
          </Alert>
          <div class="space-y-2">
            <Label for="delete-confirm">
              Type <code class="bg-muted px-1 rounded">{{ app.slug }}</code> to confirm:
            </Label>
            <Input
              id="delete-confirm"
              v-model="deleteConfirmText"
              placeholder="Type the app slug here"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            Cancel
          </Button>
          <Button variant="destructive" :disabled="!canDelete || isDeletingApp" @click="deleteApp">
            <Icon v-if="isDeletingApp" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
            <Icon v-else name="lucide:trash-2" class="mr-2 size-4" />
            Delete Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center h-64">
    <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin" />
  </div>
</template>
