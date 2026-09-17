import { extractObjectAt } from '../netlify/functions/wc-parse.mjs';
const headers = { RSC: '1', 'User-Agent': 'WPM-LIVE/1.0' };
const text = await (await fetch('https://www.sporttora.com/pwc2026/schedule?view=order-of-play&_rsc=wpm', { headers })).text();
const re = /\{"id":"[^"]*__sub-[^"]*"/g;
let m;
while ((m = re.exec(text))) {
  const objStr = extractObjectAt(text, m.index);
  if (!objStr || !objStr.includes('open_team_coed____default__m121') || !objStr.includes('"discipline":"WD"')) continue;
  const j = JSON.parse(objStr);
  console.log('top keys', Object.keys(j));
  console.log('liveScore keys', j.liveScore && Object.keys(j.liveScore));
  console.log(JSON.stringify(j, null, 2).slice(0, 4000));
  break;
}
