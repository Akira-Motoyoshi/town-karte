# 世界の街カルテ比較

Overture Maps の places データを使い、世界 5 地区（各約 1km 四方）の店・施設の構成を同じ物差しで比べる Web 地図です。

- 地図：https://akira-motoyoshi.github.io/town-karte/
- 制作記：https://akira-motoyoshi.github.io/town-karte/article/

![スクリーンショット](docs/screenshot.jpg)

## なぜ Overture Maps か

Overture Maps は世界共通のスキーマとカテゴリ体系（`taxonomy.hierarchy`）を持つため、国が違っても同じ SQL・同じ分類で比較できます。データは S3 上の GeoParquet として公開されており、DuckDB から登録なし・無料で必要な範囲だけ読み出せます。

## 対象地区

| id | 地区 | 中心（緯度, 経度） |
| --- | --- | --- |
| kyoto_tetsugaku | 京都・哲学の道 | 35.0215, 135.7955 |
| osaka_namba | 大阪・難波 | 34.6655, 135.5010 |
| paris_montmartre | パリ・モンマルトル | 48.8867, 2.3431 |
| bangkok_oldtown | バンコク・旧市街 | 13.7563, 100.4989 |
| nyc_soho | ニューヨーク・ソーホー | 40.7233, -74.0030 |

範囲は `areas.json` にあります。

## 分類の方法

`taxonomy.hierarchy` の 1 段目（一部は 2 段目）を 8 つの大分類にまとめています（`data/category_map.json`）。

- 飲食 / 買い物 / 宿泊 / 宗教 / 文化・観光 / 公共・教育・医療 / 生活サービス / その他
- 「宗教」は `cultural_and_historic` のうち `place_of_worship` と `religious_organization`
- 「生活サービス」には `services_and_business`（士業、オフィス、不動産など）も含みます

## 再現手順

```bash
python3 -m venv .venv
.venv/bin/pip install duckdb
.venv/bin/python scripts/fetch.py --release 2026-09-23.1   # S3 から取得 → data/raw/
.venv/bin/python scripts/build.py                          # 集計 → docs/data/
python3 -m http.server 8000 --directory docs               # http://localhost:8000
```

古いリリースは S3 から削除されるため、取得済みデータ（`data/raw/`）もリポジトリに含めています。

## 使用したデータとライセンス

- **Overture Maps Foundation** places テーマ、リリース `2026-09-23.1`（CDLA-Permissive-2.0）。© Overture Maps Foundation, © OpenStreetMap contributors。各レコードの出典は `sources` 列を参照してください。
- 背景地図：[OpenFreeMap](https://openfreemap.org)（© OpenMapTiles © OpenStreetMap contributors）
- ライブラリ：MapLibre GL JS 4.7.1、Chart.js 4.4.1、DuckDB

Overture の places は OSM とライセンスが異なるため、このデータを OSM へ転記しないでください。

## 構成

```
areas.json              対象地区
scripts/fetch.py        Overture から取得
scripts/build.py        大分類に集計し公開用ファイルを出力
data/category_map.json  分類の対応表と色
data/raw/               取得結果（parquet）
docs/                   公開用（GitHub Pages）
docs/lt_outline.md      考察と LT 構成案
```
