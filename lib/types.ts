export const applicationStages = ['applied','interview','offer','rejected','withdrawn'] as const;
export type ApplicationStage = typeof applicationStages[number];
export type JobStatus = ApplicationStage | 'new' | 'reviewed';
export type View = 'discover' | 'saved' | 'applications';
export interface Job {
 id:string; matchId:string|null; company:string; title:string; location:string|null;
 mode:string; eligibility:string; pay:string|null; description:string|null;
 skills:string[]; preferredSkills:string[]; responsibilities:string[]; missing:string[];
 recommendation:string|null; evidence:string[]; score:number|null;
 breakdown:{label:string;value:number}[]; applicationUrl:string|null; postingStatus:string;
 firstSeen:string|null; lastVerified:string|null; isSaved:boolean; status:JobStatus; revision:number;
}
export interface Summary {total:number;remote:number;saved:number;applied:number;interview:number;offer:number;tracked:number;last_seen:string|null}
export interface Feed {jobs:Job[];total:number;summary:Summary}
export interface Filters {search:string;mode:string;location:string;minScore:number;posting:string;sort:string;page:number;stage:string}
export type Mutation = {revision:number;isSaved?:boolean;status?:JobStatus};
export type LoadResult = {ok:true;feed:Feed;detail:Job|null}|{ok:false;message:string;setup:boolean};
