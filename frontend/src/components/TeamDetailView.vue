<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ArrowLeft, Calendar, Users, MapPin, Globe, Phone, Mail, Trophy } from 'lucide-vue-next'

const props = defineProps(['team'])
const emit = defineEmits(['navigate', 'back'])
const squad = ref([])
const API_BASE = 'http://localhost:5000/api'

onMounted(async () => {
  const res = await axios.get(`${API_BASE}/squad/${props.team.id}`)
  squad.value = res.data
})

const info = computed(() => props.team.info || {})
const honors = computed(() => props.team.honors || [])
</script>

<template>
  <div class="h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
    <div class="relative shrink-0 mb-6">
      <div class="h-48 rounded-3xl overflow-hidden relative">
        <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div class="absolute inset-0 opacity-10" style="background-image: url('https://www.transparenttextures.com/patterns/cubes.png');"></div>
        <button @click="emit('back')" class="absolute top-6 left-6 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </button>
      </div>
      <div class="absolute -bottom-12 left-10 flex items-end gap-6">
        <div class="w-32 h-32 bg-white rounded-[2rem] p-4 shadow-xl shadow-blue-900/10 flex items-center justify-center border-4 border-white">
          <img :src="team.logo" class="w-full h-full object-contain">
        </div>
        <div class="mb-14">
          <h1 class="text-4xl font-bold text-white tracking-tight">{{ team.name }}</h1>
          <p class="text-blue-100 text-lg font-medium">{{ team.en }}</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pt-16 pb-8 px-1">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div v-for="(item, idx) in [
          {icon: Calendar, label: '成立时间', val: info.founded},
          {icon: Users, label: '球场容量', val: info.capacity},
          {icon: MapPin, label: '城市', val: info.city},
          {icon: Globe, label: '国家', val: info.country},
          {icon: Phone, label: '电话', val: info.phone},
          {icon: Mail, label: '邮箱', val: info.email},
          {icon: MapPin, label: '地址', val: info.address, full: true}
        ]" :key="idx" :class="['flex items-center gap-4 p-4 rounded-2xl border bg-white border-slate-100 transition-all hover:shadow-md', item.full ? 'md:col-span-3' : '']">
          <div class="p-3 rounded-xl bg-blue-50 text-blue-600"><component :is="item.icon" class="w-5 h-5"/></div>
          <div>
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{{ item.label }}</div>
            <div class="text-sm font-semibold">{{ item.val || '-' }}</div>
          </div>
        </div>
      </div>

      <div class="bg-yellow-50/50 p-6 rounded-[2rem] border border-yellow-100 mb-8">
        <h3 class="text-sm font-bold text-yellow-800 mb-4 uppercase tracking-wider flex items-center gap-2"><Trophy class="w-4 h-4"/> 荣誉室</h3>
        <div class="flex flex-wrap gap-3">
          <div v-if="honors.length === 0" class="text-gray-400 text-sm italic">暂无记录</div>
          <div v-else v-for="(h, i) in honors" :key="i" class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm text-sm border border-yellow-100">
            <span class="font-bold text-slate-700">{{ h.name }}</span>
            <span class="bg-yellow-400 text-white text-xs px-2 py-0.5 rounded-md font-black">{{ h.count }}</span>
          </div>
        </div>
      </div>

      <h3 class="text-lg font-bold mb-4 flex items-center gap-2"><Users class="text-blue-500 w-5 h-5"/> 球队阵容</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="p in squad" :key="p.id" @click="emit('navigate', 'player_detail', { person_id: p.id })" class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all bg-white border-slate-100 hover:shadow-md">
          <span class="font-mono text-gray-400 font-bold w-8 text-center text-lg">{{ p.number || '-' }}</span>
          <img :src="p.avatar" class="w-12 h-12 rounded-full bg-gray-100 object-cover ring-2 ring-slate-50">
          <div class="flex-1 min-w-0">
            <div class="font-bold truncate text-base">{{ p.name }}</div>
            <div class="text-xs text-gray-500 font-medium uppercase tracking-wider">{{ p.pos }}</div>
          </div>
          <div :class="['text-sm font-black px-2.5 py-1 rounded-lg', p.rating >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ p.rating }}</div>
        </div>
      </div>
    </div>
  </div>
</template>