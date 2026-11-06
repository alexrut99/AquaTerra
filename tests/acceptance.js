// Runs every analysis against answers computed independently (tests/ref/*.py: SciPy and mpmath),
// then clicks through the app. Exit code 1 on any failure.
const {open}=require('./harness'); const ref=require('./ref/ref.json'); const fs=require('fs'); const os=require('os'); const path=require('path');
const nd=require('./ref/neuman_data.json'); const nr=require('./ref/neuman_ref.json');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aquaterra-')); const fx=f=>path.join(__dirname,'fixtures',f);
let pass=0,fail=0; const ok=(name,cond,info='')=>{cond?pass++:fail++;console.log((cond?'PASS ':'FAIL ')+name+(info?'  → '+info:''))};
const near=(a,b,tol)=>Math.abs(a-b)/Math.abs(b)<=tol;
const nav=(page,t)=>page.click(`.nav-item:has-text("${t}")`).then(()=>page.waitForTimeout(200));
(async()=>{
 const {browser,page,errors,ctx}=await open();
 const ext=[];page.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))ext.push(r.url())});
 // ---- libs offline
 ok('libraries bundled (offline)',await page.evaluate(()=>typeof Chart==='function'&&typeof L==='object'&&typeof XLSX==='object'&&typeof JSZip==='function'));
 ok('Thai font loaded',await page.evaluate(async()=>{await document.fonts.ready;return document.fonts.check('16px Sarabun','ทดสอบ')}));
 const fn=await page.evaluate(({ref,nr})=>({
   W:ref.W_u.map((u,i)=>Math.abs(W(u)-ref.W_ref[i])/ref.W_ref[i]),
   H:ref.H_cases.map(([u,b],i)=>Math.abs(W_hantush(u,b)-ref.H_ref[i])/ref.H_ref[i]),
   N:nr.map(c=>Math.abs(neumanW(c.ts,c.beta,c.sigma)-c.lap)/c.lap),
   xlsx:XLSX.version
 }),{ref,nr});
 ok('W(u) vs SciPy',Math.max(...fn.W)<1e-6,'max err '+Math.max(...fn.W).toExponential(1));
 ok('W(u,r/B) vs mpmath',Math.max(...fn.H)<1e-5,'max err '+Math.max(...fn.H).toExponential(1));
 ok('Neuman W vs independent solution',Math.max(...fn.N)<0.005,'max err '+Math.max(...fn.N).toExponential(1));
 if(process.env.EXPECT_XLSX) ok('SheetJS version',fn.xlsx===process.env.EXPECT_XLSX,fn.xlsx); else console.log('    SheetJS',fn.xlsx);
 await page.evaluate(()=>showPage('theis',document.querySelector('.nav-item')));
 for(const f of ['drawdown.csv','drawdown.xlsx']){ await page.setInputFiles('#theisFile',fx(f));await page.waitForTimeout(500); ok('Import '+f,(await page.evaluate(()=>data.theis.length))>=5);}
 const r=await page.evaluate(async({ref,nd})=>{
  const o={};const g=i=>document.getElementById(i);const t=i=>g(i)?.textContent;const cp=x=>JSON.parse(JSON.stringify(x));
  const nv=p=>showPage(p,[...document.querySelectorAll('.nav-item')].find(x=>(x.getAttribute('onclick')||'').includes("'"+p+"'")));
  data.theis=cp(ref.theis);g('theis_Q').value=500;g('theis_r').value=50;g('theis_b').value=20;renderTable('theis');autoFit('theis');
  o.theis=[t('theis_resT'),t('theis_resS')];
  data.jacob=cp(ref.theis);g('jacob_Q').value=500;g('jacob_r').value=50;g('jacob_b').value=20;renderTable('jacob');autoFit('jacob');o.jacob=[t('jacob_resT'),t('jacob_resS')];
  data.recovery=cp(ref.rec);g('rec_Q').value=500;g('rec_tp').value=480;g('rec_b').value=20;renderTable('recovery');autoFit('recovery');o.rec=[t('rec_resT')];
  obsWells=ref.mw.map((w,i)=>({name:'OW'+i,r:w.r,data:cp(w.data)}));g('mw_Q').value=500;g('mw_b').value=20;renderObsWellsList();autoFitMultiWell();o.mw=[t('mw_resT'),t('mw_resS')];
  nv('hantush');data.hantush=cp(ref.hant);g('hj_Q').value=500;g('hj_r').value=50;g('hj_b').value=20;renderTable('hantush');autoFitHantush();o.hj=[t('hj_resT'),t('hj_resS'),t('hj_resB')];
  nv('distdd');distddData=cp(ref.dd);g('dd_Q').value=500;g('dd_b').value=20;g('dd_t').value=120;renderDistDDTable();setDistDDMethod('jacob');autoFitDistDD();o.ddJ=[t('dd_resT'),t('dd_resS')];
  setDistDDMethod('theis');autoFitDistDD();o.ddT=[t('dd_resT'),t('dd_resS')];
  nv('step');syncQUnit('m3/day');data.step=cp(ref.step);updateStepAnalysis();o.step=[t('step_resB'),t('step_resC')];
  nv('superpos');g('sp_T').value=200;g('sp_S').value=1e-4;g('sp_obsX').value=50;g('sp_obsY').value=50;spWells=[{name:'A',x:0,y:0,Q:500,tStart:0},{name:'B',x:100,y:0,Q:300,tStart:60}];spSchedule=[];g('sp_tMax').value=720;calcSuperposition();o.sp=t('sp_resS');
  nv('singlewell');swData=cp(ref.sw);g('sw_Q').value=500;g('sw_rw').value=.15;g('sw_b').value=20;g('sw_aquiferType').value='confined';swManualMode=false;calcSingleWell();o.sw=[t('sw_Ttheis'),t('sw_T'),t('sw_K')];
  nv('slugtest');slugData=[0,10,20,30,40,60,80,100,120,150,180].map(x=>({t:x,H:.5*Math.exp(-x/60)}));g('slug_rc').value=.051;g('slug_rs').value=.051;g('slug_Le').value=1.5;g('slug_b').value=10;g('slug_Lw').value=5;g('slug_H0').value=.5;calcSlugTest();o.slug=[t('slug_Kh'),t('slug_Kb'),t('slug_lnRe')];
  nv('unconfined');uncData=cp(nd.data);g('unc_Q').value=500;g('unc_r').value=30;g('unc_b').value=20;calcUnconfined();const t0=performance.now();autoFitUnconfined();o.uncMs=performance.now()-t0;
  o.unc=[t('unc_T'),t('unc_S'),t('unc_SyRes'),t('unc_beta'),t('unc_R2'),t('unc_Kz')];
  const keep=uncData;uncData=cp(ref.unc);g('unc_method').value='jacob_correct';calcUnconfined();o.uncJ=[t('unc_T'),t('unc_SyRes'),t('unc_S')];uncData=keep;g('unc_method').value='neuman';calcUnconfined();
  o.spec={R:0};
  return o;
 },{ref,nd});
 const f=parseFloat;
 ok('Theis T,S',near(f(r.theis[0]),200,.005)&&near(f(r.theis[1]),1e-4,.01),r.theis.join(' '));
 ok('Cooper-Jacob T,S',near(f(r.jacob[0]),200,.02)&&near(f(r.jacob[1]),1e-4,.05),r.jacob.join(' '));
 ok('Recovery T',near(f(r.rec[0]),200,.02),r.rec.join(' '));
 ok('Multi-Well T,S',near(f(r.mw[0]),200,.005)&&near(f(r.mw[1]),1e-4,.01),r.mw.join(' '));
 ok('Hantush T,S,B',near(f(r.hj[0]),200,.005)&&near(f(r.hj[1]),1e-4,.01)&&near(f(r.hj[2]),500,.01),r.hj.join(' '));
 ok('Distance-DD Jacob T,S',near(f(r.ddJ[0]),200,.02)&&near(f(r.ddJ[1]),1e-4,.05),r.ddJ.join(' '));
 ok('Distance-DD Theis T,S',near(f(r.ddT[0]),200,.005)&&near(f(r.ddT[1]),1e-4,.01),r.ddT.join(' '));
 ok('Step B,C',near(f(r.step[0]),.001,.001)&&near(f(r.step[1]),2e-6,.001),r.step.join(' '));
 ok('Superposition s(720)',near(f(r.sp),1.93407,.001),r.sp);
 ok('Single Well T',near(f(r.sw[0]),200,.01)&&near(f(r.sw[1]),200,.005),r.sw.join(' '));
 ok('Hvorslev K',near(f(r.slug[0]),4.2216,.001),r.slug[0]);
 ok('Bouwer-Rice ln(Re/rw), K',near(f(r.slug[2]),2.609,.002)&&near(f(r.slug[1]),6.0943*2.609/4.881,.005),r.slug.slice(1).join(' '));
 ok('Neuman fit T,S,Sy,β',near(f(r.unc[0]),200,.02)&&near(f(r.unc[1]),1e-3,.1)&&near(f(r.unc[2]),.1,.05)&&near(f(r.unc[3]),.02,.1),r.unc.join(' ')+` (${r.uncMs.toFixed(0)} ms)`);
 ok('Unconfined late-time T,Sy (T=200,Sy=0.1)',near(f(r.uncJ[0]),200,.05)&&near(f(r.uncJ[1]),.1,.1),r.uncJ.join(' '));

 // ---- units
 const unitTest=async(preset,tf,kf)=>{
  const v=await page.evaluate(preset=>{const g=i=>document.getElementById(i);const t=i=>g(i)?.textContent;
    const nv=p=>showPage(p,[...document.querySelectorAll('.nav-item')].find(x=>(x.getAttribute('onclick')||'').includes("'"+p+"'")));
    applyPreset(preset);applyUnits();
    const a={theis:t('theis_resT'),jacob:t('jacob_resT'),rec:t('rec_resT'),mw:t('mw_resT'),hj:t('hj_resT'),dd:t('dd_resT'),sw:t('sw_Ttheis'),unc:t('unc_T'),stepB:t('step_resB'),U:currentUnits.T};
    autoFit('theis');autoFit('jacob');autoFit('recovery');autoFitMultiWell();
    setDistDDMethod('jacob');autoFitDistDD();const ddj=t('dd_resT');setDistDDMethod('theis');autoFitDistDD();
    return {a,b:{theis:t('theis_resT'),jacob:t('jacob_resT'),rec:t('rec_resT'),mw:t('mw_resT'),dd:t('dd_resT'),ddj},fac:unitConversions.transmissivity[currentUnits.T]};
  },preset);
  const to=x=>f(x)*v.fac;
  for(const k of ['theis','jacob','rec','mw','hj','dd']) ok(`${preset}: ${k} T unchanged after switch`,near(to(v.a[k]),200,.03),`${v.a[k]} ${v.a.U} = ${to(v.a[k]).toFixed(1)} m²/d`);
  for(const k of ['theis','jacob','rec','mw','dd','ddj']) ok(`${preset}: ${k} T after re-fit`,near(to(v.b[k]),200,.03),`${to(v.b[k]).toFixed(1)} m²/d`);
  ok(`${preset}: Single Well stays SI`,near(f(v.a.sw),200,.01),v.a.sw);
  ok(`${preset}: Unconfined stays SI`,near(f(v.a.unc),200,.02),v.a.unc);
  ok(`${preset}: Step B unchanged`,near(f(v.a.stepB),.001,.001),v.a.stepB);
 };
 await unitTest('US'); await unitTest('Field'); await unitTest('CGS'); await unitTest('SI');

 // ---- Save / Load roundtrip
 const mark=await page.evaluate(()=>{const g=i=>document.getElementById(i);
   g('hj_r').value=88;g('dd_Q').value=666;g('sp_T').value=333;g('sw_Q').value=444;g('slug_Le').value=2.5;g('slug_Lw').value=6;g('unc_Q').value=555;g('jacob_t0').value=0;updateJacob();
   return {hj_r:'88',dd_Q:'666',sp_T:'333',sw_Q:'444',slug_Le:'2.5',slug_Lw:'6',unc_Q:'555',jacob_t0:'0',jacobS:g('jacob_resS').textContent,sp:spWells.length,sw:swData.length,sl:slugData.length,un:uncData.length,dd:distddData.length,hj:data.hantush.length,mw:obsWells.length}});
 await nav(page,'Save Project');
 await page.waitForSelector('#askTextInput');
 await page.fill('#askTextInput','Audit Run');
 const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#askTextOk')]);
 await dl.saveAs(path.join(tmp,'proj2.alproj')); ok('Save asks name via own dialog',true,dl.suggestedFilename());
 const b=await open();
 const [fc]=await Promise.all([b.page.waitForEvent('filechooser'),b.page.click('.nav-item:has-text("Load Project")')]);
 await fc.setFiles(path.join(tmp,'proj2.alproj'));await b.page.waitForTimeout(2500);
 const st=()=>({hj_r:document.getElementById('hj_r').value,dd_Q:document.getElementById('dd_Q').value,sp_T:document.getElementById('sp_T').value,sw_Q:document.getElementById('sw_Q').value,slug_Le:document.getElementById('slug_Le').value,slug_Lw:document.getElementById('slug_Lw').value,unc_Q:document.getElementById('unc_Q').value,jacob_t0:document.getElementById('jacob_t0').value,jacobS:document.getElementById('jacob_resS').textContent,sp:spWells.length,sw:swData.length,sl:slugData.length,un:uncData.length,dd:distddData.length,hj:data.hantush.length,mw:obsWells.length});
 const a2=await b.page.evaluate(st);
 ok('Save/Load keeps everything',JSON.stringify(a2)===JSON.stringify(mark),JSON.stringify(a2)===JSON.stringify(mark)?'':JSON.stringify(a2)+' vs '+JSON.stringify(mark));
 ok('Load: no errors',b.errors.length===0,b.errors.join());
 // old project file still loads
 const [fc2]=await Promise.all([b.page.waitForEvent('filechooser'),b.page.click('.nav-item:has-text("Load Project")')]);
 await fc2.setFiles(fx('old-format.alproj'));await b.page.waitForTimeout(1500);
 ok('Old-format project still loads',b.errors.length===0&&await b.page.evaluate(()=>data.theis.length>0),b.errors.join());
 await b.browser.close();
 // reload
 await page.evaluate(()=>{saveToLocalStorage()});await page.reload();await page.waitForTimeout(2000);
 const a3=await page.evaluate(st);
 ok('Reload keeps everything',JSON.stringify(a3)===JSON.stringify(mark),JSON.stringify(a3)===JSON.stringify(mark)?'':JSON.stringify(a3));

 // ---- buttons by real click
 const clk=async(sel,name)=>{const n=errors.length;await page.click(sel);await page.waitForTimeout(400);ok(name,errors.length===n,errors.slice(n).join())};
 await clk('.nav-item:has-text("Quality Check")','Quality Check opens');
 ok(' one summary only',await page.evaluate(()=>document.querySelectorAll('#fullQualityModal').length===1&&document.querySelectorAll('#qualityModal').length===0));
 await page.evaluate(()=>document.getElementById('fullQualityModal').remove());
 await clk('.nav-item:has-text("Additional Parameters")','Additional Parameters opens');
 const add=await page.evaluate(()=>{const g=i=>document.getElementById(i).textContent;return{q:g('addl_q'),v:g('addl_v'),tu:g('addl_tu'),R:g('addl_R')}});
 ok(' Darcy q=Ki, v=q/n',near(f(add.q),.1,.01)&&near(f(add.v),.5,.01),JSON.stringify(add));
 await page.evaluate(()=>document.getElementById('calcModal').remove());
 await clk('.nav-item:has-text("Radius of Influence")','ROI opens');
 ok(' ROI single formula',await page.evaluate(()=>document.querySelectorAll('#roiTable thead th').length===2));
 const roi=await page.evaluate(()=>document.querySelector('#roiTable tbody tr:nth-child(4) td:nth-child(2)').textContent);
 ok(' R(1day) T=200 S=1e-4',near(f(roi),1.5*Math.sqrt(200/1e-4),.01),roi);
 await page.evaluate(()=>document.getElementById('roiModal').remove());
 await clk('.nav-item:has-text("Compare Methods")','Compare opens');
 const cmp=await page.evaluate(()=>document.querySelector('#compareModal tfoot').innerText);
 console.log('   ',cmp.replace(/\s+/g,' '));
 ok(' average of fitted ≈200',near(f(cmp.match(/([\d.]+)\s+CV/)[1]),200,.02));
 await page.evaluate(()=>document.getElementById('compareModal').remove());
 // Wells export→import
 await nav(page,'Well Map');await page.waitForTimeout(500);
 const [wd]=await Promise.all([page.waitForEvent('download'),page.click('button:has-text("Export Wells")')]);await wd.saveAs(path.join(tmp,'wells.csv'));
 const w0=await page.evaluate(()=>{wells.length=0;return 0});
 await page.setInputFiles('#wellFile',path.join(tmp,'wells.csv'));await page.waitForTimeout(800);
 const w1=await page.evaluate(()=>wells.map(w=>[w.name,w.lat,w.lng]));
 ok('Import Wells',w1.length>=2,JSON.stringify(w1));
 const [fcw]=await Promise.all([page.waitForEvent('filechooser',{timeout:3000}),page.click('button:has-text("Import Wells")')]);ok('Import Wells button opens picker',!!fcw);
 // Export chart on pages that previously said no chart
 for(const [nm,tp] of [['Multi-Well','multiwell'],['Hantush-Jacob','hantush'],['Unconfined','unconfined'],['Slug Test','slugtest'],['Single Well','singlewell']]){
   await nav(page,nm);const [d]=await Promise.all([page.waitForEvent('download',{timeout:4000}).catch(()=>null),page.evaluate(t=>exportChart(t),tp)]);ok('Export chart '+tp,!!d);
 }
 // Report
 await page.click('.nav-item:has-text("Export Report")');await page.waitForTimeout(300);
 const cfg=await page.evaluate(()=>[...document.querySelectorAll('#rep_sectionList label')].map(l=>[l.innerText.trim().replace(/^●|○/,''),l.querySelector('span').textContent==='●']));
 ok('Report detects data in all sections',cfg.every(c=>c[1]),cfg.filter(c=>!c[1]).join());
 await page.evaluate(()=>toggleAllSections(true));
 const pop=ctx.waitForEvent('page',{timeout:20000});
 await page.click('#reportConfigModal button:has-text("สร้างรายงาน")');
 const pp=await pop;await pp.waitForLoadState().catch(()=>{});await pp.waitForTimeout(1500);
 const heads=await pp.evaluate(()=>[...document.querySelectorAll('h3')].map(h=>h.innerText.trim()));
 console.log('   ',heads.join(' | '));
 for(const k of ['Hantush','Distance','Single Well','Slug','Unconfined']) ok('Report has '+k,heads.some(h=>h.includes(k)));
 const body=await pp.evaluate(()=>document.body.innerText);
 ok('Report has no NaN/undefined',!/NaN|undefined/.test(body));
 const imgs=await pp.evaluate(()=>[...document.images].map(i=>[i.alt,i.naturalWidth]));
 ok('Report charts render',imgs.length>=9&&imgs.every(i=>i[1]>0),JSON.stringify(imgs));
  await page.bringToFront();await page.evaluate(()=>closeReportConfig());
 // Sample flows
 for(const [nm,fn] of [['Theis Type Curve',"loadSample('theis')"],['Hantush-Jacob',"loadSample('hantush');autoFitHantush()"],['Distance-DD','loadDistDDSample();autoFitDistDD()'],['Superposition','loadSuperposSample()'],['Single Well','loadSingleWellSample()'],['Slug Test','loadSlugSample()'],['Unconfined','loadUnconfinedSample()']]){
   await nav(page,nm);const n=errors.length;await page.evaluate(f=>eval(f),fn);await page.waitForTimeout(500);ok('Sample '+nm,errors.length===n,errors.slice(n).join());
 }
 const uncS=await page.evaluate(()=>['unc_T','unc_S','unc_SyRes','unc_beta','unc_R2'].map(i=>document.getElementById(i).textContent));console.log('    Unconfined sample:',uncS.join(' | '));
 console.log('external requests:',[...new Set(ext.map(u=>new URL(u).host))].join(', ')||'none');
 console.log('page errors:',errors);
 ok('no page errors',errors.length===0,errors.join(' | '));
 ok('only map tiles use the network',ext.every(u=>/tile|arcgisonline/.test(u)),ext.filter(u=>!/tile|arcgisonline/.test(u)).join());
 console.log(`\nTOTAL pass ${pass} fail ${fail}`);
 await browser.close();
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
