import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://puff-notes.vercel.app';
const DEFAULT_DESCRIPTION = 'Write rough Markdown notes, clean them up with AI, save locally or sync with Google Drive, and export themed PDFs.';

const PAGE_METADATA = {
  '/welcome': {
    title: 'Puffnotes | Write first. Clean it up later.',
    description: 'Meet Puffnotes, a quiet Markdown editor with AI cleanup, offline folder storage, Google Drive sync, themes, and PDF export.',
  },
  '/': {
    title: 'Puffnotes | A cozy place for messy notes',
    description: DEFAULT_DESCRIPTION,
  },
};

const setMetaContent = (selector, content) => {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute('content', content);
};

export default function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname === '/welcome' ? '/welcome' : '/';
    const metadata = PAGE_METADATA[path];
    const canonicalUrl = new URL(path, SITE_URL).href;

    document.title = metadata.title;
    setMetaContent('meta[name="description"]', metadata.description);
    setMetaContent('meta[property="og:title"]', metadata.title);
    setMetaContent('meta[property="og:description"]', metadata.description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', metadata.title);
    setMetaContent('meta[name="twitter:description"]', metadata.description);

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', canonicalUrl);
  }, [pathname]);

  return null;
}
