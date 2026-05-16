import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    if (!body) return { error: 'No body' }

    const { userId, message } = body as { userId?: string; message?: string }
    if (!userId || !message) return { error: 'Missing userId or message' }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!token) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN is not set')
      return { error: 'Server misconfigured: missing LINE_CHANNEL_ACCESS_TOKEN' }
    }

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text: message }],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('LINE API error:', res.status, text)
      return { error: 'LINE API error', status: res.status, body: text }
    }

    return { success: true }
  } catch (err) {
    console.error('notify handler error:', err)
    return { error: 'Internal server error' }
  }
})
