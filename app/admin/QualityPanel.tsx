'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { experienceCopy, issueLabels } from '@/utils/archive/experienceCopy';
import { inspectQuality, issueCodes, type QualityData, type QualityIssue, type QualityReport } from '@/utils/archive/quality';
import { boundedFetch } from '@/utils/archive/adminRequest.mjs';

export default function QualityPanel({ demo, video, revision, open }: { demo?: QualityData; video?: string; revision: number; open: (issue: QualityIssue) => void }) {
  const { lang } = useLanguage(); const c = experienceCopy[lang];
  const [report, setReport] = useState<QualityReport | null>(null), [error, setError] = useState(false), [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0), [query, setQuery] = useState(''), [filter, setFilter] = useState(''), [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    async function read() {
      setLoading(true); setError(false);
      try {
        let result: QualityReport;
        if (demo) result = inspectQuality(demo);
        else { const response = await boundedFetch('/api/admin/quality', { cache: 'no-store' }); if (!response.ok) throw new Error(); result = await response.json(); if (!Array.isArray(result.items) || !result.complete) throw new Error(); }
        if (active) { setReport(result); setPage(0); }
      } catch { if (active) setError(true); } finally { if (active) setLoading(false); }
    }
    void read(); return () => { active = false; };
  }, [demo, revision, reload]);
  const scope = report?.items.filter(i => !video || i.video === video) || [];
  const rows = scope.filter(i => (!filter || i.codes.some(code => code === filter)) && `${i.title} ${i.video} ${i.streamTitle || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-card" aria-label={c.quality}><h2>{c.quality}</h2><button onClick={() => setReload(n => n + 1)} disabled={loading}>{c.refresh}</button>{loading && <p role="status">{c.loading}</p>}{error && <p role="alert">{c.failed} {c.partial}</p>}{!loading && !error && report && <><p>{c.records}: {scope.length} · {c.problems}: {scope.reduce((n, i) => n + i.codes.length, 0)}</p><p className="admin-muted">{c.complete} · {c.checked}: {new Date(report.checkedAt).toLocaleString(lang === 'zh' ? 'zh-TW' : lang === 'ja' ? 'ja-JP' : 'en-US')}</p><div className="admin-grid"><label>{c.searchIssues}<input value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}/></label><label>{c.issue}<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="">{c.every}</option>{issueCodes.map(code => <option key={code} value={code}>{issueLabels[lang][code]}</option>)}</select></label></div>{rows.slice(page * 20, (page + 1) * 20).map(i => <div className="admin-quality-row" key={`${i.entity}:${i.id}`}><strong>{i.title || i.video}</strong>{i.entity === 'candidate' && <p className="admin-muted">{i.streamTitle || i.video}</p>}<p>{i.codes.map(code => issueLabels[lang][code]).join(' · ')}</p><button onClick={() => open(i)}>{c.fix}</button></div>)}{!rows.length && <p>{c.clear}</p>}{rows.length > 20 && <div><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>{c.prev}</button><span>{page + 1} / {Math.ceil(rows.length / 20)}</span><button disabled={(page + 1) * 20 >= rows.length} onClick={() => setPage(p => p + 1)}>{c.next}</button></div>}</>}</section>;
}
