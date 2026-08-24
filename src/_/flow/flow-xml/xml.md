# XPath in Node: xmldom + parse5

## Native support

None. Node's standard library has no DOM and no `document.evaluate`. XPath always needs a third-party parser plus a query engine.

## The stack

| Package | Role | Licence | Notes |
|---|---|---|---|
| `xpath` | XPath 1.0 engine | MIT | Pure JS, no build step, works against any xmldom-style document |
| `@xmldom/xmldom` | XML parser / DOM | MIT | Older unscoped `xmldom` was dual MIT/LGPL; the scoped fork is MIT |
| `parse5` | HTML5 parser | MIT | Zero runtime deps, same tree builder jsdom uses internally |
| `parse5-parser-stream` | Streaming parser | MIT | Optional, only for the streaming path |

## xmldom on its own

```js
import { DOMParser } from '@xmldom/xmldom';
import * as xpath from 'xpath';

const doc = new DOMParser().parseFromString(xml, 'text/xml');

xpath.select('//book/title/text()', doc);      // node list
xpath.select1('//book[1]/@isbn', doc)?.value;  // single node
xpath.select('count(//book)', doc);            // number

const sel = xpath.useNamespaces({ d: 'http://example.org/ns' });
sel('//d:book/d:title', doc);
```

Good for XML, XHTML, RSS/Atom feeds, and HTML you generate yourself.

### The `text/html` mode

```js
new DOMParser().parseFromString(html, 'text/html');
```

Gives you:

- case-insensitive tag and attribute names, lowercased on output
- void elements recognised without self-closing slashes
- boolean attributes without values
- errors downgraded to warnings instead of fatal

Does not give you:

- the HTML5 tree construction algorithm — no implied `<tbody>`, no `<p>` auto-closing, no fostering of misnested tags
- `querySelector` / `querySelectorAll`
- `getComputedStyle` or layout

On real-world pages this means XPath that looks correct silently misses nodes.

## parse5 in front of xmldom

Fixes the parsing gap while keeping the small footprint. Use a custom `treeAdapter` so parse5 builds xmldom nodes directly, with no serialise-and-reparse round trip.

```bash
npm i xpath @xmldom/xmldom parse5 parse5-parser-stream
```

### The adapter

One adapter instance per parse, since it holds the owning document.

