import { useState, useEffect } from "react";
import Roulette from "./games/Roulette";
import ShellGame from "./games/ShellGame";
import DiceGame from "./games/DiceGame";
import SlotMachine from "./games/SlotMachine";
import Blackjack from "./games/Blackjack";
import Poker from "./games/Poker";

type GameId = "lobby" | "roulette" | "shell" | "dice" | "slots" | "blackjack" | "poker";

const GAMES = [
  { id: "roulette" as GameId, name: "룰렛", icon: "🎡", desc: "번호와 색상에 베팅하라", color: "#8b1a1a" },
  { id: "shell" as GameId, name: "야바위", icon: "🥤", desc: "공을 눈으로 쫓아라", color: "#1e5a2a" },
  { id: "dice" as GameId, name: "주사위", icon: "🎲", desc: "숫자를 맞춰라", color: "#1a3a6b" },
  { id: "slots" as GameId, name: "슬롯머신", icon: "🎰", desc: "행운의 심볼을 맞춰라", color: "#5a1a7a" },
  { id: "blackjack" as GameId, name: "블랙잭", icon: "🃏", desc: "21에 가장 가까운 자가 승리", color: "#1a4a3a" },
  { id: "poker" as GameId, name: "AI 딜러 포커", icon: "♣", desc: "AI 딜러와 노리밋 홀덤", color: "#6b1e2b" },
];

