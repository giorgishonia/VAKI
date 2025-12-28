import { NextResponse } from "next/server"
import { scrapeAllSources, calculateStats } from "@/lib/scrapers"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || undefined
  const source = searchParams.get("source") || undefined
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
  const onlyNew = searchParams.get("onlyNew") === "true"

  try {
    console.log("[v0] Scraping jobs with params:", { search, source, page, limit, onlyNew })

    const { jobs, errors } = await scrapeAllSources(search, source)

    console.log("[v0] Scraped", jobs.length, "jobs total")
    if (errors.length > 0) {
      console.log("[v0] Scraping errors:", errors)
    }

    // Filter for only new if requested
    const filteredJobs = onlyNew ? jobs.filter((job) => job.isNew) : jobs

    // Paginate
    const startIndex = (page - 1) * limit
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + limit)
    const hasMore = startIndex + limit < filteredJobs.length

    // Calculate stats
    const stats = calculateStats(jobs)

    return NextResponse.json({
      jobs: paginatedJobs,
      stats,
      pagination: {
        page,
        limit,
        total: filteredJobs.length,
        hasMore,
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Jobs API error:", error)
    return NextResponse.json({ error: "Failed to fetch jobs", jobs: [], stats: null }, { status: 500 })
  }
}
