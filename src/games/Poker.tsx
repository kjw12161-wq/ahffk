import { useState } from "react";

interface PokerProps { balance: number; onWin: (amount: number) => void; onLose: (amount: number) => void; }
type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type Phase = "ready" | "action" | "result";
interface Card { suit: Suit; rank: Rank; }
interface Opponent { name: string; role: string; hand: Card[]; status: string; folded: boolean; aggression: number; caution: number; }
type Score = number[];

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const VALUES: Record<Rank, number> = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14 };
const PERSONAS = [
  { name: "MORGAN", role: "THE SHARK", aggression: 0.82, caution: 0.18 },
  { name: "ELI", role: "THE CALCULATOR", aggression: 0.48, caution: 0.72 },
  { name: "NOVA", role: "THE WILDCARD", aggression: 0.68, caution: 0.34 },
];

function makeDeck(): Card[] { return SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank }))).sort(() => Math.random() - 0.5); }
function isRed(suit: Suit) { return suit === "♥" || suit === "♦"; }
function combinations<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  function visit(start: number, picked: T[]) {
    if (picked.length === size) { result.push([...picked]); return; }
    for (let index = start; index < items.length; index++) { picked.push(items[index]); visit(index + 1, picked); picked.pop(); }
  }
  visit(0, []);
  return result;
}
function compareScores(left: Score, right: Score): number { for (let index = 0; index < Math.max(left.length, right.length); index++) { const difference = (left[index] ?? 0) - (right[index] ?? 0); if (difference) return difference; } return 0; }
function rankFive(cards: Card[]): Score {
  const ranks = cards.map(card => VALUES[card.rank]).sort((a, b) => b - a);
  const counts = new Map<number, number>();
  ranks.forEach(rank => counts.set(rank, (counts.get(rank) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const unique = [...new Set(ranks)];
  const straightHigh = unique.length === 5 && (unique[0] - unique[4] === 4 ? unique[0] : unique.join(",") === "14,5,4,3,2" ? 5 : 0);
  const flush = cards.every(card => card.suit === cards[0].suit);
  if (straightHigh && flush) return [8, straightHigh];
  if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]];
  if (groups[0][1] === 3 && groups[1][1] === 2) return [6, groups[0][0], groups[1][0]];
  if (flush) return [5, ...ranks];
  if (straightHigh) return [4, straightHigh];
  if (groups[0][1] === 3) return [3, groups[0][0], ...groups.slice(1).map(group => group[0])];
  if (groups[0][1] === 2 && groups[1][1] === 2) return [2, Math.max(groups[0][0], groups[1][0]), Math.min(groups[0][0], groups[1][0]), groups[2][0]];
  if (groups[0][1] === 2) return [1, groups[0][0], ...groups.slice(1).map(group => group[0])];
  return [0, ...ranks];
}
function bestSeven(hand: Card[], board: Card[]): Score { return combinations([...hand, ...board], 5).reduce<Score | null>((best, cards) => { const candidate = rankFive(cards); return !best || compareScores(candidate, best) > 0 ? candidate : best; }, null) ?? [0]; }
function handStrength(hand: Card[], board: Card[]): number { return (bestSeven(hand, board)[0] / 8) + ((bestSeven(hand, board)[1] ?? 0) / 1400); }
function handName(scoreValue: Score) { return ["하이 카드", "원 페어", "투 페어", "트리플", "스트레이트", "플러시", "풀 하우스", "포카드", "스트레이트 플러시"][scoreValue[0]] ?? "하이 카드"; }
function estimateEquity(hero: Card[], board: Card[], opponentCount: number, iterations = 80): number {
  const used = new Set([...hero, ...board].map(card => `${card.rank}${card.suit}`));
  const remaining = SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank }))).filter(card => !used.has(`${card.rank}${card.suit}`));
  let wins = 0; let ties = 0;
  for (let iteration = 0; iteration < iterations; iteration++) {
    const pool = [...remaining].sort(() => Math.random() - 0.5); let cursor = 0;
    const opponents = Array.from({ length: opponentCount }, () => [pool[cursor++], pool[cursor++]]);
    const runout = [...board, ...pool.slice(cursor, cursor + 5 - board.length)];
    const heroScore = bestSeven(hero, runout);
    const bestOpponent = opponents.reduce<Score | null>((best, hand) => { const current = bestSeven(hand, runout); return !best || compareScores(current, best) > 0 ? current : best; }, null) ?? [0];
    const comparison = compareScores(heroScore, bestOpponent); if (comparison > 0) wins++; else if (comparison === 0) ties++;
  }
  return (wins + ties * 0.5) / iterations;
}
function CardView({ card, hidden = false, large = false }: { card?: Card; hidden?: boolean; large?: boolean }) {
  if (hidden || !card) return <div className={`${large ? "w-12 h-16 sm:w-14 sm:h-20" : "w-10 h-14 sm:w-12 sm:h-16"} rounded-md flex items-center justify-center`} style={{ background: "repeating-linear-gradient(135deg, #6b1e2b 0 5px, #42131c 5px 10px)", border: "1px solid #c9a22788", boxShadow: "0 3px 8px #0008" }}>🂠</div>;
  return <div className={`${large ? "w-12 h-16 sm:w-14 sm:h-20" : "w-10 h-14 sm:w-12 sm:h-16"} rounded-md flex flex-col items-center justify-center font-bold animate-card-flip`} style={{ background: "#faf7ee", color: isRed(card.suit) ? "#8b1a1a" : "#1b1b1b", boxShadow: "0 3px 8px #0008" }}><span className="text-xs sm:text-sm">{card.rank}</span><span className="text-lg sm:text-xl">{card.suit}</span></div>;
}

