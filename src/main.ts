import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/utils/seed' // 注册 __seedData / __clearAllData 到全局

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
