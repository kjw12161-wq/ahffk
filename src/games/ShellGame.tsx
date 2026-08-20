import { useState, useEffect, useRef } from "react";

interface ShellGameProps { balance: number; onWin: (amt: number) => void; onLose: (amt: number) => void; }

type Phase = "bet" | "show" | "shuffle" | "guess" | "result";

// 3 fixed slot positions (% from left, translateX(-50%) applied)
const SLOT_X = ["13%", "50%", "87%"];

function CupSVG({ id }: { id: number }) {
  return (
    <svg width="76" height="88" viewBox="0 0 76 88">
      <defs>
        <linearGradient id={`cg${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2e1f12" />
          <stop offset="25%" stopColor="#6b4423" />
          <stop offset="60%" stopColor="#8b5c30" />
          <stop offset="100%" stopColor="#2e1f12" />
        </linearGradient>
        <linearGradient id={`rg${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a07828" />
          <stop offset="50%" stopColor="#e8b84b" />
          <stop offset="100%" stopColor="#a07828" />
        </linearGradient>
      </defs>
      {/* Body */}
      <path d="M8 82 L18 8 L58 8 L68 82 Z" fill={`url(#cg${id})`} />
      {/* Top rim */}
      <rect x="16" y="5" width="44" height="7" rx="3.5" fill={`url(#rg${id})`} />
      {/* Bottom rim */}
      <rect x="5" y="77" width="66" height="7" rx="3.5" fill={`url(#rg${id})`} />
      {/* Highlight stripe */}
      <path d="M20 10 L26 76" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round" />
      {/* Shadow edge */}
      <path d="M56 10 L62 76" stroke="rgba(0,0,0,0.25)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function ShellGame({ balance, onWin, onLose }: ShellGameProps) {
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState("컵 아래 공을 찾아라!");

  // cupSlots[cupId] = which slot (0,1,2) the cup is currently at
  const [cupSlots, setCupSlots] = useState([0, 1, 2]);
  // which cup id holds the ball
  const [ballCupId, setBallCupId] = useState(0);
  // which cup id is lifted
  const [liftedCupId, setLiftedCupId] = useState<number | null>(null);
  const [showBall, setShowBall] = useState(false);
  const [guess, setGuess] = useState<number | null>(null); // guessed slot index
  const [transitioning, setTransitioning] = useState(false);

  const shuffleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startGame() {
    if (bet > balance) { setMessage("칩이 부족합니다!"); return; }
    const ball = Math.floor(Math.random() * 3);
    setBallCupId(ball);
    setCupSlots([0, 1, 2]);
    setLiftedCupId(null);
    setGuess(null);
    setShowBall(true);
    setLiftedCupId(ball);
    setPhase("show");
    setMessage("공의 위치를 기억하세요!");

    setTimeout(() => {
      setLiftedCupId(null);
      setTimeout(() => {
        setShowBall(false);
        setPhase("shuffle");
        setMessage("잘 보세요...");
        runShuffle(ball, [0, 1, 2]);
      }, 500);
    }, 1800);
  }

  function runShuffle(ball: number, initialSlots: number[]) {
    const totalSwaps = 10 + Math.floor(Math.random() * 6);
    let slots = [...initialSlots];
    let step = 0;

    const doSwap = () => {
      if (step >= totalSwaps) {
        setPhase("guess");
        setMessage("어느 컵 아래에 공이 있나요? 클릭하세요!");
        return;
      }

      // Pick two different cups to swap
      const cupA = Math.floor(Math.random() * 3);
      let cupB = Math.floor(Math.random() * 2);
      if (cupB >= cupA) cupB++;

      // Swap their slot positions
      const newSlots = [...slots];
      const tmp = newSlots[cupA];
      newSlots[cupA] = newSlots[cupB];
      newSlots[cupB] = tmp;
      slots = newSlots;

      setCupSlots([...slots]);
      step++;

      const delay = Math.max(80, 350 - step * 22);
      shuffleRef.current = setTimeout(doSwap, delay);
    };

    shuffleRef.current = setTimeout(doSwap, 300);
  }

  function makeGuess(slotIndex: number) {
    if (phase !== "guess") return;
    // Find which cup is at this slot
    const clickedCupId = cupSlots.indexOf(slotIndex);
    setGuess(slotIndex);
    setLiftedCupId(clickedCupId);
    setPhase("result");

    const isCorrect = clickedCupId === ballCupId;
    if (isCorrect) {
      setShowBall(true);
      setMessage("🎉 맞았다! 공을 찾았어요!");
      setTimeout(() => { onWin(bet); }, 700);
    } else {
      // Reveal where the ball actually is
      setTimeout(() => {
        setShowBall(true);
        setLiftedCupId(ballCupId);
        setMessage("💔 틀렸어요! 공은 저기에 있었네요!");
      }, 600);
      setTimeout(() => { onLose(bet); }, 1000);
    }
  }

  function reset() {
    if (shuffleRef.current) clearTimeout(shuffleRef.current);
    setPhase("bet");
    setLiftedCupId(null);
    setShowBall(false);
    setGuess(null);
    setMessage("컵 아래 공을 찾아라!");
    setCupSlots([0, 1, 2]);
  }

  useEffect(() => () => { if (shuffleRef.current) clearTimeout(shuffleRef.current); }, []);

  // Ball position follows ballCupId's current slot
  const ballSlot = cupSlots[ballCupId];
  const ballX = SLOT_X[ballSlot];
  const ballLifted = liftedCupId === ballCupId;

  return (
    <div className="flex flex-col gap-6 items-center">
      {/* Message */}
      <p className="text-center text-sm font-semibold min-h-[20px]" style={{color: "#c9a84c"}}>
        {message}
      </p>

      {/* Game area */}
      <div className="relative w-full select-none" style={{height: 220}}>
        {/* Table felt */}
        <div className="absolute bottom-0 left-0 right-0 h-3 rounded-full"
          style={{background: "linear-gradient(90deg, #0d1f0d, #1a3f1a, #0d1f0d)",
            boxShadow: "0 2px 12px #0008"}} />
        <div className="absolute bottom-3 left-0 right-0 h-px opacity-30"
          style={{background: "linear-gradient(90deg, transparent, #c9a84c, transparent)"}} />

        {/* Ball — rendered separately, follows ballCupId's slot position */}
        <div
          className="absolute"
          style={{
            left: ballX,
            bottom: ballLifted ? 160 : 12,
            transform: "translateX(-50%)",
            transition: "left 0.28s cubic-bezier(0.4,0,0.2,1), bottom 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            zIndex: 5,
            opacity: showBall ? 1 : 0,
            pointerEvents: "none",
          }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #ff8a8a, #c0392b 60%, #7b0000)",
            boxShadow: "0 4px 16px #c0392b99, inset 0 -3px 6px rgba(0,0,0,0.4)",
          }} />
        </div>

        {/* Cups — keyed by cupId so same DOM element moves via CSS transition */}
        {[0, 1, 2].map(cupId => {
          const slot = cupSlots[cupId];
          const isLifted = liftedCupId === cupId;
          const isClickable = phase === "guess";
          const targetSlot = cupSlots.indexOf(slot) !== -1 ? slot : 0;

          return (
            <div
              key={cupId}
              onClick={() => isClickable ? makeGuess(slot) : undefined}
              className="absolute flex flex-col items-center"
              style={{
                left: SLOT_X[slot],
                bottom: 12,
                transform: `translateX(-50%) translateY(${isLifted ? -70 : 0}px)`,
                transition: [
                  "left 0.28s cubic-bezier(0.4,0,0.2,1)",
                  "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                  "filter 0.2s"
                ].join(", "),
                zIndex: isLifted ? 20 : 10,
                cursor: isClickable ? "pointer" : "default",
                filter: isClickable && !isLifted
                  ? "brightness(1.25) drop-shadow(0 0 10px #c9a84c88)"
                  : "brightness(1)",
              }}>
              {/* Hover glow ring for guess phase */}
              {isClickable && (
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{background: "radial-gradient(circle, #c9a84c11, transparent 70%)"}} />
              )}
              <CupSVG id={cupId} />
            </div>
          );
        })}
      </div>

      {/* Bet controls */}
      {phase === "bet" && (
        <div className="w-full flex flex-col gap-4">
          <div className="flex gap-2 justify-center flex-wrap">
            {[10, 25, 50, 100].map(c => (
              <button key={c} onClick={() => setBet(c)}
                className="chip w-14 h-14 text-sm"
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
          <button onClick={startGame}
            className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
            style={{background: "linear-gradient(135deg, #c9a84c, #e8b84b)", color: "#0a0f0a",
              boxShadow: "0 4px 20px #c9a84c44"}}>
            게임 시작 (베팅: {bet} 칩)
          </button>
        </div>
      )}

      {phase === "result" && (
        <button onClick={reset}
          className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-105 animate-reveal"
          style={{background: "linear-gradient(135deg, #c9a84c, #e8b84b)", color: "#0a0f0a",
            boxShadow: "0 4px 20px #c9a84c44"}}>
          다시 하기
        </button>
      )}

      {(phase === "show" || phase === "shuffle") && (
        <div className="flex items-center gap-2 text-sm" style={{color: "#8a9e8a"}}>
          {phase === "shuffle" && (
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{background: "#c9a84c"}} />
          )}
          {phase === "show" ? "공의 위치를 기억하세요..." : "섞는 중..."}
        </div>
      )}
    </div>
  );
}
