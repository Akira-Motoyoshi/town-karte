"""Overture Maps places を areas.json の各地区について取得し data/raw/<id>.parquet に保存する。"""
import argparse, json, pathlib, time
import duckdb

ROOT = pathlib.Path(__file__).resolve().parent.parent

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--release", default="2026-09-23.1")
    ap.add_argument("--min-confidence", type=float, default=0.6)
    ap.add_argument("--force", action="store_true", help="既存ファイルがあっても再取得する")
    args = ap.parse_args()

    release_file = ROOT / "data" / "raw" / "release.txt"
    if release_file.exists():
        existing_release = release_file.read_text().strip()
        if existing_release != args.release and not args.force:
            print(f"既存データのリリースは {existing_release} です。指定された {args.release} と違うため止めます。再取得する場合は --force を付けてください。")
            raise SystemExit(1)

    con = duckdb.connect()
    con.sql("INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs;")
    # 空キーの secret で匿名アクセスにする（認証情報の探索で長時間止まるのを避ける）
    con.sql("CREATE SECRET (TYPE s3, KEY_ID '', SECRET '', REGION 'us-west-2');")
    src = f"s3://overturemaps-us-west-2/release/{args.release}/theme=places/type=place/*"

    areas = json.loads((ROOT / "areas.json").read_text())
    out_dir = ROOT / "data" / "raw"
    out_dir.mkdir(parents=True, exist_ok=True)
    fetched = False
    for a in areas:
        dest = out_dir / f"{a['id']}.parquet"
        if dest.exists() and not args.force:
            print(f"skip {a['id']} (exists)")
            continue
        xmin, ymin, xmax, ymax = a["bbox"]
        t = time.time()
        con.sql(f"""
            COPY (
              SELECT id, names.primary AS name, basic_category,
                     taxonomy.primary AS category, taxonomy.hierarchy AS hierarchy,
                     confidence, ST_X(geometry) AS lon, ST_Y(geometry) AS lat
              FROM read_parquet('{src}')
              WHERE bbox.xmin BETWEEN {xmin} AND {xmax}
                AND bbox.ymin BETWEEN {ymin} AND {ymax}
                AND confidence >= {args.min_confidence}
            ) TO '{dest}' (FORMAT parquet)
        """)
        fetched = True
        n = con.sql(f"SELECT count(*) FROM '{dest}'").fetchone()[0]
        print(f"{a['id']}: {n} 件 ({time.time() - t:.0f}s)")
    if fetched or not release_file.exists():
        release_file.write_text(args.release)

if __name__ == "__main__":
    main()
