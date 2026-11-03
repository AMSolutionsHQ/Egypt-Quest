"""Browser tests for v4.4.1 (engagement Phase 1): save preservation + validation,
no missed-day penalty, no placeholder ads outside dev mode, achievement icons.
usage: python3 tests/e2e/phase1_e2e.py [www_dir]"""
import sys, os, json, base64, datetime, threading, http.server, functools, socketserver
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__))
root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, "..", "..", "www")
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Q, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
res, errs = [], []
def check(n, ok, x=""): res.append(("PASS" if ok else "FAIL") + f"  {n} {x}")
CLOSE = "()=>{for(const i of ['bmenu','done','adov'])document.getElementById(i).style.display='none'}"
def daystr(o): return (datetime.date.today() + datetime.timedelta(days=o)).isoformat()
GOOD = {"score": 1234, "done": ["gem", "giza"], "seen": ["gem", "giza"], "muted": False, "prog": {}, "lvl": {}, "ach": ["first", "perfect"],
        "streak": 12, "lastDay": daystr(-1), "dailyClaim": "", "dailyDay": "", "dailyId": "", "SR": {"gem": [3, 2, 1, 0, 0], "giza": [1, 0, 0, 0, 0]},
        "spent": 400, "inv": {"hint": 7, "time": 1, "boost": 0, "freeze": 2, "ward": 3}, "own": ["sunset", "lucky"], "theme": "sunset",
        "qDay": "", "qIds": [], "qp": {}, "qcl": {}, "chestAt": 0, "loginDay": 5, "ENDL": {"gem": 7}, "curseOn": False, "themeMode": "sunset",
        "pv": 2, "tok": 3, "tokEarned": 9, "ul": {"sites": ["giza"], "levels": {"gem": [1, 1, 1, 0, 0], "giza": [1, 0, 0, 0, 0]}}, "cleared": {}, "trial": {"tok": {}, "pass": {}}, "fails": {}}
