import { WebSocket } from 'ws'
import { WebSocketMessage, WebSocketResponse } from '../types/websocket.types'
import { priceService } from '../services/price.service'
import { subscriptionService } from '../services/subscription.service'

export class MarketHandler {
  private clientId: string

  constructor(private ws: WebSocket, clientId: string) {
    this.clientId = clientId
    priceService.subscribe((data) => {
      subscriptionService.broadcast(`price:${data.symbol}`, {
        type: 'price',
        channel: `price:${data.symbol}`,
        data,
        timestamp: Date.now()
      })
    })
  }

  async handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'subscribe':
        const channel = message.channel
        if (!channel) return this.sendError('Channel is required')
        subscriptionService.subscribe(this.clientId, channel)
        this.ws.send(JSON.stringify({ type: 'subscribed', channel, timestamp: Date.now() }))
        break
      case 'unsubscribe':
        const unsubChannel = message.channel
        if (!unsubChannel) return this.sendError('Channel is required')
        subscriptionService.unsubscribe(this.clientId, unsubChannel)
        this.ws.send(JSON.stringify({ type: 'unsubscribed', channel: unsubChannel, timestamp: Date.now() }))
        break
      case 'ping':
        this.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        break
      default:
        this.sendError('Unknown message type')
    }
  }

  private sendError(message: string) {
    this.ws.send(JSON.stringify({ type: 'error', data: { message }, timestamp: Date.now() }))
  }
}
