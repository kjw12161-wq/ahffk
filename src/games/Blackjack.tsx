import { useState, useEffect } from "react";

interface BlackjackProps { balance: number; onWin: (amt: number) => void; onLose: (amt: number) => void; }

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
interface Card { suit: Suit; rank: Rank; hidden?: boolean; }

type Phase = "bet" | "playing" | "dealer" | "result";

function buildDeck(): Card[] {
  const suits: Suit[] = ["♠", "♥", "♦", "♣"];
  const ranks: Rank[] = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const deck: Card[] = [];
  for (const suit of suits) for (const rank of ranks) deck.push({suit, rank});
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(rank: Rank): number {
  if (["J","Q","K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank);
}

function handValue(hand: Card[]): number {
  let total = hand.filter(c => !c.hidden).reduce((s, c) => s + cardValue(c.rank), 0);
  let aces = hand.filter(c => !c.hidden && c.rank === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isRed(suit: Suit) { return suit === "♥" || suit === "♦"; }

function CardUI({ card, delay = 0 }: { card: Card; delay?: number }) {
  if (card.hidden) {
    return (
      <div className="w-16 h-24 rounded-xl flex items-center justify-center"
        style={{background: "linear-gradient(135deg, #1e3a2f, #0d2018)", border: "2px solid #2a5a3a"}}>
        <span className="text-2xl opacity-30">🂠</span>
      </div>
    );
  }
  return (
    <div className="w-16 h-24 rounded-xl flex flex-col p-1.5 animate-card-flip"
      style={{
        background: "white",
        border: "2px solid #e5e5e5",
        animationDelay: `${delay}ms`,
        color: isRed(card.suit) ? "#c0392b" : "#1a1a1a",
        boxShadow: "0 4px 12px #0006"
      }}>
      <div className="text-xs font-black leading-none">{card.rank}</div>
      <div className="text-xs leading-none">{card.suit}</div>
      <div className="flex-1 flex items-center justify-center text-2xl">{card.suit}</div>
      <div className="text-xs font-black leading-none self-end rotate-180">{card.rank}</div>
    </div>
  );
}

export default function Blackjack({ balance, onWin, onLose }: BlackjackProps) {
  const [phase, setPhase] = useState<Phase>("bet");
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState(10);
  const [doubled, setDoubled] = useState(false);
  const [message, setMessage] = useState("블랙잭! 21을 먼저 만들어라");
  const [result, setResult] = useState<"win" | "lose" | "push" | null>(null);

  function deal() {
    if (bet > balance) { setMessage("칩이 부족합니다!"); return; }
    const d = buildDeck();
    const p = [d[0], d[2]];
    const dealer = [d[1], {...d[3], hidden: true}];
    setDeck(d.slice(4));
    setPlayerHand(p);
    setDealerHand(dealer);
    setPhase("playing");
    setResult(null);
    setDoubled(false);

    // Check player blackjack
    if (cardValue(p[0].rank) + cardValue(p[1].rank) === 21) {
      setTimeout(() => endGame([...p], dealer, d.slice(4)), 600);
    } else {
      setMessage("히트 또는 스탠드?");
    }
  }

  function hit() {
    if (phase !== "playing") return;
    const card = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);

    const val = handValue(newHand);
    if (val > 21) {
      setMessage(`💔 버스트! ${val}점 초과`);
      setPhase("result");
      setResult("lose");
      onLose(bet);
    } else if (val === 21) {
      stand(newHand, newDeck);
    }
  }

  function doubleDown() {
    if (phase !== "playing" || playerHand.length !== 2) return;
    if (bet > balance) { setMessage("칩이 부족합니다!"); return; }
    setDoubled(true);
    const card = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);
    const val = handValue(newHand);
    if (val > 21) {
      setMessage(`💔 버스트! ${val}점 초과`);
      setPhase("result");
      setResult("lose");
      onLose(bet * 2);
    } else {
      stand(newHand, newDeck, true);
    }
  }

  function stand(pHand = playerHand, d = deck, isDoubled = false) {
    setPhase("dealer");
    const revealedDealer = dealerHand.map(c => ({...c, hidden: false}));
    setDealerHand(revealedDealer);
    endGame(pHand, revealedDealer, d, isDoubled);
  }

  function endGame(pHand: Card[], dHand: Card[], d: Card[], isDoubled = false) {
    let currentDealer = dHand.map(c => ({...c, hidden: false}));
    let currentDeck = [...d];

    // Dealer draws to 17
    while (handValue(currentDealer) < 17) {
      currentDealer = [...currentDealer, currentDeck[0]];
      currentDeck = currentDeck.slice(1);
    }

    setDealerHand(currentDealer);
    setDeck(currentDeck);
    setPhase("result");

    const pVal = handValue(pHand);
    const dVal = handValue(currentDealer);

    const effectiveBet = isDoubled ? bet * 2 : bet;
    setTimeout(() => {
      if (pVal > 21) {
        setResult("lose"); onLose(effectiveBet); setMessage(`버스트! 딜러 승리`);
      } else if (dVal > 21 || pVal > dVal) {
        setResult("win"); onWin(effectiveBet); setMessage(`🎉 플레이어 승리! +${effectiveBet} 칩`);
      } else if (pVal === dVal) {
        setResult("push"); setMessage(`🤝 무승부! 베팅 반환`);
      } else {
        setResult("lose"); onLose(effectiveBet); setMessage(`💔 딜러 승리! -${effectiveBet} 칩`);
      }
    }, 500);
  }

  function reset() {
    setPhase("bet");
    setPlayerHand([]);
    setDealerHand([]);
    setResult(null);
    setDoubled(false);
    setMessage("블랙잭! 21을 먼저 만들어라");
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "h" || e.key === "H") hit();
      if (e.key === "s" || e.key === "S") { if (phase === "playing") stand(); }
      if (e.key === "d" || e.key === "D") doubleDown();
      if (e.key === " " || e.key === "Enter") {
        if (phase === "bet") deal();
        if (phase === "result") reset();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pVal = handValue(playerHand);
  const dVal = handValue(dealerHand);

  return (
    <div className="flex flex-col gap-5">
      {/* Table */}
      <div className="rounded-2xl p-4 relative"
        style={{background: "radial-gradient(ellipse at center, #0d3320, #051a10)", border: "2px solid #1a4a2a",
          minHeight: 300}}>

        {/* Dealer */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold" style={{color: "#8a9e8a"}}>딜러</span>
            {phase !== "bet" && (
              <span className="text-xs font-mono px-2 py-0.5 rounded"
                style={{background: "#1a2e1a", color: "#c9a84c", fontFamily: "JetBrains Mono"}}>
                {phase === "playing" ? "?" : dVal}
              </span>
            )}
            {dVal > 21 && phase === "result" && (
              <span className="text-xs text-red-400 font-bold">버스트!</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap min-h-[96px] items-center">
            {dealerHand.map((card, i) => <CardUI key={i} card={card} delay={i * 150} />)}
            {phase === "bet" && (
              <div className="text-muted-foreground text-sm italic">카드 대기 중...</div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 h-px opacity-20" style={{background: "#c9a84c"}} />

        {/* Player */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold" style={{color: "#8a9e8a"}}>내 패</span>
            {phase !== "bet" && (
              <span className="text-xs font-mono px-2 py-0.5 rounded"
                style={{background: "#1a2e1a", color: pVal > 21 ? "#ef4444" : pVal === 21 ? "#c9a84c" : "#f0ead6",
                  fontFamily: "JetBrains Mono"}}>
                {pVal}
              </span>
            )}
            {pVal === 21 && phase !== "result" && (
              <span className="text-xs font-bold animate-reveal" style={{color: "#c9a84c"}}>블랙잭!</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap min-h-[96px] items-center">
            {playerHand.map((card, i) => <CardUI key={i} card={card} delay={i * 150} />)}
            {phase === "bet" && (
              <div className="text-muted-foreground text-sm italic">베팅 후 시작하세요</div>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      <div className={`text-center font-semibold text-sm py-2 px-4 rounded-lg ${
        result === "win" ? "bg-yellow-900/40 text-yellow-300" :
        result === "lose" ? "bg-red-900/30 text-red-300" :
        result === "push" ? "bg-blue-900/30 text-blue-300" :
        "text-muted-foreground"
      }`}>
        {message}
      </div>

      {/* Actions */}
      {phase === "bet" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 justify-center flex-wrap">
            {[10, 25, 50, 100, 200].map(c => (
              <button key={c} onClick={() => setBet(c)}
                className="chip w-12 h-12 text-xs transition-all"
                style={{
                  background: bet === c ? "#c9a84c" : "#2a1f0a",
                  color: bet === c ? "#0a0f0a" : "#c9a84c",
                  borderColor: "#c9a84c",
                  transform: bet === c ? "scale(1.1)" : "scale(1)",
                }}>
                {c}
              </button>
            ))}
            <button onClick={() => setBet(Math.min(balance, balance))}
              className="chip w-14 h-12 text-xs transition-all"
              style={{
                background: "#1a0a2a",
                color: "#b090e0",
                borderColor: "#7040c0",
              }}>
              ALL IN
            </button>
          </div>
          <button onClick={deal}
            className="w-full py-4 rounded-xl font-bold text-base hover:scale-105 active:scale-95 transition-all relative"
            style={{background: "linear-gradient(135deg, #c9a84c, #e8b84b)", color: "#0a0f0a",
              boxShadow: "0 4px 20px #c9a84c44", fontFamily: "Playfair Display"}}>
            딜! (베팅: {bet} 칩)
            <span className="absolute top-1 right-3 text-[10px] opacity-40">[Space]</span>
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={hit}
              className="py-4 rounded-xl font-bold text-base hover:scale-105 active:scale-95 transition-all relative"
              style={{background: "linear-gradient(135deg, #1e4a1e, #2a6b2a)", color: "#90ee90",
                border: "2px solid #2a6b2a"}}>
              히트 🃏
              <span className="absolute top-1 right-2 text-[10px] opacity-40">[H]</span>
            </button>
            <button onClick={() => stand()}
              className="py-4 rounded-xl font-bold text-base hover:scale-105 active:scale-95 transition-all relative"
              style={{background: "linear-gradient(135deg, #4a1e1e, #6b2a2a)", color: "#ee9090",
                border: "2px solid #6b2a2a"}}>
              스탠드 🖐
              <span className="absolute top-1 right-2 text-[10px] opacity-40">[S]</span>
            </button>
          </div>
          {playerHand.length === 2 && bet <= balance && (
            <button onClick={doubleDown}
              className="w-full py-3 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all relative"
              style={{background: "linear-gradient(135deg, #2a1f6b, #3a2a8b)", color: "#b0a0f0",
                border: "2px solid #3a2a8b"}}>
              더블다운 ×2 (베팅: {bet * 2})
              <span className="absolute top-1 right-2 text-[10px] opacity-40">[D]</span>
            </button>
          )}
        </div>
      )}

      {phase === "result" && (
        <button onClick={reset}
          className="w-full py-4 rounded-xl font-bold text-base hover:scale-105 transition-all animate-reveal"
          style={{background: "linear-gradient(135deg, #c9a84c, #e8b84b)", color: "#0a0f0a",
            boxShadow: "0 4px 20px #c9a84c44"}}>
          다시 딜
        </button>
      )}
    </div>
  );
}
