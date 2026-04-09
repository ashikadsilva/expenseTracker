export const PALETTE = [
  '#185FA5','#3B6D11','#BA7517','#534AB7','#0F6E56','#993556',
  '#A32D2D','#D85A30','#D4537E','#639922','#888780','#E24B4A',
  '#3266ad','#1D9E75','#EF9F27','#97C459','#0C447C','#633806','#72243E'
]

export const DEFAULT_CATEGORIES = {
  expense: [
    { name: 'Food', color: '#185FA5' },
    { name: 'Home', color: '#3B6D11' },
    { name: 'Shopping', color: '#BA7517' },
    { name: 'SIP', color: '#534AB7' },
    { name: 'Transportation', color: '#0F6E56' },
    { name: 'Recharge', color: '#993556' },
    { name: 'Investment', color: '#A32D2D' },
    { name: 'Gifts', color: '#D85A30' },
    { name: 'Health/medical', color: '#D4537E' },
    { name: 'Travel', color: '#639922' },
    { name: 'Utilities', color: '#888780' },
    { name: 'Debt', color: '#E24B4A' },
    { name: 'Rent', color: '#3266ad' },
    { name: 'Other', color: '#73726c' },
    { name: 'Union', color: '#1D9E75' },
    { name: 'Mom', color: '#EF9F27' },
    { name: 'Trip', color: '#97C459' },
  ],
  income: [
    { name: 'Paycheck', color: '#3B6D11' },
    { name: 'Credited Amount', color: '#185FA5' },
    { name: 'Savings', color: '#534AB7' },
    { name: 'Bonus', color: '#BA7517' },
    { name: 'Interest', color: '#0F6E56' },
    { name: 'Reward', color: '#D85A30' },
  ]
}

