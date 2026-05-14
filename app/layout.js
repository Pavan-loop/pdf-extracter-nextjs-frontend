import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: {
    default: 'DocMadara — PDF Intelligence',
    template: '%s | DocMadara',
  },
  description: 'Upload PDFs and extract structured data in real time. Export to Excel instantly.',
  keywords: ['PDF extraction', 'document intelligence', 'data extraction', 'Excel export'],
  authors: [{ name: 'DocMadara' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'DocMadara — PDF Intelligence',
    description: 'Upload PDFs and extract structured data in real time. Export to Excel instantly.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Read theme from localStorage before first paint — prevents flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme');
            if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
          } catch(e) {}
        `}} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
