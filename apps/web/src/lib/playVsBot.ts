import type { HumanSeat } from "./persistence";

export function botSeatFor(humanSeat: HumanSeat): 1 | 2 {
  return humanSeat === 1 ? 2 : 1;
}

export function canHumanAct(params: {
  isVsBot: boolean;
  isBotSpectator?: boolean;
  humanSeat: HumanSeat;
  activePlayer: 1 | 2 | null;
  botThinking: boolean;
}): boolean {
  if (params.isBotSpectator) return false;
  if (!params.isVsBot) return true;
  if (params.activePlayer === null) return false;
  if (params.botThinking) return false;
  return params.activePlayer === params.humanSeat;
}
