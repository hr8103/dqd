<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import {
  Trophy, Users, MapPin, ChevronRight, List,
  Goal, Footprints, LogOut, User, ArrowLeft,
  Phone, Mail, Globe, Calendar, Sun, Moon, Shield, Loader2
} from 'lucide-vue-next'

// --- ECharts 配置 ---
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, RadarComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, RadarChart, TitleComponent, TooltipComponent, LegendComponent, RadarComponent])

// === 1. 核心状态 ===
const API_BASE = 'http://localhost:5000/api'
const isDark = ref(false)
const user = ref(null)
const leagues = ref([])
const activeLeague = ref(null)
const currentView = ref('dashboard') // dashboard, team_detail, player_detail, full_ranking
const viewData = ref(null)
const viewType = ref('')

// 数据存放
const teams = ref([])
const scorers = ref([])
const assists = ref([])
const squad = ref([])
const playerProfile = ref(null)
const loading = ref(false)
const fullRankingData = ref([])

// === 2. 逻辑函数 ===
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
  } catch(e) { console.error("API 未启动或连接失败", e) }
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

// === 3. 数据监听与抓取 ===
// 监听联赛切换
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

// 监听视图切换（加载详情）
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

// 雷达图配置
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

onMounted(() => {
  // 开发阶段自动登录
  handleLogin()
})
</script>

