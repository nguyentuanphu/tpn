import{cleanFamilyQuiz,type FamilyQuestion}from '../content/family-quiz.js';
export type QuizState={questions:FamilyQuestion[];gentle:boolean;seats:number;turn:number;round:number;phase:'answer'|'reveal';answers:number[];scores:number[];complete:boolean};
export function quizStart(questions:unknown,gentle:boolean,seats:number):QuizState{
 const clean=cleanFamilyQuiz(questions);if(!clean?.length||!Number.isInteger(seats)||seats<1||seats>6)throw Error('Invalid private quiz snapshot');
 return{questions:clean,gentle,seats,turn:0,round:0,phase:'answer',answers:Array(seats).fill(-1),scores:Array(seats).fill(0),complete:false};
}
/** Answer indices0–5;6 advances a host-controlled reveal. Gentle misses stay with the same child. */
export function quizCommand(s:QuizState,value:number):QuizState|null{
 if(s.complete||!Number.isInteger(value))return null;
 if(s.phase==='reveal')return value===6?{...s,round:s.round+1,phase:'answer',turn:0,answers:Array(s.seats).fill(-1),complete:s.round+1===s.questions.length}:null;
 const q=s.questions[s.round];if(value<0||value>=q.answers.length||s.gentle&&value!==q.right)return null;
 const answers=[...s.answers],scores=[...s.scores];answers[s.turn]=value;if(value===q.right)scores[s.turn]++;
 const last=s.turn+1===s.seats;return{...s,answers,scores,phase:last?'reveal':'answer',turn:last?0:s.turn+1};
}
