import { getStore } from '@netlify/blobs'

function store() {
  return getStore({
    name: 'calibre',
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  })
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body)
    const { books, stats, offset, total, isLast } = body

    if (!Array.isArray(books)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: '缺少 books 陣列' }) }
    }

    const s = store()

    if (offset === undefined || total === undefined) {
      // 舊式單次上傳（相容性）
      await Promise.all([
        s.set('books.json', JSON.stringify(books)),
        s.set('stats', JSON.stringify(stats || {})),
      ])
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ ok: true, count: books.length })
      }
    }

    // ── 分批上傳模式 ─────────────────────────────────────────────
    // 讀取目前已累積的資料
    const existingJson = offset === 0 ? null : await s.get('books_tmp.json')
    const existing = existingJson ? JSON.parse(existingJson) : []

    // 合併新批次
    const merged = [...existing, ...books]

    if (!isLast) {
      // 尚未完成 — 儲存到暫存 key
      await s.set('books_tmp.json', JSON.stringify(merged))
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ ok: true, count: merged.length })
      }
    }

    // 最後一批 — 一次寫入正式的 books.json 並清除暫存
    await Promise.all([
      s.set('books.json', JSON.stringify(merged)),
      s.set('stats', JSON.stringify(stats || {})),
      s.delete('books_tmp.json').catch(() => {}),  // 清理暫存，若不存在則忽略
    ])

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ok: true, count: merged.length })
    }

  } catch (e) {
    console.error('[upload] error:', e.message, e.stack)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ok: false, error: e.message })
    }
  }
}
