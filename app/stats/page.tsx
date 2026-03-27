// app/stats/page.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  BarChart2, Music2, Calendar, Mic2, ListMusic, 
  Users, TrendingUp, UserCheck, PieChart as PieIcon, Sparkles, Activity 
} from 'lucide-react';
import { 
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie, 
  ScatterChart, Scatter, ZAxis, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

// --- 工具函數 ---
const parseDateToInt = (dateStr: any) => {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const parts = dateStr.split(/[-/]/).map(Number);
  if (parts.length >= 3) {
    const [y, m, d] = parts;
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return y * 10000 + m * 100 + d;
  }
  return 0;
};

const toInputFormat = (dateStr: any) => {
  if (!dateStr || typeof dateStr !== 'string') return "";
  const parts = dateStr.split(/[-/]/);
  if (parts.length >= 3) {
    const y = parseInt(parts[0], 10);
    const m = String(parseInt(parts[1], 10)).padStart(2, '0');
    const d = String(parseInt(parts[2], 10)).padStart(2, '0');
    if (!isNaN(y)) return `${y}-${m}-${d}`;
  }
  return "";
};

const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const displayCount = data.count || (payload[0].value ? Math.round(payload[0].value) : 0);

    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-bold mb-1 text-base">{data.name || label}</p>
        <div className="text-emerald-400 text-sm flex items-center gap-2">
          {t.stats_table_count}: <span className="font-bold text-xl">{displayCount}</span> {t.stats_card_unit_times}
        </div>
        {data.latestYear && (
          <p className="text-slate-500 text-xs mt-1">{t.stats_tooltip_latest_year}: {data.latestYear}</p>
        )}
      </div>
    );
  }
  return null;
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-800/80 rounded ${className}`} />
);

const StatsSkeleton = () => (
  <div className="w-full p-4 lg:p-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl shadow-lg h-[120px] flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2 mb-1"><Skeleton className="w-5 h-5 rounded-full" /><Skeleton className="w-20 h-4" /></div>
          <Skeleton className="w-24 h-10" />
        </div>
      ))}
    </div>
  </div>
);

export default function StatsPage() {
  const { t } = useLanguage();
  const { allSongs, loading } = usePlayer();
  const [isMounted, setIsMounted] = useState(false);
  const [userStartDate, setUserStartDate] = useState("");
  const [userEndDate, setUserEndDate] = useState("");

  useEffect(() => { 
    setIsMounted(true); 
  }, []);

  const normalizedRecords = useMemo(() => {
    if (!allSongs) return [];
    const records: any[] = [];
    allSongs.forEach(song => {
      song.versions?.forEach((v: any) => {
        const num = parseDateToInt(v.date);
        const fmt = toInputFormat(v.date);
        if (num > 0) records.push({ songName: song.songName, artist: song.artist, dateNum: num, dateFmt: fmt });
      });
    });
    return records.sort((a, b) => a.dateNum - b.dateNum);
  }, [allSongs]);

  const defaultStart = normalizedRecords.length > 0 ? normalizedRecords[0].dateFmt : "";
  const defaultEnd = normalizedRecords.length > 0 ? normalizedRecords[normalizedRecords.length - 1].dateFmt : "";

  useEffect(() => {
    if (normalizedRecords.length > 0) {
      setUserStartDate(prev => prev || normalizedRecords[0].dateFmt);
      setUserEndDate(prev => prev || normalizedRecords[normalizedRecords.length - 1].dateFmt);
    }
  }, [normalizedRecords]);

  const startNum = userStartDate ? parseDateToInt(userStartDate) : 0;
  const endNum = userEndDate ? parseDateToInt(userEndDate) : 99999999;

  const stats = useMemo(() => {
    if (normalizedRecords.length === 0 || !t) return null;
    const filtered = normalizedRecords.filter(r => r.dateNum >= startNum && r.dateNum <= endNum);
    const counts: Record<string, any> = {};
    const artistCounts: Record<string, number> = {};
    const trendMap: Record<string, number> = {};
    const firstSeenMap = new Map();

    normalizedRecords.forEach(r => {
      if (!firstSeenMap.has(r.songName) || r.dateNum < firstSeenMap.get(r.songName)) {
        firstSeenMap.set(r.songName, r.dateNum);
      }
    });

    filtered.forEach(r => {
      if (!counts[r.songName]) counts[r.songName] = { count: 0, artist: r.artist, latestDate: 0 };
      counts[r.songName].count += 1;
      counts[r.songName].latestDate = Math.max(counts[r.songName].latestDate, r.dateNum);
      if (!artistCounts[r.artist]) artistCounts[r.artist] = 0;
      artistCounts[r.artist] += 1;
      const ym = r.dateFmt.substring(0, 7);
      trendMap[ym] = (trendMap[ym] || 0) + 1;
    });

    const sortedSongs = Object.entries(counts).map(([songName, d]) => ({ songName, ...d })).sort((a, b) => b.count - a.count);

    let newSongsCount = 0;
    firstSeenMap.forEach((date, name) => { if (date >= startNum && date <= endNum) newSongsCount++; });

    const div = { mainstay: 0, favorite: 0, occasional: 0, firstTry: 0 };
    Object.values(artistCounts).forEach(c => {
      if (c > 10) div.mainstay++; else if (c >= 5) div.favorite++; else if (c >= 2) div.occasional++; else div.firstTry++;
    });

    const bubbleData = sortedSongs.slice(0, 20).map((s) => ({
      name: s.songName, count: s.count, latestYear: Math.floor(s.latestDate / 10000),
      x: firstSeenMap.get(s.songName) || 0, y: s.count, z: s.count
    }));

    return {
      topSongs: sortedSongs, totalPerformances: filtered.length, newSongsCount,
      uniqueArtistsCount: Object.keys(artistCounts).length,
      topArtistsChartData: Object.entries(artistCounts).map(([artist, count]) => ({ artist, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      trendData: Object.entries(trendMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      diversityData: [
        { name: t.stats_diversity_mainstay, value: div.mainstay, fill: '#fbbf24' },
        { name: t.stats_diversity_favorite, value: div.favorite, fill: '#a78bfa' },
        { name: t.stats_diversity_occasional, value: div.occasional, fill: '#60a5fa' },
        { name: t.stats_diversity_first, value: div.firstTry, fill: '#475569' },
      ].filter(d => d.value > 0),
      bubbleData
    };
  }, [normalizedRecords, startNum, endNum, t]);

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // ✅ 確保在掛載完成且數據準備好前顯示 Skeleton
  if (!isMounted || loading || !stats) return <StatsSkeleton />;

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar bg-slate-900 text-slate-100 pb-32">
      <div className="p-4 lg:p-8 pt-8 lg:pt-10 w-full max-w-[1200px] mx-auto">
        {/* 標題與篩選器 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">
            <BarChart2 className="text-blue-400" size={36} /> {t.stats_title}
          </h1>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              {['all', currentYear, lastYear].map(y => (
                <button key={y} onClick={() => {
                  if (y === 'all') { setUserStartDate(defaultStart); setUserEndDate(defaultEnd); }
                  else { setUserStartDate(`${y}-01-01`); setUserEndDate(`${y}-12-31`); }
                }} className={`px-4 py-2 text-sm rounded transition-colors ${userStartDate === (y === 'all' ? defaultStart : `${y}-01-01`) ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}>
                  {y === 'all' ? t.stats_quick_filter_all : t.stats_quick_filter_year.replace('{year}', y.toString())}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-2 px-3 shadow-inner">
              <Calendar size={16} className="text-slate-500" />
              <input type="date" value={userStartDate} onChange={e => setUserStartDate(e.target.value)} className="bg-transparent text-base outline-none [color-scheme:dark]" />
              <span className="text-slate-600 text-lg">→</span>
              <input type="date" value={userEndDate} onChange={e => setUserEndDate(e.target.value)} className="bg-transparent text-base outline-none [color-scheme:dark]" />
            </div>
          </div>
        </div>

        {/* 數據卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Mic2 className="text-emerald-400" size={20}/>} label={t.stats_card_total_performances} value={stats.totalPerformances} unit={t.stats_card_unit_times} />
          <StatCard icon={<ListMusic className="text-blue-400" size={20}/>} label={t.stats_card_song_library} value={stats.topSongs.length} unit={t.stats_card_unit_songs} />
          <StatCard icon={<Users className="text-purple-400" size={20}/>} label={t.stats_card_artists} value={stats.uniqueArtistsCount} unit={t.stats_card_unit_groups} />
          <div className="bg-slate-800/50 border border-emerald-500/30 p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Sparkles size={18} className="text-yellow-400" />
              <span className="text-sm font-medium">{t.stats_card_new_songs}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stats.newSongsCount} <span className="text-base font-normal text-slate-500">{t.stats_card_unit_songs}</span></div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-1000" style={{ width: `${Math.min((stats.newSongsCount / Math.max(stats.totalPerformances, 1)) * 500, 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {t.stats_new_song_ratio.replace('{ratio}', ((stats.newSongsCount / Math.max(stats.totalPerformances, 1)) * 100).toFixed(1))}
            </p>
          </div>
        </div>

        {/* 圖表第一排：趨勢圖與圓餅圖 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl min-w-0">
            <h2 className="text-base font-bold text-slate-300 flex items-center gap-2 mb-6"><TrendingUp size={20} /> {t.stats_chart_trend}</h2>
            <div className="h-[300px] w-full min-w-0">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <LineChart data={stats.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: "#10b981" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl min-w-0">
            <h2 className="text-base font-bold text-slate-300 flex items-center gap-2 mb-4"><PieIcon size={20} /> {t.stats_chart_diversity}</h2>
            <div className="h-[240px] w-full min-w-0 flex items-center justify-center">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <PieChart>
                    <Pie data={stats.diversityData} innerRadius={70} outerRadius={95} paddingAngle={5} dataKey="value">
                      {stats.diversityData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {stats.diversityData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  {d.name}: <span className="text-slate-200 font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 圖表第二排：氣泡圖與長條圖 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl min-w-0">
            <h2 className="text-base font-bold text-slate-300 flex items-center gap-2 mb-6"><Activity size={20} /> {t.stats_chart_bubble}</h2>
            <div className="h-[350px] w-full min-w-0">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" dataKey="x" domain={['dataMin', 'dataMax']} hide />
                    <YAxis type="number" dataKey="y" stroke="#94a3b8" fontSize={12} name={t.stats_table_count} unit={t.stats_card_unit_times} allowDecimals={false} tickCount={6} />
                    <ZAxis type="number" dataKey="z" range={[60, 500]} />
                    <Tooltip content={<CustomTooltip t={t} />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Songs" data={stats.bubbleData}>
                      {stats.bubbleData.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.latestYear >= currentYear ? '#fbbf24' : '#60a5fa'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1 text-yellow-400"><div className="w-2 h-2 bg-yellow-400 rounded-full"/> {t.stats_bubble_legend_current}</div>
              <div className="flex items-center gap-1 text-blue-400"><div className="w-2 h-2 bg-blue-400 rounded-full"/> {t.stats_bubble_legend_past}</div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl min-w-0">
            <h2 className="text-base font-bold text-slate-300 flex items-center gap-2 mb-6"><UserCheck size={20} /> {t.stats_chart_top_artists}</h2>
            <div className="h-[350px] w-full min-w-0">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart data={stats.topArtistsChartData} layout="vertical" margin={{ left: 30 }}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis dataKey="artist" type="category" stroke="#94a3b8" fontSize={12} width={140} interval={0} />
                    <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: '#334155', opacity: 0.4 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                      {stats.topArtistsChartData.map((entry, index) => (<Cell key={index} fill={entry.artist === "CULUA" ? "#fbbf24" : "#a78bfa"} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* 排行榜表格 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200"><Music2 className="text-emerald-400" /> {t.nav_songs}{t.sort_count}</h2>
            <span className="text-sm text-slate-500 font-medium">{t.total_songs.replace('{count}', stats.topSongs.length.toString())}</span>
          </div>
          <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
            <table className="w-full text-left text-base">
              <thead className="bg-slate-800/50 text-slate-400 sticky top-0 font-bold">
                <tr>
                  <th className="px-8 py-5 w-24">#</th>
                  <th className="px-8 py-5">{t.stats_table_song}</th>
                  <th className="px-8 py-5">{t.stats_table_artist}</th>
                  <th className="px-8 py-5 text-right">{t.stats_table_count}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.topSongs.map((song, i) => (
                  <tr key={song.songName} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      {i < 3 ? <span className="text-yellow-500 font-extrabold text-lg">0{i+1}</span> : <span className="text-slate-500 font-medium">{i+1}</span>}
                    </td>
                    <td className="px-8 py-5 font-semibold text-slate-100">{song.songName}</td>
                    <td className="px-8 py-5 text-slate-400 font-medium">{song.artist}</td>
                    <td className="px-8 py-5 text-right text-emerald-400 font-black text-lg">{song.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit }: any) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl shadow-lg flex flex-col justify-center">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value} <span className="text-base font-normal text-slate-500">{unit}</span></div>
    </div>
  );
}