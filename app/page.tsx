import {WebsitePage,type Search} from '@/components/website-page';
export const dynamic='force-dynamic';
export default function Page({searchParams}:{searchParams:Search}){return <WebsitePage view="discover" searchParams={searchParams}/>;}
