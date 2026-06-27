import { getStore } from '@netlify/blobs'

function store() {
  return getStore({
    name: 'calibre',
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  })
}

export const handler = async () => {
  try {
    const s = await store().get('stats')
    const stats = s ? JSON.parse(s) : {}
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(stats)
    }
  } catch (e) {
    console.error('[stats] error:', e.message)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: e.message })
    }
  }
}
