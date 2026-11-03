"use client";

import { useEffect, useRef } from "react";
import { C } from "@/lib/theme";
import { mountGuide } from "./engine";

// Chester County, PA ballot guide. The guide's own script (engine.js) is the attached
// pa-ballot-guide.html logic and data, unchanged; this component gives it
// a container inside the real app shell and the app's own colors and fonts.
// Two values are the guide's own because the app has no text-safe equivalent:
// --muted (#6B665C) and --persimmon-text (#C4421B). The app's muted and rust
// tokens are too light for small text on this background.
// The app has no dark mode, so the guide's dark palette is not carried over.

const CSS = `
.ftc {
  --paper: ${C.cream}; --card: ${C.white}; --ink: ${C.ink}; --bar: ${C.ink}; --on-bar: ${C.onDark};
  --rule: ${C.sand}; --persimmon: ${C.rust}; --tint: ${C.rustFill}; --taupe: ${C.sandDeep};
  --muted: #6B665C; --persimmon-text: #C4421B;
  --font-display: var(--font-condensed), "Arial Black", Arial, sans-serif;
  --font-body: var(--font-barlow), -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
}
.ftc a { color: var(--persimmon-text); text-underline-offset: 2px; }
.ftc h1, .ftc h2, .ftc h3, .ftc h4 { font-family: var(--font-display); font-weight: 400; line-height: 1.15; margin: 0; text-wrap: balance; }
.ftc button { font: inherit; }
.ftc .padx { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.ftc .btn:focus-visible, .ftc .tile:focus-visible, .ftc .mcard:focus-visible, .ftc .arrow:focus-visible, .ftc .linkbtn:focus-visible { outline: 2px solid var(--persimmon); outline-offset: 2px; }
.ftc .wrap { max-width: 1240px; margin: 0 auto; padding-block: 28px 96px; }
.ftc .kick { font-size: 12.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--persimmon-text); margin: 0 0 8px; }
.ftc .h1 { font-size: clamp(28px, 5vw, 40px); }
.ftc .sub { margin: 8px 0 0; color: var(--muted); max-width: 64ch; }
.ftc .gap { margin-top: 36px; }
.ftc .back { display: inline-block; margin-bottom: 18px; font-size: 15px; }
.ftc .showing { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; justify-content: space-between; background: var(--taupe); border-radius: 4px; padding: 12px 16px; font-size: 14px; margin-top: 18px; }
.ftc .showing b { font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; }
.ftc .linkbtn { background: none; border: 0; padding: 0; color: var(--persimmon-text); font-size: 14px; cursor: pointer; text-decoration: none; }
.ftc .linkbtn:hover { text-decoration: underline; }
.ftc .pick { max-width: 980px; margin: 0 auto; padding-top: 12px; }
.ftc .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr)); gap: 10px; margin-top: 22px; }
.ftc .tile { text-align: left; background: var(--card); border: 1.5px solid var(--rule); border-radius: 6px; padding: 14px 14px; cursor: pointer; font-size: 15px; font-weight: 500; color: var(--ink); display: flex; gap: 10px; align-items: baseline; min-height: 52px; }
.ftc .tile .n { font-weight: 700; color: var(--persimmon-text); min-width: 1ch; }
.ftc .tile:hover { border-color: var(--ink); }
.ftc .tile[aria-pressed="true"] { background: var(--tint); border-color: var(--persimmon); }
.ftc .tile[aria-disabled="true"] { opacity: 0.45; cursor: not-allowed; }
.ftc .pickbar { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; margin-top: 24px; }
.ftc .count { font-size: 14px; color: var(--muted); }
.ftc .btn { display: inline-block; text-align: center; background: var(--persimmon); color: #FFFFFF; border: 0; border-radius: 4px; padding: 14px 24px; font-weight: 700; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; cursor: pointer; }
.ftc .btn:hover { filter: brightness(0.94); }
.ftc .btn[disabled] { background: var(--taupe); color: var(--muted); cursor: not-allowed; filter: none; }
.ftc .btn.block { display: block; width: 100%; }
.ftc .check { background: var(--card); border: 1px solid var(--rule); border-radius: 8px; padding: 18px 20px; margin-top: 18px; }
.ftc .check h3 { font-size: 17px; margin-bottom: 10px; }
.ftc .check ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; font-size: 15px; }
.ftc .rgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr)); gap: 16px; margin-top: 18px; }
.ftc .rcard { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
.ftc .rhead { background: var(--bar); color: var(--on-bar); font-family: var(--font-display); font-size: 20px; line-height: 1.15; padding: 16px 16px 18px; min-height: 76px; }
.ftc .rbody { padding: 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.ftc .names { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-weight: 500; flex: 1; align-content: start; }
.ftc .info { margin: 0; font-size: 13px; color: var(--muted); }
.ftc .railtitle { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin: 26px 0 10px; }
.ftc .railtitle h3 { font-size: 18px; }
.ftc .arrows { display: flex; gap: 8px; }
.ftc .arrow { width: 40px; height: 40px; border-radius: 999px; border: 1.5px solid var(--ink); background: transparent; color: var(--ink); cursor: pointer; font-size: 18px; line-height: 1; }
.ftc .arrow:hover { background: var(--ink); color: var(--paper); }
.ftc .rail { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 2px 2px 14px; -webkit-overflow-scrolling: touch; }
.ftc .mcard { flex: 0 0 min(320px, 84%); scroll-snap-align: start; background: var(--card); border: 1px solid var(--rule); border-radius: 10px; overflow: hidden; text-decoration: none; color: var(--ink); display: flex; flex-direction: column; }
.ftc .mcard:hover { border-color: var(--ink); }
.ftc .mhead { background: var(--bar); color: var(--on-bar); font-family: var(--font-display); font-size: 19px; padding: 14px 16px; }
.ftc .mbody { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.ftc .mtitle { font-weight: 600; font-size: 16px; line-height: 1.3; }
.ftc .snip { margin: 0; font-size: 14px; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.ftc .more-link { margin-top: auto; font-size: 14px; font-weight: 600; color: var(--persimmon-text); }
.ftc .chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ftc .chip { font-size: 11.5px; font-weight: 600; letter-spacing: 0.04em; padding: 3px 8px; border-radius: 3px; background: var(--taupe); color: var(--ink); }
.ftc .chip.hit { background: var(--tint); box-shadow: inset 0 0 0 1px var(--persimmon); }
.ftc .chip.thr { background: transparent; box-shadow: inset 0 0 0 1px var(--rule); color: var(--muted); }
.ftc .meta { color: var(--muted); font-size: 15px; margin: 6px 0 0; }
.ftc .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; align-items: center; }
.ftc .pill { border: 1px solid var(--rule); background: var(--card); border-radius: 999px; padding: 7px 14px; font-size: 14px; font-weight: 500; color: var(--persimmon-text); }
.ftc .note { font-size: 13.5px; color: var(--muted); margin: 10px 0 0; max-width: 80ch; }
.ftc .iss { margin-top: 34px; }
.ftc .iss-h { display: flex; align-items: baseline; gap: 12px; }
.ftc .iss-k { font-size: 12.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--persimmon-text); }
.ftc .iss-h h2 { font-size: 26px; }
.ftc .rule { flex: 1; height: 1px; background: var(--rule); align-self: center; min-width: 16px; }
.ftc .yr { font-size: 12px; font-weight: 600; background: var(--tint); box-shadow: inset 0 0 0 1px var(--persimmon); border-radius: 3px; padding: 2px 8px; white-space: nowrap; }
.ftc .ccards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 16px; margin-top: 12px; }
.ftc .ccard { background: var(--card); border: 1px solid var(--rule); border-radius: 8px; padding: 18px 18px 14px; min-width: 0; }
.ftc .ccard h3 { font-family: var(--font-body); font-weight: 500; font-size: 18px; margin-bottom: 8px; }
.ftc .pos { padding-top: 10px; border-top: 1px solid var(--rule); margin-top: 10px; }
.ftc .pos:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
.ftc .sum { margin: 0 0 8px; font-size: 15.5px; overflow-wrap: anywhere; }
.ftc .psrc { margin: 0; font-size: 13px; color: var(--muted); }
.ftc .stype { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 1px 6px; border-radius: 3px; background: var(--taupe); color: var(--ink); margin-right: 4px; }
.ftc .orig { display: inline-block; margin-top: 6px; font-size: 14px; font-weight: 500; }
.ftc .fine { margin: 4px 0 0; font-size: 12.5px; color: var(--muted); }
.ftc .nopos { margin: 0; font-style: italic; color: var(--muted); }
.ftc .out { margin-top: 28px; font-size: 14px; color: var(--muted); }
.ftc details.more { margin-top: 30px; border-top: 1px solid var(--rule); padding-top: 8px; }
.ftc details.more > summary { cursor: pointer; font-weight: 600; padding: 10px 0; }
.ftc details.more > summary:focus-visible { outline: 2px solid var(--persimmon); outline-offset: 2px; }
.ftc .yn { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 14px; margin-top: 22px; }
.ftc .box { background: var(--card); border: 1px solid var(--rule); border-radius: 8px; padding: 16px 18px; min-width: 0; }
.ftc .box p { margin: 0; font-size: 15.5px; }
.ftc .lab { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--persimmon-text); margin-bottom: 6px; }
.ftc .stack { display: grid; gap: 14px; margin-top: 14px; }
.ftc .table-wrap { overflow-x: auto; }
.ftc table { border-collapse: collapse; font-size: 14.5px; min-width: 280px; }
.ftc th, .ftc td { text-align: left; padding: 6px 18px 6px 0; border-bottom: 1px solid var(--rule); font-variant-numeric: tabular-nums; }
.ftc .pager { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 30px; }
.ftc .lists { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr)); gap: 16px; margin-top: 14px; }
.ftc .lists ul { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 4px; font-size: 14.5px; }
.ftc .foot { margin-top: 40px; padding-top: 18px; border-top: 1px solid var(--rule); display: grid; gap: 10px; font-size: 14px; color: var(--muted); }
.ftc .foot p { margin: 0; max-width: 76ch; }
.ftc .strip { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; background: var(--taupe); border-top: 1px solid var(--rule); font-size: 13px; padding-top: 10px; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.ftc .strip span { color: var(--persimmon-text); margin-right: 6px; }
.ftc .quote { margin: 0 0 6px; font-style: italic; font-size: 15.5px; overflow-wrap: anywhere; }
.ftc .tp { margin: 0 0 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--persimmon-text); }
.ftc .qmore { background: none; border: 0; padding: 0; margin: 0 0 8px; color: var(--persimmon-text); font-size: 13.5px; font-weight: 600; cursor: pointer; }
.ftc .qnote { margin: 0 0 8px; font-size: 12.5px; font-style: italic; color: var(--muted); }
@media (prefers-reduced-motion: reduce) { .ftc, .ftc * { scroll-behavior: auto !important; } }
.ftc { background: var(--paper); color: var(--ink); font-family: var(--font-body); font-size: 16px; line-height: 1.5; min-height: 100%; }
.ftc, .ftc * { box-sizing: border-box; }
.ftc .subnav { max-width: 1240px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 0 22px; border-bottom: 1px solid var(--rule); }
.ftc .subnav a { color: var(--ink); text-decoration: none; font-weight: 500; font-size: 15px; min-height: 44px; display: inline-flex; align-items: center; border-bottom: 2px solid transparent; }
.ftc .subnav a.on { border-bottom-color: var(--persimmon); }
.ftc .subnav a:focus-visible { outline: 2px solid var(--persimmon); outline-offset: 2px; }
.ftc .where { margin-left: auto; font-size: 13px; color: var(--muted); letter-spacing: 0.04em; text-transform: uppercase; }
.ftc .wrap { padding-block: 28px 40px; }
.ftc .strip { position: sticky; left: auto; right: auto; z-index: 5; }
@media (min-width: 700px) { .ftc .strip { padding-right: 210px; } }
.ftc .arrow { width: 44px; height: 44px; }
.ftc .linkbtn, .ftc .qmore, .ftc .back, .ftc .orig { display: inline-flex; align-items: center; min-height: 44px; }
.ftc .fine a { display: inline-flex; align-items: center; min-height: 44px; }
.ftc details.more > summary { min-height: 44px; display: flex; align-items: center; padding-block: 0; }
.ftc .count { min-height: 44px; display: inline-flex; align-items: center; }
.ftc .check li a, .ftc .foot p a { padding-block: 13px; }
`.replace(/\$\{C\.(\w+)\}/g, (_m, k) => (C as Record<string, string>)[k]);

export default function ChesterCountyGuide() {
  const appRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const scroller = app.closest("main");
    return mountGuide(app, scroller);
  }, []);

  return (
    <div className="ftc">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="subnav padx" aria-label="Sections">
        <a href="#pick" data-nav="pick">Your issues</a>
        <a href="#ballot" data-nav="ballot">Your ballot</a>
        <span className="where">Chester County, Pennsylvania</span>
      </nav>
      <main className="wrap padx" id="app" ref={appRef} tabIndex={-1} />
      <div className="strip" role="note">
        <span>&#9679;</span>Election Day, Tuesday Nov 3: polls are open until 8 pm. A mail ballot must reach the county election office by 8 pm, so do not mail it now.
      </div>
    </div>
  );
}
