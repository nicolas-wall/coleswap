export interface BookMetadata {
  title: string
  author: string
  publishYear: number | null
  coverUrl: string | null
}

export async function lookupISBN(isbn: string): Promise<BookMetadata | null> {
  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}(\d{3})?$/.test(clean)) return null

  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&jscmd=data&format=json`,
      { next: { revalidate: 86400 } } // cachear 24h — los metadatos de libros no cambian
    )
    if (!res.ok) return null

    const data = await res.json()
    const key = `ISBN:${clean}`
    const book = data[key]
    if (!book) return null

    const author = Array.isArray(book.authors)
      ? book.authors.map((a: { name: string }) => a.name).join(', ')
      : ''

    const publishYear = book.publish_date
      ? parseInt(book.publish_date.slice(-4), 10) || null
      : null

    const coverUrl = book.cover?.medium ?? book.cover?.small ?? null

    return {
      title: book.title ?? '',
      author,
      publishYear,
      coverUrl,
    }
  } catch {
    return null
  }
}
