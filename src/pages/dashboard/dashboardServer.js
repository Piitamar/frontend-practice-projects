import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// HTTP routes
app.get('/', (req, res) => {
    res.json({
        message: 'Market Pulse server is running'
    })
})

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok'
    })
})

// --------------------
// WebSocket server
// --------------------
const server = createServer(app)

const wss = new WebSocketServer({
    server
})

// --------------------
// Binance WebSocket
// --------------------
const binanceWs = new WebSocket(
    'wss://stream.binance.com:9443/ws/btcusdt@ticker'
)

let currentPrice = null
let previousPrice = null

binanceWs.on('open', () => {
    console.log('Connected to Binance')
})

binanceWs.on('message', (message) => {
    const data = JSON.parse(message)

    console.log({
        price: data.c,
        eventTime: data.E
    })

    currentPrice = Number(data.c)
})

binanceWs.on('close', () => {
    console.log('Disconnected from Binance')
})

binanceWs.on('error', (error) => {
    console.error('Binance WebSocket error:', error)
})

// --------------------
// Calculate every second
// --------------------

setInterval(() => {
    if (currentPrice === null) {
        return
    }

    if (previousPrice === null) {
        previousPrice = currentPrice
        return
    }

    const change =
        ((currentPrice - previousPrice) / previousPrice) * 100

    const result = {
        currency: 'BTC',
        price: currentPrice,
        change: Number(change.toFixed(5))
    }

    console.log(result)

    // Send to every connected client
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(result))
        }
    })

    previousPrice = currentPrice
}, 1000)

// --------------------
// Client connection
// --------------------

wss.on('connection', (ws) => {
    console.log('Client connected')

    ws.on('close', () => {
        console.log('Client disconnected')
    })
})

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
    console.log(`WebSocket running at ws://localhost:${PORT}`)
})