(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad = n => String(n).padStart(2, '0');
  const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const fromKey = key => new Date(`${key}T12:00:00`);
  const now = new Date();
  const today = dateKey(now);
  const storageKey = 'half-past-two.ideas.v1';
  const draftKey = 'half-past-two.drafts.v2';
  const preferenceKey = 'half-past-two.show-examples.v2';
  const colors = { '随想':'yellow', '创作':'purple', '生活':'green', '梦境':'pink' };
  const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  const monthEnglish = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const state = {year:now.getFullYear(),month:now.getMonth(),selected:today,view:'calendar',tag:null,query:'',z:30};
  const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const demoDate = day => `${state.year}-${pad(state.month+1)}-${pad(Math.min(day, new Date(state.year,state.month+1,0).getDate()))}`;
  function seedIdeas() {
    const seeds = [
      [2,'01:12','有些路，适合慢慢走','今天绕了一段远路回家。发现常经过的街角，有一棵正在换季的树。\n也许慢一点，才会看见那些被日常藏起来的东西。','生活','平静',false],
      [4,'02:06','梦到了一片蓝色的森林','树叶是透明的。风经过的时候，每一片叶子都发出很轻的玻璃声。\n醒来后还记得那种蓝，像凌晨的海。','梦境','游离',false],
      [6,'00:38','把城市的声音做成明信片','如果明信片不只有照片，还能听到拍下那一刻的声音呢？\n一张雨天的南京路，一张清晨的菜市场。扫码，就回到那个瞬间。','创作','兴奋',true],
      [9,'01:54','生活需要一点无用的浪漫','给自己买花的时候，不需要纪念日。\n今晚记住的小事：便利店的阿姨说，月亮挺好的。','生活','温柔',false],
      [11,'03:02','月亮会不会也有失眠的时候','它每天看着那么多人睡去，也看着那么多人醒着。\n如果它有一本日记，第一页会写什么？','随想','游离',false],
      [14,'00:47','一间只收藏晚霞的小店','每个玻璃瓶里装着不同城市、不同季节的晚霞。\n顾客可以带走一个傍晚，放在床头。\n可以画成一组小插画，名字就叫「日落寄存处」。','创作','兴奋',true],
      [17,'02:23','给未来的自己留一个空白页','不必今天就把答案写满。\n有些事，留给过一阵子的自己想。','随想','平静',false],
      [20,'01:08','做一本可以听见雨的书','翻到不同的页，窗外就下起不同的雨。\n第一页是屋檐，第二页是树叶，最后一页，是很久以前回家的路。','创作','温柔',false],
      [22,'02:16','梦里那座没有时钟的车站','列车没有时刻表。人们到了想走的时候，车就来了。\n我坐了很久，没有觉得着急。','梦境','游离',false],
      [24,'01:43','想开一家只在下雨天营业的书店','不用很大，能放下一面书墙和两把旧椅子就好。\n\n门口挂一块小木牌：\n「今天下雨，所以我们在。」\n\n卖书，也卖一点躲雨的时间。','随想','温柔',true],
      [24,'02:17','给失眠的人做一张声音地图','收集世界各地凌晨两点的声音：东京的自动售货机、海边的风、楼下最后一班公交。\n点亮地图上的一个点，就陪另一个醒着的人待一会儿。','创作','兴奋',false],
      [26,'00:52','把没说出口的话折成纸船','也许可以做成一段很短的动画。\n每一艘小船都驶向一个没有名字的地方。','随想','温柔',false],
      [28,'01:31','今天记得抬头看月亮','原来月亮会跟着我走过整条街。\n今晚没有大事发生，但我很喜欢这个晚上。','生活','平静',false]
    ];
    return seeds.map(([day,time,title,body,tag,mood,favorite]) => ({id:uid(),date:demoDate(day),time,title,body,tag,mood,favorite,demo:true}));
  }
  function validIdea(item) {
    return item && typeof item.id === 'string' && item.id.length>0 && item.id.length<=100 && typeof item.title === 'string' && item.title.trim().length>0 && item.title.length <= 100 && typeof item.body === 'string' && item.body.length <= 10000 && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && item.date>='1900-01-01' && item.date<='2099-12-31' && dateKey(fromKey(item.date)) === item.date && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) && Object.hasOwn(colors,item.tag) && ['平静','温柔','兴奋','游离'].includes(item.mood) && typeof item.favorite === 'boolean' && (item.demo===undefined || typeof item.demo==='boolean');
  }
  let storageAvailable = true;
  let ideas;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      const data = JSON.parse(saved);
      if (!Array.isArray(data) || !data.every(validIdea)) throw new Error('invalid storage');
      ideas = data;
    } else { ideas = seedIdeas(); localStorage.setItem(storageKey,JSON.stringify(ideas)); }
  } catch { ideas = seedIdeas(); storageAvailable = false; }
  // Mark untouched examples from the original version without changing edited records.
  const examples=seedIdeas();
  ideas=ideas.map(item=>item.demo===undefined && examples.some(example=>example.title===item.title && example.body===item.body)?{...item,demo:true}:item);
  let showExamples=ideas.every(item=>item.demo);
  let drafts=Object.create(null);
  try {
    const preference=localStorage.getItem(preferenceKey);if(preference!==null)showExamples=preference==='true';
    const raw=JSON.parse(localStorage.getItem(draftKey)||'{}');
    if(raw && typeof raw==='object' && !Array.isArray(raw))for(const [id,value] of Object.entries(raw)){
      if(value && value.idea?.id===id && typeof value.idea.title==='string' && typeof value.idea.body==='string' && validIdea({...value.idea,title:value.idea.title||'草稿'}) && typeof value.isNew==='boolean' && Number.isFinite(value.savedAt))drafts[id]=value;
    }
  } catch { /* Stored records remain usable if draft storage is unavailable. */ }
  const windows = new Map();
  let toastTimer;
  function toast(message,action) {
    const el=$('#toast');el.replaceChildren(document.createTextNode(message));
    if(action){const button=document.createElement('button');button.textContent=action.label;button.addEventListener('click',()=>{action.run();el.classList.remove('visible');});el.append(button);}
    el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),action?9000:3200);
  }
  function persist(next) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); storageAvailable=true; }
    catch { toast('浏览器未能保存，请先导出灵感备份'); return false; }
    ideas=next; return true;
  }
  const visibleIdeas=()=>ideas.filter(idea=>showExamples || !idea.demo);
  function updateDraftButton() {
    const count=Object.keys(drafts).length;$('#resume-draft').hidden=count===0;
    $('#resume-draft').textContent=`继续草稿${count>1?` (${count})`:''} ↗`;
  }
  function storeDrafts() {
    try{localStorage.setItem(draftKey,JSON.stringify(drafts));updateDraftButton();return true;}
    catch{return false;}
  }
  function stashDraft() {
    if(!editorSession)return true;
    const draft=getDraft();if(!draft)return true;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.date))draft.date=editorSession.draft.date;
    if(dirty() && (draft.title || draft.body))drafts[draft.id]={idea:draft,isNew:editorSession.isNew,savedAt:Date.now()};
    else delete drafts[draft.id];
    const success=storeDrafts();
    const status=$('#draft-status');if(status){status.textContent=success?'草稿已保存在此浏览器':'草稿保存失败，请点击保存或导出备份';status.classList.toggle('save-error',!success);}
    return success;
  }
  function clearDraft(id){delete drafts[id];storeDrafts();}
  function closeEditor() {
    if(!editorSession){removeWindow('editor-window');return true;}
    if(dirty() && !stashDraft()){toast('草稿未能保存，请先手动保存这条灵感');return false;}
    removeWindow('editor-window');editorSession=null;return true;
  }
  function prepareNavigation(){if(!closeEditor())return false;removeWindow('day-window');removeWindow('prompt-window');return true;}
  function matches(idea) {
    const query = state.query.trim().toLowerCase();
    return (!state.tag || idea.tag === state.tag) && (!query || `${idea.title} ${idea.body} ${idea.tag} ${idea.date}`.toLowerCase().includes(query)) && (state.view !== 'favorites' || idea.favorite);
  }
  const sorted = list => [...list].sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  function render() {
    const visible=visibleIdeas();
    $('#total-count').textContent=visible.length;
    $('#favorite-count').textContent=visible.filter(i=>i.favorite).length;
    $('#example-badge').hidden=!showExamples;
    $('#example-description').textContent=showExamples?'正在展示示例，你也可以写下自己的第一条。':'点日期查看；点空白日期，直接写。';
    $('#toggle-examples').textContent=showExamples?'隐藏示例':'看看示例';
    $('#clear-filters').hidden=!state.query && !state.tag;
    $$('.nav-item').forEach(el=>{el.classList.toggle('active',el.dataset.view===state.view && !state.tag);el.setAttribute('aria-current',el.classList.contains('active')?'page':'false');});
    $$('.tag-nav button').forEach(el=>el.classList.toggle('active',el.dataset.tag===state.tag));
    const calendar = state.view==='calendar' && !state.query && !state.tag;
    $('#calendar-area').hidden=!calendar; $('#collection-area').hidden=calendar;
    const monthIdeas=visible.filter(i=>i.date.startsWith(`${state.year}-${pad(state.month+1)}-`));
    if (calendar) {
      $('#month-number').textContent=pad(state.month+1); $('#month-title').textContent=monthNames[state.month]; $('#year-label').textContent=`${state.year} / ${monthEnglish[state.month]}`;
      $('#window-title').textContent='灵感日历';
      $('#month-summary').textContent=monthIdeas.length?'这个月，也有一些值得留下的瞬间。':'这个月的故事，等你写下第一句。';
      $('#footer-count').textContent=`${monthIdeas.length} 个念头 · ${new Set(monthIdeas.map(i=>i.date)).size} 个有灵感的夜晚`;
      renderCalendar();
    } else {
      $('#month-number').textContent=state.tag?'#':'✧';
      $('#month-title').textContent=state.query?'搜索结果':state.tag || (state.view==='favorites'?'我的收藏':'全部灵感');
      $('#year-label').textContent=state.query?'SEARCH YOUR MIDNIGHT MIND':state.tag?'A SHAPE OF THOUGHT':'YOUR LITTLE COLLECTION';
      $('#window-title').textContent=state.query?'搜索灵感':'灵感收藏夹';
      const filtered=sorted(visible.filter(matches));
      $('#month-summary').textContent=state.query?`关于「${state.query}」的 ${filtered.length} 个念头`:'把散落的想法，再读一遍。';
      $('#footer-count').textContent=`${filtered.length} 个念头`;
      $('#collection-area').innerHTML=filtered.length?filtered.map(i=>cardHTML(i,true)).join(''):`${emptyHTML(state.query?'没有找到这个念头':'这里还很安静',state.query?'换个词试试，也可以清除筛选。':'写下第一句，灵感就有了位置。')}<button class="empty-create dark-button">${icon('plus')}写一条灵感</button>`;
      $$('#collection-area .idea-card').forEach(el=>el.addEventListener('click',()=>{const idea=ideas.find(i=>i.id===el.dataset.id);openDay(idea.date);openEditor(idea);}));
      $('.empty-create')?.addEventListener('click',()=>openEditor(null,today));
    }
    $('#prev-month').hidden=!calendar;$('#next-month').hidden=!calendar;
    updateDraftButton();
  }
  function renderCalendar() {
    const first=new Date(state.year,state.month,1);
    const offset=(first.getDay()+6)%7;
    const count=Math.ceil((offset+new Date(state.year,state.month+1,0).getDate())/7)*7;
    const cells=[];
    for(let index=0;index<count;index++) {
      const date=new Date(state.year,state.month,index-offset+1); const key=dateKey(date);
      const dayIdeas=sorted(visibleIdeas().filter(i=>i.date===key));
      const outside=date.getMonth()!==state.month;
      cells.push(`<button class="day-cell${outside?' outside':''}${key===today?' today':''}${key===state.selected?' selected':''}" data-date="${key}" aria-label="${date.getMonth()+1}月${date.getDate()}日，${dayIdeas.length}条灵感" aria-pressed="${key===state.selected}"><span class="day-head"><span class="day-number">${pad(date.getDate())}</span>${key===today?'<span class="day-today">今天</span>':''}</span>${dayIdeas.slice(0,1).map(i=>`<span class="day-preview ${colors[i.tag]}"><time>${i.time}</time>${esc(i.title)}</span>`).join('')}${dayIdeas.length>1?`<span class="day-more">+ ${dayIdeas.length-1} 个念头</span>`:''}${!dayIdeas.length?'<span class="empty-star" aria-hidden="true">✧</span>':''}</button>`);
    }
    $('#calendar-grid').innerHTML=cells.join('');
    $$('.day-cell').forEach(el=>el.addEventListener('click',()=>{state.selected=el.dataset.date;render();if(visibleIdeas().some(i=>i.date===el.dataset.date))openDay(el.dataset.date);else openEditor(null,el.dataset.date);}));
  }
  function emptyHTML(title,text) {return `<div class="empty-state">${icon('moon')}<h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;}
  function cardHTML(idea,collection=false) {
    return `<button class="idea-card" data-id="${esc(idea.id)}"><span class="card-meta"><span>${collection?`${idea.date.replaceAll('-','.')} · `:''}${idea.time}</span><span class="card-tag ${colors[idea.tag]}">${esc(idea.tag)}</span></span><h3>${esc(idea.title)}</h3><p>${esc(idea.body)}</p><span class="card-bottom"><span>${idea.favorite?'✦ 值得继续':'○ '+esc(idea.mood)}</span>${icon('arrow')}</span></button>`;
  }
  function createWindow(id,caption,cls,position,closeHandler) {
    const previousFocus=document.activeElement;
    if(windows.has(id)) {const item=windows.get(id);item.el.style.zIndex=++state.z;return item.el;}
    const el=document.createElement('section');el.className=`floating-window ${cls}`;el.id=id;el.tabIndex=-1;el.setAttribute('role','dialog');el.setAttribute('aria-label',caption);
    el.innerHTML=`<div class="window-bar"><span class="window-caption"><span class="tiny-square"></span>${esc(caption)}</span><div class="window-buttons"><button class="close-window" aria-label="关闭${esc(caption)}">${icon('close')}</button></div></div><div class="window-body"></div>`;
    el.style.zIndex=++state.z;$('#window-layer').append(el);
    const width=el.getBoundingClientRect().width;
    let left=position.left,top=position.top;
    if(innerWidth<=600){left=id==='editor-window'?innerWidth-width-12:12;top=id==='editor-window'?180:105;}
    el.style.left=`${Math.max(10,Math.min(left,innerWidth-width-10))}px`;
    el.style.top=`${Math.max(43,Math.min(top,innerHeight-200))}px`;
    windows.set(id,{el,close:closeHandler,previousFocus});
    $('.close-window',el).addEventListener('click',()=>requestClose(id));
    el.addEventListener('pointerdown',()=>el.style.zIndex=++state.z);
    makeDraggable(el);
    el.focus({preventScroll:true});return el;
  }
  function removeWindow(id) {
    const item=windows.get(id);if(!item)return;
    const restoreFocus=item.el.contains(document.activeElement);
    item.el.remove();windows.delete(id);
    if(restoreFocus && item.previousFocus?.isConnected)item.previousFocus.focus({preventScroll:true});
  }
  function requestClose(id) { const item=windows.get(id); if(item?.close)item.close();else removeWindow(id); }
  function fitWindow(el) {
    const rect=el.getBoundingClientRect();
    el.style.left=`${Math.max(10,Math.min(rect.left,innerWidth-rect.width-10))}px`;
    el.style.top=`${Math.max(43,Math.min(rect.top,innerHeight-rect.height-12))}px`;
  }
  function makeDraggable(el) {
    const handle=$('.window-bar',el);
    handle.addEventListener('pointerdown',event=>{
      if(event.target.closest('button') || event.button!==0)return;
      el.style.animation='none';const rect=el.getBoundingClientRect();const x=event.clientX,y=event.clientY;handle.setPointerCapture(event.pointerId);el.classList.add('dragging');
      const move=e=>{el.style.left=`${Math.max(8,Math.min(innerWidth-rect.width-8,rect.left+e.clientX-x))}px`;el.style.top=`${Math.max(40,Math.min(innerHeight-50,rect.top+e.clientY-y))}px`;};
      const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);el.classList.remove('dragging');};
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
    });
  }
  function openDay(key) {
    const existing=windows.get('day-window');
    const pos=existing?{left:parseFloat(existing.el.style.left),top:parseFloat(existing.el.style.top)}:{left:innerWidth*.48,top:305};
    const el=createWindow('day-window','当夜灵感','day-window',pos);
    el.dataset.date=key;renderDay();
  }
  function renderDay() {
    const el=windows.get('day-window')?.el;if(!el)return;
    const key=el.dataset.date,date=fromKey(key),items=sorted(visibleIdeas().filter(i=>i.date===key));
    const weekday=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][date.getDay()];
    $('.window-body',el).innerHTML=`<div class="pop-eyebrow">${key.replaceAll('-',' . ')} / ${weekday}</div><h2>这一夜的念头 <span style="color:#a2aa87;font-size:13px">✧</span></h2><p class="pop-subtitle">${items.length?`${items.length} 个小小的灵感，在这里相遇。`:'空白也很好，给新想法留点位置。'}</p>${items.length?items.map(i=>cardHTML(i)).join(''):emptyHTML('还没有写下什么','今晚，脑海里飘过了什么？')}<button class="window-add">${icon('plus')}再记一个念头</button><div class="day-window-footer"><span>NOTHING IS TOO SMALL.</span><span>☾</span></div>`;
    $$('.idea-card',el).forEach(card=>card.addEventListener('click',()=>openEditor(ideas.find(i=>i.id===card.dataset.id))));
    $('.window-add',el).addEventListener('click',()=>openEditor(null,key));
    fitWindow(el);
  }
  let editorSession=null;
  function getDraft() {
    const el=windows.get('editor-window')?.el;if(!el || !editorSession)return null;
    return {...editorSession.draft,title:$('#idea-title',el).value.trim(),body:$('#idea-body',el).value.trim(),date:$('#idea-date',el).value,tag:$('#idea-tag',el).value,mood:$('#idea-mood',el).value,favorite:$('.favorite-toggle',el).getAttribute('aria-pressed')==='true'};
  }
  function dirty() {return editorSession && JSON.stringify(getDraft())!==editorSession.initial;}
  function openEditor(idea,key=state.selected,prefill) {
    if(windows.has('editor-window')){if(idea && editorSession?.draft.id===idea.id){windows.get('editor-window').el.style.zIndex=++state.z;return;}if(!closeEditor())return;}
    mountEditor(idea,key,prefill);
  }
  function mountEditor(idea,key,prefill) {
    const parent=windows.get('day-window')?.el.getBoundingClientRect();
    const pending=idea?drafts[idea.id]:!prefill?Object.values(drafts).filter(d=>d.isNew && d.idea.date===key).sort((a,b)=>b.savedAt-a.savedAt)[0]:null;
    const draft=pending?{...pending.idea}:idea?{...idea}:{id:uid(),date:key,time:`${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`,title:prefill||'',body:'',tag:'随想',mood:'平静',favorite:false};
    const isNew=pending?pending.isNew:!idea;
    const el=createWindow('editor-window',isNew?'写下一个念头':'编辑灵感','editor-window',{left:parent?parent.left+205:innerWidth/2-195,top:parent?parent.top+67:210},closeEditor);
    editorSession={draft,initial:pending||prefill?'':JSON.stringify(draft),isNew};
    $('.window-body',el).innerHTML=`<form id="idea-form"><div class="editor-topline"><span>${esc(draft.date.replaceAll('-','.'))} · ${esc(draft.time)}</span><button type="button" class="favorite-toggle${draft.favorite?' is-favorite':''}" aria-label="收藏这条灵感" aria-pressed="${draft.favorite}">${icon('star')}收藏</button></div><label class="sr-only" for="idea-title">灵感标题</label><textarea id="idea-title" class="editor-title" rows="2" maxlength="100" placeholder="给这个念头起个名字…" required>${esc(draft.title)}</textarea><label class="sr-only" for="idea-body">灵感正文</label><textarea id="idea-body" class="editor-content" maxlength="10000" placeholder="再多写一点？也可以先留白。">${esc(draft.body)}</textarea><details class="editor-options"><summary>分类、心情与日期 <span>选填</span></summary><div class="editor-form-row"><label>日期 <input id="idea-date" type="date" value="${esc(draft.date)}" min="1900-01-01" max="2099-12-31" required></label><label>分类 <select id="idea-tag">${Object.keys(colors).map(t=>`<option${t===draft.tag?' selected':''}>${t}</option>`).join('')}</select></label><label>心情 <select id="idea-mood">${['平静','温柔','兴奋','游离'].map(m=>`<option${m===draft.mood?' selected':''}>${m}</option>`).join('')}</select></label></div></details><div class="editor-actions">${!isNew?`<button type="button" class="delete-button" aria-label="删除这条灵感">${icon('trash')}删除</button>`:'<span class="pop-eyebrow">一个开头，就很好。</span>'}<button type="submit" class="dark-button">${icon('check')}保存灵感</button></div><p class="save-hint" id="draft-status">${pending?'已恢复上次草稿':'输入时自动保存草稿，关闭也不会丢失。'}</p></form>`;
    $('.favorite-toggle',el).addEventListener('click',event=>{const button=event.currentTarget;const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));button.classList.toggle('is-favorite',active);stashDraft();});
    $('#idea-form',el).addEventListener('submit',event=>{event.preventDefault();saveEditor();});
    $('#idea-form',el).addEventListener('input',()=>{clearTimeout(editorSession?.timer);if(editorSession)editorSession.timer=setTimeout(stashDraft,350);});
    $('.editor-options',el).addEventListener('toggle',()=>fitWindow(el));
    $('.delete-button',el)?.addEventListener('click',()=>{
      const removed=ideas.find(i=>i.id===draft.id);if(!removed || !persist(ideas.filter(i=>i.id!==draft.id)))return;
      clearDraft(draft.id);removeWindow('editor-window');editorSession=null;render();renderDay();
      toast('已删除这个念头',{label:'撤销',run:()=>{if(persist([...ideas.filter(i=>i.id!==removed.id),removed])){render();renderDay();toast('已恢复，这个念头还在');}}});
    });
    if(isNew)$('#idea-title',el).focus({preventScroll:true});
    fitWindow(el);
  }
  function saveEditor() {
    const el=windows.get('editor-window')?.el;if(!el)return;
    if(!$('#idea-form',el).reportValidity())return;
    const draft=getDraft();if(!draft.title){toast('先给这个念头起个名字吧');$('#idea-title',el).focus();return;}draft.demo=false;
    if(!validIdea(draft)){toast('请检查日期与灵感内容');return;}
    const next=ideas.some(i=>i.id===draft.id)?ideas.map(i=>i.id===draft.id?draft:i):[...ideas,draft];
    const firstPersonal=ideas.every(i=>i.demo);
    if(!persist(next))return;
    if(firstPersonal){showExamples=false;try{localStorage.setItem(preferenceKey,'false');}catch{}}
    clearDraft(draft.id);state.selected=draft.date;removeWindow('editor-window');editorSession=null;
    if(windows.has('day-window'))windows.get('day-window').el.dataset.date=draft.date;
    render();renderDay();toast('这个念头，已经好好收下了 ✧');
  }
  function confirmAction(title,text,action,onConfirm) {
    removeWindow('confirm-window');
    const el=createWindow('confirm-window','a_small_pause','confirm-window',{left:innerWidth/2-150,top:innerHeight/2-100});
    $('.window-body',el).innerHTML=`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="confirm-actions"><button class="soft-button cancel">再想一下</button><button class="danger-button confirm">${esc(action)}</button></div>`;
    $('.cancel',el).addEventListener('click',()=>removeWindow('confirm-window'));
    $('.confirm',el).addEventListener('click',()=>{removeWindow('confirm-window');onConfirm();});
    $('.cancel',el).focus({preventScroll:true});
    fitWindow(el);
  }
  const fallbackPrompts=['如果能开一家只在深夜营业的小店，你会卖什么？','给五年前的自己，写一张只有三句话的便签。','如果今天的心情是一种天气，它会叫什么名字？','把窗外的某个声音，写成一个故事的开头。','如果月亮有一份工作，它下班后会去哪里？','设计一个能让普通周二变得可爱的微小发明。'];
  let lastPrompt=-1;
  async function promptText() {
    if(location.protocol!=='file:') {
      try{const endpoint=new URL('/api/prompt',location.href);const token=new URL(location.href).searchParams.get('token');if(token)endpoint.searchParams.set('token',token);const response=await fetch(endpoint,{signal:AbortSignal.timeout(3000),headers:{'Accept':'application/json'}});if(response.ok){const data=await response.json();if(typeof data.prompt==='string' && data.prompt.length<300)return data.prompt;}}catch{/* Offline prompts keep the interaction available. */}
    }
    lastPrompt=(lastPrompt+1+Math.floor(Math.random()*(fallbackPrompts.length-1)))%fallbackPrompts.length;return fallbackPrompts[lastPrompt];
  }
  async function openPrompt() {
    const trigger=$('#inspire-button');trigger.disabled=true;
    const prompt=await promptText();trigger.disabled=false;
    const el=createWindow('prompt-window','a_spark_from_the_night','prompt-window',{left:innerWidth/2-165,top:innerHeight/2-170});
    function paint(text){$('.window-body',el).innerHTML=`<div class="pop-eyebrow">A SMALL QUESTION, A NEW BEGINNING.</div><h2>${esc(text)}</h2><p>不需要标准答案。<br>跟着第一个冒出来的念头，写下去就好。</p><div class="prompt-actions"><button class="another-prompt">换一个问题 ↻</button><button class="dark-button begin">${icon('plus')}从这里开始</button></div>`;$('.another-prompt',el).addEventListener('click',async event=>{event.currentTarget.disabled=true;paint(await promptText());});$('.begin',el).addEventListener('click',()=>{removeWindow('prompt-window');openDay(today);openEditor(null,today,text);});}
    paint(prompt);fitWindow(el);
  }
  function resetFilters(){state.tag=null;state.query='';$('#search').value='';render();}
  $$('.nav-item').forEach(el=>el.addEventListener('click',()=>{if(!prepareNavigation())return;state.view=el.dataset.view;resetFilters();}));
  $$('.tag-nav button').forEach(el=>el.addEventListener('click',()=>{if(!prepareNavigation())return;state.tag=state.tag===el.dataset.tag?null:el.dataset.tag;state.view=state.tag?'all':'calendar';render();}));
  $('#search').addEventListener('input',event=>{if(!prepareNavigation())return;state.query=event.target.value;render();});
  $('#clear-filters').addEventListener('click',()=>{state.view='calendar';resetFilters();});
  $('#toggle-examples').addEventListener('click',()=>{if(!prepareNavigation())return;showExamples=!showExamples;try{localStorage.setItem(preferenceKey,String(showExamples));}catch{}render();});
  $('#prev-month').addEventListener('click',()=>changeMonth(-1));$('#next-month').addEventListener('click',()=>changeMonth(1));
  function changeMonth(amount){if(!prepareNavigation())return;const date=new Date(state.year,state.month+amount,1);if(date.getFullYear()<1900 || date.getFullYear()>2099)return;state.year=date.getFullYear();state.month=date.getMonth();render();}
  $('#today-button').addEventListener('click',()=>{if(!prepareNavigation())return;state.year=now.getFullYear();state.month=now.getMonth();state.selected=today;state.view='calendar';resetFilters();});
  $('#new-idea').addEventListener('click',()=>openEditor(null,today));
  $('#write-more').addEventListener('click',()=>{const title=$('#quick-title').value.trim();openEditor(null,today,title||undefined);if(title && getDraft()?.title===title)$('#quick-title').value='';});
  $('#capture-date').textContent=`记在今天 · ${now.getMonth()+1}月${now.getDate()}日`;
  $('#quick-form').addEventListener('submit',event=>{
    event.preventDefault();const title=$('#quick-title').value.trim();if(!title)return;
    const date=new Date();const item={id:uid(),date:dateKey(date),time:`${pad(date.getHours())}:${pad(date.getMinutes())}`,title,body:'',tag:'随想',mood:'平静',favorite:false,demo:false};
    const firstPersonal=ideas.every(i=>i.demo);if(!persist([...ideas,item]))return;
    if(firstPersonal){showExamples=false;try{localStorage.setItem(preferenceKey,'false');}catch{}}
    $('#quick-title').value='';state.selected=item.date;state.year=date.getFullYear();state.month=date.getMonth();state.view='calendar';state.tag=null;state.query='';$('#search').value='';
    render();renderDay();toast('记下来了。想补充时，点日期就能找到它。',{label:'展开编辑',run:()=>{openDay(item.date);openEditor(item);}});
  });
  $('#resume-draft').addEventListener('click',()=>{
    const pending=Object.values(drafts).sort((a,b)=>b.savedAt-a.savedAt)[0];if(!pending)return;
    const original=ideas.find(i=>i.id===pending.idea.id);if(!original)pending.isNew=true;
    openEditor(original || null,pending.idea.date);
  });
  $('#inspire-button').addEventListener('click',openPrompt);
  function exportIdeas(){
    stashDraft();$('#backup-menu').open=false;
    const blob=new Blob([JSON.stringify({app:'凌晨两点半',version:2,exportedAt:new Date().toISOString(),ideas,drafts:Object.values(drafts)},null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`凌晨两点半-灵感备份-${dateKey(new Date())}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('灵感与草稿已打包，换设备也能导入');
  }
  $('#export-button').addEventListener('click',exportIdeas);$('#menu-export').addEventListener('click',exportIdeas);
  $('#menu-import').addEventListener('click',()=>{$('#backup-menu').open=false;$('#import-file').click();});
  const signature=item=>JSON.stringify([item.date,item.time,item.title,item.body,item.tag,item.mood,item.favorite]);
  $('#import-file').addEventListener('change',async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;
    if(file.size>5*1024*1024){toast('文件过大，请选择 5 MB 以内的灵感备份');return;}
    try {
      const payload=JSON.parse(await file.text());
      const records=Array.isArray(payload)?payload:payload?.ideas;
      if(!Array.isArray(records)||records.length>10000 || !records.every(validIdea))throw new Error('invalid');
      const imported=records.map(i=>({id:i.id,date:i.date,time:i.time,title:i.title,body:i.body,tag:i.tag,mood:i.mood,favorite:i.favorite,demo:!!i.demo || examples.some(e=>e.title===i.title && e.body===i.body)}));
      const canonical=new Map(ideas.map(i=>[signature(i),i.id])),ids=new Set(ideas.map(i=>i.id)),idMap=new Map(),next=[...ideas];let added=0;
      for(const item of imported){const originalId=item.id,content=signature(item);if(canonical.has(content)){idMap.set(originalId,canonical.get(content));continue;}if(ids.has(item.id))item.id=uid();idMap.set(originalId,item.id);ids.add(item.id);canonical.set(content,item.id);next.push(item);added++;}
      const incomingDrafts=Array.isArray(payload?.drafts)?payload.drafts:[];
      if(incomingDrafts.length>10000 || !incomingDrafts.every(d=>d && typeof d.isNew==='boolean' && Number.isFinite(d.savedAt) && typeof d.idea?.title==='string' && validIdea({...d.idea,title:d.idea.title||'草稿'})))throw new Error('invalid drafts');
      const mergedDrafts=Object.assign(Object.create(null),drafts);
      for(const record of incomingDrafts){const original=record.idea;const clean={id:idMap.get(original.id)||original.id,date:original.date,time:original.time,title:original.title,body:original.body,tag:original.tag,mood:original.mood,favorite:original.favorite,demo:!!original.demo};if(next.some(i=>signature(i)===signature(clean)))continue;if(mergedDrafts[clean.id]){if(signature(mergedDrafts[clean.id].idea)===signature(clean))continue;clean.id=uid();}mergedDrafts[clean.id]={idea:clean,isNew:!next.some(i=>i.id===clean.id),savedAt:record.savedAt};}
      const priorIdeas=localStorage.getItem(storageKey),priorDrafts=localStorage.getItem(draftKey);
      try{localStorage.setItem(storageKey,JSON.stringify(next));localStorage.setItem(draftKey,JSON.stringify(mergedDrafts));}
      catch{
        try{priorIdeas===null?localStorage.removeItem(storageKey):localStorage.setItem(storageKey,priorIdeas);priorDrafts===null?localStorage.removeItem(draftKey):localStorage.setItem(draftKey,priorDrafts);}catch{}
        toast('空间不足，未完成导入；请先导出备份后重试');return;
      }
      ideas=next;drafts=mergedDrafts;updateDraftButton();
      if(imported.some(i=>!i.demo)){showExamples=false;try{localStorage.setItem(preferenceKey,'false');}catch{}}
      render();renderDay();toast(`导入完成：新增 ${added} 条，跳过 ${records.length-added} 条重复灵感`);
    } catch {toast('这份文件无法识别，请选择从本产品导出的 JSON 备份');}
  });
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('#backup-menu'))$('#backup-menu').open=false;});
  document.addEventListener('keydown',event=>{
    const input=event.target.closest('input,textarea,select');
    if(event.key==='Escape'){const top=[...windows.entries()].sort((a,b)=>Number(b[1].el.style.zIndex)-Number(a[1].el.style.zIndex))[0];if(top){event.preventDefault();requestClose(top[0]);}}
    if((event.ctrlKey||event.metaKey)&&event.key==='Enter' && editorSession){event.preventDefault();saveEditor();}
    if(event.key==='/' && !input){event.preventDefault();$('#search').focus();}
    if(event.key.toLowerCase()==='n' && !input && !event.ctrlKey && !event.metaKey){event.preventDefault();openEditor(null,today);}
    if(event.key==='Tab'){
      const top=[...windows.values()].sort((a,b)=>Number(b.el.style.zIndex)-Number(a.el.style.zIndex))[0]?.el;
      if(top?.contains(document.activeElement)){
        const focusables=$$('button,input,textarea,select,summary,[tabindex="0"]',top).filter(el=>!el.disabled && !el.hidden && el.getClientRects().length);
        const first=focusables[0],last=focusables.at(-1);
        if(event.shiftKey && (document.activeElement===first || document.activeElement===top)){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    }
  });
  addEventListener('beforeunload',event=>{if(dirty() && !stashDraft()){event.preventDefault();event.returnValue='';}});
  addEventListener('resize',()=>{windows.forEach(({el})=>fitWindow(el));});
  addEventListener('storage',event=>{if(event.key===storageKey){toast('另一个窗口更新了灵感；请先保存或导出当前内容，再刷新查看');}});
  function clock(){const date=new Date();$('#system-time').textContent=`${date.getMonth()+1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;}
  clock();setInterval(clock,30000);render();
  if(!storageAvailable)setTimeout(()=>toast('本地存储暂不可用，当前为演示内容，请导出备份'),800);
  // The calendar and quick input remain unobstructed until the user opens a date.
})();