export const SEED_TRANSACTIONS = [
  { id:1, date:'2025-08-01', desc:'Transportation', cat:'Transportation', amount:500, type:'expense', account:'Canara' },
  { id:2, date:'2025-08-01', desc:'Cake', cat:'Home', amount:500, type:'expense', account:'Canara' },
  { id:3, date:'2025-08-01', desc:'Jeans Gift', cat:'Gifts', amount:2048, type:'expense', account:'Canara' },
  { id:4, date:'2025-08-03', desc:'PostOffice Investment', cat:'Investment', amount:60000, type:'expense', account:'Canara' },
  { id:5, date:'2025-08-08', desc:'Food', cat:'Food', amount:120, type:'expense', account:'Canara' },
  { id:6, date:'2025-08-09', desc:'Mom', cat:'Mom', amount:2000, type:'expense', account:'Canara' },
  { id:7, date:'2025-08-18', desc:'Birthday gift', cat:'Gifts', amount:1997, type:'expense', account:'Canara' },
  { id:8, date:'2025-08-23', desc:'Recharge', cat:'Recharge', amount:300.9, type:'expense', account:'Canara' },
  { id:9, date:'2025-08-25', desc:'Savana', cat:'Shopping', amount:1298, type:'expense', account:'Canara' },
  { id:10, date:'2025-08-04', desc:'Salary', cat:'Paycheck', amount:30000, type:'income', account:'Canara' },
  { id:11, date:'2025-08-06', desc:'Food', cat:'Food', amount:445, type:'expense', account:'Union' },
  { id:12, date:'2025-08-09', desc:'Meat & Grocery', cat:'Home', amount:942, type:'expense', account:'Union' },
  { id:13, date:'2025-08-13', desc:'Rent', cat:'Rent', amount:6300, type:'expense', account:'Union' },
  { id:14, date:'2025-08-28', desc:'Ancilla Shopping', cat:'Shopping', amount:580, type:'expense', account:'Union' },
  { id:15, date:'2025-09-01', desc:'Dresses mom sister', cat:'Shopping', amount:2258, type:'expense', account:'Union' },
  { id:16, date:'2025-09-03', desc:'SIP', cat:'SIP', amount:2500, type:'expense', account:'Canara' },
  { id:17, date:'2025-09-13', desc:'Rent', cat:'Rent', amount:6300, type:'expense', account:'Union' },
  { id:18, date:'2025-09-16', desc:'Blood report', cat:'Health/medical', amount:3180, type:'expense', account:'Canara' },
  { id:19, date:'2025-09-23', desc:'Naukri subscription', cat:'Other', amount:408, type:'expense', account:'Canara' },
  { id:20, date:'2025-09-25', desc:'Food shared', cat:'Food', amount:490, type:'expense', account:'Canara' },
  { id:21, date:'2025-09-29', desc:'Salary', cat:'Paycheck', amount:30000, type:'income', account:'Canara' },
  { id:22, date:'2025-10-01', desc:'SIP', cat:'SIP', amount:3500, type:'expense', account:'Canara' },
  { id:23, date:'2025-10-08', desc:'Travel', cat:'Travel', amount:4052, type:'expense', account:'Canara' },
  { id:24, date:'2025-10-14', desc:'Rent', cat:'Rent', amount:6300, type:'expense', account:'Union' },
  { id:25, date:'2025-10-17', desc:'Myntra', cat:'Gifts', amount:1169, type:'expense', account:'Canara' },
  { id:26, date:'2025-10-28', desc:'Doctor visit', cat:'Health/medical', amount:7900, type:'expense', account:'Canara' },
  { id:27, date:'2025-10-10', desc:'New Phone', cat:'Other', amount:18749, type:'expense', account:'Union' },
  { id:28, date:'2025-11-01', desc:'SIP', cat:'SIP', amount:3501, type:'expense', account:'Canara' },
  { id:29, date:'2025-11-13', desc:'Rent', cat:'Rent', amount:6300, type:'expense', account:'Union' },
  { id:30, date:'2025-11-22', desc:'ATM cash', cat:'Transportation', amount:300, type:'expense', account:'Canara' },
  { id:31, date:'2025-11-22', desc:'Ancilla Post Office', cat:'Investment', amount:5000, type:'expense', account:'Canara' },
  { id:32, date:'2025-11-21', desc:'Transfer received', cat:'Credited Amount', amount:10000, type:'income', account:'Canara' },
  { id:33, date:'2025-11-28', desc:'Shopping', cat:'Shopping', amount:6841, type:'expense', account:'Union' },
  { id:34, date:'2025-12-01', desc:'SIP', cat:'SIP', amount:3500, type:'expense', account:'Canara' },
  { id:35, date:'2025-12-03', desc:'Debt repayment', cat:'Debt', amount:6600, type:'expense', account:'Canara' },
  { id:36, date:'2025-12-14', desc:'Union Bank', cat:'Union', amount:6100, type:'expense', account:'Canara' },
  { id:37, date:'2025-12-14', desc:'Rent', cat:'Rent', amount:6300, type:'expense', account:'Union' },
  { id:38, date:'2025-12-19', desc:'Sandals', cat:'Shopping', amount:1100, type:'expense', account:'Canara' },
  { id:39, date:'2025-12-29', desc:'Subscription', cat:'Utilities', amount:950, type:'expense', account:'Union' },
  { id:40, date:'2026-01-02', desc:'SIP', cat:'SIP', amount:3000, type:'expense', account:'Canara' },
  { id:41, date:'2026-01-13', desc:'Rent', cat:'Rent', amount:6300, type:'expense', account:'Union' },
  { id:42, date:'2026-01-24', desc:'Post Office', cat:'Investment', amount:5000, type:'expense', account:'Canara' },
  { id:43, date:'2026-01-26', desc:'Parcel food', cat:'Food', amount:2050, type:'expense', account:'Canara' },
  { id:44, date:'2026-01-08', desc:'Transfer', cat:'Credited Amount', amount:16000, type:'income', account:'Canara' },
  { id:45, date:'2026-02-01', desc:'SIP', cat:'SIP', amount:5000, type:'expense', account:'Canara' },
  { id:46, date:'2026-02-01', desc:'ATM cash', cat:'Transportation', amount:1500, type:'expense', account:'Canara' },
  { id:47, date:'2026-02-14', desc:'Rent', cat:'Rent', amount:6300, type:'expense', account:'Union' },
  { id:48, date:'2026-02-04', desc:'Food shared', cat:'Food', amount:380, type:'expense', account:'Canara' },
  { id:49, date:'2026-02-13', desc:'Cash home', cat:'Home', amount:2000, type:'expense', account:'Canara' },
  { id:50, date:'2026-02-20', desc:'Transfer', cat:'Credited Amount', amount:10000, type:'income', account:'Union' },
]

export const MONTH_LABELS = {
  '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
  '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'
}

export function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return `${MONTH_LABELS[m]} ${y}`
}

export function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function today() {
  return new Date().toISOString().split('T')[0]
}
