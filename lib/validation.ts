import type { Filters, Mutation } from './types';
import { applicationStages } from './types';
export class AppError extends Error {constructor(message:string,public status=500){super(message)}}
export const isUuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
function choice(value:string|null,fallback:string,allowed:readonly string[]){const result=value??fallback;if(!allowed.includes(result))throw new AppError('One of the filters is invalid. Please clear the filters and try again.',400);return result;}
function integer(value:string|null,fallback:number,min:number,max:number){if(value===null)return fallback;if(!/^\d+$/.test(value))throw new AppError('Invalid numeric filter.',400);const n=Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)throw new AppError('Invalid numeric filter.',400);return n;}
export function parseFilters(p:URLSearchParams):Filters {
 const search=(p.get('q')??'').trim(),location=(p.get('location')??'').trim();
 if(search.length>200||location.length>100)throw new AppError('Your search is too long.',400);
 return {search,location,mode:choice(p.get('mode'),'all',['all','remote','onsite','hybrid','unknown']),minScore:integer(p.get('score'),0,0,100),posting:choice(p.get('posting'),'all',['all','open','closed','uncertain']),sort:choice(p.get('sort'),'best',['best','company','recent']),page:integer(p.get('page'),1,1,100000),stage:choice(p.get('stage'),'all',['all',...applicationStages])};
}
export function parseMutation(input:unknown):Mutation {
 if(!input||typeof input!=='object'||Array.isArray(input))throw new AppError('Invalid update.',400);
 const b=input as Record<string,unknown>;
 if(Object.keys(b).some(k=>!['revision','isSaved','status'].includes(k)))throw new AppError('This update contains an unsupported field.',400);
 if(typeof b.revision!=='number'||!Number.isSafeInteger(b.revision)||b.revision<0)throw new AppError('Refresh this job before updating it.',400);
 if(b.isSaved===undefined&&b.status===undefined)throw new AppError('No changes were supplied.',400);
 if(b.isSaved!==undefined&&typeof b.isSaved!=='boolean')throw new AppError('Invalid bookmark value.',400);
 if(b.status!==undefined&&(typeof b.status!=='string'||!['new','reviewed',...applicationStages].includes(b.status)))throw new AppError('Invalid application status.',400);
 return b as Mutation;
}
export function safeApplicationUrl(...values:unknown[]):string|null {for(const value of values){if(typeof value!=='string')continue;try{const u=new URL(value);if(['https:','http:'].includes(u.protocol)&&!u.username&&!u.password)return u.href;}catch{}}return null;}
export function safeReturnPath(value:unknown):string {return typeof value==='string'&&/^\/(?:saved|applications)?(?:\?[^#]*)?$/.test(value)?value:'/';}
export const label=(value:string)=>value.charAt(0).toUpperCase()+value.slice(1);
