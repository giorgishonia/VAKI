/**
 * Utility functions for web scraping
 */

/**
 * Fetch with redirect support and standard headers
 */
export async function fetchWithRedirect(url: string, options?: RequestInit): Promise<Response> {
  const defaultHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  }

  return fetch(url, {
    ...options,
    redirect: "follow",
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  })
}

/**
 * Generate a unique job ID from source and URL
 */
export function generateJobId(source: string, url: string): string {
  const hash = url.split("").reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0
  }, 0)
  return `${source}-${Math.abs(hash).toString(36)}`
}

/**
 * Parse relative date strings to ISO format
 * Handles Georgian date patterns like "დღეს", "გუშინ", "3 დღის წინ", etc.
 */
export function parseRelativeDate(dateText: string): string {
  if (!dateText) return new Date().toISOString()

  const now = new Date()
  const lower = dateText.toLowerCase().trim()

  // Georgian date patterns
  if (lower.includes("დღეს") || lower.includes("today") || lower === "ახალი") {
    return now.toISOString()
  }
  if (lower.includes("გუშინ") || lower.includes("yesterday")) {
    now.setDate(now.getDate() - 1)
    return now.toISOString()
  }

  // Days ago pattern
  const daysMatch = lower.match(/(\d+)\s*(დღის|დღე|day|დღ)/i)
  if (daysMatch) {
    now.setDate(now.getDate() - Number.parseInt(daysMatch[1]))
    return now.toISOString()
  }

  // Weeks ago
  const weeksMatch = lower.match(/(\d+)\s*(კვირ|week)/i)
  if (weeksMatch) {
    now.setDate(now.getDate() - Number.parseInt(weeksMatch[1]) * 7)
    return now.toISOString()
  }

  // Georgian months (full and abbreviated)
  const georgianMonths: Record<string, number> = {
    იანვარი: 0, იანვ: 0, იან: 0,
    თებერვალი: 1, თებ: 1,
    მარტი: 2, მარ: 2,
    აპრილი: 3, აპრ: 3,
    მაისი: 4, მაი: 4,
    ივნისი: 5, ივნ: 5,
    ივლისი: 6, ივლ: 6,
    აგვისტო: 7, აგვ: 7,
    სექტემბერი: 8, სექ: 8,
    ოქტომბერი: 9, ოქტ: 9,
    ნოემბერი: 10, ნოე: 10,
    დეკემბერი: 11, დეკ: 11,
  }

  for (const [month, index] of Object.entries(georgianMonths)) {
    if (lower.includes(month)) {
      const dayMatch = lower.match(/(\d{1,2})/)
      if (dayMatch) {
        const year = now.getFullYear()
        const date = new Date(year, index, Number.parseInt(dayMatch[1]))
        // If date is in future, use last year
        if (date > now) {
          date.setFullYear(year - 1)
        }
        return date.toISOString()
      }
    }
  }

  // Try standard date parsing as fallback
  const parsed = new Date(dateText)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return now.toISOString()
}