<template>
  <div :class="['w-full h-screen flex overflow-hidden font-sans', isDark ? 'bg-slate-900 text-white' : 'bg-[#F8FAFC] text-slate-900']">

    <!-- 1. 登录页 -->
    <div v-if="!user" class="fixed inset-0 z-50 flex items-center justify-center bg-[#F2F2F7]">
      <div class="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full mx-4">
        <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6">F</div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Football Pro</h2>
        <p class="text-gray-500 mb-8">数据智能分析平台</p>
        <button @click="handleLogin" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition transform active:scale-95">进入系统</button>
      </div>
    </div>

    <!-- 2. 侧边栏 -->
    <aside :class="['w-72 border-r flex flex-col shrink-0 transition-colors', isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200']">
      <div class="p-6">
        <div :class="['flex items-center gap-3 p-3 rounded-2xl border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100']">
          <img :src="user?.avatar" class="w-10 h-10 rounded-full border-2 border-white">
          <div class="overflow-hidden">
            <h3 class="font-bold text-sm truncate">{{ user?.name }}</h3>
            <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto px-4 space-y-1">
        <div class="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">联赛导航</div>
        <button
          v-for="l in leagues" :key="l.id"
          @click="activeLeague = l; currentView = 'dashboard'"
          :class="['w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition group', activeLeague?.id === l.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50']"
        >
          <img :src="l.logo" class="w-6 h-6 object-contain" :class="{'brightness-200': activeLeague?.id === l.id}">
          <span class="font-medium text-sm">{{ l.cn }}</span>
        </button>
      </div>
      <div class="p-4 border-t"><button @click="user=null" class="flex items-center gap-2 text-gray-400 text-sm hover:text-red-500 transition-colors"><LogOut size="16"/> 退出登录</button></div>
    </aside>

    <!-- 3. 主显示区 -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- 头部导航 -->
      <header :class="['h-16 border-b flex items-center justify-between px-8 shrink-0', isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200 backdrop-blur-md']">
        <div class="flex items-center gap-2 text-sm text-gray-400"><Shield size="16"/> Dashboard <ChevronRight size="14"/> {{activeLeague?.cn}}</div>
        <button @click="toggleTheme" class="p-2 rounded-full border bg-white shadow-sm hover:rotate-12 transition-transform"><Sun v-if="isDark" class="text-yellow-500"/><Moon v-else class="text-blue-500"/></button>
      </header>

      <!-- 视图容器 -->
      <div class="flex-1 overflow-y-auto p-8 scroll-smooth no-scrollbar">

        <!-- A. 联赛主页 Dashboard -->
        <div v-if="currentView === 'dashboard'" class="space-y-8 animate-in">
          <!-- 联赛卡片 -->
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
            <!-- 积分榜列表 -->
            <div :class="['col-span-2 rounded-3xl border shadow-sm overflow-hidden', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100']">
              <div class="p-6 border-b flex justify-between items-center bg-gray-50/30">
                <h3 class="font-bold flex items-center gap-2"><List class="text-blue-500"/> 实时积分榜</h3>
                <button @click="navigateTo('full_ranking', null, 'standings')" class="text-xs font-bold text-blue-600 hover:underline">查看完整</button>
              </div>
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-gray-400 uppercase"><tr class="border-b">
                  <th class="p-5 font-bold">排名</th><th class="p-5 font-bold">球队</th><th class="p-5 font-bold">赛</th><th class="p-5 font-bold">积分</th>
                </tr></thead>
                <tbody class="divide-y">
                  <tr v-for="t in teams.slice(0, 12)" :key="t.id" @click="navigateTo('team_detail', t)" class="hover:bg-blue-50/50 cursor-pointer transition-colors">
                    <td class="p-5"><span :class="['w-8 h-8 flex items-center justify-center rounded-lg font-bold', t.stats.rank <= 4 ? 'bg-blue-100 text-blue-700' : 'text-gray-400']">{{t.stats.rank}}</span></td>
                    <td class="p-5 flex items-center gap-4"><img :src="t.logo" class="w-8 h-8 object-contain"> <span class="font-bold">{{t.name}}</span></td>
                    <td class="p-5 opacity-60">{{t.stats.played}}</td>
                    <td class="p-5 font-black text-xl text-blue-600">{{t.stats.pts}}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 右侧小榜单 -->
            <div class="col-span-1 space-y-8">
               <div v-for="type in ['goals', 'assists']" :key="type" :class="['p-6 rounded-3xl border shadow-sm', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100']">
                  <div class="flex justify-between mb-6">
                    <h3 class="font-bold flex items-center gap-2">
                        <Goal v-if="type==='goals'" class="text-blue-500" size="18"/>
                        <Footprints v-else class="text-green-500" size="18"/>
                        {{type === 'goals' ? '射手榜' : '助攻榜'}}
                    </h3>
                    <button @click="navigateTo('full_ranking', null, type)" class="text-xs text-blue-600 font-bold">详情</button>
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

        <!-- B. 球队详情 Team View -->
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

        <!-- C. 球员详情 Player View (精装修) -->
        <div v-if="currentView === 'player_detail'" class="animate-in slide-in-from-right-4">
          <button @click="goBack" class="mb-6 flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors font-bold"><ArrowLeft size="18"/> 返回列表</button>

          <div v-if="loading && !playerProfile" class="p-20 text-center text-gray-400 flex flex-col items-center"><Loader2 class="animate-spin mb-4" size="40"/> 正在同步档案...</div>

          <template v-else-if="playerProfile">
            <!-- 头部 -->
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
                       <img v-if="playerProfile.nationality_logo" :src="playerProfile.nationality_logo" class="w-5 h-3.5 rounded-sm">
                       {{playerProfile.country}}
                    </span>
                    <span class="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">{{playerProfile.club}}</span>
                    <span class="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">{{playerProfile.number}}</span>
                    <span class="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">{{playerProfile.pos}}</span>
                 </div>
               </div>
            </div>

            <div class="grid grid-cols-3 gap-8">
              <!-- 左侧：球员详情模块 -->
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
                                <img v-if="lab==='国籍/会籍' && playerProfile.nationality_logo" :src="playerProfile.nationality_logo" class="w-5 h-3.5 rounded shadow-sm">
                                <span class="font-bold text-slate-700 dark:text-slate-200">{{val}}</span>
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
                <!-- 雷达图 -->
                <div v-if="radarOption" class="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border shadow-sm">
                   <div class="text-center mb-6"><span class="text-xs text-gray-400 font-black uppercase tracking-widest">六维能力评分</span></div>
                   <div class="h-64 w-full"><v-chart :option="radarOption" autoresize /></div>
                </div>
              </div>

              <!-- 右侧：职业生涯数据 -->
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

        <!-- D. 全屏排行榜视图 Full Ranking -->
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
                   <tr><th class="p-6">排名</th><th class="p-6">名称</th><th class="p-6">球队</th><th class="p-6 text-center">核心数据</th></tr>
                </thead>
                <tbody class="divide-y">
                   <tr v-for="(item, i) in fullRankingData" :key="i" class="hover:bg-blue-50/50 transition-colors cursor-pointer" @click="viewType==='standings' ? navigateTo('team_detail', item) : navigateTo('player_detail', {person_id: item.id})">
                      <td class="p-6"><span :class="['w-8 h-8 flex items-center justify-center rounded-lg font-black', i<3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400']">{{item.stats?.rank || item.rank}}</span></td>
                      <td class="p-6 flex items-center gap-4"><img :src="item.logo || item.avatar" class="w-10 h-10 object-contain rounded-full shadow-sm"> <span class="font-bold text-lg">{{item.name}}</span></td>
                      <td class="p-6 text-gray-400 font-bold">{{item.team || activeLeague.cn}}</td>
                      <td class="p-6 text-center"><span class="text-2xl font-black text-blue-600">{{item.stats?.pts || item.count}}</span></td>
                   </tr>
                </tbody>
             </table>
           </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style>
/* 简单动画 */
.animate-in { animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 隐藏滚动条 */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>