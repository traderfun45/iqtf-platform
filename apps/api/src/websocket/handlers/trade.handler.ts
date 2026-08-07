import { WebSocket } from 'ws'
import { WebSocketMessage, WebSocketResponse } from '../types/websocket.types'
import { PrismaClient } from '@prisma/client'
import { subscriptionService } from '../services/subscription.service'
import { priceService } from '../services/price.service'
import { createOrder, getPortfolio } from '../../services/trading.service'

const prisma = new PrismaClient()

export class TradeHandler {
  constructor(private ws: WebSocket, private userId?: string) {}

  async handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'trade':
        await this.handleTrade(message.data)
        break
      case 'get_portfolio':
        await this.handleGetPortfolio()
        break
      case 'get_orders':
        await this.handleGetOrders(message.data)
        break
      default:
        break
    }
  }

  private async handleTrade(data: any) {
    if (!this.userId) {
      this.sendError('Authentication required')
      return
    }

    try {
      const { symbol, side, type, quantity, price } = data
      
      const order = await createOrder(this.userId, {
        symbol,
        side,
        type,
        quantity,
        price,
      })

      // Broadcast trade update
      subscriptionService.broadcast(`user:${this.userId}`, {
        type: 'order_created',
        data: order,
        timestamp: Date.now()
      })

      // Send confirmation
      const response: WebSocketResponse = {
        type: 'trade',
        data: { ...order, status: 'confirmed' },
        timestamp: Date.now()
      }
      this.ws.send(JSON.stringify(response))

    } catch (error: any) {
      this.sendError(error.message || 'Failed to execute trade')
    }
  }

  private async handleGetPortfolio() {
    if (!this.userId) {
      this.sendError('Authentication required')
      return
    }

    try {
      const portfolio = await getPortfolio(this.userId)
      this.ws.send(JSON.stringify({
        type: 'portfolio',
        data: portfolio,
        timestamp: Date.now()
      }))
    } catch (error: any) {
      this.sendError(error.message || 'Failed to get portfolio')
    }
  }

  private async handleGetOrders(data: any) {
    if (!this.userId) {
      this.sendError('Authentication required')
      return
    }

    // TODO: Implement getOrders via WebSocket
  }

  private sendError(message: string) {
    const response: WebSocketResponse = {
      type: 'error',
      data: { message },
      timestamp: Date.now()
    }
    this.ws.send(JSON.stringify(response))
  }
}
