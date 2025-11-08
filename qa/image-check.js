/**
 * Image Checker for Cristiano Ronaldo Website
 * Scans all pages for image references and checks for 404s
 */

(function() {
  'use strict';

  const PAGES = ['index.html', 'about.html', 'blog.html', 'portfolio.html', 'contact.html', '404.html'];
  const statusEl = document.getElementById('qa-status');
  const tbodyEl = document.getElementById('qa-tbody');
  
  let totalImages = 0;
  let brokenImages = 0;
  const report = {
    timestamp: new Date().toISOString(),
    pages: [],
    summary: {
      total: 0,
      broken: 0,
      ok: 0
    }
  };

  // Normalize image URL
  function normalizeImageUrl(url, basePage) {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url; // External URL, skip
    }
    
    if (url.startsWith('./')) {
      return url.substring(2);
    }
    
    if (url.startsWith('/')) {
      return url.substring(1);
    }
    
    // Relative to current page
    const baseDir = basePage.includes('/') ? basePage.substring(0, basePage.lastIndexOf('/') + 1) : '';
    return baseDir + url;
  }

  // Check if URL is local image
  function isLocalImage(url) {
    return url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//') && 
           (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif') || url.includes('.svg'));
  }

  // Fix common image path issues
  function fixImagePath(url) {
    // Remove leading slash
    if (url.startsWith('/')) {
      url = url.substring(1);
    }
    
    // Fix case issues
    url = url.replace(/\.JPG$/i, '.jpg');
    url = url.replace(/\.JPEG$/i, '.jpg');
    url = url.replace(/\.PNG$/i, '.png');
    url = url.replace(/\.WEBP$/i, '.webp');
    
    return url;
  }

  // Check single image URL
  async function checkImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok ? 'OK' : 'BROKEN';
    } catch (error) {
      return 'BROKEN';
    }
  }

  // Add row to table
  function addRow(page, element, url, status) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${page}</td>
      <td>${element}</td>
      <td>${url}</td>
      <td class="status-${status.toLowerCase()}">${status}</td>
    `;
    tbodyEl.appendChild(row);
    
    totalImages++;
    if (status === 'BROKEN') {
      brokenImages++;
    }
  }

  // Update status
  function updateStatus(message) {
    statusEl.textContent = message;
  }

  // Check single page for images
  async function checkPageImages(pageName) {
    updateStatus(`Checking images in ${pageName}...`);
    
    try {
      const response = await fetch(pageName);
      if (!response.ok) {
        addRow(pageName, 'PAGE', pageName, 'BROKEN');
        return;
      }
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const pageReport = {
        page: pageName,
        images: []
      };
      
      // Check img tags
      const images = doc.querySelectorAll('img[src]');
      for (const img of images) {
        const src = img.getAttribute('src');
        const normalizedUrl = normalizeImageUrl(src, pageName);
        
        if (isLocalImage(normalizedUrl)) {
          const status = await checkImageUrl(normalizedUrl);
          addRow(pageName, 'IMG', normalizedUrl, status);
          pageReport.images.push({ url: normalizedUrl, status });
          
          // If broken, try to fix it
          if (status === 'BROKEN') {
            const fixedUrl = fixImagePath(normalizedUrl);
            if (fixedUrl !== normalizedUrl) {
              const fixedStatus = await checkImageUrl(fixedUrl);
              if (fixedStatus === 'OK') {
                addRow(pageName, 'IMG (FIXED)', fixedUrl, 'OK');
                pageReport.images.push({ url: fixedUrl, status: 'OK' });
              }
            }
          }
        }
      }
      
      // Check source tags
      const sources = doc.querySelectorAll('source[srcset]');
      for (const source of sources) {
        const srcset = source.getAttribute('srcset');
        if (srcset && srcset.includes(' ')) {
          const firstSrc = srcset.split(' ')[0];
          const normalizedUrl = normalizeImageUrl(firstSrc, pageName);
          
          if (isLocalImage(normalizedUrl)) {
            const status = await checkImageUrl(normalizedUrl);
            addRow(pageName, 'SOURCE', normalizedUrl, status);
            pageReport.images.push({ url: normalizedUrl, status });
            
            // If broken, try to fix it
            if (status === 'BROKEN') {
              const fixedUrl = fixImagePath(normalizedUrl);
              if (fixedUrl !== normalizedUrl) {
                const fixedStatus = await checkImageUrl(fixedUrl);
                if (fixedStatus === 'OK') {
                  addRow(pageName, 'SOURCE (FIXED)', fixedUrl, 'OK');
                  pageReport.images.push({ url: fixedUrl, status: 'OK' });
                }
              }
            }
          }
        }
      }
      
      report.pages.push(pageReport);
      
    } catch (error) {
      addRow(pageName, 'PAGE', pageName, 'BROKEN');
    }
  }

  // Main execution
  async function runImageCheck() {
    updateStatus('Starting image check...');
    
    for (const page of PAGES) {
      await checkPageImages(page);
    }
    
    // Update summary
    report.summary.total = totalImages;
    report.summary.broken = brokenImages;
    report.summary.ok = totalImages - brokenImages;
    
    // Update status
    if (brokenImages === 0) {
      updateStatus(`✅ All images OK! Checked ${totalImages} images across ${PAGES.length} pages.`);
    } else {
      updateStatus(`❌ Found ${brokenImages} broken images out of ${totalImages} total images.`);
    }
    
    // Save report
    try {
      console.log('Image Check Report:', report);
    } catch (error) {
      console.log('Could not save report:', error);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runImageCheck);
  } else {
    runImageCheck();
  }

})();






