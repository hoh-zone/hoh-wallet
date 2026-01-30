// content-script.ts

// Inject the script
function injectScript(file: string) {
  try {
    const container = document.head || document.documentElement;
    const script = document.createElement('script');
    script.setAttribute('type', 'module');
    script.setAttribute('src', chrome.runtime.getURL(file));
    container.insertBefore(script, container.children[0]);
    container.removeChild(script);
  } catch (e) {
    console.error('HOH Wallet injection failed', e);
  }
}

injectScript('assets/inject.js');

// Message Stream: DApp <-> Content <-> Background

// 1. Listen from DApp (Inject)
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.target !== 'HOH_WALLET_CONTENT') {
    return;
  }
  
  // Forward to Background
  chrome.runtime.sendMessage(event.data.payload, (response) => {
    // Send response back to DApp
    window.postMessage({
      target: 'HOH_WALLET_INJECT',
      requestId: event.data.payload.id,
      payload: response
    }, window.location.origin);
  });
});
