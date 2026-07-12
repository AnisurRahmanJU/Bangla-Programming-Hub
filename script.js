
/* স্ক্রল রিভিল */
(function(){
  var items = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ items.forEach(function(el){ el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){ if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); } });
  }, { threshold:0.12 });
  items.forEach(function(el){ io.observe(el); });
})();

/* মোবাইল নেভিগেশন */
(function(){
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.nav-links');
  if(!burger) return;
  burger.addEventListener('click', function(){
    var open = links.style.display === 'flex';
    links.style.display = open ? 'none' : 'flex';
    links.style.cssText += open ? '' : 'position:absolute;top:72px;left:0;right:0;flex-direction:column;background:#F3FAF2;padding:24px 32px;gap:20px;border-bottom:1px solid #D6EAD2;';
  });
})();

/* ==========================================================================
   হিরো — অ্যানিমেটেড বাংলা কোড + ফ্লোচার্ট (কন্ডিশন, লুপ, অ্যারে, স্ট্রিং)
   ========================================================================== */
(function(){
  var codeEl = document.getElementById('traceCode');
  var flowEl = document.getElementById('traceFlow');
  var statEl = document.getElementById('traceStat');
  var statusEl = document.getElementById('traceStatus');
  var fileEl = document.getElementById('traceFileName');
  var tabsEl = document.getElementById('traceTabs');
  var replayBtn = document.getElementById('traceReplay');

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ---------- code panel ---------- */
  function renderCode(ex){
    codeEl.innerHTML = ex.code.map(function(line, idx){
      var toks = line.map(function(tok){ return '<span class="tok-'+tok[0]+'">'+esc(tok[1])+'</span>'; }).join('');
      return '<div class="ln" data-line="'+idx+'"><span class="no">'+(idx+1)+'</span>'+toks+'</div>';
    }).join('');
  }
  function setActiveLine(n){
    var lns = codeEl.querySelectorAll('.ln');
    lns.forEach(function(ln){ ln.classList.remove('active'); });
    if(n!==null && n!==undefined && lns[n]) lns[n].classList.add('active');
  }

  /* ---------- flowchart primitives ---------- */
  var ARROW_DEFS = '<defs><marker id="arrowhead" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#9DB79A"/></marker></defs>';

  function node(id, cx, cy, w, h, lines, shape){
    var shapeMarkup;
    if(shape==='term'){ shapeMarkup='<rect x="'+(cx-w/2)+'" y="'+(cy-h/2)+'" width="'+w+'" height="'+h+'" rx="'+(h/2)+'"/>'; }
    else if(shape==='decision'){ shapeMarkup='<polygon points="'+cx+','+(cy-h/2)+' '+(cx+w/2)+','+cy+' '+cx+','+(cy+h/2)+' '+(cx-w/2)+','+cy+'"/>'; }
    else { shapeMarkup='<rect x="'+(cx-w/2)+'" y="'+(cy-h/2)+'" width="'+w+'" height="'+h+'" rx="10"/>'; }
    var startDy = -((lines.length-1)*17)/2 + 5;
    var tspans = lines.map(function(l,i){ return '<tspan x="'+cx+'" dy="'+(i===0?startDy:17)+'">'+esc(l)+'</tspan>'; }).join('');
    return '<g id="node-'+id+'" class="flow-node flow-'+shape+'">'+shapeMarkup+'<text class="flow-text" text-anchor="middle" x="'+cx+'" y="'+cy+'">'+tspans+'</text></g>';
  }
  function arrow(x1,y1,x2,y2,label){
    var out = '<line class="flow-arrow-line" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" marker-end="url(#arrowhead)"/>';
    if(label){ out += '<text class="flow-arrow-label" x="'+((x1+x2)/2+12)+'" y="'+((y1+y2)/2)+'">'+esc(label)+'</text>'; }
    return out;
  }
  function path(d,label,lx,ly){
    var out = '<path class="flow-arrow-line" d="'+d+'" marker-end="url(#arrowhead)"/>';
    if(label){ out += '<text class="flow-arrow-label" x="'+lx+'" y="'+ly+'">'+esc(label)+'</text>'; }
    return out;
  }

  function renderBranchFlow(f){
    var s = node('start',170,30,150,38,f.start,'term');
    var i = node('input',170,104,280,54,f.input,'proc');
    var d = node('decision',170,232,220,124,f.decision,'decision');
    var y = node('yes',95,358,150,60,f.yes,'proc');
    var no = node('no',245,358,150,60,f.no,'proc');
    var e = node('end',170,428,150,38,f.end,'term');
    var arrows = arrow(170,49,170,77) + arrow(170,131,170,170) +
      arrow(130,278,105,328,'হ্যাঁ') + arrow(210,278,235,328,'না') +
      arrow(95,388,140,409) + arrow(245,388,200,409);
    return ARROW_DEFS + s+i+d+y+no+e + arrows;
  }

  function renderLoopFlow(f){
    var s = node('start',150,30,140,38,f.start,'term');
    var iN = node('init',150,104,260,54,f.init,'proc');
    var d = node('decision',150,232,220,124,f.decision,'decision');
    var b = node('body',322,232,150,84,f.body,'proc');
    var e = node('end',150,428,140,38,f.end,'term');
    var arrows = arrow(150,49,150,77) + arrow(150,131,150,170) +
      arrow(260,232,247,232,'হ্যাঁ') +
      path('M322,190 L322,132 L150,132 L150,170','','236','122') +
      arrow(150,294,150,409,'না');
    return ARROW_DEFS + s+iN+d+b+e + arrows;
  }

  function renderLinearFlow(nodes){
    var cx=170, y=30, gapTerm=24, gapProc=22, termH=38, procH=66, procW=300;
    var parts = [node('start',cx,y,150,termH,['শুরু'],'term')];
    var prevY = y, prevH = termH;
    y += termH/2 + gapTerm + procH/2;
    nodes.forEach(function(n){
      parts.push(node(n.id,cx,y,procW,procH,n.lines,'proc'));
      parts.push(arrow(cx, prevY + prevH/2, cx, y - procH/2));
      prevY = y; prevH = procH;
      y += procH/2 + gapProc + procH/2;
    });
    y = y - procH/2 - gapProc + gapTerm + termH/2;
    parts.push(node('end',cx,y,150,termH,['শেষ'],'term'));
    parts.push(arrow(cx, prevY + prevH/2, cx, y - termH/2));
    var totalHeight = y + termH/2 + 22;
    return { svg: ARROW_DEFS + parts.join(''), height: Math.round(totalHeight), width: 340 };
  }

  function renderFlow(ex){
    if(ex.flowType==='branch'){
      flowEl.innerHTML = '<svg class="flow-svg" viewBox="0 0 340 460" xmlns="http://www.w3.org/2000/svg">'+renderBranchFlow(ex.flow)+'</svg>';
    } else if(ex.flowType==='loop'){
      flowEl.innerHTML = '<svg class="flow-svg" viewBox="0 0 410 460" xmlns="http://www.w3.org/2000/svg">'+renderLoopFlow(ex.flow)+'</svg>';
    } else {
      var built = renderLinearFlow(ex.flowNodes);
      flowEl.innerHTML = '<svg class="flow-svg" viewBox="0 0 340 '+built.height+'" xmlns="http://www.w3.org/2000/svg">'+built.svg+'</svg>';
    }
    if(ex.dim){ ex.dim.forEach(function(id){ var g=flowEl.querySelector('#node-'+id); if(g) g.classList.add('dim'); }); }
  }
  function setActiveNode(id){
    flowEl.querySelectorAll('.flow-node').forEach(function(g){ g.classList.remove('active'); });
    if(id){ var g = flowEl.querySelector('#node-'+id); if(g) g.classList.add('active'); }
  }

  /* ---------- examples: কন্ডিশন, লুপ, অ্যারে, স্ট্রিং ---------- */
  var EXAMPLES = {
    condition:{
      file:'জোড়_বিজোড়.blc',
      code:[
        [['var','সংখ্যা = ১০']],
        [['kw','যদি'],['var',' সংখ্যা % ২ == ০:']],
        [['fn','    দেখাও'],['var','("জোড়")']],
        [['kw','নাহলে'],['var',':']],
        [['fn','    দেখাও'],['var','("বিজোড়")']]
      ],
      flowType:'branch', dim:['no'],
      flow:{ start:['শুরু'], input:['সংখ্যা = ১০'], decision:['সংখ্যা % ২','== ০ ?'], yes:['দেখাও("জোড়")'], no:['দেখাও("বিজোড়")'], end:['শেষ'] },
      steps:[
        {node:'start', line:null, cap:'প্রোগ্রাম শুরু হলো।'},
        {node:'input', line:0, cap:'সংখ্যা এর মান ১০ ধরে নেওয়া হলো।'},
        {node:'decision', line:1, cap:'শর্ত পরীক্ষা: সংখ্যা % ২ == ০ ?'},
        {node:'yes', line:2, cap:'শর্ত সত্য, তাই "জোড়" দেখানো হলো।'},
        {node:'end', line:null, cap:'প্রোগ্রাম শেষ।'}
      ]
    },
    loop:{
      file:'গণনা_লুপ.blc',
      code:[
        [['kw','লুপ'],['var',' ক = ১ থেকে ৫:']],
        [['fn','    দেখাও'],['var','(ক)']]
      ],
      flowType:'loop',
      flow:{ start:['শুরু'], init:['i = ১'], decision:['i <= ৫','?'], body:['দেখাও(i)','i = i + ১'], end:['শেষ'] },
      steps:[
        {node:'start', line:null, cap:'প্রোগ্রাম শুরু হলো।'},
        {node:'init', line:0, cap:'i এর মান ১ ধরে নেওয়া হলো।'},
        {node:'decision', line:0, cap:'শর্ত পরীক্ষা: i <= ৫ ? (হ্যাঁ)'},
        {node:'body', line:1, cap:'দেখাও(১) — এখন i = ২।'},
        {node:'decision', line:0, cap:'শর্ত পরীক্ষা: i <= ৫ ? (হ্যাঁ)'},
        {node:'body', line:1, cap:'দেখাও(২) — এখন i = ৩।'},
        {node:'decision', line:0, cap:'শর্ত পরীক্ষা: i <= ৫ ? (হ্যাঁ)'},
        {node:'body', line:1, cap:'দেখাও(৩) — লুপ চলতেই থাকবে…'},
        {node:'end', line:null, cap:'i = ৬ হলে শর্ত মিথ্যা হবে, লুপ থেমে যাবে।'}
      ]
    },
    array:{
      file:'যোগফল_তালিকা.blc',
      code:[
        [['var','তালিকা = [৫, ১০, ১৫]']],
        [['var','যোগফল = ০']],
        [['kw','জন্য'],['var',' সংখ্যা in তালিকা:']],
        [['var','    যোগফল = যোগফল + সংখ্যা']],
        [['fn','দেখাও'],['var','(যোগফল)']]
      ],
      flowType:'loop',
      flow:{ start:['শুরু'], init:['তালিকা তৈরি,','যোগফল = ০'], decision:['আরও উপাদান','আছে কি ?'], body:['যোগফল = যোগফল','+ সংখ্যা'], end:['দেখাও(যোগফল)'] },
      steps:[
        {node:'start', line:null, cap:'প্রোগ্রাম শুরু হলো।'},
        {node:'init', line:0, cap:'তালিকা তৈরি ও যোগফল = ০ ধরে নেওয়া হলো।'},
        {node:'decision', line:2, cap:'উপাদান আছে কি? হ্যাঁ (৫)।'},
        {node:'body', line:3, cap:'যোগফল = ০ + ৫ = ৫।'},
        {node:'decision', line:2, cap:'উপাদান আছে কি? হ্যাঁ (১০)।'},
        {node:'body', line:3, cap:'যোগফল = ৫ + ১০ = ১৫।'},
        {node:'decision', line:2, cap:'উপাদান আছে কি? হ্যাঁ (১৫)।'},
        {node:'body', line:3, cap:'যোগফল = ১৫ + ১৫ = ৩০।'},
        {node:'end', line:4, cap:'আর উপাদান নেই — দেখাও(৩০)।'}
      ]
    },
    string:{
      file:'পূর্ণ_নাম.blc',
      code:[
        [['var','নাম১ = "আনিছুর"']],
        [['var','নাম২ = "রহমান"']],
        [['var','পূর্ণ_নাম = নাম১ + " " + নাম২']],
        [['fn','দেখাও'],['var','(পূর্ণ_নাম)']]
      ],
      flowType:'linear',
      flowNodes:[
        {id:'n1', lines:['নাম১ = "সাকিব"']},
        {id:'n2', lines:['নাম২ = "রহমান"']},
        {id:'n3', lines:['যুক্ত করো:','নাম১+" "+নাম২']},
        {id:'n4', lines:['দেখাও(পূর্ণ_নাম)']}
      ],
      steps:[
        {node:'start', line:null, cap:'প্রোগ্রাম শুরু হলো।'},
        {node:'n1', line:0, cap:'নাম১ এ "সাকিব" রাখা হলো।'},
        {node:'n2', line:1, cap:'নাম২ এ "রহমান" রাখা হলো।'},
        {node:'n3', line:2, cap:'দুটি স্ট্রিং যুক্ত করা হলো: "সাকিব রহমান"।'},
        {node:'n4', line:3, cap:'ফলাফল দেখানো হলো: সাকিব রহমান।'},
        {node:'end', line:null, cap:'প্রোগ্রাম শেষ।'}
      ]
    }
  };

  var current = 'condition', timer = null, stepIdx = 0;
  var STEP_MS = 1450;

  function loadExample(key){
    current = key;
    var ex = EXAMPLES[key];
    fileEl.textContent = ex.file;
    renderCode(ex);
    renderFlow(ex);
    stepIdx = 0;
    statusEl.textContent = 'চলছে';
    statEl.textContent = 'শুরু হচ্ছে…';
    setActiveLine(null);
    setActiveNode(null);
    play();
  }
  function play(){
    clearInterval(timer);
    timer = setInterval(function(){
      var ex = EXAMPLES[current];
      if(stepIdx >= ex.steps.length){
        statusEl.textContent = 'সম্পন্ন ✓';
        clearInterval(timer);
        setTimeout(function(){ loadExample(current); }, 1900);
        return;
      }
      var step = ex.steps[stepIdx];
      setActiveLine(step.line);
      setActiveNode(step.node);
      statEl.textContent = step.cap;
      stepIdx++;
    }, STEP_MS);
  }

  tabsEl.addEventListener('click', function(e){
    var btn = e.target.closest('button'); if(!btn) return;
    tabsEl.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    loadExample(btn.dataset.ex);
  });
  replayBtn.addEventListener('click', function(){ loadExample(current); });
  loadExample('condition');
})();

