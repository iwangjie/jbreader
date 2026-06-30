import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Reader } from './components/Reader';
import { Uploader } from './components/Uploader';
import { SettingsPanel } from './components/SettingsPanel';
import { parseEpub, loadChapterContent } from './utils/epubParser';
import type { ParsedBook } from './utils/epubParser';
import { MOCK_ARTICLES } from './data/mockArticles';
import { 
  saveBookToDB, 
  getBookFromDB, 
  getAllBooksFromDB, 
  deleteBookFromDB, 
  clearAllBooksFromDB 
} from './utils/storage';

export default function App() {
  // Disguise & Appearance Preferences
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tech_theme') as 'light' | 'dark') || 'light';
  });
  const [disguiseTheme, setDisguiseTheme] = useState<'blog' | 'code' | 'diff' | 'docs'>(() => {
    return (localStorage.getItem('tech_disguise') as 'blog' | 'code' | 'diff' | 'docs') || 'blog';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('tech_font_size') || '15');
  });
  const [lineHeight, setLineHeight] = useState<number>(() => {
    return parseFloat(localStorage.getItem('tech_line_height') || '1.6');
  });

  // Panic Mechanics state
  const [isPanic, setIsPanic] = useState<boolean>(true); // Defaults to camo mode for safety!
  const [panicKey, setPanicKey] = useState<string>(() => {
    return localStorage.getItem('tech_panic_key') || 'Escape';
  });
  const [resumePasscode, setResumePasscode] = useState<string>(() => {
    return localStorage.getItem('tech_resume_code') || 'read';
  });

  // EPUB Books State
  const [activeBook, setActiveBook] = useState<ParsedBook | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [chapterContent, setChapterContent] = useState<string>('');
  const [isLoadingChapter, setIsLoadingChapter] = useState<boolean>(false);
  const [bookHistory, setBookHistory] = useState<{ title: string; author: string; id: string }[]>([]);
  
  // App UI state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isLoadingBook, setIsLoadingBook] = useState<boolean>(false);
  const [showUploader, setShowUploader] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeArticleId, setActiveArticleId] = useState<string>(() => {
    return (localStorage.getItem('tech_article_id')) || MOCK_ARTICLES[0].id;
  });

  const typedBuffer = useRef<string>('');

  // Sync Preferences to LocalStorage
  useEffect(() => {
    localStorage.setItem('tech_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tech_disguise', disguiseTheme);
  }, [disguiseTheme]);

  useEffect(() => {
    localStorage.setItem('tech_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('tech_line_height', lineHeight.toString());
  }, [lineHeight]);

  useEffect(() => {
    localStorage.setItem('tech_panic_key', panicKey);
  }, [panicKey]);

  useEffect(() => {
    localStorage.setItem('tech_resume_code', resumePasscode);
  }, [resumePasscode]);

  useEffect(() => {
    localStorage.setItem('tech_article_id', activeArticleId);
  }, [activeArticleId]);

  // Load Book Catalog History from IndexedDB
  const refreshHistory = useCallback(async () => {
    try {
      const history = await getAllBooksFromDB();
      setBookHistory(history);
    } catch (err) {
      console.error('Failed to load book history:', err);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Recover active book from Cache on mount
  useEffect(() => {
    const autoRecoverBook = async () => {
      const savedBookId = localStorage.getItem('tech_active_book_id');
      const savedChapter = parseInt(localStorage.getItem('tech_active_chapter') || '0');
      
      if (savedBookId) {
        setIsLoadingBook(true);
        try {
          const cachedBook = await getBookFromDB(savedBookId);
          if (cachedBook) {
            // Re-parse the binary ArrayBuffer to obtain JSZip instance
            const blob = new Blob([cachedBook.data], { type: 'application/epub+zip' });
            const file = new File([blob], `${cachedBook.title}.epub`, { type: 'application/epub+zip' });
            const parsedBook = await parseEpub(file);
            
            setActiveBook(parsedBook);
            setCurrentChapterIndex(savedChapter);
            setIsPanic(false); // If recovered successfully, let them start reading
          }
        } catch (err) {
          console.error('Failed to recover book from index cache:', err);
        } finally {
          setIsLoadingBook(false);
        }
      }
    };

    autoRecoverBook();
  }, []);

  // Fetch chapter text when activeBook or currentChapterIndex changes
  useEffect(() => {
    const loadChapter = async () => {
      if (!activeBook) {
        setChapterContent('');
        return;
      }

      setIsLoadingChapter(true);
      try {
        const content = await loadChapterContent(activeBook, currentChapterIndex);
        setChapterContent(content);
        // Save reading progress
        localStorage.setItem('tech_active_chapter', currentChapterIndex.toString());
      } catch (err: any) {
        console.error(err);
        setChapterContent(`<p>Failed to load chapter content: ${err.message}</p>`);
      } finally {
        setIsLoadingChapter(false);
      }
    };

    loadChapter();
  }, [activeBook, currentChapterIndex]);

  // Handle Book Selection
  const handleBookLoaded = async (book: ParsedBook) => {
    setActiveBook(book);
    setCurrentChapterIndex(0);
    setIsPanic(false);
    setShowUploader(false);
    
    // Save metadata and file to cache database
    try {
      const savedBookId = book.metadata.title + '_' + book.metadata.creator;
      localStorage.setItem('tech_active_book_id', savedBookId);
      localStorage.setItem('tech_active_chapter', '0');
      
      // We need to write the raw zip buffer to DB
      // Generate standard array buffer from file
      const zipData = await book.zip.generateAsync({ type: 'arraybuffer' });
      await saveBookToDB(savedBookId, book.metadata.title, book.metadata.creator, zipData);
      
      refreshHistory();
    } catch (err) {
      console.error('Failed to cache book:', err);
    }
  };

  const handleSelectHistoryBook = async (id: string) => {
    setIsLoadingBook(true);
    setError(null);
    try {
      const record = await getBookFromDB(id);
      if (record) {
        const blob = new Blob([record.data], { type: 'application/epub+zip' });
        const file = new File([blob], `${record.title}.epub`, { type: 'application/epub+zip' });
        const parsed = await parseEpub(file);
        
        setActiveBook(parsed);
        const lastChap = parseInt(localStorage.getItem(`tech_chapter_${id}`) || '0');
        setCurrentChapterIndex(lastChap);
        localStorage.setItem('tech_active_book_id', id);
        localStorage.setItem('tech_active_chapter', lastChap.toString());
        setIsPanic(false);
        setShowUploader(false);
      }
    } catch (err: any) {
      setError('Failed to fetch book from cache: ' + err.message);
    } finally {
      setIsLoadingBook(false);
    }
  };

  const handleRemoveHistoryBook = async (id: string) => {
    try {
      await deleteBookFromDB(id);
      // If it was the active book, unload it
      const savedBookId = localStorage.getItem('tech_active_book_id');
      if (savedBookId === id) {
        setActiveBook(null);
        setChapterContent('');
        localStorage.removeItem('tech_active_book_id');
        localStorage.removeItem('tech_active_chapter');
      }
      refreshHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllBooksFromDB();
      setActiveBook(null);
      setChapterContent('');
      localStorage.removeItem('tech_active_book_id');
      localStorage.removeItem('tech_active_chapter');
      refreshHistory();
    } catch (err) {
      console.error(err);
    }
  };

  // Listen for Chapter Progression to cache current progress
  const handleChapterSelect = (index: number) => {
    setCurrentChapterIndex(index);
    if (activeBook) {
      const bookId = activeBook.metadata.title + '_' + activeBook.metadata.creator;
      localStorage.setItem(`tech_chapter_${bookId}`, index.toString());
    }
  };

  // Keyboard panic hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check for Panic Key Press
      if (e.key === panicKey) {
        setIsPanic(true);
        setShowSettings(false); // Close settings panel instantly too
      }

      // 2. Buffer alphabetical keys for the resume passcode
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        typedBuffer.current = (typedBuffer.current + e.key.toLowerCase()).slice(-20);
        if (typedBuffer.current.endsWith(resumePasscode)) {
          setIsPanic(false);
          typedBuffer.current = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panicKey, resumePasscode]);

  // Mouse Wheel swipe panic trigger
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check for rapid scrolling (high deltaY value indicating user flicked the scroll wheel/trackpad)
      if (Math.abs(e.deltaY) > 130) {
        setIsPanic(true);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Double click panic trigger
  useEffect(() => {
    const handleDoubleClick = () => {
      setIsPanic(true);
    };

    window.addEventListener('dblclick', handleDoubleClick);
    return () => window.removeEventListener('dblclick', handleDoubleClick);
  }, []);

  const handleArticleSelect = (id: string) => {
    setActiveArticleId(id);
    setShowUploader(false);
    setIsPanic(true);
  };

  const activeArticle = MOCK_ARTICLES.find(a => a.id === activeArticleId) || MOCK_ARTICLES[0];

  return (
    <Layout
      activeBook={activeBook}
      currentChapterIndex={currentChapterIndex}
      onChapterSelect={handleChapterSelect}
      isPanic={isPanic}
      theme={theme}
      setTheme={setTheme}
      onToggleSettings={() => setShowSettings(!showSettings)}
      disguiseTheme={disguiseTheme}
      activeArticleId={activeArticleId}
      onArticleSelect={handleArticleSelect}
      onTriggerPanic={() => setIsPanic(true)}
    >
      {/* If showUploader is active, show it. Otherwise render the reader (which shows the book or a camo article) */}
      {showUploader ? (
        <Uploader
          onBookLoaded={handleBookLoaded}
          isLoading={isLoadingBook}
          setIsLoading={setIsLoadingBook}
          setError={setError}
          error={error}
        />
      ) : (
        <Reader
          activeBook={activeBook}
          currentChapterIndex={currentChapterIndex}
          chapterContent={chapterContent}
          isLoadingChapter={isLoadingChapter}
          isPanic={isPanic}
          activeArticle={activeArticle}
          disguiseTheme={disguiseTheme}
          fontSize={fontSize}
          lineHeight={lineHeight}
        />
      )}

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          disguiseTheme={disguiseTheme}
          setDisguiseTheme={setDisguiseTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
          lineHeight={lineHeight}
          setLineHeight={setLineHeight}
          panicKey={panicKey}
          setPanicKey={setPanicKey}
          resumePasscode={resumePasscode}
          setResumePasscode={setResumePasscode}
          bookHistory={bookHistory}
          onSelectHistoryBook={handleSelectHistoryBook}
          onRemoveHistoryBook={handleRemoveHistoryBook}
          onClearAll={handleClearAll}
          onTriggerUpload={() => {
            setShowUploader(true);
            setShowSettings(false);
          }}
        />
      )}
    </Layout>
  );
}
export { App };