function Seat({ name, role, hand, status, folded, human = false, showCards = false }: { name: string; role: string; hand: Card[]; status: string; folded?: boolean; human?: boolean; showCards?: boolean }) {
  return <div className={`flex flex-col items-center gap-1.5 p-2 rounded-xl min-w-[92px] transition-all ${folded ? "opacity-35" : ""} ${status === "thinking" ? "animate-pulse-glow" : ""}`} style={{ background: status === "thinking" ? "#c9a22712" : "transparent", border: status === "thinking" ? "1px solid #e6c85a" : "1px solid transparent" }}>
    <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: human ? "#e6c85a" : "#efe7d6" }}>{human && "★ "}{name}{human && <span className="text-[9px] px-1 rounded" style={{ background: "#efe7d6", color: "#241804" }}>YOU</span>}</div>
    <div className="text-[9px] tracking-widest" style={{ color: "#9fa89c" }}>{role}</div>
    <div className="flex gap-1 min-h-14">{hand.map((card, index) => <CardView key={index} card={card} hidden={!showCards} />)}</div>
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${status === "folded" ? "text-red-300 bg-red-900/30" : status === "thinking" ? "text-yellow-200 bg-yellow-900/30" : "text-gray-400 bg-black/20"}`}>{status}</span>
  </div>;
}

export default function Poker({ balance, onWin, onLose }: PokerProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [handNumber, setHandNumber] = useState(0);
  const [street, setStreet] = useState(0);
  const [bet, setBet] = useState(50);
  const [wager, setWager] = useState(0);
  const [pot, setPot] = useState(0);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [community, setCommunity] = useState<Card[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [message, setMessage] = useState("IRIS: 자리에 앉으세요. 카지노 칩으로 게임을 시작합니다.");
  const [logs, setLogs] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | "push" | null>(null);
  const [equity, setEquity] = useState<number | null>(null);

  function addLog(text: string) { setLogs(previous => [text, ...previous].slice(0, 8)); setMessage(`IRIS: ${text}`); }

  function deal() {
    if (bet > balance) { setMessage("IRIS: 카지노 칩이 부족합니다."); return; }
    const deck = makeDeck();
    setPlayerHand(deck.slice(0, 2));
    setDealerHand(deck.slice(2, 4));
    setCommunity(deck.slice(4, 9));
    setOpponents(PERSONAS.map((persona, index) => ({ ...persona, hand: deck.slice(9 + index * 2, 11 + index * 2), status: "thinking", folded: false })));
    setStreet(0); setHandNumber(previous => previous + 1); setWager(bet); setPot(bet * 2); setPhase("action"); setResult(null);
    setEquity(estimateEquity(deck.slice(0, 2), [], PERSONAS.length, 70));
    setLogs([`새 핸드가 시작되었습니다. 블라인드 10 / 20.`, `당신이 ${bet.toLocaleString()} 칩을 베팅했습니다.`]);
    setMessage("IRIS: 프리플랍입니다. 당신의 차례입니다.");
  }

  function fold() {
    if (phase !== "action") return;
    setPhase("result"); setResult("lose"); setMessage(`IRIS: 폴드했습니다. -${wager.toLocaleString()} 카지노 칩`); onLose(wager);
  }

  function advance(action: "check" | "raise") {
    if (phase !== "action") return;
    if (action === "raise") {
      if (wager + bet > balance) { setMessage("IRIS: 보유 카지노 칩을 초과하는 레이즈입니다."); return; }
      setWager(previous => previous + bet);
      setPot(previous => previous + bet);
      addLog(`당신이 ${bet.toLocaleString()} 칩을 레이즈했습니다. 총 베팅 ${ (wager + bet).toLocaleString() }.`);
    }
    const nextStreet = street + 1;
    const nextBoard = nextStreet === 0 ? [] : nextStreet === 1 ? community.slice(0, 3) : nextStreet === 2 ? community.slice(0, 4) : community;
    const nextOpponents = opponents.map(opponent => {
      const equity = estimateEquity(opponent.hand, nextBoard, Math.max(1, opponents.filter(other => other.name !== opponent.name && !other.folded).length), 42);
      const strength = equity * 0.7 + handStrength(opponent.hand, nextBoard) * 0.3;
      const pressure = action === "raise" ? 0.1 : 0;
      const folds = strength < opponent.caution * 0.42 + pressure && Math.random() < 0.6;
      const raises = !folds && strength > 0.52 && Math.random() < opponent.aggression;
      return { ...opponent, folded: folds, status: folds ? "폴드" : raises ? "레이즈" : strength > 0.3 ? "콜" : "체크" };
    });
    setOpponents(nextOpponents);
    const activeOpponents = nextOpponents.filter(opponent => !opponent.folded);
    const aiContribution = activeOpponents.filter(opponent => opponent.status === "콜" || opponent.status === "레이즈").length * bet;
    if (aiContribution > 0) setPot(previous => previous + aiContribution);
    addLog(activeOpponents.length ? `${activeOpponents.map(opponent => `${opponent.name} ${opponent.status}`).join(", ")}.` : "모든 AI가 폴드했습니다.");
    if (activeOpponents.length === 0) {
      setPhase("result"); setPot(0); setResult("win"); setMessage(`IRIS: 모두 폴드했습니다. +${wager.toLocaleString()} 카지노 칩`); onWin(wager); return;
    }
    if (street < 3) {
      setStreet(nextStreet);
      setEquity(estimateEquity(playerHand, nextBoard, nextOpponents.length, 55));
      setMessage(`IRIS: ${["플랍", "턴", "리버"][nextStreet - 1]} 카드가 공개되었습니다.`);
      if (nextStreet === 3) setLogs(previous => [`리버까지 진행합니다. 마지막 액션을 선택하세요.`, ...previous].slice(0, 8));
    } else {
      showdown(nextOpponents);
    }
  }

  function showdown(currentOpponents = opponents) {
    const playerScore = bestSeven(playerHand, community);
    const activeOpponents = currentOpponents.filter(opponent => !opponent.folded);
    const bestOpponent = activeOpponents.reduce((best, opponent) => !best || compareScores(bestSeven(opponent.hand, community), bestSeven(best.hand, community)) > 0 ? opponent : best, activeOpponents[0]);
    const dealerScore = bestOpponent ? bestSeven(bestOpponent.hand, community) : [0];
    const total = pot + bet;
    setPhase("result");
    setOpponents(previous => previous.map(opponent => ({ ...opponent, status: opponent.folded ? "폴드" : "쇼다운" })));
    const comparison = compareScores(playerScore, dealerScore);
    if (comparison > 0) { setResult("win"); setMessage(`IRIS: ${handName(playerScore)}! 승리했습니다. +${wager.toLocaleString()} 카지노 칩`); onWin(wager); }
    else if (comparison < 0) { setResult("lose"); setMessage(`IRIS: ${bestOpponent?.name ?? "딜러"}의 ${handName(dealerScore)} 승리. -${wager.toLocaleString()} 카지노 칩`); onLose(wager); }
    else { setResult("push"); setMessage(`IRIS: 무승부입니다. ${total.toLocaleString()} 칩을 반환합니다.`); }
  }

  function reset() { setPhase("ready"); setHandNumber(0); setStreet(0); setEquity(null); setWager(0); setPot(0); setPlayerHand([]); setDealerHand([]); setCommunity([]); setOpponents([]); setResult(null); setMessage("IRIS: 자리에 앉으세요. 카지노 칩으로 게임을 시작합니다."); }
  const stage = street === 0 ? "PRE-FLOP" : street === 1 ? "FLOP" : street === 2 ? "TURN" : "RIVER";
  const visibleCommunity = street === 0 ? [] : street === 1 ? community.slice(0, 3) : street === 2 ? community.slice(0, 4) : community;

  return <div className="flex flex-col gap-4" style={{ fontFamily: "Inter, sans-serif" }}>
    <div className="flex items-end justify-between gap-3">
      <div><div className="text-2xl font-black" style={{ color: "#e6c85a", fontFamily: "Georgia, serif" }}>IRIS TABLE</div><div className="text-[10px] tracking-[3px]" style={{ color: "#9fa89c" }}>AI DEALER · NO-LIMIT HOLD'EM · CASINO CHIPS</div></div>
      <div className="text-right text-xs" style={{ color: "#9fa89c" }}>HAND <b style={{ color: "#e6c85a" }}>#{handNumber}</b><br />BLINDS <b style={{ color: "#e6c85a" }}>10 / 20</b></div>
    </div>
    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "linear-gradient(#20140d, #160d08)", border: "1px solid #3a2416" }}><div className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ background: "radial-gradient(circle at 35% 30%, #e6c85a, #c9a227)", color: "#241804" }}>I</div><div className="flex-1 text-sm truncate" style={{ color: "#efe7d6" }}>{message}</div><button onClick={() => setShowLog(value => !value)} className="text-xs px-2 py-1 rounded" style={{ color: "#9fa89c", border: "1px solid #3a2416" }}>기록 보기</button></div>
    {showLog && <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "#100b07", border: "1px solid #3a2416", color: "#9fa89c" }}>{logs.map((log, index) => <div key={index} className="border-b border-white/5 pb-1">{log}</div>)}</div>}

    <div className="rounded-[50px] sm:rounded-[100px] p-3 sm:p-6" style={{ background: "#24160e", boxShadow: "0 20px 40px #0008, inset 0 0 0 2px #150d07, inset 0 0 0 3px #e6c85a" }}>
      <div className="rounded-[42px] sm:rounded-[82px] p-3 sm:p-6 flex flex-col gap-3 min-h-[430px]" style={{ background: "radial-gradient(ellipse at 50% 30%, #163d2e, #0a2019 75%)", boxShadow: "inset 0 0 60px #0009" }}>
        <div className="flex justify-around gap-2 flex-wrap">{opponents.map(opponent => <Seat key={opponent.name} {...opponent} showCards={phase === "result" && !opponent.folded} />)}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[150px]"><div className="text-[10px] tracking-[3px]" style={{ color: "#9fa89c" }}>{stage}</div><div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center min-h-20">{visibleCommunity.map((card, index) => <CardView key={index} card={card} large />)}{Array.from({ length: 5 - visibleCommunity.length }).map((_, index) => <CardView key={`empty-${index}`} />)}</div><div className="px-4 py-1 rounded-full text-sm font-bold" style={{ background: "#0006", border: "1px solid #c9a22766", color: "#e6c85a" }}>POT {pot.toLocaleString()}</div></div>
        <div className="flex flex-col items-center gap-2"><Seat name="YOU" role="PLAYER" hand={playerHand} status={phase === "action" ? "your turn" : phase === "result" ? (result ?? "ready") : "waiting"} human showCards />{equity !== null && phase !== "result" && <div className={`text-xs px-3 py-1 rounded-full ${equity >= 0.6 ? "text-green-300 bg-green-900/30" : equity >= 0.4 ? "text-yellow-200 bg-yellow-900/30" : "text-red-300 bg-red-900/30"}`}>현재 승률 약 {Math.round(equity * 100)}%</div>}</div>
      </div>
    </div>

    <div className={`text-center rounded-lg py-3 px-4 text-sm font-semibold ${result === "win" ? "bg-yellow-900/40 text-yellow-300" : result === "lose" ? "bg-red-900/30 text-red-300" : result === "push" ? "bg-blue-900/30 text-blue-300" : "text-gray-300"}`}>{message}</div>
    {phase === "ready" && <div className="flex flex-wrap justify-center items-center gap-3"><label className="flex items-center gap-2 text-sm" style={{ color: "#9fa89c" }}>베팅 <input type="number" min="10" max={Math.max(10, balance)} step="10" value={bet} onChange={event => setBet(Math.max(10, Math.min(balance || 10, Number(event.target.value) || 10)))} className="w-24 rounded-lg px-3 py-2 text-center" style={{ background: "#24160e", color: "#e6c85a", border: "1px solid #3a2416" }} /></label><button onClick={deal} className="px-6 py-3 rounded-lg font-bold" style={{ background: "linear-gradient(#e6c85a, #c9a227)", color: "#241804", boxShadow: "0 4px 16px #c9a84c44" }}>게임 시작</button></div>}
    {phase === "action" && <div className="flex flex-wrap justify-center gap-2"><button onClick={fold} className="px-5 py-3 rounded-lg font-semibold" style={{ background: "#2a3630", color: "#efe7d6" }}>폴드</button><button onClick={() => advance("check")} className="px-5 py-3 rounded-lg font-semibold" style={{ background: "#2a3630", color: "#efe7d6" }}>{street === 3 ? "쇼다운" : "체크 / 콜"}</button><button onClick={() => advance("raise")} disabled={wager + bet > balance} className="px-5 py-3 rounded-lg font-bold disabled:opacity-40" style={{ background: "linear-gradient(#e6c85a, #c9a227)", color: "#241804" }}>레이즈 +{bet} <span className="text-xs opacity-70">(총 { (wager + bet).toLocaleString() })</span></button></div>}
    {phase === "result" && <button onClick={reset} className="mx-auto px-6 py-3 rounded-lg font-bold" style={{ background: "linear-gradient(#e6c85a, #c9a227)", color: "#241804" }}>다음 핸드</button>}
    <div className="text-center text-xs" style={{ color: "#9fa89c" }}>보유 카지노 칩 <b style={{ color: "#e6c85a" }}>{balance.toLocaleString()}</b> · 총 베팅 {wager.toLocaleString()} · 현재 팟 {pot.toLocaleString()}</div>
  </div>;
}
