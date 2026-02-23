<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Icon from '~/components/common/Icon.vue'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

// Get base URL
const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`
  }
  return 'https://your-nitroping-instance.com'
})

const activeSection = ref('getting-started')

const sections = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'authentication', title: 'Authentication' },
  { id: 'device-registration', title: 'Device Registration' },
  { id: 'sending-notifications', title: 'Sending Notifications' },
  { id: 'sdks', title: 'SDKs & Examples' },
  { id: 'errors', title: 'Error Codes' },
]

const errorCodes = [
  {
    code: '400',
    message: 'Bad Request',
    description: 'Invalid request format or missing required fields',
  },
  {
    code: '401',
    message: 'Unauthorized',
    description: 'Invalid or missing API key',
  },
  {
    code: '403',
    message: 'Forbidden',
    description: 'API key does not have required permissions',
  },
  {
    code: '404',
    message: 'Not Found',
    description: 'Resource not found or invalid endpoint',
  },
  {
    code: '429',
    message: 'Rate Limited',
    description: 'Too many requests, please slow down',
  },
  {
    code: '500',
    message: 'Server Error',
    description: 'Internal server error, please try again',
  },
]

// Handle scroll to update active section
onMounted(() => {
  if (typeof window !== 'undefined') {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            activeSection.value = section.id
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">
        API Documentation
      </h1>
      <p class="text-muted-foreground">
        Complete guide to integrating with NitroPing API
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Navigation -->
      <div class="lg:col-span-1">
        <Card class="sticky top-4">
          <CardHeader>
            <CardTitle class="text-lg">
              Contents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <nav class="space-y-2">
              <a
                v-for="section in sections" :key="section.id"
                :href="`#${section.id}`"
                class="block text-sm hover:text-primary transition-colors py-1"
                :class="activeSection === section.id ? 'text-primary font-medium' : 'text-muted-foreground'"
              >
                {{ section.title }}
              </a>
            </nav>
          </CardContent>
        </Card>
      </div>

      <!-- Content -->
      <div class="lg:col-span-3 space-y-8">
        <!-- Getting Started -->
        <section id="getting-started">
          <h2 class="text-2xl font-bold mb-4">
            Getting Started
          </h2>
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-4">
                <p>Welcome to the NitroPing API! This RESTful API allows you to send push notifications to iOS, Android, and Web devices.</p>

                <div class="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 class="font-medium mb-2">
                    Base URL
                  </h4>
                  <code class="text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    {{ baseUrl }}/api/v1
                  </code>
                </div>

                <div>
                  <h4 class="font-medium mb-2">
                    Prerequisites
                  </h4>
                  <ol class="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Create an application in the NitroPing dashboard</li>
                    <li>Configure push providers (FCM, APNs, or Web Push)</li>
                    <li>Get your API key from the app settings</li>
                    <li>Register devices with your application</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- Authentication -->
        <section id="authentication">
          <h2 class="text-2xl font-bold mb-4">
            Authentication
          </h2>
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-4">
                <p>All API requests require authentication using your application's API key.</p>

                <div>
                  <h4 class="font-medium mb-2">
                    API Key Authentication
                  </h4>
                  <p class="text-sm text-muted-foreground mb-3">
                    Include your API key in the Authorization header:
                  </p>
                  <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg">
                    <code class="text-sm">Authorization: ApiKey YOUR_API_KEY</code>
                  </div>
                </div>

                <div class="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                  <div class="flex items-start space-x-2">
                    <Icon name="lucide:alert-triangle" class="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 class="font-medium text-amber-900 dark:text-amber-100">
                        Security
                      </h4>
                      <p class="text-sm text-amber-800 dark:text-amber-200">
                        Keep your API key secure and never expose it in client-side code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- Device Registration -->
        <section id="device-registration">
          <h2 class="text-2xl font-bold mb-4">
            Device Registration
          </h2>
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-6">
                <p>Register devices to receive push notifications.</p>

                <div>
                  <div class="flex items-center space-x-2 mb-3">
                    <Badge variant="outline" class="font-mono">
                      POST
                    </Badge>
                    <code class="text-sm">/devices/register</code>
                  </div>

                  <h4 class="font-medium mb-2">
                    Request Body
                  </h4>
                  <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                    <pre class="text-sm"><code>{
  "token": "device_push_token_here",
  "platform": "android", // "ios", "android", or "web"
  "userId": "user123", // Optional
  "metadata": { // Optional
    "deviceName": "iPhone 15",
    "appVersion": "1.0.0"
  }
}</code></pre>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium mb-2">
                    Response
                  </h4>
                  <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                    <pre class="text-sm"><code>{
  "success": true,
  "data": {
    "deviceId": "uuid-here",
    "isNew": true
  },
  "message": "Device registered successfully"
}</code></pre>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium mb-2">
                    Platform-specific Tokens
                  </h4>
                  <div class="space-y-2 text-sm">
                    <div><strong>Android (FCM):</strong> Registration token from Firebase SDK</div>
                    <div><strong>iOS (APNs):</strong> Device token in hexadecimal format</div>
                    <div><strong>Web:</strong> Push subscription endpoint URL</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- Sending Notifications -->
        <section id="sending-notifications">
          <h2 class="text-2xl font-bold mb-4">
            Sending Notifications
          </h2>
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-6">
                <p>Send push notifications to registered devices.</p>

                <div>
                  <div class="flex items-center space-x-2 mb-3">
                    <Badge variant="outline" class="font-mono">
                      POST
                    </Badge>
                    <code class="text-sm">/notifications/send</code>
                  </div>

                  <h4 class="font-medium mb-2">
                    Request Body
                  </h4>
                  <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                    <pre class="text-sm"><code>{
  "title": "Hello World!",
  "body": "This is your notification message",
  "data": { // Optional custom data
    "action": "open_screen",
    "screen": "home"
  },
  "badge": 1, // Optional badge count
  "sound": "default", // Optional sound
  "clickAction": "https://example.com", // Optional URL
  "icon": "https://example.com/icon.png", // Optional
  "image": "https://example.com/image.png", // Optional

  // Targeting (optional, defaults to all devices)
  "targetDevices": ["device-id-1", "device-id-2"],
  "platforms": ["android", "ios"], // Filter by platform

  // Scheduling (optional, defaults to immediate)
  "scheduledAt": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-16T10:00:00Z"
}</code></pre>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium mb-2">
                    Response
                  </h4>
                  <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                    <pre class="text-sm"><code>{
  "success": true,
  "data": {
    "notificationId": "uuid-here",
    "totalTargets": 150,
    "totalSent": 147,
    "totalFailed": 3,
    "status": "sent"
  },
  "message": "Notification processed"
}</code></pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- SDKs and Examples -->
        <section id="sdks">
          <h2 class="text-2xl font-bold mb-4">
            SDKs & Examples
          </h2>

          <!-- JavaScript/Node.js -->
          <Card class="mb-6">
            <CardHeader>
              <CardTitle class="flex items-center space-x-2">
                <Icon name="lucide:code" class="h-5 w-5" />
                <span>JavaScript / Node.js</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                <pre class="text-sm"><code>// Install: npm install axios

