// Mock Kafka client for next-lite environment
// This simulates real Kafka behavior for demonstration purposes

export type MessageHandler = (message: { topic: string; data: any }) => void

// Mock consumer class
class MockConsumer {
  private topics: string[] = []
  private handler: MessageHandler | null = null
  private interval: NodeJS.Timeout | null = null
  private connected = false

  async connect() {
    this.connected = true
    console.log("Mock Kafka consumer connected")
  }

  async subscribe(config: { topic: string; fromBeginning?: boolean }) {
    this.topics.push(config.topic)
    console.log(`Subscribed to topic: ${config.topic}`)
  }

  async run(config: {
    eachMessage: (params: { topic: string; partition: number; message: { value: Buffer } }) => Promise<void>
  }) {
    if (!this.connected) {
      throw new Error("Consumer not connected")
    }

    // Start generating mock messages
    this.interval = setInterval(() => {
      this.topics.forEach((topic) => {
        const mockData = this.generateMockDataForTopic(topic)
        const message = {
          topic,
          partition: 0,
          message: {
            value: Buffer.from(JSON.stringify(mockData)),
          },
        }
        config.eachMessage(message).catch(console.error)
      })
    }, 3000) // Send data every 3 seconds
  }

  async disconnect() {
    this.connected = false
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    console.log("Mock Kafka consumer disconnected")
  }

  private generateMockDataForTopic(topic: string) {
    switch (topic) {
      case "vehicle-tracking":
        return {
          vehicles: Array.from({ length: 8 }, (_, i) => ({
            id: `V${String(i + 1).padStart(3, "0")}`,
            location: {
              lat: 39.9042 + (Math.random() - 0.5) * 0.1,
              lng: 116.4074 + (Math.random() - 0.5) * 0.1,
            },
            status: Math.random() > 0.8 ? "delayed" : Math.random() > 0.9 ? "error" : "normal",
            speed: Math.floor(Math.random() * 80 + 20),
            cargo: Math.floor(Math.random() * 100 + 50),
          })),
        }

      case "order-status":
        const total = 15000 + Math.floor(Math.random() * 1000)
        const processing = 1000 + Math.floor(Math.random() * 500)
        const completed = total - processing
        const delayed = Math.floor(Math.random() * 100)
        return {
          total,
          processing,
          completed,
          delayed,
        }

      case "logistics-data":
        return {
          performance: {
            throughput: Math.floor(Math.random() * 1000 + 8000),
            latency: Math.floor(Math.random() * 50 + 10),
            errorRate: Math.random() * 2,
          },
          cluster: {
            nodes: [
              { id: "master", status: "active", cpu: Math.random() * 100, memory: Math.random() * 100 },
              { id: "worker-1", status: "active", cpu: Math.random() * 100, memory: Math.random() * 100 },
              { id: "worker-2", status: "active", cpu: Math.random() * 100, memory: Math.random() * 100 },
            ],
          },
        }

      default:
        return { message: "Unknown topic", timestamp: Date.now() }
    }
  }
}

// Mock Kafka client
export function getKafkaClient() {
  return {
    consumer: (config: { groupId: string }) => new MockConsumer(),
  }
}

export async function createConsumer(groupId: string): Promise<MockConsumer> {
  const kafka = getKafkaClient()
  const consumer = kafka.consumer({ groupId })
  await consumer.connect()
  return consumer
}

export async function subscribeToTopic(consumer: MockConsumer, topic: string) {
  await consumer.subscribe({ topic, fromBeginning: false })
}

export async function startConsumer(consumer: MockConsumer, handler: MessageHandler) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        if (message.value) {
          const data = JSON.parse(message.value.toString())
          handler({ topic, data })
        }
      } catch (error) {
        console.error("Error processing message:", error)
      }
    },
  })
}

export async function disconnectConsumer(consumer: MockConsumer) {
  await consumer.disconnect()
}
