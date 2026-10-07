import { ImageResponse } from 'next/og';
export const alt = 'CULUA — Unofficial Fan Archive';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', color: '#f3eef8', background: 'radial-gradient(ellipse at 85% 30%, #51346e, #0c0a11 65%)' }}><div style={{ fontSize: 18, letterSpacing: 6, color: '#d4b7fa', display: 'flex' }}>VOICE / MUSIC / MEMORIES</div><div style={{ fontSize: 190, fontWeight: 800, letterSpacing: -14, display: 'flex' }}>CULUA<span style={{ color: '#b990f2' }}>.</span></div><div style={{ fontSize: 25, letterSpacing: 4, display: 'flex' }}>UNOFFICIAL FAN ARCHIVE</div></div>, size);
}
