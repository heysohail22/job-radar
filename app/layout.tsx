import type {Metadata} from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import './website.css';
export const metadata:Metadata={title:'JobRadar — Your next move',description:'A focused personal workspace for discovering jobs, reviewing matches, and tracking your next opportunity.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>;}
