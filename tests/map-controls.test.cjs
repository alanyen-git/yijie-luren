const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","game","src","map-controls.js"),"utf8");
const events={},MAPS=".xu-board,.xu-town-board,.town-map-canvas",mapTarget={style:{}},homeTarget={style:{}};
function makeStage(width,height,selector,target){
 const stage={clientWidth:width,clientHeight:height,children:[],captured:[],style:{vars:{},setProperty(k,v){this.vars[k]=v}},classList:{add(){},remove(){}},querySelector(sel){if(sel===":scope > .map-zoom-controls")return this.children.find(x=>x.className==="map-zoom-controls")||null;if(sel===selector)return target;return null},appendChild(el){this.children.push(el);el.parent=this},setPointerCapture(id){this.captured.push(id)},closest(sel){return sel===MAPS?this:null}};
 return stage
}
const stage=makeStage(800,500,".xu-map-pan-surface",mapTarget),homeStage=makeStage(360,300,".town-map-transform",homeTarget);
class Element{
 constructor(stage,isButton=false){this.children=[];this.dataset={};this.style={};this.classList={add(){},remove(){}};this.stage=stage;this.isButton=isButton}
 setAttribute(){}
 appendChild(child){this.children.push(child);child.parent=this}
 closest(sel){if(sel==="[data-map-zoom]")return this.dataset.mapZoom?this:null;if(sel==="button")return this.isButton?this:null;if(sel===MAPS){for(let p=this;p;p=p.parent)if(p===stage||p===homeStage)return p;return null}if(sel===".map-zoom-controls,[data-map-no-drag],a,input,summary"){for(let p=this;p;p=p.parent){if(p.className==="map-zoom-controls"||p.noDrag)return p}return null}return null}
}
const document={documentElement:{},querySelectorAll(sel){return sel===MAPS?[stage,homeStage]:[]},createElement(){return new Element(null)},addEventListener(name,fn){events[name]=fn}};
class MutationObserver{constructor(fn){this.fn=fn}observe(){}}
vm.runInNewContext(source,{document,MutationObserver,setTimeout,WeakMap,Math});
const box=stage.children.find(x=>x.className==="map-zoom-controls");assert.ok(box,"map controls install");
assert.equal(mapTarget.style.transform,"translate(0px,0px) scale(3)","layered map starts at 3x");
assert.equal(homeTarget.style.transform,"translate(0px,0px) scale(3)","town home starts at 3x");assert.equal(stage.style.vars["--map-marker-scale"],String(1/3),"pin labels stay readable at 3x");
const zoomIn=box.children.find(x=>x.dataset.mapZoom==="in");events.click({target:zoomIn,preventDefault(){},stopPropagation(){}});
assert.match(mapTarget.style.transform,/scale\(3\.25\)/,"zoom in works from 3x");
events.pointerdown({target:stage,pointerId:7,clientX:10,clientY:20});let prevented=false;
events.pointermove({target:stage,pointerId:7,clientX:35,clientY:35,preventDefault(){prevented=true}});
assert.ok(prevented,"dragging prevents page scroll");assert.match(mapTarget.style.transform,/translate\(25px,15px\)/,"background drag moves the full map");
events.pointerup({target:stage,pointerId:7});let suppressed=false;events.click({target:stage,preventDefault(){suppressed=true},stopImmediatePropagation(){}});
assert.ok(suppressed,"drag release does not activate a map node");
const reset=box.children.find(x=>x.dataset.mapZoom==="reset");events.click({target:reset,preventDefault(){},stopPropagation(){}});
assert.equal(mapTarget.style.transform,"translate(0px,0px) scale(3)","reset restores initial 3x view");
const marker=new Element(stage,true);marker.parent=stage;const capturesBefore=stage.captured.length;
events.pointerdown({target:marker,pointerId:8,clientX:40,clientY:50});
assert.equal(stage.captured.length,capturesBefore,"button tap keeps its original click target");
events.pointermove({target:marker,pointerId:8,clientX:60,clientY:65,preventDefault(){}});
assert.equal(stage.captured.at(-1),8,"drag beginning on a map marker captures the pointer after movement");
assert.match(mapTarget.style.transform,/translate\(20px,15px\)/,"marker drag moves the map");
events.pointerup({target:stage,pointerId:8});let markerClickSuppressed=false;
events.click({target:stage,preventDefault(){markerClickSuppressed=true},stopImmediatePropagation(){}});
assert.ok(markerClickSuppressed,"marker drag cannot accidentally activate travel");
events.pointerdown({target:homeStage,pointerId:9,clientX:1,clientY:3});
events.pointermove({target:homeStage,pointerId:9,clientX:18,clientY:20,preventDefault(){}});
assert.match(homeTarget.style.transform,/translate\(17px,17px\) scale\(3\)/,"town background, buildings and routes share one drag surface");
events.pointerup({target:homeStage,pointerId:9});
console.log("PASS 3x initial zoom, map drag including markers and town pins, click suppression, and reset controls");