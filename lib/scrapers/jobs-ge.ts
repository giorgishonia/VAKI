import * as cheerio from "cheerio"
import type { Job, ScraperResult } from "./types"

export async function scrapeJobsGe(searchQuery?: string): Promise<ScraperResult> {
  try {
    const baseUrl = "https://www.jobs.ge"
    const searchUrl = searchQuery ? `${baseUrl}/ge/?q=${encodeURIComponent(searchQuery)}` : `${baseUrl}/ge/`

    console.log("[v0] Fetching jobs.ge from:", searchUrl)

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return { jobs: [], error: `jobs.ge returned ${response.status}` }
    }

    const html = await response.text()
    console.log("[v0] jobs.ge HTML length:", html.length)

    const $ = cheerio.load(html)
    const jobs: Job[] = []
    const seenIds = new Set<string>()

    // Jobs are in table rows with job links
    $("table tr").each((_, row) => {
      const $row = $(row)
      const cells = $row.find("td")

      if (cells.length < 3) return

      // Find the job link - it's in format /ge/?view=jobs&id=XXXXX
      const linkEl = $row.find('a[href*="view=jobs"]').first()
      if (!linkEl.length) return

      const title = linkEl.text().trim()
      const href = linkEl.attr("href")

      if (!title || !href || title.length < 3) return

      const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`

      // Extract job ID from URL
      const idMatch = href.match(/id=(\d+)/)
      const jobId = idMatch ? idMatch[1] : Buffer.from(href).toString("base64").slice(0, 16)
      
      // Skip duplicates
      if (seenIds.has(jobId)) return
      seenIds.add(jobId)

      // Company is usually in a link with view=client or just text
      const companyLink = $row.find('a[href*="view=client"]').first()
      const company = companyLink.length ? companyLink.text().trim() : undefined

      // Location might be in italic or after a dash in the title
      let location = "თბილისი"
      const italicLocation = $row.find("i, em").first().text().trim()
      if (italicLocation) {
        location = italicLocation.replace(/^-\s*/, "").trim()
      }

      // Date is usually in cells with Georgian month names
      let dateText = ""
      cells.each((_, cell) => {
        const text = $(cell).text().trim()
        // Georgian month names (including short versions)
        if (
          text.match(
            /აპრილი|აპრ|მაისი|მაი|ივნისი|ივნ|ივლისი|ივლ|აგვისტო|აგვ|სექტემბერი|სექ|ოქტომბერი|ოქტ|ნოემბერი|ნოე|დეკემბერი|დეკ|იანვარი|იან|იანვ|თებერვალი|თებ|მარტი|მარ/i,
          )
        ) {
          if (!dateText) dateText = text
        }
      })

      // Check for "new" indicator
      const isNew = $row.find('img[alt*="ახალი"], img[src*="new"], .new').length > 0

      // Check for salary indicator
      const hasSalary = $row.find('img[alt*="ხელფასი"], img[src*="salary"]').length > 0

      jobs.push({
        id: `jobsge-${jobId}`,
        title,
        company,
        location,
        salary: hasSalary ? "მითითებულია" : undefined,
        postedAt: parseGeorgianDate(dateText),
        source: "jobs.ge",
        url: fullUrl,
        isNew,
      })
    })

    console.log("[v0] jobs.ge parsed jobs:", jobs.length)
    return { jobs }
  } catch (error) {
    console.error("[v0] jobs.ge scraper error:", error)
    return { jobs: [], error: `jobs.ge scraping failed: ${error}` }
  }
}

function parseGeorgianDate(dateText: string): string {
  if (!dateText) return new Date().toISOString()

  const now = new Date()

  // Georgian month names mapping (case-insensitive)
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

  // Extract day number
  const dayMatch = dateText.match(/(\d{1,2})/)
  const day = dayMatch ? Number.parseInt(dayMatch[1]) : now.getDate()

  // Find month - search case-insensitively
  let month: number | null = null
  const lowerDateText = dateText.toLowerCase()
  for (const [monthName, monthIndex] of Object.entries(georgianMonths)) {
    if (lowerDateText.includes(monthName.toLowerCase())) {
      month = monthIndex
      break
    }
  }
  
  // If no month found, return today's date (assume it's today)
  if (month === null) {
    return now.toISOString()
  }

  const date = new Date(now.getFullYear(), month, day)

  // If the date is in the future, it might be from last year
  if (date > now) {
    date.setFullYear(date.getFullYear() - 1)
  }

  return date.toISOString()
}
