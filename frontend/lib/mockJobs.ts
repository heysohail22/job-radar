export interface JobPostingItem {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  description: string;
  postedDate: string;
  source: string; // e.g. "Greenhouse", "Ashby", "Lever", "Firecrawl"
  techStack: string[];
  matchScore: number;
  matchReason: string;
  isInternship: boolean;
}

// No fake or manually created jobs - empty until real jobs are scraped live from ATS
export const REAL_SCRAPED_JOBS: JobPostingItem[] = [];

// Alias for backward compatibility
export type JobMatchItem = JobPostingItem;
export const MOCK_JOBS = REAL_SCRAPED_JOBS;


