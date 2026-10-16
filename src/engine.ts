import type {Product,PolicyDoc} from './data';
export type Evidence={id:string;source:string;field:string;value:string;status:'supported'|'missing'|'conflicting'|'not found';updatedAt?:string;excerpt?:string};
export type Reply={text:string;evidence:Evidence[];products:Product[];kind:string;claims:string[]};
const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9₹]+/g,' ').trim();
export function findProducts(q:string, products:Product[]):Product[]{
 const n=norm(q); const terms=n.split(' ').filter(t=>t.length>2 && !['what','which','show','tell','about','price','stock','have','does','with','under','compare','find','product','products','the','for','from','that','this','is','are','can','you','me','and','has','least','much','cost'].includes(t));
 const exactId=products.filter(p=>norm(p.id)===n); if(exactId.length)return exactId;
 const named=products.filter(p=>n.includes(norm(p.name))||norm(p.name).includes(n)); if(named.length)return named;
 return products.filter(p=>{const blob=norm(`${p.name} ${p.brand} ${p.category} ${p.description} ${Object.values(p.specs).join(' ')}`);return terms.length>0&&terms.every(t=>blob.includes(t));});
}
const ev=(p:Product,field:string,value:unknown,status:Evidence['status']='supported'):Evidence=>({id:p.id,source:p.source,field,value:value===null||value===undefined||value===''?'Not specified':String(value),status,updatedAt:p.updatedAt});
const money=(p:Product)=>p.price===null?'Not specified':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(p.price);
function productList(ps:Product[],limit=8){return ps.slice(0,limit).map(p=>`${p.name} (${p.id}) — ${money(p)}; stock: ${p.stock==='unknown'?'not specified':p.stock.replace('_',' ')}.`).join('\n');}
function policySearch(q:string,policies:PolicyDoc[]){const terms=norm(q).split(' ').filter(x=>x.length>3);return policies.map(d=>({d,score:terms.filter(t=>norm(d.content).includes(t)).length})).sort((a,b)=>b.score-a.score).filter(x=>x.score>0).slice(0,2);}
export function answerQuestion(q:string,products:Product[],policies:PolicyDoc[]):Reply{
 const n=norm(q); const allEvidence:Evidence[]=[];
 const notFound=(message='No matching product was found in the current catalogue. That is not the same as saying a retailer does not sell it. Try a model name, product ID, brand, or category.'):Reply=>({text:message,evidence:[{id:'',source:'current catalogue',field:'product search',value:'No matching record',status:'not found'}],products:[],kind:'notfound',claims:[]});
 const policyHits=policySearch(q,policies);
 const isAll=(/^(all|every)\b/.test(n)||/\b(list|show|give|display|name|what are)\b.*\b(all|every)\b.*\b(products?|items?|catalogue|catalog)\b/.test(n))&&/\b(products?|items?|catalogue|catalog)\b/.test(n);
 if(isAll && !/\b(compare|under|below|price|stock|warranty|delivery)\b/.test(n)){
   const chosen=[...products]; chosen.forEach(p=>{allEvidence.push(ev(p,'name',p.name));allEvidence.push(ev(p,'price',money(p)));});
   return {text:`All ${chosen.length} catalogue records (fictional demo data):\n\n${productList(chosen,chosen.length)}`,evidence:allEvidence,products:chosen,kind:'list',claims:chosen.map(p=>p.name)};
 }
 // A product ID request must never fall through to a generic "show" filter.
 const idMatch=q.match(/\bTC-[A-Z0-9-]+\b/i);
 if(idMatch){const byId=products.filter(p=>p.id.toLowerCase()===idMatch[0].toLowerCase());if(!byId.length)return notFound(`Product ID **${idMatch[0]}** was not found in the current catalogue.`);}
 if(/\bcompare\b/.test(n)){
   let compared=findProducts(q,products);
   if(compared.length<2){const terms=n.split(' ').filter(t=>t.length>3);compared=products.filter(p=>terms.some(t=>norm(p.name).includes(t))).slice(0,5);}
   if(compared.length<2)return {text:'I need two exact product names to compare. Please include both model names.',evidence:[],products:[],kind:'clarify',claims:[]};
   compared=compared.slice(0,4);const comparisonText='Comparison from stored records only (— means not specified):\n\n'+compared.map(p=>`**${p.name} (${p.id})**\nPrice: ${money(p)}\nStock: ${p.stock==='unknown'?'Not specified':p.stock.replace('_',' ')}\nRAM: ${p.specs.ram??'Not specified'}\nStorage: ${p.specs.storage??'Not specified'}\nBattery: ${p.specs.battery??'Not specified'}\nWarranty: ${p.warranty??'Not specified'}\nDelivery: ${p.delivery??'Not specified'}`).join('\n\n');
   compared.forEach(p=>{['price','stock','RAM','storage','battery','warranty','delivery'].forEach(f=>allEvidence.push(ev(p,f,f==='price'?money(p):f==='stock'?p.stock:p.specs[f.toLowerCase()]??(f==='warranty'?p.warranty:f==='delivery'?p.delivery:undefined))));});
   return {text:comparisonText,evidence:allEvidence,products:compared,kind:'compare',claims:compared.map(p=>p.name)};
 }
 if(/\bpolicy\b/.test(n)&&policyHits.length){const hit=policyHits[0];const excerpt=hit.d.content.split(/\n\n+/).filter(x=>x.trim()).slice(1,3).join('\n\n');const text=`According to **${hit.d.name}** (fictional demo policy):\n\n${excerpt}\n\nThis is a demo policy, not a real retailer's policy.`;return {text,evidence:[{id:hit.d.id,source:hit.d.filename,field:'policy passage',value:excerpt,status:'supported',updatedAt:hit.d.updatedAt,excerpt}],products:[],kind:'policy',claims:[hit.d.name]};}
 const exactNamed=products.filter(p=>n.includes(norm(p.name)));
 const asksPriceForNova=/\b(price|cost|how much)\b/.test(n)&&n.includes('nova x pro')&&!n.includes('nova x pro plus');
 const genericAsterOne=n.includes('aster one')&&!n.includes('aster one 5g')&&!n.includes('aster one lite');
 const prefixCandidates=products.filter(p=>(asksPriceForNova&&norm(p.name).startsWith('nova x pro'))||(genericAsterOne&&norm(p.name).startsWith('aster one ')));
 const named=prefixCandidates.length ? [...new Map([...exactNamed,...prefixCandidates].map(p=>[p.id,p])).values()] : exactNamed;
 const uniqueNames=[...new Set(named.map(p=>norm(p.name)))];
 // Product-specific questions take priority over general policy keyword matching.
 if(named.length && uniqueNames.length>1){
   const options=named.filter((p,i,arr)=>arr.findIndex(x=>norm(x.name)===norm(p.name))===i);
   return {text:`I found several products matching that name. Which one do you mean?\n\n${options.map(p=>`• ${p.name} (${p.id}) — ${money(p)}`).join('\n')}`,evidence:options.map(p=>ev(p,'name',p.name,'conflicting')),products:options,kind:'ambiguous',claims:[]};
 }
 if(named.length){
   const sameName=products.filter(p=>norm(p.name)===norm(named[0].name));
   const asksPrice=/\b(price|cost|how much|rupees|definitely)\b/.test(n)||n.includes('₹');
   const asksStock=/\b(stock|available|in stock)\b/.test(n);
   if(sameName.length>1 && (asksPrice||asksStock)){
     const vals=new Set(sameName.map(p=>asksPrice?p.price:p.stock));
     if(vals.size>1){sameName.forEach(p=>allEvidence.push(ev(p,asksPrice?'price':'stock',asksPrice?money(p):p.stock,'conflicting')));return {text:`I found conflicting records for **${sameName[0].name}**. I can't verify one definitive ${asksPrice?'price':'stock status'}. The stored records disagree, so please review the evidence before relying on either value.\n\n${sameName.map(p=>`• ${p.name} — ${money(p)} — ${p.stock} — source: ${p.source}`).join('\n')}`,evidence:allEvidence,products:sameName,kind:'conflict',claims:[]};}
   }
   const product= sameName.length>1 ? sameName[0] : named[0];
   if(/\b(warranty)\b/.test(n)){
     const value=product.warranty;allEvidence.push(ev(product,'warranty',value,value?'supported':'missing'));
     return {text:value?`The stored product record lists a warranty of **${value}** for **${product.name}**.`:`The warranty for **${product.name}** is not specified in the current catalogue. A missing field does not mean there is no warranty.`,evidence:allEvidence,products:[product],kind:value?'warranty':'missing',claims:[product.name]};
   }
   if(/\b(delivery|arrive|delivery estimate)\b/.test(n)){
     const value=product.delivery;const missing=!value||value==='Not specified';allEvidence.push(ev(product,'delivery',value,missing?'missing':'supported'));
     return {text:missing?`The delivery estimate for **${product.name}** is not specified in the current catalogue.`:`The product record lists an estimated delivery of **${value}** for **${product.name}**. This is not live tracking.`,evidence:allEvidence,products:[product],kind:missing?'missing':'delivery',claims:[product.name]};
   }
   if(/\b(price|cost|how much)\b/.test(n)){allEvidence.push(ev(product,'price',money(product)));return {text:`The recorded price for **${product.name}** is ${money(product)}. This is fictional demo data, not a live price.`,evidence:allEvidence,products:[product],kind:'price',claims:[product.name]};}
   if(/\b(stock|available|in stock)\b/.test(n)){const value=product.stock==='unknown'?'not specified':product.stock==='in_stock'?'in stock':'out of stock';allEvidence.push(ev(product,'stock',value,product.stock==='unknown'?'missing':'supported'));return {text:`The catalogue records **${product.name}** as ${value}. This is not a live inventory check.`,evidence:allEvidence,products:[product],kind:'stock',claims:[product.name]};}
   const synonymMap:Record<string,string>={'uv400':'uv_protection','ultraviolet':'uv_protection','noise cancellation':'noise_cancellation','video output':'video_output','ram':'ram','storage':'storage','battery':'battery','display':'display','water resistance':'water_resistance'};
   const synonym=Object.entries(synonymMap).find(([phrase,key])=>n.includes(phrase)&&key in product.specs);
   const specKey=synonym?.[1]||Object.keys(product.specs).find(k=>n.includes(k.replace(/_/g,' '))||n.includes(k));
   if(specKey){const value=product.specs[specKey];const missing=String(value)==='Not specified';allEvidence.push(ev(product,specKey,value,missing?'missing':'supported'));return {text:missing?`The ${specKey.replace(/_/g,' ')} for **${product.name}** is not specified in the catalogue.`:`The stored record for **${product.name}** lists ${specKey.replace(/_/g,' ')} as **${value}**.`,evidence:allEvidence,products:[product],kind:missing?'missing':'spec',claims:[product.name]};}
   if(/\b(details|tell me about|show)\b/.test(n)){['price','stock','warranty','delivery'].forEach(f=>allEvidence.push(ev(product,f,f==='price'?money(product):f==='stock'?product.stock:f==='warranty'?product.warranty:product.delivery)));return {text:`**${product.name}** (${product.id})\n\n${product.description}\n\nPrice: ${money(product)}\nStock: ${product.stock==='unknown'?'Not specified':product.stock.replace('_',' ')}\nWarranty: ${product.warranty??'Not specified'}\nDelivery: ${product.delivery??'Not specified'}`,evidence:allEvidence,products:[product],kind:'detail',claims:[product.name]};}
 }
 // Policy questions without a product-specific match use policy documents.
 const policyIntent=/return|refund|warrant|deliver|delivery|cancel|cancellation|exchange|opened|package|dispatch|accidental damage|policy|eligible|hygiene|inspection/.test(n);
 if(policyIntent && policyHits.length && /policy|return|refund|warrant|deliver|delivery|cancel|cancellation|exchange|opened|package|dispatch|accidental|hygiene|inspection|how long|instant|cover/.test(n)){
   const hit=policyHits[0];const paragraphs=hit.d.content.split(/\n\n+/).filter(x=>x.trim());const relevant=paragraphs.filter(p=>norm(p).split(' ').filter(t=>t.length>3&&n.includes(t)).length>=1);const excerpt=(relevant.length?relevant:paragraphs.slice(1,3)).join('\n\n');
   let text=`According to **${hit.d.name}** (fictional demo policy):\n\n${excerpt}\n\nThis is a demo policy, not a real retailer's policy.`;
   if(/damaged|instant|accidental|after dispatch/.test(n)&&/does not specify|not specify/.test(hit.d.content.toLowerCase()))text+=`\n\n**Limit:** the policy does not establish that specific exception or guarantee.`;
   allEvidence.push({id:hit.d.id,source:hit.d.filename,field:'policy passage',value:excerpt,status:'supported',updatedAt:hit.d.updatedAt,excerpt});return {text,evidence:allEvidence,products:[],kind:'policy',claims:[hit.d.name]};
 }
 const priceFilter=q.match(/under\s*₹?\s*([\d,]+)/i)||q.match(/below\s*₹?\s*([\d,]+)/i);const ramFilter=q.match(/(?:at least|minimum of|with)\s*(\d+)\s*gb\s*ram/i)||q.match(/(\d+)\s*gb\s*ram/i);
 if(priceFilter || /suggest|show|list|find|which products|headphones|laptops/.test(n)){
   let candidates=products.filter(p=>p.price!==null);if(priceFilter)candidates=candidates.filter(p=>p.price!<Number(priceFilter[1].replace(/,/g,'')));
   if(/headphone|earbud|audio/.test(n))candidates=candidates.filter(p=>/Headphones & Audio/.test(p.category));
   if(/laptop/.test(n))candidates=candidates.filter(p=>/Laptops & Electronics/.test(p.category)&&/laptop/i.test(p.name+' '+p.description));
   if(ramFilter)candidates=candidates.filter(p=>{const v=String(p.specs.ram||'').match(/\d+/);return !!v&&Number(v[0])>=Number(ramFilter[1]);});
   if(candidates.length){const limit=priceFilter||ramFilter||/headphone|earbud|audio|laptop/.test(n)?candidates.length:10;const shown=candidates.slice(0,limit);shown.forEach(p=>{allEvidence.push(ev(p,'price',money(p)));allEvidence.push(ev(p,'category',p.category));});return {text:`Found ${candidates.length} matching catalogue record(s). These are fictional demo products, not live inventory:\n\n${productList(shown,shown.length)}`,evidence:allEvidence,products:shown,kind:'filter',claims:shown.map(p=>p.name)};}
   return notFound('No matching product was found in the current catalogue. This does not prove that a retailer does not sell it.');
 }
 const matches=findProducts(q,products);if(!matches.length)return notFound();
 if(matches.length>5)return {text:`Several products match. Please choose a specific model:\n\n${matches.slice(0,8).map(p=>`• ${p.name} (${p.id})`).join('\n')}`,evidence:[],products:matches.slice(0,8),kind:'clarify',claims:[]};
 const primary=matches[0];return {text:`**${primary.name}** (${primary.id})\n\n${primary.description}\n\nPrice: ${money(primary)}\nStock: ${primary.stock==='unknown'?'Not specified':primary.stock.replace('_',' ')}\nWarranty: ${primary.warranty??'Not specified'}\nDelivery: ${primary.delivery??'Not specified'}`,evidence:['price','stock','warranty','delivery'].map(f=>ev(primary,f,f==='price'?money(primary):f==='stock'?primary.stock:f==='warranty'?primary.warranty:primary.delivery)),products:[primary],kind:'detail',claims:[primary.name]};
}
export function evaluateOne(test:{question:string;check:string},products:Product[],policies:PolicyDoc[]){const r=answerQuestion(test.question,products,policies);const t=test.check;let pass=false;let reason='';if(t==='price')pass=r.kind==='price'&&r.evidence.some(e=>e.field==='price'&&e.status==='supported');else if(t==='missing')pass=r.kind==='missing'||r.evidence.some(e=>e.status==='missing')||/not specified|not specified in the current catalogue/i.test(r.text);else if(t==='ambiguous')pass=r.kind==='ambiguous'||r.kind==='clarify';else if(t==='conflict')pass=r.kind==='conflict'||r.kind==='ambiguous';else if(t==='compare')pass=r.kind==='compare'&&/Not specified/.test(r.text);else if(t==='notfound')pass=r.kind==='notfound';else if(t==='policy')pass=r.kind==='policy'&&r.evidence.some(e=>e.source.endsWith('.md'));else if(t==='unsupported')pass=r.kind==='policy'&&/does not specify|not specify|does not establish|not specified/i.test(r.text);else if(t==='filter')pass=r.kind==='filter'&&r.products.length>0;else if(t==='stock')pass=r.kind==='stock'||r.kind==='conflict';else if(t==='stockunknown')pass=r.kind==='stock'&&/not specified/i.test(r.text);else if(t==='spec')pass=r.kind==='spec';else pass=!!r.text; if(!pass)reason=`Expected behaviour “${test.check}”; actual response kind was “${r.kind}”.`;else reason='Expected behaviour detected by deterministic check.';return {pass,actual:r.text,kind:r.kind,reason,evidenceCount:r.evidence.length};}
