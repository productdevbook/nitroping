<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '~/components/AppSidebar.vue'
import ThemeToggle from '~/components/ThemeToggle.vue'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => {
  const path = route.path
  if (path === '/')
    return 'Overview'
  if (path.startsWith('/apps'))
    return 'Applications'
  if (path.startsWith('/analytics'))
    return 'Analytics'
  if (path.startsWith('/send'))
    return 'Send Notification'
  if (path.startsWith('/devices'))
    return 'Device Testing'
  if (path.startsWith('/test-webpush'))
    return 'Web Push Test'
  if (path.startsWith('/docs')) {
    const slug = path.split('/docs/')[1] ?? ''
    const titles: Record<string, string> = {
      'getting-started': 'Getting Started',
      'authentication': 'Authentication',
      'channels': 'Channels',
      'contacts': 'Contacts',
      'workflows': 'Workflows',
      'notifications': 'Notifications',
      'sdk': 'SDK & Examples',
    }
    return titles[slug] ?? 'Documentation'
  }
  if (path.startsWith('/settings'))
    return 'Settings'
  return 'Dashboard'
})

function handleViewDocs() {
  router.push('/docs')
}
</script>

<template>
  <SidebarProvider>
    <div class="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset class="min-w-0">
        <header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div class="flex h-12 items-center px-2 lg:px-4">
            <SidebarTrigger class="mr-4" />
            <Separator orientation="vertical" class="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <span class="flex items-center gap-1">
                    <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    NitroPing
                  </span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{{ pageTitle }}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div class="flex-1" />
            <div class="flex items-center space-x-2">
              <Button variant="outline" size="sm" @click="handleViewDocs">
                API Docs
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main class="flex-1 p-4 lg:p-6 min-w-0 overflow-auto">
          <RouterView />
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
</template>
