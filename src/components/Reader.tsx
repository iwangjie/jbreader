import React, { useMemo } from 'react';
import type { ParsedBook } from '../utils/epubParser';
import type { MockArticle } from '../data/mockArticles';
import { Copy, FileCode } from 'lucide-react';

interface ReaderProps {
  activeBook: ParsedBook | null;
  currentChapterIndex: number;
  chapterContent: string;
  isLoadingChapter: boolean;
  isPanic: boolean;
  activeArticle: MockArticle;
  disguiseTheme: 'blog' | 'code' | 'diff' | 'docs';
  fontSize: number; // in px
  lineHeight: number; // multiplier
}

// Mock technical English paragraphs
const MOCK_ENGLISH_PARAGRAPHS = [
  "In this stage, we verify that the execution context maintains hydration metrics without triggering a thread block. By doing so, the garbage collector can safely scavenge older generations of memory blocks during low CPU usage windows.",
  "To optimize the network serialization pipeline, we utilize a custom protocol buffer definition instead of parsing raw JSON strings sequentially. This change reduced the event processing latency by 32% under load testing conditions.",
  "The system maintains client-server synchronizations using standard WebSocket events. When connectivity drops, the client buffers pending payloads in an offline-first storage layout until the handshake is re-established.",
  "We notice that memory heap profiles show a steady footprint of 180MB when Rayon thread pools are initialized with static core bounds, mitigating sudden memory allocation spikes during parallel runs."
];

// Mock technical code snippets for Blog Mode
const MOCK_CODE_SNIPPETS = [
  `const handleEventStream = async (stream: ReadableStream) => {
  const reader = stream.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    processChunk(value);
  }
};`,
  `#[derive(Debug, Serialize, Deserialize)]
pub struct AggregationConfig {
    pub buffer_size: usize,
    pub flush_interval_ms: u64,
    pub enable_compression: bool,
}`,
  `export const useHydratedState = <T>(key: string, initial: T): [T, (v: T) => void] => {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    const cached = localStorage.getItem(key);
    if (cached) setState(JSON.parse(cached));
  }, [key]);
  return [state, setState];
};`
];

// Helper to convert HTML content into discrete text paragraphs for code/diff rendering
const htmlToParagraphs = (html: string): string[] => {
  if (!html) return [];
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const blocks = temp.querySelectorAll('p, li, h1, h2, h3, h4, blockquote, div');
  if (blocks.length === 0) {
    return temp.textContent?.split('\n').map(s => s.trim()).filter(Boolean) || [];
  }
  
  const paragraphs: string[] = [];
  blocks.forEach(block => {
    const text = block.textContent?.trim();
    if (text && text.length > 0 && !paragraphs.includes(text)) {
      paragraphs.push(text);
    }
  });
  return paragraphs;
};

// Check if a block of text looks like a chapter header to obscure it
const isChapterHeading = (text: string): boolean => {
  const clean = text.trim();
  if (clean.length > 40) return false;
  // Matches: 第十二章, 第一百二十章, 第12章, Chapter 12, Section 12, etc.
  const regex = /^(第\s*[一二三四五六七八九十零百千万0-9a-zA-Z\s]+\s*[章节回])|(Chapter\s*\d+)|(Section\s*\d+)/i;
  return regex.test(clean);
};

