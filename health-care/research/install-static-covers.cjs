const fs=require('fs'),path=require('path'),sharp=require('sharp');
(async()=>{
 const manifest=require('./static-covers-20260930.json');
 if(manifest.images.length!==53||manifest.images.some(i=>!i.path||i.error))throw Error('Incomplete cover generation');
 const media=path.resolve(__dirname,'../media');
 for(const c of manifest.images){
  if(!/^\d+$/.test(c.id))throw Error('Invalid category id');
  await sharp(c.path).resize({width:720,withoutEnlargement:true}).jpeg({quality:86,mozjpeg:true}).toFile(path.join(media,'cover-'+c.id+'.jpg'));
 }
 const data=require('../data.json');
 for(const c of data.categories)for(const m of c.media){if(m.type!=='image'||!fs.existsSync(path.resolve(__dirname,'..',m.src)))throw Error('Missing static cover '+c.id)}
 let count=0,bytes=0;
 for(const name of fs.readdirSync(media)){
  if(!/^\d+-\d+(?:-poster)?\.(mp4|jpg)$/.test(name))continue;
  const file=path.resolve(media,name);if(path.dirname(file)!==media)throw Error('Unsafe media path');
  bytes+=fs.statSync(file).size;fs.unlinkSync(file);count++;
 }
 const readme=path.join(media,'README.md');let text=fs.readFileSync(readme,'utf8').replace('девять иллюстративных обложек','62 иллюстративные обложки').replace('Существующие пользовательские медиа сохранены.','Все прежние видеообложки и их постеры заменены статичными изображениями.');
 if(!text.includes('53 новые статичные обложки'))text+='\n\n53 новые статичные обложки: `cover-<id>.jpg`. Точный промпт и исходные файлы для каждой категории сохранены в `../research/static-covers-20260930.json` (поле promptTemplate, TITLE = name в верхнем регистре). Изображения иллюстративные, не портреты специалистов из карточек.\n';
 fs.writeFileSync(readme,text);
 console.log(JSON.stringify({installed:manifest.images.length,removed:count,removedMB:Math.round(bytes/1024/1024)}));
})().catch(e=>{console.error(e);process.exit(1)});
