import type { Job, ScraperResult, Stats } from "./types"
import { scrapeJobsGe } from "./jobs-ge"
import { scrapeHrGe } from "./hr-ge"

export type { Job, ScraperResult, Stats }

// Available scrapers - only include sites that work with HTML scraping
// (myjobs.ge, motivation.ge, jobs.ss.ge, awork.ge are SPAs requiring JS rendering)
const SCRAPERS: Record<string, (query?: string) => Promise<ScraperResult>> = {
  "jobs.ge": scrapeJobsGe,
  "hr.ge": scrapeHrGe,
}

export const AVAILABLE_SOURCES = Object.keys(SCRAPERS)

export async function scrapeAllSources(
  searchQuery?: string,
  sourceFilter?: string,
): Promise<{ jobs: Job[]; errors: string[] }> {
  const errors: string[] = []
  let allJobs: Job[] = []

  // If a specific source is selected, only scrape that one
  const sourcesToScrape =
    sourceFilter && sourceFilter !== "all" && SCRAPERS[sourceFilter]
      ? { [sourceFilter]: SCRAPERS[sourceFilter] }
      : SCRAPERS

  console.log("[v0] Scraping sources:", Object.keys(sourcesToScrape))

  // Run all scrapers in parallel with timeout
  const timeoutMs = 15000 // 15 seconds timeout per scraper

  const results = await Promise.allSettled(
    Object.entries(sourcesToScrape).map(async ([source, scraper]) => {
      if (!scraper) {
        errors.push(`Unknown source: ${source}`)
        return { jobs: [], source }
      }

      try {
        // Add timeout wrapper
        const result = await Promise.race([
          scraper(searchQuery),
          new Promise<ScraperResult>((_, reject) =>
            setTimeout(() => reject(new Error(`${source} timeout after ${timeoutMs}ms`)), timeoutMs)
          ),
        ])

        if (result.error) {
          errors.push(result.error)
        }
        return { jobs: result.jobs, source }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        errors.push(`${source}: ${errorMessage}`)
        return { jobs: [], source }
      }
    }),
  )

  // Collect all jobs from successful scrapes
  for (const result of results) {
    if (result.status === "fulfilled") {
      allJobs = allJobs.concat(result.value.jobs)
    } else {
      errors.push(`Scraper failed: ${result.reason}`)
    }
  }

  // Remove duplicates by ID
  const seen = new Set<string>()
  allJobs = allJobs.filter((job) => {
    if (seen.has(job.id)) return false
    seen.add(job.id)
    return true
  })

  // Sort by date (newest first)
  allJobs.sort((a, b) => {
    const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0
    const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0
    return dateB - dateA
  })

  // Mark jobs as new (within last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  allJobs = allJobs.map((job) => ({
    ...job,
    isNew: job.postedAt ? new Date(job.postedAt).getTime() > oneDayAgo : false,
  }))

  console.log("[v0] Total jobs scraped:", allJobs.length)
  if (errors.length > 0) {
    console.log("[v0] Errors:", errors)
  }

  return { jobs: allJobs, errors }
}

export function calculateStats(jobs: Job[]): Stats {
  const jobsPerSource: Record<string, number> = {}
  let newTodayCount = 0
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

  for (const job of jobs) {
    if (job.source) {
      jobsPerSource[job.source] = (jobsPerSource[job.source] || 0) + 1
    }
    if (job.postedAt && new Date(job.postedAt).getTime() > oneDayAgo) {
      newTodayCount++
    }
  }

  return {
    totalActiveJobs: jobs.filter((j) => !j.isArchived).length,
    jobsPerSource,
    newTodayCount,
  }
}
