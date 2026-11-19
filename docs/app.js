(async () => {
  const summary = document.getElementById('summary');
  const mapLoading = document.getElementById('mapLoading');
  const errorMessage = 'データの読み込みに失敗しました。通信環境を確認して、ページを再読み込みしてください。';

  function showError() {
    summary.classList.add('error');
    summary.textContent = errorMessage;
    mapLoading.hidden = true;
  }

  let stats;
  try {
    const response = await fetch('data/stats.json');
    if (!response.ok) throw new Error('stats.json の読み込みに失敗しました');
    stats = await response.json();
  } catch (error) {
    showError();
    return;
  }

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
  let popup;
  let selection = 0;
  let selectedArea = first;
  let comparing = false;
  const placesCache = {};
  const ctx = document.getElementById('chart');
  const mapReady = new Promise(resolve => {
    map.on('load', () => {
      map.addSource('places', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'places', type: 'circle', source: 'places',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2, 16, 5, 18, 8],
          'circle-color': ['match', ['get', 'group'], ...groupNames.flatMap(n => [n, colors[n]]), '#999'],
          'circle-stroke-color': '#fff', 'circle-stroke-width': 1,
        },
      });
      map.on('click', 'places', e => {
        popup?.remove();
        const p = e.features[0].properties;
        popup = new maplibregl.Popup().setLngLat(e.lngLat)
          .setHTML(`<strong>${escapeHtml(p.name || '（名称なし）')}</strong><br>${p.group} / ${escapeHtml(p.category)}`)
          .addTo(map);
      });
      map.on('mouseenter', 'places', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'places', () => map.getCanvas().style.cursor = '');
      resolve();
    });
  });

  function drawAreaChart(area) {
    chart?.destroy();
    const top = [...area.groups].sort((a, b) => b.count - a.count)[0];
    ctx.setAttribute('role', 'img');
    ctx.setAttribute('aria-label', `${area.name}の施設の構成比。総数${area.total.toLocaleString()}件、最多は${top.name}${(top.share * 100).toFixed(0)}%`);
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
    ctx.setAttribute('role', 'img');
    ctx.setAttribute('aria-label', '5地区の施設の構成比の比較');
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

  function setActive(btn) {
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  async function loadPlaces(area) {
    if (placesCache[area.id]) return placesCache[area.id];
    const response = await fetch(`data/places/${area.id}.geojson`);
    if (!response.ok) throw new Error('地区データの読み込みに失敗しました');
    const places = await response.json();
    placesCache[area.id] = places;
    return places;
  }

  async function selectArea(area, btn) {
    popup?.remove();
    const currentSelection = ++selection;
    selectedArea = area;
    comparing = false;
    setActive(btn);
    summary.classList.remove('error');
    const top = [...area.groups].sort((a, b) => b.count - a.count)[0];
    summary.innerHTML = `<strong>${area.name}</strong><br>総件数 ${area.total.toLocaleString()} 件 ・ 最多は「${top.name}」${(top.share * 100).toFixed(0)}%`;
    drawAreaChart(area);
    mapLoading.hidden = false;
    map.flyTo({ center: area.center, zoom: 15, duration: 1200 });

    try {
      const places = await loadPlaces(area);
      await mapReady;
      if (currentSelection !== selection) return;
      map.getSource('places').setData(places);
      map.once('idle', () => {
        if (currentSelection === selection) mapLoading.hidden = true;
      });
    } catch (error) {
      if (currentSelection === selection) showError();
    }
  }

  stats.areas.forEach((area, i) => {
    const b = document.createElement('button');
    b.textContent = area.name;
    b.onclick = () => selectArea(area, b);
    buttons.appendChild(b);
    if (i === 0) area._btn = b;
  });

  compareBtn.onclick = () => {
    popup?.remove();
    comparing = true;
    setActive(compareBtn);
    summary.classList.remove('error');
    summary.innerHTML = '<strong>全地区の比較</strong><br>' +
      stats.areas.map(a => `${a.name} ${a.total.toLocaleString()} 件`).join('<br>') +
      `<br>地図は${selectedArea.name}の施設を表示しています`;
    drawCompareChart();
  };

  document.getElementById('legend').innerHTML = stats.groups
    .map(g => `<li><span style="background:${g.color}"></span>${g.name}</li>`).join('');
  document.getElementById('attribution').innerHTML =
    `データ: © Overture Maps Foundation, © OpenStreetMap contributors（Overture リリース ${stats.release}、places は CDLA-Permissive-2.0）<br>` +
    `背景地図: <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © OpenMapTiles © OpenStreetMap contributors`;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  selectArea(first, first._btn);
})();
