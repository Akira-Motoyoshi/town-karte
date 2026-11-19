"""data/raw の取得結果と data/category_map.json から docs/data の公開用ファイルを作る。"""
import json, pathlib
import duckdb

ROOT = pathlib.Path(__file__).resolve().parent.parent

def to_group(hierarchy, cmap):
    if not hierarchy:
        return cmap["default"]
    if len(hierarchy) > 1:
        g = cmap["level2"].get(f"{hierarchy[0]}/{hierarchy[1]}")
        if g:
            return g
    return cmap["level1"].get(hierarchy[0], cmap["default"])

def main():
    cmap = json.loads((ROOT / "data/category_map.json").read_text())
    areas = json.loads((ROOT / "areas.json").read_text())
    release = (ROOT / "data/raw/release.txt").read_text().strip()
    group_names = [g["name"] for g in cmap["groups"]]
    con = duckdb.connect()

    out = ROOT / "docs/data"
    places_out = out / "places"
    places_out.mkdir(parents=True, exist_ok=True)

    stats = []
    for a in areas:
        rows = con.sql(f"""SELECT id, name, category, hierarchy, lon, lat
                           FROM '{ROOT}/data/raw/{a['id']}.parquet'""").fetchall()
        counts = dict.fromkeys(group_names, 0)
        features = []
        for pid, name, category, hierarchy, lon, lat in rows:
            g = to_group(hierarchy, cmap)
            counts[g] += 1
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
                "properties": {"id": pid, "area": a["id"], "name": name or "", "category": category or "", "group": g},
            })
        (places_out / f"{a['id']}.geojson").write_text(
            json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":")))
        total = len(rows)
        stats.append({
            "id": a["id"], "name": a["name"], "center": a["center"], "bbox": a["bbox"], "total": total,
            "groups": [{"name": g, "count": counts[g], "share": round(counts[g] / total, 4) if total else 0}
                       for g in group_names],
        })

    (out / "stats.json").write_text(json.dumps(
        {"release": release, "groups": cmap["groups"], "areas": stats}, ensure_ascii=False, indent=1))

    for s in stats:
        other = next(g for g in s["groups"] if g["name"] == "その他")
        print(f"{s['id']:18} 総数 {s['total']:5}  その他 {other['share']:.1%}")

if __name__ == "__main__":
    main()
