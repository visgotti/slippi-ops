<template>
  <div class="scroll-outer" ref="scrollOuter" :style="scrollOuterStyleObject">
    <div
      class="scroll-inner"
      ref="scrollInner"
      :style="scrollInnerStyleObject"
    >
      <template v-if="autoDetectSizes">
        <div v-for="(item, index) in finalArray" :key="index" class="list-item" :ref="(e) => setItemRef(index, e as HTMLElement)">
          <slot name="default" v-if="item" :item="item" :index="startIndex + index"></slot>
          <slot name="loading" v-else :index="startIndex + index"></slot>
        </div>
      </template>
      <template v-else>
        <div v-for="(item, index) in finalArray" :key="index" class="list-item">
          <slot name="default" v-if="item" :item="item" :index="startIndex + index"></slot>
          <slot name="loading" v-else :index="startIndex + index"></slot>
        </div>
      </template>
     
    </div>
  </div>
</template>

<script lang="ts" setup>

import type { Dataset } from './types';
import { resolveIndexes, fillItemArray } from './calcs';
import { computed, ref, watch, onMounted, onUnmounted, nextTick, toRefs } from 'vue';
import type { PropType, Ref } from 'vue';
import { useDebounce, useThrottle } from '@/composables';

const totalLength = ref(0);
const scrollLength = ref(0);
const scrollMargin = ref(0);
const startIndex = ref(0);
const endIndex = ref(0);
const scrollOuter: Ref<HTMLDivElement> = ref<HTMLDivElement>() as Ref<HTMLDivElement>;
const scrollInner: Ref<HTMLDivElement> = ref<HTMLDivElement>() as Ref<HTMLDivElement>;

