const axios = require('axios');

function send_to_bot(url) {
  return axios.get(url)
    .then((response) => {
      return response.data;  // 返回请求数据
    })
    .catch((error) => {
      console.error('Error:', error);
      throw error;  // 抛出错误让调用方处理
    });
}

module.exports = { send_to_bot };
