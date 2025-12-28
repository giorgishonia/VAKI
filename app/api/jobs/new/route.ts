import { NextResponse } from "next/server"
import { scrapeAllSources } from "@/lib/scrapers"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || undefined
  const source = searchParams.get("source") || undefined

  try {
    const { jobs, errors } = await scrapeAllSources(search, source)

    // Filter to only new jobs (last 24 hours)
    const newJobs = jobs.filter((job) => job.isNew)

    return NextResponse.json({
      jobs: newJobs,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] New jobs API error:", error)
    return NextResponse.json({ error: "Failed to fetch new jobs", jobs: [] }, { status: 500 })
  }
}
