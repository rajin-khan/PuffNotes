import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://puff-notes.vercel.app';
const DEFAULT_DESCRIPTION = 'Write rough Markdown notes, clean them up with AI, save locally or sync with Google Drive, and export themed PDFs.';

const PAGE_METADATA = {
  '/': {
    title: 'Puffnotes | Write messily. Keep it beautifully.',
    description: DEFAULT_DESCRIPTION,
  },
  '/app': {
    title: 'Open Puffnotes',
    description: 'Choose local folder storage or connect Puffnotes to Google Drive.',
  },
};

const setMetaContent = (selector, content) => {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute('content', content);
};

export default function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isApp = pathname.startsWith('/app');
    const path = isApp ? '/app' : '/';
    const metadata = PAGE_METADATA[path] || PAGE_METADATA['/'];
    const canonicalUrl = new URL(path, SITE_URL).href;

    document.title = metadata.title;
    setMetaContent('meta[name="description"]', metadata.description);
    setMetaContent('meta[property="og:title"]', metadata.title);
    setMetaContent('meta[property="og:description"]', metadata.description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', metadata.title);
    setMetaContent('meta[name="twitter:description"]', metadata.description);
    setMetaContent('meta[name="robots"]', isApp ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', canonicalUrl);
  }, [pathname]);

  return null;
}
