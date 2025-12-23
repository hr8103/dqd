<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import {
  Trophy, Users, MapPin, ChevronRight, List,
  Goal, Footprints, LogOut, User, ArrowLeft,
  Phone, Mail, Globe, Calendar, Sun, Moon, Shield, Loader2,
  Search, ArrowRightLeft, X, Swords
} from 'lucide-vue-next'

// --- ECharts 配置 ---
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, RadarComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, RadarChart, TitleComponent, TooltipComponent, LegendComponent, RadarComponent])

const API_BASE = 'http://localhost:5000/api'
const isDark = ref(false)
const user = ref(null)
const leagues = ref([])
const activeLeague = ref(null)
const currentView = ref('dashboard')
const viewData = ref(null)
const viewType = ref('')

const teams = ref([])
const scorers = ref([])
const assists = ref([])
const squad = ref([])
const playerProfile = ref(null)
const loading = ref(false)
const fullRankingData = ref([])

const searchLoading = ref(false)
const searchTeams = ref([])
const searchResults = ref([])
const searchFilters = ref({
  name: '', league_id: '', team_id: '', position: '',
  nationality: '', foot: '', rating_min: null, rating_max: null, age_min: null, age_max: null
})

const showCompareModal = ref(false)
const compareKeyword = ref('')
const compareSearchList = ref([])
const compareTarget = ref(null)
const compareLoading = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
}

const handleLogin = () => {
  user.value = { name: 'Admin', email: 'admin@dqd.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' }
  fetchLeagues()
}

const fetchLeagues = async () => {
  try {
    const res = await axios.get(`${API_BASE}/leagues`)
    leagues.value = res.data
    if (leagues.value.length > 0) activeLeague.value = leagues.value[0]
  } catch(e) { console.error("API Error", e) }
}

const navigateTo = (view, data = null, type = '') => {
  currentView.value = view
  viewData.value = data
  if (type) viewType.value = type
}

const goBack = () => {
  currentView.value = 'dashboard'
  viewData.value = null
}

const clearSearch = () => {
  searchFilters.value = {
    name: '', league_id: '', team_id: '', position: '',
    nationality: '', foot: '', rating_min: null, rating_max: null, age_min: null, age_max: null
  }
}

