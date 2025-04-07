const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");

function loadAutoLinkStates() {
  try {
    const data = fs.readFileSync("autolink.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function saveAutoLinkStates(states) {
  fs.writeFileSync("autolink.json", JSON.stringify(states, null, 2));
}

let autoLinkStates = loadAutoLinkStates();

module.exports = {
  config: {
    name: 'autolink',
    version: '5.0',
    author: 'MR᭄﹅ MAHABUB﹅ メꪜ',
    countDown: 5,
    role: 0,
    shortDescription: 'Always active auto video download for any URL',
    category: 'media',
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    autoLinkStates[threadID] = true; 
    saveAutoLinkStates(autoLinkStates);
    return api.sendMessage("✅ AutoLink is now ON and works for any URL!", threadID);
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const message = event.body;

    if (!autoLinkStates[threadID]) return; 

    const linkMatch = message.match(/(https?:\/\/[^\s]+)/);
    if (!linkMatch) return;

    const url = linkMatch[0];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      
      const response = await axios.get(`https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`);
      const { title, high, low } = response.data.data;

      if (!high && !low) {
        api.setMessageReaction("😞", event.messageID, () => {}, true); 
        return api.sendMessage("❌ No video found at this URL.", threadID, event.messageID);
      }

      const videoUrl = high || low;

      const imgurRes = await axios.get(`https://imgur-upload-psi.vercel.app/mahabub?url=${encodeURIComponent(videoUrl)}`);
      const imgurLink = imgurRes.data.url || "N/A";

      request(videoUrl).pipe(fs.createWriteStream("video.mp4")).on("close", () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true); 
        api.sendMessage({
          body: `╭──────────────────◊\n\n\n《TITLE》: ${title || "No Title"}\n\n🌐 《IMGUR》: ${imgurLink}\n\n\n╰──────────────────◊`,
          attachment: fs.createReadStream("video.mp4")
        }, threadID, () => fs.unlinkSync("video.mp4"));
      });

    } catch (err) {
      console.error("Download Error:", err);
      api.setMessageReaction("😞", event.messageID, () => {}, true); 
      api.sendMessage("", threadID, event.messageID);
    }
  }
};
