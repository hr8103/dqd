<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'

const props = defineProps(['league', 'type'])
const emit = defineEmits(['navigate', 'back'])
const data = ref([])
const loading = ref(true)
const API_BASE = 'http://localhost:5000/api'

onMounted(async () => {
  let endpoint = ''
  if (props.type === 'standings') endpoint = `${API_BASE}/teams/${props.league.id}`
  else endpoint = `${API_BASE}/rankings/${props.league.id}/${props.type}`

  try {
    const res = await axios.get(endpoint)
    data.value = Array.isArray(res.data) ? res.data : []
  } catch(e) { console.error(e) }
  loading.value = false
})

const headers = props.type === 'standings'
  ? ['排名', '球队', '赛', '胜', '平', '负', '进/失', '积分']
  : ['排名', '球员', '球队', '数据']

const titleMap = { goals: '射手榜', assists: '助攻榜', standings: '积分榜' }
</script>

<template>
  <div class="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex items-center gap-4 mb-6">
      <button @click="emit('back')" class="p-2.5 rounded-full hover:bg-white hover:shadow-sm text-slate-600 transition-all"><ArrowLeft class="w-5 h-5"/></button>
      <h2 class="text-2xl font-bold tracking-tight">{{ league.fullName }} - {{ titleMap[type] }}</h2>
    </div>
    <div class="flex-1 overflow-hidden rounded-3xl border bg-white border-slate-100 shadow-sm">
      <div class="overflow-y-auto h-full">
        <div v-if="loading" class="p-10 text-center text-gray-400 flex flex-col items-center"><Loader2 class="animate-spin mb-2"/>加载中...</div>
        <table v-else class="w-full text-sm text-left">
          <thead class="text-xs uppercase font-semibold text-slate-500 bg-slate-50 sticky top-0 backdrop-blur-md z-10">
            <tr><th v-for="h in headers" :key="h" class="px-6 py-4">{{ h }}</th></tr>
          </thead>
          <tbody class="divide-y divide-dashed divide-gray-100">
            <tr v-for="(item, i) in data" :key="i" class="group hover:bg-blue-50/30 cursor-pointer transition-colors" @click="type === 'standings' ? emit('navigate', 'team_detail', item) : emit('navigate', 'player_detail', {person_id: item.id})">
              <td class="px-6 py-4"><span :class="['w-6 h-6 flex items-center justify-center rounded-lg font-bold font-mono text-xs', i < 3 ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400']">{{ item.stats?.rank || item.rank }}</span></td>
              <td class="px-6 py-4"><div class="flex items-center gap-4"><img :src="item.logo || item.avatar" class="w-10 h-10 object-contain rounded-full bg-gray-100 p-0.5"><span class="font-bold text-base">{{ item.name }}</span></div></td>
              <template v-if="type === 'standings'">
                <td class="px-6 py-4 font-medium opacity-60">{{ item.stats.played }}</td>
                <td class="px-6 py-4 text-green-600 font-bold">{{ item.stats.won }}</td>
                <td class="px-6 py-4 text-gray-400 font-medium">{{ item.stats.draw }}</td>
                <td class="px-6 py-4 text-red-500 font-medium">{{ item.stats.lost }}</td>
                <td class="px-6 py-4 font-mono text-xs bg-gray-50 rounded">{{ item.stats.gf }} : {{ item.stats.ga }}</td>
                <td class="px-6 py-4 font-bold text-lg text-blue-600">{{ item.stats.pts }}</td>
              </template>
              <template v-else>
                <td class="px-6 py-4 opacity-80 font-medium text-gray-500">{{ item.team }}</td>
                <td class="px-6 py-4 font-bold text-xl text-blue-600">{{ item.count }}</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>