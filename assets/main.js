const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');if(toggle&&nav){const closeMenu=({restoreFocus=false}={})=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');if(restoreFocus)toggle.focus();};toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>closeMenu()));document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open'))closeMenu({restoreFocus:true});});}

/* Accessible, lightweight science animations shared by every lab page. */
(()=>{
  const main=document.querySelector('main');
  if(!main || !main.classList.contains('lab') || document.querySelector('.science-motion')) return;
  const pageText=(document.querySelector('main')?.innerText||document.title).toLowerCase();
  const pageId=(location.pathname+' '+document.title).toLowerCase();
  const label=document.querySelector('.tag, .hero .tag, main .hero > div')?.textContent||'SCIENCE';
  // Prefer the explicit lab filename/title over broad body keywords (e.g. "energy"),
  // which can otherwise misclassify chemistry and biology investigations as physics.
  const subjectMatch=pageId.match(/(?:^|[-_ ])(physics|chemistry|biology|earth|space)(?:[-_ .]|$)/);
  const subjectLabel=(document.querySelector('[data-subject], .subject-tag, .lab-subject, .tag')?.textContent||'').toLowerCase();
  const subjectFromLabel=/physics|chemistry|biology|earth|space/.exec(subjectLabel)?.[0];
  const isPhysics=/physics|motion|force|wave|sound|light|circuit|energy|magnet|gravity|pressure|heat|optics|electric|momentum|projectile|velocity|work|fluid|rotation|relativity|nuclear|particle/.test(pageText);
  const isChemistry=/chemistry|atom|molecule|chemical|reaction|bond|acid|base|solution|element|compound|periodic|redox|equilibrium|stoichiometry|organic|titration|polymer|electrochem/.test(pageText);
  const isBiology=/biology|cell|organism|photosynthesis|respiration|genetic|dna|protein|enzyme|ecology|ecosystem|evolution|human body|circulation|immune|homeostasis|plant|neuron|brain|reproduction|microorganism/.test(pageText);
  const isEarth=/earth science|space science|water cycle|weather|atmosphere|geology|rock cycle|tectonic|erosion|weathering|solar system|moon phase|precipitation|evaporation|condensation/.test(pageText);
  const detectedSubject=subjectMatch?.[1]||subjectFromLabel;
  const kind=detectedSubject==='space'?'earth':detectedSubject||(isChemistry?'chemistry':isBiology?'biology':isEarth?'earth':isPhysics?'physics':'earth');
  const config={
    physics:{title:'Physics in motion',copy:'Watch a simplified wave and moving particles. Change the experiment variables above and compare the pattern with your results.',shape:'<svg viewBox="0 0 560 190" role="img" aria-label="Animated wave travelling across a medium"><path class="motion-wave" d="M0 95 Q35 20 70 95 T140 95 T210 95 T280 95 T350 95 T420 95 T490 95 T560 95"/><path class="motion-axis" d="M0 95H560"/><circle class="motion-runner" cx="24" cy="95" r="8"/><circle class="motion-runner runner-two" cx="24" cy="95" r="5"/></svg>'},
    chemistry:{title:'Particles and reactions',copy:'Observe a schematic particle model with continuous molecular motion. The animation is illustrative and does not represent exact particle sizes, speeds or reaction pathways.',shape:'<div class="particle-scene" role="img" aria-label="Animated particles moving and interacting"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><b></b></div>'},
    biology:{title:'Living systems in action',copy:'Watch a simplified cell model with moving particles and a pulsing nucleus. Use it as a visual aid alongside the biological explanation in this investigation.',shape:'<div class="cell-scene" role="img" aria-label="Animated cell with a pulsing nucleus and moving molecules"><i class="cell-nucleus"></i><i class="cell-dot d1"></i><i class="cell-dot d2"></i><i class="cell-dot d3"></i><i class="cell-dot d4"></i><i class="cell-dot d5"></i></div>'},
    earth:{title:'Earth systems in motion',copy:'Explore a simple animated cycle. It is a conceptual illustration; use the investigation results and labels for scientific interpretation.',shape:'<div class="cycle-scene" role="img" aria-label="Animated water cycle with rising vapour and falling droplets"><i class="sun"></i><i class="cloud"></i><i class="vapour v1"></i><i class="vapour v2"></i><i class="rain r1"></i><i class="rain r2"></i><i class="ground"></i></div>'}
  }[kind];
  const section=document.createElement('section');
  section.className='science-motion panel';
  section.setAttribute('aria-labelledby','science-motion-title');
  section.innerHTML='<div class="motion-heading"><div><p class="motion-kicker">VISUALISE THE CONCEPT · '+label.replace(/[<>&"]/g,'')+'</p><h2 id="science-motion-title">'+config.title+'</h2></div><button type="button" class="motion-toggle" aria-pressed="false">Pause animation</button></div><div class="motion-stage motion-'+kind+'">'+config.shape+'</div><p class="motion-caption">'+config.copy+'</p><p class="motion-note">Schematic animation · Not to scale · Supports, but does not replace, the experiment model</p>';
  const footer=document.querySelector('footer');
  if(footer && footer.parentNode===main.parentNode) main.parentNode.insertBefore(section,footer); else main.appendChild(section);
  const toggle=section.querySelector('.motion-toggle');
  const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotionPreference=()=>{
    if(motionPreference.matches){
      section.classList.add('motion-paused');
      toggle.disabled=true;
      toggle.textContent='Animation off (reduced motion)';
      toggle.setAttribute('aria-pressed','true');
      toggle.setAttribute('aria-label','Animation disabled because reduced motion is enabled in system settings');
    }else{
      section.classList.remove('motion-paused');
      toggle.disabled=false;
      toggle.textContent='Pause animation';
      toggle.setAttribute('aria-pressed','false');
      toggle.removeAttribute('aria-label');
    }
  };
  toggle.addEventListener('click',()=>{
    if(motionPreference.matches) return;
    const paused=section.classList.toggle('motion-paused');
    toggle.textContent=paused?'Play animation':'Pause animation';
    toggle.setAttribute('aria-pressed',String(paused));
  });
  syncMotionPreference();
  if(typeof motionPreference.addEventListener==='function'){
    motionPreference.addEventListener('change',syncMotionPreference);
  }else if(typeof motionPreference.addListener==='function'){
    motionPreference.addListener(syncMotionPreference);
  }
})();


/* Search and filter the grade directory without hiding its underlying links from no-script users. */
(()=> {
  const field=document.querySelector('#lab-search');
  const status=document.querySelector('#lab-search-status');
  const directory=document.querySelector('.directory');
  if(!field||!directory) return;
  const entries=[...directory.querySelectorAll('.subject li')];
  const groups=[...directory.querySelectorAll('.grade')];
  const normalise=value=>value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const filter=()=>{
    const query=normalise(field.value);
    let visible=0;
    entries.forEach(item=>{
      const match=!query||normalise(item.textContent).includes(query);
      item.hidden=!match;
      if(match) visible++;
    });
    groups.forEach(group=>{
      const hasVisible=[...group.querySelectorAll('.subject li')].some(item=>!item.hidden);
      group.hidden=!!query&&!hasVisible;
    });
    if(status) status.textContent=query?visible+' matching lab'+(visible===1?'':'s')+' found.':'Showing all '+entries.length+' lab links.';
  };
  field.addEventListener('input',filter);
  field.addEventListener('search',filter);
})();


/* Give learners a consistent route from every investigation to their report workspace. */
(()=>{
  const main=document.querySelector('main.lab');
  if(!main||main.querySelector('.notebook-prompt')) return;
  const hero=main.querySelector('.hero');
  if(!hero) return;
  const prompt=document.createElement('aside');
  prompt.className='notebook-prompt';
  prompt.innerHTML='<span><strong>Ready to record your results?</strong><small>Save your prediction, observations and conclusion in your lab notebook.</small></span><a href="student-lab-notebook.html">Open my lab notebook <span aria-hidden="true">→</span></a>';
  hero.insertAdjacentElement('afterend',prompt);
})();
