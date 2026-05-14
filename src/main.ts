import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import App from './App.vue'
import i18n from './i18n'

const app = createApp(App)
app.use(i18n)
app.use(Antd)
app.mount('#app')
