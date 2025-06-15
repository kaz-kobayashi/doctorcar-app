"""
pip install requests folium geopandas shapely pyproj
"""

import requests, json, folium, geopandas as gpd
from shapely.geometry import shape

# -----------------------------------------------------------------------------
# 1. 認証（API0）— アクセストークンを取得
# -----------------------------------------------------------------------------
AUTH_URL = "https://pf.drm.jp/api/0/auth"        # 本番環境
LOGIN_ID = "your_login_id"                       # ユーザー登録時に付与
PASSWORD = "your_password"                       # 同上

auth_resp = requests.post(
    AUTH_URL,
    json={"login_id": LOGIN_ID, "password": PASSWORD},
    timeout=15,
)
auth_resp.raise_for_status()
ACCESS_TOKEN = auth_resp.json()["access_token"]  # 有効 60 分

# -----------------------------------------------------------------------------
# 2. ルート検索（API9）
#    * パラメータ名は v10.0 リリースノートの新仕様に合わせた例
# -----------------------------------------------------------------------------
ROUTE_URL = "https://pf.drm.jp/api/9/route"

# ★始点・終点を緯度経度で指定
start_lat, start_lon = 35.701835, 139.763417      # 例：東京駅近く
goal_lat,  goal_lon  = 35.695087, 139.820496      # 例：都立墨東病院

route_resp = requests.get(
    ROUTE_URL,
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    params={
        "start_lat":  start_lat,
        "start_lon":  start_lon,
        "goal_lat":   goal_lat,
        "goal_lon":   goal_lon,
        "crs":        "EPSG:4326",      # 返却座標系
        # 省略可オプション例
        # "avoid_class": "01,02",       # 避けたい道路種別
        # "require_class": "11",        # 優先したい道路種別
        # "optimize": "time",           # time / distance
    },
    timeout=20,
)
route_resp.raise_for_status()
data = route_resp.json()

# -----------------------------------------------------------------------------
# 3. GeoJSON を取り出して Folium で可視化
# -----------------------------------------------------------------------------
geojson = data["geo_data"]               # LineString（MultiLineString の場合もあり）
gdf = gpd.GeoDataFrame(
    {"geometry": [shape(geojson)]}, crs="EPSG:4326"
)

# Folium マップ
m = folium.Map(location=[start_lat, start_lon], zoom_start=13)
folium.Marker([start_lat, start_lon], tooltip="Start").add_to(m)
folium.Marker([goal_lat, goal_lon],  tooltip="Goal").add_to(m)
folium.GeoJson(gdf).__geo_interface__     # dummy call to silence linter
folium.GeoJson(data=geojson, name="Route").add_to(m)
m.save("drm_pf_route.html")
print("→ drm_pf_route.html をブラウザで開くとルートが表示されます")