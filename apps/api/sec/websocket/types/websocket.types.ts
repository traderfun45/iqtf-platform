import { WebSocket } from 'ws'

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'trade' | 'strategy' | 'ping'
  channel?: string
  data?: any
  id?: string
}

export interface WebSocketResponse {
  type: 'subscribed' | 'unsubscribed' | 'price' | 'trade' | 'strategy_update' | 'error' | 'pong'
  channel?: string
  data?: any
  id?: string
  timestamp: number
}

export interface PriceData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  timestamp: number
}

export interface WebSocketClient {
  ws: WebSocket
  subscriptions: Set<string>
  userId?: string
  isAlive: boolean
}
