from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql
import football_spider
import time

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": "localhost", "user": "root", "password": "20041217",
    "database": "football_data", "charset": "utf8mb4", "cursorclass": pymysql.cursors.DictCursor
}

UPDATE_CACHE = {}
CACHE_TIMEOUT = 300


def get_db_connection():
    try:
        return pymysql.connect(**DB_CONFIG)
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return None


def check_and_update(cache_key, update_func, *args):
    global UPDATE_CACHE
    current_time = time.time()
    last_update = UPDATE_CACHE.get(cache_key, 0)
    if current_time - last_update > CACHE_TIMEOUT:
        try:
            success = update_func(*args)
            if success: UPDATE_CACHE[cache_key] = current_time
        except Exception as e:
            print(f"更新失败: {e}")


# === API 接口 ===

@app.route('/api/leagues', methods=['GET'])
def get_leagues():
    leagues_meta = {
        24646: {'cn': '英超', 'fullName': '英格兰足球超级联赛', 'logo': '/pl.png'},
        24651: {'cn': '西甲', 'fullName': '西班牙足球甲级联赛', 'logo': '/laliga.png'},
        24596: {'cn': '意甲', 'fullName': '意大利足球甲级联赛', 'logo': '/seriea.png'},
        24648: {'cn': '德甲', 'fullName': '德国足球甲级联赛', 'logo': '/bundesliga.png'},
        24652: {'cn': '法甲', 'fullName': '法国足球甲级联赛', 'logo': '/ligue1.png'},
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
            'cn': meta.get('cn', l['name']), 'logo': meta.get('logo', '/default.png')
        })
    return jsonify(result)


@app.route('/api/teams/<int:league_id>', methods=['GET'])
def get_teams(league_id):
    check_and_update(f"league_{league_id}", football_spider.update_league_data, league_id)
    conn = get_db_connection()
    if not conn: return jsonify([])
    try:
        with conn.cursor() as cursor:
            sql = "SELECT t.*, s.`rank`, s.matches, s.won, s.draw, s.lost, s.goals_pro, s.goals_against, s.points FROM teams t LEFT JOIN standings s ON t.team_id = s.team_id WHERE t.league_id = %s ORDER BY s.`rank` ASC"
            cursor.execute(sql, (league_id,))
            teams = cursor.fetchall()
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
            }
        })
    return jsonify(formatted)


@app.route('/api/squad/<string:team_id>', methods=['GET'])
def get_squad(team_id):
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
                            'count': item['count'], 'avatar': item.get('avatar_url')})
            return jsonify(res)
    finally:
        conn.close()


@app.route('/api/player/<string:person_id>', methods=['GET'])
def get_player(person_id):
    check_and_update(f"player_{person_id}", football_spider.update_player_data, person_id)
    conn = get_db_connection()
    if not conn: return jsonify({})
    try:
        with conn.cursor() as cursor:
            # 🔥 修改点：关联 players 表获取 nationality_url
            sql = """
                  SELECT pp.*, p.nationality_url
                  FROM player_profiles pp
                           LEFT JOIN players p ON pp.person_id = p.person_id
                  WHERE pp.person_id = %s \
                  """
            cursor.execute(sql, (person_id,))
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
                'foot': profile['foot'], 'birth_date': profile['birth_date'],
                'country': profile['nationality'], 'avatar': profile['photo_url'],
                'nationality_logo': profile.get('nationality_url'),  # 🔥 新增字段
                'ability_total': profile['ability_total'],
                'radar': radar, 'history': history
            })
    finally:
        conn.close()


@app.route('/api/search/players', methods=['POST'])
def search_players():
    data = request.json
    conn = get_db_connection()
    if not conn: return jsonify([])
    try:
        with conn.cursor() as cursor:
            sql = """
                  SELECT p.person_id, \
                         p.name, \
                         p.team_id, \
                         p.position, \
                         p.avatar_url,
                         t.name_cn  as team_name, \
                         t.logo_url as team_logo,
                         pp.age, \
                         pp.nationality, \
                         pp.ability_total, \
                         pp.foot, \
                         pp.number
                  FROM players p
                           JOIN teams t ON p.team_id = t.team_id
                           LEFT JOIN player_profiles pp ON p.person_id = pp.person_id
                  WHERE 1 = 1 \
                  """
            params = []
            if data.get('name'):
                sql += " AND (p.name LIKE %s OR pp.name_cn LIKE %s)"
                params.extend([f"%{data['name']}%", f"%{data['name']}%"])
            if data.get('league_id'):
                sql += " AND t.league_id = %s"
                params.append(data['league_id'])
            if data.get('team_id'):
                sql += " AND p.team_id = %s"
                params.append(data['team_id'])
            if data.get('position'):
                sql += " AND p.position LIKE %s"
                params.append(f"%{data['position']}%")
            if data.get('nationality'):
                sql += " AND pp.nationality LIKE %s"
                params.append(f"%{data['nationality']}%")
            if data.get('foot'):
                sql += " AND pp.foot = %s"
                params.append(data['foot'])
            if data.get('rating_min'):
                sql += " AND pp.ability_total >= %s"
                params.append(data['rating_min'])
            if data.get('rating_max'):
                sql += " AND pp.ability_total <= %s"
                params.append(data['rating_max'])
            if data.get('age_min'):
                sql += " AND pp.age >= %s"
                params.append(data['age_min'])
            if data.get('age_max'):
                sql += " AND pp.age <= %s"
                params.append(data['age_max'])

            sql += " ORDER BY pp.ability_total DESC LIMIT 50"
            cursor.execute(sql, tuple(params))
            results = cursor.fetchall()

            formatted = []
            for r in results:
                formatted.append({
                    'id': r['person_id'], 'name': r['name'], 'team': r['team_name'],
                    'team_logo': r['team_logo'], 'pos': r['position'], 'avatar': r['avatar_url'],
                    'rating': r['ability_total'] or '-', 'age': r['age'] or '-',
                    'nationality': r['nationality'] or '-', 'foot': r['foot'] or '-'
                })
            return jsonify(formatted)
    except Exception as e:
        print(f"搜索出错: {e}")
        return jsonify([]), 500
    finally:
        conn.close()


if __name__ == '__main__':
    app.run(port=5000)