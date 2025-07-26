const onlineGroup=['192357010'];
require('module-alias/register');
require('dotenv').config();
const {chat,spark,deepseek,gpt,deepseek_official}= require('./modules/modelAPI.js');
const http = require('http');
const urlencode = require('urlencode');
const {send_to_bot}=require('./modules/get.js');

const pokeWord=['喵~',`请不要戳${process.env.selfName}QAQ`,'再戳我就要生气了！',`嘤嘤嘤${process.env.selfName}要被戳晕了`];

const MaoNiangRate=5;
class UserStatus{
  constructor(qid) {
    this.qid = qid;
    this.method = 0;
    this.pokeNum=0;
    this.lastPokeTime=0;
  }
  updateMethod(method){
    this.method=method;//0 傲娇 1 温柔
  }
  pokeNumAdd(num){
    this.pokeNum+=num;
  }
  updateLastPokeNum(num){
    this.lastPokeTime=num;
  }
  updateLastPokeTime(time){
    this.lastPokeTime=time;
  }
}
const userStatusMap=new Map();
function checkGroup(group_id, onlineGroup) {
  return onlineGroup.includes(group_id) ? 1 : 0;
}

const userGroupQueues = new Map();

// 启动 HTTP 服务器
const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const rev_data = JSON.parse(body);
        const { group_id: groupId, user_id: userId } = rev_data;

        if (isPokeEvent(rev_data)) {
          enqueueUserTask(userId, groupId, () => handlePoke(groupId,userId));
        }

        if (isGroupMessageEvent(rev_data)) {
          const message = rev_data.raw_message;
          handleGroupMessage(userId, groupId, message, rev_data);
        }

        // 响应客户端，避免请求悬挂
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } catch (error) {
        console.error('JSON解析或请求处理失败:', error);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// 判断是否为戳一戳事件
function isPokeEvent(data) {
  return data.post_type === 'notice' &&
         data.sub_type === 'poke' &&
         data.target_id === data.self_id &&
         checkGroup(String(data.group_id), onlineGroup);
}

// 判断是否为群聊消息事件
function isGroupMessageEvent(data) {
  return data.post_type === 'message' &&
         data.message_type === 'group' &&
         checkGroup(String(data.group_id), onlineGroup);
}

// 将用户任务加入队列
function enqueueUserTask(userId, groupId, task) {
  const key = `${userId}-${groupId}`;
  if (!userGroupQueues.has(key)) {
    userGroupQueues.set(key, []);
  }

  const queue = userGroupQueues.get(key);
  queue.push(task);

  if (queue.length === 1) {
    processUserQueue(userId, groupId);
  }
}

// 处理用户队列中的任务
async function processUserQueue(userId, groupId) {
  const key = `${userId}-${groupId}`;
  const queue = userGroupQueues.get(key);
  if (!queue || queue.length === 0) return;

  const task = queue[0];
  try {
    await task();
  } catch (error) {
    console.error('任务执行失败:', error);
  } finally {
    queue.shift();
    if (queue.length > 0) {
      processUserQueue(userId, groupId);
    }
  }
}

// 发送"正在处理"消息的辅助函数
function sendProcessingMessage(userId, groupId) {
  send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode(`[CQ:at,qq=${userId}] 接受到您的提问，正在为您查询，请等待1-3分钟`)}`);
}
// 处理群消息
function handleGroupMessage(userId, groupId, message, rev_data) {
  const match = message.match(/\[CQ:at,qq=(\d+)\]\s*(.*)/);
  if (!userStatusMap.has(userId)) {
    userStatusMap.set(userId, new UserStatus(userId));
  }

  if (match && match[1] === process.env.botQid) {
    let msg = match[2] || '你好呀';

    if (msg.includes('#')) {
      const qes = msg.match(/#(\S+)(?:\s+(.*))?/);
      console.log(qes)
      if (qes && qes[1].includes('提问')) {
        enqueueUserTask(userId, groupId, async () => {
          try {
            const result = await deepseek(qes[2], process.env.DEFAULT_PROMPT);
            handleResponse(result, groupId,userId);
          } catch (error) {
            console.error('Chat API调用失败:', error);
            handleResponse({ code: 500, data: '服务暂时不可用' }, groupId);
          }
        });
      }else if(qes && qes[1].includes('赞我')){
  enqueueUserTask(userId, groupId, async () => {
    try {
      let times=1;
      const match = qes[0].match(/#赞我\s*(\d*)\s*次?/);
      console.log(qes[0]);
      if(match &&  Number(match[1])<=10&& Number(match[1])>0 ) {
      times=match[1]? Number(match[1]):1;
      console.log(`点赞次数: ${times}`);
      }
      else {
        send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode(`[CQ:at,qq=${userId}] 点赞数超限！请为渝小交充值腾讯SVIP:)`)}`);
      }
      const response = await fetchData(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_like?user_id=${userId}&times=${times}`);
      console.log('点赞响应:', response);
      if(response.status=='ok'){
        send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode(`[CQ:at,qq=${userId}] 点赞成功！已点赞${times}次`)}`);
      }else{
        send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode(`[CQ:at,qq=${userId}] ${response.message}`)}`);
      }

    } catch (error) {
      console.error('点赞失败:', error);
    }
  });
}
    } else if (msg.includes('猫娘')) {
      enqueueUserTask(userId, groupId, () => handleCatgirlResponse(msg, userId, groupId));
    } else {
        // 立即发送"正在处理"消息
      sendProcessingMessage(userId, groupId);
      enqueueUserTask(userId, groupId, async () => {
        try {
          const method = userStatusMap.get(userId).method;
          let result;
          if (method == 0) {
            result = await deepseek(msg, process.env.PROMPT1);
          } else  {
            const result = await fetchData(`https://apii.lolimi.cn/api/mmai/mm?key=${process.env.OTHER_API_KEY}&msg=${msg}`);
            handleResponse(result, groupId,userId);
          }
          send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode(`[CQ:at,qq=${userId}接受到您的提问，正在为您查询，请等待1-3分钟]`)}`);
          handleResponse(result, groupId,userId);
        } catch (error) {
          console.error('Chat API调用失败:', error);
          handleResponse({ code: 500, data: '服务暂时不可用' }, groupId);
        }
      });
    }
  }
}

// 处理猫娘响应

function handleCatgirlResponse(msg, userId, groupId) {
  // Admin直接变猫娘，无需随机判断
  if (userId === process.env.adminQid) {
    const response = `糟糕${process.env.selfName}要变成猫娘了`;
    userStatusMap.get(userId).updateMethod(1);
    send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode(response)}`);
    return;
  }

  // 普通用户的随机逻辑
  const rom = Math.floor(Math.random() * (MaoNiangRate + 1));
  const response = rom === 0
    ? `糟糕${process.env.selfName}要变成猫娘了`
    : '你才是猫娘';
  
  userStatusMap.get(userId).updateMethod(rom === 0 ? 1 : 0);
  send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode(response)}`);
}

// 处理响应
function handleResponse(result, groupId,userId) {
  if (result && result.code === 200 && result.data) {
    const message = result.data.replace(/婧枫|沫沫/g, process.env.selfName);
    send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode(`[CQ:at,qq=${userId}]${message}`)}`);
  } else {
    console.error('API响应错误:', result);
    const errorMsg = result && result.data ? result.data : '处理消息时发生错误';
    send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${urlencode.encode('错误：' + errorMsg)}`);
  }
}

function handlePoke(groupId, userId) {
  if(userStatusMap.get(userId)==undefined)userStatusMap.set(userId, new UserStatus(userId));
  const msg = pokeWord[Math.floor(Math.random() * 3)];
  userStatusMap.get(userId).pokeNumAdd(1);
  if(Date.now()-userStatusMap.get(userId).lastPokeTime<=3600&&userStatusMap.get(userId).pokeNum>=5){
    send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=懒得理你，你戳我干嘛`);
  }else{
    send_to_bot(`http://${process.env.frameworkHost}:${process.env.frameworkPort}/send_group_msg?group_id=${groupId}&message=${msg}`);
    userStatusMap.get(userId).updateLastPokeTime(Date.now());
  }
  
  
}

// 异步请求数据
async function fetchData(api_url) {
  try {
    const response = await send_to_bot(api_url);
    return response;
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 启动服务器
server.listen(process.env.runPort, process.env.runHost, () => {
  console.log(`Server is running on http://${process.env.runHost}:${process.env.runPort}/`);
});
