<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { List, Goal, Footprints } from 'lucide-vue-next'

const props = defineProps(['league'])
const emit = defineEmits(['navigate'])

const teams = ref([])
const scorers = ref([])
const assists = ref([])
const API_BASE = 'http://localhost:5000/api'

const fetchData = async () => {
  if(!props.league) return
  const [tRes, sRes, aRes] = await Promise.all([
    axios.get(`${API_BASE}/teams/${props.league.id}`),
    axios.get(`${API_BASE}/rankings/${props.league.id}/goals`),
    axios.get(`${API_BASE}/rankings/${props.league.id}/assists`)
  ])
  teams.value = tRes.data
  scorers.value = sRes.data.slice(0, 5)
  assists.value = aRes.data.slice(0, 5)
}

onMounted(fetchData)
watch(() => props.league, fetchData)
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="p-10 rounded-[2.5rem] bg-white border shadow-xl shadow-indigo-100/50 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div class="relative z-10 flex justify-between items-end">
        <div>
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-white rounded-2xl shadow-sm p-3 flex items-center justify-center border border-slate-100">
              <img :src="league.logo" class="w-full h-full object-contain">
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 bg-indigo-50 text-indigo-600 border-indigo-100">{{ league.name }}</span>
          </div>
          <h1 class="text-5xl font-black tracking-tighter text-slate-900 mb-2">{{ league.fullName }}</h1>
          <p class="text-lg text-slate-500 font-medium">2025-2026 赛季</p>
        </div>
        <div class="flex gap-6 text-center">
          <div class="px-8 py-4 bg-slate-50 rounded-3xl border border-slate-100">
            <div class="text-3xl font-black text-slate-900">{{ teams.length }}</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Teams</div>
          </div>
          <div class="px-8 py-4 bg-slate-50 rounded-3xl border border-slate-100">
            <div class="text-3xl font-black text-slate-900">{{ teams.length * (teams.length - 1) }}</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Matches</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="col-span-2">
        <div class="bg-white rounded-3xl border shadow-sm overflow-hidden h-full flex flex-col">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 class="font-bold text-xl flex gap-3 items-center"><List class="text-indigo-500"/> 实时积分榜</h3>
            <button @click="emit('navigate', 'full_ranking', null, 'standings')" class="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">查看完整榜单</button>
          </div>
          <div class="flex-1">
            <table class="w-full text-sm text-left">
              <thead class="bg-white text-xs uppercase text-slate-400 font-bold">
                <tr>
                  <th class="px-6 py-4">Rank</th>
                  <th class="px-6 py-4">Team</th>
                  <th class="px-6 py-4">P</th>
                  <th class="px-6 py-4">W/D/L</th>
                  <th class="px-6 py-4">GD</th>
                  <th class="px-6 py-4">Pts</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="t in teams.slice(0, 12)" :key="t.id" @click="emit('navigate', 'team_detail', t)" class="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td class="px-6 py-5 text-center">
                    <span :class="['w-8 h-8 flex items-center justify-center rounded-lg font-bold', t.stats.rank <= 4 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 bg-gray-100']">{{ t.stats.rank }}</span>
                  </td>
                  <td class="px-6 py-5 flex gap-4 items-center">
                    <img :src="t.logo" class="w-10 h-10 object-contain">
                    <span class="font-bold text-base">{{ t.name }}</span>
                  </td>
                  <td class="px-6 py-5 font-medium text-gray-500">{{ t.stats.played }}</td>
                  <td class="px-6 py-5 font-medium"><span class="text-green-600">{{ t.stats.won }}</span> / <span class="text-gray-400">{{ t.stats.draw }}</span> / <span class="text-red-500">{{ t.stats.lost }}</span></td>
                  <td class="px-6 py-5 font-mono text-xs bg-gray-50 rounded px-2 py-1 w-fit">{{ t.stats.gf }}:{{ t.stats.ga }}</td>
                  <td class="px-6 py-5 font-black text-xl text-indigo-600">{{ t.stats.pts }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-span-1 space-y-8">
        <div v-for="(list, idx) in [{title:'射手榜', data:scorers, type:'goals', icon:Goal, color:'blue'}, {title:'助攻榜', data:assists, type:'assists', icon:Footprints, color:'green'}]" :key="idx" class="bg-white p-6 rounded-3xl border shadow-sm">
          <div class="flex justify-between mb-6 items-center">
            <h3 class="font-bold text-lg flex gap-2 items-center">
              <component :is="list.icon" :class="`text-${list.color}-500`" /> {{ list.title }}
            </h3>
            <button @click="emit('navigate', 'full_ranking', null, list.type)" :class="`text-xs font-bold text-${list.color}-600 bg-${list.color}-50 px-3 py-1.5 rounded-lg hover:bg-${list.color}-100 transition-colors`">查看详情</button>
          </div>
          <div class="space-y-4">
            <div v-for="(p, i) in list.data" :key="i" @click="emit('navigate', 'player_detail', {person_id: p.id})" class="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all group">
              <div :class="['w-6 text-center font-black text-sm', i === 0 ? `text-${list.color}-500 text-lg` : 'text-gray-300']">{{ p.rank }}</div>
              <img :src="p.avatar" class="w-12 h-12 rounded-full bg-gray-100 object-cover ring-2 ring-white group-hover:ring-indigo-100 transition-all">
              <div class="flex-1 min-w-0">
                <div class="font-bold text-slate-700 truncate">{{ p.name }}</div>
                <div class="text-xs font-medium text-gray-400 truncate">{{ p.team }}</div>
              </div>
              <div :class="`font-black text-xl text-${list.color}-600`">{{ p.count }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>