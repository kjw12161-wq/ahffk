import { useEffect, useRef, useState } from "react";

interface SlotMachineProps { balance: number; onWin: (amt: number) => void; onLose: (amt: number) => void; }
type SpinResult = { symbols: string[]; multiplier: number; profit: number; label: string };

const SYMBOLS = ["🍒", "🍋", "🍊", "⭐", "💎", "7️⃣", "🔔", "🍀"];
const WEIGHTS = [4, 4, 3, 3, 1, 1, 2, 2];
const PAYOUTS: Record<string, number> = { "7️⃣": 100, "💎": 60, "🍀": 40, "⭐": 20, "🔔": 15, "🍊": 10, "🍋": 6, "🍒": 4 };
const BETS = [5, 10, 25, 50, 100, 200];
const REELS = 4;
const ROWS = 3;

function pickSymbol() { const total = WEIGHTS.reduce((sum, weight) => sum + weight, 0); let roll = Math.random() * total; for (let index = 0; index < SYMBOLS.length; index++) { roll -= WEIGHTS[index]; if (roll <= 0) return SYMBOLS[index]; } return SYMBOLS[0]; }
function makeReels() { return Array.from({ length: REELS }, () => Array.from({ length: ROWS }, pickSymbol)); }
function evaluate(symbols: string[], bet: number): SpinResult {
  const center = symbols[0];
  const count = symbols.filter(symbol => symbol === center).length;
  const multiplier = count >= 3 ? (count === 4 ? PAYOUTS[center] : Math.max(1, Math.floor(PAYOUTS[center] / 5))) : 0;
  const profit = multiplier ? Math.floor(bet * multiplier) - bet : -bet;
  return { symbols, multiplier, profit, label: multiplier ? `${center} ${count === 4 ? "4개 잭팟" : "3개 적중"}` : "아쉽네요" };
}

