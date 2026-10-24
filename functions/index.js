/** ESA Edge Routine entry. No Node.js, filesystem, or third-party runtime dependencies. */
const prompts = [
  '如果能开一家只在深夜营业的小店，你会卖什么？',
  '给五年前的自己，写一张只有三句话的便签。',
  '如果今天的心情是一种天气，它会叫什么名字？',
  '把窗外的某个声音，写成一个故事的开头。',
  '如果月亮有一份工作，它下班后会去哪里？',
  '设计一个能让普通周二变得可爱的微小发明。',
  '如果能把一个瞬间装进玻璃瓶，你会选哪一刻？',
  '为一座没有人失眠的城市，写一句广告语。',
  '想象一家替人保管梦境的邮局，今天收到什么信？',
  '把今天最普通的一件小事，写成电影的最后一个镜头。',
  '如果凌晨两点的风有颜色，它会是什么样？',
  '给一个一直想做、还没开始的计划，起一个名字。'
];

const json = (data, status = 200, method = 'GET') => new Response(method === 'HEAD' ? null : JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(status === 405 ? {Allow: 'GET, HEAD'} : {})
  }
});

export default {
  async fetch(request) {
    const {pathname} = new URL(request.url);
    const method = request.method;
    if (!['GET','HEAD'].includes(method)) return json({error:'Method not allowed'},405);
    if (pathname === '/api/prompt') {
      return json({prompt:prompts[Math.floor(Math.random()*prompts.length)],source:'esa-edge'},200,method);
    }
    if (pathname === '/api/health') {
      return json({ok:true,app:'half-past-two',version:'1.1.0',storage:'browser-local'},200,method);
    }
    return json({error:'Not found'},404,method);
  }
};
