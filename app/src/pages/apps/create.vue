<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePush } from 'notivue'
import AppPageHeader from '~/components/app/AppPageHeader.vue'
import CreateAppForm from '~/components/forms/CreateAppForm.vue'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useCreateApp } from '~/graphql'

const router = useRouter()
const push = usePush()

// API mutations
const { mutateAsync: createAppMutation, isLoading: isCreatingApp } = useCreateApp()

// Methods
async function handleSubmit(formData: any) {
  try {
    const result = await createAppMutation(formData)
    push.success({ title: 'App created successfully' })
    if (result?.id) {
      await router.push(`/apps/${result.id}`)
    }
  }
  catch (error) {
    console.error('Error creating app:', error)
    push.error({ title: 'Failed to create app', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

function goBack() {
  router.push('/apps')
}
</script>

<template>
  <div>
    <!-- App Page Header -->
    <AppPageHeader
      title="Create App"
      subtitle="Register a new application for push notifications"
      badge="Creating"
      @back="goBack"
    />

    <div class="max-w-2xl">
      <CreateAppForm
        :loading="isCreatingApp"
        @submit="handleSubmit"
        @cancel="goBack"
      />

      <!-- What's Next Card -->
      <Card class="mt-6">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p class="font-medium">
                  Configure Push Providers
                </p>
                <p class="text-sm text-muted-foreground">
                  Set up FCM, APNs, or Web Push credentials for your platforms
                </p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p class="font-medium">
                  Get API Key
                </p>
                <p class="text-sm text-muted-foreground">
                  Use the generated API key to authenticate your requests
                </p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p class="font-medium">
                  Register Devices
                </p>
                <p class="text-sm text-muted-foreground">
                  Start registering user devices to receive notifications
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
