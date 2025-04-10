import { format, parseISO, startOfWeek, endOfWeek, addDays, isSameDay, differenceInDays } from 'date-fns';

export function getWeekDates(date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Start with Monday
  const weekDays: Date[] = [];
  
  // Get all 5 weekdays (Monday to Friday)
  for (let i = 0; i < 5; i++) {
    weekDays.push(addDays(start, i));
  }
  
  return weekDays;
}

export function getWeekDateStrings(date = new Date()): string[] {
  return getWeekDates(date).map(d => format(d, 'yyyy-MM-dd'));
}

export function formatWeekRange(date = new Date()): string {
  const weekDates = getWeekDates(date);
  const start = format(weekDates[0], 'MMMM d');
  const end = format(weekDates[4], 'MMMM d, yyyy');
  
  return `${start} - ${end}`;
}

export function formatDate(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'MMMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'MMMM d, yyyy • h:mm a');
}

export function formatDay(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'EEE');
}

export function getWeekStart(date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(date = new Date()): Date {
  return addDays(endOfWeek(date, { weekStartsOn: 1 }), -2); // Friday
}

export function isToday(date: Date | string): boolean {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isSameDay(parsedDate, new Date());
}

export function getDaysDiff(date1: Date | string, date2: Date | string): number {
  const parsedDate1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const parsedDate2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return differenceInDays(parsedDate2, parsedDate1);
}
