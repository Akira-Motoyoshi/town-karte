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

  const profiles = {
    kyoto_tetsugaku: '琵琶湖疏水に沿う参道の地区。寺社と住宅が中心の、静かな一帯',
    osaka_namba: '道頓堀と千日前を抱える繁華街。大阪の中心で、駅と商業施設が集まる',
    paris_montmartre: 'パリ北部の丘の地区。サクレ・クール寺院があり、観光で訪れる人が多い',
    bangkok_oldtown: '王宮と寺院のある旧市街。チャオプラヤ川沿いに宿が集まる',
    nyc_soho: '鋳鉄建築が並ぶ商業地区。店舗やギャラリー、事務所が多い一帯',
  };

  const pitfalls = {
    kyoto_tetsugaku: '同じ名前の寺「安楽寺」が、少し離れた場所に2件あります。別の建物か、重なった登録かは、データだけでは決められません。',
    osaka_namba: '「飲食」3,168件の内訳は、和食店1,070件、バー494件が上位です。「飲食」と一括りにしても、中身の顔ぶれは地区で大きく違います。',
    paris_montmartre: '「宿泊」64件のうち、分類名がホテルなのは47件。残りはサービスアパートメントやB&Bなど、別の名前で登録されています。同じ種類でも、登録の名前はそろいません。',
    bangkok_oldtown: '分類が空欄のまま登録された施設が58件あります。数え漏れではなく、分類そのものの漏れです。',
    nyc_soho: '登録6,219件は、京都・哲学の道（190件）の約33倍です。街が33倍大きいわけではなく、登録の手厚さの差がそのまま出ています。',
  };

  const findings = {
    kyoto_tetsugaku: '宗教が8%、5地区でいちばん高い。寺社が集まる地区の姿が、そのまま数字に出ている',
    osaka_namba: '飲食が57%。酒類を出す店が666件。繁華街の性格がはっきり出る',
    paris_montmartre: '買い物が25%、5地区でいちばん高い割合。観光で訪れる人のための店が集まる',
    bangkok_oldtown: '宿泊が14%、ほかの地区（1〜4%）の3倍以上。寺院を巡る旅の宿の街',
    nyc_soho: '生活サービスが48%。士業やオフィス、不動産。住む街というより、事業所の街',
  };

  const storySteps = [
    {
      areaId: 'kyoto_tetsugaku',
      text: '5つの街を順に巡ります。最後に、データが間違っているように見える場所へ案内します。',
    },
    {
      areaId: 'kyoto_tetsugaku',
      text: '京都・哲学の道。登録は190件、いちばん少ない。少ないのに、宗教の割合は8%で、いちばん高い。件数と割合で、街の顔は変わります。',
    },
    {
      areaId: 'osaka_namba',
      text: '大阪・難波。登録は京都の約29倍、5,526件。飲食が57%を占めます。静かな参道とは、同じ国とは思えない差です。',
    },
    {
      areaId: 'paris_montmartre',
      text: 'パリ・モンマルトル。買い物が25%、5地区でいちばん高い割合です。難波の「食べる」に対して、ここは「買う」街。',
    },
    {
      areaId: 'bangkok_oldtown',
      text: 'バンコク・旧市街。宿泊が14%。ほかの地区は1〜4%で、宿がこれだけ目立つのは5地区でここだけです。寺院を巡る旅の拠点になっています。',
    },
    {
      areaId: 'nyc_soho',
      text: 'ニューヨーク・ソーホー。生活サービスが48%。飲食は12%しかありません。難波とほぼ真逆の構成です。',
    },
    {
      areaId: 'kyoto_tetsugaku',
      text: '最後は京都に戻ります。哲学の道の安楽寺。データの中では、同じ名前の寺が、少し離れた場所にもう1件あります。別の建物か、重なった登録か。データだけでは決められません。',
      shrine: true,
    },
    {
      areaId: 'kyoto_tetsugaku',
      text: '世界共通の分類は、街を比べる強い物差しです。でも物差し自体に偏りがある。両方見えるようにしたのが、この作品です。',
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

  const panelPadding = () => (window.innerWidth > 760
    ? { left: 402, top: 0, right: 0, bottom: 0 }
    : { left: 0, top: 0, right: 0, bottom: 0 });
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: first.center,
    zoom: 15,
    padding: panelPadding(),
  });
  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  window.addEventListener('resize', () => map.setPadding(panelPadding()));

  Chart.defaults.color = '#93A3B4';
  Chart.defaults.borderColor = 'rgba(233,238,243,0.08)';

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
  const storyDots = document.getElementById('storyDots');
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
  const storyOutro = document.getElementById('storyOutro');
  const storyToBias = document.getElementById('storyToBias');
  const quizProgress = document.getElementById('quizProgress');
  const biasBtn = document.getElementById('biasBtn');
  const biasBox = document.getElementById('biasBox');
  const biasContent = document.getElementById('biasContent');
  const biasEnd = document.getElementById('biasEnd');

  const mapReady = new Promise(resolve => {
    map.on('load', () => {
      // 細い水路（疏水など）が背景に埋もれないよう、水の線だけ濃く太くする
      (map.getStyle()?.layers || []).forEach(l => {
        if (l.type === 'line' && l.id.includes('waterway') && !l.id.includes('label')) {
          try {
            map.setPaintProperty(l.id, 'line-color', '#4A90D9');
            map.setPaintProperty(l.id, 'line-width', ['interpolate', ['linear'], ['zoom'], 13, 1.4, 20, 8]);
          } catch (_) { /* レイヤー構造が違う場合は既定のまま */ }
        }
      });
      map.addSource('places', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 45,
      });
      map.addLayer({
        id: 'clusters', type: 'circle', source: 'places',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': ['step', ['get', 'point_count'], 13, 100, 17, 1000, 21],
          'circle-color': '#141E29',
          'circle-stroke-color': '#FFB454', 'circle-stroke-width': 1.5,
          'circle-opacity': 0.92,
        },
      });
      map.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'places',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
        },
        paint: { 'text-color': '#E9EEF3' },
      });
      map.addLayer({
        id: 'places', type: 'circle', source: 'places',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2, 16, 5, 18, 8],
          'circle-color': ['match', ['get', 'group'], ...groupNames.flatMap(n => [n, colors[n]]), '#999'],
          'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 1.2,
        },
      });
      map.on('click', 'clusters', async e => {
        const feature = e.features[0];
        const center = feature.geometry.coordinates;
        let target = Math.min(map.getZoom() + 2, 18);
        try {
          const zoom = await map.getSource('places').getClusterExpansionZoom(feature.properties.cluster_id);
          if (typeof zoom === 'number') target = zoom;
        } catch (_) { /* 取得できなければ2段階ズームで代替 */ }
        map.easeTo({ center, zoom: target });
      });
      map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
      map.on('click', 'places', e => {
        popup?.remove();
        const p = e.features[0].properties;
        const g = selectedArea?.groups.find(x => x.name === p.group);
        const share = g ? `（登録施設全体の${(g.share * 100).toFixed(0)}%）` : '';
        popup = new maplibregl.Popup().setLngLat(e.lngLat)
          .setHTML(`<strong>${escapeHtml(p.name || '（名称なし）')}</strong><br>${escapeHtml(p.group)}${share}`)
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

  const segmentLabelPlugin = {
    id: 'segmentLabels',
    afterDatasetsDraw(chart) {
      try {
        const { ctx } = chart;
        chart.data.datasets.forEach((ds, di) => {
          const meta = chart.getDatasetMeta(di);
          meta.data.forEach((bar, i) => {
            const v = ds.data[i];
            if (!v || v < 7) return;
            const { x, y, base } = bar.getProps(['x', 'y', 'base'], true);
            const w = x - base;
            if (w < 30) return;
            const hex = colors[ds.label] || '#999999';
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            ctx.save();
            ctx.fillStyle = lum > 0.55 ? 'rgba(12,18,24,.9)' : 'rgba(255,255,255,.92)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${v.toFixed(0)}%`, base + w / 2, y);
            ctx.restore();
          });
        });
      } catch (_) { /* ラベル描画の失敗でグラフ自体を止めない */ }
    },
  };

  function drawCompareChart() {
    chart?.destroy();
    clearChartHighlight();
    ctx.setAttribute('role', 'img');
    ctx.setAttribute('aria-label', '5地区の施設の構成比の比較');
    document.getElementById('chartWrap').style.height = '340px';
    chart = new Chart(ctx, {
      type: 'bar',
      plugins: [segmentLabelPlugin],
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
    const created = chart;
    requestAnimationFrame(() => { if (chart === created) chart?.resize(); });
  }

  function setActive(btn) {
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#areaButtons button').forEach(t =>
      t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false'));
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
    const sorted = [...area.groups].sort((a, b) => b.count - a.count);
    const top5 = sorted.slice(0, 5);
    const restShare = sorted.slice(5).reduce((s, g) => s + g.share, 0);
    const barRow = g => `
        <div class="bar-row">
          <span class="bar-name">${escapeHtml(g.name)}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${(g.share * 100).toFixed(1)}%;background:${colors[g.name] || '#64748B'}"></span></span>
          <span class="bar-val">${(g.share * 100).toFixed(0)}%・${g.count.toLocaleString()}件</span>
        </div>`;
    summary.innerHTML = `
      <div class="karte">
        <strong>${escapeHtml(area.name)}のカルテ</strong>
        <p class="karte-profile">${escapeHtml(profiles[area.id] || '')}</p>
        <div class="karte-row"><span>登録施設</span><span>${area.total.toLocaleString()}件</span></div>
        <p class="karte-note">件数は登録の手厚さで大きく変わります。比べるのは割合です。</p>
        <div class="karte-bars">
          ${top5.map(barRow).join('')}
          ${restShare >= 0.005 ? `<div class="bar-row"><span class="bar-name">そのほか</span><span class="bar-track"><span class="bar-fill" style="width:${(restShare * 100).toFixed(1)}%;background:#475569"></span></span><span class="bar-val">${(restShare * 100).toFixed(0)}%</span></div>` : ''}
        </div>
        <p class="karte-finding">所見：${escapeHtml(findings[area.id] || '')}</p>
        <div class="karte-pitfall">
          <span class="pitfall-label">この数字の落とし穴</span>
          <p>${escapeHtml(pitfalls[area.id] || '')}</p>
          ${area.id === 'kyoto_tetsugaku' ? '<button class="karte-shrine" type="button">安楽寺の場所を見る</button>' : ''}
          <button class="karte-bias-link" type="button">物差しの偏りをもっと見る</button>
        </div>
      </div>`;
    const shrineBtn = summary.querySelector('.karte-shrine');
    if (shrineBtn) shrineBtn.onclick = () => selectArea(area, area._btn, { shrine: true });
    const biasLink = summary.querySelector('.karte-bias-link');
    if (biasLink) biasLink.onclick = () => document.getElementById('biasBtn').click();

    document.getElementById('chartWrap').style.display = 'none';
    document.getElementById('legend').style.display = 'none';
    mapLoading.hidden = false;
    map.flyTo({
      center: options.shrine ? [135.79634, 35.0215] : area.center,
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
          return p.name === '安楽寺';
        });
        const p = feature?.properties || {
          name: '安楽寺',
          group: '宗教',
        };
        const coords = feature?.geometry?.coordinates || [135.79659, 35.02159];
        const g2 = area.groups.find(x => x.name === p.group);
        const share2 = g2 ? `（登録施設全体の${(g2.share * 100).toFixed(0)}%）` : '';
        popup = new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(`<strong>${escapeHtml(p.name || '（名称なし）')}</strong><br>${escapeHtml(p.group)}${share2}`)
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
    storyDots.replaceChildren(...storySteps.map((_, index) => {
      const dot = document.createElement('span');
      if (index === storyIndex) dot.classList.add('on');
      return dot;
    }));
    storyBack.disabled = storyIndex === 0;
    storyNext.disabled = storyIndex === storySteps.length - 1;
    storyOutro.hidden = storyIndex !== storySteps.length - 1;
    selectArea(area, area._btn, { shrine: step.shrine });
  }

  function showQuizQuestion() {
    const question = quizQuestions[quizIndex];
    quizAnswered = false;
    quizProgress.textContent = `${quizIndex + 1}問目（全${quizQuestions.length}問）`;
    quizQuestion.textContent = question.question;
    quizResult.textContent = '';
    quizNext.hidden = true;
    quizChoices.replaceChildren();

    question.choices.forEach(choice => {
      const button = document.createElement('button');
      button.textContent = choice;
      button.dataset.choice = choice;
      button.onclick = () => answerQuiz(choice, button);
      quizChoices.appendChild(button);
    });
  }

  function answerQuiz(choice, selectedButton) {
    if (quizAnswered || quizBox.hidden) return;
    quizAnswered = true;
    const question = quizQuestions[quizIndex];
    const correct = choice === question.answer;
    if (correct) quizScore++;

    selectedButton.classList.add(correct ? 'correct' : 'wrong');
    quizChoices.querySelectorAll('button').forEach(button => {
      if (button.dataset.choice === question.answer) button.classList.add('correct');
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
      <p>同じ物差しで測っても、データの集まり方には偏りがある。この作品では、偏りの方も隠さず置いておく。</p>
      <h3>登録数の偏り</h3>
      <p>登録施設は、哲学の道の190件からソーホーの6,219件まで、約33倍の開きがある。件数の多さは街の規模だけでは決まらない。地図データへの登録の手厚さも映している。だから比べるときは割合（%）を使う。</p>
      <h3>分類の偏り（実例）</h3>
      <p>世界共通の分類は、日本の施設の種類分けと合わないことがある。登録のされ方も一様ではない。哲学の道では、同じ名前の寺「安楽寺」が、少し離れた場所に2件ある。別の建物か、重なった登録かは、データだけでは決められない。名前の表記も、日本語と英語が混ざっている。</p>
      <button id="biasShrine">安楽寺の場所を見る</button>
      <h3>抽出の条件</h3>
      <p>施設が地区の四角形に入るかは、施設の範囲の左下の角で判定している。使うのは信頼度0.6以上。分類は Overture Maps の世界共通の分類表に沿い、例外の対応づけは制作記に書いた。</p>
      <p>物差しをそろえるのは強力だ。ただ、物差し自体の偏りも一緒についてくる。両方を見て街を読むのが、この作品の立場です。</p>
      <p>作り方と検証の記録は<a href="article/">制作記</a>にまとめています。</p>`;

    document.getElementById('biasShrine').onclick = () => {
      const area = stats.areas.find(a => a.id === 'kyoto_tetsugaku');
      selectArea(area, area._btn, { shrine: true });
    };
  }

  const tabLabels = {
    kyoto_tetsugaku: '哲学の道',
    osaka_namba: '難波',
    paris_montmartre: 'モンマルトル',
    bangkok_oldtown: 'バンコク旧市街',
    nyc_soho: 'ソーホー',
  };

  stats.areas.forEach(area => {
    const b = document.createElement('button');
    const name = document.createElement('span');
    name.textContent = tabLabels[area.id] || area.name;
    b.append(name);
    b.title = area.name;
    b.setAttribute('role', 'tab');
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
      '割合で比べてください。件数は登録の手厚さで変わるので、比べる対象ではありません。<br>' +
      stats.areas.map(a => `${a.name} ${a.total.toLocaleString()} 件`).join('<br>') +
      `<br>地図は${selectedArea.name}の施設を表示しています`;
    document.getElementById('chartWrap').style.display = '';
    document.getElementById('legend').style.display = '';
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

  storyToBias.onclick = () => {
    endStory();
    biasBtn.click();
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
