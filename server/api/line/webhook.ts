// ↓ この1行を一番上に追加して、h3（Nuxtの内部サーバーライブラリ）から直接読み込みます
import { defineEventHandler, getMethod, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  // 1. リクエストの種類（GETかPOSTか）を確認
  const method = getMethod(event)

  // 2. ブラウザで直接開いた場合（GET）の対策
  // エラーを起こさず、画面に文字を表示する
  if (method === 'GET') {
    return 'Webhook is running!'
  }

  // 3. LINEからの通知（POST）の処理
  try {
    const body = await readBody(event)

    // 空のデータが来た場合の安全対策
    if (!body) {
      return 'No body'
    }

    // LINEのWebhook接続テスト（検証ボタン）への対応
    if (body.events && body.events.length === 0) {
      console.log('✅ LINEボットからの接続テスト成功！')
      return 'OK'
    }

    // 実際にメッセージが来た時のログ出力
    console.log('📩 LINEから通知が来ました:', JSON.stringify(body, null, 2))

    return 'OK'
  } catch (error) {
    console.error('❌ Webhook処理中にエラー:', error)
    return 'Error'
  }
})