const props = defineProps({
  scrollStart: {
    type: Number,
    default: 0,
  },
  scrollThrottle: {
    type: Number,
    default: 0
  },
  scrollDebounce: {
    type: Number,
    default: 0,
  },
  direction: {
    type: String as PropType<'row' | 'column'>,
    default: 'column',
  },
  sortDatasets: {
    type: Boolean,
    default: true,
  },
  data: {
    type: Array as PropType<any>,
    required: false,
  },
  datasets: {
    type: Array as PropType<Dataset[]>,
    required: false,
  },
  itemBuffer: {
    type: Number,
    default: 3,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  itemSize: {
    type: Number,
    required: true,
  },
  minItemSize: {
    type: Number,
    default: 0
  },
  dynamicSizes: {
    type: Object as () => { [itemIndex: string]: number },
    default: null,
  },
  autoDetectSizes: {
    type: Boolean,
    default: false,
  },
});


const { dynamicSizes, autoDetectSizes, direction, datasets, data, sortDatasets } = toRefs(props);
if(props.scrollThrottle && props.scrollDebounce && props.scrollThrottle > props.scrollDebounce) {
  console.warn("Warning: The 'scrollDebounce' prop value is less than the 'scrollThrottle' prop value. This configuration is not recommended because if the debounce delay is shorter than the throttle delay, the debounce functionality becomes redundant. Please set 'scrollDebounce' to be equal to or greater than 'scrollThrottle' to ensure both functionalities work as intended.");
}

const clientLengthProp = computed(() => direction.value === 'column' ? 'clientHeight' : 'clientWidth');
const lengthProp = computed(() => direction.value === 'column' ? 'height' : 'width');
const scrollProp = computed(() => direction.value === 'column' ? 'scrollTop' : 'scrollLeft');
const marginProp = computed(() => direction.value === 'column' ? 'marginTop' : 'marginLeft');
const marginProp2 = computed(() => direction.value === 'column' ? 'marginBottom' : 'marginRight');

const shouldSortDatasets = computed(() => {
  return datasets?.value?.length && sortDatasets.value;
});

const internalDynamicSizes = ref<{ [key: number]: number }>({});
if(dynamicSizes.value && autoDetectSizes.value) {
  internalDynamicSizes.value = {
    ...dynamicSizes.value,
  }
}
const dynamicSizesRef = computed(() => {
  return autoDetectSizes.value ? internalDynamicSizes.value : dynamicSizes.value;
});

watch(dynamicSizesRef, () => {
  handleScroll();
  nextTick(() => {
    handleScroll();
  });
}, { deep: true });


const orderedDatasets = computed(() => {
  const datasetsEnsured = datasets?.value 
    ? datasets.value
    : [{ 
      startingIndex: 0, 
      data: data?.value || []
     }];

  if (!shouldSortDatasets.value) {
    return datasetsEnsured;
  } 
  return datasetsEnsured.sort((a, b) => a.startingIndex - b.startingIndex);
});

const finalArray = computed(() => {
  return fillItemArray({
    orderedDatasets: orderedDatasets.value,
    startIndex: startIndex.value,
    endIndex: endIndex.value,
  });
});

const handleScroll = () => {
  if (!scrollOuter.value) return;

  const resolved = resolveIndexes({
    scrollTop: scrollOuter.value[scrollProp.value],
    viewHeight: scrollOuter.value[clientLengthProp.value],
    ...props,
    dynamicSizes: dynamicSizesRef.value,
  });
  totalLength.value = resolved.totalItemHeight;
  scrollMargin.value = scrollOuter.value[scrollProp.value] - resolved.scrollTopPadding;
  scrollLength.value = totalLength.value - scrollMargin.value;

  if (resolved.startIndex !== startIndex.value || resolved.endIndex !== endIndex.value) {
    startIndex.value = resolved.startIndex;
    endIndex.value = resolved.endIndex;
    emit('load', {
      startIndex: startIndex.value,
      endIndex: endIndex.value,
    });
  }
};

const throttledScroll = props.scrollThrottle ? useThrottle(handleScroll, props.scrollThrottle, props.scrollDebounce || props.scrollThrottle) : handleScroll;
const debouncedScroll = props.scrollDebounce ? useDebounce(handleScroll, props.scrollDebounce) : throttledScroll;

const emit = defineEmits<{
  (e: 'scroll', value: number): void;
  (e: 'load', value: { startIndex: number; endIndex: number }): void;
}>();

onMounted(() => {
  window.addEventListener('scroll', debouncedScroll);
  window.addEventListener('resize', debouncedScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', debouncedScroll);
  window.removeEventListener('resize', debouncedScroll);
  Object.values(resizeObservers).forEach(({ observer }) => observer.disconnect());
  resetOuterObserver();
});

watch(scrollOuter, (v) => {
  if (!v) {
    return;
  }
  initOuterObserver();
  
  scrollOuter.value.onscroll = () => {
    debouncedScroll();
    emit('scroll', scrollOuter.value[scrollProp.value])
  };
  nextTick(() => {
    if(!scrollOuter.value) { return; }
    handleScroll();
    if(!props.scrollStart) {
      return;
    }
    nextTick(() => {
      scrollOuter.value[scrollProp.value] = props.scrollStart;
      handleScroll();
    });
  });
});

const lastToalItems = ref(0);
watch(props, () => {
  if(props.totalItems !== lastToalItems.value) {
    lastToalItems.value = props.totalItems;
    handleScroll();
  }
}, { deep: true });

const scrollOuterStyleObject = computed(() => {
  return {
    [`${lengthProp.value}`]: '100%',
    [`max-${lengthProp.value}`]: '100%',
    [`min-${lengthProp.value}`]: '100%',
  }
});

const scrollInnerStyleObject = computed(() => {
  return {
    ['flex-direction']: direction.value,
    [lengthProp.value]: `${scrollLength.value}px`,
    [`max-${lengthProp.value}`]: `${scrollLength.value}px`,
    [`min-${lengthProp.value}`]: `${scrollLength.value}px`,
    [`${marginProp.value}`]: `${scrollMargin.value}px`,
  }
});


const resizeObservers: {[index: string]: { el: HTMLElement, observer: ResizeObserver } } = {}

let outerResizeObserver : ResizeObserver | null = null;

const resetOuterObserver = () => {
  outerResizeObserver?.disconnect(); 
  outerResizeObserver = null;
}
const initOuterObserver = () => {
  resetOuterObserver();
  if(!scrollOuter.value) {
    return;
  }
  outerResizeObserver = new ResizeObserver(handleScroll);
  outerResizeObserver.observe(scrollOuter.value);
}

watch([startIndex, endIndex], () => {
  Object.keys(resizeObservers).forEach((key) => {
    const observerIndex = parseInt(key);
    if (observerIndex >= startIndex.value && observerIndex <= endIndex.value) {
     return;
    }
    resizeObservers[key].observer.disconnect();
    delete resizeObservers[key];
  });
});

const setItemRef = (index: number, el: HTMLElement) => {
  if (el && autoDetectSizes.value) {
    const finalIndex = startIndex.value + index;
    const computeLength = () => {
      const length = el.getBoundingClientRect()[lengthProp.value];
      const style = window.getComputedStyle(el);
      const margin1 = parseFloat(style[marginProp.value]);
      const margin2 = parseFloat(style[marginProp2.value]);
      const finalLength = Math.max(length + margin1 + margin2, props.minItemSize);
      if(finalLength !== props.itemSize) {
        internalDynamicSizes.value[finalIndex] = finalLength;
      } else {
        delete internalDynamicSizes.value[finalIndex];
      }
    }
    nextTick(() => {
      computeLength();
      const existingObserver = resizeObservers[finalIndex];
      if (existingObserver) {
        if(existingObserver.el === el) {
          return;
        }
        existingObserver.observer.disconnect();
        delete resizeObservers[finalIndex];
      }
      resizeObservers[finalIndex] = { observer: new ResizeObserver(computeLength), el }
    })
  }
};
</script>

<style lang="scss">
.scroll-outer {
  display: inline-block;
  overflow: auto;
}
.scroll-inner {
  overflow: hidden;
  display: flex;
}
.list-item {
  display: inline-block;
}
</style>
