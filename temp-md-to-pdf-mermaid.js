const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

// Configure marked to preserve Mermaid blocks
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Function to convert Markdown to HTML with Mermaid support
function markdownToHtml(mdContent) {
  // Replace mermaid blocks with pre.mermaid tags so Mermaid.js recognizes them
  let html = marked.parse(mdContent);
  
  // Ensure mermaid blocks are properly formatted
  html = html.replace(/<pre><code class="language-mermaid">/g, '<pre class="mermaid">');
  html = html.replace(/<\/code><\/pre>/g, '</pre>');
  
  // Template HTML avec le script Mermaid
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h1 {
      border-bottom: 2px solid #eaecef;
      padding-bottom: 0.3em;
    }
    h2 {
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    table th, table td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
    }
    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    code {
      background-color: #f6f8fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background-color: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    pre.mermaid {
      text-align: center;
      background-color: white;
      padding: 20px;
    }
    blockquote {
      border-left: 4px solid #dfe2e5;
      padding-left: 16px;
      color: #6a737d;
      margin: 1em 0;
    }
  </style>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</head>
<body>
${html}
</body>
</html>`;
}

// Main function
async function convertToPdf(inputPath, outputPath) {
  try {
    console.log(`Reading ${inputPath}...`);
    const mdContent = fs.readFileSync(inputPath, 'utf-8');
    
    console.log(`Converting Markdown → HTML...`);
    const html = markdownToHtml(mdContent);
    
    const htmlPath = inputPath.replace('.md', '.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`HTML generated: ${htmlPath}`);
    
    console.log(`Launching Puppeteer...`);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    const fileUrl = `file://${path.resolve(htmlPath)}`;
    
    console.log(`Loading page and rendering Mermaid diagrams...`);
    await page.goto(fileUrl, {
      waitUntil: 'networkidle2'
    });
    
    // Wait for Mermaid to finish rendering diagrams
    await page.waitForFunction(() => {
      const mermaidElements = document.querySelectorAll('.mermaid');
      if (mermaidElements.length === 0) return true;
      // Check that all diagrams have been rendered (have an SVG child)
      return Array.from(mermaidElements).every(el => el.querySelector('svg') !== null);
    }, { timeout: 10000 }).catch(() => {
      // If timeout, continue anyway
      console.log('Timeout waiting for Mermaid rendering, continuing...');
    });
    
    // Wait a bit more to be sure
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Generating PDF...`);
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    
    // Clean up temporary HTML file
    fs.unlinkSync(htmlPath);
    
    console.log(`PDF generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error:`, error.message);
    throw error;
  }
}

// Execution
const files = ['docs/DAL.md', 'docs/METHODOLOGIE.md'];
Promise.all(files.map(f => convertToPdf(f, f.replace('.md', '.pdf'))))
  .then(() => {
    console.log('Conversion completed for all files');
  })
  .catch(error => {
    console.error('Error during conversion:', error);
    process.exit(1);
  });
