<script setup lang="ts">
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import Icon from '~/components/common/Icon.vue'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { useApp, useConfigureFCM } from '~/graphql'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

const { mutateAsync: configureFCMMutation, isLoading: isConfiguring } = useConfigureFCM()

// Form validation schema
const formSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  serviceAccount: z.string().min(1, 'Service account JSON is required').refine(
    (val) => {
      try {
        const parsed = JSON.parse(val)
        return parsed.type === 'service_account' && parsed.project_id && parsed.private_key_id
      }
      catch {
        return false
      }
    },
    'Invalid service account JSON format',
  ),
})

// Form setup
const { handleSubmit, isSubmitting, setValues, setFieldValue, values } = useForm({
  validationSchema: formSchema,
  initialValues: {
    projectId: '',
    serviceAccount: '',
  },
})

// Watch for app data and populate form
watch(app, (newApp) => {
  if (newApp && newApp.fcmProjectId) {
    setValues({
      projectId: newApp.fcmProjectId || '',
      serviceAccount: newApp.fcmServiceAccount || '',
    })
  }
}, { immediate: true })

// File upload handling
const fileInput = ref<HTMLInputElement>()

function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file && file.type === 'application/json') {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFieldValue('serviceAccount', content)

      // Try to extract project ID from the JSON
      try {
        const parsed = JSON.parse(content)
        if (parsed.project_id) {
          setFieldValue('projectId', parsed.project_id)
        }
      }
      catch {
        // Ignore parsing errors
      }
    }
    reader.readAsText(file)
  }
}

function triggerFileUpload() {
  fileInput.value?.click()
}

// Form submission
const onSubmit = handleSubmit(async (values) => {
  try {
    await configureFCMMutation({
      id: appId.value,
      input: {
        projectId: values.projectId.trim(),
        serviceAccount: values.serviceAccount.trim(),
      },
    })

    // TODO: Show success toast
    console.log('FCM configured successfully')

    // Navigate back to providers page
    await router.push(`/apps/${appId.value}/providers`)
  }
  catch (error) {
    console.error('Error configuring FCM:', error)
    // TODO: Show error toast
  }
})

function goBack() {
  router.push(`/apps/${appId.value}/providers`)
}

// Check if app has existing FCM configuration
const hasExistingConfig = computed(() => {
  return app.value?.fcmProjectId
})

// Parse service account to show info
const serviceAccountInfo = computed(() => {
  try {
    const formValues = values
    if (formValues?.serviceAccount) {
      return JSON.parse(formValues.serviceAccount)
    }
  }
  catch {
    // Ignore parsing errors
  }
  return null
})
</script>

