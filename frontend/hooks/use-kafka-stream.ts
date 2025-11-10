"use client"

import { useState, useEffect, useCallback } from "react"

type KafkaMessage = {
  type: string
  topic?: string
  data?: any
  timestamp?: number
  status?: string
  message?: string
}

type KafkaStreamOptions = {
  onVehicleData?: (data: any) => void
  onOrderData?: (data: any) => void
  onPerformanceData?: (data: any) => void
  onError?: (error: any) => void
  onConnectionChange?: (connected: boolean) => void
}

export function useKafkaStream(options: KafkaStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastMessage, setLastMessage] = useState<KafkaMessage | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)

  const handleConnectionChange = useCallback(
    (connected: boolean) => {
      setIsConnected(connected)
      options.onConnectionChange?.(connected)
    },
    [options],
  )

  const handleError = useCallback(
    (error: Error) => {
      setError(error)
      options.onError?.(error)
    },
    [options],
  )

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectToStream = () => {
      try {
        console.log(`Attempting to connect to Kafka stream (attempt ${connectionAttempts + 1})`)

        // Create SSE connection
        eventSource = new EventSource("/api/kafka-stream")

        eventSource.onopen = (event) => {
          console.log("SSE connection opened", event)
          handleConnectionChange(true)
          setError(null)
          setConnectionAttempts(0)
        }

        eventSource.onmessage = (event) => {
          try {
            const message: KafkaMessage = JSON.parse(event.data)
            setLastMessage(message)

            console.log("Received message:", message)

            // Handle different message types
            switch (message.type) {
              case "connection":
                if (message.status === "kafka-connected") {
                  handleConnectionChange(true)
                }
                break

              case "kafka-message":
                // Route messages based on topic
                if (message.topic === "vehicle-tracking" && options.onVehicleData) {
                  options.onVehicleData(message.data)
                } else if (message.topic === "order-status" && options.onOrderData) {
                  options.onOrderData(message.data)
                } else if (message.topic === "logistics-data" && options.onPerformanceData) {
                  options.onPerformanceData(message.data)
                }
                break

              case "error":
                handleError(new Error(message.message || "Unknown Kafka error"))
                break
            }
          } catch (err) {
            console.error("Error parsing SSE message:", err)
            handleError(new Error("Failed to parse message from server"))
          }
        }

        eventSource.onerror = (event) => {
          console.error("SSE connection error:", event)
          handleConnectionChange(false)

          // Close the current connection
          eventSource?.close()

          // Increment connection attempts
          setConnectionAttempts((prev) => prev + 1)

          // Set error message
          handleError(new Error(`Connection failed (attempt ${connectionAttempts + 1})`))

          // Retry connection with exponential backoff (max 30 seconds)
          const retryDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000)
          console.log(`Retrying connection in ${retryDelay}ms`)

          reconnectTimeout = setTimeout(() => {
            connectToStream()
          }, retryDelay)
        }
      } catch (err) {
        console.error("Failed to create SSE connection:", err)
        handleError(err instanceof Error ? err : new Error("Unknown connection error"))
      }
    }

    // Start initial connection
    connectToStream()

    // Cleanup function
    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [connectionAttempts, handleConnectionChange, handleError, options])

  return {
    isConnected,
    error,
    lastMessage,
    connectionAttempts,
  }
}
