from flask import Flask, jsonify
from flask_cors import CORS
import pymysql
import football_spider  # 引入爬虫模块
import time

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": "localhost", "user": "root", "password": "20041217",
    "database": "football_data", "charset": "utf8mb4", "cursorclass": pymysql.cursors.DictCursor
}

# 🔥 缓存字典 { 'key': timestamp }
UPDATE_CACHE = {}
CACHE_TIMEOUT = 300  # 5分钟


def get_db_connection():
    try:
        return pymysql.connect(**DB_CONFIG)
    except Exception as e:
        return None


# === 通用缓存检查函数 ===
def check_and_update(cache_key, update_func, *args):
    """
    检查缓存，如果过期则调用 update_func(*args) 进行更新
    """
    global UPDATE_CACHE
    current_time = time.time()
    last_update = UPDATE_CACHE.get(cache_key, 0)

    if current_time - last_update > CACHE_TIMEOUT:
        print(f"⏳ [API] 缓存过期 ({cache_key})，正在触发更新...")
        try:
            success = update_func(*args)
            if success:
                UPDATE_CACHE[cache_key] = current_time
                print(f"✅ [API] 更新成功，缓存已刷新。")
        except Exception as e:
            print(f"⚠️ 更新失败: {e}")
    else:
        print(f"⚡ [API] 命中缓存 ({cache_key})，直接返回数据库数据。")


# === API 接口 ===

@app.route('/api/leagues', methods=['GET'])
def get_leagues():
    # 联赛列表基本不更新，不用缓存逻辑
    leagues_meta = {
        24646: {'cn': '英超', 'fullName': '英格兰足球超级联赛', 'logo': '/pl.png', 'color': 'text-indigo-600',
                'bg': 'bg-indigo-50', 'gradient': 'from-indigo-500 to-purple-600'},
        24651: {'cn': '西甲', 'fullName': '西班牙足球甲级联赛', 'logo': '/laliga.png', 'color': 'text-orange-600',
                'bg': 'bg-orange-50', 'gradient': 'from-orange-500 to-red-600'},
        24596: {'cn': '意甲', 'fullName': '意大利足球甲级联赛', 'logo': '/seriea.png', 'color': 'text-cyan-600',
                'bg': 'bg-cyan-50', 'gradient': 'from-cyan-500 to-blue-600'},
        24648: {'cn': '德甲', 'fullName': '德国足球甲级联赛', 'logo': '/bundesliga.png', 'color': 'text-red-600',
                'bg': 'bg-red-50', 'gradient': 'from-red-500 to-yellow-500'},
        24652: {'cn': '法甲', 'fullName': '法国足球甲级联赛', 'logo': '/ligue1.png', 'color': 'text-blue-600',
                'bg': 'bg-blue-50', 'gradient': 'from-blue-500 to-indigo-600'},
    }
    conn = get_db_connection()
    if not conn: return jsonify([])
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name FROM leagues")
            leagues = cursor.fetchall()
    finally:
        conn.close()

    result = []
    for l in leagues:
        meta = leagues_meta.get(l['id'], {})
        result.append({
            'id': l['id'], 'name': l['name'], 'fullName': meta.get('fullName', l['name']),
            'cn': meta.get('cn', l['name']),
            'logo': meta.get('logo', '/default.png'), 'color': meta.get('color', 'text-gray-600'),
            'bg': meta.get('bg', 'bg-gray-50'), 'gradient': meta.get('gradient', 'from-gray-500 to-gray-600')
        })
    return jsonify(result)


@app.route('/api/teams/<int:league_id>', methods=['GET'])
def get_teams(league_id):
    # 🔥 1. 积分榜/球队列表：每5分钟自动刷新一次联赛数据
    check_and_update(f"league_{league_id}", football_spider.update_league_data, league_id)

    conn = get_db_connection()
    if not conn: return jsonify([])
    try:
        with conn.cursor() as cursor:
            sql = "SELECT t.*, s.`rank`, s.matches, s.won, s.draw, s.lost, s.goals_pro, s.goals_against, s.points FROM teams t LEFT JOIN standings s ON t.team_id = s.team_id WHERE t.league_id = %s ORDER BY s.`rank` ASC"
            cursor.execute(sql, (league_id,))
            teams = cursor.fetchall()
            for team in teams:
                cursor.execute("SELECT name, count FROM honors WHERE team_id=%s", (team['team_id'],))
                team['honors'] = cursor.fetchall()
    finally:
        conn.close()

    formatted = []
    for t in teams:
        formatted.append({
            'id': t['team_id'], 'leagueId': league_id, 'name': t['name_cn'], 'en': t['name_en'], 'logo': t['logo_url'],
            'stats': {'rank': t['rank'], 'played': t['matches'], 'won': t['won'], 'draw': t['draw'], 'lost': t['lost'],
                      'gf': t['goals_pro'], 'ga': t['goals_against'], 'pts': t['points']},
            'info': {
                'founded': t.get('founded'), 'stadium': t.get('stadium') or t.get('venue'),
                'city': t.get('city'), 'country': t.get('country'), 'capacity': t.get('capacity'),
                'phone': t.get('phone'), 'email': t.get('email'), 'address': t.get('address')
            },
            'honors': t['honors'], 'squad': []
        })
    return jsonify(formatted)


