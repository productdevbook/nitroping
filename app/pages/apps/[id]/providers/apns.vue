<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { AlertTriangle, ArrowLeft, Check, FileText, Loader2, Save } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import * as z from 'zod'

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

const { mutateAsync: configureAPNsMutation, isLoading: isConfiguring } = useConfigureAPNs()

// Form validation schema
const formSchema = toTypedSchema(z.object({
  keyId: z.string().min(1, 'Key ID is required').max(10, 'Key ID should be 10 characters'),
  teamId: z.string().min(1, 'Team ID is required').max(10, 'Team ID should be 10 characters'),
  privateKey: z.string().min(1, 'Private key is required'),
  bundleId: z.string().optional(),
  isProduction: z.boolean().default(false),
}))

// Form setup
const { handleSubmit, isSubmitting, setValues } = useForm({
  validationSchema: formSchema,
  initialValues: {
    keyId: '',
    teamId: '',
    privateKey: '',
    bundleId: '',
    isProduction: false,
  },
})

// Watch for app data and populate form
watch(app, (newApp) => {
  if (newApp && newApp.apnsKeyId) {
    setValues({
      keyId: newApp.apnsKeyId || '',
      teamId: newApp.apnsTeamId || '',
      privateKey: newApp.apnsCertificate || '',
      bundleId: newApp.bundleId || '',
      isProduction: false, // Default since we don't store this in DB yet
    })
  }
}, { immediate: true })

// Form submission
const onSubmit = handleSubmit(async (values) => {
  try {
    await configureAPNsMutation({
      id: appId.value,
      input: {
        keyId: values.keyId.trim(),
        teamId: values.teamId.trim(),
        privateKey: values.privateKey.trim(),
        bundleId: values.bundleId?.trim(),
        isProduction: values.isProduction,
      },
    })

    // TODO: Show success toast
    console.log('APNs configured successfully')
    
    // Navigate back to providers page
    await router.push(`/apps/${appId.value}/providers`)
  }
  catch (error) {
    console.error('Error configuring APNs:', error)
    // TODO: Show error toast
  }
})

function goBack() {
  router.push(`/apps/${appId.value}/providers`)
}

// Check if app has existing APNs configuration
const hasExistingConfig = computed(() => {
  return app.value?.apnsKeyId && app.value?.apnsTeamId
})
</script>

<template>
  <div v-if="app">
    <!-- App Header -->
    <AppDetailHeader :app="app" />

    <!-- Page Header -->
    <div class="flex items-center space-x-4 mb-8">
      <Button variant="ghost" size="icon" @click="goBack">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold mb-1">Configure Apple APNs</h1>
        <p class="text-muted-foreground">Set up push notifications for iOS devices</p>
      </div>
    </div>

    <!-- Configuration Form -->
    <div class="max-w-2xl space-y-6">
      <!-- Current Status -->
      <Card v-if="hasExistingConfig">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Check class="h-5 w-5 text-green-600" />
            <span>APNs Currently Configured</span>
          </CardTitle>
          <CardDescription>Your app is currently set up to send push notifications to iOS devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <p class="text-sm"><strong>Key ID:</strong> {{ app.apnsKeyId }}</p>
            <p class="text-sm"><strong>Team ID:</strong> {{ app.apnsTeamId }}</p>
            <p class="text-sm text-muted-foreground">Private key is securely stored and encrypted.</p>
          </div>
        </CardContent>
      </Card>

      <!-- Configuration Guide -->
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>Follow these steps to get your APNs credentials from Apple Developer Console</CardDescription>
        </CardHeader>
        <CardContent>
          <ol class="space-y-3 text-sm">
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
              <div>
                <p class="font-medium">Login to Apple Developer Console</p>
                <p class="text-muted-foreground">Go to developer.apple.com and sign in with your developer account</p>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
              <div>
                <p class="font-medium">Create APNs Auth Key</p>
                <p class="text-muted-foreground">Navigate to Keys section and create a new key with APNs service enabled</p>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
              <div>
                <p class="font-medium">Download .p8 file</p>
                <p class="text-muted-foreground">Download the private key file and note your Key ID and Team ID</p>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">4</span>
              <div>
                <p class="font-medium">Configure below</p>
                <p class="text-muted-foreground">Enter your credentials in the form below</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <!-- Configuration Form -->
      <Card>
        <CardHeader>
          <CardTitle>APNs Configuration</CardTitle>
          <CardDescription>Enter your Apple Push Notification service credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-6" @submit="onSubmit">
            <!-- Key ID -->
            <FormField v-slot="{ componentField }" name="keyId">
              <FormItem>
                <FormLabel class="required">Key ID</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    placeholder="ABC1234DEF"
                    maxlength="10"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
                <FormDescription>
                  10-character identifier for your APNs Auth Key (found in Apple Developer Console)
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Team ID -->
            <FormField v-slot="{ componentField }" name="teamId">
              <FormItem>
                <FormLabel class="required">Team ID</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    placeholder="1234567890"
                    maxlength="10"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
                <FormDescription>
                  Your Apple Developer Team ID (found in Apple Developer Console)
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Private Key -->
            <FormField v-slot="{ componentField }" name="privateKey">
              <FormItem>
                <FormLabel class="required">Private Key (.p8 file content)</FormLabel>
                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    placeholder="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
                    rows="8"
                    class="font-mono text-xs"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
                <FormDescription>
                  Paste the entire content of your .p8 private key file here
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Bundle ID (Optional) -->
            <FormField v-slot="{ componentField }" name="bundleId">
              <FormItem>
                <FormLabel>Bundle ID (Optional)</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    placeholder="com.yourcompany.yourapp"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
                <FormDescription>
                  Your iOS app's bundle identifier (leave empty if using wildcard certificate)
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Environment Toggle -->
            <FormField v-slot="{ componentField }" name="isProduction">
              <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5">
                  <FormLabel class="text-base">Production Environment</FormLabel>
                  <FormDescription>
                    Use Apple's production APNs servers (recommended for live apps)
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    v-bind="componentField"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
              </FormItem>
            </FormField>

            <!-- Security Warning -->
            <Alert>
              <AlertTriangle class="h-4 w-4" />
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                Your private key will be encrypted and securely stored. We recommend using environment-specific keys and rotating them regularly.
              </AlertDescription>
            </Alert>

            <!-- Submit Buttons -->
            <div class="flex space-x-3 pt-4">
              <Button
                type="submit"
                :disabled="isSubmitting || isConfiguring"
                class="flex-1"
              >
                <Loader2 v-if="isSubmitting || isConfiguring" class="w-4 h-4 mr-2 animate-spin" />
                <Save v-else class="w-4 h-4 mr-2" />
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
              href="https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/establishing_a_token-based_connection_to_apns"
              target="_blank"
              class="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <FileText class="h-4 w-4" />
              <span>Apple APNs Documentation</span>
            </a>
            <a 
              href="https://developer.apple.com/account/resources/authkeys/list"
              target="_blank"
              class="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <FileText class="h-4 w-4" />
              <span>Manage APNs Auth Keys</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center h-64">
    <Loader2 class="h-8 w-8 animate-spin" />
  </div>
</template>

<style scoped>
.required::after {
  content: "*";
  color: rgb(239 68 68);
  margin-left: 0.25rem;
}
</style>