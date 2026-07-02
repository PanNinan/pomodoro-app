import { createRouter, createWebHashHistory } from 'vue-router'
import TimerView from '@/views/TimerView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'timer',
      component: TimerView,
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TaskView.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

export default router
