<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b border-border">
      <div class="container mx-auto px-4 py-4">
        <nav class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <h1 class="text-2xl font-bold text-foreground">NitroPing</h1>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <div class="flex items-center space-x-4">
            <Button variant="ghost" size="sm">Documentation</Button>
            <Button variant="ghost" size="sm">API</Button>
            <Button size="sm">Get Started</Button>
          </div>
        </nav>
      </div>
    </header>

    <main>
      <!-- Hero Section -->
      <section class="py-20 px-4">
        <div class="container mx-auto text-center">
          <h1 class="text-5xl font-bold text-foreground mb-6">
            Powerful Push Notifications
            <br>
            <span class="text-muted-foreground">Made Simple</span>
          </h1>
          <p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            NitroPing delivers fast, reliable push notifications across iOS, Android, and Web platforms. 
            Get started in minutes with our developer-friendly API.
          </p>
          <div class="flex justify-center space-x-4">
            <Button size="lg" class="px-8">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" class="px-8">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-20 px-4 bg-muted/50">
        <div class="container mx-auto">
          <h2 class="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose NitroPing?
          </h2>
          <div class="grid md:grid-cols-3 gap-8">
            <Card class="p-6">
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-foreground mb-2">Lightning Fast</h3>
              <p class="text-muted-foreground">
                Deliver notifications instantly with our optimized infrastructure and global CDN.
              </p>
            </Card>

            <Card class="p-6">
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-foreground mb-2">Secure & Reliable</h3>
              <p class="text-muted-foreground">
                End-to-end encryption and 99.9% uptime guarantee for your critical notifications.
              </p>
            </Card>

            <Card class="p-6">
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-foreground mb-2">Easy Integration</h3>
              <p class="text-muted-foreground">
                Simple REST API and SDKs for iOS, Android, and Web. Get up and running in minutes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <!-- Platform Support -->
      <section class="py-20 px-4">
        <div class="container mx-auto text-center">
          <h2 class="text-3xl font-bold text-foreground mb-4">
            Cross-Platform Support
          </h2>
          <p class="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Reach your users wherever they are with native support for all major platforms.
          </p>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="flex flex-col items-center">
              <div class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-foreground mb-2">iOS</h3>
              <p class="text-muted-foreground text-sm">Native APNs integration with rich notifications</p>
            </div>

            <div class="flex flex-col items-center">
              <div class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-5.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-5.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997M5.8 18.0894c0-.775.6287-1.4037 1.4037-1.4037s1.4037.6287 1.4037 1.4037S7.9787 19.4931 7.2037 19.4931 5.8 18.8644 5.8 18.0894m2.9112-2.9112c0-.775.6287-1.4037 1.4037-1.4037s1.4037.6287 1.4037 1.4037-.6287 1.4037-1.4037 1.4037-1.4037-.6287-1.4037-1.4037m2.9112-2.9112c0-.775.6287-1.4037 1.4037-1.4037s1.4037.6287 1.4037 1.4037-.6287 1.4037-1.4037 1.4037-1.4037-.6287-1.4037-1.4037"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-foreground mb-2">Android</h3>
              <p class="text-muted-foreground text-sm">Firebase Cloud Messaging with custom actions</p>
            </div>

            <div class="flex flex-col items-center">
              <div class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-foreground mb-2">Web</h3>
              <p class="text-muted-foreground text-sm">Web Push API for desktop and mobile browsers</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Getting Started -->
      <section class="py-20 px-4 bg-muted/50">
        <div class="container mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-foreground mb-4">
              Get Started in Minutes
            </h2>
            <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start sending notifications with just a few lines of code.
            </p>
          </div>
          
          <div class="max-w-4xl mx-auto">
            <Card class="p-6">
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-foreground mb-2">1. Install the SDK</h3>
                <div class="bg-muted rounded-lg p-4 font-mono text-sm">
                  <code>npm install @nitroping/client</code>
                </div>
              </div>

              <div class="mb-4">
                <h3 class="text-lg font-semibold text-foreground mb-2">2. Initialize the client</h3>
                <div class="bg-muted rounded-lg p-4 font-mono text-sm">
                  <code class="text-muted-foreground">
                    import { NitroPing } from '@nitroping/client';<br><br>
                    const nitroping = new NitroPing({<br>
                    &nbsp;&nbsp;apiKey: 'your-api-key'<br>
                    });
                  </code>
                </div>
              </div>

              <div>
                <h3 class="text-lg font-semibold text-foreground mb-2">3. Send your first notification</h3>
                <div class="bg-muted rounded-lg p-4 font-mono text-sm">
                  <code class="text-muted-foreground">
                    await nitroping.send({<br>
                    &nbsp;&nbsp;to: 'device-token',<br>
                    &nbsp;&nbsp;title: 'Hello from NitroPing!',<br>
                    &nbsp;&nbsp;body: 'Your notification is working!'<br>
                    });
                  </code>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-20 px-4">
        <div class="container mx-auto text-center">
          <h2 class="text-3xl font-bold text-foreground mb-4">
            Ready to Start?
          </h2>
          <p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who trust NitroPing for their notification needs.
          </p>
          <Button size="lg" class="px-8">
            Create Free Account
          </Button>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border py-8 px-4">
      <div class="container mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <h3 class="text-lg font-semibold text-foreground">NitroPing</h3>
            <p class="text-sm text-muted-foreground">Push notifications made simple.</p>
          </div>
          <div class="flex space-x-6">
            <a href="#" class="text-sm text-muted-foreground hover:text-foreground">Documentation</a>
            <a href="#" class="text-sm text-muted-foreground hover:text-foreground">API Reference</a>
            <a href="#" class="text-sm text-muted-foreground hover:text-foreground">Support</a>
            <a href="#" class="text-sm text-muted-foreground hover:text-foreground">Status</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

useHead({
  title: 'NitroPing - Push Notifications Made Simple',
  meta: [
    { name: 'description', content: 'Fast, reliable push notifications for iOS, Android, and Web. Get started in minutes with our developer-friendly API.' }
  ]
})
</script>