@app.route('/api/squad/<string:team_id>', methods=['GET'])
def get_squad(team_id):
    # 🔥 2. 球队阵容/详情：每5分钟自动刷新该球队
    check_and_update(f"team_{team_id}", football_spider.update_team_data, team_id)

    conn = get_db_connection()
    if not conn: return jsonify([])
    try:
        with conn.cursor() as cursor:
            sql = "SELECT p.*, pp.ability_total FROM players p LEFT JOIN player_profiles pp ON p.person_id = pp.person_id WHERE p.team_id = %s"
            cursor.execute(sql, (team_id,))
            players = cursor.fetchall()
            res = []
            for p in players:
                res.append({'id': p['person_id'], 'name': p['name'], 'number': p['number'], 'pos': p['position'],
                            'avatar': p['avatar_url'], 'rating': p.get('ability_total') or '-'})
            return jsonify(res)
    finally:
        conn.close()


@app.route('/api/rankings/<int:league_id>/<string:type>', methods=['GET'])
def get_rankings(league_id, type):
    # check_and_update... (保持原样)

    conn = get_db_connection()
    if not conn: return jsonify([])
    try:
        with conn.cursor() as cursor:
            sql = "SELECT r.*, p.avatar_url FROM rankings r LEFT JOIN players p ON r.person_id = p.person_id WHERE r.league_id = %s AND r.type = %s ORDER BY r.`rank` ASC"
            cursor.execute(sql, (league_id, type))
            data = cursor.fetchall()
            res = []
            for item in data:
                res.append({'id': item['person_id'], 'rank': item['rank'], 'name': item['name'], 'team': item['team'],
                            'count': item['count'],
                            'avatar': item.get('avatar_url') or 'https://www.dongqiudi.com/img/default_head.png'})
            return jsonify(res)
    finally:
        conn.close()


@app.route('/api/player/<string:person_id>', methods=['GET'])
def get_player(person_id):
    # 🔥 4. 球员详情：每5分钟自动刷新该球员
    check_and_update(f"player_{person_id}", football_spider.update_player_data, person_id)

    conn = get_db_connection()
    if not conn: return jsonify({})
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM player_profiles WHERE person_id=%s", (person_id,))
            profile = cursor.fetchone()
            cursor.execute(
                "SELECT season, club, matches, starts, goals, assists, yellow, red FROM player_stats WHERE person_id=%s ORDER BY season DESC",
                (person_id,))
            history = cursor.fetchall()

            if not profile: return jsonify({}), 404

            radar = [
                {'subject': '速度', 'A': profile['speed'] or 0, 'fullMark': 100},
                {'subject': '射门', 'A': profile['shooting'] or 0, 'fullMark': 100},
                {'subject': '传球', 'A': profile['passing'] or 0, 'fullMark': 100},
                {'subject': '盘带', 'A': profile['dribbling'] or 0, 'fullMark': 100},
                {'subject': '防守', 'A': profile['defense'] or 0, 'fullMark': 100},
                {'subject': '力量', 'A': profile['power'] or 0, 'fullMark': 100},
            ]

            return jsonify({
                'id': profile['person_id'], 'name_cn': profile['name_cn'], 'name_en': profile['name_en'],
                'club': profile['club'], 'number': profile['number'], 'pos': '球员',
                'age': profile['age'], 'height': profile['height'], 'weight': profile['weight'],
                'foot': profile['foot'],
                'birth_date': profile['birth_date'],
                'country': profile['nationality'], 'avatar': profile['photo_url'],
                'ability_total': profile['ability_total'],
                'radar': radar, 'history': history
            })
    finally:
        conn.close()


if __name__ == '__main__':
    print("✅ 后端服务已启动：http://127.0.0.1:5000")
    app.run(port=5000)