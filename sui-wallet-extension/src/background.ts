// Service Worker
// Manages popup windows for approvals

let approvalWindowId: number | null = null;
let requestResolver: ((value: any) => void) | null = null;
let requestRejecter: ((reason: any) => void) | null = null;

// Listen for messages from Content Script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { method, params } = message;

  // If this is an approval result from the popup, don't handle it as a request
  if (message.type === 'APPROVAL_RESULT') return;

  handleRequest(method, params).then(result => {
    sendResponse({ data: result });
  }).catch(error => {
    sendResponse({ error: error.message });
  });

  return true; // Async response
});

async function handleRequest(method: string, params: any) {
  if (method === 'connect') {
    return openApprovalWindow('connect', params);
  }
  
  if (method === 'signTransactionBlock' || method === 'signAndExecuteTransactionBlock') {
    return openApprovalWindow(method, params);
  }

  throw new Error('Method not supported');
}

async function openApprovalWindow(method: string, params: any) {
  // Close existing window if any
  if (approvalWindowId !== null) {
    try {
      await chrome.windows.remove(approvalWindowId);
    } catch(e) {}
  }

  // Store request data in chrome.storage.local to pass to Popup
  await chrome.storage.local.set({ 
    pendingRequest: { method, params } 
  });

  // Create Popup Window
  const popup = await chrome.windows.create({
    url: 'index.html#/approve', // Route to approval page
    type: 'popup',
    width: 360,
    height: 600
  });

  if (popup && popup.id) {
    approvalWindowId = popup.id;
  }

  // Wait for user action
  return new Promise((resolve, reject) => {
    requestResolver = resolve;
    requestRejecter = reject;

    // Listen for window close (rejection)
    chrome.windows.onRemoved.addListener((id) => {
      if (id === approvalWindowId) {
        // If window is closed and we haven't resolved yet
        if (requestRejecter) {
             requestRejecter(new Error('User rejected'));
             // Reset resolvers to prevent double call
             requestResolver = null;
             requestRejecter = null;
        }
        approvalWindowId = null;
      }
    });
  });
}

// Listen for messages from the Approval Popup
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'APPROVAL_RESULT') {
    if (message.success && requestResolver) {
      requestResolver(message.result);
    } else if (!message.success && requestRejecter) {
      requestRejecter(new Error(message.error));
    }
    
    // Clear resolvers
    requestResolver = null;
    requestRejecter = null;

    // Window will be closed by the popup itself or we can close it
    if (approvalWindowId) {
        chrome.windows.remove(approvalWindowId).catch(() => {});
        approvalWindowId = null;
    }
  }
});
