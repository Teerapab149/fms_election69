// รวมสี Text ที่ออกแบบไว้ให้แล้ว
export const PARTY_THEMES = {
  1: { 
    name: 'Purple Power', 
    main: '#7E22CE', 
    secondary: '#7E22CE', 
    gradient: 'from-[#7E22CE] to-[#7E22CE]', 
    middle: ['#7E22CE'], 
    outer: ['#7E22CE'],
    textOnLight: '#581C87', // ม่วงเข้ม (บนพื้นขาว)
    textOnDark: '#E9D5FF'   // ม่วงอ่อน (บนพื้นมืด)
  },
  2: { 
    name: 'Fiery Orange', 
    main: '#EA580C', 
    secondary: '#EA580C', 
    gradient: 'from-[#EA580C] to-[#EA580C]', 
    middle: ['#EA580C'], 
    outer: ['#EA580C'],
    textOnLight: '#9A3412', // ส้มเข้ม
    textOnDark: '#FDBA74'   // ส้มอ่อน
  },
  3: { 
    name: 'Cool Blue', 
    main: '#0284C7', 
    secondary: '#0284C7', 
    gradient: 'from-[#0284C7] to-[#0284C7]', 
    middle: ['#0284C7'], 
    outer: ['#0284C7'],
    textOnLight: '#075985', // น้ำเงินเข้ม
    textOnDark: '#7DD3FC'   // ฟ้าอ่อน
  },
  4: { 
    name: 'Growth Green', 
    main: '#16A34A', 
    secondary: '#16A34A', 
    gradient: 'from-[#16A34A] to-[#16A34A]', 
    middle: ['#16A34A'], 
    outer: ['#16A34A'],
    textOnLight: '#14532D', // เขียวเข้ม
    textOnDark: '#86EFAC'   // เขียวอ่อน
  }
};

export const DEFAULT_THEME = { 
  main: '#334155', 
  secondary: '#334155', 
  gradient: 'from-[#334155] to-[#334155]', 
  middle: ['#334155'], 
  outer: ['#334155'],
  textOnLight: '#0F172A',
  textOnDark: '#E2E8F0'
};