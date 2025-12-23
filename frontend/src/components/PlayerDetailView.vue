<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ArrowLeft, User, List, Flag } from 'lucide-vue-next'
import VChart from 'vue-echarts'

const props = defineProps(['player'])
const emit = defineEmits(['back'])
const API_BASE = 'http://localhost:5000/api'
const profile = ref(null)
const loading = ref(true)

onMounted(async () => {
  if (!props.player.person_id) return
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/player/${props.player.person_id}`)
    profile.value = res.data
  } catch(e) { console.error(e) }
  loading.value = false
})

const p = computed(() => profile.value || {
  name_cn: props.player.name || '加载中...',
  name_en: '', club: '-', number: '-', pos: '-', country: '-', nationality_logo: '',
  height: '-', weight: '-', age: '-', foot: '-', avatar: props.player.avatar,
  radar: [], history: [], ability_total: '-'
})

// 雷达图配置
const radarOption = computed(() => {
  if(!p.value.radar || p.value.radar.length === 0) return null
  return {
    radar: {
      indicator: p.value.radar.map(item => ({ name: item.subject, max: item.fullMark })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#64748b', fontWeight: 'bold' },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: p.value.radar.map(item => item.A),
        name: '能力',
        symbol: 'none',
        lineStyle: { width: 3, color: '#3b82f6' },
        areaStyle: { color: '#3b82f6', opacity: 0.2 }
      }]
    }]
  }
})
</script>

<template>
  <div class="h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
    <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl shrink-0 mx-1">
      <button @click="emit('back')" class="absolute top-6 left-6 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors z-10">
        <ArrowLeft class="w-5 h-5"/>
      </button>
      <div class="flex flex-col md:flex-row items-center gap-8 relative z-10 mt-4">
        <div class="relative">
          <div class="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-2xl">
            <img :src="p.avatar" class="w-full h-full rounded-full object-cover border-4 border-slate-900">
          </div>
          <div class="absolute -bottom-2 -right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold border-4 border-slate-900 shadow-lg">{{ p.ability_total || '-' }}</div>
        </div>
        <div class="text-center md:text-left">
          <h1 class="text-4xl font-bold tracking-tight">{{ p.name_cn }}</h1>
          <p class="text-slate-400 text-lg font-medium mb-4">{{ p.name_en }}</p>
          <div class="flex flex-wrap justify-center md:justify-start gap-3">
            <span class="bg-white/10 border border-white/5 text-white flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold">
              <img v-if="p.nationality_logo" :src="p.nationality_logo" class="w-4 h-3 object-cover rounded-[1px]">
              {{ p.country }}
            </span>
            <span class="bg-white/10 border border-white/5 text-white px-3 py-1 rounded-lg text-xs font-bold">{{ p.club }}</span>
            <span class="bg-white/10 border border-white/5 text-white px-3 py-1 rounded-lg text-xs font-bold">{{ p.number }}</span>
            <span class="bg-white/10 border border-white/5 text-white px-3 py-1 rounded-lg text-xs font-bold">{{ p.pos }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 mt-4 space-y-6">
      <div v-if="loading && !profile" class="text-center py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100">正在同步详细档案...</div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="space-y-6 col-span-1">
          <div class="rounded-3xl border bg-white border-slate-100 p-6 shadow-sm">
            <h3 class="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-3 border-gray-100">
              <User class="text-blue-500 w-5 h-5"/> 球员详情
            </h3>
            <div class="space-y-6">
              <div>
                <div class="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-3">基础资料</div>
                <div class="space-y-2 pl-2 text-sm">
                  <div class="flex justify-between border-b border-dashed border-gray-200 pb-2"><span class="text-gray-400 font-bold text-xs">俱乐部</span><span class="font-semibold text-slate-700">{{ p.club }}</span></div>
                  <div class="flex justify-between border-b border-dashed border-gray-200 pb-2"><span class="text-gray-400 font-bold text-xs">国籍/会籍</span><div class="flex items-center gap-2"><img v-if="p.nationality_logo" :src="p.nationality_logo" class="w-5 h-3.5 object-cover rounded shadow-sm"><span class="font-semibold text-slate-700">{{ p.country }}</span></div></div>
                  <div class="flex justify-between border-b border-dashed border-gray-200 pb-2"><span class="text-gray-400 font-bold text-xs">位置</span><span class="font-semibold text-slate-700">{{ p.pos }}</span></div>
                  <div class="flex justify-between border-b border-dashed border-gray-200 pb-2"><span class="text-gray-400 font-bold text-xs">号码</span><span class="font-semibold text-slate-700">{{ p.number }}</span></div>
                  <div class="flex justify-between border-b border-dashed border-gray-200 pb-2"><span class="text-gray-400 font-bold text-xs">生日</span><span class="font-semibold text-slate-700">{{ p.birth_date || '-' }}</span></div>
                </div>
              </div>
              <div>
                <div class="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-3">身体素质</div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-slate-50 p-3 rounded-xl text-center"><div class="text-xs text-gray-400 mb-1">身高</div><div class="font-bold text-slate-800">{{ p.height }}</div></div>
                  <div class="bg-slate-50 p-3 rounded-xl text-center"><div class="text-xs text-gray-400 mb-1">体重</div><div class="font-bold text-slate-800">{{ p.weight }}</div></div>
                  <div class="bg-slate-50 p-3 rounded-xl text-center"><div class="text-xs text-gray-400 mb-1">年龄</div><div class="font-bold text-slate-800">{{ p.age }}</div></div>
                  <div class="bg-slate-50 p-3 rounded-xl text-center"><div class="text-xs text-gray-400 mb-1">惯用脚</div><div class="font-bold text-slate-800">{{ p.foot }}</div></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="radarOption" class="rounded-3xl border bg-white border-slate-100 p-4 shadow-sm flex flex-col items-center">
             <div class="text-center mb-2">
                <span class="text-sm font-medium text-gray-500">综合能力</span>
                <span class="text-3xl font-black text-orange-500 ml-2">{{ p.ability_total }}</span>
             </div>
             <div class="h-64 w-full">
               <v-chart :option="radarOption" autoresize />
             </div>
          </div>
        </div>

        <div class="col-span-1 md:col-span-2">
          <div class="rounded-3xl border bg-white border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div class="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 class="font-bold flex items-center gap-2"><List class="text-blue-500 w-5 h-5"/> 职业生涯数据</h3>
            </div>
            <div class="flex-1 overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-gray-400 uppercase bg-white sticky top-0">
                  <tr>
                    <th class="px-6 py-4">赛季</th>
                    <th class="px-6 py-4">俱乐部</th>
                    <th class="px-6 py-4 text-center">出场</th>
                    <th class="px-6 py-4 text-center">首发</th>
                    <th class="px-6 py-4 text-center">进球</th>
                    <th class="px-6 py-4 text-center">助攻</th>
                    <th class="px-6 py-4 text-center">红牌/黄牌</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(s, i) in p.history" :key="i" class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-bold">{{ s.season }}</td>
                    <td class="px-6 py-4 text-gray-500">{{ s.club }}</td>
                    <td class="px-6 py-4 text-center text-slate-600 font-medium">{{ s.matches }}</td>
                    <td class="px-6 py-4 text-center text-gray-400">{{ s.starts }}</td>
                    <td class="px-6 py-4 text-center"><span class="inline-block w-8 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">{{ s.goals }}</span></td>
                    <td class="px-6 py-4 text-center"><span class="inline-block w-8 py-1 bg-green-100 text-green-700 rounded-lg font-bold text-xs">{{ s.assists }}</span></td>
                    <td class="px-6 py-4 text-center text-xs text-gray-400">{{ s.red }}/{{ s.yellow }}</td>
                  </tr>
                  <tr v-if="p.history.length === 0"><td colspan="7" class="p-10 text-center text-gray-400">暂无历史数据</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>