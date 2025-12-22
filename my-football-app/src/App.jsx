import React, { useState, useEffect } from 'react';
import {
  Trophy, Users, MapPin, Activity, ChevronRight, Search,
  LayoutGrid, Shield, TrendingUp, ArrowLeft,
  Moon, Sun, List, Footprints, Goal, Loader2, LogOut, Mail, Lock, User, ArrowRight, AlertCircle, Phone, Globe, Calendar
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar
} from 'recharts';

// === API 配置 ===
const API_BASE = 'http://localhost:5000/api';

// --- UI Components ---
const ThemeContext = React.createContext(null);

const Card = ({ children, className = "", onClick }) => {
  const { isDark } = React.useContext(ThemeContext);
  return (
    <div
      onClick={onClick}
      className={`
        rounded-3xl border transition-all duration-300 relative overflow-hidden
        ${isDark 
          ? 'bg-slate-800/60 border-slate-700/50 text-slate-100 shadow-lg hover:bg-slate-800/80' 
          : 'bg-white/80 border-white/60 text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};

const Badge = ({ children, className="" }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${className}`}>
    {children}
  </span>
);

// 优化雷达图
const RadarChartComponent = ({ data, total, isDark }) => {
  const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }) => {
    const entry = data.find(d => d.subject === payload.value);
    const value = entry ? entry.A : 0;
    return (
      <text x={x} y={y} cx={cx} cy={cy} {...rest}
            fill={isDark ? '#94a3b8' : '#64748b'}
            fontSize={12}
            fontWeight="bold"
            textAnchor="middle"
      >
        {payload.value} {value}
      </text>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center">
       <div className="text-center mb-2">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>综合能力</span>
          <span className="text-3xl font-black text-orange-500 ml-2">{total || '-'}</span>
       </div>
       <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke={isDark ? "#334155" : "#e2e8f0"} strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="subject" tick={renderPolarAngleAxis} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="能力" dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
       </div>
    </div>
  );
};

// --- Auth Page ---
const AuthPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      onLogin({ name: 'Admin User', email: formData.email, avatar: 'admin.svg' });
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F2F2F7] p-4">
      <div className="w-full max-w-5xl h-[600px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex md:flex-row flex-col">
        <div className="md:w-1/2 w-full bg-blue-600 relative p-12 flex flex-col justify-between text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-blue-600 to-blue-700 opacity-80"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white font-bold text-xl">F</div>
              <span className="text-2xl font-bold tracking-tight">Football Pro</span>
            </div>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">Data <br/>Intelligence.</h1>
            <p className="text-blue-100 text-lg opacity-90 font-medium">大P老师足球数据分析平台<br/>懂球的人根本不用懂球帝——大P。</p>
          </div>
        </div>
        <div className="md:w-1/2 w-full p-16 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-10">Please enter your details to sign in.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                    <input className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="admin@example.com" required value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})}/>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                    <input className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" type="password" placeholder="••••••" required value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})}/>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98]">Sign In</button>
            </form>
        </div>
      </div>
    </div>
  );
};

