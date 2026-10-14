import 'server-only';
import type {Feed,Filters,Job,Mutation,View} from '@/lib/types';
import {AppError,isUuid} from '@/lib/validation';
import {mapJob} from '@/lib/jobs';
import {getDatabase,getProfile} from './supabase';
export const PAGE_SIZE=20;
export async function getFeed(view:View,filters:Filters,jobId?:string):Promise<Feed>{
 const {data,error}=await getDatabase().rpc('job_radar_feed',{p_profile:getProfile(),p_search:filters.search,p_mode:filters.mode,p_location:filters.location,p_min_score:filters.minScore,p_posting:filters.posting,p_view:view,p_stage:filters.stage,p_sort:filters.sort,p_limit:PAGE_SIZE,p_offset:(filters.page-1)*PAGE_SIZE,...(jobId?{p_job_id:jobId}:{})});
 if(error)throw new AppError(error.code==='PGRST202'?'The website database setup is missing. Run database/workspace.sql in the intended Supabase project.':'Your jobs could not be loaded. Please try again.',error.code==='PGRST202'?503:502);
 if(!data||!Array.isArray(data.jobs)||!data.summary)throw new AppError('The database returned an unexpected response.',502);
 return {jobs:data.jobs.map(mapJob),total:data.total,summary:data.summary};
}
export async function getJob(id:string):Promise<Job|null>{if(!isUuid(id))return null;const feed=await getFeed('discover',{search:'',mode:'all',location:'',minScore:0,posting:'all',sort:'best',page:1,stage:'all'},id);return feed.jobs[0]??null;}
export async function updateMatch(id:string,body:Mutation){
 if(!isUuid(id))throw new AppError('Invalid matching-record ID.',400);
 const {data,error}=await getDatabase().rpc('job_radar_update_state',{p_match_id:id,p_profile:getProfile(),p_revision:body.revision,p_is_saved:body.isSaved??null,p_status:body.status??null});
 if(error){if(error.code==='40001')throw new AppError('This job changed in another window. Refresh and try again.',409);if(error.code==='P0002')throw new AppError('This match is no longer available.',404);throw new AppError('Your change could not be saved. Please try again.',502);}return data;
}
