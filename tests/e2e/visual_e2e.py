"""Browser checks for the v4.6 visual foundation: bundled fonts, emoji → icons,
HUD icons intact, no horizontal overflow, reduced motion. usage: python3 tests/e2e/visual_e2e.py [www_dir]"""
import sys, os, threading, http.server, functools, socketserver
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
EMOJI = "()=>/[\\u{1F000}-\\u{1FAFF}\\u{2705}\\u{274C}\\u{2764}\\u{2B50}\\u{2B1C}\\u{23F0}-\\u{23FA}\\u{26A0}\\u{26A1}\\u{2620}\\u{267E}]/u.test(document.body.innerText)"
with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh in [(320, 640), (390, 844), (1280, 800)]:
        pg = b.new_page(viewport={"width": vw, "height": vh}); pg.on("pageerror", lambda e: errs.append(str(e))); ev = pg.evaluate
        pg.goto(B); pg.wait_for_timeout(1500)
        if vw == 390:
            check("fonts: Cairo + El Messiri load from the app (offline-safe)", ev("()=>document.fonts.check('700 16px \"El Messiri\"')&&document.fonts.check('400 16px Cairo')"))
            check("…font files are local", ev("()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.woff2')).every(r=>r.name.startsWith(location.origin))"))
            check("mute button keeps its speaker icon", "ui-speaker" in ev("()=>getComputedStyle(document.getElementById('mute')).backgroundImage"))
        for fn in ["openLogin", "openShop", "openQuests", "openCollection", "openBonus", "openBackup"]:
            ev(CLOSE); ev(f"()=>{fn}()"); pg.wait_for_timeout(120)
            ow = ev("()=>{const b=document.querySelector('#bmenu .box');return b.scrollWidth-b.clientWidth}")
            check(f"[{vw}] {fn}: no emoji, no sideways overflow", not ev(EMOJI) and ow <= 1, f"overflow={ow}")
        ev(CLOSE); ev("()=>openShop()"); pg.wait_for_timeout(100)
        if vw == 390:
            check("shop: emoji replaced by vector icons", ev("()=>['bulb','clock','bolt','snowflake','shield'].every(n=>document.querySelector('#bmenu .ico-'+n))"))
            ev(CLOSE); ev("()=>{sel=SITES[0];startSite(1)}"); pg.wait_for_timeout(100)
            check("intro: heart/clock icons present, Start is primary gold", ev("()=>!!document.querySelector('#bmenu .ico-clock')") and "linear-gradient" in ev("()=>getComputedStyle(document.getElementById('igo')).backgroundImage"))
            pg.click("#igo"); ev("()=>winGame(3)"); pg.wait_for_timeout(2300)
            check("result dialog: icons, no emoji", ev("()=>!!document.querySelector('#done .ico')") and not ev(EMOJI))
            h = ev("()=>Math.min(...[...document.querySelectorAll('#done .bbtn,#dbtn')].filter(x=>x.offsetParent).map(x=>x.getBoundingClientRect().height))")
            check("touch targets ≥ 44 px in dialogs", h >= 44, f"min={h:.0f}")
        pg.close()
    # phase 2: place art, HUD Ankh chip, level select structure
    pg = b.new_page(viewport={"width": 390, "height": 844}); pg.on("pageerror", lambda e: errs.append(str(e))); ev = pg.evaluate
    pg.goto(B); pg.wait_for_timeout(1200); ev(CLOSE)
    ev("()=>{PR.ul.sites=SITES.map(s=>s.id);PR.tok=7;render()}")
    check("HUD shows the Ankh balance", ev("()=>document.getElementById('ankh').textContent.trim()") == "7")
    bad = ev("""async()=>{const out=[];for(const s of SITES){select(s.id);await new Promise(r=>setTimeout(r,120));const im=document.querySelector('#iart img');if(!im||!im.complete||!im.naturalWidth)out.push(s.id)}return out}""")
    check("all 16 place illustrations load in the place card", bad == [], str(bad))
    ev("()=>{select('gem');SR.gem=[3,1,0,0,0];PR.ul.levels.gem=[1,1,1,0,0];openLevels()}"); pg.wait_for_timeout(150)
    check("level select: header art + one 'next' level highlighted", ev("()=>!!document.querySelector('.lv-head img')&&document.querySelectorAll('.lvrow.is-next').length===1&&document.querySelector('.lvrow.is-next').dataset.l==='3'"))
    check("…done levels marked, locked levels disabled with Ankh cost", ev("()=>document.querySelectorAll('.lvrow.is-done').length===2&&[...document.querySelectorAll('.lvrow.is-lock')].every(b=>b.disabled)"))
    pg.click("#lcl"); pg.wait_for_timeout(100)
    check("…back button closes it", not pg.is_visible("#bmenu"))
    ev("()=>{PR.ul.sites=['giza'];done.add('gem');done.add('giza');render()}")
    check("map hint: tip hidden after first places, next place + progress bar shown", ev("()=>!document.querySelector('#hint .hint-tip')&&!!document.querySelector('#hint .hint-bar b')"))
    pg.close()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce"); pg = ctx.new_page(); pg.goto(B); pg.wait_for_timeout(900)
    pg.evaluate("()=>openShop()")
    check("reduced motion: dialog animation off", pg.evaluate("()=>getComputedStyle(document.querySelector('#bmenu .box')).animationName") == "none")
    ctx.close(); b.close()
srv.shutdown()
print("\n".join(res)); print("page errors:", errs or "none")
sys.exit(1 if errs or any(r.startswith("FAIL") for r in res) else 0)
