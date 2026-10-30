import { parseProject, type LiveHouseProject } from './model';

// Shared across route mounts. Reads wait for all earlier writes, including writes
// started by an editor which has since unmounted.
let pendingWrite: Promise<void> = Promise.resolve();
let memoryDraft: LiveHouseProject | undefined;
let persistedDraft: LiveHouseProject | undefined;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('culua-live-house', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('blocked'));
  });
}
export async function readProject(): Promise<{ project: LiveHouseProject | null; persisted: boolean }> {
  await pendingWrite.catch(() => {});
  if (memoryDraft) return { project: structuredClone(memoryDraft), persisted: memoryDraft === persistedDraft };
  const db = await openDatabase();
  try {
    const value: unknown = await new Promise((resolve, reject) => {
      const request = db.transaction('projects').objectStore('projects').get('current');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (value === undefined) return { project: null, persisted: false };
    const project = parseProject(value);
    await validateProjectImages(project);
    return { project, persisted: true };
  } finally { db.close(); }
}

export async function validateProjectImages(project: LiveHouseProject): Promise<void> {
  const images = [project.stage.reference, ...project.performers.map(p => p.avatar)];
  for (const data of images) {
    if (!data) continue;
    const [header, encoded] = data.split(',');
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const mime = header.includes('image/png') ? 'image/png' : 'image/jpeg';
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
    try { if (bitmap.width > 512 || bitmap.height > 512) throw new Error('image'); }
    finally { bitmap.close(); }
  }
}
export function saveProject(project: LiveHouseProject): Promise<void> {
  const snapshot = structuredClone(project);
  memoryDraft = snapshot;
  pendingWrite = pendingWrite.catch(() => {}).then(async () => {
    await writeProject(snapshot);
    persistedDraft = snapshot;
  });
  return pendingWrite;
}
async function writeProject(project: LiveHouseProject): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      tx.objectStore('projects').put(project, 'current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('aborted'));
    });
  } finally { db.close(); }
}

export async function prepareImage(file: File): Promise<{ data: string; palette: [string, string] }> {
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('image');
  const { paletteFromPixels } = await import('./model');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('image');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/png'), palette: paletteFromPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data) };
  } finally { bitmap.close(); }
}
