---
layout: default
title: "Visitors"
permalink: /visitors/
---

<div style="padding:20px">
  <h2>Visitors</h2>
  <p>This page shows recent visitors and basic aggregates. If an external endpoint is configured, data can also be loaded from there.</p>

  <div id="vis-aggregate" style="margin:16px 0; background:#f8f9fa; padding:12px; border-radius:8px"></div>

  <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center; margin-bottom:10px">
    <button id="load-local" style="padding:8px 12px">Load Local</button>
    <button id="load-remote" style="padding:8px 12px">Load Remote</button>
    <button id="export-local" style="padding:8px 12px">Export Local CSV</button>
  </div>

  <div style="overflow:auto">
    <table id="vis-table" style="width:100%; border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left; border-bottom:1px solid #e9ecef; padding:8px">Time</th>
          <th style="text-align:left; border-bottom:1px solid #e9ecef; padding:8px">IP (masked)</th>
          <th style="text-align:left; border-bottom:1px solid #e9ecef; padding:8px">Country</th>
          <th style="text-align:left; border-bottom:1px solid #e9ecef; padding:8px">Region</th>
          <th style="text-align:left; border-bottom:1px solid #e9ecef; padding:8px">City</th>
          <th style="text-align:left; border-bottom:1px solid #e9ecef; padding:8px">Referrer</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<script>
(function(){
  function maskIP(ip){
    if(!ip) return '';
    if(ip.indexOf('.')>-1){const p=ip.split('.'); return `${p[0]}.${p[1]}.*.***`;}
    if(ip.indexOf(':')>-1){const p=ip.split(':'); return p.slice(0,3).join(':') + ':****';}
    return ip;
  }
  function fmtTime(ts){ try{ return new Date(ts).toLocaleString(); }catch(e){ return '';} }

  function loadLocal(){
    try{
      const raw = localStorage.getItem('advanced_visitor_stats');
      if(!raw){ render([], 'No local data'); return; }
      const stats = JSON.parse(raw);
      const visitorsIdx = stats && stats.visitors ? stats.visitors : {};
      const rows = Object.keys(visitorsIdx).map(k=>{
        const v=visitorsIdx[k];
        return {
          timestamp: v.lastVisit || Date.now(),
          ip: v.ip || '', countryCode: v.countryCode||'', country: v.country||'',
          region: v.region||'', city: v.city||'', referrer: stats.referrer||''
        };
      }).sort((a,b)=>b.timestamp-a.timestamp).slice(0,200);
      render(rows, 'Loaded from local');
    }catch(e){ render([], 'Failed to read local'); }
  }

  async function loadRemote(){
    try{
      if(!window.VISITOR_API){ render([], 'No remote endpoint configured'); return; }
      // Expect the endpoint to support GET returning JSON array of rows matching render() fields
      const res = await fetch(window.VISITOR_API, { method:'GET', cache:'no-store' });
      // If using GAS with no-cors, this will fail to read; in that case, keep local only
      const rows = await res.json();
      if(Array.isArray(rows)) render(rows, 'Loaded from remote'); else render([], 'Remote format invalid');
    }catch(e){ render([], 'Unable to load remote'); }
  }

  function render(rows, note){
    const tbody = document.querySelector('#vis-table tbody');
    const agg = document.getElementById('vis-aggregate');
    agg.textContent = note + (rows.length? ` · ${rows.length} records` : '');
    tbody.innerHTML = rows.map(r=>{
      const cc = r.countryCode ? r.countryCode.toUpperCase() : '';
      return `<tr>
        <td style="padding:8px; border-bottom:1px solid #f1f3f5">${fmtTime(r.timestamp)}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f3f5">${maskIP(r.ip)}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f3f5">${cc} ${r.country||''}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f3f5">${r.region||''}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f3f5">${r.city||''}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f3f5">${r.referrer||''}</td>
      </tr>`;
    }).join('');
  }

  function exportLocal(){
    try{
      const raw = localStorage.getItem('advanced_visitor_stats');
      const stats = raw? JSON.parse(raw):{};
      const visitorsIdx = stats.visitors||{};
      const rows = Object.keys(visitorsIdx).map(k=>visitorsIdx[k]);
      const header = ['timestamp','ip','countryCode','country','region','city','timezone','userAgent','referrer'];
      const csv = [header.join(',')].concat(rows.map(v=>[
        v.lastVisit||'', v.ip||'', v.countryCode||'', v.country||'', v.region||'', v.city||'', v.timezone||'', (typeof navigator!=='undefined'?navigator.userAgent:''), (stats.referrer||'')
      ].map(x=>`"${String(x).replace(/"/g,'""')}"`).join(','))).join('\n');
      const blob = new Blob([csv], {type:'text/csv'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'visitors-local.csv';
      a.click();
    }catch(e){ /* noop */ }
  }

  document.getElementById('load-local').addEventListener('click', loadLocal);
  document.getElementById('load-remote').addEventListener('click', loadRemote);
  document.getElementById('export-local').addEventListener('click', exportLocal);

  // Auto-load local on first visit
  loadLocal();
})();
</script>
