import * as cheerio from "cheerio"
import type { Job, ScraperResult } from "./types"

export async function scrapeHrGe(searchQuery?: string): Promise<ScraperResult> {
  try {
    const baseUrl = "https://www.hr.ge"
    const searchUrl = searchQuery
      ? `${baseUrl}/search-posting?q=${encodeURIComponent(searchQuery)}`
      : `${baseUrl}/search-posting`

    console.log("[v0] Fetching hr.ge:", searchUrl)

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
      console.log("[v0] hr.ge response status:", response.status)
      return { jobs: [], error: `hr.ge returned ${response.status}` }
    }

    const html = await response.text()
    console.log("[v0] hr.ge HTML length:", html.length)

    const $ = cheerio.load(html)
    const jobs: Job[] = []
    const seenIds = new Set<string>()

    // Look for job announcement links
    $("a[href*='/announcement/']").each((_, el) => {
      const $el = $(el)
      const href = $el.attr("href")
      
      if (!href) return
      
      // Extract job ID from URL like /announcement/407513/...
      const idMatch = href.match(/\/announcement\/(\d+)/)
      if (!idMatch) return
      
      const jobId = idMatch[1]
      
      // Skip duplicates
      if (seenIds.has(jobId)) return
      seenIds.add(jobId)
      
      // Get the card/container element
      const $card = $el.closest("div").parent()
      
      // Try to get title from the link or nearby heading
      let title = $el.find("h3, h2, .title, [class*='title']").first().text().trim()
      if (!title) {
        title = $el.text().trim().split("\n")[0].trim()
      }

      if (!title || title.length < 3) return

      const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`

      // Company is in customer links
      const company = $card.find("a[href*='/customer/']").first().text().trim()
      
      // Extract location from the text
      const cardText = $card.text()
      let location = "თბილისი"
      const locationMatches = cardText.match(/(თბილისი|ბათუმი|ქუთაისი|რუსთავი|ზუგდიდი|გორი|ფოთი|ქობულეთი|სამტრედია|ხაშური|სენაკი|მარნეული|თელავი|ახალციხე|ოზურგეთი)/i)
      if (locationMatches) {
        location = locationMatches[1]
      }

      // Check for salary indicator
      const hasSalary = $card.find("[class*='currency'], [class*='salary'], [class*='gel'], [class*='lari']").length > 0

      // Date - look for date patterns
      const dateMatch = cardText.match(/(\d{1,2}\s*(?:აპრილი|აპრ|მაისი|მაი|ივნისი|ივნ|ივლისი|ივლ|აგვისტო|აგვ|სექტემბერი|სექ|ოქტომბერი|ოქტ|ნოემბერი|ნოე|დეკემბერი|დეკ|იანვარი|იან|იანვ|თებერვალი|თებ|მარტი|მარ))/i)
      const dateText = dateMatch ? dateMatch[1] : ""

      jobs.push({
        id: `hrge-${jobId}`,
        title,
        company: company || undefined,
        location,
        salary: hasSalary ? "მითითებულია" : undefined,
        postedAt: parseGeorgianDate(dateText),
        source: "hr.ge",
        url: fullUrl,
      })
    })

    console.log("[v0] hr.ge parsed jobs:", jobs.length)
    return { jobs }
  } catch (error) {
    console.error("[v0] hr.ge scraper error:", error)
    return { jobs: [], error: `hr.ge scraping failed: ${error}` }
  }
}

function parseGeorgianDate(dateText: string): string {
  if (!dateText) return new Date().toISOString()

  const now = new Date()
  const georgianMonths: Record<string, number> = {
    იან: 0, იანვ: 0,
    თებ: 1,
    მარ: 2,
    აპრ: 3,
    მაი: 4,
    ივნ: 5,
    ივლ: 6,
    აგვ: 7,
    სექ: 8,
    ოქტ: 9,
    ნოე: 10,
    დეკ: 11,
  }

  const dayMatch = dateText.match(/(\d{1,2})/)
  const day = dayMatch ? Number.parseInt(dayMatch[1]) : now.getDate()

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
