"use client";
import { useState, useEffect } from "react";
import { PageLoading } from "@/components/shared/page-states"
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function LeaderboardPage() {
  const [myStats, setMyStats] = useState<any>(null);
  const [board, setBoard] = useState<any[]>([]);
  const [davr, setDavr] = useState("hafta");
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/gamification/me`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/gamification/leaderboard?davr=${davr}`, { headers: h }).then(r => r.ok ? r.json() : []),
    ]).then(([me, lb]) => { setMyStats(me); setBoard(lb); }).finally(() => setLoading(false));
  }, [davr]);

  if (loading) return <PageLoading />;

  const nextXP = myStats?.keyingi_xp || 0;
  const progress = nextXP > 0 ? Math.min(100, ((myStats?.xp || 0) / ((myStats?.xp || 0) + nextXP)) * 100) : 100;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      <PageHeader
        icon={Trophy}
        gradient="amber"
        title="Leaderboard"
        subtitle="Gamification — reyting va yutuqlar"
      />
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
            <div className="bg-card/20 rounded-full h-3 overflow-hidden">
              <div className="bg-card rounded-full h-full transition-all" style={{ width: `${progress}%` }} />
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
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/40 rounded-full">
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
                davr === k ? "bg-primary text-primary-foreground" : "bg-muted dark:bg-muted text-muted-foreground"
              }`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {board.map((r: any, i: number) => (
          <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border ${
            i < 3 ? "bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/10 dark:to-card border-amber-200 dark:border-amber-500/40" : "bg-card"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">
                {r.medal ? <span className="text-xl">{r.medal}</span> : <span className="text-sm font-bold text-muted-foreground">{r.reyting}</span>}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span>{r.daraja_emoji}</span>
                  <span className="text-sm font-semibold">{r.nom}</span>
                  {r.streak >= 7 && <span className="text-xs">🔥{r.streak}</span>}
                </div>
                <div className="text-xs text-muted-foreground">{r.sotuv_soni} sotuv • {r.klient_soni} klient</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-600">{Number(r.jami_summa).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">so&apos;m</div>
            </div>
          </div>
        ))}
        {board.length === 0 && <div className="text-center py-12 text-muted-foreground">Hali reyting yo&apos;q</div>}
      </div>
    </div>
  );
}
