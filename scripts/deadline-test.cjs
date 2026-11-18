const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {execFileSync}=require('node:child_process');const {randomUUID}=require('node:crypto');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'forum-deadlines-'));
(async()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'src/lib/submissions.ts','--outDir',path.join(temp,'compiled'),'--module','Node16','--moduleResolution','Node16','--target','ES2022','--esModuleInterop','--skipLibCheck','--types','node'],{stdio:'pipe'});
 fs.symlinkSync(path.resolve('node_modules'),path.join(temp,'node_modules'),'dir');
 process.env.FORUM_DATA_DIR=path.join(temp,'data');process.env.FORUM_FORMS_ENABLED='true';
 const {submit}=require(path.join(temp,'compiled/submissions.js'));
 const personal={locale:'en',name:'Deadline Test',email:'deadline@example.invalid',affiliation:'Test Observatory',role:'postdoc',preference:'attend',documentType:'id_card',documentNumber:'000000000000000000',campusConsent:true,consent:true};
 const research={title:'Synthetic deadline verification',authors:'QA Researcher',affiliations:'Test Observatory',topic:'stars',abstract:'This is a synthetic abstract for checking the exact submission deadline. It contains no scientific results or real participant information, and exists only for an automated test.'};
 const request=body=>new Request('http://localhost/api/registrations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:randomUUID(),...personal,...body})});
 let n=0;
 for(const preference of ['oral','poster']){
  const accepted=await submit(request({...research,preference,posterFallback:'yes'}),Date.parse('2026-11-30T23:59:59.999+08:00'));assert.equal(accepted.includesAbstract,true);n++;
  await assert.rejects(()=>submit(request({...research,preference,posterFallback:'yes'}),Date.parse('2026-12-01T00:00:00+08:00')),error=>error.code==='abstract_closed');n++;
 }
 const attendance=await submit(request({}),Date.parse('2026-12-07T23:59:59.999+08:00'));assert.equal(attendance.includesAbstract,false);n++;
 await assert.rejects(()=>submit(request({}),Date.parse('2026-12-08T00:00:00+08:00')),error=>error.code==='closed');n++;
 process.env.FORUM_FORMS_ENABLED='false';
 await assert.rejects(()=>submit(request({}),Date.parse('2026-11-15T00:00:00+08:00')),error=>error.code==='closed');n++;
 console.log(`PASS: ${n} conditional deadline and closure checks.`);
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
