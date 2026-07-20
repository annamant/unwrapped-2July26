(() => {
  const text = atob(window.__domB64);
  const el = document.querySelector('textarea');
  if (!el) return {ok:false, reason:'no textarea'};
  const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
  proto.set.call(el, text);
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
  // Also try React-style setter
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  nativeInputValueSetter.call(el, text);
  el.dispatchEvent(new InputEvent('input', {bubbles:true, data: text, inputType: 'insertFromPaste'}));
  return {ok:true, lines: text.split('\n').filter(Boolean).length, valueLen: el.value.length};
})()