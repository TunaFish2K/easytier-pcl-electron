import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import HostSetup from '../views/HostSetup.vue'
import JoinRoom from '../views/JoinRoom.vue'
import RoomInfo from '../views/RoomInfo.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/host',
      name: 'host',
      component: HostSetup
    },
    {
      path: '/join',
      name: 'join',
      component: JoinRoom
    },
    {
      path: '/room',
      name: 'room',
      component: RoomInfo
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    }
  ]
})

export default router
