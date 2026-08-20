import { useState, useEffect, useRef } from "react";

interface SlotMachineProps { balance: number; onWin: (amt: number) => void; onLose: (amt: number) => void; }

const SYMBOLS = ["🍒", "🍋", "🍊", "⭐", "💎", "7️⃣", "🔔", "🍀"];
const WEIGHTS =  [  4,    4,    3,    3,    1,    1,    2,    2];

// 4-reel payouts
const PAYOUTS: Record<string, number> = {
  "7️⃣7️⃣7️⃣7️⃣": 100,
  "💎💎💎💎": 60,
  "🍀🍀🍀🍀": 40,
  "⭐⭐⭐⭐": 20,
  "🔔🔔🔔🔔": 15,
  "🍊🍊🍊🍊": 10,
  "🍋🍋🍋🍋": 6,
  "🍒🍒🍒🍒": 4,
  "7️⃣7️⃣7️⃣": 20,
  "💎💎💎": 12,
  "🍀🍀🍀": 8,
  "⭐⭐⭐": 5,
  "🔔🔔🔔": 4,
  "🍊🍊🍊": 3,
  "🍋🍋🍋": 2,
  "🍒🍒🍒": 1.5,
};

function weightedSymbol(): string {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

const NUM_REELS = 4;
const VISIBLE_ROWS = 3; // rows visible per reel

export default function SlotMachine({ balance, onWin, onLose }: SlotMachineProps) {
  // Each reel holds VISIBLE_ROWS symbols
  const initReels = () => Array.from({length: NUM_REELS}, () =>
    Array.from({length: VISIBLE_ROWS}, (_, i) => SYMBOLS[i % SYMBOLS.length])
  );

  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[][]>(initReels);
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState("행운을 빌어요!");
  const [winLine, setWinLine] = useState(false);
  const [jackpot, setJackpot] = useState(false);
  const [stoppedReels, setStoppedReels] = useState<boolean[]>([false,false,false,false]);
  const [autoSpin, setAutoSpin] = useState(false);
  const autoRef = useRef(false);

  function spin() {
    if (spinning) return;
    if (bet > balance) { setMessage("칩이 부족합니다!"); return; }
    setSpinning(true);
    setWinLine(false);
    setJackpot(false);
    setMessage("돌아가라...");
    setStoppedReels([false,false,false,false]);

    // Pick final results for top row
    const results = Array.from({length: NUM_REELS}, () => weightedSymbol());

    // Animate: random cycling
    let frame = 0;
    const animFrame = setInterval(() => {
      frame++;
      setReels(Array.from({length: NUM_REELS}, (_, col) => [
        SYMBOLS[(frame + col * 3) % SYMBOLS.length],
        SYMBOLS[(frame + col * 3 + 1) % SYMBOLS.length],
        SYMBOLS[(frame + col * 3 + 2) % SYMBOLS.length],
      ]));
      if (frame >= 60) clearInterval(animFrame);
    }, 60);

    // Stop reels one by one
    [900, 1300, 1700, 2100].forEach((delay, col) => {
      setTimeout(() => {
        setReels(prev => prev.map((reel, i) =>
          i === col
            ? [results[col], SYMBOLS[(col * 2 + 1) % SYMBOLS.length], SYMBOLS[(col * 2 + 2) % SYMBOLS.length]]
            : reel
        ));
        setStoppedReels(prev => prev.map((v, i) => i === col ? true : v));
      }, delay);
    });

    // Final evaluation
    setTimeout(() => {
      setSpinning(false);
      setStoppedReels([true,true,true,true]);
      // Auto-spin continues after result
      setTimeout(() => { if (autoRef.current) spin(); }, 800);

      const key4 = results.join("");
      const key3 = results.slice(0, 3).join("");
      const allSame4 = results.every(s => s === results[0]);
      const allSame3 = results.slice(0,3).every(s => s === results[0]);

      let multiplier = 0;
      let matchKey = "";
      if (allSame4 && PAYOUTS[key4]) { multiplier = PAYOUTS[key4]; matchKey = key4; }
      else if (allSame3 && PAYOUTS[key3]) { multiplier = PAYOUTS[key3]; matchKey = key3; }

      if (multiplier > 0) {
        const profit = Math.floor(bet * multiplier) - bet;
        onWin(profit);
        setWinLine(true);
        if (multiplier >= 40) {
          setJackpot(true);
          setMessage(`🏆 JACKPOT! x${multiplier} = +${profit} 칩!!!`);
        } else {
          setMessage(`🎉 ${matchKey} x${multiplier} = +${profit} 칩!`);
        }
      } else {
        onLose(bet);
        setMessage(`💔 아쉽네요... -${bet} 칩`);
      }
    }, 2500);
  }

  // Keyboard: Space to spin
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " ") { e.preventDefault(); spin(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function toggleAutoSpin() {
    const next = !autoSpin;
    setAutoSpin(next);
    autoRef.current = next;
    if (next && !spinning) spin();
  }

  const payout4 = Object.entries(PAYOUTS).filter(([k]) => k.split("").filter(c => c !== "️" && ["🍒","🍋","🍊","⭐","💎","7️⃣","🔔","🍀"].some(s=>k.startsWith(s))).length > 3 || [...k].filter(s=>SYMBOLS.includes(s)).length === 4);

  return (
    <div className="flex flex-col gap-5 items-center">
      {/* Cabinet */}
      <div className="w-full rounded-2xl overflow-hidden"
        style={{background: "linear-gradient(180deg, #1a0f05, #0d0a05)", border: "3px solid #c9a84c",
          boxShadow: "0 0 40px #c9a84c22, inset 0 2px 0 #e8b84b"}}>

        {/* Top neon */}
        <div className="flex justify-center items-center gap-3 pt-4 pb-1">
          {["🎰","✨","💎","✨","🎰"].map((e, i) => (
            <span key={i} className="text-xl">{e}</span>
          ))}
        </div>
        <div className="text-center text-xs font-black tracking-[0.2em] pb-3"
          style={{color: "#c9a84c", fontFamily: "Playfair Display"}}>
          ROYAL FORTUNE — 4 REELS
        </div>

        {/* 4-reel display */}
        <div className="mx-3 mb-3 rounded-xl overflow-hidden relative"
          style={{background: "#060606", border: "2px solid #2a1f0a"}}>

          {/* Win line highlight */}
          {winLine && (
            <div className="absolute inset-x-0 z-10 animate-pulse-glow pointer-events-none"
              style={{top: "33.33%", height: "33.34%",
                background: "linear-gradient(90deg, transparent 2%, #c9a84c22 20%, #c9a84c33 50%, #c9a84c22 80%, transparent 98%)",
                borderTop: "1px solid #c9a84c66", borderBottom: "1px solid #c9a84c66"}} />
          )}

          {/* Reel separator lines */}
          <div className="grid gap-0 p-2" style={{gridTemplateColumns: "repeat(4, 1fr)", gap: "3px"}}>
            {reels.map((reel, col) => (
              <div key={col} className="flex flex-col rounded-lg overflow-hidden"
                style={{gap: "2px", border: stoppedReels[col] ? "1px solid #2a3f2a" : "1px solid #3a2f10"}}>
                {reel.map((sym, row) => (
                  <div key={row}
                    className="flex items-center justify-center"
                    style={{
                      height: 64,
                      background: row === 0 && winLine ? "#c9a84c0d" : "#111",
                      fontSize: "1.8rem",
                      transition: stoppedReels[col] ? "background 0.3s" : "none",
                      filter: !stoppedReels[col] && spinning ? "blur(1px)" : "none",
                    }}>
                    {sym}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Reel labels */}
          <div className="grid px-2 pb-1" style={{gridTemplateColumns: "repeat(4, 1fr)", gap: "3px"}}>
            {[1,2,3,4].map(n => (
              <div key={n} className="text-center text-[10px]"
                style={{color: "#3a2f1a", fontFamily: "JetBrains Mono"}}>
                R{n}
              </div>
            ))}
          </div>
        </div>

        {/* Jackpot banner */}
        {jackpot && (
          <div className="mx-3 mb-3 py-3 rounded-xl text-center font-black text-xl animate-pulse-glow animate-reveal"
            style={{background: "linear-gradient(135deg, #7b2d00, #c9a84c, #7b2d00)", color: "#fff",
              fontFamily: "Playfair Display", letterSpacing: "0.05em"}}>
            🏆 JACKPOT! 🏆
          </div>
        )}

        {/* Payout table */}
        <div className="mx-3 mb-3 p-3 rounded-xl" style={{background: "#0a0a0a", border: "1px solid #1a1a0a"}}>
          <div className="text-[10px] uppercase tracking-widest mb-2 text-center" style={{color: "#5a4a2a"}}>페이아웃</div>
          <div className="grid grid-cols-2 gap-1">
            {[
              ["7️⃣7️⃣7️⃣7️⃣", 100], ["💎💎💎💎", 60],
              ["🍀🍀🍀🍀", 40],  ["⭐⭐⭐⭐", 20],
              ["7️⃣7️⃣7️⃣", 20],   ["💎💎💎", 12],
              ["🍀🍀🍀", 8],    ["⭐⭐⭐", 5],
            ].map(([combo, mult]) => (
              <div key={String(combo)} className="flex items-center justify-between text-xs px-2 py-1 rounded"
                style={{background: "#111"}}>
                <span className="text-sm">{combo}</span>
                <span className="font-bold" style={{color: "#c9a84c", fontFamily: "JetBrains Mono"}}>x{mult}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message */}
      <div className={`text-center font-semibold text-sm py-2 px-6 rounded-full ${
        message.includes("🎉") || message.includes("JACKPOT") || message.includes("🏆")
          ? "bg-yellow-900/40 text-yellow-300"
          : message.includes("💔") ? "bg-red-900/30 text-red-300"
          : "text-muted-foreground"
      }`}>
        {message}
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex gap-2 justify-center flex-wrap">
          {[5, 10, 25, 50, 100].map(c => (
            <button key={c} onClick={() => setBet(c)}
              className="chip w-12 h-12 text-xs"
              style={{
                background: bet === c ? "#c9a84c" : "#2a1f0a",
                color: bet === c ? "#0a0f0a" : "#c9a84c",
                borderColor: "#c9a84c",
                transform: bet === c ? "scale(1.1)" : "scale(1)",
              }}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={spin} disabled={spinning}
            className="flex-1 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative"
            style={{
              background: spinning ? "#3a2f10" : "linear-gradient(135deg, #c9a84c, #e8b84b)",
              color: "#0a0f0a",
              boxShadow: !spinning ? "0 4px 24px #c9a84c55" : "none",
              fontFamily: "Playfair Display"
            }}>
            {spinning ? "🎰 스핀 중..." : `SPIN (${bet} 칩)`}
            {!spinning && <span className="absolute top-1 right-3 text-[10px] opacity-40">[Space]</span>}
          </button>
          <button onClick={toggleAutoSpin}
            className="px-4 py-4 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: autoSpin ? "linear-gradient(135deg, #4a1e1e, #6b2a2a)" : "#1a2e1a",
              border: autoSpin ? "2px solid #c04040" : "2px solid #2a3f2a",
              color: autoSpin ? "#ee9090" : "#8a9e8a",
              minWidth: 72
            }}>
            {autoSpin ? "자동 ●" : "자동"}
          </button>
        </div>
      </div>
    </div>
  );
}
