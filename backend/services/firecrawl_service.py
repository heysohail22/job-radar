import time
from typing import List, Optional
from firecrawl import FirecrawlApp
from schemas import JobPosting

def fetch_firecrawl_yc_jobs(api_key: str, query: str = "Gen AI Intern") -> List[JobPosting]:
    if not api_key or not api_key.strip():
        return []

    try:
        app = FirecrawlApp(api_key=api_key.strip())
        target_url = f"https://www.ycombinator.com/jobs?role=eng&jobType=internship&query={query}"
        
        # Scrape with extract schema
        scrape_result = app.scrape_url(
            target_url,
            params={
                'formats': ['extract'],
                'extract': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'jobs': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'company': {'type': 'string'},
                                        'title': {'type': 'string'},
                                        'location': {'type': 'string'},
                                        'url': {'type': 'string'},
                                        'description': {'type': 'string'},
                                    }
                                }
                            }
                        }
                    }
                }
            }
        )

        extracted = scrape_result.get('extract', {}).get('jobs', [])
        jobs = []
        for idx, item in enumerate(extracted):
            title = item.get('title') or "Gen AI Engineering Intern"
            comp = item.get('company') or "YC AI Startup"
            desc = item.get('description') or "Y Combinator Gen AI internship opportunity."
            
            jobs.append(JobPosting(
                id=f"fc-yc-{idx}-{int(time.time())}",
                company=comp,
                title=title,
                location=item.get('location') or "Remote",
                url=item.get('url') or "https://www.ycombinator.com/jobs",
                description=desc[:1000],
                postedDate="Fresh",
                source="Firecrawl",
                techStack=["Python", "React", "TypeScript", "LangChain", "LLMs"],
                matchScore=90,
                matchReason="Matches YC AI startup intern skills.",
                isInternship=True
            ))
        return jobs
    except Exception as e:
        print(f"Firecrawl service error: {e}")
        return []
