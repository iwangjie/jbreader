import React, { useState } from 'react';
import { Sliders, Settings, ShieldAlert, BookOpen, Trash2, X } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  disguiseTheme: 'blog' | 'code' | 'diff' | 'docs';
  setDisguiseTheme: (theme: 'blog' | 'code' | 'diff' | 'docs') => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  panicKey: string;
  setPanicKey: (key: string) => void;
  resumePasscode: string;
  setResumePasscode: (code: string) => void;
  bookHistory: { title: string; author: string; id: string }[];
  onSelectHistoryBook: (id: string) => void;
  onRemoveHistoryBook: (id: string) => void;
  onClearAll: () => void;
  onTriggerUpload: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  disguiseTheme,
  setDisguiseTheme,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  panicKey,
  setPanicKey,
  resumePasscode,
  setResumePasscode,
  bookHistory,
  onSelectHistoryBook,
  onRemoveHistoryBook,
  onClearAll,
  onTriggerUpload
}) => {
  const [tempPanicKey, setTempPanicKey] = useState(panicKey);
  const [tempResumeCode, setTempResumeCode] = useState(resumePasscode);

  const handlePanicKeyChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setPanicKey(e.key);
    setTempPanicKey(e.key);
  };

  const handleApplyResumeCode = () => {
    if (tempResumeCode.trim().length > 0) {
      setResumePasscode(tempResumeCode.trim());
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <div className="settings-header-title">
            <Settings className="settings-icon-spin" size={18} />
            <h2>System DevTools Console</h2>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* Section 1: Disguise Theme Configuration */}
          <div className="settings-section">
            <h3 className="settings-sec-title">
              <Sliders size={14} className="sec-icon" />
              Camouflage Core Config
            </h3>
            
            <div className="settings-form-group">
              <label className="settings-label">Camouflage Interface Layout</label>
              <div className="theme-selector-grid">
                <button 
                  className={`theme-select-card ${disguiseTheme === 'blog' ? 'active' : ''}`}
                  onClick={() => setDisguiseTheme('blog')}
                >
                  <div className="theme-preview blog-preview"></div>
                  <span className="theme-name">Standard Blog</span>
                  <span className="theme-desc">Paragraphs with tech banners</span>
                </button>

                <button 
                  className={`theme-select-card ${disguiseTheme === 'code' ? 'active' : ''}`}
                  onClick={() => setDisguiseTheme('code')}
                >
                  <div className="theme-preview code-preview"></div>
                  <span className="theme-name">Code Comments</span>
                  <span className="theme-desc">Hidden in IDE comments</span>
                </button>

                <button 
                  className={`theme-select-card ${disguiseTheme === 'diff' ? 'active' : ''}`}
                  onClick={() => setDisguiseTheme('diff')}
                >
                  <div className="theme-preview diff-preview"></div>
                  <span className="theme-name">Git Pull Request</span>
                  <span className="theme-desc">As green lines in git diff</span>
                </button>

                <button 
                  className={`theme-select-card ${disguiseTheme === 'docs' ? 'active' : ''}`}
                  onClick={() => setDisguiseTheme('docs')}
                >
                  <div className="theme-preview docs-preview"></div>
                  <span className="theme-name">API Documentation</span>
                  <span className="theme-desc">Under API endpoint details</span>
                </button>
              </div>
            </div>

            {/* Typography adjustments */}
            <div className="settings-form-row">
              <div className="settings-form-group half">
                <label className="settings-label">Font Size ({fontSize}px)</label>
                <input 
                  type="range" 
                  min="12" 
                  max="22" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="settings-slider"
                />
              </div>

              <div className="settings-form-group half">
                <label className="settings-label">Line Height ({lineHeight})</label>
                <input 
                  type="range" 
                  min="1.3" 
                  max="2.0" 
                  step="0.1" 
                  value={lineHeight} 
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="settings-slider"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Panic Mechanism Security */}
          <div className="settings-section">
            <h3 className="settings-sec-title">
              <ShieldAlert size={14} className="sec-icon" />
              Panic Shield & Security Variables
            </h3>
            <p className="settings-sec-desc">
              Define triggers to instantly clear the book and lock the interface into a safe technical blog article.
            </p>

            <div className="settings-form-row">
              <div className="settings-form-group half">
                <label className="settings-label">Panic Instant Key</label>
                <input 
                  type="text" 
                  value={tempPanicKey} 
                  onKeyDown={handlePanicKeyChange}
                  readOnly
                  placeholder="Press any key (e.g. Escape)"
                  className="settings-input"
                />
                <span className="input-helper">Press a key in the box to capture it (Default: Escape).</span>
              </div>

              <div className="settings-form-group half">
                <label className="settings-label">Resume Passcode (Secret)</label>
                <div className="input-with-btn">
                  <input 
                    type="text" 
                    value={tempResumeCode} 
                    onChange={(e) => setTempResumeCode(e.target.value)}
                    placeholder="Type passcode (e.g. read)"
                    className="settings-input"
                  />
                  <button className="apply-btn" onClick={handleApplyResumeCode}>Apply</button>
                </div>
                <span className="input-helper">Type this word anywhere on screen to resume reading.</span>
              </div>
            </div>

            <div className="settings-form-group">
              <label className="settings-label">Scroll Trigger Sensitivity</label>
              <div className="checkbox-wrapper">
                <input type="checkbox" id="scrollPanic" defaultChecked />
                <label htmlFor="scrollPanic">
                  <strong>Enable Rapid Scroll Panic:</strong> Swiping rapidly up or down on trackpad/mouse will instantly hide the novel.
                </label>
              </div>
              <div className="checkbox-wrapper">
                <input type="checkbox" id="doubleClickPanic" defaultChecked />
                <label htmlFor="doubleClickPanic">
                  <strong>Enable Double-Click Panic:</strong> Double-clicking anywhere on the background triggers panic mode.
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Library Database */}
          <div className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 className="settings-sec-title" style={{ margin: 0 }}>
                <BookOpen size={14} className="sec-icon" />
                Local Novel Library
              </h3>
              <button className="apply-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={onTriggerUpload}>
                + Sync New Config
              </button>
            </div>
            
            {bookHistory.length === 0 ? (
              <div className="empty-history-box">
                No local books stored. Click '+ Sync New Config' to load EPUB files.
              </div>
            ) : (
              <div className="history-list-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookHistory.map((book) => (
                      <tr key={book.id}>
                        <td className="book-title-cell">
                          <button 
                            className="select-book-link"
                            onClick={() => {
                              onSelectHistoryBook(book.id);
                              onClose();
                            }}
                          >
                            {book.title}
                          </button>
                        </td>
                        <td>{book.author}</td>
                        <td className="action-cell">
                          <button 
                            className="delete-book-btn"
                            onClick={() => onRemoveHistoryBook(book.id)}
                            title="Delete book from cache"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="history-footer">
                  <button className="clear-all-btn" onClick={onClearAll}>
                    Clear All Cache Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
