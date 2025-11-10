import type { NextRequest } from "next/server"
import { createConsumer, subscribeToTopic, startConsumer } from "@/lib/kafka-client"
import type { ReadableStreamDefaultController } from "stream/web"

// Store active connections
const clients = new Set<ReadableStreamDefaultController<any>>()

// Global consumer instance
let globalConsumer: any = null
let consumerInitialized = false

// Broadcast message to all connected clients
function broadcast(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`
  const encoder = new TextEncoder()
  const encodedMessage = encoder.encode(message)

  clients.forEach((controller) => {
    try {
      controller.enqueue(encodedMessage)
    } catch (error) {
      console.error("Error broadcasting to client:", error)
      clients.delete(controller)
    }
  })
}

// Initialize mock Kafka consumer
async function initializeKafkaConsumer() {
  if (consumerInitialized) return

  try {
    console.log("Initializing mock Kafka consumer...")

    globalConsumer = await createConsumer("logistics-monitoring-group")

    // Subscribe to topics
    await subscribeToTopic(globalConsumer, "logistics-data")
    await subscribeToTopic(globalConsumer, "vehicle-tracking")
    await subscribeToTopic(globalConsumer, "order-status")

    // Start consuming messages
    await startConsumer(globalConsumer, ({ topic, data }) => {
      broadcast({
        type: "kafka-message",
        topic,
        data,
        timestamp: Date.now(),
      })
    })

    consumerInitialized = true
    console.log("Mock Kafka consumer initialized successfully")

    // Broadcast connection success
    broadcast({
      type: "connection",
      status: "kafka-connected",
      message: "Successfully connected to Kafka stream",
    })
  } catch (error) {
    console.error("Failed to initialize Kafka consumer:", error)
    broadcast({
      type: "error",
      message: error.message || "Failed to connect to Kafka",
    })

    // Retry after 5 seconds
    setTimeout(() => {
      consumerInitialized = false
      initializeKafkaConsumer()
    }, 5000)
  }
}

export async function GET(request: NextRequest) {
  console.log("New SSE connection requested")

  const stream = new ReadableStream({
    start(controller: ReadableStreamDefaultController<any>) {
      clients.add(controller)
      console.log(`Client connected. Total clients: ${clients.size}`)

      // Send initial connection message
      const encoder = new TextEncoder()
      const initialMessage = encoder.encode(
        'data: {"type":"connection","status":"connected","message":"SSE connection established"}\n\n',
      )
      controller.enqueue(initialMessage)

      // Initialize Kafka consumer if not already done
      if (!consumerInitialized) {
        initializeKafkaConsumer()
      }
    },
    cancel(controller: ReadableStreamDefaultController<any>) {
      clients.delete(controller)
      console.log(`Client disconnected. Total clients: ${clients.size}`)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
