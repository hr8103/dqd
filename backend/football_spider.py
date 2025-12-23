import requests, pymysql, re, time
from bs4 import BeautifulSoup

# === 配置 ===
DB_PASSWORD = "20041217"
DB_CONFIG = {"host": "localhost", "user": "root", "password": DB_PASSWORD, "db": "football_data", "charset": "utf8mb4"}
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

LEAGUE_NAMES = {24646: "英超", 24651: "西甲", 24596: "意甲", 24648: "德甲", 24652: "法甲"}


def get_conn():
    return pymysql.connect(host=DB_CONFIG["host"], user=DB_CONFIG["user"], password=DB_CONFIG["password"],
                           database=DB_CONFIG["db"], cursorclass=pymysql.cursors.DictCursor)


def fetch(url, params=None):
    try:
        if __name__ == "__main__": time.sleep(0.3)
        res = requests.get(url, headers=HEADERS, params=params, timeout=10)
        res.raise_for_status()
        res.encoding = 'utf-8'
        return res
    except:
        return None


def clean_text(text): return text.replace(" ", "").strip() if text else ""


# === 核心功能 1：刷新联赛榜单 (积分/射手/助攻) ===
def update_league_data(lid):
    lname = LEAGUE_NAMES.get(lid, "未知联赛")
    print(f"🔄 [自动爬虫] 正在刷新 {lname} 榜单数据...")
    conn = get_conn()
    c = conn.cursor()

    # 1. 积分榜
    res = fetch("https://www.dongqiudi.com/sport-data/soccer/biz/data/standing",
                {"season_id": lid, "app": "dqd", "version": "0", "platform": "web"})
    if res:
        try:
            items = res.json()['content']['rounds'][0]['content']['data']
            for i in items:
                c.execute("REPLACE INTO standings VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                          (lid, i['team_id'], i['rank'], i['matches_total'], i['matches_won'], i['matches_draw'],
                           i['matches_lost'], i['goals_pro'], i['goals_against'], i['points']))
        except:
            pass

    # 2. 射手/助攻榜
    for t in ['goals', 'assists']:
        res = fetch("https://www.dongqiudi.com/sport-data/soccer/biz/data/person_ranking",
                    {"season_id": lid, "type": t, "app": "dqd", "version": "0", "platform": "web"})
        if res:
            try:
                c.execute("DELETE FROM rankings WHERE league_id=%s AND type=%s", (lid, t))
                data = [
                    (lid, t, p['rank'], p['person_id'], p['person_name'], p['team_name'], p.get('goal', p.get('count')))
                    for p in res.json()['content']['data']]
                c.executemany(
                    "INSERT INTO rankings (league_id, type, `rank`, person_id, name, team, count) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    data)
            except:
                pass

    conn.commit()
    conn.close()
    return True


# === 核心功能 2：刷新单个球队 (资料+阵容) ===
def update_team_data(tid):
    print(f"🔄 [自动爬虫] 正在刷新球队: {tid} ...")
    conn = get_conn()
    c = conn.cursor()

    # 先查一下 league_id，防止覆盖时丢失
    c.execute("SELECT league_id FROM teams WHERE team_id = %s", (tid,))
    res = c.fetchone()
    lid = res['league_id'] if res else 0

    res = fetch(f"https://www.dongqiudi.com/team/{tid}.html")
    if not res:
        conn.close()
        return False

    soup = BeautifulSoup(res.text, 'html.parser')

    # 解析球队信息
    info = {"name_cn": "", "name_en": "", "founded": "", "country": "", "city": "", "stadium": "", "capacity": "",
            "phone": "", "email": "", "address": "", "logo": ""}
    con = soup.find('div', class_='info-con')
    if con:
        if con.find('p', class_='team-name'): info['name_cn'] = con.find('p', class_='team-name').get_text(strip=True)
        if con.find('p', class_='en-name'): info['name_en'] = con.find('p', class_='en-name').get_text(strip=True)
        map_ = {"成立": "founded", "国家": "country", "城市": "city", "主场": "stadium", "容纳": "capacity",
                "电话": "phone", "邮箱": "email", "地址": "address"}
        for tag in con.find_all(['span', 'p']):
            txt = tag.get_text(" ", strip=True)
            for k, v in map_.items():
                if k in clean_text(txt): info[v] = re.split(r'[:：]', txt)[-1].strip()

    img = soup.find('div', class_='team-info').find('img', class_='team-logo')
    if img: info['logo'] = img['src']

    c.execute("REPLACE INTO teams VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
              (tid, lid, info['name_cn'], info['name_en'], info['founded'], info['country'], info['city'],
               info['stadium'], info['capacity'], info['phone'], info['email'], info['address'], info['logo']))

    # 解析荣誉
    c.execute("DELETE FROM honors WHERE team_id=%s", (tid,))
    honors = []
    if soup.find('div', class_='hornor-record'):
        for h in soup.find('div', class_='hornor-record').find_all('div', class_='hornor-list'):
            raw = h.find('p', class_='header').get_text(strip=True)
            name, cnt = raw.split("X") if "X" in raw else (raw, "1")
            honors.append(
                (tid, name.strip(), cnt.strip(), h.find('span', class_='during-time').get_text(" ", strip=True)))
    if honors: c.executemany("INSERT INTO honors (team_id, name, count, seasons) VALUES (%s,%s,%s,%s)", honors)

    # 解析阵容
    p_ids = re.findall(r'person_id:\s*"(\d+)"', res.text)
    players = []
    if soup.find('div', class_='team-player-data'):
        for i, r in enumerate(soup.find('div', class_='team-player-data').find_all('p', class_='analysis-list-item')):
            pid = p_ids[i] if i < len(p_ids) else ""
            if pid:
                avt = r.find('span', class_='item3').find('img')['src'] if r.find('span', class_='item3').find(
                    'img') else ""
                nat = r.find('span', class_='item6').find('img')['src'] if r.find('span', class_='item6').find(
                    'img') else ""
                players.append((pid, tid, r.find('span', class_='item3').get_text(strip=True),
                                r.find('span', class_='item2').get_text(strip=True),
                                r.find('span', class_='item1').get_text(strip=True), avt, nat))

    if players: c.executemany("REPLACE INTO players VALUES (%s,%s,%s,%s,%s,%s,%s)", players)

    conn.commit()
    conn.close()
    return True


# === 核心功能 3：刷新单个球员 ===
def update_player_data(pid):
    print(f"🔄 [自动爬虫] 正在实时抓取球员: {pid} ...")
    res = fetch(f"https://www.dongqiudi.com/player/{pid}.html")
    if not res: return False
    soup = BeautifulSoup(res.text, 'html.parser')
    conn = get_conn()
    c = conn.cursor()

    prof = {"cn": "", "en": "", "club": "", "nat": "", "h": "", "w": "", "age": "", "birth": "", "num": "", "foot": "",
            "pic": "", "abil": 0, "spd": 0, "sht": 0, "pas": 0, "dri": 0, "def": 0, "pwr": 0}
    left = soup.find('div', class_='info-left')
    if left:
        if left.find('p', class_='china-name'): prof['cn'] = left.find('p', class_='china-name').get_text(strip=True)
        if left.find('p', class_='en-name'): prof['en'] = left.find('p', class_='en-name').get_text(strip=True)
        map_ = {"俱乐部": "club", "国籍": "nat", "身高": "h", "年龄": "age", "体重": "w", "号码": "num",
                "生日": "birth", "惯用脚": "foot"}
        for li in left.find_all('li'):
            for k, v in map_.items():
                if k in clean_text(li.get_text()): prof[v] = re.split(r'[:：]', li.get_text(" ", strip=True))[-1].strip()

    if soup.find('img', class_='player-photo'): prof['pic'] = soup.find('img', class_='player-photo')['src']
    if soup.find('p', class_='average'):
        try:
            prof['abil'] = int(soup.find('p', class_='average').find('b').get_text())
        except:
            pass

    chart = soup.find('div', class_='box_chart')
    if chart:
        amap = {"速度": "spd", "射门": "sht", "传球": "pas", "盘带": "dri", "防守": "def", "力量": "pwr"}
        for it in chart.find_all('div', class_='item'):
            txt = it.get_text()
            scr = int(re.search(r'\d+', txt).group()) if re.search(r'\d+', txt) else 0
            for k, v in amap.items():
                if k in txt: prof[v] = scr

    c.execute("REPLACE INTO player_profiles VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
              (pid, prof['cn'], prof['en'], prof['club'], prof['nat'], prof['h'], prof['w'], prof['age'], prof['birth'],
               prof['num'], prof['foot'], prof['pic'], prof['abil'], prof['spd'], prof['sht'], prof['pas'], prof['dri'],
               prof['def'], prof['pwr']))

    c.execute("DELETE FROM player_stats WHERE person_id=%s", (pid,))
    stats = []
    wrap = soup.find('div', class_='total-con-wrap')
    if wrap:
        for row in wrap.find_all('p', class_='td'):
            cols = row.find_all('span')
            if len(cols) >= 9:
                try:
                    stats.append((pid, cols[0].get_text(strip=True), cols[1].get_text(strip=True),
                                  int(cols[2].get_text(strip=True)), int(cols[3].get_text(strip=True)),
                                  int(cols[4].get_text(strip=True)), int(cols[5].get_text(strip=True)),
                                  int(cols[6].get_text(strip=True)), int(cols[7].get_text(strip=True))))
                except:
                    continue
    if stats: c.executemany(
        "INSERT INTO player_stats (person_id, season, club, matches, starts, goals, assists, yellow, red) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        stats)

    conn.commit()
    conn.close()
    return True


def init_db(): pass


def parse_league(name, lid): return []


def parse_team(tid, lid): return []


def parse_player(pid): update_player_data(pid)


if __name__ == "__main__": pass