export interface ArcadeOnline {mine:number;names:string[];seed?:string;move(n:number,value:number):void;peek?(n:number,seat:number):number|undefined;onMove?(fn:(seat:number,n:number,value:number)=>void):void|(()=>void);connected?():boolean;present?(seat:number):boolean;leave?():void;}

export const controlsArcadeTurn=(turn:number,mine:number,online:boolean,helper:boolean)=>online?turn===mine:!helper||turn===mine;

/** Ordered, host-committed family commands. Not a trusted anti-cheat backend. */
export class ArcadeSession<S extends { turn: number }> {
  state: S; index = 0; online: ArcadeOnline | undefined; readonly mine: number;
  private reduce: (state:S,value:number)=>S|null; private changed:()=>void;
  private tape: number[] = []; private pending = new Map<number, number>();
  private request: { index: number; value: number } | undefined;
  private maxCommands:number;private commitOffset:number;private syncMin:number;private syncMax:number;
  private unsubscribe: (() => void) | undefined; private dead = false; private sync = 0;
  constructor(initial: S, online: ArcadeOnline | undefined, reduce: (state: S, value: number) => S | null, changed: () => void,protocol={maxCommands:1900,commitOffset:2000,syncMin:8000,syncMax:8900}) {
    this.maxCommands=protocol.maxCommands;this.commitOffset=protocol.commitOffset;this.syncMin=protocol.syncMin;this.syncMax=protocol.syncMax;
    if(![this.maxCommands,this.commitOffset,this.syncMin,this.syncMax].every(Number.isInteger)||this.maxCommands<1||this.commitOffset<this.maxCommands||this.commitOffset+this.maxCommands>this.syncMin||this.syncMax>10000||this.syncMax<=this.syncMin)throw Error('Invalid ordered command ranges');
    this.reduce=reduce;this.changed=changed;this.state = initial;this.online = online;this.mine = online?.mine || 0;
    const off = online?.onMove?.((seat, n, value) => this.receive(seat, n, value));
    if (typeof off === 'function') this.unsubscribe = off;this.catchup();
  }
  private catchup(){
    if(this.dead||!this.online||this.mine===0||!this.online.peek)return;
    while(true){const index=this.index,value=this.online.peek(index+this.commitOffset,0);if(typeof value!=='number')break;this.receive(0,index+this.commitOffset,value);if(this.index===index)break;}
  }
  get busy(){return !!this.request;}
  get waiting() { return !!this.online && (this.online.connected?.() === false || this.online.names.some((_, seat) => this.online?.present?.(seat) === false)); }
  submit(value: number) {
    if (this.dead || this.waiting || this.request || this.online && this.state.turn !== this.mine || this.index >= this.maxCommands) return false;
    if (!this.reduce(this.state, value)) return false;
    if (!this.online || this.mine === 0) this.accept(this.state.turn, this.index, value);
    else { this.request = {index:this.index,value};this.online.move(this.index,value); }
    return true;
  }
  private accept(seat: number, n: number, value: number) {
    if (n !== this.index || seat !== this.state.turn) return;
    const next = this.reduce(this.state,value);if (!next) return;
    this.tape[n] = value;this.state = next;this.index++;this.request = undefined;
    this.online?.move(n + this.commitOffset,value);this.changed();
  }
  private receive(seat: number, n: number, value: number) {
    if(this.dead || !Number.isInteger(n) || !Number.isInteger(value) || value < 0 || value > 9999 || !this.online) return;
    if(this.mine===0){
      if(n>=this.syncMin && n<this.syncMax){if(value<=this.tape.length)for(let i=value;i<this.tape.length;i++)this.online?.move(i+this.commitOffset,this.tape[i]);return;}
      if(n>=0 && n<this.maxCommands){if(n<this.index){const old=this.tape[n];if(old!==undefined)this.online.move(n+this.commitOffset,old);}else this.accept(seat,n,value);}
      return;
    }
    if(seat!==0 || n<this.commitOffset || n>=this.commitOffset+this.maxCommands || n-this.commitOffset<this.index)return;
    this.pending.set(n-this.commitOffset,value);
    while(this.pending.has(this.index)){
      const v=this.pending.get(this.index)!;const next=this.reduce(this.state,v);if(!next)break;
      this.pending.delete(this.index);this.tape[this.index]=v;this.state=next;this.index++;this.request=undefined;
    }
    this.changed();
  }
  poll(){if(this.dead||!this.online)return;this.catchup();if(this.request)this.online.move(this.request.index,this.request.value);if(this.mine!==0)this.online.move(this.syncMin+(this.sync++%(this.syncMax-this.syncMin)),this.index);}
  continueLocally(){this.online?.leave?.();this.online=undefined;this.request=undefined;this.pending.clear();this.changed();}
  close(){this.dead=true;this.unsubscribe?.();this.pending.clear();}
}
