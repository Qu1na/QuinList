import reviewsData from '@/data/reviews.json'

export type ReviewItem = {
  id: string
  name: string
  role: string
  company: string
  rating: number
  quote: string
}

export type ReviewsDataset = {
  ratingValue: number
  bestRating: number
  worstRating: number
  reviews: ReviewItem[]
}

export const reviewsDataset = reviewsData as ReviewsDataset

export function getReviewsSummary(data: ReviewsDataset = reviewsDataset) {
  const count = data.reviews.length
  const avg =
    count === 0
      ? 0
      : data.reviews.reduce((sum, r) => sum + r.rating, 0) / count

  const computed = Math.round(avg * 10) / 10
  const score = Math.abs(computed - data.ratingValue) <= 0.05 ? data.ratingValue : computed

  return {
    score: score.toFixed(1),
    scoreNumber: score,
    /** Conteos reales del JSON (SEO / schema). */
    count,
    /** Texto de marketing en la UI. */
    displayCount: '500+',
    bestRating: data.bestRating,
    worstRating: data.worstRating,
    label: 'valorado por clientes',
  }
}

export function buildReviewsJsonLd(data: ReviewsDataset = reviewsDataset) {
  const summary = getReviewsSummary(data)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'QuinList',
    description:
      'Software de gestión de proyectos y colaboración para equipos con tableros Kanban, tareas y workspaces.',
    brand: {
      '@type': 'Brand',
      name: 'QuinList',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: summary.scoreNumber,
      reviewCount: summary.count,
      bestRating: summary.bestRating,
      worstRating: summary.worstRating,
    },
    review: data.reviews.slice(0, 12).map((r) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: summary.bestRating,
      },
      author: {
        '@type': 'Person',
        name: r.name,
      },
      reviewBody: r.quote,
      publisher: {
        '@type': 'Organization',
        name: r.company,
      },
    })),
  }
}
