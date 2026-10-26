/** Private family question schema. Never a public settings or speech-provider payload. */
export type FamilyWords=[string,string];
export type FamilyQuestion={q:FamilyWords;answers:FamilyWords[];right:number;pic:string};
const cleanText=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b-\u001f]/.test(v)?v.trim():null;
function words(value:unknown,max:number):FamilyWords|null{
 if(!Array.isArray(value)||value.length!==2)return null;
 const a=cleanText(value[0],max),b=cleanText(value[1],max);if(a===null||b===null||!a&&!b)return null;return[a||b!,b||a!];
}
export function cleanFamilyQuiz(value:unknown):FamilyQuestion[]|null{
 if(!Array.isArray(value)||value.length>6)return null;const out:FamilyQuestion[]=[];
 for(const item of value){
  if(!item||typeof item!=='object'||Array.isArray(item))return null;const q=item as Record<string,unknown>,question=words(q.q,300),pic=q.pic===undefined?'':cleanText(q.pic,200);
  if(!question||pic===null||!Array.isArray(q.answers)||q.answers.length<2||q.answers.length>6||!Number.isInteger(q.right)||Number(q.right)<0||Number(q.right)>=q.answers.length)return null;
  const answers:FamilyWords[]=[];for(const answer of q.answers){const pair=words(answer,120);if(!pair)return null;answers.push(pair);}
  out.push({q:question,pic,answers,right:Number(q.right)});
 }
 return out;
}