/* ==========================================================================
   ক্যাটালগ ফিল্টার
   ========================================================================== */
(function(){
  var chips=document.querySelectorAll('.filter-chip'); var cards=document.querySelectorAll('.course-card');
  chips.forEach(function(chip){ chip.addEventListener('click', function(){
    chips.forEach(function(c){ c.classList.remove('active'); }); chip.classList.add('active');
    var f=chip.dataset.filter;
    cards.forEach(function(card){ card.style.display = (f==='all' || card.dataset.cat===f) ? '' : 'none'; });
  }); });
})();

/* ==========================================================================
   প্রশ্নোত্তর অ্যাকর্ডিয়ন
   ========================================================================== */
(function(){
  var list=document.getElementById('faqList'); var items=list.querySelectorAll('.faq-item');
  function setHeights(){ items.forEach(function(item){ var a=item.querySelector('.faq-a'); a.style.maxHeight = item.classList.contains('open') ? a.scrollHeight+'px' : '0px'; }); }
  items.forEach(function(item){ item.querySelector('.faq-q').addEventListener('click', function(){
    var wasOpen=item.classList.contains('open'); items.forEach(function(i){ i.classList.remove('open'); }); if(!wasOpen) item.classList.add('open'); setHeights();
  }); });
  setHeights(); window.addEventListener('resize', setHeights);
})();
