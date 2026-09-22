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
  isInternship?: boolean;
  companyStage?: string;
  isIndia?: boolean;
  isFresher?: boolean;
}