```js
// xmldom-adapter.js
import { DOMImplementation } from '@xmldom/xmldom';

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const impl = new DOMImplementation();

export function createAdapter({ stripHtmlNs = true } = {}) {
  let doc = null;
  const tmpl = new WeakMap();
  const locs = new WeakMap();
  const modes = new WeakMap();
  const out = uri => (stripHtmlNs && uri === HTML_NS ? null : uri);

  return {
    createDocument() { return (doc = impl.createDocument(null, null, null)); },
    createDocumentFragment() { return doc.createDocumentFragment(); },
    createElement(tagName, namespaceURI, attrs) {
      const el = doc.createElementNS(out(namespaceURI), tagName);
      this.adoptAttributes(el, attrs);
      return el;
    },
    createCommentNode: data => doc.createComment(data),
    createTextNode: value => doc.createTextNode(value),

    appendChild: (p, n) => { p.appendChild(n); },
    insertBefore: (p, n, ref) => { p.insertBefore(n, ref); },
    detachNode: n => { n.parentNode?.removeChild(n); },

    insertText(parentNode, text) {
      const last = parentNode.lastChild;
      if (last?.nodeType === 3) last.appendData(text);
      else parentNode.appendChild(doc.createTextNode(text));
    },
    insertTextBefore(parentNode, text, ref) {
      const prev = ref.previousSibling;
      if (prev?.nodeType === 3) prev.appendData(text);
      else parentNode.insertBefore(doc.createTextNode(text), ref);
    },

    adoptAttributes(recipient, attrs) {
      for (const { name, value, namespace, prefix } of attrs) {
        const qn = prefix ? `${prefix}:${name}` : name;
        if (recipient.hasAttribute(qn)) continue;   // parse5 contract: first wins
        if (namespace) recipient.setAttributeNS(namespace, qn, value);
        else recipient.setAttribute(qn, value);
      }
    },

    setTemplateContent: (t, c) => { tmpl.set(t, c); },
    getTemplateContent: t => tmpl.get(t),
    setDocumentType(document, name, publicId, systemId) {
      const dt = impl.createDocumentType(name || 'html', publicId || '', systemId || '');
      const old = Array.from(document.childNodes).find(n => n.nodeType === 10);
      old ? document.replaceChild(dt, old) : document.appendChild(dt);
    },
    setDocumentMode: (d, m) => { modes.set(d, m); },
    getDocumentMode: d => modes.get(d),

    getFirstChild: n => n.firstChild,
    getChildNodes: n => Array.from(n.childNodes),
    getParentNode: n => n.parentNode,
    getAttrList: el => Array.from(el.attributes).map(a => ({
      name: a.localName || a.name,
      value: a.value,
      namespace: a.namespaceURI ?? undefined,
      prefix: a.prefix ?? undefined,
    })),
    getTagName: el => el.localName || el.tagName,
    getNamespaceURI: el => el.namespaceURI || HTML_NS,   // must map back
    getTextNodeContent: n => n.data,
    getCommentNodeContent: n => n.data,
    getDocumentTypeNodeName: dt => dt.name,
    getDocumentTypeNodePublicId: dt => dt.publicId || '',
    getDocumentTypeNodeSystemId: dt => dt.systemId || '',

    isTextNode: n => n.nodeType === 3,
    isCommentNode: n => n.nodeType === 8,
    isDocumentTypeNode: n => n.nodeType === 10,
    isElementNode: n => n.nodeType === 1,

    setNodeSourceCodeLocation: (n, l) => { locs.set(n, l); },
    getNodeSourceCodeLocation: n => locs.get(n),
    updateNodeSourceCodeLocation: (n, e) => { locs.set(n, { ...locs.get(n), ...e }); },
  };
}
```

### Sync

```js
import { parse } from 'parse5';
import * as xpath from 'xpath';
import { createAdapter } from './xmldom-adapter.js';

const doc = parse(html, { treeAdapter: createAdapter() });
xpath.select('//h2[contains(@class,"title")]/text()', doc);
```

### Streaming

Never holds the whole HTML string.

```js
import { ParserStream } from 'parse5-parser-stream';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

const parser = new ParserStream({ treeAdapter: createAdapter() });
const res = await fetch(url);
Readable.fromWeb(res.body).setEncoding('utf8').pipe(parser);
await finished(parser);

xpath.select1('//meta[@property="og:title"]/@content', parser.document)?.value;
```

### Gotchas

1. `getNamespaceURI` must undo whatever `createElement` did to the namespace. parse5 uses it to decide foreign-content handling, so if HTML elements report `null` there the tokeniser misbehaves inside SVG and MathML. `stripHtmlNs: false` avoids the trick, but then every query needs `xpath.useNamespaces({ h: HTML_NS })` and prefixed steps.
2. `getChildNodes` returns a fresh array deliberately. xmldom's live NodeList has no `indexOf`, which parse5 relies on.
3. The interface is versioned: `updateNodeSourceCodeLocation` was a breaking addition, and v7 went ESM-only and TypeScript. Pin the major.
4. `parse5-sax-parser` is the wrong tool, as it skips tree construction, which is the only reason to bring parse5 in. Streaming does not make the tree queryable early either; wait for `finish` before running XPath.

## Links

- https://www.npmjs.com/package/parse5
- https://github.com/inikulin/parse5
- https://parse5.js.org/
- https://parse5.js.org/interfaces/parse5.TreeAdapter.html
- https://parse5.js.org/classes/parse5-parser-stream.ParserStream.html
- https://www.npmjs.com/package/xpath
- https://www.npmjs.com/package/@xmldom/xmldom

Everything above is MIT, so no copyleft obligations. Still worth running a licence checker over the actual lockfile, since transitive deps are what usually catch people out.