const handleSearch = async () => {
  searchLoading.value = true
  currentView.value = 'search_results'
  viewData.value = null
  try {
    const res = await axios.post(`${API_BASE}/search/players`, searchFilters.value)
    searchResults.value = res.data
  } catch (e) {
    console.error("搜索失败", e)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const openCompareModal = () => {
  showCompareModal.value = true
  compareKeyword.value = ''
  compareSearchList.value = []
  compareTarget.value = null
}

const closeCompareModal = () => {
  showCompareModal.value = false
  compareTarget.value = null
}

const handleCompareSearch = async () => {
  if (!compareKeyword.value) return
  compareLoading.value = true
  try {
    const res = await axios.post(`${API_BASE}/search/players`, { name: compareKeyword.value })
    compareSearchList.value = res.data.filter(p => p.id !== playerProfile.value.id)
  } finally {
    compareLoading.value = false
  }
}

const selectComparePlayer = async (id) => {
  compareLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/player/${id}`)
    compareTarget.value = res.data
  } finally {
    compareLoading.value = false
  }
}

const getSeasonStats = (player) => {
  if (!player || !player.history || player.history.length === 0) return null
  return player.history.find(h => h.season === '25/26' || h.season === '2025-2026') || player.history[0]
}

watch(() => searchFilters.value.league_id, async (newVal) => {
  searchFilters.value.team_id = ''
  if (newVal) {
    try {
      const res = await axios.get(`${API_BASE}/teams/${newVal}`)
      searchTeams.value = res.data
    } catch (e) { console.error(e) }
  } else {
    searchTeams.value = []
  }
})

watch(activeLeague, async (newVal) => {
  if (newVal && currentView.value === 'dashboard') {
    loading.value = true
    try {
      const [t, s, a] = await Promise.all([
        axios.get(`${API_BASE}/teams/${newVal.id}`),
        axios.get(`${API_BASE}/rankings/${newVal.id}/goals`),
        axios.get(`${API_BASE}/rankings/${newVal.id}/assists`)
      ])
      teams.value = t.data
      scorers.value = s.data.slice(0, 5)
      assists.value = a.data.slice(0, 5)
    } finally { loading.value = false }
  }
}, { immediate: true })

watch([currentView, () => viewData.value], async ([view, data]) => {
  if (view === 'player_detail' && data?.person_id) {
    loading.value = true
    try {
      const res = await axios.get(`${API_BASE}/player/${data.person_id}`)
      playerProfile.value = res.data
    } finally { loading.value = false }
  }
  if (view === 'team_detail' && data?.id) {
    const res = await axios.get(`${API_BASE}/squad/${data.id}`)
    squad.value = res.data
  }
  if (view === 'full_ranking') {
    loading.value = true
    let ep = viewType.value === 'standings' ? `${API_BASE}/teams/${activeLeague.value.id}` : `${API_BASE}/rankings/${activeLeague.value.id}/${viewType.value}`
    const res = await axios.get(ep)
    fullRankingData.value = res.data
    loading.value = false
  }
})

const radarOption = computed(() => {
  const p = playerProfile.value
  if (!p || !p.radar || p.radar.length === 0) return null
  return {
    radar: {
      indicator: p.radar.map(i => ({ name: i.subject, max: 100 })),
      shape: 'polygon',
      axisName: { color: isDark.value ? '#94a3b8' : '#64748b', fontWeight: 'bold' },
      splitLine: { lineStyle: { color: isDark.value ? '#334155' : '#e2e8f0' } }
    },
    series: [{
      type: 'radar',
      data: [{ value: p.radar.map(i => i.A), name: '能力', areaStyle: { color: '#3b82f6', opacity: 0.2 }, lineStyle: { color: '#3b82f6', width: 3 } }]
    }]
  }
})

const compareRadarOption = computed(() => {
  const p1 = playerProfile.value
  const p2 = compareTarget.value
  if (!p1 || !p2 || !p1.radar || !p2.radar) return null

  return {
    tooltip: { trigger: 'item' },
    legend: {
      data: [p1.name_cn, p2.name_cn],
      textStyle: { color: isDark.value ? '#fff' : '#333', fontWeight: 'bold' },
      bottom: 0
    },
    radar: {
      indicator: p1.radar.map(i => ({ name: i.subject, max: 100 })),
      shape: 'polygon',
      axisName: { color: isDark.value ? '#94a3b8' : '#64748b', fontWeight: 'bold' },
      splitLine: { lineStyle: { color: isDark.value ? '#334155' : '#e2e8f0' } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: p1.radar.map(i => i.A),
          name: p1.name_cn,
          areaStyle: { color: '#3b82f6', opacity: 0.2 },
          lineStyle: { color: '#3b82f6', width: 3 },
          itemStyle: { color: '#3b82f6' }
        },
        {
          value: p2.radar.map(i => i.A),
          name: p2.name_cn,
          areaStyle: { color: '#ef4444', opacity: 0.2 },
          lineStyle: { color: '#ef4444', width: 3 },
          itemStyle: { color: '#ef4444' }
        }
      ]
    }]
  }
})

onMounted(() => {
  handleLogin()
})
</script>

<template>
  <div :class="['w-full h-screen flex overflow-hidden font-sans', isDark ? 'bg-slate-900 text-white' : 'bg-[#F8FAFC] text-slate-900']">

    <div v-if="!user" class="fixed inset-0 z-50 flex items-center justify-center bg-[#F2F2F7]">
      <div class="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full mx-4">
        <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6">F</div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Football Pro</h2>
        <p class="text-gray-500 mb-8">数据智能分析平台</p>
        <button @click="handleLogin" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition transform active:scale-95">进入系统</button>
      </div>
    </div>

    <aside :class="['w-72 border-r flex flex-col shrink-0 transition-colors overflow-hidden', isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200']">
      <div class="p-6">
        <div :class="['flex items-center gap-3 p-3 rounded-2xl border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100']">
          <img :src="user?.avatar" class="w-10 h-10 rounded-full border-2 border-white">
          <div class="overflow-hidden">
            <h3 class="font-bold text-sm truncate">{{ user?.name }}</h3>
            <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-thin">
        <div>
           <div class="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">联赛导航</div>
           <div class="space-y-1">
             <button
               v-for="l in leagues" :key="l.id"
               @click="activeLeague = l; currentView = 'dashboard'"
               :class="['w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition group', activeLeague?.id === l.id && currentView !== 'search_results' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800']"
             >
               <img :src="l.logo" class="w-6 h-6 object-contain" :class="{'brightness-200': activeLeague?.id === l.id}">
               <span class="font-medium text-sm">{{ l.cn }}</span>
             </button>
           </div>
        </div>

        <div>
           <div class="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
             <span>高级查询</span>
             <button @click="clearSearch" class="text-blue-500 hover:underline scale-90">重置</button>
           </div>

           <div :class="['p-4 rounded-3xl border space-y-3', isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100']">
              <input v-model="searchFilters.name" placeholder="输入球员姓名..."
                :class="['w-full px-3 py-2 rounded-xl text-xs font-bold outline-none transition-all', isDark ? 'bg-slate-700 text-white focus:bg-slate-600' : 'bg-white text-slate-700 border border-slate-200 focus:border-blue-500']">

              <select v-model="searchFilters.league_id" :class="['w-full px-3 py-2 rounded-xl text-xs font-bold outline-none appearance-none', isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200']">
                 <option value="">所有联赛</option>
                 <option v-for="l in leagues" :key="l.id" :value="l.id">{{ l.cn }}</option>
              </select>

              <select v-model="searchFilters.team_id" :disabled="!searchFilters.league_id" :class="['w-full px-3 py-2 rounded-xl text-xs font-bold outline-none appearance-none disabled:opacity-50', isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200']">
                 <option value="">{{ searchFilters.league_id ? '所有球队' : '请先选择联赛' }}</option>
                 <option v-for="t in searchTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>

              <div class="flex gap-2">
                 <select v-model="searchFilters.position" :class="['flex-1 px-3 py-2 rounded-xl text-xs font-bold outline-none appearance-none', isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200']">
                    <option value="">位置</option>
                    <option value="前锋">前锋</option>
                    <option value="中场">中场</option>
                    <option value="后卫">后卫</option>
                    <option value="门将">门将</option>
                 </select>
                 <select v-model="searchFilters.foot" :class="['flex-1 px-3 py-2 rounded-xl text-xs font-bold outline-none appearance-none', isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200']">
                    <option value="">惯用脚</option>
                    <option value="右脚">右脚</option>
                    <option value="左脚">左脚</option>
                    <option value="双脚">双脚</option>
                 </select>
              </div>

              <input v-model="searchFilters.nationality" placeholder="国籍 (如: 阿根廷)"
                :class="['w-full px-3 py-2 rounded-xl text-xs font-bold outline-none', isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200']">

              <div class="space-y-1">
                <div class="text-[10px] text-gray-400 font-bold uppercase">总评区间</div>
                <div class="flex gap-2 items-center">
                  <input type="number" v-model.number="searchFilters.rating_min" placeholder="0" class="w-full px-2 py-1.5 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-700 border-none outline-none">
                  <span class="text-gray-400">-</span>
                  <input type="number" v-model.number="searchFilters.rating_max" placeholder="99" class="w-full px-2 py-1.5 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-700 border-none outline-none">
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-[10px] text-gray-400 font-bold uppercase">年龄区间</div>
                <div class="flex gap-2 items-center">
                  <input type="number" v-model.number="searchFilters.age_min" placeholder="15" class="w-full px-2 py-1.5 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-700 border-none outline-none">
                  <span class="text-gray-400">-</span>
                  <input type="number" v-model.number="searchFilters.age_max" placeholder="45" class="w-full px-2 py-1.5 rounded-lg text-xs text-center font-bold bg-white dark:bg-slate-700 border-none outline-none">
                </div>
              </div>

              <button @click="handleSearch" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/30">
                 <Search size="16"/> 开始搜索
              </button>
           </div>
        </div>

      </div>
      <div class="p-4 border-t"><button @click="user=null" class="flex items-center gap-2 text-gray-400 text-sm hover:text-red-500 transition-colors"><LogOut size="16"/> 退出登录</button></div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden relative">
      <header :class="['h-16 border-b flex items-center justify-between px-8 shrink-0', isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200 backdrop-blur-md']">
        <div class="flex items-center gap-2 text-sm text-gray-400"><Shield size="16"/> Dashboard <ChevronRight size="14"/> {{activeLeague?.cn}}</div>
        <button @click="toggleTheme" class="p-2 rounded-full border bg-white shadow-sm hover:rotate-12 transition-transform"><Sun v-if="isDark" class="text-yellow-500"/><Moon v-else class="text-blue-500"/></button>
      </header>

      <div class="flex-1 overflow-y-auto p-8 scroll-smooth no-scrollbar">

        <div v-if="currentView === 'dashboard'" class="space-y-8 animate-in">
          <div :class="['p-10 rounded-[2.5rem] border shadow-xl relative overflow-hidden flex justify-between items-end', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100']">
            <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative z-10">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 bg-white rounded-2xl shadow-sm p-3 flex items-center justify-center border">
                  <img :src="activeLeague?.logo" class="w-full h-full object-contain">
                </div>
                <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{{activeLeague?.name}}</span>
              </div>
              <h1 class="text-5xl font-black tracking-tighter">{{activeLeague?.fullName}}</h1>
            </div>
            <div class="flex gap-4 relative z-10">
              <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl text-center min-w-[100px]"><div class="text-2xl font-black">{{teams.length}}</div><div class="text-xs text-gray-400">球队</div></div>
              <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl text-center min-w-[100px]"><div class="text-2xl font-black">{{teams.length * (teams.length - 1)}}</div><div class="text-xs text-gray-400">总场次</div></div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-8">
            <div :class="['col-span-2 rounded-3xl border shadow-sm overflow-hidden', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100']">
              <div class="p-6 border-b flex justify-between items-center bg-gray-50/30">
                <h3 class="font-bold flex items-center gap-2"><List class="text-blue-500"/> 实时积分榜</h3>
                <button @click="navigateTo('full_ranking', null, 'standings')" class="text-xs font-bold text-blue-600 hover:underline">查看详情</button>
              </div>
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-gray-400 uppercase"><tr class="border-b">
                  <th class="p-5 font-bold">排名</th><th class="p-5 font-bold">球队</th><th class="p-5 font-bold text-center">赛</th><th class="p-5 font-bold text-center">胜</th><th class="p-5 font-bold text-center">平</th><th class="p-5 font-bold text-center">负</th><th class="p-5 font-bold text-center">进/失</th><th class="p-5 font-bold text-center">积分</th>
                </tr></thead>
                <tbody class="divide-y">
                  <tr v-for="t in teams.slice(0, 12)" :key="t.id" @click="navigateTo('team_detail', t)" class="hover:bg-blue-50/50 cursor-pointer transition-colors">
                    <td class="p-5"><span :class="['w-8 h-8 flex items-center justify-center rounded-lg font-bold', t.stats.rank <= 4 ? 'bg-blue-100 text-blue-700' : 'text-gray-400']">{{t.stats.rank}}</span></td>
                    <td class="p-5 flex items-center gap-4"><img :src="t.logo" class="w-8 h-8 object-contain"> <span class="font-bold">{{t.name}}</span></td>
                    <td class="p-5 opacity-60 text-center font-medium">{{t.stats.played}}</td>
                    <td class="p-5 text-center font-bold text-green-600 bg-green-50/30 rounded-lg">{{t.stats.won}}</td>
                    <td class="p-5 text-center font-medium text-gray-400">{{t.stats.draw}}</td>
                    <td class="p-5 text-center font-medium text-red-500">{{t.stats.lost}}</td>
                    <td class="p-5 text-center font-mono text-xs text-gray-500">{{t.stats.gf}} / {{t.stats.ga}}</td>
                    <td class="p-5 font-black text-xl text-blue-600 text-center">{{t.stats.pts}}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="col-span-1 space-y-8">
               <div v-for="type in ['goals', 'assists']" :key="type" :class="['p-6 rounded-3xl border shadow-sm', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100']">
                  <div class="flex justify-between mb-6">
                    <h3 class="font-bold flex items-center gap-2">
                        <Goal v-if="type==='goals'" class="text-blue-500" size="18"/>
                        <Footprints v-else class="text-green-500" size="18"/>
                        {{type === 'goals' ? '射手榜' : '助攻榜'}}
                    </h3>
                    <button @click="navigateTo('full_ranking', null, type)" class="text-xs text-blue-600 font-bold">查看详情</button>
                  </div>
                  <div class="space-y-4">
                    <div v-for="(p, i) in (type === 'goals' ? scorers : assists)" :key="i" @click="navigateTo('player_detail', {person_id: p.id})" class="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl cursor-pointer group">
                      <div class="w-4 font-bold text-gray-300 text-xs">{{p.rank}}</div>
                      <img :src="p.avatar" class="w-10 h-10 rounded-full bg-gray-100 border-2 border-white">
                      <div class="flex-1 min-w-0"><div class="font-bold truncate text-sm">{{p.name}}</div><div class="text-xs text-gray-400">{{p.team}}</div></div>
                      <div class="font-black text-blue-600">{{p.count}}</div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div v-if="currentView === 'team_detail'" class="animate-in slide-in-from-right-4">
          <button @click="goBack" class="mb-6 flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors font-bold"><ArrowLeft size="18"/> 返回</button>
          <div class="p-12 rounded-[3rem] bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center gap-10 mb-8 shadow-2xl">
            <img :src="viewData.logo" class="w-32 h-32 p-4 bg-white rounded-[2rem] shadow-xl">
            <div><h1 class="text-5xl font-black">{{viewData.name}}</h1><p class="text-xl opacity-70 mt-1">{{viewData.en}}</p></div>
          </div>
          <div class="grid grid-cols-3 gap-6 mb-10">
             <div v-for="(val, label) in {成立:viewData.info.founded, 主场:viewData.info.stadium, 容量:viewData.info.capacity, 电话:viewData.info.phone, 邮箱:viewData.info.email, 地址:viewData.info.address}" :key="label" class="bg-white dark:bg-slate-800 p-5 rounded-2xl border shadow-sm">
                <div class="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">{{label}}</div>
                <div class="font-bold text-sm truncate">{{val || '-'}}</div>
             </div>
          </div>
          <h3 class="text-2xl font-black mb-6 flex items-center gap-3"><Users class="text-blue-500" size="24"/> 球队阵容</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="p in squad" :key="p.id" @click="navigateTo('player_detail', {person_id: p.id})" class="flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-3xl border hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
              <span class="font-mono text-gray-300 font-bold w-6 text-xl text-center">{{p.number}}</span>
              <img :src="p.avatar" class="w-12 h-12 rounded-full bg-gray-50 border shadow-sm">
              <div class="flex-1"><div class="font-black text-slate-700 dark:text-slate-200">{{p.name}}</div><div class="text-xs text-gray-400">{{p.pos}}</div></div>
              <div :class="['font-black text-lg', p.rating > 80 ? 'text-blue-600' : 'text-gray-400']">{{p.rating}}</div>
            </div>
          </div>
        </div>

        <div v-if="currentView === 'player_detail'" class="animate-in slide-in-from-right-4">
          <div class="flex justify-between items-center mb-6">
             <button @click="goBack" class="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors font-bold"><ArrowLeft size="18"/> 返回列表</button>
             <button v-if="playerProfile" @click="openCompareModal" class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                <Swords size="18"/> 球员对比
             </button>
          </div>

          <div v-if="loading && !playerProfile" class="p-20 text-center text-gray-400 flex flex-col items-center"><Loader2 class="animate-spin mb-4" size="40"/> 正在同步档案...</div>

          <template v-else-if="playerProfile">
            <div class="p-10 rounded-[3rem] bg-slate-800 text-white flex items-center gap-10 mb-8 relative overflow-hidden shadow-2xl">
               <div class="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 blur-[120px]"></div>
               <div class="relative">
                  <img :src="playerProfile.avatar" class="w-36 h-36 rounded-full border-4 border-slate-700 shadow-2xl object-cover bg-white">
                  <div class="absolute -bottom-2 -right-2 bg-blue-600 px-4 py-1.5 rounded-full text-sm font-black border-4 border-slate-800">{{playerProfile.ability_total}}</div>
               </div>
               <div class="relative z-10">
                 <h1 class="text-5xl font-black mb-4 tracking-tighter">{{playerProfile.name_cn}}</h1>
                 <div class="flex gap-3">
                    <span class="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/5">
                       {{playerProfile.country}}
                       <img v-if="playerProfile.nationality_logo" :src="playerProfile.nationality_logo" class="w-5 h-3.5 rounded-sm">
                    </span>
                    <span class="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">{{playerProfile.club}}</span>
                    <span class="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">{{playerProfile.number}}</span>
                    <span class="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">{{playerProfile.pos}}</span>
                 </div>
               </div>
            </div>

            <div class="grid grid-cols-3 gap-8">
              <div class="col-span-1 space-y-8">
                <div class="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border shadow-sm">
                   <h3 class="font-black text-lg mb-8 flex items-center gap-3"><User class="text-blue-500" size="22"/> 球员资料详情</h3>
                   <div class="space-y-8">
                      <div>
                        <div class="text-[10px] text-blue-500 font-black uppercase mb-4 tracking-widest flex items-center gap-2"><div class="w-1 h-3 bg-blue-500 rounded-full"></div> 基础资料</div>
                        <div class="space-y-4 pl-3">
                           <div v-for="(val, lab) in {俱乐部:playerProfile.club, '国籍/会籍':playerProfile.country, 位置:playerProfile.pos, 号码:playerProfile.number, 生日:playerProfile.birth_date}" :key="lab" class="flex justify-between items-center text-sm">
                              <span class="text-gray-400 font-bold text-xs uppercase">{{lab}}</span>
                              <div class="flex items-center gap-2">
                                <span class="font-bold text-slate-700 dark:text-slate-200">{{val}}</span>
                                <img v-if="lab==='国籍/会籍' && playerProfile.nationality_logo" :src="playerProfile.nationality_logo" class="w-5 h-3.5 rounded shadow-sm">
                              </div>
                           </div>
                        </div>
                      </div>
                      <div>
                        <div class="text-[10px] text-blue-500 font-black uppercase mb-4 tracking-widest flex items-center gap-2"><div class="w-1 h-3 bg-blue-500 rounded-full"></div> 身体素质</div>
                        <div class="grid grid-cols-2 gap-4">
                           <div v-for="(v, l) in {身高:playerProfile.height, 体重:playerProfile.weight, 年龄:playerProfile.age, 惯用脚:playerProfile.foot}" :key="l" class="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl text-center">
                              <div class="text-[10px] text-gray-400 mb-1 font-bold">{{l}}</div>
                              <div class="font-black text-base">{{v}}</div>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
                <div v-if="radarOption" class="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border shadow-sm">
                   <div class="text-center mb-6"><span class="text-xs text-gray-400 font-black uppercase tracking-widest">六维能力评分</span></div>
                   <div class="h-64 w-full"><v-chart :option="radarOption" autoresize /></div>
                </div>
              </div>

              <div class="col-span-2">
                <div class="bg-white dark:bg-slate-800 rounded-[2.5rem] border shadow-sm overflow-hidden">
                  <div class="p-8 border-b bg-gray-50/50 dark:bg-slate-700/30 flex items-center gap-3 font-black text-lg"><List size="22" class="text-blue-500"/> 球员职业生涯统计</div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                      <thead class="bg-white dark:bg-slate-900 text-[10px] uppercase text-gray-400 font-bold border-b"><tr><th class="p-6">赛季</th><th class="p-6">俱乐部</th><th class="p-6 text-center">出场/首发</th><th class="p-6 text-center">进球</th><th class="p-6 text-center">助攻</th><th class="p-6 text-center">红/黄</th></tr></thead>
                      <tbody class="divide-y">
                        <tr v-for="(s, i) in playerProfile.history" :key="i" class="hover:bg-blue-50/30 transition-colors">
                          <td class="p-6 font-black text-slate-800 dark:text-slate-200">{{s.season}}</td>
                          <td class="p-6 text-gray-500 font-medium">{{s.club}}</td>
                          <td class="p-6 text-center font-bold text-gray-400">{{s.matches}} / {{s.starts}}</td>
                          <td class="p-6 text-center"><span class="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg font-black text-xs">{{s.goals}}</span></td>
                          <td class="p-6 text-center"><span class="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-lg font-black text-xs">{{s.assists}}</span></td>
                          <td class="p-6 text-center font-bold text-xs text-gray-400">{{s.red}} / {{s.yellow}}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div v-if="currentView === 'full_ranking'" class="animate-in fade-in slide-in-from-bottom-4">
           <button @click="goBack" class="mb-6 flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors font-bold"><ArrowLeft size="18"/> 返回首页</button>
           <div class="bg-white dark:bg-slate-800 rounded-[3rem] border shadow-2xl overflow-hidden">
             <div class="p-8 bg-slate-50 dark:bg-slate-700 font-black border-b text-xl flex items-center gap-3">
               <Trophy class="text-yellow-500" v-if="viewType==='standings'"/>
               {{viewType === 'standings' ? '联赛积分榜' : (viewType === 'goals' ? '射手榜' : '助攻榜')}}
             </div>

             <div v-if="loading" class="p-20 text-center flex flex-col items-center"><Loader2 class="animate-spin mb-4 text-blue-600" size="40"/>数据拉取中...</div>

             <table v-else class="w-full text-sm text-left">
                <thead class="text-xs text-gray-400 uppercase font-bold border-b">
                   <tr v-if="viewType === 'standings'">
                       <th class="p-6">排名</th>
                       <th class="p-6">球队</th>
                       <th class="p-6 text-center">赛</th>
                       <th class="p-6 text-center">胜</th>
                       <th class="p-6 text-center">平</th>
                       <th class="p-6 text-center">负</th>
                       <th class="p-6 text-center">进/失</th>
                       <th class="p-6 text-center">积分</th>
                   </tr>
                   <tr v-else>
                       <th class="p-6">排名</th>
                       <th class="p-6">球员</th>
                       <th class="p-6">球队</th>
                       <th class="p-6 text-center">{{ viewType === 'goals' ? '进球数' : '助攻数' }}</th>
                   </tr>
                </thead>
                <tbody class="divide-y">
                   <tr v-for="(item, i) in fullRankingData" :key="i" class="hover:bg-blue-50/50 transition-colors cursor-pointer" @click="viewType==='standings' ? navigateTo('team_detail', item) : navigateTo('player_detail', {person_id: item.id})">
                      <td class="p-6"><span :class="['w-8 h-8 flex items-center justify-center rounded-lg font-black', (item.stats?.rank || item.rank) <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400']">{{item.stats?.rank || item.rank}}</span></td>

                      <template v-if="viewType === 'standings'">
                          <td class="p-6 flex items-center gap-4"><img :src="item.logo" class="w-10 h-10 object-contain"> <span class="font-bold text-lg">{{item.name}}</span></td>
                          <td class="p-6 text-center font-medium text-gray-500">{{item.stats.played}}</td>
                          <td class="p-6 text-center font-bold text-green-600 bg-green-50/30 rounded-lg">{{item.stats.won}}</td>
                          <td class="p-6 text-center font-medium text-gray-400">{{item.stats.draw}}</td>
                          <td class="p-6 text-center font-medium text-red-500">{{item.stats.lost}}</td>
                          <td class="p-6 text-center font-mono text-gray-500">{{item.stats.gf}} / {{item.stats.ga}}</td>
                          <td class="p-6 text-center font-black text-2xl text-blue-600">{{item.stats.pts}}</td>
                      </template>

                      <template v-else>
                          <td class="p-6 flex items-center gap-4"><img :src="item.avatar" class="w-10 h-10 object-contain rounded-full shadow-sm"> <span class="font-bold text-lg">{{item.name}}</span></td>
                          <td class="p-6 text-gray-400 font-bold">{{item.team || activeLeague.cn}}</td>
                          <td class="p-6 text-center"><span class="text-2xl font-black text-blue-600">{{item.count}}</span></td>
                      </template>
                   </tr>
                </tbody>
             </table>
           </div>
        </div>

        <div v-if="currentView === 'search_results'" class="animate-in fade-in">
           <div class="flex items-center gap-3 mb-6">
              <button @click="goBack" class="p-2 rounded-full bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"><ArrowLeft size="20"/></button>
              <h2 class="text-2xl font-black">搜索结果</h2>
              <span class="text-sm text-gray-400 font-bold bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">共 {{ searchResults.length }} 条</span>
           </div>

           <div v-if="searchLoading" class="p-20 text-center flex flex-col items-center text-gray-400">
              <Loader2 class="animate-spin mb-4 text-blue-600" size="40"/>正在全库检索...
           </div>

           <div v-else-if="searchResults.length === 0" class="p-20 text-center text-gray-400 flex flex-col items-center bg-white dark:bg-slate-800 rounded-[3rem] border border-dashed border-gray-300">
              <Search size="48" class="mb-4 text-gray-300"/>
              <p class="font-bold">未找到符合条件的球员</p>
              <button @click="clearSearch" class="mt-4 text-blue-600 text-sm font-bold hover:underline">清空条件重新尝试</button>
           </div>

           <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <div v-for="p in searchResults" :key="p.id" @click="navigateTo('player_detail', {person_id: p.id})"
                   class="bg-white dark:bg-slate-800 p-5 rounded-3xl border shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden">
                 <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <img :src="p.team_logo" class="w-16 h-16 object-contain">
                 </div>
                 <div class="flex items-start gap-4 mb-4 relative z-10">
                    <img :src="p.avatar" class="w-14 h-14 rounded-full bg-gray-50 border shadow-sm object-cover">
                    <div>
                       <div class="font-black text-lg text-slate-800 dark:text-slate-200 line-clamp-1">{{ p.name }}</div>
                       <div class="text-xs text-gray-400 font-bold mb-1">{{ p.team }}</div>
                       <div class="flex gap-2">
                         <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{{ p.pos }}</span>
                         <span class="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-bold">{{ p.nationality }}</span>
                       </div>
                    </div>
                 </div>
                 <div class="flex justify-between items-end border-t pt-3 relative z-10">
                    <div class="text-xs text-gray-400 font-bold">
                       <div>{{ p.age }}</div>
                       <div>{{ p.foot }}</div>
                    </div>
                    <div :class="['text-2xl font-black', p.rating >= 80 ? 'text-blue-600' : (p.rating >= 70 ? 'text-green-500' : 'text-gray-400')]">
                       {{ p.rating }}
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>

      <div v-if="showCompareModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
         <div class="bg-white dark:bg-slate-900 w-[90%] max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative">
            <button @click="closeCompareModal" class="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:rotate-90 transition-transform"><X size="20"/></button>

            <div class="p-8 border-b dark:border-slate-800">
               <h2 class="text-2xl font-black flex items-center gap-3"><Swords class="text-indigo-600"/> 球员对比</h2>
            </div>

            <div class="flex-1 overflow-y-auto p-8 scrollbar-thin">

               <div v-if="!compareTarget" class="max-w-xl mx-auto text-center space-y-6">
                  <div class="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto"><Search size="32"/></div>
                  <h3 class="text-xl font-bold">选择要与 {{playerProfile.name_cn}} 对比的球员</h3>
                  <div class="relative">
                     <input v-model="compareKeyword" @keyup.enter="handleCompareSearch" placeholder="输入球员名字回车搜索..." class="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-lg">
                     <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                     <button @click="handleCompareSearch" class="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-bold text-sm">搜索</button>
                  </div>

                  <div v-if="compareLoading" class="py-10"><Loader2 class="animate-spin mx-auto text-indigo-500"/></div>

                  <div v-else class="space-y-3 text-left">
                     <div v-for="p in compareSearchList" :key="p.id" @click="selectComparePlayer(p.id)" class="flex items-center gap-4 p-4 rounded-2xl border hover:bg-indigo-50 cursor-pointer transition-all group">
                        <img :src="p.avatar" class="w-12 h-12 rounded-full bg-gray-100 object-cover">
                        <div class="flex-1">
                           <div class="font-bold">{{p.name}}</div>
                           <div class="text-xs text-gray-400">{{p.team}}</div>
                        </div>
                        <div class="font-black text-indigo-600">{{p.rating}}</div>
                        <ChevronRight size="16" class="text-gray-300 group-hover:text-indigo-500"/>
                     </div>
                  </div>
               </div>

               <div v-else class="space-y-10 animate-in slide-in-from-bottom-4">
                  <div class="flex items-center justify-center gap-10 md:gap-20">
                     <div class="text-center">
                        <div class="relative inline-block">
                           <img :src="playerProfile.avatar" class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-blue-500 shadow-xl object-cover bg-white">
                           <div class="absolute -bottom-2 -right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-black">{{playerProfile.ability_total}}</div>
                        </div>
                        <h3 class="mt-4 text-xl font-black">{{playerProfile.name_cn}}</h3>
                        <p class="text-sm text-gray-400 font-bold">{{playerProfile.club}}</p>
                     </div>

                     <div class="text-2xl font-black text-gray-300 italic">VS</div>

                     <div class="text-center">
                        <div class="relative inline-block">
                           <img :src="compareTarget.avatar" class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-red-500 shadow-xl object-cover bg-white">
                           <div class="absolute -bottom-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-black">{{compareTarget.ability_total}}</div>
                        </div>
                        <h3 class="mt-4 text-xl font-black">{{compareTarget.name_cn}}</h3>
                        <p class="text-sm text-gray-400 font-bold">{{compareTarget.club}}</p>
                        <button @click="compareTarget = null" class="mt-2 text-xs text-indigo-500 font-bold hover:underline">更换对手</button>
                     </div>
                  </div>

                  <div class="bg-gray-50 dark:bg-slate-800 rounded-3xl p-6 h-80 relative">
                     <div class="absolute top-4 left-4 text-xs font-bold text-gray-400 uppercase tracking-widest">能力六维图</div>
                     <v-chart :option="compareRadarOption" autoresize />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div class="bg-white dark:bg-slate-800 rounded-3xl border p-6">
                        <h4 class="font-bold text-center mb-6 text-gray-400 text-sm uppercase tracking-widest">基础身体素质</h4>
                        <div class="space-y-4">
                           <div v-for="key in ['height', 'weight', 'age', 'foot']" :key="key" class="flex justify-between items-center py-2 border-b border-dashed border-gray-100 last:border-0">
                              <div class="font-black text-blue-600 w-1/3 text-right">{{playerProfile[key]}}</div>
                              <div class="text-xs text-gray-400 font-bold uppercase w-1/3 text-center">
                                 {{key === 'height' ? '身高' : (key === 'weight' ? '体重' : (key === 'age' ? '年龄' : '惯用脚'))}}
                              </div>
                              <div class="font-black text-red-500 w-1/3 text-left">{{compareTarget[key]}}</div>
                           </div>
                        </div>
                     </div>

                     <div class="bg-white dark:bg-slate-800 rounded-3xl border p-6">
                        <h4 class="font-bold text-center mb-6 text-gray-400 text-sm uppercase tracking-widest">本赛季数据 (25/26)</h4>
                        <template v-if="getSeasonStats(playerProfile) && getSeasonStats(compareTarget)">
                           <div class="space-y-4">
                              <div v-for="k in ['matches', 'goals', 'assists', 'yellow', 'red']" :key="k" class="flex justify-between items-center py-2 border-b border-dashed border-gray-100 last:border-0">
                                 <div class="font-black text-blue-600 w-1/3 text-right">{{getSeasonStats(playerProfile)[k]}}</div>
                                 <div class="text-xs text-gray-400 font-bold uppercase w-1/3 text-center">
                                    {{k === 'matches' ? '出场' : (k === 'goals' ? '进球' : (k === 'assists' ? '助攻' : (k === 'yellow' ? '黄牌' : '红牌')))}}
                                 </div>
                                 <div class="font-black text-red-500 w-1/3 text-left">{{getSeasonStats(compareTarget)[k]}}</div>
                              </div>
                           </div>
                        </template>
                        <div v-else class="text-center text-gray-400 py-10 font-bold">暂无完整赛季数据</div>
                     </div>
                  </div>

               </div>
            </div>
         </div>
      </div>

    </main>
  </div>
</template>

<style>
.animate-in { animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
.dark .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; }
</style>