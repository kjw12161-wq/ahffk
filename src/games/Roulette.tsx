import { useState, useRef, useEffect } from "react";

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const ROULETTE_NUMBERS = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];

interface RouletteProps { balance: number; onWin: (amt: number) => void; onLose: (amt: number) => void; }

type BetType = "red" | "black" | "green" | "odd" | "even" | "1-18" | "19-36" | number;

export default function Roulette({ balance, onWin, onLose }: RouletteProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [bets, setBets] = useState<{type: BetType; amount: number}[]>([]);
  const [lastBets, setLastBets] = useState<{type: BetType; amount: number}[]>([]);
  const [selectedChip, setSelectedChip] = useState(10);
  const [message, setMessage] = useState("");
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  function addBet(type: BetType) {
    if (spinning) return;
    if (selectedChip > balance - totalBet) { setMessage("칩이 부족합니다!"); return; }
    setBets(prev => {
      const existing = prev.find(b => b.type === type);
      if (existing) return prev.map(b => b.type === type ? {...b, amount: b.amount + selectedChip} : b);
      return [...prev, {type, amount: selectedChip}];
    });
    setMessage("");
  }

  function clearBets() { if (!spinning) { setBets([]); setMessage(""); } }

  function repeatBets() {
    if (spinning || lastBets.length === 0) return;
    const total = lastBets.reduce((s, b) => s + b.amount, 0);
    if (total > balance) { setMessage("칩이 부족합니다!"); return; }
    setBets([...lastBets]);
    setMessage("");
  }

  function spin() {
    if (spinning || bets.length === 0) { setMessage("베팅을 먼저 하세요!"); return; }
    if (totalBet > balance) { setMessage("칩이 부족합니다!"); return; }

    setSpinning(true);
    setResult(null);
    setMessage("");

    const resultNum = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
    const resultIdx = ROULETTE_NUMBERS.indexOf(resultNum);
    const segAngle = 360 / ROULETTE_NUMBERS.length;
    const extraSpins = (5 + Math.floor(Math.random() * 5)) * 360;
    const targetAngle = extraSpins + (resultIdx * segAngle);

    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setResult(resultNum);
      setSpinning(false);

      let winnings = 0;
      const isRed = RED_NUMBERS.includes(resultNum);
      const isBlack = resultNum !== 0 && !isRed;

      bets.forEach(bet => {
        if (bet.type === "red" && isRed) winnings += bet.amount * 2;
        else if (bet.type === "black" && isBlack) winnings += bet.amount * 2;
        else if (bet.type === "green" && resultNum === 0) winnings += bet.amount * 36;
        else if (bet.type === "odd" && resultNum !== 0 && resultNum % 2 === 1) winnings += bet.amount * 2;
        else if (bet.type === "even" && resultNum !== 0 && resultNum % 2 === 0) winnings += bet.amount * 2;
        else if (bet.type === "1-18" && resultNum >= 1 && resultNum <= 18) winnings += bet.amount * 2;
        else if (bet.type === "19-36" && resultNum >= 19 && resultNum <= 36) winnings += bet.amount * 2;
        else if (bet.type === resultNum) winnings += bet.amount * 36;
      });

      if (winnings > 0) {
        onWin(winnings - totalBet);
        setMessage(`🎉 ${resultNum}번! +${winnings - totalBet} 칩 획득!`);
      } else {
        onLose(totalBet);
        setMessage(`💔 ${resultNum}번... -${totalBet} 칩`);
      }
      setLastBets([...bets]);
      setBets([]);
    }, 4000);
  }

  const getNumberColor = (n: number) => {
    if (n === 0) return "#1e7e34";
    return RED_NUMBERS.includes(n) ? "#c0392b" : "#1a1a1a";
  };

  // Keyboard: Space to spin
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " ") { e.preventDefault(); spin(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const chips = [5, 10, 25, 50, 100];

  return (
    <div className="flex flex-col gap-6">
      {/* Wheel */}
      <div className="flex items-center justify-center">
        <div className="relative w-56 h-56">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 w-0 h-0"
            style={{borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "20px solid #c9a84c"}} />
          {/* Wheel */}
          <div
            ref={wheelRef}
            className="w-56 h-56 rounded-full border-4 border-yellow-600 relative overflow-hidden"
            style={{
              transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 1)" : "none",
              transform: `rotate(${rotation}deg)`,
              background: "conic-gradient(" + ROULETTE_NUMBERS.map((n, i) => {
                const pct1 = (i / ROULETTE_NUMBERS.length * 100).toFixed(2);
                const pct2 = ((i + 1) / ROULETTE_NUMBERS.length * 100).toFixed(2);
                const c = n === 0 ? "#1e7e34" : RED_NUMBERS.includes(n) ? "#8b1a1a" : "#111";
                return `${c} ${pct1}% ${pct2}%`;
              }).join(", ") + ")"
            }}
          >
            {/* Number labels */}
            {ROULETTE_NUMBERS.map((n, i) => {
              const angle = (i / ROULETTE_NUMBERS.length) * 360 + (0.5 / ROULETTE_NUMBERS.length) * 360;
              return (
                <div key={i} className="absolute inset-0 flex items-start justify-center"
                  style={{transform: `rotate(${angle}deg)`, transformOrigin: "center"}}>
                  <span className="text-white text-[7px] font-bold mt-2" style={{fontFamily: "JetBrains Mono"}}>
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Center */}
          <div className="absolute inset-[30%] rounded-full bg-yellow-900 border-2 border-yellow-500 flex items-center justify-center">
            {result !== null && !spinning && (
              <span className="text-white font-bold text-sm animate-reveal">{result}</span>
            )}
          </div>
        </div>
      </div>

      {/* Result display */}
      {result !== null && !spinning && (
        <div className="text-center">
          <span className="inline-block px-4 py-2 rounded-full text-sm font-bold"
            style={{background: getNumberColor(result), color: "white", fontFamily: "JetBrains Mono"}}>
            {result} {result === 0 ? "Green" : RED_NUMBERS.includes(result) ? "Red" : "Black"}
          </span>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`text-center font-semibold text-sm py-2 px-4 rounded-lg animate-reveal ${
          message.includes("🎉") ? "bg-yellow-900/40 text-yellow-300" : "bg-red-900/30 text-red-300"
        }`}>
          {message}
        </div>
      )}

      {/* Chip selector */}
      <div className="flex gap-2 justify-center flex-wrap">
        {chips.map(c => (
          <button key={c} onClick={() => setSelectedChip(c)}
            className="chip w-12 h-12 text-xs transition-all"
            style={{
              background: selectedChip === c ? "#c9a84c" : "#2a1f0a",
              color: selectedChip === c ? "#0a0f0a" : "#c9a84c",
              borderColor: "#c9a84c",
              transform: selectedChip === c ? "scale(1.15)" : "scale(1)",
              boxShadow: selectedChip === c ? "0 0 16px #c9a84c66" : "none"
            }}>
            {c}
          </button>
        ))}
      </div>

      {/* Betting board */}
      <div className="grid gap-2">
        {/* Outside bets */}
        <div className="grid grid-cols-3 gap-2">
          {(["red","black","green"] as BetType[]).map(t => {
            const bet = bets.find(b => b.type === t);
            return (
              <button key={String(t)} onClick={() => addBet(t)}
                className="py-3 rounded-lg font-bold text-sm relative transition-all hover:scale-105"
                style={{
                  background: t === "red" ? "#8b1a1a" : t === "black" ? "#111" : "#1e7e34",
                  border: bet ? "2px solid #c9a84c" : "2px solid #2a3f2a",
                  color: "white"
                }}>
                {t === "red" ? "빨강 (2x)" : t === "black" ? "검정 (2x)" : "0 (36x)"}
                {bet && <span className="absolute top-1 right-1 text-xs text-yellow-400 font-mono">{bet.amount}</span>}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["odd","even","1-18","19-36"] as BetType[]).map(t => {
            const bet = bets.find(b => b.type === t);
            return (
              <button key={String(t)} onClick={() => addBet(t)}
                className="py-2 rounded-lg font-medium text-sm relative transition-all hover:scale-105"
                style={{background: "#1a2e1a", border: bet ? "2px solid #c9a84c" : "2px solid #2a3f2a", color: "#f0ead6"}}>
                {t === "odd" ? "홀수 (2x)" : t === "even" ? "짝수 (2x)" : t === "1-18" ? "1-18 (2x)" : "19-36 (2x)"}
                {bet && <span className="absolute top-1 right-1 text-xs text-yellow-400 font-mono">{bet.amount}</span>}
              </button>
            );
          })}
        </div>

        {/* Number grid */}
        <div className="grid grid-cols-13 gap-0.5" style={{gridTemplateColumns: "repeat(13, 1fr)"}}>
          {Array.from({length: 36}, (_, i) => i + 1).map(n => {
            const bet = bets.find(b => b.type === n);
            return (
              <button key={n} onClick={() => addBet(n)}
                className="aspect-square text-[10px] font-bold rounded transition-all hover:scale-110 relative"
                style={{
                  background: RED_NUMBERS.includes(n) ? "#8b1a1a" : "#111",
                  border: bet ? "2px solid #c9a84c" : "1px solid #2a3f2a",
                  color: "white"
                }}>
                {n}
                {bet && <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full text-[7px] text-black flex items-center justify-center leading-none">{bet.amount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={clearBets} disabled={spinning}
          className="py-3 px-4 rounded-lg font-semibold text-sm transition-all hover:bg-red-900/40 disabled:opacity-40"
          style={{background: "#1a0a0a", border: "1px solid #3f1a1a", color: "#ef4444"}}>
          취소
        </button>
        {lastBets.length > 0 && (
          <button onClick={repeatBets} disabled={spinning}
            className="py-3 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-40"
            style={{background: "#0a1a2a", border: "1px solid #1a3f5a", color: "#70b0e0"}}>
            이전 베팅 반복
          </button>
        )}
        <button onClick={spin} disabled={spinning || bets.length === 0}
          className="flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all disabled:opacity-50 relative"
          style={{
            background: spinning ? "#3a2f10" : "linear-gradient(135deg, #c9a84c, #e8b84b)",
            color: "#0a0f0a",
            boxShadow: !spinning ? "0 4px 16px #c9a84c44" : "none"
          }}>
          {spinning ? "🎡 스핀 중..." : `스핀! (${totalBet}칩)`}
          {!spinning && <span className="absolute top-1 right-2 text-[10px] opacity-40">[Space]</span>}
        </button>
      </div>
    </div>
  );
}
