<script setup lang="ts">
import { Icon } from '@iconify/vue'

document.title = 'NitroPing - Bring reliability to your notifications'
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
            <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Product</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Resources</a>
          </nav>
          <div class="flex items-center space-x-6">
            <span class="text-gray-400 font-medium">Sign in (Coming soon)</span>
            <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
              <Icon icon="lucide:github" width="16" class="mr-2" />
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
                <Icon icon="lucide:github" width="20" class="mr-3" />
                View on GitHub
              </a>
              <a href="#" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <Icon icon="lucide:play" width="20" class="mr-3" />
                Try for free
              </a>
            </div>

            <!-- Product Screenshot with Gradient Frame -->
            <div class="relative max-w-6xl mx-auto">
              <div class="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-3xl shadow-2xl">
                <img
                  src="/img/dashboard.jpg"
                  alt="NitroPing Dashboard"
                  class="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Built for developers Section -->
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
                <Icon icon="lucide:zap" width="20" class="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Easy to use from day one.</h3>
              <p class="text-gray-600">Simple by design. Powerful by nature.</p>
            </div>

            <div>
              <div class="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon="lucide:users" width="20" class="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Designed to bring teams together.</h3>
              <p class="text-gray-600">Your vision. Our foundation.</p>
            </div>

            <div>
              <div class="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon="lucide:trending-up" width="20" class="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Made to grow with your company.</h3>
              <p class="text-gray-600">From startup to enterprise. Seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Everything. Section -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-2 gap-16 items-start mb-16">
            <div>
              <div class="mb-6">
                <span class="text-blue-600 font-semibold text-sm uppercase tracking-wide">Push notifications</span>
              </div>

              <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                All the basics,<br>
                done beautifully.
              </h2>

              <p class="text-xl text-gray-600 mb-8 leading-relaxed">
                From device management to analytics, NitroPing takes care of the everyday
                notification stuff without feeling like work. It's everything your team needs
                to stay connected with users — without the usual friction.
              </p>

              <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 mb-8 shadow-sm hover:shadow-md">
                Learn more
              </a>

              <div class="grid grid-cols-2 gap-x-8 gap-y-8">
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:smartphone" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Cross-platform notifications</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:shield-check" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Self-hosted security</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:zap" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Lightning-fast delivery</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:bar-chart-3" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Real-time analytics</h3>
                </div>
              </div>
            </div>
          </div>

          <div class="relative max-w-5xl mx-auto">
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-3xl">
              <img
                src="/img/providers.jpg"
                alt="NitroPing Providers"
                class="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- SDKs Section -->
      <section class="py-24 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-2 gap-16 items-start mb-16">
            <div>
              <div class="mb-6">
                <span class="text-blue-600 font-semibold text-sm uppercase tracking-wide">Native SDKs</span>
              </div>

              <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                iOS and Android.<br>
                <span class="text-gray-600">Made simple.</span>
              </h2>

              <p class="text-xl text-gray-600 mb-8 leading-relaxed">
                Native SDKs designed with the same attention to detail as our infrastructure.
                Beautiful APIs that feel natural on every platform.
              </p>

              <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 mb-8 shadow-sm hover:shadow-md">
                <Icon icon="lucide:book-open" width="20" class="mr-3" />
                View documentation
              </a>

              <div class="grid grid-cols-2 gap-x-8 gap-y-8">
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:code" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Clean APIs</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:package" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Easy installation</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:download" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Zero dependencies</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:rocket" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Production ready</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- Code Showcase -->
          <div class="relative max-w-5xl mx-auto mb-12">
            <div class="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-3xl">
              <div class="bg-white rounded-2xl p-8 text-center">
                <div class="mb-6">
                  <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                    <Icon icon="lucide:zap" width="16" />
                    Cross-Platform
                  </div>
                  <h3 class="text-3xl font-bold text-gray-900 mb-3">
                    One line. <span class="text-green-600">Two platforms.</span>
                  </h3>
                  <p class="text-lg text-gray-600">Native SDKs for iOS and Android. Same simplicity, native performance.</p>
                </div>

                <div class="bg-white/90 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto font-mono text-xl">
                  <div class="text-green-600 mb-4">// Just one line to get started</div>
                  <div class="text-gray-800">
                    <span class="text-purple-600 font-semibold">NitroPing</span>.<span class="text-blue-600 font-semibold">register</span>(<span class="text-green-600">"your-device-token"</span>)
                  </div>
                </div>

                <div class="flex items-center justify-center gap-8 mt-8">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Icon icon="lucide:smartphone" width="20" class="text-white" />
                    </div>
                    <span class="text-gray-700 font-medium">Swift</span>
                  </div>
                  <div class="w-px h-6 bg-gray-400" />
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Icon icon="lucide:code" width="20" class="text-white" />
                    </div>
                    <span class="text-gray-700 font-medium">Kotlin</span>
                  </div>
                  <div class="w-px h-6 bg-gray-400" />
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Icon icon="lucide:globe" width="20" class="text-white" />
                    </div>
                    <span class="text-gray-700 font-medium">Web</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Roadmap -->
          <div class="bg-gray-50 rounded-2xl p-8 mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-6 text-center">🚀 Coming Soon</h3>
            <div class="grid md:grid-cols-3 gap-4">
              <div class="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Icon icon="lucide:clock" width="20" class="text-orange-500" />
                <span class="font-medium text-gray-700">React Native SDK</span>
              </div>
              <div class="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Icon icon="lucide:clock" width="20" class="text-orange-500" />
                <span class="font-medium text-gray-700">Flutter SDK</span>
              </div>
              <div class="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Icon icon="lucide:clock" width="20" class="text-orange-500" />
                <span class="font-medium text-gray-700">Unity SDK</span>
              </div>
            </div>
          </div>

          <div class="text-center">
            <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
              <Icon icon="lucide:star" width="20" class="mr-3" />
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      <!-- Final CTA Section -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-2 gap-16 items-start mb-16">
            <div>
              <div class="mb-6">
                <span class="text-blue-600 font-semibold text-sm uppercase tracking-wide">The future</span>
              </div>

              <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Think different.<br>
                <span class="text-gray-600">Build different.</span>
              </h2>

              <p class="text-xl text-gray-600 mb-8 leading-relaxed">
                The future of notifications is in your hands. Simple to use. Impossible to limit.
                Break free from vendor lock-in and own your infrastructure.
              </p>

              <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 mb-8 shadow-sm hover:shadow-md">
                <Icon icon="lucide:rocket" width="20" class="mr-3" />
                Get started today
              </a>

              <div class="grid grid-cols-2 gap-x-8 gap-y-8">
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:star" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Open source</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:heart" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Community driven</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:users" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Developer first</h3>
                </div>
                <div class="flex items-start space-x-4">
                  <Icon icon="lucide:trending-up" width="32" class="text-gray-800 mt-1" />
                  <h3 class="text-xl font-semibold text-gray-900">Always evolving</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Showcase -->
          <div class="relative max-w-4xl mx-auto mb-12">
            <div class="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-3xl">
              <div class="bg-white rounded-2xl p-12 text-center">
                <div class="mb-8">
                  <h3 class="text-3xl font-bold text-gray-900 mb-3">Ready to revolutionize notifications?</h3>
                  <p class="text-lg text-gray-600">Join developers building the future of communication</p>
                </div>

                <div class="flex flex-col sm:flex-row gap-6 justify-center">
                  <a href="#" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                    <Icon icon="lucide:rocket" width="20" class="mr-3" />
                    Get started free
                  </a>
                  <RouterLink to="/docs/getting-started" class="inline-flex items-center px-6 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-full font-semibold text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                    <Icon icon="lucide:book-open" width="20" class="mr-3" />
                    View documentation
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-50 border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-semibold text-sm">N</span>
              </div>
              <span class="text-xl font-semibold text-gray-900">NitroPing</span>
            </div>
            <p class="text-gray-600">
              Self-hosted push notification infrastructure with direct APNs, FCM, and Web Push connections.
            </p>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Product</h4>
            <div class="space-y-2">
              <a href="#" class="block text-gray-600 hover:text-gray-900">Features</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Pricing</a>
              <RouterLink to="/docs/getting-started" class="block text-gray-600 hover:text-gray-900">Documentation</RouterLink>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Community</h4>
            <div class="space-y-2">
              <a href="https://github.com/productdevbook/nitroping" class="block text-gray-600 hover:text-gray-900">GitHub</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Discord</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Twitter</a>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Resources</h4>
            <div class="space-y-2">
              <a href="#" class="block text-gray-600 hover:text-gray-900">Blog</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Support</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Status</a>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 mt-8 pt-6 text-center">
          <p class="text-gray-600">
            © 2024 NitroPing. Open source and self-hosted.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
