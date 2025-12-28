# VAKI 🇬🇪

**მოძებნე შენი მომდევნო სამსახური საქართველოში**  
_Find your next job in Georgia_

A modern, dark-themed job aggregator that scrapes and displays job listings from Georgia's top job websites in one unified interface.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

---

## ✨ Features

- **🔍 Unified Job Search** — Search across multiple Georgian job sites from one place
- **📊 Live Statistics** — See total active jobs, new listings today, and jobs per source
- **⚡ Real-time Updates** — Fresh job data with smart caching
- **🌙 Premium Dark Theme** — Beautiful, eye-friendly dark interface with cyan accents
- **📱 Fully Responsive** — Works perfectly on desktop, tablet, and mobile
- **🎯 Smart Filtering** — Filter by source, search keywords, and new jobs only
- **♿ Accessible** — Keyboard navigation and screen reader support

## 🌐 Supported Job Sources

| Source                     | Status    | Description                            |
| -------------------------- | --------- | -------------------------------------- |
| [jobs.ge](https://jobs.ge) | ✅ Active | One of Georgia's largest job boards    |
| [hr.ge](https://hr.ge)     | ✅ Active | Professional HR & recruitment platform |

> **Note:** Some Georgian job sites (myjobs.ge, motivation.ge, jobs.ss.ge, awork.ge) are Single Page Applications that require JavaScript rendering and cannot be scraped with traditional methods.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/alljobs-ge.git
cd alljobs-ge

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
pnpm build
pnpm start
```

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) + Custom CSS
- **Data Fetching:** [SWR](https://swr.vercel.app/) for client-side caching
- **Scraping:** [Cheerio](https://cheerio.js.org/) for HTML parsing
- **Icons:** [Lucide React](https://lucide.dev/)
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics)

## 📁 Project Structure

```
alljobs-ge/
├── app/
│   ├── api/
│   │   └── jobs/           # API routes for job data
│   ├── globals.css         # Global styles & dark theme
│   ├── layout.tsx          # Root layout with metadata
│   └── page.tsx            # Home page
├── components/
│   ├── jobs-ge-app.tsx     # Main application component
│   └── jobs-ge-app.css     # Component styles
├── lib/
│   └── scrapers/
│       ├── index.ts        # Scraper orchestration
│       ├── jobs-ge.ts      # jobs.ge scraper
│       ├── hr-ge.ts        # hr.ge scraper
│       ├── fetch-utils.ts  # Scraping utilities
│       └── types.ts        # TypeScript types
└── public/                 # Static assets & icons
```

## 🎨 Design

AllJobsGE features a premium dark theme with:

- **Deep dark backgrounds** (`#0a0e14`) for reduced eye strain
- **Cyan accent colors** (`#06b6d4`) for highlights and CTAs
- **Emerald indicators** (`#10b981`) for "new" job badges
- **Glass morphism effects** with subtle backdrop blur
- **Smooth animations** including staggered reveals and hover effects
- **Custom scrollbars** matching the dark aesthetic

## 📝 API Endpoints

### `GET /api/jobs`

Fetch all jobs with optional filtering.

**Query Parameters:**

- `search` — Search query string
- `source` — Filter by source (e.g., `jobs.ge`, `hr.ge`)
- `onlyNew` — Only return jobs from last 24 hours (`true`/`false`)
- `page` — Page number (default: 1)
- `limit` — Results per page (default: 20)

### `GET /api/jobs/new`

Fetch only new jobs from the last 24 hours.

**Query Parameters:**

- `search` — Search query string
- `source` — Filter by source

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Created by Shono**

---

<p align="center">
  <strong>AllJobsGE</strong> • შექმნილია ❤️ საქართველოსთვის
</p>
