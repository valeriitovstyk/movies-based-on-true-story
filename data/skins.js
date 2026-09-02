// Скіни сайту. Щоб додати новий, скопіюйте один об'єкт у масив SKINS
// і змініть id, label, tone та palette. Решту сайту редагувати не потрібно.
(function(){
  'use strict';

  const STORAGE_KEY='bn_skin';
  const LIGHT={
    '--bg':'#E7E8EA','--surface':'#FCFCFB','--surface-2':'#F1F1EF','--raise':'#FFFFFF',
    '--ink':'#15171B','--ink-2':'#4B515B','--ink-3':'#7B828D',
    '--line':'#D4D7DB','--line-2':'#E2E4E7',
    '--accent':'#8A5A22','--accent-2':'#B07C34','--accent-bg':'rgba(138,90,34,.10)',
    '--good':'#2F6B4F','--good-bg':'rgba(47,107,79,.10)',
    '--warn':'#8C3B2E','--warn-bg':'rgba(140,59,46,.10)',
    '--u-ira':'#0F766E','--u-ira-on':'#FFFFFF','--u-olena':'#6D28D9','--u-olena-on':'#FFFFFF',
    '--u-alex':'#1D4ED8','--u-alex-on':'#FFFFFF','--u-laverka':'#BE123C','--u-laverka-on':'#FFFFFF'
  };
  const NIGHT={
    '--bg':'#121418','--surface':'#1A1D22','--surface-2':'#22262C','--raise':'#242830',
    '--ink':'#ECEEF1','--ink-2':'#A6ACB6','--ink-3':'#767D88',
    '--line':'#2B3037','--line-2':'#232830',
    '--accent':'#D9A254','--accent-2':'#E5B979','--accent-bg':'rgba(217,162,84,.14)',
    '--good':'#6FBF95','--good-bg':'rgba(111,191,149,.14)',
    '--warn':'#E39181','--warn-bg':'rgba(227,145,129,.13)',
    '--u-ira':'#5EEAD4','--u-ira-on':'#0C211E','--u-olena':'#C4B5FD','--u-olena-on':'#1C1533',
    '--u-alex':'#93C5FD','--u-alex-on':'#0F1D33','--u-laverka':'#FDA4AF','--u-laverka-on':'#33121B'
  };

  const SKINS=[
    {id:'system',label:'Системний',tone:'system'},
    {id:'classic',label:'Світлий',tone:'light',palette:LIGHT},
    {id:'night',label:'Нічний',tone:'dark',palette:NIGHT},
    {id:'archive',label:'Архів',tone:'light',palette:{
      '--bg':'#DDD2B8','--surface':'#F6EEDC','--surface-2':'#EDE2C8','--raise':'#FFF9EA',
      '--ink':'#2B271F','--ink-2':'#5D5547','--ink-3':'#877B67',
      '--line':'#C6B99D','--line-2':'#D9CDB4',
      '--accent':'#7A4328','--accent-2':'#A06138','--accent-bg':'rgba(122,67,40,.11)',
      '--good':'#3D644E','--good-bg':'rgba(61,100,78,.12)',
      '--warn':'#963C32','--warn-bg':'rgba(150,60,50,.11)',
      '--u-ira':'#20736B','--u-ira-on':'#FFFFFF','--u-olena':'#6F4C8B','--u-olena-on':'#FFFFFF',
      '--u-alex':'#315C91','--u-alex-on':'#FFFFFF','--u-laverka':'#A23F55','--u-laverka-on':'#FFFFFF'
    }},
    {id:'cinema',label:'Кінозал',tone:'dark',palette:{
      '--bg':'#130D0F','--surface':'#211619','--surface-2':'#2A1B1E','--raise':'#321F23',
      '--ink':'#F5E9D0','--ink-2':'#C7B7A4','--ink-3':'#8E7C73',
      '--line':'#493035','--line-2':'#352327',
      '--accent':'#E3B354','--accent-2':'#F1CE7B','--accent-bg':'rgba(227,179,84,.14)',
      '--good':'#7CC6A2','--good-bg':'rgba(124,198,162,.13)',
      '--warn':'#F08B75','--warn-bg':'rgba(240,139,117,.13)',
      '--u-ira':'#66D1C5','--u-ira-on':'#10211F','--u-olena':'#C9B1FF','--u-olena-on':'#211632',
      '--u-alex':'#91BFFF','--u-alex-on':'#101D30','--u-laverka':'#FF9EAE','--u-laverka-on':'#32121A'
    }}
  ];

  const root=document.documentElement;
  const media=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
  const variableNames=[...new Set(SKINS.flatMap(s=>Object.keys(s.palette||{})).concat(Object.keys(LIGHT),Object.keys(NIGHT)))];
  let selected='system';

  function getSaved(){
    try{return localStorage.getItem(STORAGE_KEY)||'system';}catch(e){return'system';}
  }
  function save(id){
    try{localStorage.setItem(STORAGE_KEY,id);}catch(e){}
  }
  function find(id){return SKINS.find(s=>s.id===id)||SKINS[0];}
  function resolve(skin){
    if(skin.id!=='system')return skin;
    return media&&media.matches
      ?{...skin,tone:'dark',palette:NIGHT}
      :{...skin,tone:'light',palette:LIGHT};
  }
  function apply(id,persist=true){
    const skin=find(id),resolved=resolve(skin);
    variableNames.forEach(name=>root.style.removeProperty(name));
    Object.entries(resolved.palette).forEach(([name,value])=>root.style.setProperty(name,value));
    selected=skin.id;
    root.dataset.skin=skin.id;
    root.dataset.skinTone=resolved.tone;
    root.style.colorScheme=resolved.tone;
    if(persist)save(skin.id);
    window.dispatchEvent(new CustomEvent('site-skin-change',{detail:{id:skin.id,tone:resolved.tone}}));
    return skin.id;
  }

  window.SiteSkins={
    list:SKINS.map(({id,label,tone})=>({id,label,tone})),
    apply,
    current:()=>selected
  };
  apply(getSaved(),false);

  const onSystemChange=()=>{if(selected==='system')apply('system',false);};
  if(media){
    if(media.addEventListener)media.addEventListener('change',onSystemChange);
    else if(media.addListener)media.addListener(onSystemChange);
  }
})();
