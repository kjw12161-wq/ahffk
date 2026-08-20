import { useState, useEffect } from "react";

interface DiceGameProps { balance: number; onWin: (amt: number) => void; onLose: (amt: number) => void; }

type DiceBetType = "exact" | "high" | "low" | "odd" | "even";

const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function DiceFace({ value, size = 80 }: { value: number; size?: number }) {
  const dots = DICE_DOTS[value] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="4" y="4" width="92" height="92" rx="16"
        fill="url(#diceGrad)" stroke="#c9a84c" strokeWidth="2" />
      <defs>
        <linearGradient id="diceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
      </defs>
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="7" fill="#1a0a0a" />
      ))}
    </svg>
  );
}

export default function DiceGame({ balance, onWin, onLose }: DiceGameProps) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [displayDice, setDisplayDice] = useState(1);
  const [betType, setBetType] = useState<DiceBetType>("high");
  const [exactGuess, setExactGuess] = useState(1);
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState("");

  function roll() {
    if (bet > balance) { setMessage("칩이 부족합니다!"); return; }
    setRolling(true);
    setResult(null);
    setMessage("");

    let frames = 0;
    const animate = () => {
      setDisplayDice(Math.floor(Math.random() * 6) + 1);
      frames++;
      if (frames < 20) setTimeout(animate, 80 + frames * 5);
      else {
        const finalResult = Math.floor(Math.random() * 6) + 1;
        setDisplayDice(finalResult);
        setResult(finalResult);
        setRolling(false);

        let won = false;
        let multiplier = 1;

        if (betType === "exact" && finalResult === exactGuess) { won = true; multiplier = 6; }
        else if (betType === "high" && finalResult >= 4) { won = true; multiplier = 2; }
        else if (betType === "low" && finalResult <= 3) { won = true; multiplier = 2; }
        else if (betType === "odd" && finalResult % 2 === 1) { won = true; multiplier = 2; }
        else if (betType === "even" && finalResult % 2 === 0) { won = true; multiplier = 2; }

        if (won) {
          const profit = bet * multiplier - bet;
          onWin(profit);
          setMessage(`🎲 ${finalResult}! +${profit} 칩 획득!`);
        } else {
          onLose(bet);
          setMessage(`💔 ${finalResult}... -${bet} 칩`);
        }
      }
    };
    animate();
  }

  const betOptions: {type: DiceBetType; label: string; odds: string}[] = [
    {type: "high", label: "하이 (4-6)", odds: "2x"},
    {type: "low", label: "로우 (1-3)", odds: "2x"},
    {type: "odd", label: "홀수", odds: "2x"},
    {type: "even", label: "짝수", odds: "2x"},
    {type: "exact", label: "정확한 숫자", odds: "6x (5x 수익)"},
  ];

  // Keyboard: Space to roll
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " ") { e.preventDefault(); roll(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col gap-6 items-center">
      {/* Dice display */}
      <div className="flex flex-col items-center gap-4">
        <div className={`transition-all ${rolling ? "animate-shake" : ""}`}
          style={{filter: rolling ? "drop-shadow(0 0 20px #c9a84c)" : "drop-shadow(0 4px 12px #0008)"}}>
          <DiceFace value={displayDice} size={120} />
        </div>
        {result !== null && !rolling && (
          <div className="text-2xl font-bold animate-reveal" style={{color: "#c9a84c", fontFamily: "Playfair Display"}}>
            {result}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`text-center font-semibold text-sm py-2 px-4 rounded-lg animate-reveal ${
          message.includes("🎲") ? "bg-yellow-900/40 text-yellow-300" : "bg-red-900/30 text-red-300"
        }`}>
          {message}
        </div>
      )}

      {/* Bet type */}
      <div className="w-full grid grid-cols-2 gap-2">
        {betOptions.map(opt => (
          <button key={opt.type} onClick={() => setBetType(opt.type)}
            className="py-3 px-4 rounded-xl text-sm font-semibold transition-all hover:scale-105 relative"
            style={{
              background: betType === opt.type ? "linear-gradient(135deg, #c9a84c22, #c9a84c11)" : "#1a2e1a",
              border: betType === opt.type ? "2px solid #c9a84c" : "2px solid #2a3f2a",
              color: betType === opt.type ? "#c9a84c" : "#8a9e8a",
              gridColumn: opt.type === "exact" ? "1 / -1" : undefined
            }}>
            {opt.label}
            <span className="absolute top-1 right-2 text-xs opacity-60">{opt.odds}</span>
          </button>
        ))}
      </div>

      {/* Exact number picker */}
      {betType === "exact" && (
        <div className="flex gap-2 justify-center animate-reveal">
          {[1,2,3,4,5,6].map(n => (
            <button key={n} onClick={() => setExactGuess(n)}
              className="transition-all hover:scale-110"
              style={{opacity: exactGuess === n ? 1 : 0.5,
                filter: exactGuess === n ? "drop-shadow(0 0 8px #c9a84c)" : "none"}}>
              <DiceFace value={n} size={44} />
            </button>
          ))}
        </div>
      )}

      {/* Bet amount */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex gap-2 justify-center flex-wrap">
          {[10, 25, 50, 100, 200].map(c => (
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

        <button onClick={roll} disabled={rolling}
          className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-105 active:scale-95 disabled:opacity-50 relative"
          style={{
            background: rolling ? "#3a2f10" : "linear-gradient(135deg, #c9a84c, #e8b84b)",
            color: "#0a0f0a",
            boxShadow: !rolling ? "0 4px 20px #c9a84c44" : "none"
          }}>
          {rolling ? "🎲 굴리는 중..." : `주사위 굴리기 (베팅: ${bet})`}
          {!rolling && <span className="absolute top-1 right-3 text-[10px] opacity-40">[Space]</span>}
        </button>
      </div>
    </div>
  );
}
