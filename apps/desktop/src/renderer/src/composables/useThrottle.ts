import { ref } from 'vue';

export function useThrottle(fn: Function, delay: number, debounce?: number) {
  const lastCalled = ref(0);
  let timeoutId: any = null;

  function throttle(func: Function, wait: number) {
    const now = Date.now();
    if (now - lastCalled.value >= wait) {
      lastCalled.value = now;
      func();
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else if (!timeoutId && debounce) {
      timeoutId = setTimeout(() => {
        lastCalled.value = Date.now();
        func();
        timeoutId = null;
      }, debounce);
    }
  }

  const throttledFn = (...args: any[]) => throttle(() => fn(...args), delay);
  return throttledFn;
}
