<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-semibold text-sm">N</span>
            </div>
            <span class="text-xl font-semibold text-gray-900">NitroPing</span>
          </div>
          <nav class="hidden md:flex items-center space-x-8">
            <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Product</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Price</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Resources</a>
          </nav>
          <div class="flex items-center space-x-4">
            <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Sign in</a>
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
              <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer">
                <Button class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg">
                  View on GitHub
                </Button>
              </a>
              <Button variant="outline" class="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold text-lg">
                Try for free
              </Button>
            </div>

            <!-- Product Screenshot with Gradient Frame -->
            <div class="relative max-w-5xl mx-auto">
              <div class="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-3xl shadow-2xl">
                <div class="bg-white rounded-2xl p-8 shadow-inner">
                  <div class="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
                    <div class="text-center">
                      <div class="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span class="text-white text-2xl font-bold">N</span>
                      </div>
                      <h3 class="text-xl font-semibold text-gray-900 mb-2">NitroPing Dashboard</h3>
                      <p class="text-gray-600">Send notifications to millions of users</p>
                      <div class="mt-6 space-y-2">
                        <div class="bg-white rounded-lg p-3 shadow-sm border text-left">
                          <div class="flex items-center gap-3">
                            <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span class="text-sm">📱 iOS notifications sent: 1,234,567</span>
                          </div>
                        </div>
                        <div class="bg-white rounded-lg p-3 shadow-sm border text-left">
                          <div class="flex items-center gap-3">
                            <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <span class="text-sm">🤖 Android notifications sent: 987,654</span>
                          </div>
                        </div>
                        <div class="bg-white rounded-lg p-3 shadow-sm border text-left">
                          <div class="flex items-center gap-3">
                            <div class="w-3 h-3 bg-purple-400 rounded-full"></div>
                            <span class="text-sm">💻 Web notifications sent: 567,890</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
              Built for developers who think different.
            </h2>
            <p class="text-xl text-gray-600">
              Revolutionary infrastructure. Familiar simplicity.
            </p>
          </div>
          
          <div class="grid md:grid-cols-3 gap-12">
            <div class="text-center">
              <div class="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Effortlessly powerful</h3>
              <p class="text-gray-600">Simple by design. Powerful by nature.</p>
            </div>
            
            <div class="text-center">
              <div class="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Designed to inspire</h3>
              <p class="text-gray-600">Your vision. Our foundation.</p>
            </div>
            
            <div class="text-center">
              <div class="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Built to scale</h3>
              <p class="text-gray-600">From startup to enterprise. Seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Everything. Section -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <span class="text-green-600 font-semibold text-sm uppercase tracking-wide">Everything</span>
            <h2 class="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Every detail.<br>
              Thoughtfully crafted.
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              From device management to analytics, every feature is designed with obsessive attention to detail. 
              This is notification infrastructure that doesn't just work — it inspires.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-8 mb-16">
            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Device directory</h3>
              </div>
              <p class="text-gray-600 mb-6">Manage all your users' devices in one place.</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Scheduling</h3>
              </div>
              <p class="text-gray-600 mb-6">Schedule notifications at the perfect time.</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Analytics & reports</h3>
              </div>
              <p class="text-gray-600 mb-6">Track delivery rates and user engagement.</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Security & compliance</h3>
              </div>
              <p class="text-gray-600 mb-6">Enterprise-grade security for your data.</p>
            </div>
          </div>

          <!-- Code Example with Purple Gradient Frame -->
          <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-3xl shadow-2xl">
            <div class="bg-white rounded-2xl p-8">
              <div class="bg-gray-900 rounded-xl p-6 text-white font-mono text-sm">
                <div class="flex items-center gap-2 mb-4">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div class="w-3 h-3 rounded-full bg-green-400"></div>
                  <span class="text-gray-400 ml-2">Send notification</span>
                </div>
                <div>
                  <span class="text-blue-400">POST</span> <span class="text-green-400">https://your-server.com/api/notifications</span>
                  <br><br>
                  {<br>
                  &nbsp;&nbsp;<span class="text-orange-400">"to"</span>: <span class="text-green-400">"user123"</span>,<br>
                  &nbsp;&nbsp;<span class="text-orange-400">"title"</span>: <span class="text-green-400">"Your order shipped!"</span>,<br>
                  &nbsp;&nbsp;<span class="text-orange-400">"body"</span>: <span class="text-green-400">"Track your package"</span>,<br>
                  &nbsp;&nbsp;<span class="text-orange-400">"platforms"</span>: [<span class="text-green-400">"ios"</span>, <span class="text-green-400">"android"</span>, <span class="text-green-400">"web"</span>]<br>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SDKs Section -->
      <section class="py-24 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <span class="text-green-600 font-semibold text-sm uppercase tracking-wide">Native SDKs</span>
            <h2 class="text-4xl font-bold text-gray-900 mt-2 mb-4">
              iOS and Android.<br>
              <span class="text-gray-600">Made simple.</span>
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              Native SDKs designed with the same attention to detail as our infrastructure. 
              Beautiful APIs that feel natural on every platform.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-8">
            <!-- iOS SDK -->
            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <span class="text-2xl">🍎</span>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-gray-900">iOS SDK</h3>
                  <p class="text-gray-600">Swift Package Manager, CocoaPods</p>
                </div>
              </div>
              
              <div class="bg-gray-900 rounded-xl p-4 text-white font-mono text-sm mb-6">
                <div class="text-green-400 mb-2">// Swift</div>
                <div>
                  <span class="text-blue-400">import</span> <span class="text-yellow-400">NitroPing</span><br><br>
                  
                  <span class="text-purple-400">NitroPing</span>.<span class="text-blue-400">configure</span>(<br>
                  &nbsp;&nbsp;serverURL: <span class="text-green-400">"https://your-server.com"</span><br>
                  )<br><br>
                  
                  <span class="text-gray-400">// Register device</span><br>
                  <span class="text-purple-400">NitroPing</span>.<span class="text-blue-400">register</span>(deviceToken)
                </div>
              </div>
              
              <p class="text-gray-600">
                Seamless integration with APNs. Zero configuration required.
              </p>
            </div>

            <!-- Android SDK -->
            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <span class="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-gray-900">Android SDK</h3>
                  <p class="text-gray-600">Maven Central, Gradle</p>
                </div>
              </div>
              
              <div class="bg-gray-900 rounded-xl p-4 text-white font-mono text-sm mb-6">
                <div class="text-green-400 mb-2">// Kotlin</div>
                <div>
                  <span class="text-blue-400">import</span> <span class="text-yellow-400">com.nitroping.sdk.*</span><br><br>
                  
                  <span class="text-purple-400">NitroPing</span>.<span class="text-blue-400">init</span>(<br>
                  &nbsp;&nbsp;serverUrl = <span class="text-green-400">"https://your-server.com"</span><br>
                  )<br><br>
                  
                  <span class="text-gray-400">// Register device</span><br>
                  <span class="text-purple-400">NitroPing</span>.<span class="text-blue-400">register</span>(fcmToken)
                </div>
              </div>
              
              <p class="text-gray-600">
                Works perfectly with FCM. Drop-in replacement for existing solutions.
              </p>
            </div>
          </div>

          <div class="text-center mt-12">
            <p class="text-gray-600 mb-6">
              Coming soon: React Native, Flutter, and Unity SDKs
            </p>
            <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" class="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold">
                Star on GitHub for updates
              </Button>
            </a>
          </div>
        </div>
      </section>

      <!-- Final CTA Section -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-4xl font-bold text-gray-900 mb-6">
            Think different.<br>
            <span class="text-gray-600">Build different.</span>
          </h2>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The future of notifications is in your hands. Simple to use. Impossible to limit.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg">
              Experience the magic
            </Button>
            <Button variant="outline" class="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold text-lg">
              Learn more
            </Button>
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
              <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-semibold text-sm">N</span>
              </div>
              <span class="text-xl font-semibold text-gray-900">NitroPing</span>
            </div>
            <p class="text-gray-600">
              Self-hosted push notification infrastructure that you own and control.
            </p>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Product</h4>
            <div class="space-y-2">
              <a href="#" class="block text-gray-600 hover:text-gray-900">Features</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Documentation</a>
            </div>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Community</h4>
            <div class="space-y-2">
              <a href="#" class="block text-gray-600 hover:text-gray-900">GitHub</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Discord</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Discussions</a>
            </div>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Resources</h4>
            <div class="space-y-2">
              <a href="#" class="block text-gray-600 hover:text-gray-900">Examples</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Tutorials</a>
              <a href="#" class="block text-gray-600 hover:text-gray-900">Blog</a>
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

<script setup lang="ts">
import { Button } from '@/components/ui/button'

useHead({
  title: 'NitroPing - Bring reliability to your notifications',
  meta: [
    { name: 'description', content: 'Self-hosted push notification infrastructure with direct APNs, FCM, and Web Push connections. No vendor lock-in, complete data control.' }
  ]
})
</script>