export default function SlotMachine({ balance, onWin, onLose }: SlotMachineProps) {
  const [reels, setReels] = useState<string[][]>(makeReels);
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [autoSpins, setAutoSpins] = useState(0);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [message, setMessage] = useState("중앙 라인에 행운의 심볼을 맞추세요.");
  const [history, setHistory] = useState<SpinResult[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const autoRef = useRef(0);
  const spinRef = useRef<() => void>(() => undefined);

  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }

  function spin() {
    if (spinning) return;
    if (bet > balance) { setMessage("카지노 칩이 부족합니다. 베팅을 낮추거나 충전하세요."); setAutoSpins(0); autoRef.current = 0; return; }
    clearTimers();
    const finalReels = makeReels();
    const centerResults = finalReels.map(reel => reel[1]);
    setSpinning(true); setLastResult(null); setMessage("릴이 돌아갑니다...");
    setReels(makeReels());
    const frameTimer = setInterval(() => setReels(current => current.map((_, column) => [pickSymbol(), pickSymbol(), pickSymbol()].map((symbol, row) => row === 1 ? symbol : SYMBOLS[(Date.now() + column + row) % SYMBOLS.length]))), 70);
    timers.current.push(setTimeout(() => clearInterval(frameTimer), 1950));
    [700, 1050, 1400, 1750].forEach((delay, column) => {
      timers.current.push(setTimeout(() => setReels(current => current.map((reel, index) => index === column ? finalReels[column] : reel)), delay));
    });
    timers.current.push(setTimeout(() => {
      clearInterval(frameTimer);
      const result = evaluate(centerResults, bet);
      setReels(finalReels); setLastResult(result); setSpinning(false);
      setHistory(current => [result, ...current].slice(0, 6));
      if (result.multiplier) { onWin(result.profit); setMessage(result.multiplier >= 40 ? `🏆 JACKPOT! ${result.label} · +${result.profit.toLocaleString()} 칩` : `🎉 ${result.label} · +${result.profit.toLocaleString()} 칩`); }
      else { onLose(bet); setMessage(`💔 ${result.label} · -${bet.toLocaleString()} 칩`); }
      if (autoRef.current > 0) { autoRef.current -= 1; setAutoSpins(autoRef.current); if (autoRef.current > 0) timers.current.push(setTimeout(spin, 900)); }
    }, 2050));
  }

  function toggleAuto() { const next = autoSpins > 0 ? 0 : 10; autoRef.current = next; setAutoSpins(next); if (next > 0 && !spinning) spin(); }
  spinRef.current = spin;
  useEffect(() => { function onKey(event: KeyboardEvent) { if (event.key === " " && event.target === document.body) { event.preventDefault(); spinRef.current(); } } window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  useEffect(() => () => clearTimers(), []);
  const canBet = balance >= bet;
  const centerLine = reels.map(reel => reel[1]);

  return <div className="flex flex-col gap-5 items-center">
    <div className="w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(180deg,#241208,#0d0a05)", border: "3px solid #c9a84c", boxShadow: "0 0 40px #c9a84c22, inset 0 2px 0 #e8b84b" }}>
      <div className="flex items-center justify-between px-4 pt-4"><div><div className="text-xl font-black" style={{ color: "#e8b84b", fontFamily: "Georgia, serif" }}>ROYAL FORTUNE</div><div className="text-[10px] tracking-[3px]" style={{ color: "#8a7040" }}>FOUR REELS · CENTER LINE PAYS</div></div><div className="text-right text-xs" style={{ color: "#8a7040" }}>BET <b style={{ color: "#e8b84b" }}>{bet}</b><br />CREDIT <b style={{ color: "#e8b84b" }}>{balance.toLocaleString()}</b></div></div>
      <div className="mx-3 mt-4 mb-3 rounded-xl p-2 relative" style={{ background: "#050505", border: "2px solid #3a2f10" }}>
        <div className="absolute left-2 right-2 top-1/2 h-16 -translate-y-1/2 pointer-events-none rounded-lg" style={{ borderTop: "1px solid #e8b84b88", borderBottom: "1px solid #e8b84b88", background: "linear-gradient(90deg,#c9a84c08,#c9a84c22,#c9a84c08)", boxShadow: lastResult?.multiplier ? "0 0 20px #c9a84c55" : "none" }} />
        <div className="grid grid-cols-4 gap-1 relative z-10">{reels.map((reel, column) => <div key={column} className="grid grid-rows-3 gap-1 rounded-lg overflow-hidden" style={{ border: spinning ? "1px solid #6b531c" : "1px solid #2a3f2a" }}>{reel.map((symbol, row) => <div key={row} className={`flex items-center justify-center bg-[#111] text-3xl sm:text-4xl ${spinning ? "blur-[1px]" : ""} ${row === 1 && lastResult?.multiplier ? "animate-pulse-glow" : ""}`} style={{ height: "clamp(58px, 10vw, 78px)" }}>{symbol}</div>)}</div>)}</div>
        <div className="grid grid-cols-4 mt-1 text-center text-[9px] tracking-widest" style={{ color: "#4a3b1b" }}>{[1,2,3,4].map(number => <span key={number}>R{number}</span>)}</div>
      </div>
      <div className="mx-3 mb-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs" style={{ background: "#0a0a0a", color: "#9a885c" }}><span>중앙 라인</span><span className="text-lg tracking-widest">{centerLine.join(" ")}</span><span>{lastResult?.multiplier ? `x${lastResult.multiplier}` : "-"}</span></div>
      <div className="mx-3 mb-3 rounded-xl p-3" style={{ background: "#0a0a0a", border: "1px solid #1a1a0a" }}><div className="mb-2 text-center text-[10px] tracking-widest" style={{ color: "#6f5d35" }}>PAYTABLE · 3 / 4 MATCHES</div><div className="grid grid-cols-2 gap-1">{SYMBOLS.map(symbol => <div key={symbol} className="flex items-center justify-between rounded bg-[#111] px-2 py-1 text-xs"><span>{symbol} {symbol}{symbol}</span><b style={{ color: "#c9a84c" }}>x{Math.max(1, Math.floor(PAYOUTS[symbol] / 5))}</b><span>{symbol}{symbol}{symbol}{symbol}</span><b style={{ color: "#e8b84b" }}>x{PAYOUTS[symbol]}</b></div>)}</div></div>
    </div>
    <div className={`min-h-10 w-full rounded-full px-6 py-2 text-center text-sm font-semibold ${lastResult?.multiplier ? "bg-yellow-900/40 text-yellow-300" : lastResult ? "bg-red-900/30 text-red-300" : "text-gray-400"}`}>{message}</div>
    <div className="w-full flex flex-col gap-3"><div className="flex flex-wrap justify-center gap-2">{BETS.map(value => <button key={value} onClick={() => setBet(Math.min(value, Math.max(5, balance)))} disabled={spinning} className="chip h-11 w-11 text-xs disabled:opacity-40" style={{ background: bet === value ? "#c9a84c" : "#2a1f0a", color: bet === value ? "#0a0f0a" : "#c9a84c", borderColor: "#c9a84c", transform: bet === value ? "scale(1.1)" : "scale(1)" }}>{value}</button>)}</div><div className="flex gap-2"><button onClick={spin} disabled={spinning || !canBet} className="relative flex-1 rounded-xl py-4 text-lg font-bold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45" style={{ background: spinning ? "#3a2f10" : "linear-gradient(135deg,#c9a84c,#e8b84b)", color: "#0a0f0a", boxShadow: canBet && !spinning ? "0 4px 24px #c9a84c55" : "none", fontFamily: "Georgia, serif" }}>{spinning ? "🎰 릴 정지 중..." : `SPIN · ${bet} 칩`}<span className="absolute right-3 top-1 text-[10px] opacity-45">[Space]</span></button><button onClick={toggleAuto} disabled={!canBet && autoSpins === 0} className="min-w-20 rounded-xl px-3 py-4 text-sm font-bold disabled:opacity-40" style={{ background: autoSpins ? "#6b2a2a" : "#1a2e1a", border: `2px solid ${autoSpins ? "#c04040" : "#2a3f2a"}`, color: autoSpins ? "#ee9090" : "#8a9e8a" }}>{autoSpins ? `자동 ${autoSpins}` : "자동 10회"}</button></div></div>
    {history.length > 0 && <div className="w-full rounded-xl p-3" style={{ background: "#111a11", border: "1px solid #2a3f2a" }}><div className="mb-2 text-[10px] tracking-widest" style={{ color: "#8a9e8a" }}>최근 스핀</div><div className="grid grid-cols-3 gap-2 text-center text-xs">{history.slice(0, 6).map((result, index) => <div key={index} className="rounded-lg bg-black/20 px-1 py-2"><div className="truncate">{result.symbols.join(" ")}</div><b className={result.profit >= 0 ? "text-green-300" : "text-red-300"}>{result.profit >= 0 ? "+" : ""}{result.profit}</b></div>)}</div></div>}
  </div>;
}
