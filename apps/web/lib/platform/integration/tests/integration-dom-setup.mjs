import { Window } from 'happy-dom';
import * as React from 'react';

let domWindow;

export function setupIntegrationDom() {
  teardownIntegrationDom();

  domWindow = new Window({ url: 'https://localhost/' });

  globalThis.React = React;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: domWindow,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    writable: true,
    value: domWindow.document,
  });
  Object.defineProperty(globalThis, 'HTMLElement', {
    configurable: true,
    writable: true,
    value: domWindow.HTMLElement,
  });
  Object.defineProperty(globalThis, 'Node', {
    configurable: true,
    writable: true,
    value: domWindow.Node,
  });
  Object.defineProperty(globalThis, 'MutationObserver', {
    configurable: true,
    writable: true,
    value: domWindow.MutationObserver,
  });

  if (typeof globalThis.requestAnimationFrame !== 'function') {
    globalThis.requestAnimationFrame = (callback) =>
      domWindow.setTimeout(callback, 0);
    globalThis.cancelAnimationFrame = (id) => domWindow.clearTimeout(id);
  }

  return domWindow;
}

export function teardownIntegrationDom() {
  if (domWindow !== undefined) {
    void domWindow.happyDOM?.cancelAsync();
    domWindow.document.body.innerHTML = '';
    domWindow.close();
    domWindow = undefined;
  }

  for (const key of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'Node',
    'MutationObserver',
    'React',
    'IS_REACT_ACT_ENVIRONMENT',
  ]) {
    if (Object.prototype.hasOwnProperty.call(globalThis, key)) {
      delete globalThis[key];
    }
  }
}
