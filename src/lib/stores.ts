/**
 * @fileoverview Svelte stores
 */

//Import
import {writable} from 'svelte/store';

/**
 * Create global error state
 */
const createError = () =>
{
  //State
  const {set, subscribe, update} = writable({
    text: '',
    visible: false
  });

  /**
   * Show an error
   * @param text Error text
   */
  const show = (text: string) => set({
    text,
    visible: true
  });

  /**
   * Close the error
   */
  const close = () => update(value => ({
    ...value,
    visible: false
  }));

  //Auto-hide
  subscribe(value =>
  {
    if (value.visible)
    {
      setTimeout(close, 5000);
    }
  });

  return {
    close,
    show,
    subscribe
  };
};

/**
 * Global error state
 */
export const error = createError();