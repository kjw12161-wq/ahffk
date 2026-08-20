import { useState } from "react";

interface PokerProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
}

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type Phase = "ready" | "playing" | "result";
interface Card { suit: Suit; rank: Rank; }

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const VALUES: Record<Rank, number> = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14 };

function makeDeck(): Card[] {
  return SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank }))).sort(() => Math.random() - 0.5);
}

function score(hand: Card[]): number {
  const values = hand.map(card => VALUES[card.rank]).sort((a, b) => b - a);
  return values.reduce((total, value, index) => total + value * (5 - index), 0);
}

function isRed(suit: Suit) { return suit === "♥" || suit === "♦"; }

function CardView({ card, hidden = false }: { card?: Card; hidden?: boolean }) {
  if (hidden || !card) {
    return <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg flex items-center justify-center" style={{ background: "repeating-linear-gradient(135deg, #6b1e2b 0 5px, #42131c 5px 10px)", border: "1px solid #c9a22788" }}>🂠</div>;
  }
  return (
    <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg flex flex-col items-center justify-center font-bold shadow-lg" style={{ background: "#faf7ee", color: isRed(card.suit) ? "#8b1a1a" : "#1b1b1b" }}>
      <span className="text-sm sm:text-base">{card.rank}</span>
      <span className="text-xl sm:text-2xl">{card.suit}</span>
    </div>
  );
}

export default function Poker({ balance, onWin, onLose }: PokerProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [bet, setBet] = useState(50);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [community, setCommunity] = useState<Card[]>([]);
  const [message, setMessage] = useState("카지노 칩으로 AI 딜러와 홀덤을 시작하세요.");
  const [result, setResult] = useState<"win" | "lose" | "push" | null>(null);

  function deal() {
    if (bet > balance) { setMessage("카지노 칩이 부족합니다."); return; }
    const deck = makeDeck();
    setPlayerHand(deck.slice(0, 2));
    setDealerHand(deck.slice(2, 4));
    setCommunity(deck.slice(4, 9));
    setPhase("playing");
    setResult(null);
    setMessage("카드를 확인하고 콜 또는 폴드를 선택하세요.");
  }

  function fold() {
    if (phase !== "playing") return;
    setPhase("result");
    setResult("lose");
    setMessage(`폴드했습니다. -${bet.toLocaleString()} 칩`);
    onLose(bet);
  }

  function showdown() {
    if (phase !== "playing") return;
    const playerScore = score([...playerHand, ...community]);
    const dealerScore = score([...dealerHand, ...community]);
    setPhase("result");
    if (playerScore > dealerScore) {
      setResult("win");
      setMessage(`승리! +${bet.toLocaleString()} 칩을 획득했습니다.`);
      onWin(bet);
    } else if (playerScore < dealerScore) {
      setResult("lose");
      setMessage(`딜러 승리. -${bet.toLocaleString()} 칩`);
      onLose(bet);
    } else {
      setResult("push");
      setMessage("무승부! 베팅이 반환되었습니다.");
    }
  }

  function reset() {
    setPhase("ready");
    setPlayerHand([]);
    setDealerHand([]);
    setCommunity([]);
    setResult(null);
    setMessage("카지노 칩으로 AI 딜러와 홀덤을 시작하세요.");
  }

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="rounded-2xl p-4 sm:p-6" style={{ background: "radial-gradient(ellipse at center, #163d2e, #0a2019)", border: "2px solid #6b1e2b" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xl font-black" style={{ color: "#e6c85a", fontFamily: "Georgia, serif" }}>IRIS TABLE</div>
            <div className="text-[10px] tracking-widest" style={{ color: "#9fa89c" }}>AI DEALER · NO-LIMIT HOLD'EM</div>
          </div>
          <div className="text-right text-xs" style={{ color: "#9fa89c" }}>카지노 칩<br /><b className="text-sm" style={{ color: "#e6c85a" }}>{balance.toLocaleString()}</b></div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs mb-2" style={{ color: "#9fa89c" }}>AI 딜러</div>
            <div className="flex gap-2">{dealerHand.map((card, index) => <CardView key={index} card={card} hidden={phase === "playing"} />)}{phase === "ready" && <CardView hidden />}{phase === "ready" && <CardView hidden />}</div>
          </div>

          <div className="flex flex-col items-center gap-3 py-2">
            <div className="text-xs tracking-widest" style={{ color: "#9fa89c" }}>COMMUNITY CARDS</div>
            <div className="flex gap-2 flex-wrap justify-center">{community.map((card, index) => <CardView key={index} card={card} />)}</div>
            <div className="px-4 py-1 rounded-full text-sm font-bold" style={{ background: "#0006", border: "1px solid #c9a22766", color: "#e6c85a" }}>POT {phase === "playing" ? (bet * 2).toLocaleString() : "0"}</div>
          </div>

          <div>
            <div className="text-xs mb-2" style={{ color: "#9fa89c" }}>내 패</div>
            <div className="flex gap-2">{playerHand.map((card, index) => <CardView key={index} card={card} />)}{phase === "ready" && <div className="text-sm italic self-center" style={{ color: "#9fa89c" }}>베팅 후 카드를 받습니다.</div>}</div>
          </div>
        </div>
      </div>

      <div className={`text-center rounded-lg py-3 px-4 text-sm font-semibold ${result === "win" ? "bg-yellow-900/40 text-yellow-300" : result === "lose" ? "bg-red-900/30 text-red-300" : result === "push" ? "bg-blue-900/30 text-blue-300" : "text-gray-300"}`}>{message}</div>

      {phase === "ready" && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <label className="flex items-center gap-2 text-sm" style={{ color: "#9fa89c" }}>베팅
            <input type="number" min="10" max={Math.max(10, balance)} step="10" value={bet} onChange={event => setBet(Math.max(10, Number(event.target.value) || 10))} className="w-24 rounded-lg px-3 py-2 text-center" style={{ background: "#24160e", color: "#e6c85a", border: "1px solid #3a2416" }} />
          </label>
          <button onClick={deal} className="px-5 py-2.5 rounded-lg font-bold" style={{ background: "linear-gradient(#e6c85a, #c9a227)", color: "#241804" }}>게임 시작</button>
        </div>
      )}
      {phase === "playing" && (
        <div className="flex justify-center gap-3">
          <button onClick={fold} className="px-5 py-2.5 rounded-lg font-semibold" style={{ background: "#2a3630", color: "#efe7d6" }}>폴드</button>
          <button onClick={showdown} className="px-5 py-2.5 rounded-lg font-bold" style={{ background: "linear-gradient(#e6c85a, #c9a227)", color: "#241804" }}>콜 / 쇼다운</button>
        </div>
      )}
      {phase === "result" && <button onClick={reset} className="mx-auto px-5 py-2.5 rounded-lg font-bold" style={{ background: "linear-gradient(#e6c85a, #c9a227)", color: "#241804" }}>다시 시작</button>}
    </div>
  );
}
