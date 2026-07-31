export interface BookMetadata {
  title: string
  author: string
  publishYear: number | null
  coverUrl: string | null
}

export async function lookupISBN(isbn: string): Promise<BookMetadata | null> {
  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}(\d{3})?$/.test(clean)) return null

  return (await lookupOpenLibrary(clean)) ?? (await lookupGoogleBooks(clean))
}

async function lookupOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null

    const data = await res.json()
    const book = data[`ISBN:${isbn}`]
    if (!book) return null

    const author = Array.isArray(book.authors)
      ? book.authors.map((a: { name: string }) => a.name).join(', ')
      : ''

    const publishYear = book.publish_date
      ? parseInt(book.publish_date.slice(-4), 10) || null
      : null

    return {
      title: book.title ?? '',
      author,
      publishYear,
      coverUrl: book.cover?.medium ?? book.cover?.small ?? null,
    }
  } catch {
    return null
  }
}

// Needs GOOGLE_BOOKS_API_KEY in env for Argentine/Spanish publisher coverage.
// Without a key, Google applies a shared daily quota that can be exhausted.
async function lookupGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const url = apiKey
    ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1&key=${apiKey}`
    : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null

    const data = await res.json()
    const volume = data.items?.[0]?.volumeInfo
    if (!volume) return null

    const author = Array.isArray(volume.authors) ? volume.authors.join(', ') : ''
    const publishYear = volume.publishedDate
      ? parseInt(volume.publishedDate.slice(0, 4), 10) || null
      : null
    const coverUrl = volume.imageLinks?.thumbnail?.replace('http:', 'https:') ?? null

    return { title: volume.title ?? '', author, publishYear, coverUrl }
  } catch {
    return null
  }
}
