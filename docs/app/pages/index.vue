<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-background/95 backdrop-blur-sm border-b border-border/10 sticky top-0 z-50">
      <div class="container mx-auto px-6 py-4">
        <nav class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center">
              <span class="text-white font-bold text-sm">N</span>
            </div>
            <h1 class="text-xl font-semibold text-foreground">NitroPing</h1>
          </div>
          <div class="flex items-center space-x-6">
            <a href="#" class="text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
            <a href="#" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
            <Button size="sm" class="rounded-full">Deploy Now</Button>
          </div>
        </nav>
      </div>
    </header>

    <main>
      <!-- Hero Section - Founder Story -->
      <section class="pt-20 pb-16 px-6">
        <div class="container mx-auto max-w-4xl">
          <div class="text-center mb-12">
            <h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span class="bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">Your notifications.</span>
              <br>
              Your infrastructure.
              <br>
              Your control.
            </h1>
            
            <p class="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Self-hosted push notification infrastructure that works with APNs, FCM, and Web Push. 
              <strong>No vendor lock-in.</strong> <strong>Complete data ownership.</strong> <strong>Unlimited scale.</strong>
            </p>
          </div>

          <div class="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Button size="lg" class="px-8 rounded-full">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Take control
            </Button>
            <Button variant="outline" size="lg" class="px-8 rounded-full">
              Experience the power
            </Button>
          </div>

          <!-- Quick Demo -->
          <div class="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 border border-border/20">
            <div class="grid md:grid-cols-3 gap-8 items-center">
              <div class="text-center">
                <div class="w-16 h-24 mx-auto mb-4 bg-background rounded-xl shadow-sm border border-border/20 flex items-center justify-center">
                  <span class="text-2xl">📱</span>
                </div>
                <h3 class="font-medium mb-1">Your Apps</h3>
                <p class="text-sm text-muted-foreground">iOS, Android, Web</p>
              </div>
              <div class="text-center">
                <div class="text-2xl text-muted-foreground mb-2">→</div>
                <p class="text-sm text-muted-foreground">One API call</p>
              </div>
              <div class="text-center">
                <div class="w-20 h-12 mx-auto mb-4 bg-background rounded-lg shadow-sm border border-border/20 flex items-center justify-center">
                  <span class="text-xl">🚀</span>
                </div>
                <h3 class="font-medium mb-1">Instant Delivery</h3>
                <p class="text-sm text-muted-foreground">Global reach</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <!-- Solution Section -->
      <section class="py-16 px-6">
        <div class="container mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold mb-4">Own your notification infrastructure.</h2>
            <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
              Direct connections to Apple APNs, Google FCM, and Web Push APIs. No middleman. Just performance.
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- Step 1 -->
            <div class="text-center">
              <div class="w-16 h-16 bg-slate-700 dark:bg-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl">⚡</span>
              </div>
              <h3 class="text-lg font-semibold mb-3">Deploy with confidence</h3>
              <p class="text-muted-foreground">
                Any cloud. Any region. Any scale. Docker-compose up and you're live in 3 minutes.
              </p>
            </div>

            <div class="text-center">
              <div class="w-16 h-16 bg-slate-700 dark:bg-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl">🔧</span>
              </div>
              <h3 class="text-lg font-semibold mb-3">Migrate without pain</h3>
              <p class="text-muted-foreground">
                Keep your existing FCM tokens. Same device registrations. Zero user impact.
              </p>
            </div>

            <div class="text-center">
              <div class="w-16 h-16 bg-slate-700 dark:bg-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl">🚀</span>
              </div>
              <h3 class="text-lg font-semibold mb-3">Scale without fear</h3>
              <p class="text-muted-foreground">
                10 million notifications? Same cost as 10. Your server. Your rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Code Example -->
      <section class="py-16 px-6 bg-muted/30">
        <div class="container mx-auto max-w-4xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold mb-4">Simplicity meets power.</h2>
            <p class="text-lg text-muted-foreground">
              One call. Every platform. Instant delivery.
            </p>
          </div>

          <div class="bg-background rounded-2xl p-8 border border-border/20 shadow-sm">
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div class="w-3 h-3 rounded-full bg-green-400"></div>
                <span class="text-sm text-muted-foreground ml-2">Send notification to all platforms</span>
              </div>
            </div>
            
            <div class="font-mono text-sm">
              <div class="text-muted-foreground mb-2">// Single API call reaches iOS, Android, and Web</div>
              <div class="text-foreground">
                <span class="text-blue-500">POST</span> <span class="text-green-500">https://your-server.com/api/notifications</span>
              </div>
              <div class="mt-4 text-foreground">
                {<br>
                &nbsp;&nbsp;<span class="text-orange-500">"to"</span>: <span class="text-green-500">"user123"</span>,<br>
                &nbsp;&nbsp;<span class="text-orange-500">"title"</span>: <span class="text-green-500">"Order shipped!"</span>,<br>
                &nbsp;&nbsp;<span class="text-orange-500">"body"</span>: <span class="text-green-500">"Your package is on the way"</span>,<br>
                &nbsp;&nbsp;<span class="text-orange-500">"platforms"</span>: [<span class="text-green-500">"ios"</span>, <span class="text-green-500">"android"</span>, <span class="text-green-500">"web"</span>]<br>
                }
              </div>
            </div>
          </div>

          <div class="mt-8 text-center">
            <p class="text-muted-foreground mb-4">
              <strong>That's the entire API.</strong> NitroPing transforms complexity into clarity.
            </p>
            <Button class="rounded-full">
              Master the API
            </Button>
          </div>
        </div>
      </section>

      <!-- Platform Setup -->
      <section class="py-16 px-6">
        <div class="container mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold mb-4">Native power. Coming soon.</h2>
            <p class="text-lg text-muted-foreground">
              SDKs designed for perfection. Built for performance.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-8">
            <!-- iOS -->
            <Card class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                  <span class="text-xl">🍎</span>
                </div>
                <h3 class="text-xl font-semibold">iOS Swift</h3>
              </div>
              
              <div class="bg-muted/50 rounded-lg p-4 font-mono text-sm mb-4">
                <code>
                  import NitroPing<br><br>
                  NitroPing.configure(<br>
                  &nbsp;&nbsp;serverURL: "https://your-server.com"<br>
                  )<br><br>
                  // Register device<br>
                  NitroPing.register(deviceToken)
                </code>
              </div>
              
              <p class="text-sm text-muted-foreground">
                Available via CocoaPods, Swift Package Manager, and direct download.
              </p>
            </Card>

            <!-- Android -->
            <Card class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                  <span class="text-xl">🤖</span>
                </div>
                <h3 class="text-xl font-semibold">Android Kotlin</h3>
              </div>
              
              <div class="bg-muted/50 rounded-lg p-4 font-mono text-sm mb-4">
                <code>
                  import com.nitroping.sdk<br><br>
                  NitroPing.init(<br>
                  &nbsp;&nbsp;serverUrl = "https://your-server.com"<br>
                  )<br><br>
                  // Register device<br>
                  NitroPing.register(fcmToken)
                </code>
              </div>
              
              <p class="text-sm text-muted-foreground">
                Available via Maven Central and direct download.
              </p>
            </Card>
          </div>

          <div class="mt-8 text-center">
            <Card class="p-6 max-w-md mx-auto">
              <div class="w-12 h-12 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span class="text-xl">💻</span>
              </div>
              <h3 class="text-lg font-semibold mb-2">Web JavaScript</h3>
              <div class="bg-muted/50 rounded-lg p-3 font-mono text-sm mb-3">
                <code>
                  npm install nitroping-web<br>
                  // Register for push notifications
                </code>
              </div>
              <p class="text-sm text-muted-foreground">
                Works with any web framework or vanilla JavaScript.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <!-- Why Choose -->
      <section class="py-16 px-6 bg-muted/30">
        <div class="container mx-auto max-w-4xl">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold mb-4">Choose power. Choose freedom.</h2>
            <p class="text-lg text-muted-foreground">
              For developers who refuse to compromise.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-background rounded-xl p-6 border border-border/20">
              <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                <span class="text-xl">💰</span>
                Costs that make sense
              </h3>
              <p class="text-muted-foreground">
