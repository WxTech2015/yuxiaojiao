require('dotenv').config();
const axios = require('axios');

const url = 'https://chat.cqjtu.edu.cn/api/application/chat_message/13fac968-5ae6-11f0-9fdd-0242ac130003';

async function yuxiaojiao_chat(prompt, content) {
  const payload = {
    message: content,
    re_chat: false,
    image_list: [],
    document_list: [],
    audio_list: [],
    video_list: [],
    other_list: [],
    form_data: {}
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer eyJhcHBsaWNhdGlvbl9pZCI6IjdjMDU0ZDA0LWVmZWMtMTFlZi04ZTdlLTAyNDJhYzEzMDAwMyIsInVzZXJfaWQiOiJmMGRkOGY3MS1lNGVlLTExZWUtOGM4NC1hOGExNTk1ODAxYWIiLCJhY2Nlc3NfdG9rZW4iOiJkMTg0YjYwMzhlOTE5MWVlIiwidHlwZSI6IkFQUExJQ0FUSU9OX0FDQ0VTU19UT0tFTiIsImNsaWVudF9pZCI6IjA4Yjc4NjQwLTVhZTYtMTFmMC04MWVmLTAyNDJhYzEzMDAwMyIsImF1dGhlbnRpY2F0aW9uIjp7fX0:1ua6Rn:KTxPeIeDZcWtSC0G1u2N5hQjZwXIAQki_oNlhXVDC0I`
  };

  try {
    const response = await axios.post(url, payload, { headers });
    return {
      code: 200,
      data: response.data
    };
  } catch (error) {
    console.error('聊天API调用失败:', error.message);
    return {
      code: 500,
      data: `API调用失败: ${error.message}`
    };
  }
}

// 使用示例
async function example() {
  const result = await chat("你好");
  console.log(result);
}

module.exports = { yuxiaojiao_chat };