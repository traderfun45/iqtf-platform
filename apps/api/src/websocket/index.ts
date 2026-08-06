import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { parse } from 'url'
import { MarketHandler } from './handlers/market.handler'
import { subscriptionService } from './services/subscription.service'
import { WebSocketClient } from './types/websocket.types'

export class WebSocketManager {
  private wss: WebSocketServer
  private clients: Map<string, WebSocketClient> = new Map()

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' })
    this.setupWebSocket()
    this.setupHeartbeat()
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const client: WebSocketClient = { ws, subscriptions: new Set(), isAlive: true }
      this.clients.set(clientId, client)
      subscriptionService.addClient(clientId, client)

      const marketHandler = new MarketHandler(ws, clientId)

      ws.on('message', async (data: string) => {
        try {
          const message = JSON.parse(data.toString())
          await marketHandler.handleMessage(message)
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid message' }, timestamp: Date.now() }))
        }
      })

      ws.on('close', () => {
        this.clients.delete(clientId)
        subscriptionService.removeClient(clientId)
      })

      ws.send(JSON.stringify({ type: 'connected', data: { clientId }, timestamp: Date.now() }))
    })
  }

  private setupHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (client.ws.readyState === WebSocket.OPEN) client.ws.ping()
        else {
          this.clients.delete(clientId)
          subscriptionService.removeClient(clientId)
        }
      })
    }, 30000)
  }

  getConnectedClients(): number {
    return this.clients.size
  }
}
