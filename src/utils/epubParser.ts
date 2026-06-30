import JSZip from 'jszip';

export interface BookMetadata {
  title: string;
  creator: string; // Author
  language: string;
}

export interface Chapter {
  id: string;
  title: string;
  href: string;
  content: string; // Raw or cleaned HTML content
}

export interface ParsedBook {
  metadata: BookMetadata;
  chapters: Chapter[];
  zip: JSZip;
  opfPath: string;
}

/**
 * Normalizes paths, resolving relative segments like '../'
 */
function resolvePath(basePath: string, relativePath: string): string {
  const baseParts = basePath.split('/').slice(0, -1);
  const relParts = relativePath.split('/');
  
  for (const part of relParts) {
    if (part === '.') {
      continue;
    } else if (part === '..') {
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }
  
  return baseParts.join('/');
}

/**
 * Extracts and parses the content.opf file from the EPUB container
 */
export async function parseEpub(file: File): Promise<ParsedBook> {
  const zip = await JSZip.loadAsync(file);
  
  // 1. Parse META-INF/container.xml to find the root OPF file path
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB: Missing META-INF/container.xml');
  }
  
  const containerText = await containerFile.async('text');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerText, 'text/xml');
  const rootfile = containerDoc.querySelector('rootfile');
  if (!rootfile) {
    throw new Error('Invalid EPUB: No rootfile element in container.xml');
  }
  
  const opfPath = rootfile.getAttribute('full-path');
  if (!opfPath) {
    throw new Error('Invalid EPUB: Missing full-path attribute in container.xml');
  }
  
  // 2. Parse the OPF file
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: Root OPF file not found at ${opfPath}`);
  }
  
  const opfText = await opfFile.async('text');
  const opfDoc = parser.parseFromString(opfText, 'text/xml');
  
  // Extract Metadata
  const title = opfDoc.querySelector('metadata > title, dc\\:title')?.textContent || 'Unknown Title';
  const creator = opfDoc.querySelector('metadata > creator, dc\\:creator')?.textContent || 'Unknown Author';
  const language = opfDoc.querySelector('metadata > language, dc\\:language')?.textContent || 'en';
  
  const metadata: BookMetadata = { title, creator, language };
  
  // Extract Manifest Items (map id -> href)
  const manifestItems = opfDoc.querySelectorAll('manifest > item');
  const manifestMap = new Map<string, { href: string; mediaType: string }>();
  manifestItems.forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    if (id && href) {
      manifestMap.set(id, { href, mediaType: mediaType || '' });
    }
  });
  
  // Extract Spine (ordered items)
  const spineItems = opfDoc.querySelectorAll('spine > itemref');
  const chapters: Chapter[] = [];
  
  for (let i = 0; i < spineItems.length; i++) {
    const itemref = spineItems[i];
    const idref = itemref.getAttribute('idref');
    if (idref) {
      const manifestItem = manifestMap.get(idref);
      if (manifestItem) {
        // Resolve path to the ZIP file entry
        const relativeHref = manifestItem.href;
        const zipPath = resolvePath(opfPath, relativeHref);
        
        let chapterTitle = `Chapter ${i + 1}`;
        
        chapters.push({
          id: idref,
          title: chapterTitle,
          href: zipPath,
          content: '', // Will load lazily or on demand
        });
      }
    }
  }
  
  return {
    metadata,
    chapters,
    zip,
    opfPath,
  };
}

/**
 * Loads a chapter's HTML content from the ZIP, sanitizes it, and converts internal image references to base64 Data URLs.
 */
export async function loadChapterContent(book: ParsedBook, chapterIndex: number): Promise<string> {
  const chapter = book.chapters[chapterIndex];
  if (!chapter) {
    throw new Error('Chapter index out of range');
  }
  
  const file = book.zip.file(chapter.href);
  if (!file) {
    return `<p>Error: Chapter content not found at path: ${chapter.href}</p>`;
  }
  
  let contentText = await file.async('text');
  
  // Extract body content to fit into our disguised container nicely
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentText, 'text/html');
  
  // Try to find the document title from h1-h4 tags if we can, to give the chapter a better name
  const heading = doc.querySelector('h1, h2, h3, h4');
  if (heading && heading.textContent && heading.textContent.trim().length > 2) {
    chapter.title = heading.textContent.trim();
  }
  
  const body = doc.querySelector('body') || doc.documentElement;
  
  // Process all images to display inline as base64
  const images = body.querySelectorAll('img, image');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const srcAttr = img.tagName.toLowerCase() === 'image' ? 'xlink:href' : 'src';
    const src = img.getAttribute(srcAttr);
    
    if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
      try {
        // Resolve image path inside the ZIP
        const imgPath = resolvePath(chapter.href, src);
        const imgFile = book.zip.file(imgPath);
        
        if (imgFile) {
          // Detect mime type
          let mimeType = 'image/jpeg';
          if (src.endsWith('.png')) mimeType = 'image/png';
          else if (src.endsWith('.gif')) mimeType = 'image/gif';
          else if (src.endsWith('.svg')) mimeType = 'image/svg+xml';
          
          const base64Data = await imgFile.async('base64');
          
          // Replace tag with static html-friendly img tag
          if (img.tagName.toLowerCase() === 'image') {
            const newImg = document.createElement('img');
            newImg.setAttribute('src', `data:${mimeType};base64,${base64Data}`);
            Array.from(img.attributes).forEach(attr => {
              if (attr.name !== 'xlink:href' && attr.name !== 'href') {
                newImg.setAttribute(attr.name, attr.value);
              }
            });
            img.replaceWith(newImg);
          } else {
            img.setAttribute('src', `data:${mimeType};base64,${base64Data}`);
          }
        }
      } catch (err) {
        console.error('Failed to parse inline image:', src, err);
      }
    }
  }

  // Remove styling sections, external stylesheets, and scripts to prevent breaking our camo pages
  const styles = body.querySelectorAll('style, link[rel="stylesheet"], script');
  styles.forEach(el => el.remove());
  
  return body.innerHTML;
}
