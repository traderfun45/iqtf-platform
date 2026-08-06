import { WebSocketClient } from '../types/websocket.types'

export class SubscriptionService {
  private clients: Map<string, WebSocketClient> = new Map()
  private channels: Map<string, Set<string>> = new Map()

  addClient(clientId: string, client: WebSocketClient) {
    this.clients.set(clientId, client)
  }

  removeClient(clientId: string) {
    const client = this.clients.get(clientId)
    if (client) {
      client.subscriptions.forEach(channel => this.unsubscribe(clientId, channel))
    }
    this.clients.delete(clientId)
  }

  subscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId)
    if (!client) return false
    client.subscriptions.add(channel)
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)!.add(clientId)
    return true
  }

  unsubscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId)
    if (!client) return false
    client.subscriptions.delete(channel)
    const channelClients = this.channels.get(channel)
    if (channelClients) {
      channelClients.delete(clientId)
      if (channelClients.size === 0) this.channels.delete(channel)
    }
    return true
  }

  broadcast(channel: string, data: any) {
    const clientIds = this.channels.get(channel)
    if (!clientIds) return
    const message = JSON.stringify(data)
    clientIds.forEach(id => {
      const client = this.clients.get(id)
      if (client?.ws.readyState === 1) client.ws.send(message)
    })
  }
}

export const subscriptionService = new SubscriptionService()
