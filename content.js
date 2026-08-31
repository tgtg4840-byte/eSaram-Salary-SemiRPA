(() => {
  const EXISTING_ID = "__esaram_salary_semirpa_v6_2__";
  const existing = document.getElementById(EXISTING_ID);
  if (existing) {
    existing.style.display = "block";
    return;
  }

  const state = {
    workbook: null,
    employees: [],
    items: [],
    index: 0,
    phase: "phase1",
    running: false,
    stop: false,
    manualMap: {nameInput: "", lookupButton: "", confirmButton: "", queryButton: "", copyPreviousButton: "", saveButton: ""},
    mappingKey: null,
    copied: new Set()
  };

  const host = document.createElement("div");
  host.id = EXISTING_ID;
  Object.assign(host.style, {
    position: "fixed", right: "12px", top: "12px", width: "530px", height: "680px",
    maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100vh - 24px)", minWidth: "390px", minHeight: "420px",
    resize: "both", overflow: "auto", zIndex: "2147483647",
    fontFamily: "Arial,'Malgun Gothic',sans-serif"
  });
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({mode: "open"});

  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box}
      .panel{background:#fff;border:1px solid #aebdca;border-radius:12px;
        box-shadow:0 14px 34px rgba(0,0,0,.22);overflow:auto;color:#17212b;min-height:100%;max-height:100%}
      header{display:flex;align-items:center;gap:8px;
        padding:9px 11px;background:#155a9c;color:#fff;position:sticky;top:0;z-index:5}
      header b{font-size:14px;flex:1}
      header select{font-size:10px;border:1px solid rgba(255,255,255,.5);border-radius:6px;padding:4px;background:#fff;color:#17324a}
      header button{background:transparent;color:#fff;border:0;font-size:17px;cursor:pointer}
      section{border-top:1px solid #e3e9ee}
      .title{padding:9px 12px;background:#f5f8fa;font-size:12px;font-weight:700}
      .content{padding:11px 12px}
      input[type=file]{width:100%;font-size:12px}
      button{border:1px solid #bcc9d3;border-radius:7px;padding:7px 9px;background:#fff;
        cursor:pointer;font-size:11px}
      button.primary{background:#155a9c;border-color:#155a9c;color:#fff;font-weight:700}
      button.success{background:#137b50;border-color:#137b50;color:#fff;font-weight:700}
      button.danger{background:#a93636;border-color:#a93636;color:#fff}
      button:disabled{opacity:.45;cursor:not-allowed}
      .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
      .status{font-size:11px;font-weight:700;margin-left:auto}
      .meta,.guide{font-size:11px;color:#5c6975;line-height:1.5;margin-top:7px}
      .guide{padding:8px;border-radius:7px;background:#fff6dc;border:1px solid #edd39a;color:#6e4e12}
      .mapping{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center}
      .mapping span{font-size:11px}
      .ok{color:#14764d;font-weight:700}.bad{color:#b13939;font-weight:700}
      table{border-collapse:collapse;width:100%;font-size:10px;margin-top:8px}
      th,td{border:1px solid #d8e0e6;padding:5px;text-align:left}
      th{background:#eef3f7}
      .scroll{max-height:190px;overflow:auto}
      .log{height:105px;overflow:auto;background:#111820;color:#dbe7ef;padding:8px;
        font:10px/1.5 Consolas,monospace}
      .warn{color:#ffd07a}.error{color:#ff8f8f}.good{color:#82e2b6}
      label.check{font-size:11px;display:flex;align-items:center;gap:5px;margin-top:8px}
      .hidden{display:none}
      .item-list{display:grid;gap:6px;margin-top:8px;max-height:320px;overflow-y:auto;overscroll-behavior:contain;padding-right:4px;scrollbar-gutter:stable}
      .item-group{font-size:11px;font-weight:700;color:#334b5e;margin-top:10px}
      .pay-item{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:center;
        border:1px solid #d8e0e6;border-radius:8px;padding:7px 8px;background:#fff}
      .pay-item.copied{background:#edf8f2;border-color:#91c9ad}
      .pay-item.keep{background:#f5f7f8;color:#7a8791}
      .pay-name{font-size:11px;font-weight:700}
      .pay-amount{font:700 12px Consolas,monospace;text-align:right;white-space:nowrap}
      .person-box{padding:8px;border:1px solid #d7e2ea;border-radius:8px;background:#f7fafc;margin-bottom:8px}
      .person-name{font-size:14px;font-weight:700}.person-meta{font-size:10px;color:#657481;margin-top:3px}
    </style>
    <div class="panel">
      <header><b>표준 e-사람 보수입력 Semi-RPA v6.2</b><select id="size" title="창 크기"><option value="small">작게</option><option value="medium" selected>보통</option><option value="large">크게</option></select><button id="close">×</button></header>

      <section>
        <div class="title">1. 전용 XLSX 불러오기</div>
        <div class="content">
          <input id="file" type="file" accept=".xlsx">
          <div id="fileMeta" class="meta">간편양식 v4.2의 급여입력 시트만 작성하십시오.</div>
        </div>
      </section>

      <section>
        <div class="title">2. 필수 화면요소</div>
        <div class="content mapping">
          <span>성명 입력란</span><span id="nameState" class="bad">미확인</span><button data-map="nameInput">수동 맵핑</button>
          <span>이름 옆 돋보기</span><span id="confirmState" class="bad">미확인</span><button data-map="lookupButton">수동 맵핑</button>
          <span>조회 버튼</span><span id="queryState" class="bad">미확인</span><button data-map="queryButton">수동 맵핑</button>
          <span>보수자료복사</span><span id="copyPreviousState" class="bad">미확인</span><button data-map="copyPreviousButton">수동 맵핑</button>
          <span>저장 버튼</span><span id="saveState" class="bad">미확인</span><button data-map="saveButton">수동 맵핑</button>
        </div>
        <div id="mapGuide" class="guide hidden"></div>
      </section>

      <section>
        <div class="title">3. 대상자별 실행</div>
        <div class="content">
          <div id="personBox" class="person-box"></div>
          <div class="row">
            <button id="phase1" class="primary" disabled>Phase 1 · 조회</button>
            <button id="copyPrevious" disabled>보수자료복사</button>
            <button id="save" class="success" disabled>저장</button>
            <button id="back" disabled>뒤로가기</button>
          </div>
          <div id="progress" class="meta">XLSX를 불러오십시오.</div>
          <div class="guide">화면값 인식·비교·자동입력은 수행하지 않습니다. 아래 예정금액을 복사하여 e-사람에 직접 붙여넣은 뒤 저장하십시오.</div>
          <div id="itemList" class="item-list"></div>
        </div>
      </section>

      <section>
        <div class="title">로그</div>
        <div id="log" class="log"></div>
      </section>
    </div>`;

  const $ = id => shadow.getElementById(id);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  function log(message, type="") {
    const line = document.createElement("div");
    if (type) line.className = type;
    line.textContent = `[${new Date().toLocaleTimeString("ko-KR")}] ${message}`;
    $("log").appendChild(line);
    $("log").scrollTop = $("log").scrollHeight;
  }

  function visible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  }

  function normText(v) {
    return String(v ?? "").replace(/\s+/g, "").trim().toLowerCase();
  }

  function normMoney(v) {
    const text = String(v ?? "").replace(/[,\s₩원]/g, "");
    const m = text.match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
  }

  function formatMoney(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString("ko-KR") : "";
  }


  // 금액값과 "항목 자체가 없음"을 구분한다.
  // null: 사이트에 해당 항목 행이 존재하지 않음 또는 숫자로 판독할 수 없음
  // 0: 항목 행은 존재하지만 금액 셀이 비어 있거나 0으로 표시됨
  function normalizeValue(v){
    if(v===null||v===undefined)return null;
    if(typeof v==="number")return Number.isFinite(v)?v:null;
    const s=String(v).trim();
    if(s===""||s==="-")return 0;
    const n=Number(s.replace(/[,\s₩원]/g,""));
    return Number.isFinite(n)?n:null;
  }

  function sameAmount(a,b){
    const left=normalizeValue(a);
    const right=normalizeValue(b);
    return left!==null && right!==null && left===right;
  }


  function cssEscape(v) {
    return window.CSS?.escape ? CSS.escape(v) : String(v).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function makeSelector(el) {
    if (el.id) return `#${cssEscape(el.id)}`;
    const aria = el.getAttribute("aria-label");
    if (aria) return `${el.tagName.toLowerCase()}[aria-label="${aria.replace(/"/g, '\\"')}"]`;
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body && parts.length < 6) {
      let p = cur.tagName.toLowerCase();
      const parent = cur.parentElement;
      if (parent) {
        const same = [...parent.children].filter(x => x.tagName === cur.tagName);
        if (same.length > 1) p += `:nth-of-type(${same.indexOf(cur)+1})`;
      }
      parts.unshift(p);
      cur = parent;
    }
    return parts.join(" > ");
  }

  function findManual(key) {
    const sel = state.manualMap[key];
    if (!sel) return null;
    try { return document.querySelector(sel); } catch { return null; }
  }

  function activeDialog() {
    const candidates = [...document.querySelectorAll(
      '[role="dialog"],.cl-dialog,.cl-window,.cl-modal,body'
    )].filter(visible);
    const matching = candidates.filter(el =>
      normText(el.textContent).includes(normText("공무직 보수실적관리"))
    );
    return matching.at(-1) || document.body;
  }

  function findLabeledInput(labelText) {
    const root = activeDialog();
    const direct = [...root.querySelectorAll("input,textarea")].find(el =>
      visible(el) && normText(el.getAttribute("aria-label")).includes(normText(labelText))
    );
    if (direct) return direct;

    for (const el of [...root.querySelectorAll("label,span,div")]) {
      if (!visible(el) || normText(el.textContent) !== normText(labelText)) continue;
      const forId = el.getAttribute("for");
      if (forId) {
        const target = root.querySelector(`#${cssEscape(forId)}`);
        if (target && visible(target)) return target;
      }
      const box = el.parentElement;
      const input = box?.querySelector("input,textarea");
      if (input && visible(input)) return input;
    }
    return null;
  }

  function findButton(text) {
    const root = activeDialog();
    return [...root.querySelectorAll(
      'button,[role="button"],input[type="button"],input[type="submit"],a'
    )].filter(visible).find(el => {
      const label = el.value || el.getAttribute("aria-label") || el.textContent;
      return normText(label) === normText(text);
    }) || null;
  }

  function findNameLookupButton() {
    const root = activeDialog();
    const nameInput = resolveCore("nameInput");
    if (!nameInput) return null;

    const nr = nameInput.getBoundingClientRect();
    const buttons = [...root.querySelectorAll(
      'button,[role="button"],input[type="button"],input[type="submit"],a,.cl-button'
    )].filter(el => {
      if (!visible(el) || el === nameInput) return false;
      const label = normText(el.value || el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent);
      // 이름 옆 돋보기는 보통 글자가 없거나 검색/찾기/선택 계열 아이콘이다.
      // 화면의 일반 확인·조회·저장 버튼은 후보에서 제외한다.
      if (["확인","조회","저장"].includes(label)) return false;
      return true;
    });

    const scored = buttons.map(btn => {
      const r = btn.getBoundingClientRect();
      const dx = (r.left + r.width / 2) - (nr.right + 12);
      const dy = (r.top + r.height / 2) - (nr.top + nr.height / 2);
      const distance = Math.hypot(dx, dy);
      const label = normText(btn.value || btn.getAttribute("aria-label") || btn.getAttribute("title") || btn.textContent);
      const hasSearchHint = /(검색|찾기|돋보기|선택|직원|성명)/.test(label);
      const hasIcon = Boolean(btn.querySelector?.('.cl-icon,img,svg,[class*="search"],[class*="find"]'));
      const rightSide = r.left >= nr.left + nr.width * 0.6;
      const sameLine = Math.abs((r.top + r.height / 2) - (nr.top + nr.height / 2)) <= Math.max(28, nr.height * 1.5);
      const compact = r.width <= 70 && r.height <= 55;
      let score = distance;
      if (hasSearchHint) score -= 180;
      if (hasIcon) score -= 100;
      if (rightSide) score -= 50;
      if (sameLine) score -= 70;
      if (compact) score -= 30;
      return {btn, score, distance, sameLine};
    }).filter(x => x.sameLine && x.distance <= 260)
      .sort((a,b) => a.score - b.score);

    return scored[0]?.btn || null;
  }

  function resolveCore(key) {
    const manual = findManual(key);
    if (manual && visible(manual)) return manual;
    if (key === "nameInput") return findLabeledInput("성명");
    if (key === "lookupButton") return findNameLookupButton();
    if (key === "confirmButton") return findButton("확인");
    if (key === "queryButton") return findButton("조회");
    if (key === "copyPreviousButton") return findButton("보수자료복사") || findButton("전월자료 복사");
    if (key === "saveButton") return findButton("저장");
    return null;
  }

  function updateCoreStates() {
    const pairs = [
      ["nameInput","nameState"],["lookupButton","confirmState"],["queryButton","queryState"],["copyPreviousButton","copyPreviousState"],["saveButton","saveState"]
    ];
    for (const [key,id] of pairs) {
      const ok = Boolean(resolveCore(key));
      $(id).textContent = ok ? "확인" : "미확인";
      $(id).className = ok ? "ok" : "bad";
    }
    updateButtons();
  }

  async function setValue(el, value) {
    if (!el) throw new Error("입력 대상이 없습니다.");
    el.scrollIntoView?.({block:"center"});
    el.focus?.();
    const setter = (() => {
      let p = Object.getPrototypeOf(el);
      while (p) {
        const d = Object.getOwnPropertyDescriptor(p, "value");
        if (d?.set) return d.set;
        p = Object.getPrototypeOf(p);
      }
      return null;
    })();
    if (setter) Reflect.apply(setter, el, [String(value ?? "")]);
    else el.value = String(value ?? "");
    for (const type of ["input","change","blur"]) {
      el.dispatchEvent(new Event(type,{bubbles:true}));
    }
    await delay(200);
  }

  async function clickElement(el) {
    if (!el) throw new Error("클릭 대상이 없습니다.");
    el.scrollIntoView?.({block:"center"});
    el.click();
    await delay(350);
  }

  // ---------------- XLSX minimal reader ----------------
  function u16(d,o){return d[o]|(d[o+1]<<8)}
  function u32(d,o){return (d[o]|(d[o+1]<<8)|(d[o+2]<<16)|(d[o+3]<<24))>>>0}

  async function inflateRaw(bytes) {
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzip(arrayBuffer) {
    const d = new Uint8Array(arrayBuffer);
    let eocd = -1;
    for (let i=d.length-22;i>=Math.max(0,d.length-65557);i--) {
      if (u32(d,i)===0x06054b50){eocd=i;break}
    }
    if (eocd<0) throw new Error("XLSX ZIP 구조를 찾지 못했습니다.");
    const count=u16(d,eocd+10), cdOffset=u32(d,eocd+16);
    let p=cdOffset;
    const out={};
    for(let i=0;i<count;i++){
      if(u32(d,p)!==0x02014b50) throw new Error("XLSX 중앙 디렉터리가 손상되었습니다.");
      const method=u16(d,p+10), compSize=u32(d,p+20), nameLen=u16(d,p+28);
      const extraLen=u16(d,p+30), commentLen=u16(d,p+32), localOffset=u32(d,p+42);
      const name=new TextDecoder().decode(d.slice(p+46,p+46+nameLen));
      const lp=localOffset;
      const localNameLen=u16(d,lp+26), localExtraLen=u16(d,lp+28);
      const start=lp+30+localNameLen+localExtraLen;
      const comp=d.slice(start,start+compSize);
      let bytes;
      if(method===0) bytes=comp;
      else if(method===8) bytes=await inflateRaw(comp);
      else throw new Error(`지원하지 않는 XLSX 압축 방식: ${method}`);
      out[name]=bytes;
      p += 46+nameLen+extraLen+commentLen;
    }
    return out;
  }

  function xmlText(bytes) {
    return new TextDecoder("utf-8").decode(bytes);
  }

  function parseXml(bytes) {
    return new DOMParser().parseFromString(xmlText(bytes),"application/xml");
  }

  function colIndex(ref) {
    const letters=(ref.match(/[A-Z]+/)||["A"])[0];
    let n=0;
    for(const c of letters)n=n*26+c.charCodeAt(0)-64;
    return n-1;
  }

  function sheetRows(doc, shared) {
    const rows=[];
    for(const row of doc.querySelectorAll("sheetData row")){
      const arr=[];
      for(const c of row.querySelectorAll("c")){
        const idx=colIndex(c.getAttribute("r")||"A1");
        const type=c.getAttribute("t");
        let value="";
        if(type==="inlineStr") value=c.querySelector("is t")?.textContent||"";
        else {
          const raw=c.querySelector("v")?.textContent??"";
          if(type==="s") value=shared[Number(raw)]??"";
          else if(type==="b") value=raw==="1";
          else value=raw===""?"":Number.isNaN(Number(raw))?raw:Number(raw);
        }
        arr[idx]=value;
      }
      rows.push(arr);
    }
    return rows;
  }

  async function readWorkbook(file) {
    const zip=await unzip(await file.arrayBuffer());
    const wbXml=parseXml(zip["xl/workbook.xml"]);
    const relXml=parseXml(zip["xl/_rels/workbook.xml.rels"]);
    const rels={};
    for(const r of relXml.querySelectorAll("Relationship")){
      rels[r.getAttribute("Id")]=r.getAttribute("Target");
    }
    let shared=[];
    if(zip["xl/sharedStrings.xml"]){
      const ss=parseXml(zip["xl/sharedStrings.xml"]);
      shared=[...ss.querySelectorAll("si")].map(si =>
        [...si.querySelectorAll("t")].map(t=>t.textContent).join("")
      );
    }
    const result={};
    for(const s of wbXml.querySelectorAll("sheets sheet")){
      const name=s.getAttribute("name");
      const rid=s.getAttribute("r:id");
      let target=rels[rid];
      if(!target) continue;
      target=target.replace(/^\/?/,"");
      if(!target.startsWith("xl/")) target="xl/"+target.replace(/^\.\//,"");
      const bytes=zip[target];
      if(bytes) result[name]=sheetRows(parseXml(bytes),shared);
    }
    return result;
  }

  function rowsToObjects(rows) {
    if(!rows?.length) return [];
    const headers=rows[0].map(v=>String(v??"").trim());
    return rows.slice(1).filter(r=>r.some(v=>String(v??"").trim()!=="")).map(r=>{
      const o={};
      headers.forEach((h,i)=>{if(h)o[h]=r[i]??""});
      return o;
    });
  }

  function validateWorkbook(book) {
    const rows=rowsToObjects(book["급여입력"]);
    if(!rows.length) throw new Error("급여입력 시트에 자료가 없습니다.");

    // item_code는 기록·진단용이며, 실제 화면 탐색은 CPR 콤보박스의 표시명(value)을 사용한다.
    // rowName의 | 구분값은 명시적으로 허용한 별칭이며 부분일치는 사용하지 않는다.
    const definitions=[
      {column:"기본급(확인용)",code:"AAD00",name:"기본급",kind:"수당",rowName:"기본급"},
      {column:"시간외수당",code:"DAA01",name:"시간외수당",kind:"수당",rowName:"시간외수당"},
      {column:"정액급식비",code:"FAA00",name:"정액급식비",kind:"수당",rowName:"정액급식비",optional:true},
      {column:"식대",code:"CY179",name:"식대",kind:"수당",rowName:"식대|식대(비과세)"},
      {column:"직무·직책수당",code:"POSITION_PAY",name:"직무·직책수당",kind:"수당",rowName:"직책수당|직무수당|직무·직책수당"},
      {column:"근로소득세",code:"D0X",name:"근로소득세",kind:"공제",rowName:"소득세|근로소득세"},
      {column:"지방소득세",code:"D1X",name:"지방소득세",kind:"공제",rowName:"지방소득세"},
      {column:"건강보험료",code:"H0X",name:"건강보험료",kind:"공제",rowName:"건강보험료"},
      {column:"장기요양보험료",code:"H0Y",name:"장기요양보험료",kind:"공제",rowName:"장기요양보험료"},
      {column:"국민연금",code:"Y01",name:"국민연금",kind:"공제",rowName:"국민연금"},
      {column:"고용보험료",code:"X01",name:"고용보험료",kind:"공제",rowName:"고용보험료"},
      {column:"구내식당 식비",code:"Z03",name:"구내식당 식비",kind:"공제",rowName:"회담식대|구내식당 식비"},
      {column:"학자금상환",code:"Q0X",name:"학자금상환",kind:"공제",rowName:"학자금상환",optional:true}
    ];

    const employees=[];
    const items=[];
    const seen=new Set();

    rows.forEach((row,index)=>{
      const name=String(row["성명"]??"").trim();
      const payMonth=String(row["보수월"]??"").trim();
      if(!name && !payMonth) return;
      if(!name) throw new Error(`급여입력 ${index+5}행: 성명이 비어 있습니다.`);
      if(!payMonth) throw new Error(`급여입력 ${index+5}행: 보수월이 비어 있습니다.`);
      if(!/^\d{4}-\d{2}$/.test(payMonth)){
        throw new Error(`급여입력 ${index+5}행: 보수월은 YYYY-MM 형식이어야 합니다.`);
      }

      const employeeKey=`E${String(index+1).padStart(3,"0")}`;
      const duplicateKey=`${name}|${payMonth}`;
      if(seen.has(duplicateKey)){
        throw new Error(`동일한 성명·보수월이 중복되었습니다: ${name} / ${payMonth}`);
      }
      seen.add(duplicateKey);

      employees.push({
        employee_key:employeeKey,
        "성명":name,
        "보수월":payMonth,
        "소속":row["소속"]??"",
        "직종":row["직종"]??"",
        "비고":row["비고"]??""
      });

      definitions.forEach(def=>{
        if(def.optional && !Object.prototype.hasOwnProperty.call(row,def.column)) return;
        const raw=row[def.column];
        const blank=String(raw??"").trim()==="";
        const mode=blank ? "KEEP" : "SET";

        if(!blank && (!Number.isFinite(Number(raw)) || Number(raw)<0)){
          throw new Error(`${name} · ${def.column}: 0 이상의 숫자를 입력하십시오.`);
        }

        items.push({
          employee_key:employeeKey,
          item_code:def.code,
          "항목명":def.name,
          "예정금액":blank ? "" : Number(raw),
          "처리방식":mode,
          "사이트구분":def.kind,
          "사이트행명":def.rowName,
          "비고":""
        });
      });
    });

    if(!employees.length) throw new Error("급여입력 시트에 대상자가 없습니다.");
    return {employees,items};
  }

  function currentEmployee() {
    return state.employees[state.index] || null;
  }

  function employeeItems() {
    const e=currentEmployee();
    if(!e) return [];
    return state.items.filter(x=>String(x.employee_key)===String(e.employee_key));
  }

  function itemKey(it){
    const e=currentEmployee();
    return `${e?.employee_key||""}|${it.item_code}|${it["항목명"]}`;
  }

  async function copyText(value){
    const text=String(value ?? "");
    try{
      await navigator.clipboard.writeText(text);
    }catch{
      const ta=document.createElement("textarea");
      ta.value=text;ta.style.position="fixed";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();
    }
  }

  function renderEmployeeValues(){
    const e=currentEmployee();
    if(!e){
      $("personBox").innerHTML='<div class="person-name">전체 완료</div>';
      $("itemList").innerHTML="";
      return;
    }
    $("personBox").innerHTML=`<div class="person-name">${e["성명"]}</div>
      <div class="person-meta">${e["보수월"]} · ${e["소속"]||""} · ${e["직종"]||""}</div>`;
    const list=$("itemList");
    list.innerHTML="";
    let lastKind="";
    for(const it of employeeItems()){
      const kind=String(it["사이트구분"]||"");
      if(kind!==lastKind){
        const title=document.createElement("div");
        title.className="item-group";title.textContent=kind||"급여항목";
        list.appendChild(title);lastKind=kind;
      }
      const mode=String(it["처리방식"]||"");
      const isKeep=mode==="KEEP";
      const amount=isKeep?null:Number(it["예정금액"]);
      const key=itemKey(it);
      const row=document.createElement("div");
      row.className=`pay-item${isKeep?" keep":""}${state.copied.has(key)?" copied":""}`;
      const name=document.createElement("div");name.className="pay-name";name.textContent=it["항목명"];
      const money=document.createElement("div");money.className="pay-amount";
      money.textContent=isKeep?"전월값 유지":formatMoney(amount);
      const btn=document.createElement("button");
      btn.textContent=state.copied.has(key)?"복사됨":"복사";
      btn.disabled=isKeep||!Number.isFinite(amount);
      btn.addEventListener("click",async()=>{
        await copyText(amount);
        state.copied.add(key);
        log(`${e["성명"]} · ${it["항목명"]}: ${formatMoney(amount)} 복사`,'good');
        renderEmployeeValues();
      });
      row.append(name,money,btn);list.appendChild(row);
    }
  }

  function updateProgress() {
    const e=currentEmployee();
    $("progress").textContent=e
      ? `${state.index+1}/${state.employees.length} · ${e["성명"]} · ${state.phase==="phase1"?"조회 전":"조회 완료"}`
      : (state.employees.length?"전체 완료":"XLSX를 불러오십시오.");
  }

  function updateButtons() {
    const loaded=Boolean(currentEmployee());
    const core1=Boolean(resolveCore("nameInput")&&resolveCore("lookupButton")&&resolveCore("queryButton"));
    $("phase1").disabled=state.running||!loaded||state.phase!=="phase1"||!core1;
    $("copyPrevious").disabled=state.running||!loaded||state.phase!=="ready"||!resolveCore("copyPreviousButton");
    $("save").disabled=state.running||!loaded||state.phase!=="ready"||!resolveCore("saveButton");
    $("back").disabled=state.running||state.index<=0;
    updateProgress();
  }

  async function phase1() {
    const e=currentEmployee();
    state.running=true;updateButtons();
    try{
      log(`${e["성명"]}: Phase 1 시작`);
      await setValue(resolveCore("nameInput"),e["성명"]);
      await clickElement(resolveCore("lookupButton"));
      await delay(500);
      const confirm=resolveCore("confirmButton");
      if(confirm){await clickElement(confirm);await delay(500)}
      else log(`${e["성명"]}: 확인 버튼을 찾지 못했습니다. 이미 선택된 경우 계속 진행합니다.`,'warn');
      await clickElement(resolveCore("queryButton"));
      await delay(700);
      state.phase="ready";
      log(`${e["성명"]}: 조회 완료. 보수자료복사 후 항목별 금액을 붙여넣으십시오.`,'good');
    }catch(err){log(err.message,'error');alert(err.message)}
    finally{state.running=false;renderEmployeeValues();updateButtons()}
  }

  async function clickPreviousData(){
    state.running=true;updateButtons();
    try{
      await clickElement(resolveCore("copyPreviousButton"));
      log(`${currentEmployee()["성명"]}: 보수자료복사 버튼 클릭`,'good');
    }catch(err){log(err.message,'error');alert(err.message)}
    finally{state.running=false;updateButtons()}
  }

  async function saveCurrent() {
    const button=resolveCore("saveButton");
    if(!button) throw new Error("저장 버튼을 찾지 못했습니다.");
    const e=currentEmployee();
    await clickElement(button);
    log(`${e["성명"]}: 저장 버튼 클릭. 사이트 성공 메시지를 직접 확인하십시오.`,'warn');
    state.index++;
    state.phase=state.index<state.employees.length?"phase1":"complete";
    renderEmployeeValues();updateButtons();
  }

  function goBack(){
    if(state.index<=0)return;
    state.index--;
    state.phase="phase1";
    renderEmployeeValues();updateButtons();
    log(`${currentEmployee()["성명"]}: 이전 대상자로 이동`,'warn');
  }

  $("file").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      $("fileMeta").textContent="XLSX 분석 중...";
      const book=await readWorkbook(file);
      const parsed=validateWorkbook(book);
      state.workbook=book;state.employees=parsed.employees;state.items=parsed.items;
      state.index=0;state.phase="phase1";state.copied.clear();
      $("fileMeta").textContent=`${file.name} · 대상자 ${state.employees.length}명 · 항목 ${state.items.length}건`;
      log(`XLSX 불러오기 완료: ${file.name}`,'good');
      renderEmployeeValues();updateCoreStates();
    }catch(err){
      $("fileMeta").textContent="불러오기 실패";
      log(err.message,'error');alert(err.message);
    }
  });

  shadow.querySelectorAll("[data-map]").forEach(btn=>btn.addEventListener("click",()=>{
    state.mappingKey=btn.dataset.map;
    $("mapGuide").textContent=`${btn.previousElementSibling.previousElementSibling.textContent}: 실제 요소를 직접 클릭하십시오.`;
    $("mapGuide").classList.remove("hidden");
  }));

  document.addEventListener("click",event=>{
    if(!state.mappingKey||host.contains(event.target))return;
    event.preventDefault();event.stopPropagation();
    const key=state.mappingKey;
    let el=event.target;
    if(key==="nameInput")el=el.closest("input,textarea");
    else el=el.closest('button,[role="button"],input[type="button"],input[type="submit"],a,.cl-button');
    if(!el){log("맵핑 가능한 실제 요소를 클릭하십시오.",'warn');return}
    state.manualMap[key]=makeSelector(el);
    state.mappingKey=null;
    $("mapGuide").classList.add("hidden");
    log(`${key} 수동 맵핑 완료`,'good');
    updateCoreStates();
  },true);

  $("phase1").addEventListener("click",phase1);
  $("copyPrevious").addEventListener("click",clickPreviousData);
  $("save").addEventListener("click",async()=>{
    state.running=true;updateButtons();
    try{await saveCurrent()}catch(err){log(err.message,'error');alert(err.message)}
    finally{state.running=false;updateButtons()}
  });
  $("back").addEventListener("click",goBack);
  $("size").addEventListener("change",event=>{
    const sizes={
      small:{width:"420px",height:"520px",items:"210px"},
      medium:{width:"530px",height:"680px",items:"320px"},
      large:{width:"700px",height:"calc(100vh - 36px)",items:"480px"}
    };
    const selected=sizes[event.target.value]||sizes.medium;
    host.style.width=selected.width;
    host.style.height=selected.height;
    $("itemList").style.maxHeight=selected.items;
    log(`창 크기 변경: ${event.target.options[event.target.selectedIndex].text}`);
  });
  $("close").addEventListener("click",()=>host.style.display="none");

  renderEmployeeValues();
  updateCoreStates();
  setInterval(updateCoreStates,2000);
  log("Semi-RPA v6.2 준비 완료 — 화면값 비교 없이 XLSX 예정금액 복붙 방식");
})();
