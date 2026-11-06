import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const URL = process.env.SHOWCASE_URL || 'https://primetour-cataratas.vercel.app/';
const DIR = resolve('showcase-output');
mkdirSync(DIR, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage', '--hide-scrollbars']
});
const records = [];

async function scrollTo(page, selector, duration=2300) {
  return await page.evaluate(({selector,duration}) => {
    const element = document.querySelector(selector);
    if (!element) return false;
    const from=window.scrollY, to=Math.max(0, from+element.getBoundingClientRect().top-96);
    return new Promise(resolve => {
      let first;
      function tick(ts) {
        if(first===undefined) first=ts;
        const t=Math.min(1,(ts-first)/duration);
        const ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
        window.scrollTo(0, from+(to-from)*ease);
        if(t<1) requestAnimationFrame(tick);
        else resolve(true);
      }
      requestAnimationFrame(tick);
    });
  }, {selector,duration});
}
async function record(name, mobile, targetMs, action) {
  const opts={
    viewport: mobile ? {width:390,height:844} : {width:1920,height:1080},
    deviceScaleFactor:1,
    isMobile:mobile,
    hasTouch:mobile,
    recordVideo:{
      dir: DIR,
      size:mobile ? {width:390,height:844} : {width:1920,height:1080}
    },
    reducedMotion:'no-preference'
  };
  const context=await browser.newContext(opts);
  if(name!=='intro') {
    await context.addInitScript(() => sessionStorage.setItem('primetour_intro_seen_v3','1'));
  }
  const created=Date.now();
  const page=await context.newPage();
  const resp=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
  if(!resp || resp.status()>=400) throw new Error(name+': landing page unavailable: '+(resp?.status()??'no response'));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior='auto';
    document.body.style.cursor='none';
    document.querySelectorAll('video').forEach(v=>{v.muted=true; v.play().catch(()=>{});});
  });
  const start=Date.now();
  await action(page);
  const remaining=targetMs-(Date.now()-start);
  if(remaining>0) await sleep(remaining);
  const video=page.video();
  await context.close();
  const path=await video.path();
  const item={name,path,offset:Math.max(0,(start-created)/1000-.05),requested:targetMs/1000};
  records.push(item);
  console.log('RECORDED '+JSON.stringify(item));
}
try {
  await record('intro',false,30500,async(page)=>{
    await sleep(4500);
    const skip=page.locator('#pt-intro-skip');
    if(await skip.isVisible().catch(()=>false)) await skip.click({timeout:3000}).catch(()=>{});
    await sleep(8500);
    await scrollTo(page,'#destinos',2600); await sleep(1200);
    await scrollTo(page,'#roteiro',2500); await sleep(1500);
    await scrollTo(page,'#experiencias',2600);
    const card=page.locator('.experience-card').first();
    const bounds=await card.boundingBox().catch(()=>null);
    if(bounds) await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await sleep(1000);
    await scrollTo(page,'#edicao-luxury',1800);
  });
  await record('mobile',true,10500,async(page)=>{
    await sleep(700);
    await scrollTo(page,'#m-destinos',1900); await sleep(650);
    await scrollTo(page,'#m-roteiro',1950); await sleep(650);
    await scrollTo(page,'#m-experiencias',1950); await sleep(1000);
  });
  await record('closing',false,10000,async(page)=>{
    await scrollTo(page,'#edicao-luxury',300); await sleep(2850);
    await scrollTo(page,'.prime-footer-hero',2500);
    await sleep(1400);
    const cta=page.locator('.prime-footer-cta');
    const b=await cta.boundingBox().catch(()=>null);
    if(b) await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
  });
} finally {
  await browser.close();
}

writeFileSync(resolve(DIR,'capture.json'),JSON.stringify({url:URL,records},null,2));
const inputs=records.flatMap(r=>['-ss',r.offset.toFixed(2),'-i',r.path]);
const filters=[
  '[0:v]fps=30,tpad=stop_mode=clone:stop_duration=3,trim=duration=30.5,setpts=PTS-STARTPTS,scale=1920:1080,setsar=1,format=yuv420p[desktop]',
  '[1:v]fps=30,tpad=stop_mode=clone:stop_duration=3,trim=duration=10.5,setpts=PTS-STARTPTS,scale=432:936,pad=448:952:8:8:color=0xDDDDE7,setsar=1,format=yuv420p[phone]',
  'color=c=0x140c47:s=1920x1080:r=30:d=10.5[navy]',
  '[navy][phone]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[mobile]',
  '[2:v]fps=30,tpad=stop_mode=clone:stop_duration=3,trim=duration=10,setpts=PTS-STARTPTS,scale=1920:1080,setsar=1,format=yuv420p[closing]',
  '[desktop][mobile]xfade=transition=fade:duration=0.5:offset=30[part1]',
  '[part1][closing]xfade=transition=fade:duration=0.5:offset=40,format=yuv420p[final]'
].join(';');
const out=resolve(DIR,'primetour-showcase-50s.mp4');
const ffmpeg=['-y',...inputs,'-filter_complex',filters,'-map','[final]','-an','-t','50','-r','30','-c:v','libx264','-preset','medium','-crf','19','-movflags','+faststart','-pix_fmt','yuv420p',out];
console.log('Compositing 50s 1920x1080 MP4...');
execFileSync('ffmpeg',ffmpeg,{stdio:'inherit',timeout:600000});
console.log('FINAL_VIDEO='+out);
