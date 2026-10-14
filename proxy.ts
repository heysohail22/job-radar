import { NextRequest,NextResponse } from 'next/server';
export function proxy(request:NextRequest){if(!['localhost','127.0.0.1','[::1]'].includes(request.nextUrl.hostname))return new NextResponse('This personal workspace is available on localhost only.',{status:403});return NextResponse.next();}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|figma/).*)']};
