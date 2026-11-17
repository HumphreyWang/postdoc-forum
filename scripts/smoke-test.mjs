import assert from 'node:assert/strict';
import {createDecipheriv, randomUUID} from 'node:crypto';
import {access, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const base=process.env.TEST_BASE_URL||'http://localhost:3026';
const data=process.env.FORUM_DATA_DIR;
if(!data)throw new Error('Set FORUM_DATA_DIR to the isolated test server data directory.');
let checks=0;
function check(condition,label){assert.ok(condition,label);checks++;}
async function post(route,body,expected,headers={}){
 const response=await fetch(`${base}/api/${route}`,{method:'POST',headers:body instanceof FormData?headers:{'Content-Type':'application/json',...headers},body:body instanceof FormData?body:typeof body==='string'?body:JSON.stringify(body)});
 check(response.status===expected,`${route}: expected ${expected}, received ${response.status}`);
 check(response.headers.get('cache-control')==='no-store','Response is not cached');
 const result=await response.json();check(!JSON.stringify(result).includes('QA-ONLY-0001'),'Response does not expose document numbers');return result;
}
for(const page of ['','/program','/registration','/venue','/contact','/credits']){
 const response=await fetch(`${base}/en${page}`);check(response.status===200,`English page ${page} reachable`);
 const html=await response.text();check(html.includes('lang="en"'),'English document language');
 check(!html.includes('MISSING_MESSAGE'),'No missing translations');check(!html.includes('href="/en/abstract"'),'No separate abstract navigation');
 const old=await fetch(`${base}/zh${page}?source=bookmark`,{redirect:'manual'});check(old.status===308,'Legacy Chinese URL redirects');
 check(new URL(old.headers.get('location'),base).href===`${base}/en${page}?source=bookmark`,'Redirect preserves host and query');
}
const oldAbstract=await fetch(`${base}/en/abstract`,{redirect:'manual'});
check([307,308].includes(oldAbstract.status),'Old abstract page redirects');
check(new URL(oldAbstract.headers.get('location'),base).pathname==='/en/registration','Old abstract points to combined form');
check((await fetch(`${base}/en/missing-page`)).status===404,'Unknown page returns 404');
for(const asset of ['/map-kiaa.png','/map-doa.png','/Map%20of%20KIAA.pdf','/Map%20of%20DoA.pdf','/images/jwst-leo-p.jpg','/images/jwst-carina.jpg','/images/jwst-macs0454.jpg'])check((await fetch(base+asset)).status===200,`${asset} available`);
check((await fetch(base+'/api/registrations')).status===405,'No public registration listing');
await post('abstracts',{},410);
const personal={requestId:randomUUID(),locale:'en',name:'QA Test Researcher',email:'qa@example.invalid',affiliation:'Test Observatory',role:'postdoc',preference:'attend',documentType:'id_card',documentNumber:'000000000000000000',notes:'Legacy notes must be ignored',discussionTopics:['work_life_balance','ai'],discussionInterest:'How can AI improve research without increasing workload?',campusConsent:true,consent:true};
await post('registrations',{},422,{Origin:new URL(base).origin});
await post('registrations',{...personal,email:'bad',consent:false},422);
await post('registrations',{...personal,campusConsent:false},422);
await post('registrations',{...personal,discussionTopics:'ai'},422);
await post('registrations',{...personal,discussionTopics:['unknown']},422);
await post('registrations',{...personal,discussionInterest:'x'.repeat(1001)},422);
await post('registrations',{...personal,documentNumber:''},422);
await post('registrations',{...personal,documentType:'unknown'},422);
await post('registrations',{...personal,documentType:'id_card',documentNumber:'short'},422);
await post('registrations',{...personal,documentNumber:'<script>'},422);
await post('registrations',{...personal,requestId:'../../etc/passwd'},422);
await post('registrations','{broken-json',400);
await post('registrations','x'.repeat(33000),413);
await post('registrations',personal,403,{Origin:'https://other.example'});
await post('registrations',personal,415,{'Content-Type':'text/plain'});
const missingAbstract={...personal,requestId:randomUUID(),preference:'oral'};
await post('registrations',missingAbstract,422);
await assert.rejects(()=>access(path.join(data,'registrations',missingAbstract.requestId+'.json')));checks++;
const research={title:'A synthetic astronomy abstract for testing',authors:'QA Researcher (presenter)',affiliations:'Test Observatory',topic:'galaxies',abstract:'This synthetic abstract tests the combined conference registration flow. It contains no real participant information or scientific findings. It verifies validation, conditional fields, receipt generation, and atomic data storage.',keywords:'test, astronomy',posterFallback:'yes'};
const receipts=await Promise.all([post('registrations',{...personal,...research},201),post('registrations',{...personal,...research},201)]);
check(receipts[0].id===personal.requestId&&receipts[0].createdAt===receipts[1].createdAt,'Concurrent retries return the same receipt');
check(receipts[0].includesAbstract===false,'Attend-only submissions ignore stale abstract fields');
check(receipts[0].status==='received','Production submissions are marked received');
const reordered=await post('registrations',{...personal,...research,discussionTopics:['ai','work_life_balance']},201);
check(reordered.createdAt===receipts[0].createdAt,'Topic selection order does not create a retry conflict');
await post('registrations',{...personal,...research,discussionTopics:['funding']},409);
await post('registrations',{...personal,...research,name:'Changed Name'},409);
await post('registrations',{...personal,...research,documentNumber:'000000000000000001'},409);
await post('registrations',{...personal,...research,requestId:randomUUID(),preference:'either'},422);
await post('registrations',{...personal,...research,requestId:randomUUID(),preference:'oral',posterFallback:''},422);
const noFallback={...personal,...research,requestId:randomUUID(),preference:'oral',posterFallback:'no'};
await post('registrations',noFallback,201);
check(JSON.parse(await readFile(path.join(data,'registrations',noFallback.requestId+'.json'),'utf8')).presentation.posterFallback===false,'Talk fallback No stored explicitly');
const records=[personal.requestId];
for(const preference of ['oral','poster']){
 const submission={...personal,...research,requestId:randomUUID(),preference};
 await post('registrations',{...submission,abstract:'   '},422);
 const tooLong=await post('registrations',{...submission,abstract:Array(151).fill('word').join(' ')},422);
 check(tooLong.fields.abstract==='word_limit','Clear 150-word-limit error');
 const receipt=await post('registrations',submission,201,{Origin:new URL(base).origin});check(receipt.includesAbstract===true,`${preference} includes an abstract`);records.push(submission.requestId);
}
for(const abstract of ['A concise abstract.',Array(150).fill('spectroscopy'.repeat(4)).join(' \n ')]){
 const accepted=await post('registrations',{...personal,...research,requestId:randomUUID(),preference:'oral',abstract},201);
 check(accepted.includesAbstract,'Short and exactly 150-word abstracts accepted without old character limits');
}
const noDiscussion={...personal,requestId:randomUUID()};delete noDiscussion.discussionTopics;delete noDiscussion.discussionInterest;
const optionalReceipt=await post('registrations',noDiscussion,201);
const optionalRecord=JSON.parse(await readFile(path.join(data,'registrations',optionalReceipt.id+'.json'),'utf8'));
check(optionalRecord.discussion.topics.length===0&&optionalRecord.discussion.interest==='','Discussion preferences are optional');
const card={...personal,requestId:randomUUID(),documentType:'id_card',documentNumber:'000000000000000000'};
await post('registrations',card,201); // Dummy format fixture, not a real ID.
const key=await readFile(path.join(data,'.campus-identity-key'));check(key.length===32,'Private encryption key exists');
check(((await stat(path.join(data,'.campus-identity-key'))).mode&0o777)===0o600,'Encryption key file permissions');
for(const id of records){
 const recordPath=path.join(data,'registrations',id+'.json');const text=await readFile(recordPath,'utf8');const stored=JSON.parse(text);
 check(!text.includes(personal.documentNumber),'Document number encrypted at rest');
 check(JSON.stringify(stored.discussion.topics)===JSON.stringify(['ai','work_life_balance'])&&stored.discussion.interest===personal.discussionInterest,'Discussion choices and free-text interest persisted');
 check(!('notes' in stored),'Additional notes omitted from new records');
 check(((await stat(recordPath)).mode&0o777)===0o600,'Record is private');
 const encrypted=stored.campusAccess.number;const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(encrypted.iv,'base64'));
 decipher.setAAD(Buffer.from(id));decipher.setAuthTag(Buffer.from(encrypted.tag,'base64'));
 const plain=Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext,'base64')),decipher.final()]).toString('utf8');
 check(plain===personal.documentNumber,'Organiser can recover campus-entry number');
 check(id===personal.requestId?stored.presentation===null:stored.presentation.abstract===research.abstract,'Personal and presentation details saved together');
 if(stored.preference==='oral')check(stored.presentation.posterFallback===true,'Talk fallback Yes stored');
 if(stored.preference==='poster')check(stored.presentation.posterFallback===null,'Poster has no talk fallback choice');
}
// Passport tests use a synthetic image, never an identity document.
const photo=await sharp({create:{width:32,height:24,channels:3,background:'#456789'}}).withExif({IFD0:{Artist:'Synthetic QA'}}).png().toBuffer();
const passport={...personal,requestId:randomUUID(),documentType:'passport',documentNumber:'QA-ONLY-0001',nationality:'Synthetic test nationality'};
function multipart(payload,bytes=photo,type='image/png'){
 const form=new FormData();form.append('payload',JSON.stringify(payload));
 if(bytes!==null)form.append('passportPhoto',new Blob([bytes],{type}),'untrusted-passport-name.png');
 return form;
}
await post('registrations',passport,422);
await post('registrations',multipart({...passport,nationality:''}),422);
await post('registrations',multipart(passport,null),422);
await post('registrations',multipart(passport,Buffer.from('<svg/>'),'image/svg+xml'),422);
await post('registrations',multipart(passport,photo,'image/jpeg'),422);
await post('registrations',multipart(passport,Buffer.from([137,80,78,71,13,10,26,10]),'image/png'),422);
await post('registrations',multipart(passport,Buffer.alloc(5*1024*1024+1),'image/png'),422);
await post('registrations',multipart(passport,Buffer.alloc(6*1024*1024),'image/png'),413);
const duplicates=multipart(passport);duplicates.append('passportPhoto',new Blob([photo],{type:'image/png'}),'second.png');await post('registrations',duplicates,400);
const passportReceipts=await Promise.all([post('registrations',multipart(passport),201),post('registrations',multipart(passport),201)]);
check(passportReceipts[0].createdAt===passportReceipts[1].createdAt,'Multipart retries are idempotent');
const passportText=await readFile(path.join(data,'registrations',passport.requestId+'.json'),'utf8');const passportRecord=JSON.parse(passportText);
check(!passportText.includes(passport.documentNumber)&&!passportText.includes(passport.nationality),'Passport number and nationality encrypted');
check(!passportText.includes('untrusted-passport-name.png')&&!passportText.includes(photo.toString('base64')),'Original photo and filename not stored in plaintext');
function decrypt(value,context){const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(value.iv,'base64'));decipher.setAAD(Buffer.from(context));decipher.setAuthTag(Buffer.from(value.tag,'base64'));return Buffer.concat([decipher.update(Buffer.from(value.ciphertext,'base64')),decipher.final()]);}
check(decrypt(passportRecord.campusAccess.nationality,passport.requestId+':nationality').toString('utf8')===passport.nationality,'Nationality is recoverable by the organiser');
const decoded=decrypt(passportRecord.campusAccess.passportPhoto.content,passport.requestId+':passport-photo');
const metadata=await sharp(decoded).metadata();check(metadata.format==='jpeg'&&metadata.width===32&&metadata.height===24,'Passport image is a valid normalized encrypted JPEG');
check(!metadata.exif,'Uploaded EXIF is stripped');
await post('registrations',multipart({...passport,nationality:'Changed test nationality'}),409);
const idWithStalePhoto={...personal,requestId:randomUUID(),nationality:passport.nationality};await post('registrations',multipart(idWithStalePhoto),201);
const stale=JSON.parse(await readFile(path.join(data,'registrations',idWithStalePhoto.requestId+'.json'),'utf8'));check(!stale.campusAccess.nationality&&!stale.campusAccess.passportPhoto,'ID-card submissions discard stale passport data');
console.log(`PASS: ${checks} combined-form, redirect, validation, privacy and storage checks.`);
