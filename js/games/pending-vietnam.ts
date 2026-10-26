import {register} from './frame.js';
import {T} from '../i18n.js';
import {playTrongNu} from './trongnu.js';
import {playAim,playCatMouse,playFlag,playSaw,playRowing} from './folk-court.js';
// Explicit, stable metadata/order for the lazy catalogue and both languages.
register({id:'meochuot',icon:'🐱',origin:'vn',name:()=>T('Cat and Mouse','Mèo Đuổi Chuột'),run:playCatMouse});
register({id:'cuopco',icon:'🚩',origin:'vn',name:()=>T('Flag Relay','Cướp Cờ'),run:playFlag});
register({id:'keocua',icon:'🪚',origin:'vn',name:()=>T('Pull Saw Song','Kéo Cưa Lừa Xẻ'),run:playSaw});
register({id:'danhdao',icon:'🪙',origin:'vn',name:()=>T('Đánh Đáo','Đánh Đáo'),run:api=>playAim(api,'disc')});
register({id:'nemcon',icon:'🎯',origin:'vn',name:()=>T('Throw the Còn','Ném Còn'),run:api=>playAim(api,'con')});
register({id:'trongnu',icon:'🌸',origin:'vn',name:()=>T('Flower Stack Jump','Trồng Nụ Trồng Hoa'),run:playTrongNu});
register({id:'duathuyen',icon:'🚣',origin:'vn',name:()=>T('Boat Race','Đua Thuyền'),run:playRowing});
