---
layout: default
title: "Stats Test"
permalink: /stats-test/
---

<div style="padding: 20px;">
  <h2>Visitor Statistics Test Page</h2>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Debug Information</h3>
    <div id="debug-info">
      <p>Loading debug info...</p>
    </div>
    
    <button onclick="resetStats()" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">
      Reset All Stats
    </button>
    
    <button onclick="addTestVisit()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">
      Add Test Visit
    </button>
    
    <button onclick="showRawData()" style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 4px;">
      Show Raw Data
    </button>
  </div>

  {% include visitor-stats-switcher.html %}
  
  <div style="background: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 20px;">
    <h4>How to Test Accumulation:</h4>
    <ol>
      <li>Note the current visit count</li>
      <li>Open this page in a new incognito/private window</li>
      <li>Wait for the location to load</li>
      <li>Close the incognito window and refresh this page</li>
      <li>The count should increase by 1</li>
    </ol>
    
    <p><strong>Note:</strong> New visits are only counted if more than 4 hours have passed since the last visit from the same browser.</p>
  </div>
</div>

<script>
function updateDebugInfo() {
  const debugDiv = document.getElementById('debug-info');
  
  if (window.visitorStats && window.visitorStats.stats) {
    const stats = window.visitorStats.stats;
    const lastVisit = stats.lastVisit ? new Date(stats.lastVisit).toLocaleString() : 'Never';
    const firstVisit = stats.firstVisit ? new Date(stats.firstVisit).toLocaleString() : 'Never';
    
    debugDiv.innerHTML = `
      <p><strong>Total Visits:</strong> ${stats.totalVisits}</p>
      <p><strong>First Visit:</strong> ${firstVisit}</p>
      <p><strong>Last Visit:</strong> ${lastVisit}</p>
      <p><strong>Sessions Count:</strong> ${stats.sessions ? stats.sessions.length : 0}</p>
      <p><strong>Daily Stats:</strong> ${Object.keys(stats.dailyStats || {}).length} days recorded</p>
      <p><strong>Cache Status:</strong> ${window.visitorStats.cache.locationData ? 'Location cached' : 'No location cache'}</p>
    `;
  } else {
    debugDiv.innerHTML = '<p>Visitor stats not loaded yet...</p>';
    setTimeout(updateDebugInfo, 1000);
  }
}

function resetStats() {
  if (confirm('Are you sure you want to reset all visitor statistics? This cannot be undone.')) {
    localStorage.removeItem('advanced_visitor_stats');
    sessionStorage.removeItem('visitor_session');
    localStorage.removeItem('recent_visitors');
    location.reload();
  }
}

function addTestVisit() {
  if (window.visitorStats) {
    // 模拟新访问（重置最后访问时间）
    window.visitorStats.stats.lastVisit = Date.now() - (5 * 60 * 60 * 1000); // 5小时前
    window.visitorStats.updateVisitCounts();
    updateDebugInfo();
    alert('Test visit added! Check the stats above.');
  }
}

function showRawData() {
  const data = localStorage.getItem('advanced_visitor_stats');
  if (data) {
    const formatted = JSON.stringify(JSON.parse(data), null, 2);
    const popup = window.open('', '_blank');
    popup.document.write(`
      <html>
        <head><title>Raw Visitor Stats Data</title></head>
        <body>
          <h2>Raw Visitor Statistics Data</h2>
          <pre style="background: #f8f9fa; padding: 20px; border-radius: 8px; overflow: auto;">${formatted}</pre>
        </body>
      </html>
    `);
  } else {
    alert('No data found in localStorage');
  }
}

// 初始化调试信息
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateDebugInfo);
} else {
  updateDebugInfo();
}

// 每5秒更新调试信息
setInterval(updateDebugInfo, 5000);
</script>
