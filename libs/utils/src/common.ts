import { MatchTrackerOptions } from "@slippiops/types";

export function darkenColor(hexColor: string, percent: number) {
    // Convert the hex color to RGB
    const num = parseInt(hexColor.replace('#', ''), 16);

    // Extract the RGB values
    let R = (num >> 16);
    let G = (num >> 8) & 0x00FF;
    let B = num & 0x0000FF;

    // Darken each color component
    R = Math.round(R * (1 - percent));
    G = Math.round(G * (1 - percent));
    B = Math.round(B * (1 - percent));

    // Return the new color in RGB format
    return `rgb(${R}, ${G}, ${B})`;
}

export function getTimeAgoString(date: Date | number) {
  const now = new Date();
  date = typeof date === "number" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - (<Date>date).getTime()) / 1000);

  const intervals: { [key: string]: number } = {
    year: 60 * 60 * 24 * 365,
    month: 60 * 60 * 24 * 30,
    week: 60 * 60 * 24 * 7,
    day: 60 * 60 * 24,
    hour: 60 * 60,
    minute: 60
  };

  for (const interval in intervals) {
    const value = Math.floor(diffInSeconds / intervals[interval]);
    if (value >= 1) {
      return `${value} ${interval}${value > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

export function unique<T>(array: T[])  : T[] {
  return array.filter((item, index) => array.indexOf(item) === index);
}

export function isNullOrUndefined(v: any) {
  return v === undefined || v === null;
}

export function uniqueIgnoreCase(array: string[]) : string[] {
  const seen = new Set();
  return array.filter(item => {
    const lowerItem = item.toLowerCase();
    if (seen.has(lowerItem)) {
      return false;
    } else {
      seen.add(lowerItem);
      return true;
    }
  });
}

export function updateInArray(array: Array<any>, item: any, prop: string) {
  if (!Array.isArray(array)) {
      throw new Error("First argument must be an array");
  }

  const index = array.findIndex(element => element[prop] === item[prop]) 
  if (index === -1) {
    throw new Error("Item not found in array");
  }

  array[index] = item;
  return array;
}

export function arraysDeepEqual(array1: any[], array2: any[]) {
  if (array1.length !== array2.length) {
    return false;
  }
  return JSON.stringify([...array1].sort()) === JSON.stringify([...array2].sort());
}

export function sortedStringify(obj: any) : string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(sortedStringify).join(',') + ']';
  }

  const sortedObj : any = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = sortedStringify(obj[key]);
  });

  return JSON.stringify(sortedObj);
}

export function deepEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  keys1.sort();
  keys2.sort();

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) {
      return false;
    }

    if (!deepEqual(obj1[keys1[i]], obj2[keys2[i]])) {
      return false;
    }
  }

  return true;
}

export function removeFromArray(array: Array<any>, item: any, prop?: string) {
  const index = prop 
  ? array.findIndex(element => element[prop] === item[prop]) 
  : array.indexOf(item);

  if (index !== -1) {
    array.splice(index, 1);
  }
}

export function jsonCopy<T>(object: T) : T {
  return JSON.parse(JSON.stringify(object));
}

export function insertOrderedByProp(array: Array<any>, obj: any, prop: string) {
  const insertIndex = array.findIndex((item, index) => {
    return item[prop] <= obj[prop] && (index === array.length - 1 || array[index + 1][prop] > obj[prop]);
  });

  if (insertIndex === -1) {
    array.push(obj);
  } else {
    array.splice(insertIndex + 1, 0, obj);
  }

  return array;
}

export function intersectArrayIgnoreCase(array1: string[], array2: string[]) : string[] {
  const lowerArray2 = array2.map(a => a.toLowerCase());
    return array1.filter(item => lowerArray2.includes(item.toLowerCase()));
}
export function includesIgnoreCase(array: string[], item: string) {
  return array.map(a => a.toLowerCase()).includes(item.toLowerCase());
}

export function upsertArray<T extends Record<string, any>>(array: T[], newItem: T, prop: keyof T): boolean {
  const index = array.findIndex(item => item[prop] === newItem[prop]);

  if (index !== -1) {
    array.splice(index, 1, newItem); // Replace the item
    return true;
  } else {
    array.push(newItem); // Push the new item
    return false
  }
}

export async function asyncTimeout(ts: number){ 
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve(true);
    }, ts);
  })
}
export function fixFloat(float: number, decimalPlaces: number) {
  return parseFloat(float.toFixed(decimalPlaces));
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}



export function compareArrays(a1: (number | string)[], a2: (number | string)[]) {
  if(a1.length !== a2.length) {
    return false;
  }
  const a1sorted = ([...a1]).sort();
  const a2sorted = ([...a2]).sort();

  return a1sorted.every((v, i) => v === a2sorted[i]);
}

export const defaultTrackerOptions = () => {  
  const defaultOptions : MatchTrackerOptions = {
    useCpus: 1,
    autodetectCodes: true,
    processParallel: true,
    currentCodes: [],
    disableLiveTracking: false,
    pathToReplays: '',
    pathToDb: './slippi-ops.db',
    recursivelyAllPaths: true,
  }
  return defaultOptions;
}

export function setMultipleTimeouts(cb: any, timeouts: number[]) {
  timeouts.forEach((timeout) => {
    if(!timeout) {
      try { cb();
      } catch(e) { console.error(e); }
      return;
    }
    setTimeout(() => {
      try { cb();
      } catch(e) { console.error(e); }
    }, timeout);
  });
}