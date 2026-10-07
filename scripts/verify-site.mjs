import { load } from 'cheerio';
const base = 'http://localhost:3000';
for (const path of ['/', '/news', '/timeline', '/fanart', '/discography', '/songs', '/about', '/songs/' + encodeURIComponent('夢追い人')]) {
 const r = await fetch(base + path); const $ = load(await r.text());
 const data = { path, status:r.status, canonical:$('link[rel=canonical]').attr('href'), title:$('title').text() };
 if (r.status !== 200 || !data.canonical) throw new Error(JSON.stringify(data));
 console.log(data);
}
for (const path of ['/artists','/stats','/social']) { const r = await fetch(base+path,{redirect:'manual'}); console.log({path,status:r.status,location:r.headers.get('location')}); if (![307,308].includes(r.status)) throw new Error('Redirect failed'); }
const sitemap = load(await (await fetch(base+'/sitemap.xml')).text(),{xmlMode:true});
console.log({sitemapEntries:sitemap('url').length});
if(sitemap('url').length !== 646) throw new Error('Incomplete sitemap');
const songPath = '/songs/'+encodeURIComponent('夢追い人');
const $ = load(await (await fetch(base+songPath+'?video=Yg2Iw8x-r5U&t=1648')).text());
if ($('link[rel=canonical]').attr('href') !== 'https://culuasonglist.netlify.app'+songPath) throw new Error('Song canonical is incorrect');
console.log('Song query canonical deduplication passed');
