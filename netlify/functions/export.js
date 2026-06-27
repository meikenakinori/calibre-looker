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

    const headers = ['ID', '標題', '作者', '系列', '出版商', '評分', '標籤', '語言', '格式', 'ISBN', '出版日期', '添加時間', '路徑', '備註']
    const bom = Buffer.from([0xEF, 0xBB, 0xBF])
    const lines = [headers.join(',')]
    for (const b of rows) {
      const rating5 = b.rating ? (b.rating / 2).toString() : ''
      const line = [
        b.id, csv(b.title), csv(b.authors), csv(b.series_name), csv(b.publisher),
        rating5, csv(b.tags), csv(b.languages), csv(b.formats), csv(b.isbn),
        b.pubdate || '', b.timestamp || '', csv(b.path), csv(stripHtml(b.comments || '')),
      ].join(',')
      lines.push(line)
    }
    const csvContent = Buffer.concat([bom, Buffer.from(lines.join('\n'))])

    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="calibre_books.csv"',
        'cache-control': 'no-store'
      },
      body: csvContent.toString('base64'),
      isBase64Encoded: true
    }
  } catch (e) {
    console.error('[export] error:', e.message)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: e.message })
    }
  }
}

function csv(s) { const v = (s ?? '').toString(); const esc = v.replace(/"/g, '""'); return `"${esc}"` }
function stripHtml(s) { return s.replace(/<[^>]+>/g, '') }
