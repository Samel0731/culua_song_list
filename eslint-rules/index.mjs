import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'eslint-rules/baseline.json'), 'utf8'));
const relative = context => path.relative(root, context.filename).split(path.sep).join('/');
const globalObjects = new Set(['window', 'globalThis', 'self']);

function calleeName(callee) {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    if (callee.object.type === 'Identifier' && (globalObjects.has(callee.object.name) || callee.object.name === 'React')) return callee.property.name;
  }
  return null;
}

function ratchet(ruleName, names, message) {
  return {
    meta: { type: 'problem', messages: { blocked: message } },
    create(context) {
      if (baseline[ruleName].includes(relative(context))) return {};
      return {
        CallExpression(node) {
          const name = calleeName(node.callee);
          if (name && names.has(name)) context.report({ node, messageId: 'blocked', data: { name } });
        },
      };
    },
  };
}

const storageAllowed = new Set(['context/LanguageContext.tsx']);
const serverOnlyModules = /(^|\/)(supabaseServer|publicArchiveServer|fetchHubContent)(\.ts)?$|^server-only$/;
const playerComponents = new Set(['PlayerProvider', 'YouTubePlayer']);

const changelogComment = /✨|✅|終極防線|^\s*(修改|修正|新增)\s*\d*\s*[:：]|^\s*(修改|修正)重點|^\s*(app|context|utils|scripts)\/\S+\.(tsx?|mjs)\s*$/;

function commentRule(messages, check) {
  return {
    meta: { type: 'suggestion', messages },
    create(context) {
      return {
        Program() {
          for (const comment of context.sourceCode.getAllComments()) {
            const messageId = check(comment.value);
            if (messageId) context.report({ loc: comment.loc, messageId });
          }
        },
      };
    },
  };
}

const plugin = {
  meta: { name: 'culua' },
  rules: {
    'no-changelog-comments': commentRule(
      { changelog: 'Comments must describe the code as it is, not the edit that produced it. Put change history in the commit message and delete this comment; if it states a rule, enforce it with a lint rule or test instead.' },
      text => (changelogComment.test(text) ? 'changelog' : null),
    ),
    'disable-needs-reason': commentRule(
      { reason: 'Add "-- <reason>" to this eslint-disable directive so the next reader knows why the exception exists, or fix the code so the directive can go.' },
      text => (/^\s*eslint-disable/.test(text) && !/\s--\s+\S/.test(text) ? 'reason' : null),
    ),
    'no-new-effects': ratchet(
      'no-new-effects',
      new Set(['useEffect', 'useLayoutEffect']),
      '{{name}} is not allowed in new files. Derive the value during render, handle it in the event that caused it, or use useSyncExternalStore for outside state. Existing exceptions are listed in eslint-rules/baseline.json and may only shrink.',
    ),
    'no-new-timers': ratchet(
      'no-new-timers',
      new Set(['setTimeout', 'setInterval', 'requestAnimationFrame', 'requestIdleCallback']),
      '{{name}} is not allowed in new files. Deferring work hides an ordering or state problem and piles up timers across the app; fix the cause instead. Existing exceptions are listed in eslint-rules/baseline.json and may only shrink.',
    ),
    'no-server-import-in-client': {
      meta: { type: 'problem', messages: { server: "'{{source}}' is server-only and cannot be imported from a 'use client' file. Load the data in a server component or route handler and pass a minimal public DTO to the client." } },
      create(context) {
        const isClient = context.sourceCode.ast.body.some(node => node.type === 'ExpressionStatement' && node.directive === 'use client');
        if (!isClient) return {};
        return {
          ImportDeclaration(node) {
            if (serverOnlyModules.test(node.source.value)) context.report({ node, messageId: 'server', data: { source: node.source.value } });
          },
        };
      },
    },
    'no-player-key': {
      meta: { type: 'problem', messages: { key: 'Do not put key on <{{name}}>. Remounting the player loses the current video, timestamp seeking and repeat/shuffle state; refresh its data through PlayerContext instead.' } },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.type !== 'JSXIdentifier' || !playerComponents.has(node.name.name)) return;
            const key = node.attributes.find(attr => attr.type === 'JSXAttribute' && attr.name.name === 'key');
            if (key) context.report({ node: key, messageId: 'key', data: { name: node.name.name } });
          },
        };
      },
    },
    'no-direct-storage': {
      meta: { type: 'problem', messages: { storage: '{{name}} can throw when storage is blocked. Keep browser storage access inside context/LanguageContext.tsx (or add a guarded wrapper and list it in eslint-rules/index.mjs).' } },
      create(context) {
        if (storageAllowed.has(relative(context))) return {};
        return {
          Identifier(node) {
            if (node.name !== 'localStorage' && node.name !== 'sessionStorage') return;
            const parent = node.parent;
            if ((parent.type === 'Property' || parent.type === 'MethodDefinition') && parent.key === node && !parent.computed) return;
            if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) {
              if (!(parent.object.type === 'Identifier' && globalObjects.has(parent.object.name))) return;
            }
            context.report({ node, messageId: 'storage', data: { name: node.name } });
          },
        };
      },
    },
  },
};

export default plugin;
