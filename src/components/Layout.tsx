import React, { useState } from 'react';
import { Search, Terminal, Sliders, Moon, Sun, Command, ChevronRight, Rss } from 'lucide-react';
import type { ParsedBook } from '../utils/epubParser';
import { MOCK_ARTICLES } from '../data/mockArticles';

interface LayoutProps {
  children: React.ReactNode;
  activeBook: ParsedBook | null;
  currentChapterIndex: number;
  onChapterSelect: (index: number) => void;
  isPanic: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onToggleSettings: () => void;
  disguiseTheme: 'blog' | 'code' | 'diff' | 'docs';
  activeArticleId: string;
  onArticleSelect: (id: string) => void;
  onTriggerPanic: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeBook,
  currentChapterIndex,
  onChapterSelect,
  isPanic,
  theme,
  setTheme,
  onToggleSettings,
  disguiseTheme,
  activeArticleId,
  onArticleSelect,
  onTriggerPanic
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Disguise chapter headings as technical headings
  const getMockHeadingName = (chapterTitle: string, index: number) => {
    const techWords = [
      "1. System Architecture", "2. Dependency Injection", "3. Memory Allocation",
      "4. Garbage Collection", "5. Concurrent Pipelines", "6. Asynchronous Event Loops",
      "7. Distributed Caching", "8. API Gateway Implementation", "9. Data Serialization",
      "10. High-Throughput Buffering", "11. Network Handshakes", "12. Resource Cleanup",
      "13. Thread Optimization", "14. Latency Analysis", "15. Scalability Metrics"
    ];
    return techWords[index % techWords.length] + ` - ${chapterTitle.length > 25 ? chapterTitle.substring(0, 22) + '...' : chapterTitle}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.toLowerCase() === 'read' || searchQuery.toLowerCase() === 'settings') {
      onToggleSettings();
      setSearchQuery('');
    }
  };

  return (
    <div className={`app-container ${theme} disguise-${disguiseTheme} ${isPanic ? 'panic-active' : ''}`}>
      {/* Top Navbar */}
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo-area" onClick={() => onArticleSelect(MOCK_ARTICLES[0].id)}>
              <Terminal className="logo-icon" size={20} />
              <span className="logo-text">TechStack<span className="logo-dot">.io</span></span>
            </div>
            <nav className="main-nav">
              <a href="#articles" className="nav-link active">Articles</a>
              <a href="#tutorials" className="nav-link">Tutorials</a>
              <a href="#system" className="nav-link">System Design</a>
              <a href="#devops" className="nav-link">DevOps</a>
            </nav>
          </div>

          <div className="header-right">
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={16} />
                <input 
                  type="text" 
                  placeholder="Search articles, docs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <kbd className="search-kbd">
                  <Command size={10} />K
                </kbd>
              </div>
            </form>

            <button 
              className="icon-button theme-toggle" 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Secretly clicking Settings/Console */}
            <button 
              className="icon-button settings-toggle" 
              onClick={onToggleSettings}
              title="Console Options"
            >
              <Sliders size={18} />
            </button>

            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="icon-link" aria-label="GitHub Repository">
              <svg height="18" viewBox="0 0 16 16" width="18" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 01-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.35 3.12.88.01.47.01.84.01.93 0 .22-.16.47-.55.38A7.995 7.995 0 010 8c0-4.42 3.58-8 8-8z"></path></svg>
            </a>

            <div className="profile-badge">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" 
                alt="Profile" 
                className="profile-avatar" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Header / Alert banner */}
      <div className="alert-banner">
        <div className="banner-inner">
          <span className="banner-badge">NEW</span>
          <span className="banner-text">Vite 6.0 is now in beta! Read our migration guide to upgrade your project.</span>
          <a href="#migration" className="banner-link">Migration Guide <ChevronRight size={14} /></a>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="main-layout">
        {/* Left Sidebar (Table of Contents or Chapters list) */}
        <aside className="layout-sidebar sidebar-left">
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              {activeBook && !isPanic ? "Document Index" : "Article Outline"}
            </h3>
            
            <ul className="outline-list">
              {activeBook && !isPanic ? (
                activeBook.chapters.map((chap, idx) => (
                  <li key={chap.id} className="outline-item">
                    <button 
                      className={`outline-button ${currentChapterIndex === idx ? 'active' : ''}`}
                      onClick={() => onChapterSelect(idx)}
                    >
                      <span className="outline-index">0{idx + 1}.</span>
                      <span className="outline-text">{getMockHeadingName(chap.title, idx)}</span>
                    </button>
                  </li>
                ))
              ) : (
                // Mock layout sections
                <>
                  <li className="outline-item"><a href="#sec-1" className="outline-link active">1. Executive Summary</a></li>
                  <li className="outline-item"><a href="#sec-2" className="outline-link">2. Architectural Blueprints</a></li>
                  <li className="outline-item"><a href="#sec-3" className="outline-link">3. Benchmark Scenarios</a></li>
                  <li className="outline-item"><a href="#sec-4" className="outline-link">4. Memory Profiling Logs</a></li>
                  <li className="outline-item"><a href="#sec-5" className="outline-link">5. Production Deployment</a></li>
                </>
              )}
            </ul>
          </div>

          <div className="sidebar-section sticky-sidebar-left">
            <div className="info-card">
              <span className="info-card-badge">STATUS</span>
              <h4 className="info-card-title">Production Server</h4>
              <p className="info-card-desc">CPU load: 12.4% | Memory: 3.4GB / 16GB</p>
              <div className="status-indicator">
                <span className="status-dot green"></span>
                <span className="status-text">All systems operational</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Content Area */}
        <main className="layout-content">
          {children}
        </main>

        {/* Right Sidebar (Tech Blog Widgets) */}
        <aside className="layout-sidebar sidebar-right">
          {/* Mock popular articles list */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Popular Articles</h3>
            <ul className="trending-posts">
              {MOCK_ARTICLES.filter(a => a.id !== activeArticleId).slice(0, 3).map(article => (
                <li key={article.id} className="trending-item">
                  <span className="trending-category">{article.category}</span>
                  <a 
                    href={`#${article.id}`} 
                    className="trending-link"
                    onClick={() => {
                      onArticleSelect(article.id);
                      onTriggerPanic(); // Instantly goes to mock article
                    }}
                  >
                    {article.title}
                  </a>
                  <span className="trending-meta">{article.readTime} • {article.date}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tag Cloud */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Topics</h3>
            <div className="tag-cloud">
              <span className="tag">React</span>
              <span className="tag">TypeScript</span>
              <span className="tag">Rust</span>
              <span className="tag">WebAssembly</span>
              <span className="tag">Go</span>
              <span className="tag">System Design</span>
              <span className="tag">Kubernetes</span>
              <span className="tag">Tailwind</span>
              <span className="tag">Next.js</span>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="sidebar-section sticky-sidebar-right">
            <div className="newsletter-card">
              <Rss className="newsletter-icon" size={24} />
              <h4 className="newsletter-title">Subscribe to Dev Digest</h4>
              <p className="newsletter-desc">Get weekly engineering deep-dives directly in your inbox.</p>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="newsletter-input" 
                  required
                />
                <button type="submit" className="newsletter-button">Subscribe</button>
              </form>
            </div>
          </div>
        </aside>
      </div>

      {/* Disguised Tech Blog Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-copyright">
            © {new Date().getFullYear()} TechStack.io. Powered by Next.js, Vercel & React. All rights reserved.
          </div>
          <div className="footer-links">
            <span className="footer-link-subtle" onClick={onToggleSettings}>System Console</span>
            <a href="#terms">Terms of Service</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#contact">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
