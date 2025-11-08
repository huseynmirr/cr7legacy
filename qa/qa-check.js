/**
 * QA Link & Asset Checker
 * Checks all pages for broken links and assets
 */

(function() {
  'use strict';

  const PAGES = ['index.html', 'about.html', 'blog.html', 'portfolio.html', 'contact.html', '404.html'];
  const statusEl = document.getElementById('qa-status');
  const tbodyEl = document.getElementById('qa-tbody');
  
  let totalItems = 0;
  let brokenItems = 0;
  const report = {
    timestamp: new Date().toISOString(),
    pages: [],
    summary: {
      total: 0,
      broken: 0,
      ok: 0
    }
  };

  // Normalize URL to handle relative paths
  function normalizeUrl(url, basePage) {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url; // External URL, skip
    }
    
    if (url.startsWith('./')) {
      return url.substring(2);
    }
    
    if (url.startsWith('/')) {
      return url.substring(1);
    }
    
    if (url.startsWith('#')) {
      return null; // Anchor link, skip
    }
    
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      return null; // Protocol links, skip
    }
    
    // Relative to current page
    const baseDir = basePage.includes('/') ? basePage.substring(0, basePage.lastIndexOf('/') + 1) : '';
    return baseDir + url;
  }

  // Check if URL is local
  function isLocalUrl(url) {
    return url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//');
  }

  // Check single URL
  async function checkUrl(url) {
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
    
    totalItems++;
    if (status === 'BROKEN') {
      brokenItems++;
    }
  }

  // Update status
  function updateStatus(message) {
    statusEl.textContent = message;
  }

  // Check single page
  async function checkPage(pageName) {
    updateStatus(`Checking ${pageName}...`);
    
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
        links: [],
        images: [],
        stylesheets: [],
        scripts: []
      };
      
      // Check links
      const links = doc.querySelectorAll('a[href]');
      for (const link of links) {
        const href = link.getAttribute('href');
        const normalizedUrl = normalizeUrl(href, pageName);
        
        if (isLocalUrl(normalizedUrl)) {
          const status = await checkUrl(normalizedUrl);
          addRow(pageName, 'LINK', normalizedUrl, status);
          pageReport.links.push({ url: normalizedUrl, status });
        }
      }
      
      // Check images
      const images = doc.querySelectorAll('img[src], source[srcset]');
      for (const img of images) {
        let src = img.getAttribute('src') || img.getAttribute('srcset');
        if (src && src.includes(' ')) {
          src = src.split(' ')[0]; // Get first src from srcset
        }
        
        const normalizedUrl = normalizeUrl(src, pageName);
        
        if (isLocalUrl(normalizedUrl)) {
          const status = await checkUrl(normalizedUrl);
          addRow(pageName, 'IMAGE', normalizedUrl, status);
          pageReport.images.push({ url: normalizedUrl, status });
        }
      }
      
      // Check stylesheets
      const stylesheets = doc.querySelectorAll('link[rel="stylesheet"], link[href]');
      for (const link of stylesheets) {
        const href = link.getAttribute('href');
        if (href) {
          const normalizedUrl = normalizeUrl(href, pageName);
          
          if (isLocalUrl(normalizedUrl)) {
            const status = await checkUrl(normalizedUrl);
            addRow(pageName, 'CSS', normalizedUrl, status);
            pageReport.stylesheets.push({ url: normalizedUrl, status });
          }
        }
      }
      
      // Check scripts
      const scripts = doc.querySelectorAll('script[src]');
      for (const script of scripts) {
        const src = script.getAttribute('src');
        const normalizedUrl = normalizeUrl(src, pageName);
        
        if (isLocalUrl(normalizedUrl)) {
          const status = await checkUrl(normalizedUrl);
          addRow(pageName, 'SCRIPT', normalizedUrl, status);
          pageReport.scripts.push({ url: normalizedUrl, status });
        }
      }
      
      report.pages.push(pageReport);
      
    } catch (error) {
      addRow(pageName, 'PAGE', pageName, 'BROKEN');
    }
  }

  // Main execution
  async function runQA() {
    updateStatus('Starting QA check...');
    
    for (const page of PAGES) {
      await checkPage(page);
    }
    
    // Update summary
    report.summary.total = totalItems;
    report.summary.broken = brokenItems;
    report.summary.ok = totalItems - brokenItems;
    
    // Update status
    if (brokenItems === 0) {
      updateStatus(`✅ All OK! Checked ${totalItems} items across ${PAGES.length} pages.`);
    } else {
      updateStatus(`❌ Found ${brokenItems} broken items out of ${totalItems} total items.`);
    }
    
    // Save report
    try {
      const response = await fetch('report.json', { method: 'POST' });
      // Note: In a real environment, you'd send this to a server
      // For now, we'll just log it
      console.log('QA Report:', report);
    } catch (error) {
      console.log('Could not save report:', error);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runQA);
  } else {
    runQA();
  }

})();