STATE = "()=>({score,spent,bal:bal(),streak,ach:[...ach].sort(),inv:{...inv},own:[...own].sort(),SR:JSON.parse(JSON.stringify(SR)),ENDL:{...ENDL},tok:PR.tok,tokEarned:PR.tokEarned,sites:[...PR.ul.sites],theme,themeMode,done:[...done].sort()})"

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}); pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e))); ev = pg.evaluate
    def put(obj_or_raw, extra=None):
        pg.goto(B.replace("index.html", "manifest.webmanifest"))
        ev("([k,v,x])=>{localStorage.clear();localStorage.setItem(k,v);if(x)for(const a in x)localStorage.setItem(a,x[a])}",
           ["egyptquest.v1", obj_or_raw if isinstance(obj_or_raw, str) else json.dumps(obj_or_raw), extra])
        pg.goto(B); pg.wait_for_timeout(900); ev(CLOSE)
    # 1. existing progress is preserved exactly
    put(GOOD); s1 = ev(STATE)
    check("v4.4.0 save: coins/spent kept", (s1["score"], s1["spent"]) == (1234, 400), s1["score"])
    check("…stars, Endless, places, Ankh kept", s1["SR"]["gem"] == [3, 2, 1, 0, 0] and s1["ENDL"] == {"gem": 7} and s1["sites"] == ["giza"] and (s1["tok"], s1["tokEarned"]) == (3, 9))
    check("…achievements (+ newly earned), inventory, owned items, theme kept", {"first", "perfect"} <= set(s1["ach"]) and s1["inv"] == GOOD["inv"] and s1["own"] == ["lucky", "sunset"] and s1["themeMode"] == "sunset")
    check("…streak continues (yesterday → 13)", s1["streak"] == 13, s1["streak"])
    pg.reload(); pg.wait_for_timeout(900); s2 = ev(STATE)
    check("reload: nothing changes", s1 == s2)
    check("last good copy written (.bak)", ev("()=>!!SaveCheck.parse(localStorage.getItem('egyptquest.v1.bak'))"))
    # 2. missed days: no penalty
    put({**GOOD, "lastDay": daystr(-5)}); s = ev(STATE)
    check("5 days away: balance unchanged", s["bal"] == 1234 - 400, s["bal"])
    check("…items/achievements unchanged, streak restarts at 1", s["inv"] == GOOD["inv"] and {"first", "perfect"} <= set(s["ach"]) and s["streak"] == 1, s["ach"])
    ev("()=>openLogin()"); txt = pg.inner_text("#bmenu")
    check("…no curse message in daily reward", "curse" not in txt.lower(), "")
    put({**GOOD, "lastDay": daystr(-2)}); s = ev(STATE)
    check("1 missed day with freeze: streak kept (13), 1 freeze used", s["streak"] == 13 and s["inv"]["freeze"] == 1 and s["bal"] == 834)
    # 3. ads: no placeholder ads outside dev mode
    put(GOOD)
    check("no dev flag: no ad provider", ev("()=>Ads.provider") == "none" and not ev("()=>Ads.canReward()"))
    check("…no banner", ev("()=>getComputedStyle(document.getElementById('adbanner')).display") == "none")
    ev("()=>{sel=SITES[0];startSite(1)}"); pg.click("#igo"); pg.wait_for_timeout(100)
    ev("()=>{inv.hint=0;render()}")
    check("…hint button offers no ad", not ev("()=>!!document.querySelector('#hintbtn .ico-play')"))
    ev("()=>winGame(3)"); pg.wait_for_timeout(2300)
    check("…result dialog has no 'watch an ad' button", pg.is_visible("#done") and not pg.is_visible("#dad"))
    s0 = ev("()=>score"); ev("()=>{document.getElementById('dad').click()}"); pg.wait_for_timeout(300)
    check("…forcing the hidden button grants nothing", ev("()=>score") == s0 and not pg.is_visible("#adov"))
    ev(CLOSE); ev("()=>exitWorld()")
    ev("()=>{chestAt=Date.now()+3600e3;openChest()}"); pg.wait_for_timeout(100)
    check("…closed chest: no ad offer, shows time", not pg.is_visible("#cha"))
    ev("()=>{ADS.test=false}")
    pg.goto(B + "?devads=1"); pg.wait_for_timeout(900)
    check("?devads=1 on localhost in test mode: dev placeholder only", ev("()=>Ads.provider") == "mock")
    ev("()=>{Ads.rewarded('x')}"); pg.wait_for_timeout(200)
    check("…clearly labelled as not a real ad", "not a real ad" in pg.inner_text("#adov"))
    # 4. achievements show locked/unlocked
    put(GOOD); ev("()=>openCollection()")
    on, off = ev("()=>[document.querySelectorAll('.ach-row .status-icon.is-done').length,document.querySelectorAll('.ach-row .status-icon.is-locked').length]")
    check("achievements: unlocked icons = unlocked count", on == ev("()=>ach.size"), f"{on}/{off}")
    check("…locked icons for the rest", on + off == ev("()=>ACH.length") and off > 0)
    pg.screenshot(path=os.path.join(os.environ.get("SHOTS", "/tmp"), "phase1_ach.png")) if os.environ.get("SHOTS") else None
    ev(CLOSE); ev("()=>{ach.delete('three');done.add('alex');done.add('luxor');checkAch()}")
    check("achievement toast keeps its icon", ev("()=>toastTx").startswith("✦"))
    # 5. corrupted save never wipes progress
    pg.goto(B.replace("index.html", "manifest.webmanifest")); ev("()=>localStorage.setItem('egyptquest.v1','{broken json')"); pg.goto(B); pg.wait_for_timeout(900)
    s = ev(STATE)
    check("unreadable save → last good copy restored", s["score"] == 1234 and s["SR"]["gem"] == [3, 2, 1, 0, 0])
    check("…unreadable data kept aside (.corrupt)", ev("()=>localStorage.getItem('egyptquest.v1.corrupt')") == "{broken json")
    put({**GOOD, "score": "abc", "SR": {"gem": [9, "x"]}, "inv": None, "ach": "oops", "theme": 5})
    s = ev(STATE)
    check("bad field values → safe defaults, no crash (achievements re-earned from progress)", s["score"] == 0 and s["SR"]["gem"] == [3, 0, 0, 0, 0] and s["inv"]["hint"] == 5 and "first" in s["ach"] and s["theme"] in ("classic", "sunset", "night"))
    check("…valid fields of that save kept", s["spent"] == 400 and s["own"] == ["lucky", "sunset"] and s["tok"] == 3)
    # 6. backup restore validates
    put(GOOD); code = base64.b64encode(json.dumps({**GOOD, "v": 2, "score": "x", "inv": "bad"}).encode()).decode()
    ev("()=>openBackup()"); pg.fill("#bcode", code); pg.click("#brest"); pg.wait_for_timeout(100); s = ev(STATE)
    check("restore with bad fields: cleaned, rest kept", s["score"] == 0 and s["inv"]["hint"] == 5 and s["SR"]["gem"] == [3, 2, 1, 0, 0])
    ctx.close()
    # 7. storage blocked: game still runs and says so once
    ctx = b.new_context(viewport={"width": 390, "height": 844}); pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("Storage.prototype.setItem=function(){throw new DOMException('blocked','QuotaExceededError')}")
    pg.goto(B); pg.wait_for_timeout(900)
    check("storage blocked: game runs, map shown", pg.evaluate("()=>mode") == "map")
    check("…player is told once", "can't be saved" in pg.evaluate("()=>toastTx"))
    pg.evaluate(CLOSE); pg.evaluate("()=>{sel=SITES[0];startSite(1)}"); pg.click("#igo"); pg.evaluate("()=>winGame(2)"); pg.wait_for_timeout(2300)
    check("…levels still playable", pg.is_visible("#done"))
    ctx.close(); b.close()
srv.shutdown()
print("\n".join(res)); print("page errors:", errs or "none")
sys.exit(1 if errs or any(r.startswith("FAIL") for r in res) else 0)