export const Reader: React.FC<ReaderProps> = ({
  activeBook,
  currentChapterIndex,
  chapterContent,
  isLoadingChapter,
  isPanic,
  activeArticle,
  disguiseTheme,
  fontSize,
  lineHeight
}) => {
  const paragraphs = useMemo(() => {
    return htmlToParagraphs(chapterContent);
  }, [chapterContent]);

  const showCamouflage = isPanic || !activeBook;

  // Mock technical titles for the main H1 blog header
  const mockTechTitle = useMemo(() => {
    const mockTitles = [
      "Architecting Resilient Hydration Pipelines in Server-Side Frameworks",
      "Deep Dive into Memory Allocation Footprints and GC Sweeps in Go 1.26",
      "Why We Migrated Our Real-Time Logging Core to Rayon Concurrent Rust",
      "Implementing Distributed Retry Backoffs in Event-Driven NestJS & Kafka Services",
      "Profiling V8 Engine Compilation Waterfalls in Heavy Hydration Cycles",
      "A Senior Engineer's Guide to Container Queries and CSS Layout Containments",
      "Orchestrating Micro-Frontend Aggregation Pipelines across Server Boundaries",
      "Eliminating Connection Handshake Overheads in High-Throughput APIs"
    ];
    return mockTitles[currentChapterIndex % mockTitles.length];
  }, [currentChapterIndex]);

  // 1. Intersperse English text and code blocks inside XHTML elements for Blog Mode
  const parsedBlogElements = useMemo(() => {
    if (!chapterContent || showCamouflage) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(chapterContent, 'text/html');
    const body = doc.querySelector('body') || doc.documentElement;
    const children = Array.from(body.children);
    
    const elements: React.ReactNode[] = [];
    
    children.forEach((child, idx) => {
      const text = child.textContent?.trim() || '';
      const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.tagName.toLowerCase());
      const isChap = isChapterHeading(text);
      
      const shouldObscure = isChap || (isHeading && (text.includes('Chapter') || (text.includes('第') && text.includes('章'))));
      
      // Append Chinese novel element (blurred if it's a chapter header)
      elements.push(
        <div 
          key={`novel-el-${idx}`} 
          className={`novel-element ${shouldObscure ? 'blurry-heading' : ''}`}
          title={shouldObscure ? "Hover to reveal chapter marker" : undefined}
          dangerouslySetInnerHTML={{ __html: child.outerHTML }} 
        />
      );
      
      // Intersperse English technical paragraph every 2 novel elements
      if ((idx + 1) % 2 === 0) {
        const engIdx = Math.floor(idx / 2) % MOCK_ENGLISH_PARAGRAPHS.length;
        elements.push(
          <p key={`eng-${idx}`} className="disguised-eng-paragraph" style={{ fontStyle: 'italic', color: 'var(--text-secondary)', margin: '1.5rem 0' }}>
            {MOCK_ENGLISH_PARAGRAPHS[engIdx]}
          </p>
        );
      }
      
      // Intersperse mock code block every 3 novel elements
      if ((idx + 1) % 3 === 0) {
        const codeIdx = Math.floor(idx / 3) % MOCK_CODE_SNIPPETS.length;
        elements.push(
          <pre key={`code-${idx}`} className="disguised-code-block" style={{ margin: '1.5rem 0', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
            <code>{MOCK_CODE_SNIPPETS[codeIdx]}</code>
          </pre>
        );
      }
    });
    
    return elements;
  }, [chapterContent, showCamouflage]);

  // 2. Intersperse actual code lines between comments in Code Comments Mode
  const parsedCodeElements = useMemo(() => {
    const codeLines: React.ReactNode[] = [];
    
    const mockCodeSnippets = [
      <>
        &nbsp;&nbsp;<span className="code-keyword">const</span> {'[data, setData]'} = <span className="code-function">useState</span>(<span className="code-keyword">null</span>);
        <br />
        &nbsp;&nbsp;<span className="code-function">useEffect</span>(() =&gt; {'{'}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;fetchData().<span className="code-function">then</span>(setData);
        <br />
        &nbsp;&nbsp;{'}'}, []);
      </>,
      <>
        &nbsp;&nbsp;<span className="code-keyword">const</span> config = <span className="code-keyword">await</span> db.<span className="code-function">getConfig</span>();
        <br />
        &nbsp;&nbsp;<span className="code-keyword">if</span> (!config.active) {'{'}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;<span className="code-keyword">return</span> <span className="code-string">"deactivated"</span>;
        <br />
        &nbsp;&nbsp;{'}'}
      </>,
      <>
        &nbsp;&nbsp;console.<span className="code-function">log</span>(<span className="code-string">"Aggregating pipeline status..."</span>);
        <br />
        &nbsp;&nbsp;<span className="code-keyword">const</span> result = <span className="code-keyword">await</span> pipeline.<span className="code-function">run</span>();
      </>
    ];

    paragraphs.forEach((p, idx) => {
      const isChap = isChapterHeading(p);
      
      // Novel paragraph inside comment bounds (blurred if chapter title)
      codeLines.push(
        <span key={`novel-${idx}`} className={`code-comment ${isChap ? 'blurry-heading' : ''}`}>
          &nbsp;* {p}
        </span>
      );
      codeLines.push(<br key={`br1-${idx}`} />);
      codeLines.push(<span key={`comment-gap-${idx}`} className="code-comment"> *</span>);
      codeLines.push(<br key={`br2-${idx}`} />);
      
      // Intersperse real code statements every 2 paragraphs
      if ((idx + 1) % 2 === 0) {
        const codeIdx = Math.floor(idx / 2) % mockCodeSnippets.length;
        const codeBlock = mockCodeSnippets[codeIdx];
        
        // Close block comment, add statement, reopen comment block
        codeLines.push(<span key={`close-comm-${idx}`} className="code-comment"> */</span>);
        codeLines.push(<br key={`br3-${idx}`} />);
        
        codeLines.push(
          <div key={`code-stmt-${idx}`} style={{ paddingLeft: '1rem', margin: '0.5rem 0', fontFamily: 'var(--font-mono)' }}>
            {codeBlock}
          </div>
        );
        
        codeLines.push(<span key={`reopen-comm-${idx}`} className="code-comment">/**</span>);
        codeLines.push(<br key={`br5-${idx}`} />);
        codeLines.push(<span key={`reopen-gap-${idx}`} className="code-comment"> *</span>);
        codeLines.push(<br key={`br6-${idx}`} />);
      }
    });
    
    return codeLines;
  }, [paragraphs]);

  // 3. Intersperse deletions and context lines in Git Diff Mode
  const parsedDiffElements = useMemo(() => {
    const diffLines: React.ReactNode[] = [];
    let lineNoRight = 12;
    let lineNoLeft = 12;

    paragraphs.forEach((p, idx) => {
      const isChap = isChapterHeading(p);
      
      // Novel paragraph line (green addition - blurred if chapter header)
      diffLines.push(
        <div key={`novel-${idx}`} className={`diff-line diff-line-add ${isChap ? 'blurry-heading' : ''}`}>
          <span className="diff-ln"></span>
          <span className="diff-ln">{lineNoRight++}</span>
          <span className="diff-char">+</span>
          <span className="diff-text">&nbsp;&nbsp;// {p}</span>
        </div>
      );

      // Intersperse red deletions / green modifications
      if ((idx + 1) % 2 === 0) {
        diffLines.push(
          <div key={`del-${idx}`} className="diff-line diff-line-del">
            <span className="diff-ln">{lineNoLeft++}</span>
            <span className="diff-ln"></span>
            <span className="diff-char">-</span>
            <span className="diff-text">&nbsp;&nbsp;const status = getProcessStatus(id);</span>
          </div>
        );
        diffLines.push(
          <div key={`add-${idx}`} className="diff-line diff-line-add">
            <span className="diff-ln"></span>
            <span className="diff-ln">{lineNoRight++}</span>
            <span className="diff-char">+</span>
            <span className="diff-text">&nbsp;&nbsp;const status = await getProcessStatusAsync(id);</span>
          </div>
        );
      }

      // Intersperse standard gray context lines
      if ((idx + 1) % 3 === 0) {
        diffLines.push(
          <div key={`context-${idx}`} className="diff-line diff-line-context">
            <span className="diff-ln">{lineNoLeft++}</span>
            <span className="diff-ln">{lineNoRight++}</span>
            <span className="diff-char"> </span>
            <span className="diff-text">&nbsp;&nbsp;if (status.isComplete) &#123;</span>
          </div>
        );
      }
    });

    return { diffLines, finalRight: lineNoRight, finalLeft: lineNoLeft };
  }, [paragraphs]);

  // 4. Intersperse English parameter details inside API Docs Mode
  const parsedDocsElements = useMemo(() => {
    const docsLines: React.ReactNode[] = [];
    
    paragraphs.forEach((p, idx) => {
      const isChap = isChapterHeading(p);
      
      docsLines.push(<p key={`novel-${idx}`} className={`docs-novel-p ${isChap ? 'blurry-heading' : ''}`}>{p}</p>);
      
      // Add English parameters notes
      if ((idx + 1) % 2 === 0) {
        const engIdx = Math.floor(idx / 2) % MOCK_ENGLISH_PARAGRAPHS.length;
        docsLines.push(
          <p key={`eng-${idx}`} className="docs-description" style={{ fontStyle: 'italic', margin: '1rem 0' }}>
            {MOCK_ENGLISH_PARAGRAPHS[engIdx]}
          </p>
        );
      }
    });
    
    return docsLines;
  }, [paragraphs]);

  if (isLoadingChapter && !showCamouflage) {
    return (
      <div className="disguised-article-view">
        <h1 className="article-title" style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>Loading Resource Schema...</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          fetching chunk_0{currentChapterIndex + 1}_data.bin from index maps...
        </p>
      </div>
    );
  }

  if (showCamouflage) {
    return (
      <article className="safe-article-view">
        <div className="article-header">
          <span className="article-tag">{activeArticle.category}</span>
          <h1 className="article-title">{activeArticle.title}</h1>
          
          <div className="author-meta">
            <img 
              src={activeArticle.avatar} 
              alt={activeArticle.author} 
              className="author-avatar" 
            />
            <div className="author-info">
              <span className="author-name">{activeArticle.author}</span>
              <span className="publish-date">{activeArticle.date} • {activeArticle.readTime}</span>
            </div>
          </div>
        </div>
        
        <div 
          className="article-body" 
          dangerouslySetInnerHTML={{ __html: activeArticle.content }}
        />
      </article>
    );
  }

  const currentChapter = activeBook.chapters[currentChapterIndex];

  // Render based on selected disguise theme
  switch (disguiseTheme) {
    case 'code':
      return (
        <div className="code-editor-view">
          <div className="editor-tab-bar">
            <div className="editor-tab active">
              <FileCode size={14} className="tab-icon" />
              <span>{currentChapter.title.replace(/\s+/g, '_').toLowerCase() || 'chapter'}.ts</span>
              <span className="tab-close">×</span>
            </div>
            <div className="editor-tab">
              <span>tsconfig.json</span>
            </div>
            <div className="editor-tab">
              <span>package.json</span>
            </div>
          </div>
          
          <div className="editor-content-wrapper" style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
            <div className="line-numbers">
              {Array.from({ length: Math.max(paragraphs.length * 4 + 30, 60) }).map((_, i) => (
                <div key={i} className="line-no">{i + 1}</div>
              ))}
            </div>
            
            <div className="editor-code-body">
              <span className="code-keyword">import</span> {'{ useState, useEffect }'} <span className="code-keyword">from</span> <span className="code-string">'react'</span>;
              <br />
              <span className="code-keyword">import</span> {'{ db }'} <span className="code-keyword">from</span> <span className="code-string">'@/core/database'</span>;
              <br /><br />
              <span className="code-comment">/**</span>
              <br />
              <span className="code-comment"> * @class ChapterController</span>
              <br />
              <span className="code-comment"> * @description <span className="blurry-heading-inline">{currentChapter.title}</span></span>
              <br />
              <span className="code-comment"> *</span>
              <br />
              {parsedCodeElements}
              <span className="code-comment"> */</span>
              <br />
              <span className="code-keyword">export const</span> <span className="code-function">initializeController</span> = <span className="code-keyword">async</span> () =&gt; {'{'}
              <br />
              &nbsp;&nbsp;<span className="code-keyword">const</span> config = <span className="code-keyword">await</span> db.getConfig();
              <br />
              &nbsp;&nbsp;console.log(<span className="code-string">"Chapter initialization complete."</span>);
              <br />
              &nbsp;&nbsp;<span className="code-keyword">return</span> config.active;
              <br />
              {'}'};
            </div>
          </div>
        </div>
      );

    case 'diff':
      return (
        <div className="git-diff-view">
          <div className="diff-header">
            <div className="diff-meta">
              <span className="pr-badge">PR #1428</span>
              <span className="pr-title">feat: Refactor aggregation engine in reader module</span>
            </div>
            <div className="diff-stats">
              <span className="diff-additions">+{paragraphs.length} additions</span>
              <span className="diff-deletions">-3 deletions</span>
            </div>
          </div>
          
          <div className="diff-file-header">
            <div className="diff-file-info">
              <span className="diff-file-arrow">▶</span>
              <span className="diff-file-name">src/core/reader/aggregation.ts</span>
            </div>
            <div className="diff-file-actions">
              <button className="diff-btn"><Copy size={12} /> View File</button>
            </div>
          </div>

          <div className="diff-content" style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
            <div className="diff-lines-wrapper">
              {/* Fake diff context */}
              <div className="diff-line diff-line-context">
                <span className="diff-ln">10</span>
                <span className="diff-ln">10</span>
                <span className="diff-char"> </span>
                <span className="diff-text">export const aggregateProgress = (id: string) =&gt; &#123;</span>
              </div>
              <div className="diff-line diff-line-context">
                <span className="diff-ln">11</span>
                <span className="diff-ln">11</span>
                <span className="diff-char"> </span>
                <span className="diff-text">&nbsp;&nbsp;const status = getProcessStatus(id);</span>
              </div>
              
              {/* Inserted paragraphs */}
              {parsedDiffElements.diffLines}
              
              {/* Fake diff context at bottom */}
              <div className="diff-line diff-line-context">
                <span className="diff-ln">{parsedDiffElements.finalLeft}</span>
                <span className="diff-ln">{parsedDiffElements.finalRight}</span>
                <span className="diff-char"> </span>
                <span className="diff-text">&nbsp;&nbsp;return status.completed;</span>
              </div>
              <div className="diff-line diff-line-context">
                <span className="diff-ln">{parsedDiffElements.finalLeft + 1}</span>
                <span className="diff-ln">{parsedDiffElements.finalRight + 1}</span>
                <span className="diff-char"> </span>
                <span className="diff-text">&#125;;</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'docs':
      return (
        <div className="api-docs-view">
          <div className="docs-endpoint-title">
            <span className="endpoint-method get">GET</span>
            <span className="endpoint-path">/v1/reader/chapters/{currentChapter.id}</span>
          </div>

          <div className="docs-grid" style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
            <div className="docs-left-col">
              <h2 className="docs-section-title">Description</h2>
              <p className="docs-description">
                Retrieve compiled details for documentation block <strong className="blurry-heading-inline">"{currentChapter.title}"</strong>. Returns the contents mapped directly into an object payload array.
              </p>

              <h2 className="docs-section-title">Query Parameters</h2>
              <table className="docs-params-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>chapter_id</code></td>
                    <td>string</td>
                    <td><span className="badge-required">required</span></td>
                    <td>The unique identifier of the chapter record to retrieve.</td>
                  </tr>
                  <tr>
                    <td><code>include_assets</code></td>
                    <td>boolean</td>
                    <td>optional</td>
                    <td>If true, includes base64 image mappings in the payload response.</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="docs-section-title">Response Payload</h2>
              <div className="docs-novel-content">
                {parsedDocsElements}
              </div>
            </div>

            <div className="docs-right-col">
              <div className="docs-sticky-box">
                <div className="code-example-header">
                  <span>Request Example</span>
                  <span className="code-lang">JavaScript</span>
                </div>
                <pre className="docs-code-example">
                  <code>
{`const client = require('techstack-node')('sk_live_51A');

client.reader.chapters.retrieve('${currentChapter.id}')
  .then(chapter => {
    console.log('Chapter payload received:');
  })
  .catch(error => {
    console.error('Request failed:', error);
  });`}
                  </code>
                </pre>

                <div className="code-example-header" style={{ marginTop: '15px' }}>
                  <span>Response Headers</span>
                  <span className="code-lang">HTTP 200 OK</span>
                </div>
                <pre className="docs-code-example response-headers">
                  <code>
{`cache-control: private, max-age=0
content-type: application/json; charset=utf-8
x-request-id: req_9aB12d4F`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      );

    case 'blog':
    default:
      return (
        <article className="disguised-article-view">
          <div className="article-header">
            <span className="article-tag">Software Engineering</span>
            <h1 className="article-title">{mockTechTitle}</h1>
            
            <div className="author-meta">
              <img 
                src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150" 
                alt="System Arch" 
                className="author-avatar" 
              />
              <div className="author-info">
                <span className="author-name">Alex Chen (Dev Core)</span>
                <span className="publish-date">
                  Updated 2 mins ago • Section {currentChapterIndex + 1}
                  {' • '}
                  <span className="blurry-heading-inline" title="Real Chapter Marker">{currentChapter.title}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div 
            className="article-body" 
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          >
            {parsedBlogElements}
          </div>
        </article>
      );
  }
};
