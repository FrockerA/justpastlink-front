import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple date formatter
export function format(date: Date, formatStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const map: Record<string, string> = {
    'yyyy': date.getFullYear().toString(),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'MMM': months[date.getMonth()],
    'dd': String(date.getDate()).padStart(2, '0'),
    'd': date.getDate().toString(),
    'HH': String(date.getHours()).padStart(2, '0'),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'ss': String(date.getSeconds()).padStart(2, '0'),
  };

  return formatStr.replace(/yyyy|MMM|MM|dd|d|HH|mm|ss/g, (match) => map[match] || match);
}
