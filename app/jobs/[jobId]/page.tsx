import {WebsitePage,type Search} from '@/components/website-page';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{jobId:string}>;searchParams:Search}){const {jobId}=await params;return <WebsitePage view="discover" searchParams={searchParams} jobId={jobId}/>;}
