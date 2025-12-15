<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from 'abckit/shadcn/alert'
import { Button } from 'abckit/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'abckit/shadcn/card'

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from 'abckit/shadcn/form'
import { Input } from 'abckit/shadcn/input'
import { Textarea } from 'abckit/shadcn/textarea'
import { AlertTriangle, ArrowLeft, Check, FileText, Key, Loader2, RefreshCw, Save } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

const { mutateAsync: configureWebPushMutation, isLoading: isConfiguring } = useConfigureWebPush()
const { refetch: generateVapidKeys, isLoading: isGenerating } = useGenerateVapidKeys()

// Form validation schema
const formSchema = z.object({
  subject: z.string().min(1, 'Subject is required').refine(
    val => val.startsWith('mailto:') || val.startsWith('https://'),
    'Subject must be a mailto: email or https: URL',
  ),
  publicKey: z.string().min(1, 'Public key is required'),
  privateKey: z.string().min(1, 'Private key is required'),
})

// Form setup
const { handleSubmit, isSubmitting, setValues, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: {
    subject: '',
    publicKey: '',
    privateKey: '',
  },
})

// Watch for app data and populate form
watch(app, (newApp) => {
  if (newApp && newApp.vapidPublicKey) {
    setValues({
      subject: newApp.vapidSubject || '',
      publicKey: newApp.vapidPublicKey || '',
      privateKey: newApp.vapidPrivateKey || '',
    })
  }
}, { immediate: true })

const { success: successToast, error: errorToast } = useToast()

// Generate new VAPID keys
async function generateKeys() {
  try {
    const result = await generateVapidKeys()
    const keys = result.data

    if (keys) {
      setFieldValue('publicKey', keys.publicKey)
      setFieldValue('privateKey', keys.privateKey)

      // Set default subject if empty
      const currentSubject = (document.querySelector('[name="subject"]') as HTMLInputElement)?.value
      if (!currentSubject) {
        setFieldValue('subject', 'mailto:admin@example.com')
      }

      successToast('VAPID keys generated successfully', 'New keys have been generated and populated in the form.')
    }
  }
  catch (error) {
    console.error('Error generating VAPID keys:', error)
    errorToast('Failed to generate VAPID keys', 'Please try again or check your configuration.')
  }
}

// Form submission
const onSubmit = handleSubmit(async (values) => {
  try {
    await configureWebPushMutation({
      id: appId.value,
      input: {
        subject: values.subject.trim(),
        publicKey: values.publicKey.trim(),
        privateKey: values.privateKey.trim(),
      },
    })

    successToast('Web Push configured successfully', 'Your VAPID configuration has been saved.')

    // Navigate back to providers page
    await router.push(`/apps/${appId.value}/providers`)
  }
  catch (error) {
    console.error('Error configuring Web Push:', error)
    errorToast('Failed to configure Web Push', 'Please check your settings and try again.')
  }
})

function goBack() {
  router.push(`/apps/${appId.value}/providers`)
}

