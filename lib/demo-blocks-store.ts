export type DemoBlock = {
  id: string
  barber_id: string
  block_date: string
  start_time: string
  end_time: string
  reason: string
  block_type: "break" | "absence" | "personal" | "vacation"
}

// Shared in-memory store — both /api/schedule-blocks and /api/availability read from here in demo mode.
// Resets on server restart (expected behavior for demo).
export const demoBlocksStore: DemoBlock[] = []
