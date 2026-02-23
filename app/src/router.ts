import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('./layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'index',
        component: () => import('./pages/index.vue'),
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () => import('./pages/analytics.vue'),
      },
      {
        path: 'send',
        name: 'send',
        component: () => import('./pages/send.vue'),
      },
      {
        path: 'devices',
        name: 'devices',
        component: () => import('./pages/devices.vue'),
      },
      {
        path: 'test-webpush',
        name: 'test-webpush',
        component: () => import('./pages/test-webpush.vue'),
      },
      {
        path: 'docs',
        name: 'docs',
        component: () => import('./pages/docs.vue'),
      },
      {
        path: 'apps',
        children: [
          {
            path: '',
            name: 'apps',
            component: () => import('./pages/apps/index.vue'),
          },
          {
            path: 'create',
            name: 'apps-create',
            component: () => import('./pages/apps/create.vue'),
          },
          {
            path: ':id',
            children: [
              {
                path: '',
                name: 'app-detail',
                component: () => import('./pages/apps/[id]/index.vue'),
              },
              {
                path: 'devices',
                name: 'app-devices',
                component: () => import('./pages/apps/[id]/devices.vue'),
              },
              {
                path: 'notifications',
                name: 'app-notifications',
                component: () => import('./pages/apps/[id]/notifications.vue'),
              },
              {
                path: 'settings',
                name: 'app-settings',
                component: () => import('./pages/apps/[id]/settings.vue'),
              },
              {
                path: 'providers',
                children: [
                  {
                    path: '',
                    name: 'app-providers',
                    component: () => import('./pages/apps/[id]/providers/index.vue'),
                  },
                  {
                    path: 'apns',
                    name: 'app-providers-apns',
                    component: () => import('./pages/apps/[id]/providers/apns.vue'),
                  },
                  {
                    path: 'fcm',
                    name: 'app-providers-fcm',
                    component: () => import('./pages/apps/[id]/providers/fcm.vue'),
                  },
                  {
                    path: 'webpush',
                    name: 'app-providers-webpush',
                    component: () => import('./pages/apps/[id]/providers/webpush.vue'),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition)
      return savedPosition
    return { top: 0 }
  },
})

export default router