// --- Sidebar ---
const Sidebar = ({ user, leagues, activeLeague, setActiveLeague, onLogout }) => {
  const { isDark } = React.useContext(ThemeContext);
  return (
    <div className={`flex flex-col h-full border-r w-72 shrink-0 transition-colors duration-300 ${isDark ? 'bg-slate-900/50 border-slate-800 backdrop-blur-xl' : 'bg-white/80 border-slate-200 backdrop-blur-xl'}`}>
      <div className="p-6">
        <div className={`flex items-center gap-4 p-3 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'} border ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <img src={user.avatar} className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-600" alt="User" />
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold truncate text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h3>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        <div className="px-3 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Leagues</div>
        {leagues.map(league => {
          const isActive = activeLeague && activeLeague.id === league.id;
          return (
            <button
              key={league.id}
              onClick={() => setActiveLeague(league)}
              className={`
                w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative
                ${isActive 
                  ? (isDark ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30') 
                  : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-900')
                }
              `}
            >
              <img src={league.logo} className={`w-6 h-6 object-contain transition-transform group-hover:scale-110 ${isActive ? 'brightness-200 grayscale-0' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`} />
              <span className="font-medium text-sm">{league.cn}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </button>
          );
        })}
      </div>

      <div className="p-4 mt-auto border-t border-gray-200/50 dark:border-gray-800/50">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={18} /> 退出登录
        </button>
      </div>
    </div>
  );
};

// --- Full Ranking View (全屏榜单) ---
const FullRankingView = ({ league, type, onClose, onNavigate }) => {
  const { isDark } = React.useContext(ThemeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let endpoint = '';
    // 路由修正：确保前端类型映射到正确的 API 路径
    if (type === 'standings') {
        endpoint = `${API_BASE}/teams/${league.id}`;
    } else if (type === 'scorers') {
        endpoint = `${API_BASE}/rankings/${league.id}/goals`; // goals 对应数据库
    } else if (type === 'assists') {
        endpoint = `${API_BASE}/rankings/${league.id}/assists`;
    } else {
        // 兜底
        endpoint = `${API_BASE}/rankings/${league.id}/${type}`;
    }

    setLoading(true);
    fetch(endpoint)
      .then(res => res.json())
      .then(res => {
        setData(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });
  }, [league.id, type]);

  const headers = type === 'standings'
    ? ['排名', '球队', '赛', '胜', '平', '负', '进/失', '积分']
    : ['排名', '球员', '球队', '数据'];

  const getTitle = () => {
      if (type === 'standings') return '积分榜';
      if (type === 'scorers') return '射手榜';
      if (type === 'assists') return '助攻榜';
      return '榜单';
  }

  const icon = type === 'scorers' ? <Goal size={24}/> : (type === 'assists' ? <Footprints size={24}/> : <List size={24}/>);

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onClose} className={`p-2.5 rounded-full transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white hover:shadow-sm text-slate-600'}`}><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">{icon} {league.fullName} - {getTitle()}</h2>
      </div>
      <Card className="flex-1 overflow-hidden border-0">
        <div className="overflow-y-auto h-full p-0">
          {loading ? <div className="p-10 text-center text-gray-400 flex flex-col items-center"><Loader2 className="animate-spin mb-2"/>加载中...</div> : (
            <table className="w-full text-sm text-left">
              <thead className={`text-xs uppercase font-semibold ${isDark ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50/80'} sticky top-0 backdrop-blur-md z-10`}>
                <tr>{headers.map(h => <th key={h} className="px-6 py-4">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-100 dark:divide-gray-700/50">
                {data.length > 0 ? data.map((item, i) => (
                  <tr key={i} className={`group transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50/30'} cursor-pointer`} onClick={() => {
                    if(type === 'standings') onNavigate('team_detail', item);
                    else if(item.id) onNavigate('player_detail', {person_id: item.id});
                  }}>
                    <td className="px-6 py-4"><span className={`w-6 h-6 flex items-center justify-center rounded-lg font-bold font-mono text-xs ${i<3 ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}>{item.stats?.rank || item.rank}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={item.logo || item.avatar} className="w-10 h-10 object-contain rounded-full bg-gray-100 p-0.5" />
                        <span className="font-bold text-base">{item.name}</span>
                      </div>
                    </td>
                    {type === 'standings' ? (
                      <>
                        <td className="px-6 py-4 font-medium opacity-60">{item.stats.played}</td>
                        <td className="px-6 py-4 text-green-600 font-bold">{item.stats.won}</td>
                        <td className="px-6 py-4 text-gray-400 font-medium">{item.stats.draw}</td>
                        <td className="px-6 py-4 text-red-500 font-medium">{item.stats.lost}</td>
                        <td className="px-6 py-4 font-mono text-xs bg-gray-50 dark:bg-slate-800 rounded">{item.stats.gf} : {item.stats.ga}</td>
                        <td className="px-6 py-4 font-bold text-lg text-blue-600 dark:text-blue-400">{item.stats.pts}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 opacity-80 font-medium text-gray-500">{item.team}</td>
                        <td className="px-6 py-4 font-bold text-xl text-blue-600 dark:text-blue-400">{item.count}</td>
                      </>
                    )}
                  </tr>
                )) : (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

// --- Team Detail View ---
const TeamDetailView = ({ team, onNavigate, onBack }) => {
  const { isDark } = React.useContext(ThemeContext);
  const [squad, setSquad] = useState([]);

  useEffect(() => { fetch(`${API_BASE}/squad/${team.id}`).then(res => res.json()).then(setSquad); }, [team.id]);

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
      <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Icon size={20}/></div>
      <div><div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div><div className="text-sm font-semibold">{value || '-'}</div></div>
    </div>
  );

  const honors = Array.isArray(team.honors) ? team.honors : [];
  const info = team.info || {};

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="relative shrink-0 mb-6">
        <div className="h-48 rounded-3xl overflow-hidden relative">
            <div className={`absolute inset-0 ${isDark ? 'bg-slate-800' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <button onClick={onBack} className="absolute top-6 left-6 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"><ArrowLeft size={20}/></button>
        </div>
        <div className="absolute -bottom-12 left-10 flex items-end gap-6">
            <div className="w-32 h-32 bg-white rounded-[2rem] p-4 shadow-xl shadow-blue-900/10 flex items-center justify-center border-4 border-white dark:border-slate-900">
                <img src={team.logo} className="w-full h-full object-contain" />
            </div>
            <div className="mb-14">
                <h1 className="text-4xl font-bold text-white tracking-tight">{team.name}</h1>
                <p className="text-blue-100 text-lg font-medium">{team.en}</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-16 pb-8 px-1">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
           <InfoItem icon={Calendar} label="成立时间" value={info.founded} />
           <InfoItem icon={Users} label="球场容量" value={info.capacity} />
           <InfoItem icon={MapPin} label="城市" value={info.city} />
           <InfoItem icon={Globe} label="国家" value={info.country} />
           <InfoItem icon={Phone} label="电话" value={info.phone} />
           <InfoItem icon={Mail} label="邮箱" value={info.email} />
           <div className="md:col-span-3"><InfoItem icon={MapPin} label="地址" value={info.address} /></div>
        </div>

        <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-6 rounded-[2rem] border border-yellow-100 dark:border-yellow-900/30 mb-8">
          <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-500 mb-4 uppercase tracking-wider flex items-center gap-2"><Trophy size={16}/> 荣誉室</h3>
          <div className="flex flex-wrap gap-3">
             {honors.length > 0 ? honors.map((h, i) => (
                <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm text-sm border border-yellow-100 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-gray-200">{h.name}</span>
                  <span className="bg-yellow-400 text-white text-xs px-2 py-0.5 rounded-md font-black">{h.count}</span>
                </div>
             )) : <span className="text-gray-400 text-sm italic">暂无记录</span>}
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="text-blue-500"/> 球队阵容</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {squad.map(p => (
            <div key={p.id} onClick={() => onNavigate('player_detail', { person_id: p.id })}
                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-100 hover:shadow-md'}`}>
                <span className="font-mono text-gray-400 font-bold w-8 text-center text-lg">{p.number || '-'}</span>
                <img src={p.avatar} className="w-12 h-12 rounded-full bg-gray-100 object-cover ring-2 ring-slate-50 dark:ring-slate-700" />
                <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-base">{p.name}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{p.pos}</div>
                </div>
                <div className={`text-sm font-black px-2.5 py-1 rounded-lg ${p.rating >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.rating}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Player Detail View ---
const PlayerDetailView = ({ player, onBack }) => {
  const { isDark } = React.useContext(ThemeContext);
  const [fullProfile, setFullProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const displayName = player.name || "未知球员";
  const displayAvatar = player.avatar || "https://www.dongqiudi.com/img/default_head.png";

  useEffect(() => {
    if (!player.person_id) { setLoading(false); return; }
    setLoading(true); setError(false); setFullProfile(null);
    fetch(`${API_BASE}/player/${player.person_id}`).then(res => res.json()).then(data => {
        if (Object.keys(data).length === 0) setError(true); else setFullProfile(data);
        setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [player.person_id]);

  const profile = fullProfile || { name_cn: displayName, name_en: '', club: '-', number: '-', pos: '-', avatar: displayAvatar, height: '-', weight: '-', age: '-', foot: '-', ability_total: '-', radar: [], history: [] };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
       <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl shrink-0 mx-1">
          <button onClick={onBack} className="absolute top-6 left-6 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors z-10"><ArrowLeft size={20}/></button>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 mt-4">
             <div className="relative">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-2xl">
                    <img src={profile.avatar} className="w-full h-full rounded-full object-cover border-4 border-slate-900" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold border-4 border-slate-900 shadow-lg">
                    {profile.ability_total || '-'}
                </div>
             </div>
             <div className="text-center md:text-left">
                 <h1 className="text-4xl font-bold tracking-tight">{profile.name_cn}</h1>
                 <p className="text-slate-400 text-lg font-medium mb-4">{profile.name_en}</p>
                 <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Badge className="bg-white/10 border-white/5 text-white">{profile.club}</Badge>
                    <Badge className="bg-white/10 border-white/5 text-white">#{profile.number}</Badge>
                    <Badge className="bg-white/10 border-white/5 text-white">{profile.pos}</Badge>
                    <Badge className="bg-white/10 border-white/5 text-white">{profile.country}</Badge>
                 </div>
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-2 mt-4 space-y-6">
          {(error || (loading && !fullProfile)) && (
             <div className="text-center py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100">
                {loading ? "正在同步详细档案..." : "暂无详细数据，请运行爬虫抓取"}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Left: Info & Radar */}
             <div className="space-y-6 col-span-1">
                <Card className="p-6">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">身体素质</h3>
                   <div className="grid grid-cols-2 gap-y-6">
                      <div><div className="text-2xl font-bold">{profile.height}</div><div className="text-xs text-gray-400 mt-1">身高</div></div>
                      <div><div className="text-2xl font-bold">{profile.weight}</div><div className="text-xs text-gray-400 mt-1">体重</div></div>
                      <div><div className="text-2xl font-bold">{profile.age}</div><div className="text-xs text-gray-400 mt-1">年龄</div></div>
                      <div><div className="text-2xl font-bold">{profile.foot}</div><div className="text-xs text-gray-400 mt-1">惯用脚</div></div>
                   </div>
                </Card>
                {profile.radar.length > 0 && (
                    <Card className="p-4 flex flex-col items-center bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-800/50">
                        <div className="h-72 w-full"><RadarChartComponent data={profile.radar} total={profile.ability_total} isDark={isDark} /></div>
                    </Card>
                )}
             </div>

             {/* Right: Season History Table */}
             <div className="col-span-1 md:col-span-2">
                <Card className="h-full overflow-hidden flex flex-col">
                   <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50">
                      <h3 className="font-bold flex items-center gap-2"><List size={18} className="text-blue-500"/> 职业生涯数据</h3>
                   </div>
                   <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-sm text-left">
                         <thead className="text-xs text-gray-400 uppercase bg-white dark:bg-slate-900 sticky top-0">
                            <tr>
                                <th className="px-6 py-4">赛季</th>
                                <th className="px-6 py-4">俱乐部</th>
                                <th className="px-6 py-4 text-center">出场</th>
                                <th className="px-6 py-4 text-center">首发</th>
                                <th className="px-6 py-4 text-center">进球</th>
                                <th className="px-6 py-4 text-center">助攻</th>
                                <th className="px-6 py-4 text-center">红/黄</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {profile.history.length > 0 ? profile.history.map((s, i) => (
                               <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-6 py-4 font-bold">{s.season}</td>
                                  <td className="px-6 py-4 text-gray-500">{s.club}</td>
                                  <td className="px-6 py-4 text-center text-slate-600 font-medium">{s.matches}</td>
                                  <td className="px-6 py-4 text-center text-gray-400">{s.starts}</td>
                                  <td className="px-6 py-4 text-center"><span className="inline-block w-8 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">{s.goals}</span></td>
                                  <td className="px-6 py-4 text-center"><span className="inline-block w-8 py-1 bg-green-100 text-green-700 rounded-lg font-bold text-xs">{s.assists}</span></td>
                                  <td className="px-6 py-4 text-center text-xs text-gray-400">{s.red}/{s.yellow}</td>
                               </tr>
                            )) : <tr><td colSpan="7" className="p-10 text-center text-gray-400">暂无历史数据</td></tr>}
                         </tbody>
                      </table>
                   </div>
                </Card>
             </div>
          </div>
       </div>
    </div>
  );
};

const LeagueDashboard = ({ league, onNavigate }) => {
  const [teams, setTeams] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [assists, setAssists] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/teams/${league.id}`).then(r=>r.json()).then(setTeams);
    fetch(`${API_BASE}/rankings/${league.id}/goals`).then(r=>r.json()).then(d=>setScorers(d.slice(0, 5)));
    fetch(`${API_BASE}/rankings/${league.id}/assists`).then(r=>r.json()).then(d=>setAssists(d.slice(0, 5)));
  }, [league.id]);

  const totalMatches = teams.length * (teams.length - 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
       {/* Hero Card */}
       <div className="p-10 rounded-[2.5rem] bg-white border shadow-xl shadow-indigo-100/50 dark:bg-slate-800 dark:border-slate-700 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="relative z-10 flex justify-between items-end">
             <div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm p-3 flex items-center justify-center border border-slate-100">
                        <img src={league.logo} className="w-full h-full object-contain"/>
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-sm px-3 py-1">{league.name}</Badge>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">{league.fullName}</h1>
                <p className="text-lg text-slate-500 font-medium">2025-2026 赛季</p>
             </div>
             <div className="flex gap-6 text-center">
                <div className="px-8 py-4 bg-slate-50 rounded-3xl dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                   <div className="text-3xl font-black text-slate-900 dark:text-white">{teams.length}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Teams</div>
                </div>
                <div className="px-8 py-4 bg-slate-50 rounded-3xl dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                   <div className="text-3xl font-black text-slate-900 dark:text-white">{totalMatches}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Matches</div>
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2">
             <Card className="overflow-hidden h-full flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                   <h3 className="font-bold text-xl flex gap-3 items-center"><List className="text-indigo-500"/> 实时积分榜</h3>
                   <button onClick={()=>onNavigate('full_standings')} className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">View All</button>
                </div>
                <div className="flex-1">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-white dark:bg-slate-900 text-xs uppercase text-slate-400 font-bold"><tr><th className="px-6 py-4">Rank</th><th className="px-6 py-4">Team</th><th className="px-6 py-4">P</th><th className="px-6 py-4">W/D/L</th><th className="px-6 py-4">GD</th><th className="px-6 py-4">Pts</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {/* 🔥 修复：显示前12名，对齐高度 */}
                        {teams.slice(0,12).map(t => (
                            <tr key={t.id} onClick={()=>onNavigate('team_detail', t)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                                <td className="px-6 py-5 text-center"><span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold ${t.stats.rank<=4?'bg-indigo-100 text-indigo-700':'text-gray-400 bg-gray-100 dark:bg-slate-700'}`}>{t.stats.rank}</span></td>
                                <td className="px-6 py-5 flex gap-4 items-center"><img src={t.logo} className="w-10 h-10 object-contain drop-shadow-sm"/><span className="font-bold text-base">{t.name}</span></td>
                                <td className="px-6 py-5 font-medium text-gray-500">{t.stats.played}</td>
                                <td className="px-6 py-5 font-medium"><span className="text-green-600">{t.stats.won}</span> / <span className="text-gray-400">{t.stats.draw}</span> / <span className="text-red-500">{t.stats.lost}</span></td>
                                <td className="px-6 py-5 font-mono text-xs bg-gray-50 dark:bg-slate-800 rounded px-2 py-1 w-fit">{t.stats.gf}:{t.stats.ga}</td>
                                <td className="px-6 py-5 font-black text-xl text-indigo-600 dark:text-indigo-400">{t.stats.pts}</td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
             </Card>
          </div>

          <div className="col-span-1 space-y-8">
             {[{title:'射手榜', icon:Goal, data:scorers, color:'blue', key:'scorers'}, {title:'助攻榜', icon:Footprints, data:assists, color:'green', key:'assists'}].map((section, sIdx) => (
                 <Card key={sIdx} className="p-6">
                    <div className="flex justify-between mb-6 items-center">
                        <h3 className="font-bold text-lg flex gap-2 items-center"><section.icon className={`text-${section.color}-500`}/> {section.title}</h3>
                        {/* 🔥 修复：跳转类型修正为 scorers/assists */}
                        <button onClick={()=>onNavigate(section.key==='scorers'?'full_scorers':'full_assists')} className={`text-xs font-bold text-${section.color}-600 bg-${section.color}-50 px-3 py-1.5 rounded-lg hover:bg-${section.color}-100 transition-colors`}>View All</button>
                    </div>
                    <div className="space-y-4">
                        {section.data.map((p,i)=>(
                            <div key={i} onClick={()=>onNavigate('player_detail',{person_id:p.id})} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all group">
                                <div className={`w-6 text-center font-black text-sm ${i===0?`text-${section.color}-500 text-lg`:'text-gray-300'}`}>{p.rank}</div>
                                <img src={p.avatar} className="w-12 h-12 rounded-full bg-gray-100 object-cover ring-2 ring-white group-hover:ring-indigo-100 transition-all"/>
                                <div className="flex-1 min-w-0"><div className="font-bold text-slate-700 dark:text-slate-200 truncate">{p.name}</div><div className="text-xs font-medium text-gray-400 truncate">{p.team}</div></div>
                                <div className={`font-black text-xl text-${section.color}-600`}>{p.count}</div>
                            </div>
                        ))}
                    </div>
                 </Card>
             ))}
          </div>
       </div>
    </div>
  );
};

export default function FootballProDashboard() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const [navStack, setNavStack] = useState([{ type: 'dashboard', data: null }]);

  useEffect(() => {
    fetch(`${API_BASE}/leagues`).then(r=>r.json()).then(d => { setLeagues(d); setActiveLeague(d[0]); });
  }, []);

  const currentView = navStack[navStack.length - 1];
  const navigateTo = (type, data) => setNavStack([...navStack, { type, data }]);
  const goBack = () => setNavStack(navStack.slice(0, -1));

  if (!user) return <AuthPage onLogin={setUser} />;
  if (!activeLeague) return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-indigo-600 w-10 h-10"/></div>;

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      <div className={`w-full h-screen flex overflow-hidden ${isDark ? 'bg-slate-900 text-white' : 'bg-[#F8FAFC] text-slate-900'} font-sans selection:bg-indigo-100 selection:text-indigo-700`}>
        <Sidebar user={user} leagues={leagues} activeLeague={activeLeague} setActiveLeague={(l)=>{setActiveLeague(l);setNavStack([{type:'dashboard'}])}} onLogout={()=>setUser(null)}/>
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
            {currentView.type === 'dashboard' && <LeagueDashboard league={activeLeague} onNavigate={navigateTo} />}
            {currentView.type === 'team_detail' && <TeamDetailView team={currentView.data} onNavigate={navigateTo} onBack={goBack} />}
            {currentView.type === 'player_detail' && <PlayerDetailView player={currentView.data} onBack={goBack} />}
            {currentView.type.startsWith('full_') && <FullRankingView league={activeLeague} type={currentView.type.replace('full_','')} onClose={goBack} onNavigate={navigateTo} />}
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}