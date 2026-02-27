import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./pages/index.vue'),
    },
    {
      path: '/docs',
      component: () => import('./pages/docs/layout.vue'),
      children: [
        { path: '', redirect: '/docs/getting-started' },
        {
          path: 'channels/:type',
          name: 'docs-channels-type',
          component: () => import('./pages/docs/channels/[type].vue'),
        },
        {
          path: 'self-hosting',
          children: [
            { path: '', redirect: '/docs/self-hosting/docker' },
            {
              path: ':topic',
              name: 'docs-self-hosting-topic',
              component: () => import('./pages/docs/self-hosting/[topic].vue'),
            },
          ],
        },
        {
          path: ':slug',
          name: 'docs-page',
          component: () => import('./pages/docs/[slug].vue'),
        },
      ],
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition)
      return savedPosition
    if (to.hash)
      return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
