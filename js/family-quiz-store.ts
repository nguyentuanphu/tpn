import{settings,saveSettings}from './state.js';
import{customQuiz}from './custom.js';
import{cleanFamilyQuiz,type FamilyQuestion}from './content/family-quiz.js';
export function familyQuizQuestions():FamilyQuestion[]{
 const source=settings.familyQuiz===undefined?customQuiz().slice(0,6):settings.familyQuiz;return cleanFamilyQuiz(source)||[];
}
/** Saved only with an explicit grown-up action; retained in the existing private save-copy format. */
export function saveFamilyQuiz(value:unknown):boolean{
 const clean=cleanFamilyQuiz(value);if(!clean)return false;const before=settings.familyQuiz;settings.familyQuiz=clean;
 if(saveSettings()!==true){if(before===undefined)delete settings.familyQuiz;else settings.familyQuiz=before;return false;}
 dispatchEvent(new Event('sv-family-quiz-changed'));return true;
}
