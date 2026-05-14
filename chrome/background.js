chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.setOptions({ path: 'side_panel/index.html', enabled: true })
  chrome.sidePanel.open({ tabId: tab.id })
})
