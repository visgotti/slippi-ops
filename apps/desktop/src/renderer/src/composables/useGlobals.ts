import { getCurrentInstance } from 'vue';
import type { CustomProperties } from '../env';
const useGlobals = () : CustomProperties => {
    const instance = getCurrentInstance();
    return instance!.appContext.config.globalProperties as CustomProperties
}

export default useGlobals;