// Check if app has existing Web Push configuration
const hasExistingConfig = computed(() => {
  return app.value?.vapidPublicKey && app.value?.vapidSubject
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
        <h1 class="text-3xl font-bold mb-1">Configure Web Push</h1>
        <p class="text-muted-foreground">Set up push notifications for web browsers</p>
      </div>
    </div>

    <!-- Configuration Form -->
    <div class="max-w-2xl space-y-6">
      <!-- Current Status -->
      <Card v-if="hasExistingConfig">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Check class="h-5 w-5 text-green-600" />
            <span>Web Push Currently Configured</span>
          </CardTitle>
          <CardDescription>Your app is currently set up to send push notifications to web browsers</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <p class="text-sm"><strong>Subject:</strong> {{ app.vapidSubject }}</p>
            <p class="text-sm"><strong>Public Key:</strong> {{ app.vapidPublicKey?.substring(0, 32) }}...</p>
            <p class="text-sm text-muted-foreground">Private key is securely stored and encrypted.</p>
          </div>
        </CardContent>
      </Card>

      <!-- Configuration Guide -->
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>Web Push uses VAPID (Voluntary Application Server Identification) for authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <ol class="space-y-3 text-sm">
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
              <div>
                <p class="font-medium">Generate VAPID Keys</p>
                <p class="text-muted-foreground">Click "Generate New Keys" below to create a public/private key pair</p>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
              <div>
                <p class="font-medium">Set Subject</p>
                <p class="text-muted-foreground">Provide a contact email or website URL for identification</p>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
              <div>
                <p class="font-medium">Use Public Key in Client</p>
                <p class="text-muted-foreground">Use the public key in your web app's service worker for subscriptions</p>
              </div>
            </li>
            <li class="flex items-start space-x-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">4</span>
              <div>
                <p class="font-medium">Test Notifications</p>
                <p class="text-muted-foreground">Register devices and test push notifications from your dashboard</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <!-- Configuration Form -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Web Push Configuration</CardTitle>
              <CardDescription>Enter your VAPID credentials for web push notifications</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              :disabled="isGenerating || isSubmitting || isConfiguring"
              @click="generateKeys"
            >
              <Loader2 v-if="isGenerating" class="mr-2 h-4 w-4 animate-spin" />
              <Key v-else class="mr-2 h-4 w-4" />
              Generate New Keys
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form class="space-y-6" @submit="onSubmit">
            <!-- Subject -->
            <FormField v-slot="{ componentField }" name="subject">
              <FormItem>
                <FormLabel class="required">Subject</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    placeholder="mailto:admin@yourapp.com or https://yourapp.com"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
                <FormDescription>
                  Your contact email (mailto:) or website URL (https://) for VAPID identification
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Public Key -->
            <FormField v-slot="{ componentField }" name="publicKey">
              <FormItem>
                <FormLabel class="required">VAPID Public Key</FormLabel>
                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    placeholder="BNcRdreALRFXTkOOUHK5EgmsrXwgUGHoebDFOKCNXGY..."
                    rows="3"
                    class="font-mono text-xs"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
                <FormDescription>
                  Your VAPID public key (will be used in your web app's client code)
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Private Key -->
            <FormField v-slot="{ componentField }" name="privateKey">
              <FormItem>
                <FormLabel class="required">VAPID Private Key</FormLabel>
                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    placeholder="3kLs9XJ5wgLKJ5hXOp6B7c_jP2b4NaTgP2k..."
                    rows="3"
                    class="font-mono text-xs"
                    :disabled="isSubmitting || isConfiguring"
                  />
                </FormControl>
                <FormDescription>
                  Your VAPID private key (keep this secret and secure)
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Key Generation Help -->
            <Alert>
              <RefreshCw class="h-4 w-4" />
              <AlertTitle>Need VAPID Keys?</AlertTitle>
              <AlertDescription>
                If you don't have VAPID keys yet, click "Generate New Keys" above to create a new key pair automatically.
              </AlertDescription>
            </Alert>

            <!-- Security Warning -->
            <Alert>
              <AlertTriangle class="h-4 w-4" />
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                Your private key will be encrypted and securely stored. The public key will be used in your web app's client code to subscribe users to push notifications.
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

      <!-- Implementation Example -->
      <Card>
        <CardHeader>
          <CardTitle>Client Implementation</CardTitle>
          <CardDescription>Example code for your web application</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div>
              <h4 class="font-medium mb-2">Service Worker Registration</h4>
              <pre class="bg-muted p-3 rounded text-xs overflow-x-auto"><code>// Register service worker and subscribe to push
const registration = await navigator.serviceWorker.register('/sw.js');
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: '{{ app.vapidPublicKey || "YOUR_PUBLIC_KEY" }}'
});

// Send subscription to your server
await fetch('/api/v1/devices/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
      auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
    }
  })
});</code></pre>
            </div>
          </div>
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
              href="https://developer.mozilla.org/en-US/docs/Web/API/Push_API"
              target="_blank"
              class="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <FileText class="h-4 w-4" />
              <span>MDN Push API Documentation</span>
            </a>
            <a
              href="https://web.dev/push-notifications/"
              target="_blank"
              class="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <FileText class="h-4 w-4" />
              <span>Web Push Notifications Guide</span>
            </a>
            <a
              href="https://tools.ietf.org/html/rfc8292"
              target="_blank"
              class="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <FileText class="h-4 w-4" />
              <span>VAPID Specification (RFC 8292)</span>
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
