"use client"

import { useEffect, useState, useCallback } from "react"
import useSWR from "swr"
import {
  Search,
  Briefcase,
  MapPin,
  Building2,
  Calendar,
  Banknote,
  Sparkles,
  TrendingUp,
  Globe,
  Archive,
  Filter,
  Loader2,
  AlertCircle,
  ChevronDown,
  Zap,
  Heart,
  LayoutGrid,
  Clock,
  ExternalLink,
  Inbox,
  Bookmark,
} from "lucide-react"
import "./jobs-ge-app.css"

// Favorites management
const FAVORITES_STORAGE_KEY = "alljobs_favorites"

const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (stored) {
      setFavorites(new Set(JSON.parse(stored)))
    }
    setIsLoaded(true)
  }, [])

  const toggleFavorite = useCallback((jobId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(jobId)) {
        newFavorites.delete(jobId)
      } else {
        newFavorites.add(jobId)
      }
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(newFavorites)))
      return newFavorites
    })
  }, [])

  const isFavorite = useCallback((jobId: string) => favorites.has(jobId), [favorites])

  return { favorites, toggleFavorite, isFavorite, isLoaded }
}

const SOURCE_OPTIONS = [
  { value: "all", label: "ყველა წყარო", icon: Globe },
  { value: "jobs.ge", label: "jobs.ge", icon: Briefcase },
  { value: "hr.ge", label: "hr.ge", icon: Building2 },
]

interface Job {
  id: string
  title: string
  company?: string
  location?: string
  salary?: string
  postedAt?: string
  source?: string
  url?: string
  isNew?: boolean
  isArchived?: boolean
}

interface Stats {
  totalActiveJobs: number
  jobsPerSource: Record<string, number>
  newTodayCount: number
}

interface JobsResponse {
  jobs: Job[]
  stats: Stats | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  errors?: string[]
}

