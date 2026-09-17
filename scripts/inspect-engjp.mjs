import { extractObjectAt } from '../netlify/functions/wc-parse.mjs';
const headers = { RSC: '1', 'User-Agent': 'WPM-LIVE/1.0' };
const [oopRes, liveRes] = await Promise.all([
  fetch('https://www.sporttora.com/pwc2026/schedule?view=order-of-play&_rsc=wpm', { headers }),
  fetch('https://www.sporttora.com/pwc2026/live?_rsc=wpm', { headers }),
]);
const oop = await oopRes.text();
const live = await liveRes.text();
for (const [label, text] of [['oop', oop], ['live', live]]) {
  const re = /\{"id":"[^"]*__sub-[^"]*"/g;
  let m;
  const related = [];
  while ((m = re.exec(text))) {
    const objStr = extractObjectAt(text, m.index);
    if (!objStr || !objStr.includes('open_team_coed____default__m121')) continue;
    try {
      const j = JSON.parse(objStr);
      related.push({
        disc: j.discipline,
        status: j.status,
        scoreA: j.scoreA,
        scoreB: j.scoreB,
        winnerId: j.winnerId,
        cg: j.liveScore?.currentGame,
        games: j.liveScore?.games,
        sideA: j.sideA?.name,
        sideB: j.sideB?.name,
      });
    } catch (e) {}
  }
  console.log('===', label, related.length);
  console.log(JSON.stringify(related, null, 2));
}
