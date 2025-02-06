/**powered code by Copilot and ChatGPT */
const crypto = require('crypto');

const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

function generateUUID() {
  let d = new Date().getTime();
  let d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}


const generateSessionData = (count = 50) => {
  const sessions = [];
  for (let i = 0; i < count; i++) {
    sessions.push({
      sessionId: generateRandomString(32),
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      username: `user_${i + 1}`,
      uuid: generateUUID(),
      isLoggedIn: Math.random() > 0.5,
      agent: ["Windows", "Mac", "Linux", "Android", "iOS"][Math.floor(Math.random() * 5)],
      checked: false,
    });
  }
  return sessions;
};

// console.log(JSON.stringify(generateSessionData(), null, 2));

console.log(generateRandomString(128))