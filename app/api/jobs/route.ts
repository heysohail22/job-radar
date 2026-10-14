import {getFeed} from '@/lib/server/queries';
import {assertLocalRequest} from '@/lib/server/security';
import {AppError,parseFilters} from '@/lib/validation';
export async function GET(request:Request){try{assertLocalRequest(request);const p=new URL(request.url).searchParams;const view=p.get('view')??'discover';if(!['discover','saved','applications'].includes(view))throw new AppError('Invalid view.',400);return Response.json(await getFeed(view as 'discover'|'saved'|'applications',parseFilters(p)),{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof AppError?e.message:'Your jobs could not be loaded.'},{status:e instanceof AppError?e.status:500});}}
