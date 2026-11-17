// Local organiser utility; never expose this script or its output through a web route.
import {createDecipheriv} from 'node:crypto';
import {readFile, readdir, writeFile, mkdir, rm} from 'node:fs/promises';
import path from 'node:path';
const outputIndex=process.argv.indexOf('--output');
if(outputIndex<0||!process.argv[outputIndex+1])throw new Error('Usage: node scripts/export-campus.mjs --output /private/path/campus-entries.json');
const root=path.resolve(process.env.FORUM_DATA_DIR||'data');
const output=path.resolve(process.argv[outputIndex+1]);
const publicRoot=path.resolve('public');
if(output===publicRoot||output.startsWith(publicRoot+path.sep))throw new Error('Campus entries must be exported outside public/.');
const key=await readFile(path.join(root,'.campus-identity-key'));
function decrypt(value,context){
 const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(value.iv,'base64'));
 decipher.setAAD(Buffer.from(context));decipher.setAuthTag(Buffer.from(value.tag,'base64'));
 return Buffer.concat([decipher.update(Buffer.from(value.ciphertext,'base64')),decipher.final()]);
}
const records=[],photos=[];
const photoDirectory=output.replace(/\.json$/i,'')+'-passport-photos';
for(const filename of await readdir(path.join(root,'registrations'))){
 if(!filename.endsWith('.json'))continue;
 const record=JSON.parse(await readFile(path.join(root,'registrations',filename),'utf8'));
 if(!record.campusAccess)continue;
 if(!/^[0-9a-f-]{36}$/i.test(record.id))throw new Error('Invalid registration identifier');
 const campus=record.campusAccess;
 const entry={registrationId:record.id,name:record.name,email:record.email,affiliation:record.affiliation,documentType:campus.documentType,documentNumber:decrypt(campus.number,record.id).toString('utf8'),purpose:campus.purpose};
 if(campus.nationality)entry.nationality=decrypt(campus.nationality,`${record.id}:nationality`).toString('utf8');
 if(campus.passportPhoto){
  const filename=record.id+'.jpg';
  photos.push({filename,bytes:decrypt(campus.passportPhoto.content,`${record.id}:passport-photo`)});
  entry.passportPhoto=path.join(path.basename(photoDirectory),filename);
 }
 records.push(entry);
}
// Exclusive output files/directories avoid overwriting an earlier sensitive export.
let createdDirectory=false,createdOutput=false;
try{
 if(photos.length){await mkdir(photoDirectory,{mode:0o700});createdDirectory=true;}
 await writeFile(output,JSON.stringify(records,null,2),{flag:'wx',mode:0o600});createdOutput=true;
 for(const photo of photos)await writeFile(path.join(photoDirectory,photo.filename),photo.bytes,{flag:'wx',mode:0o600});
}catch(error){
 if(createdOutput)await rm(output,{force:true});if(createdDirectory)await rm(photoDirectory,{recursive:true,force:true});throw error;
}
console.log(`Exported ${records.length} campus-entry records and ${photos.length} passport photos. Keep the output private.`);
