// Time governor for frame-by-frame recording: every CSS animation, transition and WAAPI animation is paused
// and stepped by the recorder's clock, so motion is exact per frame.
(function () {
  const seen = new WeakMap();
  function sweep(doc, now) {
    let list = []; try { list = doc.getAnimations({ subtree: true }); } catch (e) { try { list = doc.getAnimations(); } catch (e2) { } }
    for (const a of list) {
      let st = seen.get(a);
      if (st == null) { st = now - (a.currentTime || 0); seen.set(a, st); try { a.pause(); } catch (e) { } }
      const t = now - st;
      try { if (a.playState !== 'finished') a.currentTime = t; } catch (e) { }
      try { const tm = a.effect && a.effect.getComputedTiming(); if (tm && isFinite(tm.endTime) && t >= tm.endTime) a.finish(); } catch (e) { }
    }
    doc.querySelectorAll('iframe').forEach(f => { try { if (f.contentDocument) sweep(f.contentDocument, now); } catch (e) { } });
  }
  window.__tick = function () { sweep(document, performance.now()); return 1; };
})();
