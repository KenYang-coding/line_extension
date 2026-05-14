(() => {
const ExtensionMessageType = {
    Init: 'Init',
    SwitchChat: 'SwitchChat'
};
function getUserIdFromUrl() {
    const href = location.href;
    const parts = href.split('/chat/');
    if (parts.length < 2) return '';
    let id = parts[1];
    id = id.split('?')[0];
    id = id.split('/')[0];
    return id;
}
function getDisplayName() {
    var _el_textContent;
    const el = document.querySelector('.list-group-item-chat.active h6.text-truncate-box, .list-group-item-chat.active .chat-name');
    return (el === null || el === void 0 ? void 0 : (_el_textContent = el.textContent) === null || _el_textContent === void 0 ? void 0 : _el_textContent.trim()) ?? '';
}
function getAvatar() {
    const el = document.querySelector('.list-group-item-chat.active img.avatars-one, .list-group-item-chat.active img[class*="avatar"]');
    return (el === null || el === void 0 ? void 0 : el.src) ?? '';
}
function sendUserInfo() {
    const user_id = getUserIdFromUrl();
    if (!user_id) return;
    const name = getDisplayName();
    const avatar = getAvatar();
    chrome.runtime.sendMessage({
        type: ExtensionMessageType.Init,
        data: {
            userInfo: {
                user_id,
                name,
                avatar
            }
        }
    });
}
// Listen for SwitchChat requests from the side panel
chrome.runtime.onMessage.addListener((message)=>{
    if (message.type !== ExtensionMessageType.SwitchChat) return;
    const { userId, channelId } = message.data ?? {};
    if (!userId) return;
    // Try to find user in the chat list and click them
    const items = document.querySelectorAll('.list-group-item-chat');
    for (const item of items){
        const href = item.getAttribute('href') ?? '';
        if (href.includes(userId)) {
            item.click();
            return;
        }
    }
    // If not found in list, try navigating directly
    if (channelId) {
        location.href = `https://chat.line.biz/${channelId}/chat/${userId}`;
    }
});
// Send user info when URL changes (chat selection)
let lastUserId = '';
function checkAndSend() {
    const currentUserId = getUserIdFromUrl();
    if (currentUserId && currentUserId !== lastUserId) {
        lastUserId = currentUserId;
        setTimeout(sendUserInfo, 500); // Wait for DOM to update after navigation
    }
}
// Monitor URL changes via MutationObserver on title (LINE OA is SPA)
const observer = new MutationObserver(checkAndSend);
observer.observe(document.body, {
    childList: true,
    subtree: true
});
// Initial send
setTimeout(sendUserInfo, 1000);
// Also listen for popstate / click events
document.addEventListener('click', ()=>setTimeout(checkAndSend, 300));

})()
;