function WinPopup({ amount, onClose }: { amount: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="text-center animate-reveal pointer-events-auto">
        <div className="text-6xl mb-2">🎉</div>
        <div className="text-4xl font-black" style={{color: "#c9a84c", fontFamily: "Playfair Display",
          textShadow: "0 0 30px #c9a84c"}}>
          +{amount}
        </div>
        <div className="text-lg" style={{color: "#e8b84b"}}>칩 획득!</div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentGame, setCurrentGame] = useState<GameId>("lobby");
  const [balance, setBalance] = useState(1000);
  const [winPopup, setWinPopup] = useState<number | null>(null);
  const [history, setHistory] = useState<{game: string; amount: number; type: "win"|"lose"}[]>([]);

  function handleWin(amount: number) {
    setBalance(b => b + amount);
    setWinPopup(amount);
    const game = GAMES.find(g => g.id === currentGame);
    setHistory(prev => [{game: game?.name || "", amount, type: "win"}, ...prev].slice(0, 10));
    setTimeout(() => setWinPopup(null), 1800);
  }

  function handleLose(amount: number) {
    setBalance(b => Math.max(0, b - amount));
    const game = GAMES.find(g => g.id === currentGame);
    setHistory(prev => [{game: game?.name || "", amount, type: "lose"}, ...prev].slice(0, 10));
  }

  function refill() {
    setBalance(b => b + 500);
  }

  const currentGameObj = GAMES.find(g => g.id === currentGame);

  return (
    <div className="min-h-screen felt-texture" style={{fontFamily: "Inter, sans-serif"}}>
      {winPopup !== null && <WinPopup amount={winPopup} onClose={() => setWinPopup(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{background: "rgba(10,15,10,0.95)", borderBottom: "1px solid #2a3f2a",
          backdropFilter: "blur(12px)"}}>
        <button onClick={() => setCurrentGame("lobby")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">♠</span>
          <span className="font-black text-lg hidden sm:block"
            style={{color: "#c9a84c", fontFamily: "Playfair Display", letterSpacing: "0.05em"}}>
            ROYAL CASINO
          </span>
        </button>

        {/* Balance */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{background: "#1a2e1a", border: "1px solid #2a3f2a"}}>
            <span className="text-yellow-500">🪙</span>
            <span className="font-mono font-bold" style={{color: "#c9a84c", fontFamily: "JetBrains Mono"}}>
              {balance.toLocaleString()}
            </span>
          </div>
          {balance < 300 && (
            <button onClick={refill}
              className="px-3 py-2 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{background: "linear-gradient(135deg, #c9a84c, #e8b84b)", color: "#0a0f0a"}}>
              +500
            </button>
          )}
        </div>
      </header>

      <div className={`${currentGame === "poker" ? "max-w-6xl" : "max-w-lg"} mx-auto w-full px-4 pb-24`}>
        {currentGame === "lobby" ? (
          /* Lobby */
          <div className="pt-6">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">♠ ♥ ♦ ♣</div>
              <h1 className="text-4xl font-black mb-2 gold-text-glow"
                style={{fontFamily: "Playfair Display", color: "#c9a84c"}}>
                ROYAL CASINO
              </h1>
              <p className="text-sm" style={{color: "#8a9e8a"}}>행운이 당신 편이기를...</p>
            </div>

            {/* Balance card */}
            <div className="mb-6 p-4 rounded-2xl text-center"
              style={{background: "linear-gradient(135deg, #1a2e1a, #111a11)", border: "1px solid #2a3f2a"}}>
              <div className="text-xs uppercase tracking-widest mb-1" style={{color: "#8a9e8a"}}>보유 칩</div>
              <div className="text-5xl font-black" style={{color: "#c9a84c", fontFamily: "JetBrains Mono"}}>
                {balance.toLocaleString()}
              </div>
              {balance < 300 && (
                <button onClick={refill}
                  className="mt-3 px-6 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
                  style={{background: "linear-gradient(135deg, #c9a84c, #e8b84b)", color: "#0a0f0a"}}>
                  칩 500개 충전하기
                </button>
              )}
            </div>

            {/* Game grid */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {GAMES.map(game => (
                <button key={game.id} onClick={() => setCurrentGame(game.id)}
                  className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.02] hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${game.color}33, #111a11)`,
                    border: `1px solid ${game.color}55`,
                    boxShadow: `0 2px 20px ${game.color}22`
                  }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{background: `${game.color}44`, border: `1px solid ${game.color}66`}}>
                    {game.icon}
                  </div>
                  <div>
                    <div className="font-bold text-base" style={{color: "#f0ead6"}}>{game.name}</div>
                    <div className="text-sm" style={{color: "#8a9e8a"}}>{game.desc}</div>
                  </div>
                  <div className="ml-auto" style={{color: "#2a3f2a"}}>▶</div>
                </button>
              ))}
            </div>

            {/* Recent history */}
            {history.length > 0 && (
              <div className="p-4 rounded-2xl" style={{background: "#111a11", border: "1px solid #2a3f2a"}}>
                <div className="text-xs uppercase tracking-widest mb-3" style={{color: "#8a9e8a"}}>최근 기록</div>
                <div className="flex flex-col gap-1">
                  {history.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-sm py-1"
                      style={{borderBottom: i < 4 ? "1px solid #1a2e1a" : "none"}}>
                      <span style={{color: "#8a9e8a"}}>{h.game}</span>
                      <span className="font-mono font-bold" style={{
                        color: h.type === "win" ? "#4ade80" : "#ef4444",
                        fontFamily: "JetBrains Mono"
                      }}>
                        {h.type === "win" ? "+" : "-"}{h.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Game view */
          <div className="pt-4">
            {/* Game header */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setCurrentGame("lobby")}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{background: "#1a2e1a", border: "1px solid #2a3f2a", color: "#c9a84c"}}>
                ←
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentGameObj?.icon}</span>
                <h2 className="text-xl font-black" style={{fontFamily: "Playfair Display", color: "#c9a84c"}}>
                  {currentGameObj?.name}
                </h2>
              </div>
            </div>

            {/* Game content */}
            <div className="rounded-2xl p-4" style={{background: "#111a11", border: "1px solid #2a3f2a"}}>
              {currentGame === "roulette" && (
                <Roulette balance={balance} onWin={handleWin} onLose={handleLose} />
              )}
              {currentGame === "shell" && (
                <ShellGame balance={balance} onWin={handleWin} onLose={handleLose} />
              )}
              {currentGame === "dice" && (
                <DiceGame balance={balance} onWin={handleWin} onLose={handleLose} />
              )}
              {currentGame === "slots" && (
                <SlotMachine balance={balance} onWin={handleWin} onLose={handleLose} />
              )}
              {currentGame === "blackjack" && (
                <Blackjack balance={balance} onWin={handleWin} onLose={handleLose} />
              )}
              {currentGame === "poker" && (
                <Poker balance={balance} onWin={handleWin} onLose={handleLose} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40"
        style={{background: "rgba(10,15,10,0.97)", borderTop: "1px solid #2a3f2a", backdropFilter: "blur(12px)"}}>
        <div className="max-w-lg mx-auto flex items-center justify-start sm:justify-around gap-1 overflow-x-auto py-2 px-2">
          <button
            onClick={() => setCurrentGame("lobby")}
            className="flex shrink-0 flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{
              color: currentGame === "lobby" ? "#c9a84c" : "#8a9e8a",
              background: currentGame === "lobby" ? "#1a2e1a" : "transparent"
            }}>
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-semibold">로비</span>
          </button>
          {GAMES.map(game => (
            <button
              key={game.id}
              onClick={() => setCurrentGame(game.id)}
              className="flex shrink-0 flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{
                color: currentGame === game.id ? "#c9a84c" : "#8a9e8a",
                background: currentGame === game.id ? "#1a2e1a" : "transparent"
              }}>
              <span className="text-lg">{game.icon}</span>
              <span className="text-[10px] font-semibold">{game.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
