/* Moneo offline financial extensions. No network, paid APIs, or external service. */
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.AnaAdvanced = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const fresh = () => ({ transfers: [], goals: [], allocations: [], recurring: [], debts: [], payments: [], adjustments: [], settings: { rollover: false, alertPercent: 80 } });
  const state = book => ({ ...fresh(), ...(book.advanced || {}), settings: { ...fresh().settings, ...(book.advanced?.settings || {}) } });
  const withState = (book, next) => ({ ...book, advanced: next });
  const id = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
  const validDate = v => { if (!/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(v||'')) return false; const [y,m,d]=v.split('-').map(Number), n = new Date(y,m-1,d); return n.getFullYear()===y&&n.getMonth()+1===m&&n.getDate()===d; };
  const amount = v => Number.isSafeInteger(v) && v>0 && v<1e15;
  const exists = (book, account) => book.accounts.some(a=>a.id===account);
  const check = (c, m) => { if (!c) throw Error(m); };
  const validName = v => typeof v==='string'&&v.trim().length>0&&v.trim().length<=80;
  const validId = v => typeof v==='string'&&/^[a-zA-Z0-9_-]{1,90}$/.test(v);
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  function addTransfer(book, t, editId) {
    check(exists(book,t.from)&&exists(book,t.to)&&t.from!==t.to,'Pilih dua dompet berbeda.');
    check(validDate(t.date)&&amount(t.amount),'Tanggal atau nominal transfer tidak valid.');
    check(!t.note||String(t.note).length<=160,'Catatan terlalu panjang.');
    const s=state(book);if(editId)check(s.transfers.some(x=>x.id===editId),'Transfer tidak ditemukan.');
    const row={id:editId||id('trf'),date:t.date,from:t.from,to:t.to,amount:t.amount,note:String(t.note||'').trim()};
    return withState(book,{...s,transfers:editId?s.transfers.map(x=>x.id===editId?row:x):[row,...s.transfers]});
  }
  function deleteTransfer(book,key){const s=state(book);check(s.transfers.some(t=>t.id===key),'Transfer tidak ditemukan.');return withState(book,{...s,transfers:s.transfers.filter(t=>t.id!==key)});}
  function accountDelta(book,accountId){const s=state(book);let x=0;
    for(const t of s.transfers){if(t.from===accountId)x-=t.amount;if(t.to===accountId)x+=t.amount;}
    for(const d of s.debts){if(d.accountId===accountId)x+=d.type==='payable'?d.principal:-d.principal;}
    const debtById=new Map(s.debts.map(d=>[d.id,d]));
    for(const p of s.payments){const d=debtById.get(p.debtId);if(d&&p.accountId===accountId)x+=d.type==='payable'?-p.amount:p.amount;}
    for(const a of s.adjustments){if(a.accountId===accountId)x+=a.delta;}
    return x;
  }
  function reconcile(book,r){check(exists(book,r.accountId)&&validDate(r.date)&&Number.isSafeInteger(r.actual)&&Math.abs(r.actual)<1e15,'Tanggal, dompet, atau saldo aktual tidak valid.');
    const delta=r.actual-accountBalance(book,r.accountId);check(Number.isSafeInteger(delta)&&Math.abs(delta)<1e15,'Selisih saldo terlalu besar.');
    if(!delta)return book;const s=state(book);return withState(book,{...s,adjustments:[{id:id('adj'),accountId:r.accountId,date:r.date,delta,note:'Rekonsiliasi saldo'},...s.adjustments]});
  }
  function deleteAdjustment(book,key){const s=state(book);return withState(book,{...s,adjustments:s.adjustments.filter(r=>r.id!==key)});}
  const accountBalance = (book, accountId) => (book.accounts.find(a=>a.id===accountId)?.openingBalance||0)+book.entries.reduce((s,t)=>s+(t.accountId===accountId?(t.kind==='income'?t.amount:-t.amount):0),0)+accountDelta(book,accountId);
  const totalBalance = book => book.accounts.reduce((s,a)=>s+accountBalance(book,a.id),0);
  function saveGoal(book,g) {const s=state(book);check(validName(g.name)&&amount(g.target),'Isi nama dan target tabungan yang valid.');
    check(!g.deadline||validDate(g.deadline),'Tenggat tabungan tidak valid.');
    if(g.id)check(s.goals.some(x=>x.id===g.id),'Tujuan tidak ditemukan.');
    const row={id:g.id||id('goal'),name:g.name.trim(),target:g.target,deadline:g.deadline||''};
    return withState(book,{...s,goals:g.id?s.goals.map(x=>x.id===g.id?row:x):[...s.goals,row]});
  }
  const goalBalance = (book,goalId)=>state(book).allocations.reduce((n,a)=>n+(a.goalId===goalId?a.amount:0),0);
  function allocate(book,g){const s=state(book);check(s.goals.some(x=>x.id===g.goalId),'Tujuan tidak ditemukan.');check(exists(book,g.accountId),'Dompet tidak ditemukan.');check(validDate(g.date)&&amount(Math.abs(g.amount)),'Tanggal atau nominal tidak valid.');
    const old=s.allocations.filter(a=>a.goalId===g.goalId&&a.accountId===g.accountId).reduce((n,a)=>n+a.amount,0);check(old+g.amount>=0,'Dana tujuan pada dompet ini tidak mencukupi.');
    if(g.amount>0){const tied=s.allocations.filter(a=>a.accountId===g.accountId).reduce((n,a)=>n+a.amount,0);
      check(accountBalance(book,g.accountId)-tied>=g.amount,'Saldo bebas dompet tidak cukup untuk alokasi ini.');}
    return withState(book,{...s,allocations:[{id:id('alc'),goalId:g.goalId,accountId:g.accountId,date:g.date,amount:g.amount},...s.allocations]});
  }
  function deleteGoal(book,key){const s=state(book);check(goalBalance(book,key)===0,'Kosongkan alokasi tujuan sebelum menghapusnya.');return withState(book,{...s,goals:s.goals.filter(g=>g.id!==key),allocations:s.allocations.filter(a=>a.goalId!==key)});}
  function addRecurring(book,r,editId){const s=state(book);check(validName(r.name)&&exists(book,r.accountId),'Nama atau dompet tidak valid.');
    check(book.categories.some(c=>c.id===r.categoryId&&c.kind===r.kind),'Kategori belum sesuai jenis transaksi.');
    check(amount(r.amount)&&validDate(r.startDate),'Nominal atau tanggal awal tidak valid.');
    if(editId)check(s.recurring.some(x=>x.id===editId),'Jadwal tidak ditemukan.');
    const old=s.recurring.find(x=>x.id===editId);const row={id:editId||id('rec'),name:r.name.trim(),kind:r.kind,categoryId:r.categoryId,accountId:r.accountId,amount:r.amount,startDate:r.startDate,active:old?old.active:true};
    return withState(book,{...s,recurring:editId?s.recurring.map(x=>x.id===editId?row:x):[row,...s.recurring]});
  }
  function dueDate(r,period){const [y,m]=period.split('-').map(Number);const day=Math.min(Number(r.startDate.slice(8)),new Date(y,m,0).getDate());return `${period}-${String(day).padStart(2,'0')}`;}
  function scheduled(book,asOf=today()){const s=state(book);const period=asOf.slice(0,7);
    return s.recurring.filter(r=>r.active&&r.startDate.slice(0,7)<=period).map(r=>({...r,runId:`auto-${r.id}-${period.replace('-','')}`,date:dueDate(r,period)})).filter(r=>r.date<=asOf&&!book.entries.some(e=>e.id===r.runId));
  }
  function postDue(book,asOf=today()){const due=scheduled(book,asOf);if(!due.length)return book;
    const rows=due.map(r=>({id:r.runId,date:r.date,kind:r.kind,accountId:r.accountId,categoryId:r.categoryId,amount:r.amount,note:`Rutin: ${r.name}`}));
    return {...book,entries:[...rows,...book.entries]};
  }
  function toggleRecurring(book,key){const s=state(book);return withState(book,{...s,recurring:s.recurring.map(r=>r.id===key?{...r,active:!r.active}:r)});}
  function deleteRecurring(book,key){const s=state(book);return withState(book,{...s,recurring:s.recurring.filter(r=>r.id!==key)});}
  function addDebt(book,d){check(validName(d.name)&&['payable','receivable'].includes(d.type),'Nama atau jenis utang tidak valid.');
    check(exists(book,d.accountId)&&validDate(d.date)&&amount(d.principal),'Dompet, tanggal, atau nominal tidak valid.');
    const s=state(book);return withState(book,{...s,debts:[{id:id('debt'),name:d.name.trim(),type:d.type,accountId:d.accountId,date:d.date,principal:d.principal},...s.debts]});
  }
  const debtRemaining = (book,debtId)=>{const s=state(book);return (s.debts.find(d=>d.id===debtId)?.principal||0)-s.payments.filter(p=>p.debtId===debtId).reduce((n,p)=>n+p.amount,0);};
  function payDebt(book,p){const s=state(book);check(s.debts.some(d=>d.id===p.debtId),'Utang/piutang tidak ditemukan.');
    check(exists(book,p.accountId)&&validDate(p.date)&&amount(p.amount),'Dompet, tanggal atau nominal tidak valid.');
    check(debtRemaining(book,p.debtId)>=p.amount,'Pelunasan melebihi sisa utang/piutang.');
    return withState(book,{...s,payments:[{id:id('pay'),date:p.date,debtId:p.debtId,accountId:p.accountId,amount:p.amount},...s.payments]});
  }
  function deletePayment(book,key){const s=state(book);check(s.payments.some(p=>p.id===key),'Pelunasan tidak ditemukan.');return withState(book,{...s,payments:s.payments.filter(p=>p.id!==key)});}
  function deleteDebt(book,key){const s=state(book);check(!s.payments.some(p=>p.debtId===key),'Hapus pelunasan terlebih dahulu.');return withState(book,{...s,debts:s.debts.filter(d=>d.id!==key)});}
  function netWorth(book){const s=state(book);return totalBalance(book)+s.debts.reduce((v,d)=>v+(d.type==='receivable'?1:-1)*debtRemaining(book,d.id),0);}
  function rollover(book,period,categoryId){const s=state(book);if(!s.settings.rollover)return 0;
    const y=Number(period.slice(0,4)),m=Number(period.slice(5));let cursor=new Date(y,m-2,1); let carry=0;
    const months=[];for(let i=0;i<12;i++){months.unshift(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}`);cursor.setMonth(cursor.getMonth()-1);}
    for(const p of months){const planned=book.budgets[`${p}|${categoryId}`]||0;
      const used=book.entries.reduce((v,e)=>v+(e.categoryId===categoryId&&e.kind==='expense'&&e.date.startsWith(p)?e.amount:0),0);
      carry=Math.max(0,planned+carry-used);
    }
    return carry;
  }
  const plannedBudget=(book,period,categoryId)=>(book.budgets[`${period}|${categoryId}`]||0)+rollover(book,period,categoryId);
  function forecast(book,period){const s=state(book),start=`${period}-01`,end=new Date(Number(period.slice(0,4)),Number(period.slice(5)),0).getDate(),last=`${period}-${String(end).padStart(2,'0')}`;
    const future=s.recurring.filter(r=>r.active&&r.startDate<=last).map(r=>({...r,date:dueDate(r,period),runId:`auto-${r.id}-${period.replace('-','')}`})).filter(r=>r.date>=start&&!book.entries.some(e=>e.id===r.runId));
    const net=future.reduce((n,r)=>n+(r.kind==='income'?r.amount:-r.amount),0);
    return {pending:future,net,projected:totalBalance(book)+net};
  }
  function setOptions(book,settings){const s=state(book);check(typeof settings.rollover==='boolean'&&Number.isInteger(settings.alertPercent)&&settings.alertPercent>=50&&settings.alertPercent<=100,'Pengaturan anggaran tidak valid.');return withState(book,{...s,settings:{...settings}});}
  function validate(book){const s=book.advanced;if(s===undefined)return true;
    if(!s||typeof s!=='object'||Array.isArray(s))return false;
    const arrays=['transfers','goals','allocations','recurring','debts','payments','adjustments'];
    if(arrays.some(k=>!Array.isArray(s[k])||s[k].length>100000))return false;
    if(!s.settings||typeof s.settings.rollover!=='boolean'||!Number.isInteger(s.settings.alertPercent)||s.settings.alertPercent<50||s.settings.alertPercent>100)return false;
    const ids=new Set(), take=(row)=>{if(!row||!validId(row.id)||ids.has(row.id))return false;ids.add(row.id);return true;};
    for(const t of s.transfers){if(!take(t)||!exists(book,t.from)||!exists(book,t.to)||t.from===t.to||!validDate(t.date)||!amount(t.amount)||typeof t.note!=='string'||t.note.length>160)return false;}
    for(const a of s.adjustments){if(!take(a)||!exists(book,a.accountId)||!validDate(a.date)||!Number.isSafeInteger(a.delta)||!a.delta||Math.abs(a.delta)>=1e15||typeof a.note!=='string'||a.note.length>160)return false;}
    const goalIds=new Set();for(const g of s.goals){if(!take(g)||!validName(g.name)||!amount(g.target)||!(g.deadline===''||validDate(g.deadline)))return false;goalIds.add(g.id);}
    const allocTotals=new Map();for(const a of s.allocations){if(!take(a)||!goalIds.has(a.goalId)||!exists(book,a.accountId)||!validDate(a.date)||!amount(Math.abs(a.amount)))return false;const k=a.goalId+'|'+a.accountId;allocTotals.set(k,(allocTotals.get(k)||0)+a.amount);}
    if([...allocTotals.values()].some(x=>x<0))return false;
    for(const r of s.recurring){if(!take(r)||!validName(r.name)||!exists(book,r.accountId)||!book.categories.some(c=>c.id===r.categoryId&&c.kind===r.kind)||!amount(r.amount)||!validDate(r.startDate)||typeof r.active!=='boolean')return false;}
    const debtIds=new Set();for(const d of s.debts){if(!take(d)||!validName(d.name)||!['payable','receivable'].includes(d.type)||!exists(book,d.accountId)||!validDate(d.date)||!amount(d.principal))return false;debtIds.add(d.id);}
    const paid=new Map();for(const p of s.payments){if(!take(p)||!debtIds.has(p.debtId)||!exists(book,p.accountId)||!validDate(p.date)||!amount(p.amount))return false;paid.set(p.debtId,(paid.get(p.debtId)||0)+p.amount);}
    if(s.debts.some(d=>(paid.get(d.id)||0)>d.principal))return false;
    return true;
  }
  return {fresh,state,withState,today,addTransfer,deleteTransfer,accountDelta,accountBalance,totalBalance,reconcile,deleteAdjustment,saveGoal,goalBalance,allocate,deleteGoal,addRecurring,scheduled,postDue,toggleRecurring,deleteRecurring,addDebt,debtRemaining,payDebt,deletePayment,deleteDebt,netWorth,rollover,plannedBudget,forecast,setOptions,validate};
});
