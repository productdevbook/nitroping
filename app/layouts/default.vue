<script setup lang="ts">
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from 'abckit/shadcn/breadcrumb'
import { Button } from 'abckit/shadcn/button'
import ThemeToggle from 'abckit/shadcn/button/ThemeToggle.vue'
import { Separator } from 'abckit/shadcn/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from 'abckit/shadcn/sidebar'
import { ExternalLink, Search, Zap } from 'lucide-vue-next'

const route = useRoute()

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
  if (path.startsWith('/docs'))
    return 'Documentation'
  if (path.startsWith('/settings'))
    return 'Settings'
  return 'Dashboard'
})

function handleViewDocs() {
  navigateTo('/docs')
}
</script>

<template>
  <SidebarProvider>
    <div class="flex min-h-screen w-full">
      <!-- Sidebar -->
      <AppSidebar />

      <!-- Main Content Area -->
      <SidebarInset class="min-w-0">
        <!-- Top Bar -->
        <header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div class="flex h-12 items-center px-2 lg:px-4">
            <SidebarTrigger class="mr-4" />
            <Separator orientation="vertical" class="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Zap class="h-4 w-4 mr-1" />
                  NitroPing
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{{ pageTitle }}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div class="flex-1"></div>
            <div class="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Search class="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" @click="handleViewDocs">
                <ExternalLink class="h-4 w-4 mr-2" />
                API Docs
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-4 lg:p-6 min-w-0 overflow-auto">
          <slot />
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
</template>
