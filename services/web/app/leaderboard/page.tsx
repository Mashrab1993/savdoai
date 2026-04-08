"use client";
import { useState, useEffect } from "react";

export default function LeaderboardPage() {
  const [myStats, setMyStats] = useState<any>(null);
  const [board, setBoard] = useState<any[]>([]);
  const [davr, setDavr] = useState("hafta");
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || "/api";
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/gamification/me`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/gamification/leaderboard?davr=${davr}`, { headers: h }).then(r => r.ok ? r.json() : []),
    ]).then(([me, lb]) => { setMyStats(me); setBoard(lb); }).finally(() => setLoading(false));
  }, [davr]);

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" /></div>;

  const nextXP = myStats?.keyingi_xp || 0;
  const progress = nextXP > 0 ? Math.min(100, ((myStats?.xp || 0) / ((myStats?.xp || 0) + nextXP)) * 100) : 100;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* My Profile Card */}
      {myStats && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl">{myStats.daraja_emoji}</div>
              <div className="text-lg font-bold mt-1">{myStats.daraja_nomi}</div>
              <div className="text-sm opacity-80">Daraja {myStats.daraja}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{myStats.xp}</div>
              <div className="text-sm opacity-80">XP</div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs opacity-80 mb-1">
              <span>{myStats.daraja_nomi}</span>
              <span>{myStats.keyingi_daraja} ga {nextXP} XP qoldi</span>
            </div>
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div className="bg-white rounded-full h-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-4 text-sm">
            <span>🔥 {myStats.streak} kun streak</span>
            <span>🎖️ {myStats.badges_soni}/{myStats.jami_badges} badge</span>
          </div>
        </div>
      )}

      {/* Badges */}
      {myStats?.badges?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">🎖️ Badgelar</h3>
          <div className="flex flex-wrap gap-2">
            {myStats.badges.map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full">
                <span>{b.emoji}</span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{b.nomi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">🏆 Leaderboard</h2>
        <div className="flex gap-1">
          {[["hafta", "Hafta"], ["oy", "Oy"]].map(([k, l]: string[]) => (
            <button key={k} onClick={() => setDavr(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                davr === k ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600"
              }`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {board.map((r: any, i: number) => (
          <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border ${
            i < 3 ? "bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-900 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-gray-900"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">
                {r.medal ? <span className="text-xl">{r.medal}</span> : <span className="text-sm font-bold text-gray-400">{r.reyting}</span>}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span>{r.daraja_emoji}</span>
                  <span className="text-sm font-semibold">{r.nom}</span>
                  {r.streak >= 7 && <span className="text-xs">🔥{r.streak}</span>}
                </div>
                <div className="text-xs text-gray-500">{r.sotuv_soni} sotuv • {r.klient_soni} klient</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-600">{Number(r.jami_summa).toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">so&apos;m</div>
            </div>
          </div>
        ))}
        {board.length === 0 && <div className="text-center py-12 text-gray-400">Hali reyting yo&apos;q</div>}
      </div>
    </div>
  );
}
