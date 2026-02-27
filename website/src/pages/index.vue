<script setup lang="ts">
import { Icon } from '@iconify/vue'

document.title = 'NitroPing — Bring reliability to your notifications'
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-semibold text-sm">N</span>
            </div>
            <span class="text-xl font-semibold text-gray-900">NitroPing</span>
          </div>
          <nav class="hidden md:flex items-center space-x-8">
            <RouterLink to="/docs/getting-started" class="text-gray-600 hover:text-gray-900 font-medium">
              Docs
            </RouterLink>
          </nav>
          <div class="flex items-center space-x-6">
            <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
              <Icon icon="lucide:github" :width="16" class="mr-2" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero Section -->
      <section class="pt-16 pb-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Notifications.<br>
              <span class="text-gray-600">Beautifully simple.</span>
            </h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              The most powerful notification infrastructure. In your hands. Under your control.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <Icon icon="lucide:github" :width="20" class="mr-3" />
                View on GitHub
              </a>
              <RouterLink to="/docs/getting-started" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <Icon icon="lucide:book-open" :width="20" class="mr-3" />
                Read the docs
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Built for developers -->
      <section class="py-24 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold text-gray-900 mb-4">
              Built for developers,<br>
              <span class="text-gray-600">not just the process around them.</span>
            </h2>
          </div>

          <div class="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div class="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon="lucide:zap" :width="20" class="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Easy to use from day one.</h3>
              <p class="text-gray-600">Simple by design. Powerful by nature.</p>
            </div>

            <div>
              <div class="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon="lucide:users" :width="20" class="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Designed to bring teams together.</h3>
              <p class="text-gray-600">Your vision. Our foundation.</p>
            </div>

            <div>
              <div class="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon="lucide:trending-up" :width="20" class="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Made to grow with your company.</h3>
              <p class="text-gray-600">From startup to enterprise. Seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Multi-channel -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <span class="text-blue-600 font-semibold text-sm uppercase tracking-wide">Multi-channel</span>
            <h2 class="text-4xl font-bold text-gray-900 mt-2 mb-4">
              All the basics,<br>
              <span class="text-gray-600">done beautifully.</span>
            </h2>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="channel in [
              { icon: 'lucide:mail', name: 'Email', desc: 'SMTP / Resend' },
              { icon: 'lucide:send', name: 'Telegram', desc: 'Bot API' },
              { icon: 'lucide:message-square', name: 'Discord', desc: 'Webhooks' },
              { icon: 'lucide:smartphone', name: 'SMS', desc: 'Twilio' },
              { icon: 'lucide:bell', name: 'Push', desc: 'APNS / FCM / WebPush' },
              { icon: 'lucide:inbox', name: 'In-App', desc: 'SDK inbox' },
            ]" :key="channel.name" class="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
              <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <Icon :icon="channel.icon" :width="20" class="text-white" />
              </div>
              <div>
                <div class="font-semibold text-gray-900">{{ channel.name }}</div>
                <div class="text-sm text-gray-500">{{ channel.desc }}</div>
              </div>
            </div>
          </div>

          <div class="mt-10 text-center">
            <RouterLink to="/docs/channels" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200">
              <Icon icon="lucide:book-open" :width="18" class="mr-2" />
              Channel docs
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Open source CTA -->
      <section class="py-24 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">
            Think different.<br>
            <span class="text-gray-600">Build different.</span>
          </h2>
          <p class="text-xl text-gray-600 mb-10">
            Self-hosted. Open source. No vendor lock-in. Complete data control.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200">
              <Icon icon="lucide:star" :width="20" class="mr-3" />
              Star on GitHub
            </a>
            <RouterLink to="/docs/getting-started" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200">
              <Icon icon="lucide:rocket" :width="20" class="mr-3" />
              Get started
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-3 gap-8">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-semibold text-sm">N</span>
              </div>
              <span class="text-xl font-semibold text-gray-900">NitroPing</span>
            </div>
            <p class="text-gray-600 text-sm">
              Self-hosted push notification infrastructure with direct APNs, FCM, and Web Push connections.
            </p>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Documentation</h4>
            <div class="space-y-2">
              <RouterLink to="/docs/getting-started" class="block text-sm text-gray-600 hover:text-gray-900">
                Getting Started
              </RouterLink>
              <RouterLink to="/docs/channels" class="block text-sm text-gray-600 hover:text-gray-900">
                Channels
              </RouterLink>
              <RouterLink to="/docs/sdk" class="block text-sm text-gray-600 hover:text-gray-900">
                SDK & Examples
              </RouterLink>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Community</h4>
            <div class="space-y-2">
              <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="block text-sm text-gray-600 hover:text-gray-900">GitHub</a>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 mt-8 pt-6 text-center">
          <p class="text-sm text-gray-600">
            © 2024 NitroPing. Open source and self-hosted.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
