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

  const findings = {
    kyoto_tetsugaku: '宗教が8%で、5地区の中で最も多い。寺社の集まる地区の姿が、データにも表れている',
    osaka_namba: '飲食が57%を占める。酒類を出す店が666件あり、繁華街の性格がはっきり出ている',
    paris_montmartre: '買い物が25%で、5地区の中で最も高い。観光で訪れる人のための店が集まっている',
    bangkok_oldtown: '宿泊が14%で、他の地区（1〜4%）の3倍以上。寺院を巡る旅の宿が集まっている',
    nyc_soho: '生活サービスが48%。士業やオフィス、不動産など、事業所の顔が強い',
  };

  const storySteps = [
    {
      areaId: 'kyoto_tetsugaku',
      text: '同じ1km四方を、同じ物差しで測ります。5つの街を順に巡り、最後に1つの気づきに出会います。',
    },
    {
      areaId: 'kyoto_tetsugaku',
      text: '京都・哲学の道。登録施設は190件と、5地区でいちばん少ない。でも宗教は8%で、いちばん多い。寺社の街の姿です。',
    },
    {
      areaId: 'osaka_namba',
      text: '大阪・難波。飲食が57%。酒類を出す店だけで666件あります。食べることと飲むことに全振りした街です。',
    },
    {
      areaId: 'paris_montmartre',
      text: 'パリ・モンマルトル。買い物が25%で、5地区の中で最も高い。観光で訪れる人のための店が集まっています。',
    },
    {
      areaId: 'bangkok_oldtown',
      text: 'バンコク・旧市街。宿泊が14%。他の地区の3倍以上です。寺院を巡る旅の宿が集まる街です。',
    },
    {
      areaId: 'nyc_soho',
      text: 'ニューヨーク・ソーホー。生活サービスが48%。士業やオフィス、不動産――店の街というより、事業所の街です。',
    },
    {
      areaId: 'kyoto_tetsugaku',
      text: '最後に、京都へ戻ります。哲学の道にある大豊神社。日本の神社です。でもデータの中では『キリスト教の礼拝施設』に分類されていました。',
      shrine: true,
    },
    {
      areaId: 'kyoto_tetsugaku',
      text: '世界共通の分類は、街を比べる強い物差しです。でも、その物差し自体にも偏りがあります。両方見えることが、この作品の狙いです。',
    },
  ];

  const quizAreas = [
    '京都・哲学の道',
    '大阪・難波',
    'パリ・モンマルトル',
    'バンコク・旧市街',
    'ニューヨーク・ソーホー',
  ];

  const quizQuestions = [
    {
      question: '大阪・難波で、いちばん多いのはどの分類でしょう？',
      choices: ['飲食', '買い物', '宿泊', '生活サービス'],
      answer: '飲食',
      result: '正解は飲食、57%です。2位の買い物（15%）を大きく引き離しています。',
      areaId: 'osaka_namba',
    },
    {
      question: '宿泊の割合が最も高いのは、どの地区でしょう？',
      choices: quizAreas,
      answer: 'バンコク・旧市街',
      result: '正解はバンコク・旧市街、14%です。他の地区は1〜4%で、寺院を巡る旅の宿が集まる地区です。',
      areaId: 'bangkok_oldtown',
    },
    {
      question: '登録施設の数が最も少ないのは、どの地区でしょう？',
      choices: quizAreas,
      answer: '京都・哲学の道',
      result: '正解は京都・哲学の道、190件です。最も多いソーホー（6,219件）の約33分の1。登録のされ方にも地区差があります。',
      areaId: 'kyoto_tetsugaku',
    },
  ];

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
  let storyActive = false;
  let storyIndex = 0;
  let storyVersion = 0;
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  let pinnedGroup = null;
  let hoveredGroup = null;
  const placesCache = {};
  const ctx = document.getElementById('chart');
  const buttons = document.getElementById('areaButtons');
  const compareBtn = document.getElementById('compareBtn');
  const storyBtn = document.getElementById('storyBtn');
  const storyBox = document.getElementById('storyBox');
  const storyText = document.getElementById('storyText');
  const storyProgress = document.getElementById('storyProgress');
  const storyBack = document.getElementById('storyBack');
  const storyNext = document.getElementById('storyNext');
  const storyEnd = document.getElementById('storyEnd');
  const quizBtn = document.getElementById('quizBtn');
  const quizBox = document.getElementById('quizBox');
  const quizQuestion = document.getElementById('quizQuestion');
  const quizChoices = document.getElementById('quizChoices');
  const quizResult = document.getElementById('quizResult');
  const quizNext = document.getElementById('quizNext');
  const quizEnd = document.getElementById('quizEnd');
  const biasBtn = document.getElementById('biasBtn');
  const biasBox = document.getElementById('biasBox');
  const biasContent = document.getElementById('biasContent');
  const biasEnd = document.getElementById('biasEnd');

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
          .setHTML(`<strong>${escapeHtml(p.name || '（名称なし）')}</strong><br>${escapeHtml(p.group)} / ${escapeHtml(p.category)}`)
          .addTo(map);
      });
      map.on('mouseenter', 'places', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'places', () => map.getCanvas().style.cursor = '');
      updateMapHighlight();
      resolve();
    });
  });

  function updateMapHighlight() {
    if (!map.getLayer('places')) return;
    const group = hoveredGroup || pinnedGroup;
    const opacity = group
      ? ['case', ['==', ['get', 'group'], group], 1, 0.08]
      : 1;
    map.setPaintProperty('places', 'circle-opacity', opacity);
    map.setPaintProperty('places', 'circle-stroke-opacity', opacity);
  }

  ctx.addEventListener('mouseleave', () => {
    hoveredGroup = null;
    updateMapHighlight();
  });

  function clearChartHighlight() {
    pinnedGroup = null;
    hoveredGroup = null;
    updateMapHighlight();
  }

  function chartInteraction(isCompare) {
    function groupAt(elements, chartInstance) {
      if (!elements.length) return null;
      const element = elements[0];
      return isCompare
        ? chartInstance.data.datasets[element.datasetIndex].label
        : chartInstance.data.labels[element.index];
    }

    return {
      onHover: (event, elements, chartInstance) => {
        hoveredGroup = groupAt(elements, chartInstance);
        updateMapHighlight();
      },
      onClick: (event, elements, chartInstance) => {
        const group = groupAt(elements, chartInstance);
        if (!group) return;
        pinnedGroup = pinnedGroup === group ? null : group;
        hoveredGroup = null;
        updateMapHighlight();
      },
    };
  }

  function drawAreaChart(area) {
    chart?.destroy();
    clearChartHighlight();
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
        indexAxis: 'y', maintainAspectRatio: false, animation: false, interaction: { mode: 'nearest', intersect: true },
        ...chartInteraction(false),
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
    clearChartHighlight();
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
        indexAxis: 'y', maintainAspectRatio: false, animation: false, interaction: { mode: 'nearest', intersect: true },
        ...chartInteraction(true),
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

  async function selectArea(area, btn, options = {}) {
    popup?.remove();
    const currentSelection = ++selection;
    selectedArea = area;
    comparing = false;
    setActive(btn);
    summary.classList.remove('error');
    const top = [...area.groups].sort((a, b) => b.count - a.count)[0];
    summary.innerHTML = `
      <div class="karte">
        <strong>${escapeHtml(area.name)}のカルテ</strong>
        <div class="karte-row"><span>登録施設</span><span>${area.total.toLocaleString()}件</span></div>
        <div class="karte-row"><span>最多の分類</span><span>${escapeHtml(top.name)} ${(top.share * 100).toFixed(0)}%</span></div>
        <p class="karte-finding">所見：${escapeHtml(findings[area.id] || '')}</p>
      </div>`;
    drawAreaChart(area);
    mapLoading.hidden = false;
    map.flyTo({
      center: options.shrine ? [135.794361, 35.018761] : area.center,
      zoom: options.shrine ? 17 : 15,
      duration: 1200,
    });

    try {
      const places = await loadPlaces(area);
      await mapReady;
      if (currentSelection !== selection) return;
      map.getSource('places').setData(places);

      if (options.shrine) {
        const feature = places.features.find(f => {
          const p = f.properties || {};
          return p.name === '大豊神社 御旅所';
        });
        const p = feature?.properties || {
          name: '大豊神社 御旅所',
          group: '宗教',
          category: 'christian_place_of_worship',
        };
        popup = new maplibregl.Popup()
          .setLngLat([135.794361, 35.018761])
          .setHTML(`<strong>${escapeHtml(p.name || '（名称なし）')}</strong><br>${escapeHtml(p.group)} / ${escapeHtml(p.category)}`)
          .addTo(map);
      }

      map.once('idle', () => {
        if (currentSelection === selection) mapLoading.hidden = true;
      });
    } catch (error) {
      if (currentSelection === selection) showError();
    }
  }

  function endStory() {
    storyActive = false;
    storyVersion++;
    storyBox.hidden = true;
  }

  function endQuiz() {
    quizBox.hidden = true;
  }

  function endBias() {
    biasBox.hidden = true;
  }

  function showStoryStep() {
    const step = storySteps[storyIndex];
    const area = stats.areas.find(a => a.id === step.areaId);
    storyVersion++;
    storyText.textContent = step.text;
    storyProgress.textContent = `${storyIndex + 1}/${storySteps.length}`;
    storyBack.disabled = storyIndex === 0;
    storyNext.disabled = storyIndex === storySteps.length - 1;
    selectArea(area, area._btn, { shrine: step.shrine });
  }

  function showQuizQuestion() {
    const question = quizQuestions[quizIndex];
    quizAnswered = false;
    quizQuestion.textContent = question.question;
    quizResult.textContent = '';
    quizNext.hidden = true;
    quizChoices.replaceChildren();

    question.choices.forEach(choice => {
      const button = document.createElement('button');
      button.textContent = choice;
      button.onclick = () => answerQuiz(choice);
      quizChoices.appendChild(button);
    });
  }

  function answerQuiz(choice) {
    if (quizAnswered || quizBox.hidden) return;
    quizAnswered = true;
    const question = quizQuestions[quizIndex];
    const correct = choice === question.answer;
    if (correct) quizScore++;

    quizChoices.querySelectorAll('button').forEach(button => {
      button.disabled = true;
    });

    const area = stats.areas.find(a => a.id === question.areaId);
    selectArea(area, area._btn);

    if (quizIndex === quizQuestions.length - 1) {
      quizResult.textContent = `${correct ? 'あたり' : 'はずれ'}。${question.result} 3問中${quizScore}問正解でした。予想と比べると、街の姿はどう見えましたか。`;
      quizNext.hidden = true;
    } else {
      quizResult.textContent = `${correct ? 'あたり' : 'はずれ'}。${question.result} 現在${quizScore}問正解です。`;
      quizNext.hidden = false;
    }
  }

  function buildBiasPanel() {
    biasContent.innerHTML = `
      <h2>データの見方：物差しの偏り</h2>
      <p>同じ物差しで測っても、データの集まり方には偏りがあります。この作品では、その偏りも隠さずに見せます。</p>
      <h3>登録数の偏り</h3>
      <p>登録施設の数は、哲学の道190件からソーホー6,219件まで、約33倍の開きがあります。件数の多さは街の規模そのものではなく、地図データへの登録の手厚さも映しています。だから割合（%）で比べています。</p>
      <h3>分類の偏り（実例）</h3>
      <p>世界共通の分類は、日本の施設に合わないことがあります。哲学の道の「宗教」15件のうち、少なくとも3件（大豊神社 御旅所、Otoyo Shrine、霊鑑寺）は、神社や寺院なのに「キリスト教の礼拝施設（christian_place_of_worship）」に分類されていました。</p>
      <button id="biasShrine">大豊神社の場所を見る</button>
      <h3>抽出の条件</h3>
      <p>施設が地区の四角形に入るかは、施設の範囲の左下の角で判定しています。信頼度0.6以上の施設だけを使っています。分類は Overture Maps の世界共通の分類表によるもので、例外の対応づけは制作記に書きました。</p>
      <p>同じ物差しは強力です。でも、物差し自体の偏りも一緒に見えます。両方を見て街を読むのが、この作品の立場です。</p>`;

    document.getElementById('biasShrine').onclick = () => {
      const area = stats.areas.find(a => a.id === 'kyoto_tetsugaku');
      selectArea(area, area._btn, { shrine: true });
    };
  }

  stats.areas.forEach(area => {
    const b = document.createElement('button');
    b.textContent = area.name;
    b.onclick = () => {
      endStory();
      selectArea(area, b);
    };
    buttons.appendChild(b);
    area._btn = b;
  });

  compareBtn.onclick = () => {
    endStory();
    popup?.remove();
    comparing = true;
    setActive(compareBtn);
    summary.classList.remove('error');
    summary.innerHTML = '<strong>全地区の比較</strong><br>' +
      stats.areas.map(a => `${a.name} ${a.total.toLocaleString()} 件`).join('<br>') +
      `<br>地図は${selectedArea.name}の施設を表示しています`;
    drawCompareChart();
  };

  storyBtn.onclick = () => {
    endQuiz();
    endBias();
    storyActive = true;
    storyIndex = 0;
    storyBox.hidden = false;
    showStoryStep();
  };

  storyBack.onclick = () => {
    if (!storyActive || storyIndex === 0) return;
    storyIndex--;
    showStoryStep();
  };

  storyNext.onclick = () => {
    if (!storyActive || storyIndex === storySteps.length - 1) return;
    storyIndex++;
    showStoryStep();
  };

  storyEnd.onclick = () => {
    endStory();
    selectArea(selectedArea, selectedArea._btn);
    map.flyTo({ center: selectedArea.center, zoom: 15, duration: 800 });
  };

  quizBtn.onclick = () => {
    endStory();
    endBias();
    quizIndex = 0;
    quizScore = 0;
    quizBox.hidden = false;
    showQuizQuestion();
  };

  quizNext.onclick = () => {
    if (!quizAnswered || quizIndex >= quizQuestions.length - 1) return;
    quizIndex++;
    showQuizQuestion();
  };

  quizEnd.onclick = endQuiz;

  biasBtn.onclick = () => {
    endStory();
    endQuiz();
    buildBiasPanel();
    biasBox.hidden = false;
  };

  biasEnd.onclick = endBias;

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
