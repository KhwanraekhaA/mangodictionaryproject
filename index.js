const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios').default;
const dotenv = require('dotenv');
const env = dotenv.config().parsed;
const app = express();

const lineConfig = {
  channelAccessToken: env.ACCESS_TOKEN,
  channelSecret: env.SECRET_TOKEN
};

const client = new line.Client(lineConfig);

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    console.log('event=>>>>', events);
    return events.length > 0 ? await Promise.all(events.map(item => handleEvent(item))) : res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

const handleEvent = async (event) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  } else if (event.type === 'message') {
    try {
      const word = event.message.text.toLowerCase();
      const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

      console.log('DATA', data);

      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];

        let str = '';
        entry.meanings.forEach((meaning, i) => {
          str += `${i + 1}. ${meaning.partOfSpeech}\nDefinition: ${meaning.definitions[0].definition}\n\n`;
        });

        console.log('STR=>>>>>>>>>>', str);
        return client.replyMessage(event.replyToken, { type: 'text', text: str });
      } else {
        console.error('Invalid data structure from API');
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ไม่พบคำที่คุณค้นหาในพจนานุกรม',
        });
      }
    } catch (error) {
      console.error(error);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'เกิดข้อผิดพลาดในการดึงข้อมูลจากพจนานุกรม',
      });
    }
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('welcome to  port ${PORT}');
});
