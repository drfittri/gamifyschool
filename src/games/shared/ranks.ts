// Mission ranks earned on the end screen, themed per action game.
// [3-star rank, 2-star rank, 1-star rank]
const MISSION_RANKS: Record<string, [string, string, string]> = {
  targetblast: ['Space Ace Commander', 'Pilot Officer', 'Space Cadet'],
  troopmarch: ['Five-Star General', 'Captain', 'Private First Class'],
  rocketlaunch: ['Moon Walker', 'Test Pilot', 'Flight Cadet'],
  racerwords: ['Champion Racer', 'Podium Finisher', 'Rookie Driver'],
  treasuremap: ['Legendary Pirate Captain', 'First Mate', 'Cabin Boy'],
  jetfighter: ['Squadron Ace', 'Wingman', 'Rookie Pilot'],
}

const GENERIC: [string, string, string] = ['Legendary Hero', 'Brave Adventurer', 'Word Explorer']

export function rankFor(gameId: string, stars: number): string {
  const ranks = MISSION_RANKS[gameId] ?? GENERIC
  if (stars >= 3) return ranks[0]
  if (stars === 2) return ranks[1]
  return ranks[2]
}