<template>
  <div v-if="app">
    <!-- App Header -->

    <!-- Page Header -->
    <div class="flex items-center space-x-4 mb-8">
      <Button variant="ghost" size="icon" @click="goBack">
        <Icon name="lucide:arrow-left" class="size-4" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold mb-1">
          Configure Firebase FCM
        </h1>
        <p class="text-muted-foreground">
          Set up push notifications for Android devices
        </p>
      </div>
    </div>

    <!-- Configuration Form -->
    <div class="max-w-2xl space-y-6">
      <!-- Current Status -->
      <Card v-if="hasExistingConfig">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Icon name="lucide:check" class="h-5 w-5 text-green-600" />
            <span>FCM Currently Configured</span>
          </CardTitle>
          <CardDescription>Your app is currently set up to send push notifications to Android devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <p class="text-sm">
              <strong>Project ID:</strong> {{ app.fcmProjectId }}
            </p>
            <p class="text-sm text-muted-foreground">
              Service account credentials are securely stored and encrypted.
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Configuration Guide -->
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>Follow these steps to get your FCM credentials from Firebase Console</CardDescription>
        </CardHeader>
        <CardContent>
          <ol class="space-y-3 text-sm">
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
              <div>
                <p class="font-medium">
                  Go to Firebase Console
                </p>
                <p class="text-muted-foreground">
                  Visit console.firebase.google.com and select your project
                </p>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
              <div>
                <p class="font-medium">
                  Navigate to Project Settings
                </p>
                <p class="text-muted-foreground">
                  Click the gear icon and select "Project settings"
                </p>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
              <div>
                <p class="font-medium">
                  Generate Firebase Admin SDK Key
                </p>
                <div class="text-muted-foreground space-y-1">
                  <p>• Click "Service accounts" tab</p>
                  <p>• Find "Firebase Admin SDK" section</p>
                  <p>• Click "Generate new private key" button</p>
                  <p>• Confirm in the popup dialog</p>
                </div>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">4</span>
              <div>
                <p class="font-medium">
                  Download JSON file
                </p>
                <p class="text-muted-foreground">
                  Download the service account JSON file and upload it below
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <!-- Configuration Form -->
      <Card>
        <CardHeader>
          <CardTitle>FCM Configuration</CardTitle>
          <CardDescription>Enter your Firebase Cloud Messaging credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-6" @submit="onSubmit">
            <!-- Project ID -->
            <FormField v-slot="{ componentField }" name="projectId">
              <FormItem>
                <FormLabel class="required">
                  Project ID
                </FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    placeholder="my-firebase-project"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
                <FormDescription>
                  Your Firebase project ID (automatically filled when you upload the service account file)
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Service Account JSON -->
            <FormField v-slot="{ componentField }" name="serviceAccount">
              <FormItem>
                <FormLabel class="required">
                  Service Account JSON
                </FormLabel>
                <div class="space-y-3">
                  <!-- File Upload Button -->
                  <Button type="button" variant="outline" :disabled="isSubmitting || isConfiguring" @click="triggerFileUpload">
                    <Icon name="lucide:upload" class="mr-2 size-4" />
                    Upload JSON File
                  </Button>
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".json,application/json"
                    class="hidden"
                    @change="handleFileUpload"
                  >

                  <!-- Manual Textarea -->
                  <FormControl>
                    <Textarea
                      v-bind="componentField"
                      placeholder="{&quot;type&quot;: &quot;service_account&quot;, &quot;project_id&quot;: &quot;your-project&quot;, ...}"
                      rows="12"
                      class="font-mono text-xs"
                      :disabled="isSubmitting || isConfiguring"
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Upload the service account JSON file from Firebase Console or paste the content manually
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Service Account Info (if valid JSON) -->
            <Card v-if="serviceAccountInfo" class="bg-muted/50">
              <CardHeader>
                <CardTitle class="text-sm">
                  Service Account Information
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-2 text-sm">
                <p><strong>Project ID:</strong> {{ serviceAccountInfo.project_id }}</p>
                <p><strong>Client Email:</strong> {{ serviceAccountInfo.client_email }}</p>
                <p><strong>Private Key ID:</strong> {{ serviceAccountInfo.private_key_id?.substring(0, 8) }}...</p>
                <p><strong>Type:</strong> {{ serviceAccountInfo.type }}</p>
              </CardContent>
            </Card>

            <!-- Security Warning -->
            <Alert>
              <Icon name="lucide:alert-triangle" class="size-4" />
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                Your service account credentials will be encrypted and securely stored. Never share these credentials publicly or commit them to version control.
              </AlertDescription>
            </Alert>

            <!-- Submit Buttons -->
            <div class="flex space-x-3 pt-4">
              <Button
                type="submit"
                :disabled="isSubmitting || isConfiguring"
                class="flex-1"
              >
                <Icon v-if="isSubmitting || isConfiguring" name="lucide:loader-2" class="size-4 mr-2 animate-spin" />
                <Icon v-else name="lucide:save" class="size-4 mr-2" />
                {{ hasExistingConfig ? 'Update Configuration' : 'Save Configuration' }}
              </Button>
              <Button type="button" variant="outline" @click="goBack">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- Additional Resources -->
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <a
              href="https://firebase.google.com/docs/cloud-messaging/server"
              target="_blank"
              class="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <Icon name="lucide:file-text" class="size-4" />
              <span>Firebase Cloud Messaging Documentation</span>
            </a>
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              class="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <Icon name="lucide:file-text" class="size-4" />
              <span>Firebase Console</span>
            </a>
            <a
              href="https://firebase.google.com/docs/cloud-messaging/auth-server"
              target="_blank"
              class="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <Icon name="lucide:file-text" class="size-4" />
              <span>Server Authentication Guide</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center h-64">
    <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin" />
  </div>
</template>

<style scoped>
.required::after {
  content: "*";
  color: rgb(239 68 68);
  margin-left: 0.25rem;
}
</style>
