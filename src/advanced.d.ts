declare const AnaAdvanced: {
  fresh(): any; state(book:any): any; today(): string;
  addTransfer(book:any,t:any,editId?:string):any; deleteTransfer(book:any,id:string):any;
  accountDelta(book:any,id:string):number; accountBalance(book:any,id:string):number; totalBalance(book:any):number;reconcile(book:any,r:any):any;deleteAdjustment(book:any,id:string):any;
  saveGoal(book:any,g:any):any; goalBalance(book:any,id:string):number; allocate(book:any,g:any):any; deleteGoal(book:any,id:string):any;
  addRecurring(book:any,r:any,editId?:string):any; scheduled(book:any,date?:string):any[]; postDue(book:any,date?:string):any;
  toggleRecurring(book:any,id:string):any;deleteRecurring(book:any,id:string):any;
  addDebt(book:any,d:any):any; debtRemaining(book:any,id:string):number;payDebt(book:any,p:any):any;deletePayment(book:any,id:string):any; deleteDebt(book:any,id:string):any;
  netWorth(book:any):number;rollover(book:any,period:string,categoryId:string):number;
  plannedBudget(book:any,period:string,categoryId:string):number;forecast(book:any,period:string):any;
  setOptions(book:any,settings:any):any;validate(book:any):boolean;
};
export = AnaAdvanced;