$5/month server cost. Send 10 million notifications. Or 100 million. Same price.
              </p>
            </div>

            <div class="bg-background rounded-xl p-6 border border-border/20">
              <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                <span class="text-xl">🔒</span>
                True data ownership
              </h3>
              <p class="text-muted-foreground">
                Notifications never touch Google's servers. Your users' data never leaves your infrastructure.
              </p>
            </div>

            <div class="bg-background rounded-xl p-6 border border-border/20">
              <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                <span class="text-xl">⚡</span>
                Uncompromising speed
              </h3>
              <p class="text-muted-foreground">
                Direct. Immediate. Powerful. Zero latency between you and your users.
              </p>
            </div>

            <div class="bg-background rounded-xl p-6 border border-border/20">
              <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                <span class="text-xl">🔓</span>
                Infinite possibility
              </h3>
              <p class="text-muted-foreground">
                Open source. Open future. Modify everything. Own everything.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-20 px-6">
        <div class="container mx-auto text-center max-w-3xl">
          <h2 class="text-3xl md:text-4xl font-bold mb-6">
            Ready to own your infrastructure?
          </h2>
          <p class="text-lg text-muted-foreground mb-8">
            Stop paying per notification. Stop sending data to strangers. Start controlling your destiny.
            <br>
            <strong>Open source. Self-hosted. Unlimited possibilities.</strong>
          </p>

          <div class="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button size="lg" class="px-8 rounded-full">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Claim your power
            </Button>
            <Button variant="outline" size="lg" class="px-8 rounded-full">
              Master deployment
            </Button>
          </div>

          <p class="text-sm text-muted-foreground">
            Questions? Join our Discord community or check the documentation.
          </p>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border/10 py-12 px-6">
      <div class="container mx-auto max-w-6xl">
        <div class="grid md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                <span class="text-white font-bold text-xs">N</span>
              </div>
              <span class="font-semibold">NitroPing</span>
            </div>
            <p class="text-sm text-muted-foreground">
              Open source push notification infrastructure that you own and control.
            </p>
          </div>
          
          <div>
            <h4 class="font-medium mb-3">Product</h4>
            <div class="space-y-2">
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">Documentation</a>
            </div>
          </div>
          
          <div>
            <h4 class="font-medium mb-3">Community</h4>
            <div class="space-y-2">
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">GitHub</a>
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">Discord</a>
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">Discussions</a>
            </div>
          </div>
          
          <div>
            <h4 class="font-medium mb-3">Resources</h4>
            <div class="space-y-2">
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">Examples</a>
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">Tutorials</a>
              <a href="#" class="block text-sm text-muted-foreground hover:text-foreground">Blog</a>
            </div>
          </div>
        </div>
        
        <div class="border-t border-border/10 mt-8 pt-6 text-center">
          <p class="text-sm text-muted-foreground">
            © 2024 NitroPing. Released under MIT License.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

useHead({
  title: 'NitroPing - Own Your Push Notifications',
  meta: [
    { name: 'description', content: 'Open-source, self-hosted push notification infrastructure. No vendor lock-in, complete data control, and costs a fraction of alternatives.' }
  ]
})
</script>