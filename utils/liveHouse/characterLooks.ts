import type { Appearance } from './model';

// Visual approximations from the cited early outfits, not official color swatches.
export const characterLooks = {
  neun: { hair: '#eeeef4', hairShade: '#d4d2e2', hairLight: '#faf9ff', coat: '#f3f0f6', sleeve: '#f3f0f6', bodice: '#51476d', skirt: '#51476d', trim: '#b7a1dc', sock: '#ece9f4', shoe: '#51476d', metal: '#cbbd92', iris: '#9892c3', source: 'https://hololist.net/wp-content/uploads/2024/08/neun-portrait-66.jpg' },
  meda: { hair: '#bd2867', hairShade: '#8b164e', hairLight: '#de467f', coat: '#eeeef3', sleeve: '#eeeef3', bodice: '#191923', skirt: '#191923', trim: '#45cfee', sock: '#8b164e', shoe: '#191923', metal: '#aeb6c8', iris: '#45cfee', source: 'https://hd.gree.net/jp/ja/news/press/2024/05/14/4.png' },
  culua: { hair: '#202238', hairShade: '#151827', hairLight: '#343950', coat: '#30323e', sleeve: '#30323e', bodice: '#242735', skirt: '#242735', trim: '#7252cf', sock: '#191c29', shoe: '#191c29', metal: '#9296a6', iris: '#8c91ba', source: 'https://hd.gree.net/jp/ja/news/press/2024/05/14/3.png' },
} satisfies Record<Exclude<Appearance, 'generic'>, Record<'hair' | 'hairShade' | 'hairLight' | 'coat' | 'sleeve' | 'bodice' | 'skirt' | 'trim' | 'sock' | 'shoe' | 'metal' | 'iris' | 'source', string>>;

export function characterLook(appearance: Appearance, color: string) {
  return appearance === 'generic' ? { hair: color, hairShade: color, hairLight: color, coat: '#191626', sleeve: '#191626', bodice: '#eeedf5', skirt: '#191626', trim: color, sock: '#191626', shoe: '#191626', metal: '#c4c9e3', iris: '#7eafff', source: '' } : characterLooks[appearance];
}
