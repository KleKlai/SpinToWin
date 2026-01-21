// API Response interface
export interface APIPrize {
  id: number
  hex_color: string
  discount_percent: number
  probability: number
}

export interface Prize {
  id: number
  name: string
  color: string
  probability: number // Decimal (0-1), e.g., 0.25 = 25%
}

export const DEFAULT_WHEEL_PRIZES: Prize[] = [
  { id: 1, name: '25% Discount', color: '#FF5733', probability: 0.04 },
  { id: 2, name: '5% Discount', color: '#33FF57', probability: 0.8 },
  { id: 3, name: '15% Discount', color: '#3357FF', probability: 0.1 },
  { id: 4, name: '50% Discount', color: '#F333FF', probability: 0.001 },
  { id: 5, name: '1% Discount', color: '#FFC300', probability: 0.05 },
]

export function transformAPIPrizes(apiPrizes: APIPrize[]): Prize[] {
  return apiPrizes.map(prize => ({
    id: prize.id,
    name: `${(prize.discount_percent * 100).toFixed(0)}% Discount`,
    color: prize.hex_color,
    probability: prize.probability,
  }))
}

export const WHEEL_CONFIG = {
  spinDuration: 6000,
  minSpins: 8,
  maxSpins: 12,
  stopEasing: 5,
  centerCircleRadius: 30,
  centerCircleColor: 'white',
  centerCircleBorder: '#333',
  pointerColor: '#333',
  segmentBorder: 'white',
  segmentBorderWidth: 3,
  textColor: 'white',
  textFont: 'bold 13px sans-serif',
  pointerSize: 15,
} as const

export function getWeightedRandomPrize(prizes: Prize[]): Prize {
  // Generate random number between 0 and 1
  let random = Math.random()
  let cumulativeProbability = 0

  // Find which prize the random number falls into
  for (let i = 0; i < prizes.length; i++) {
    cumulativeProbability += prizes[i].probability
    if (random <= cumulativeProbability) {
      return prizes[i]
    }
  }

  // Fallback to last prize (shouldn't happen with proper probabilities)
  return prizes[prizes.length - 1]
}

// Fetch wheel prizes from API
export async function fetchWheelPrizes(): Promise<Prize[]> {
  try {
    const response = await fetch('https://n8n.zenglobal.cloud/webhook/cd782ded-b894-4798-a8b6-68aa8430236b')
    if (!response.ok) {
      console.warn('Failed to fetch wheel prizes from API, using defaults')
      return DEFAULT_WHEEL_PRIZES
    }
    const apiPrizes: APIPrize[] = await response.json()
    return transformAPIPrizes(apiPrizes)
  } catch (error) {
    console.warn('Error fetching wheel prizes:', error)
    return DEFAULT_WHEEL_PRIZES
  }
}