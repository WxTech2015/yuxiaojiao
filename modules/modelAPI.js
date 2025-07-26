require('dotenv').config();
const axios = require('axios');
async function deepseek(prompt, content) {
    const url = process.env.DEEPSEEK_API_URL;

  const payload = {
    messages: [
      {
        content: prompt || process.env.DEFAULT_PROMPT,
        role: "system"
      },
      {
        content: content,
        role: "user"
      }
    ],
    model: "deepseek-r1",
    frequency_penalty: 0,
    max_tokens: 1024,
    presence_penalty: 0,
    response_format: {
      type: "text"
    },
    stop: null,
    stream: false,
    stream_options: null,
    temperature: 1,
    top_p: 1,
    tools: null,
    tool_choice: "none",
    logprobs: false,
    top_logprobs: null
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
  };

  try {
    const response = await axios.post(url, payload, { headers });
    return {
      code: 200,
      data: response.data.choices[0].message.content
    };
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error.message);
    return {
      code: 500,
      data: `API调用失败: ${error.message}`
    };
  }
}
async function deepseek_official(prompt, content) {
    const url = 'https://api.deepseek.com/v1/chat/completions';

  const payload = {
    messages: [
      {
        content: prompt || process.env.DEFAULT_PROMPT,
        role: "system"
      },
      {
        content: content,
        role: "user"
      }
    ],
    model: "deepseek-chat",
    frequency_penalty: 0,
    max_tokens: 1024,
    presence_penalty: 0,
    response_format: {
      type: "text"
    },
    stop: null,
    stream: false,
    stream_options: null,
    temperature: 1,
    top_p: 1,
    tools: null,
    tool_choice: "none",
    logprobs: false,
    top_logprobs: null
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.DEEPSEEK_OFFICIAL_API_KEY}`
  };

  try {
    const response = await axios.post(url, payload, { headers });
    return {
      code: 200,
      data: response.data.choices[0].message.content
    };
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error.message);
    return {
      code: 500,
      data: `API调用失败: ${error.message}`
    };
  }
}

async function gpt(prompt, content) {
    const url = process.env.GPT_API_URL;

    const payload = {
        messages: [
            {
                content: prompt || process.env.PROMPT1,
                role: "system"
            },
            {
                content: content,
                role: "user"
            }
        ],
        model: process.env.GPT_MODEL,
        frequency_penalty: 0,
        max_tokens: 1024,
        presence_penalty: 0,
        response_format: {
            type: "text"
        },
        stop: null,
        stream: false,
        temperature: 1,
        top_p: 1,
        tools: null,
        tool_choice: "none",
        logprobs: false,
        top_logprobs: null
    };

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.GPT_API_KEY}`
    };

    try {
        const response = await axios.post(url, payload, { headers });
        return {
            code: 200,
            data: response.data.choices[0].message.content
        };
    } catch (error) {
        console.error('GPT API 调用失败:', error.message);
        return {
            code: 500,
            data: `API调用失败: ${error.message}`
        };
    }
}
async function spark(prompt, content) {
    const url = process.env.SPARK_API_URL || 'https://api.makuo.cc/api/get.chat.spark';
  // 星火API使用GET请求，参数通过URL查询参数传递
  const params = {
    question: prompt+content || content || process.env.DEFAULT_PROMPT
  };

  const headers = {
    'Accept': 'application/json',
    'Authorization': process.env.SPARK_API_TOKEN
  };

  try {
    const response = await axios.get(url, { 
      params: params,
      headers: headers 
    });
    
    // 根据API文档，成功时返回的数据结构
    if (response.data.code === 200) {
      return {
        code: 200,
        data: response.data.data.answer,
        model: response.data.data.model,
        tokens: response.data.data.total_tokens,
        time: response.data.time
      };
    } else {
      return {
        code: response.data.code,
        data: response.data.msg || 'API调用失败'
      };
    }
  } catch (error) {
    console.error('星火API调用失败:', error.message);
    return {
      code: 500,
      data: `API调用失败: ${error.message}`
    };
  }
}

async function chat(prompt, content) {
    const url = 'https://ap.lolimi.cn/api/deepseek';
    const payload = {
        model: "DeepSeek-R1", // 根据API文档可选 DeepSeek-V3 或 DeepSeek-R1
        messages: [
            {
                role: "system",
                content: prompt || process.env.DEFAULT_PROMPT || "你是一个有用的AI助手"
            },
            {
                role: "user", 
                content: content
            }
        ],
        temperature: 0.7,
        max_tokens: 1024
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    };

    // 添加ckey参数到headers（也可以通过query或body传递）
    if (process.env.DEEPSEEK_CKEY) {
        headers['ckey'] = process.env.DEEPSEEK_CKEY;
    }

    try {
        const response = await axios.post(url, payload, { headers });
        
        // 检查响应状态码
        if (response.status === 200) {
            return {
                code: 200,
                data: response.data.choices[0].message.content
            };
        } else {
            return {
                code: response.status,
                data: `API调用失败，状态码: ${response.status}`
            };
        }
        
    } catch (error) {
        console.error('DeepSeek API 调用失败:', error.message);
        
        // 处理HTTP错误响应
        if (error.response) {
            const status = error.response.status;
            let errorMessage = '';
            
            switch (status) {
                case 203:
                    errorMessage = '秘钥错误或不存在';
                    break;
                case 204:
                    errorMessage = '服务器错误';
                    break;
                case 211:
                    errorMessage = '接口不存在';
                    break;
                case 212:
                    errorMessage = '当前接口已下架';
                    break;
                case 213:
                    errorMessage = '当前接口正处于审核期';
                    break;
                case 214:
                    errorMessage = 'API本地文件不存在，请联系管理员检查';
                    break;
                case 215:
                    errorMessage = '管理员设置当前接口必须携带ckey请求！';
                    break;
                case 216:
                    errorMessage = '付费接口请携带ckey请求！';
                    break;
                case 217:
                    errorMessage = 'ckey不存在！';
                    break;
                case 218:
                    errorMessage = '当前ckey无权限调用此接口，请将此接口添加到ckey调用能力中后重试！';
                    break;
                case 219:
                    errorMessage = '访问频率超过限制！请稍后重试！';
                    break;
                case 220:
                    errorMessage = '本地API逻辑错误！请联系管理员检查！';
                    break;
                case 221:
                    errorMessage = '状态码与管理员配置的状态码不一致，请联系管理员！';
                    break;
                case 222:
                    errorMessage = '禁止访问！请联系管理员 (已被加入黑名单)';
                    break;
                case 223:
                    errorMessage = '积分不足！请充值后重试';
                    break;
                case 224:
                    errorMessage = '余额不足！请充值后重试';
                    break;
                case 225:
                    errorMessage = '您已设置仅白名单ip访问！请将当前ip添加到白名单中';
                    break;
                default:
                    errorMessage = `未知错误，状态码: ${status}`;
            }
            
            return {
                code: status,
                data: errorMessage
            };
        }
        
        return {
            code: 500,
            data: `网络请求失败: ${error.message}`
        };
    }
}


module.exports = { chat ,deepseek, spark,gpt ,deepseek_official};