interface NewJobsResponse {
  jobs: Job[]
  errors?: string[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const formatDate = (dateString?: string) => {
  if (!dateString) return ""
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return dateString
  return d.toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const isNewJob = (postedAt?: string) => {
  if (!postedAt) return false
  const posted = new Date(postedAt).getTime()
  if (Number.isNaN(posted)) return false
  const now = Date.now()
  const diff = now - posted
  const oneDayMs = 24 * 60 * 60 * 1000
  return diff <= oneDayMs
}

export default function JobsGEApp() {
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [source, setSource] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [onlyNewFilter, setOnlyNewFilter] = useState(false)
  const [page, setPage] = useState(1)
  const [allJobs, setAllJobs] = useState<Job[]>([])
  
  const { favorites, toggleFavorite, isFavorite, isLoaded: favoritesLoaded } = useFavorites()

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
    setAllJobs([])
  }, [debouncedSearch, source, onlyNewFilter])

  const buildJobsUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (source !== "all") params.set("source", source)
    if (onlyNewFilter) params.set("onlyNew", "true")
    params.set("page", page.toString())
    params.set("limit", "20")
    return `/api/jobs?${params.toString()}`
  }, [debouncedSearch, source, onlyNewFilter, page])

  const buildNewJobsUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (source !== "all") params.set("source", source)
    return `/api/jobs/new?${params.toString()}`
  }, [debouncedSearch, source])

  const {
    data: jobsData,
    error: jobsError,
    isLoading: jobsLoading,
  } = useSWR<JobsResponse>(buildJobsUrl(), fetcher, { revalidateOnFocus: false, dedupingInterval: 10000 })

  const { data: newJobsData, isLoading: newJobsLoading } = useSWR<NewJobsResponse>(buildNewJobsUrl(), fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })

  // Append jobs when page changes
  useEffect(() => {
    if (jobsData?.jobs) {
      if (page === 1) {
        setAllJobs(jobsData.jobs)
      } else {
        setAllJobs((prev) => [...prev, ...jobsData.jobs])
      }
    }
  }, [jobsData, page])

  const stats = jobsData?.stats
  const newJobs = newJobsData?.jobs || []
  const hasMore = jobsData?.pagination?.hasMore ?? false

  const handleLoadMore = () => {
    if (!hasMore || jobsLoading) return
    setPage((p) => p + 1)
  }

  const activeJobs = allJobs.filter((job) => !job.isArchived)
  const archivedJobs = allJobs.filter((job) => job.isArchived)
  const visibleJobsCount = activeJobs.length + (showArchived ? archivedJobs.length : 0)

  const renderJobCard = (job: Job) => {
    const jobIsNew = typeof job.isNew === "boolean" ? job.isNew : isNewJob(job.postedAt)
    const isFav = isFavorite(job.id)

    const handleClick = () => {
      if (job.url) {
        window.open(job.url, "_blank", "noopener,noreferrer")
      }
    }

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleFavorite(job.id)
    }

    return (
      <article
        key={job.id || `${job.source}-${job.url}-${job.title}`}
        className={`job-card ${jobIsNew ? "job-card-new" : ""}`}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`${job.title}${job.company ? ` - ${job.company}` : ""}. დააჭირე გასახსნელად`}
      >
        <div className="job-card-header">
          <div className="job-title-wrapper">
            <h3 className="job-title">{job.title}</h3>
          </div>
          <button
            className={`job-favorite-btn ${isFav ? "job-favorite-btn-active" : ""}`}
            onClick={handleFavoriteClick}
            aria-label={isFav ? "ამოშენი რჩეულებიდან" : "დამატე რჩეულებებში"}
            title={isFav ? "ამოშენი რჩეულებიდან" : "დამატე რჩეულებებში"}
          >
            <Bookmark className="job-favorite-icon" fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="job-tags">
          {jobIsNew && (
            <span className="badge badge-new">
              <Zap className="badge-new-icon" />
              ახალი
            </span>
          )}
          {job.isArchived && (
            <span className="badge badge-archived">
              <Archive className="badge-new-icon" />
              არქივი
            </span>
          )}
          {job.source && (
            <span className="badge badge-source">
              <Globe className="badge-new-icon" />
              {job.source}
            </span>
          )}
        </div>

        <div className="job-meta">
          {job.company && (
            <div className="job-meta-item">
              <Building2 className="job-meta-icon" />
              <span className="job-meta-value">{job.company}</span>
            </div>
          )}
          {job.location && (
            <div className="job-meta-item">
              <MapPin className="job-meta-icon" />
              <span className="job-meta-value">{job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="job-meta-item job-meta-item-salary">
              <Banknote className="job-meta-icon" />
              <span className="job-meta-value">{job.salary}</span>
            </div>
          )}
          {job.postedAt && (
            <div className="job-meta-item">
              <Calendar className="job-meta-icon" />
              <span className="job-meta-value">{formatDate(job.postedAt)}</span>
            </div>
          )}
        </div>
      </article>
    )
  }

  const renderEmptyState = (message: string, showIcon = true) => (
    <div className="empty-state">
      {showIcon && <Inbox className="empty-state-icon" />}
      <p>{message}</p>
    </div>
  )

  return (
    <div className="app-root">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="brand-logo-svg">
              {/* Head */}
              <circle cx="100" cy="60" r="35" fill="currentColor" opacity="0.8" />
              {/* Shoulders */}
              <circle cx="60" cy="100" r="30" fill="currentColor" opacity="0.6" />
              <circle cx="140" cy="100" r="30" fill="currentColor" opacity="0.6" />
              {/* Main body */}
              <path d="M 50 130 Q 50 160 100 170 Q 150 160 150 130" fill="currentColor" />
              {/* Roof accent */}
              <path d="M 35 85 Q 50 40 100 50 Q 150 40 165 85" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
          <div>
            <h1 className="brand-title">VAKI</h1>
            <p className="brand-subtitle">მოძებნე შენი მომდევნო სამსახური საქართველოში</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Search + Filters */}
        <section className="search-section">
          <div className="search-row">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="მოძებნე სამსახური, კომპანია ან პოზიცია..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="filters-row">
              <div className="select-wrapper">
                <Globe className="select-icon" />
                <select className="select" value={source} onChange={(e) => setSource(e.target.value)}>
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className={`toggle-btn ${showArchived ? "toggle-btn-active" : ""}`}
                onClick={() => setShowArchived((prev) => !prev)}
              >
                <Archive style={{ width: 16, height: 16 }} />
                არქივი
              </button>

              <button
                type="button"
                className={`toggle-btn ${showFavorites ? "toggle-btn-active" : ""}`}
                onClick={() => setShowFavorites((prev) => !prev)}
              >
                <Bookmark style={{ width: 16, height: 16 }} />
                რჩეულები ({favorites.size})
              </button>

              <label className="checkbox-wrapper">
                <input type="checkbox" checked={onlyNewFilter} onChange={(e) => setOnlyNewFilter(e.target.checked)} />
                <Zap style={{ width: 16, height: 16, color: onlyNewFilter ? "#10b981" : "#64748b" }} />
                <span>მხოლოდ ახალი</span>
              </label>
            </div>
          </div>

          <div className="helper-row">
            <span className="jobs-count">
              <LayoutGrid className="jobs-count-icon" />
              ვაჩვენებთ {visibleJobsCount} ვაკანსიას
            </span>
            {jobsLoading && (
              <span className="loading-pill">
                <Loader2 className="loading-icon" />
                იტვირთება...
              </span>
            )}
            {jobsError && (
              <span className="error-pill">
                <AlertCircle className="error-icon" />
                ჩატვირთვის შეცდომა
              </span>
            )}
            {jobsData?.errors && jobsData.errors.length > 0 && (
              <span className="error-pill" title={jobsData.errors.join(", ")}>
                <AlertCircle className="error-icon" />
                ზოგი წყარო მიუწვდომელია
              </span>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="stats-section">
          {jobsLoading && !stats ? (
            <div className="stats-skeleton" />
          ) : stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <Briefcase className="stat-icon" />
                  <span className="stat-label">აქტიური ვაკანსიები</span>
                </div>
                <div className="stat-value">{stats.totalActiveJobs.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <Zap className="stat-icon" style={{ color: "#10b981" }} />
                  <span className="stat-label">ახალი დღეს</span>
                </div>
                <div className="stat-value">{stats.newTodayCount.toLocaleString()}</div>
              </div>
              <div className="stat-card stat-card-wide">
                <div className="stat-header">
                  <Globe className="stat-icon" />
                  <span className="stat-label">ვაკანსიები წყაროებით</span>
                </div>
                <div className="stat-sources">
                  {stats.jobsPerSource && Object.keys(stats.jobsPerSource).length > 0 ? (
                    Object.entries(stats.jobsPerSource).map(([src, count]) => (
                      <span key={src} className="source-chip">
                        {src}
                        <span className="source-chip-count">{count}</span>
                      </span>
                    ))
                  ) : (
                    <span className="stat-empty">მონაცემები დროებით არ არის</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* New Jobs */}
        <section className="section">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">
                <Zap className="section-icon" style={{ color: "#10b981" }} />
                ახალი ვაკანსიები
                <span className="section-badge">
                  <Clock className="section-badge-icon" />
                  24 სთ
                </span>
              </h2>
            </div>
            <span className="section-subtitle">ყველაზე ახალი განცხადებები, პირდაპირ ქართულ საიტებიდან</span>
          </div>

          {newJobsLoading ? (
            <div className="jobs-grid">
              <div className="job-skeleton" />
              <div className="job-skeleton" />
              <div className="job-skeleton" />
              <div className="job-skeleton" />
            </div>
          ) : newJobs && newJobs.length > 0 ? (
            <div className="jobs-grid">{newJobs.map(renderJobCard)}</div>
          ) : (
            renderEmptyState("ახალი ვაკანსიები ამ დრომდე არ არის")
          )}
        </section>

        {/* Favorites */}
        {showFavorites && favoritesLoaded && (
          <section className="section section-favorites">
            <div className="section-header">
              <div className="section-title-wrap">
                <h2 className="section-title">
                  <Bookmark className="section-icon" style={{ color: "#f59e0b" }} />
                  რჩეულები
                </h2>
              </div>
              <span className="section-subtitle">შენი შენახული ვაკანსიები, ადვილი წვდომისთვის</span>
            </div>

            {allJobs.filter((job) => isFavorite(job.id)).length === 0 ? (
              renderEmptyState("ჯერ რჩეულები არ გაქვს. დაამატე რაიმე მოგეწონა!")
            ) : (
              <div className="jobs-grid">{allJobs.filter((job) => isFavorite(job.id)).map(renderJobCard)}</div>
            )}
          </section>
        )}

        {/* All Active Jobs */}
        <section className="section">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">
                <Briefcase className="section-icon" />
                ყველა აქტიური ვაკანსია
              </h2>
            </div>
            <span className="section-subtitle">გაფილტრე სიტყვით, ლოკაციით ან წყაროთი</span>
          </div>

          {!jobsLoading && activeJobs.length === 0 && !jobsError ? (
            renderEmptyState(debouncedSearch ? "ვაკანსია ვერ მოიძებნა — სცადე სხვა სიტყვა" : "დაიწყე ძიება ზემოთ ☝️")
          ) : (
            <div className="jobs-grid">{activeJobs.map(renderJobCard)}</div>
          )}

          {hasMore && activeJobs.length > 0 && (
            <div className="load-more-row">
              <button type="button" className="load-more-btn" disabled={jobsLoading} onClick={handleLoadMore}>
                {jobsLoading ? (
                  <>
                    <Loader2 className="load-more-icon" />
                    იტვირთება...
                  </>
                ) : (
                  <>
                    <ChevronDown className="load-more-icon" />
                    მეტი ვაკანსია
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Archived Jobs */}
        {showArchived && (
          <section className="section section-archived">
            <div className="section-header">
              <div className="section-title-wrap">
                <h2 className="section-title">
                  <Archive className="section-icon" style={{ color: "#64748b" }} />
                  დაარქივებული ვაკანსიები
                </h2>
              </div>
              <span className="section-subtitle">შედარებისთვის ან შესანახად — ძველი, მაგრამ სასარგებლო</span>
            </div>

            {archivedJobs.length === 0 ? (
              renderEmptyState("ამ ფილტრებით დაარქივებული ვაკანსიები არ არის")
            ) : (
              <div className="jobs-grid">{archivedJobs.map(renderJobCard)}</div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span className="footer-text">
          <Briefcase className="footer-icon" />
          VAKI • შექმნილია
          <Heart className="footer-icon footer-heart" style={{ width: 14, height: 14 }} />
          shono-ს მიერ
        </span>
      </footer>
    </div>
  )
}
