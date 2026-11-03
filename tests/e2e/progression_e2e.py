"""Browser tests for the v4.3 progression system (Ankh tokens, level/place unlocks,
Scribe's Trials, save migration, backup). Uses Python Playwright + Chromium.
usage: python3 tests/e2e/progression_e2e.py [www_dir] [screenshot_dir]"""
import sys, os, json, base64, threading, http.server, functools, socketserver
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__))
root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, "..", "..", "www")
shots = sys.argv[2] if len(sys.argv) > 2 else None
if shots: os.makedirs(shots, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Q, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
res, errs = [], []
def check(name, ok, extra=""): res.append(("PASS" if ok else "FAIL") + f"  {name} {extra}")
CLOSE = "()=>{for(const i of ['bmenu','done','adov'])document.getElementById(i).style.display='none'}"

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    ev = pg.evaluate
    def play(sid, lv, perf=None, lose=False):
        ev(CLOSE); ev(f"()=>{{sel=SITES.find(s=>s.id==='{sid}');startSite({lv})}}"); pg.wait_for_timeout(100)
        if not pg.is_visible("#igo"): return False
        pg.click("#igo"); pg.wait_for_timeout(100)
        if lose: ev("()=>loseGame('test')"); pg.wait_for_timeout(1200)
        elif perf: ev(f"()=>winGame({perf})"); pg.wait_for_timeout(2200)
        return True

    def put_save(obj):
        # write a save from a same-origin page WITHOUT the game (the game re-saves on pagehide)
        pg.goto(B.replace("index.html", "manifest.webmanifest"))
        ev("o=>localStorage.setItem('egyptquest.v1',JSON.stringify(o))", obj)
        pg.goto(B); pg.wait_for_timeout(700)
    pg.goto(B); pg.wait_for_timeout(700); ev(CLOSE)
    # 1. fresh player
    check("fresh: only first place open", ev("()=>SITES.map((s,i)=>unlocked(i)).filter(Boolean).length")==1)
    check("fresh: 0 Ankh, pv saved", ev("()=>PR.tok")==0 and ev("()=>JSON.parse(localStorage.getItem(SAVE)).pv")==2)
    check("locked level does not start", not play("gem", 2) and ev("()=>mode")=="map")
    check("…level list opens instead", pg.is_visible("#bmenu") and "Level 2" in pg.inner_text("#bmenu"))
    check("locked place does not start", not play("giza", 1) and ev("()=>mode")=="map")
    # 2. win → Ankh, idempotent
    play("gem", 1, 3)
    check("3★ on L1 gives 3 Ankh", ev("()=>PR.tok")==3, str(ev("()=>[PR.tok,SR.gem]")))
    check("result shows Ankh line", "+3 Ankh" in pg.inner_text("#dp"))
    check("next = Unlock & play", "Unlock & play level 2" in pg.inner_text("#dnext"))
    ev("()=>{runWon=false;mode='world';winGame(3)}"); pg.wait_for_timeout(2200)
    check("same stars again: no Ankh", ev("()=>PR.tok")==3)
    ev(CLOSE); play("gem", 1); ev("()=>{winGame(3);winGame(3)}"); pg.wait_for_timeout(2200)
    check("double win call: still 3 Ankh", ev("()=>PR.tok")==3)
    ev(CLOSE); play("gem", 1, 3)
    pg.click("#dnext"); pg.wait_for_timeout(300)
    check("unlock & play charges 1 and opens L2 intro", ev("()=>PR.tok")==2 and ev("()=>curLevel")==2 and pg.is_visible("#igo"))
    ev(CLOSE); ev("()=>{sel=SITES[0];openLevels()}")
    if shots: pg.screenshot(path=f"{shots}/levels_en.png")
    check("level list: L3 blocked until L2 completed", not pg.is_visible("[data-u='2']") and "Complete level 2 first" in pg.inner_text("#bmenu"))
    check("…and no Ankh spent on it", ev("()=>Progression.levelStatus(SR,PR,'gem',2)")=="blocked" and ev("()=>PR.tok")==2)
    # 3. persistence
    ev("()=>save()"); pg.reload(); pg.wait_for_timeout(700); ev(CLOSE)
    check("reload keeps Ankh + unlocked level", ev("()=>PR.tok")==2 and ev("()=>PR.ul.levels.gem[1]")==1)
    # 4. Token Trial (short of Ankh)
    play("gem", 2, 3); ev(CLOSE)   # +3 → 5
    ev("()=>{PR.tok=0;sel=SITES[0];openLevels()}")
    check("Token Trial offered when short", pg.is_visible("[data-t='tok']"))
    pg.click("[data-t='tok']"); pg.wait_for_timeout(150)
    check("trial intro labelled", "Scribe's Trial" in pg.inner_text("#bmenu"))
    pg.click("#igo"); pg.wait_for_timeout(100)
    ev("()=>finishBonus(100)"); pg.wait_for_timeout(200)
    check("trial win: +1 Ankh, no points", ev("()=>PR.tok")==1 and ev("()=>lastWin")==0 and not pg.is_visible("#dad"))
    ev("()=>finishBonus(100)"); pg.wait_for_timeout(100)
    check("trial reward applied once", ev("()=>PR.tok")==1 and ev("()=>PR.trial.tok.gem")==1)
    pg.click("#dbtn"); pg.wait_for_timeout(500); ev("()=>document.getElementById('adov').style.display='none'")
    check("back to level list after trial", pg.is_visible("#bmenu") and ev("()=>mode")=="map")
    # 5. Passage Trial after 3 losses
    ev("()=>{PR.tok=10;Progression.unlockLevel(SR,PR,'gem',2)}")
    for _ in range(3): play("gem", 3, lose=True)
    check("lose dialog offers Passage Trial", pg.is_visible("#dnext") and "Scribe's Trial" in pg.inner_text("#dnext"))
    pg.click("#dnext"); pg.wait_for_timeout(500); ev("()=>document.getElementById('adov').style.display='none'")
    pg.click("#igo"); pg.wait_for_timeout(100); ev("()=>finishBonus(100)"); pg.wait_for_timeout(200)
    check("passage clears L3 at 0★", ev("()=>Progression.levelDone(SR,PR,'gem',2)") and ev("()=>SR.gem[2]")==0)
    # 6. place unlock with points + reveal
    ev(CLOSE); ev("()=>{exitWorld();SR.gem=[3,3,3,0,0];PR.ul.levels.gem=[1,1,1,0,0];PR.ul.sites=[];PR.cleared={};done.clear();spent=score;render()}")
    check("progress alone does not open giza", not ev("()=>unlocked(1)"))
    ev("()=>select('giza')"); pg.wait_for_timeout(50)
    check("not enough points: button disabled, shows price", ev("()=>document.getElementById('enter').disabled") and "Needs 100 points" in pg.inner_text("#enter"))
    check("cannot buy two places ahead", ev("()=>{spent=score-5000;select('alex');render();return document.getElementById('enter').disabled}"))
    ev("()=>select('giza')"); b0 = ev("()=>bal()")
    pg.click("#enter"); pg.wait_for_timeout(50)
    check("first tap only asks to confirm", not ev("()=>unlocked(1)") and "Tap again" in pg.inner_text("#enter") and ev("()=>bal()") == b0)
    pg.click("#enter"); pg.wait_for_timeout(50)
    check("second tap: giza open, 100 points spent", ev("()=>unlocked(1)") and ev("()=>bal()") == b0 - 100)
    check("map reveal started for giza", ev("()=>revealAt&&revealAt.id") == "giza")
    pg.click("#enter"); pg.wait_for_timeout(100)
    check("enter now opens the level list (no second charge)", pg.is_visible("#bmenu") and ev("()=>bal()") == b0 - 100)
    ev(CLOSE)
    pg.wait_for_timeout(1400)
    check("reveal ends by itself", ev("()=>revealAt") is None)
    ev("()=>{select('alex')}"); pg.wait_for_timeout(100)
    if shots: pg.screenshot(path=f"{shots}/map_locked_progress.png")
    check("locked place info shows its price", "200 points" in pg.inner_text("#idesc"))
    # 7. migration of an old save
    old = {"score": 500, "done": ["gem", "giza"], "SR": {"gem": [3, 2, 0, 0, 0], "giza": [1, 1, 1, 0, 0]}, "spent": 10, "inv": {"hint": 2}}
    put_save(old); ev(CLOSE)
    check("migration: pv set to 2", ev("()=>JSON.parse(localStorage.getItem(SAVE)).pv")==2)
    check("migration: Ankh = best stars (8)", ev("()=>PR.tok")==8)
    check("migration: giza open, alex locked", ev("()=>[unlocked(1),unlocked(2)]")==[True, False])
    check("migration: open levels kept", ev("()=>[PR.ul.levels.gem,PR.ul.levels.giza]")==[[1,1,1,0,0],[1,1,1,1,0]], str(ev("()=>[PR.ul.levels.gem,PR.ul.levels.giza]")))
    check("migration: points/stars untouched", ev("()=>[score,spent,SR.gem.join()]")==[500, 10, "3,2,0,0,0"], str(ev("()=>[score,spent,SR.gem.join()]")))
    pg.reload(); pg.wait_for_timeout(700)
    check("migration runs once (stable on reload)", ev("()=>PR.tok")==8)
    # 8. backup v2 + v1
    code = ev("()=>exportCode()")
    d = json.loads(base64.b64decode(code)); check("backup is v2 with Ankh", d["v"]==2 and d["tok"]==8)
    ev("()=>{PR.tok=0;openBackup()}"); pg.fill("#bcode", code); pg.click("#brest"); pg.wait_for_timeout(100)
    check("restore v2 code", ev("()=>PR.tok")==8)
    v1 = base64.b64encode(json.dumps({"v": 1, "score": 50, "done": ["gem"], "SR": {"gem": [3, 0, 0, 0, 0]}}).encode()).decode()
    pg.fill("#bcode", v1); pg.click("#brest"); pg.wait_for_timeout(100)
    check("restore old v1 code (migrated)", ev("()=>[PR.tok,unlocked(1)]")==[3, True])
    pg.fill("#bcode", "garbage"); pg.click("#brest"); pg.wait_for_timeout(100)
    check("bad code rejected, state kept", ev("()=>PR.tok")==3)
    # 9. corrupt progression in save is sanitized
    d = ev("()=>JSON.parse(localStorage.getItem(SAVE))"); d["tok"] = -5; d["ul"] = {"sites": ["xx", 1], "levels": {"gem": "bad"}}
    put_save(d)
    check("corrupt values sanitized", ev("()=>[PR.tok>=0,Array.isArray(PR.ul.sites),!PR.ul.sites.includes('xx')]")==[True, True, True])
    # 10. Arabic level list renders
    ev("()=>{lang='ar';render();sel=SITES[0];openLevels()}"); pg.wait_for_timeout(100)
    if shots: pg.screenshot(path=f"{shots}/levels_ar.png")
    check("Arabic level list", "عنخ" in pg.inner_text("#bmenu"))
    b.close()
srv.shutdown()
print("\n".join(res)); print("page errors:", errs or "none")
sys.exit(1 if errs or any(r.startswith("FAIL") for r in res) else 0)
