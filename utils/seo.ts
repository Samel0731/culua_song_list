import type { Metadata } from 'next';
export const SITE_URL = 'https://culuasonglist.netlify.app';
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path }, openGraph: { title: `${title} | CULUA Fan Archive`, description, url: path, type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630 }] }, twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] } };
}
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
