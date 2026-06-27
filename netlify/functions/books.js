import { getStore } from '@netlify/blobs'

function store() {
  return getStore({
    name: 'calibre',
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  })
}

export const handler = async (event) => {
  try {
    const booksJson = await store().get('books.json')
    let rows = booksJson ? JSON.parse(booksJson) : []

    const url = new URL(event.rawUrl || ('http://x' + (event.path || '/')))
    const sp = url.searchParams
    const keyword = (sp.get('keyword') || '').toLowerCase()
    const sortBy = sp.get('sortBy') || 'timestamp'
    const sortOrder = (sp.get('sortOrder') || 'DESC').toUpperCase()
    const page = Math.max(1, Number(sp.get('page') || '1'))
    const pageSize = Math.min(200, Math.max(1, Number(sp.get('pageSize') || '50')))

    if (keyword) {
      rows = rows.filter(b => (`${b.title} ${b.authors} ${b.tags} ${b.series_name}`.toLowerCase()).includes(keyword))
    }
    rows.sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy]
      if (av == null && bv == null) return 0
      if (av == null) return sortOrder === 'ASC' ? -1 : 1
      if (bv == null) return sortOrder === 'ASC' ? 1 : -1
      return sortOrder === 'ASC' ? (av > bv ? 1 : av < bv ? -1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0)
    })

    const start = (page - 1) * pageSize
    const items = rows.slice(start, start + pageSize)

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ items, total: rows.length, page, pageSize })
    }
  } catch (e) {
    console.error('[books] error:', e.message)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: e.message })
    }
  }
}