const axios = require('axios');

const nitroping = axios.create({
  baseURL: '{{ baseUrl }}/api/v1',
  headers: {
    'Authorization': 'ApiKey YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// Register a device
async function registerDevice(token, platform, userId) {
  try {
    const response = await nitroping.post('/devices/register', {
      token,
      platform,
      userId
    });
    console.log('Device registered:', response.data);
  } catch (error) {
    console.error('Registration failed:', error.response.data);
  }
}

// Send notification
async function sendNotification(title, body, data = {}) {
  try {
    const response = await nitroping.post('/notifications/send', {
      title,
      body,
      data
    });
    console.log('Notification sent:', response.data);
  } catch (error) {
    console.error('Send failed:', error.response.data);
  }
}</code></pre>
              </div>
            </CardContent>
          </Card>

          <!-- Python -->
          <Card class="mb-6">
            <CardHeader>
              <CardTitle class="flex items-center space-x-2">
                <Icon name="lucide:code" class="h-5 w-5" />
                <span>Python</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                <pre class="text-sm"><code>import requests

class NitroPing:
    def __init__(self, api_key, base_url="{{ baseUrl }}/api/v1"):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'ApiKey {api_key}',
            'Content-Type': 'application/json'
        }

    def register_device(self, token, platform, user_id=None):
        data = {
            'token': token,
            'platform': platform,
            'userId': user_id
        }
        response = requests.post(
            f'{self.base_url}/devices/register',
            json=data,
            headers=self.headers
        )
        return response.json()

    def send_notification(self, title, body, **kwargs):
        data = {
            'title': title,
            'body': body,
            **kwargs
        }
        response = requests.post(
            f'{self.base_url}/notifications/send',
            json=data,
            headers=self.headers
        )
        return response.json()

# Usage
np = NitroPing('your-api-key')
result = np.send_notification('Hello', 'World!')</code></pre>
              </div>
            </CardContent>
          </Card>

          <!-- cURL -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center space-x-2">
                <Icon name="lucide:terminal" class="h-5 w-5" />
                <span>cURL</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                <pre class="text-sm"><code># Register device
curl -X POST {{ baseUrl }}/api/v1/devices/register \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "device_token_here",
    "platform": "android",
    "userId": "user123"
  }'

# Send notification
curl -X POST {{ baseUrl }}/api/v1/notifications/send \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello World!",
    "body": "This is a test notification",
    "data": {"key": "value"}
  }'</code></pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- Error Codes -->
        <section id="errors">
          <h2 class="text-2xl font-bold mb-4">
            Error Codes
          </h2>
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-4">
                <p>All errors return a JSON response with the following format:</p>

                <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                  <pre class="text-sm"><code>{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}</code></pre>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="error in errorCodes" :key="error.code" class="border rounded-lg p-4">
                    <div class="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">
                        {{ error.code }}
                      </Badge>
                      <span class="font-medium">{{ error.message }}</span>
                    </div>
                    <p class="text-sm text-muted-foreground">
                      {{ error.description }}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  </div>
</template>
