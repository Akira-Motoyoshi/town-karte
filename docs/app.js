(async () => {
  const [stats, places] = await Promise.all([
    fetch('data/stats.json').then(r => r.json()),
    fetch('data/places.geojson').then(r => r.json()),
  ]);
  const colors = Object.fromEntries(stats.groups.map(g => [g.name, g.color]));
  const groupNames = stats.groups.map(g => g.name);
  const first = stats.areas[0];

  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: first.center,
    zoom: 15,
  });
  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  let chart;
  const ctx = document.getElementById('chart');

  function drawAreaChart(area) {
    chart?.destroy();
    document.getElementById('chartWrap').style.height = '300px';
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: groupNames,
        datasets: [{
          data: area.groups.map(g => g.share * 100),
          backgroundColor: groupNames.map(n => colors[n]),
          counts: area.groups.map(g => g.count),
        }],
      },
      options: {
        indexAxis: 'y', maintainAspectRatio: false, animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => `${c.raw.toFixed(1)}%（${c.dataset.counts[c.dataIndex]} 件）` } },
        },
        scales: { x: { min: 0, ticks: { callback: v => v + '%' } } },
      },
    });
  }

  function drawCompareChart() {
    chart?.destroy();
    document.getElementById('chartWrap').style.height = '340px';
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: stats.areas.map(a => a.name),
        datasets: groupNames.map((n, i) => ({
          label: n,
          data: stats.areas.map(a => a.groups[i].share * 100),
          backgroundColor: colors[n],
        })),
      },
      options: {
        indexAxis: 'y', maintainAspectRatio: false, animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.raw.toFixed(1)}%` } },
        },
        scales: {
          x: { stacked: true, min: 0, max: 100, ticks: { callback: v => v + '%' } },
          y: { stacked: true },
        },
      },
    });
  }

  const buttons = document.getElementById('areaButtons');
  const compareBtn = document.getElementById('compareBtn');
  const summary = document.getElementById('summary');

  function setActive(btn) {
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function selectArea(area, btn) {
    setActive(btn);
    const top = [...area.groups].sort((a, b) => b.count - a.count)[0];
    summary.innerHTML = `<strong>${area.name}</strong><br>総件数 ${area.total.toLocaleString()} 件 ・ 最多は「${top.name}」${(top.share * 100).toFixed(0)}%`;
    drawAreaChart(area);
    if (map.getLayer('places')) map.setFilter('places', ['==', ['get', 'area'], area.id]);
    map.flyTo({ center: area.center, zoom: 15 });
  }

  stats.areas.forEach((area, i) => {
    const b = document.createElement('button');
    b.textContent = area.name;
    b.onclick = () => selectArea(area, b);
    buttons.appendChild(b);
    if (i === 0) area._btn = b;
  });

  compareBtn.onclick = () => {
    setActive(compareBtn);
    summary.innerHTML = '<strong>全地区の比較</strong><br>' +
      stats.areas.map(a => `${a.name} ${a.total.toLocaleString()} 件`).join('<br>');
    drawCompareChart();
    if (map.getLayer('places')) map.setFilter('places', null);
  };

  document.getElementById('legend').innerHTML = stats.groups
    .map(g => `<li><span style="background:${g.color}"></span>${g.name}</li>`).join('');
  document.getElementById('attribution').innerHTML =
    `データ: © Overture Maps Foundation, © OpenStreetMap contributors（Overture リリース ${stats.release}、places は CDLA-Permissive-2.0）<br>` +
    `背景地図: <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © OpenMapTiles © OpenStreetMap contributors`;

  map.on('load', () => {
    map.addSource('places', { type: 'geojson', data: places });
    map.addLayer({
      id: 'places', type: 'circle', source: 'places',
      filter: ['==', ['get', 'area'], first.id],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2, 16, 5, 18, 8],
        'circle-color': ['match', ['get', 'group'], ...groupNames.flatMap(n => [n, colors[n]]), '#999'],
        'circle-stroke-color': '#fff', 'circle-stroke-width': 1,
      },
    });
    map.on('click', 'places', e => {
      const p = e.features[0].properties;
      new maplibregl.Popup().setLngLat(e.lngLat)
        .setHTML(`<strong>${escapeHtml(p.name || '（名称なし）')}</strong><br>${p.group} / ${escapeHtml(p.category)}`)
        .addTo(map);
    });
    map.on('mouseenter', 'places', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'places', () => map.getCanvas().style.cursor = '');
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  selectArea(first, first._btn);
})();
