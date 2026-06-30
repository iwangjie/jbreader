import React, { useState, useRef } from 'react';
import { FileCode, Upload, Shield, RefreshCw, Key, Check } from 'lucide-react';
import { parseEpub } from '../utils/epubParser';
import type { ParsedBook } from '../utils/epubParser';

interface UploaderProps {
  onBookLoaded: (book: ParsedBook) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
  error: string | null;
}

export const Uploader: React.FC<UploaderProps> = ({
  onBookLoaded,
  isLoading,
  setIsLoading,
  setError,
  error
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [showKeyGenerator, setShowKeyGenerator] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    
    // Accept EPUB even though the UI claims it expects JSON/YAML/credentials
    setError(null);
    setIsLoading(true);

    try {
      const parsedBook = await parseEpub(file);
      onBookLoaded(parsedBook);
    } catch (err: any) {
      console.error(err);
      setError("Failed to validate configuration payload structure: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const generateFakeKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDc3F6B...';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedKey(key + '== techstack-local-sync');
    setShowKeyGenerator(true);
  };

  const copyFakeKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="uploader-page">
      <div className="uploader-header">
        <h1 className="uploader-title">Local Environment Sync & Console</h1>
        <p className="uploader-subtitle">
          Securely load local configurations, credentials, and environmental variables into your browser sandbox environment.
        </p>
      </div>

      <div className="uploader-grid">
        {/* Main upload card */}
        <div className="uploader-card">
          <div className="card-header">
            <Shield className="card-header-icon" size={18} />
            <h2 className="card-title">Config Parser (.json, .yaml, credentials)</h2>
          </div>

          <div 
            className={`drag-drop-zone ${isDragActive ? 'drag-active' : ''} ${isLoading ? 'loading' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden-file-input"
              onChange={handleFileInput}
              accept=".epub,application/epub+zip"
            />
            
            {isLoading ? (
              <div className="upload-state-content">
                <RefreshCw className="animate-spin upload-icon" size={32} />
                <p className="upload-prompt">Parsing structure maps...</p>
                <p className="upload-subtext">Extracting schemas and validating credentials.</p>
              </div>
            ) : (
              <div className="upload-state-content">
                <Upload className="upload-icon" size={32} />
                <p className="upload-prompt">Drag & drop your config file or click to browse</p>
                <p className="upload-subtext">Supported formats: YAML configurations, JSON schemas, auth tokens, EPUB maps.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="upload-error-box">
              <span className="error-title">Parse Error:</span>
              <p className="error-message">{error}</p>
            </div>
          )}

          <div className="uploader-notice">
            <strong>Security Notice:</strong> All parsing is processed client-side. No credentials, tokens, or documents are ever uploaded to any servers. Files are processed entirely in memory.
          </div>
        </div>

        {/* Fake companion tools on the right to build 100% authenticity */}
        <div className="uploader-aside">
          {/* SSH key generator */}
          <div className="uploader-card card-aside">
            <div className="card-header">
              <Key className="card-header-icon" size={16} />
              <h3 className="card-title-sm">SSH RSA-4096 Key Generator</h3>
            </div>
            <div className="card-body-sm">
              <p className="aside-text">Need to setup ssh authentication? Generate a unique SSH public/private keypair directly in your sandbox.</p>
              <button className="aside-button" onClick={generateFakeKey}>
                Generate Sync Key
              </button>
              
              {showKeyGenerator && (
                <div className="key-output-wrapper">
                  <textarea 
                    className="key-textarea" 
                    value={generatedKey} 
                    readOnly
                  />
                  <button className="copy-key-btn" onClick={copyFakeKey}>
                    {copiedKey ? <Check size={12} /> : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick links to mock configs */}
          <div className="uploader-card card-aside">
            <div className="card-header">
              <FileCode className="card-header-icon" size={16} />
              <h3 className="card-title-sm">Default Variables</h3>
            </div>
            <div className="card-body-sm">
              <ul className="variables-list">
                <li className="var-item">
                  <span className="var-name">ENV:</span>
                  <span className="var-val">production</span>
                </li>
                <li className="var-item">
                  <span className="var-name">PORT:</span>
                  <span className="var-val">3000 (Local)</span>
                </li>
                <li className="var-item">
                  <span className="var-name">DATABASE_URL:</span>
                  <span className="var-val">postgresql://local...</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
