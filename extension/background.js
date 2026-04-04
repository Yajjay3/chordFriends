// chordFriends - Background Service Worker
// Sets up daily alarm for badge updates

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('dailyChord', {
    delayInMinutes: 1,
    periodInMinutes: 60 * 24 // once per day
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyChord') {
    // Could update badge or send notification in premium version
    chrome.action.setBadgeText({ text: 'NEW' });
    chrome.action.setBadgeBackgroundColor({ color: '#f5c518' });
  }
});

// Clear badge when popup is opened
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});
