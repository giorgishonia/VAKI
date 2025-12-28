export interface Job {
  id: string
  title: string
  company?: string
  location?: string
  salary?: string
  postedAt?: string
  source: string
  url: string
  isNew?: boolean
  isArchived?: boolean
  description?: string
}

export interface ScraperResult {
  jobs: Job[]
  error?: string
}

export interface Stats {
  totalActiveJobs: number
  jobsPerSource: Record<string, number>
  newTodayCount: number
}
