(()=>{
  'use strict';
  const TILE=256,MIN_ZOOM=5,MAX_ZOOM=17;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const pointsFor=direction=>(direction.shape?.length?direction.shape:direction.stops?.map(stop=>[stop.lat,stop.lng]))||[];
  const project=(point,zoom)=>{const size=TILE*2**zoom,lat=clamp(Number(point[0]),-85.0511,85.0511),lng=Number(point[1]),sin=Math.sin(lat*Math.PI/180);return {x:(lng+180)/360*size,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*size}};
  const fit=(points,width,height)=>{for(let zoom=MAX_ZOOM;zoom>MIN_ZOOM;zoom--){const pixels=points.map(point=>project(point,zoom)),xs=pixels.map(point=>point.x),ys=pixels.map(point=>point.y);if(Math.max(...xs)-Math.min(...xs)<=width-54&&Math.max(...ys)-Math.min(...ys)<=height-54)return zoom}return MIN_ZOOM};
  const centerAt=(points,zoom)=>{const pixels=points.map(point=>project(point,zoom)),xs=pixels.map(point=>point.x),ys=pixels.map(point=>point.y);return {x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2}};
  const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node};
  function mount(container,direction,{routeLabel=''}={}){
    const points=pointsFor(direction),stops=direction.stops||[];
    container.replaceChildren();
    if(!points.length){container.append(element('p','route-map-empty','Карта этого маршрута пока недоступна.'));return}
    const shell=element('section','live-route-map'),stage=element('div','live-route-stage'),tiles=element('div','live-route-tiles'),overlay=document.createElementNS('http://www.w3.org/2000/svg','svg'),controls=element('div','live-route-controls'),zoomIn=element('button','live-route-zoom','+'),zoomOut=element('button','live-route-zoom','−'),credit=element('span','live-route-credit','© OpenStreetMap · CARTO'),legend=element('div','map-legend');
    overlay.classList.add('live-route-overlay');overlay.setAttribute('aria-label','Карта маршрута '+routeLabel);overlay.setAttribute('role','img');
    zoomIn.type=zoomOut.type='button';zoomIn.setAttribute('aria-label','Приблизить карту');zoomOut.setAttribute('aria-label','Отдалить карту');
    controls.append(zoomIn,zoomOut);stage.append(tiles,overlay,controls,credit);shell.append(stage);
    const start=stops[0],end=stops.at(-1);legend.append(element('div','',`Начало: ${start?.name||'—'}`),element('div','',`Конечная: ${end?.name||'—'}`));shell.append(legend);container.append(shell);
    let zoom,center,drag=null;
    function dimensions(){return {width:Math.max(260,stage.clientWidth||320),height:Math.max(220,stage.clientHeight||280)}}
    function draw(){
      const {width,height}=dimensions(),world=TILE*2**zoom,left=center.x-width/2,top=center.y-height/2,tileMinX=Math.floor(left/TILE),tileMaxX=Math.floor((left+width)/TILE),tileMinY=Math.max(0,Math.floor(top/TILE)),tileMaxY=Math.min(2**zoom-1,Math.floor((top+height)/TILE));
      tiles.replaceChildren();
      for(let y=tileMinY;y<=tileMaxY;y++)for(let x=tileMinX;x<=tileMaxX;x++){const image=new Image;image.alt='';image.draggable=false;image.loading='eager';image.referrerPolicy='origin';image.src=`https://a.basemaps.cartocdn.com/light_all/${zoom}/${((x%2**zoom)+2**zoom)%2**zoom}/${y}.png`;image.style.left=`${x*TILE-left}px`;image.style.top=`${y*TILE-top}px`;tiles.append(image)}
      overlay.setAttribute('viewBox',`0 0 ${width} ${height}`);overlay.replaceChildren();
      const defs=document.createElementNS(overlay.namespaceURI,'defs'),marker=document.createElementNS(overlay.namespaceURI,'marker'),arrow=document.createElementNS(overlay.namespaceURI,'path');marker.id='route-arrow';marker.setAttribute('viewBox','0 0 10 10');marker.setAttribute('refX','8');marker.setAttribute('refY','5');marker.setAttribute('markerWidth','7');marker.setAttribute('markerHeight','7');marker.setAttribute('orient','auto-start-reverse');arrow.setAttribute('d','M 0 0 L 10 5 L 0 10 z');arrow.setAttribute('fill','#0677ff');marker.append(arrow);defs.append(marker);overlay.append(defs);
      const screen=point=>{const pixel=project(point,zoom);return [pixel.x-left,pixel.y-top]},pathData=points.map((point,index)=>{const [x,y]=screen(point);return `${index?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`}).join(' ');
      for(const [className,widthValue] of [['live-route-halo','8'],['live-route-line','4']]){const path=document.createElementNS(overlay.namespaceURI,'path');path.setAttribute('class',className);path.setAttribute('d',pathData);path.setAttribute('stroke-width',widthValue);if(className==='live-route-line')path.setAttribute('marker-end','url(#route-arrow)');overlay.append(path)}
      stops.forEach((stop,index)=>{const [x,y]=screen([stop.lat,stop.lng]),circle=document.createElementNS(overlay.namespaceURI,'circle');circle.setAttribute('cx',x.toFixed(1));circle.setAttribute('cy',y.toFixed(1));circle.setAttribute('r',index===0||index===stops.length-1?'6':'2.5');circle.setAttribute('class',index===0?'live-route-start':index===stops.length-1?'live-route-end':'live-route-stop');overlay.append(circle)});
    }
    function reset(){const {width,height}=dimensions();zoom=fit(points,width,height);center=centerAt(points,zoom);draw()}
    function changeZoom(step){const next=clamp(zoom+step,MIN_ZOOM,MAX_ZOOM);if(next===zoom)return;const factor=2**(next-zoom);center={x:center.x*factor,y:center.y*factor};zoom=next;draw()}
    zoomIn.addEventListener('click',()=>changeZoom(1));zoomOut.addEventListener('click',()=>changeZoom(-1));
    stage.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;drag={x:event.clientX,y:event.clientY,center:{...center}};stage.setPointerCapture(event.pointerId)});
    stage.addEventListener('pointermove',event=>{if(!drag)return;center={x:drag.center.x-(event.clientX-drag.x),y:drag.center.y-(event.clientY-drag.y)};draw()});
    stage.addEventListener('pointerup',()=>{drag=null});stage.addEventListener('pointercancel',()=>{drag=null});
    reset();
  }
  const style=document.createElement('style');style.textContent='.live-route-map{display:grid;gap:9px}.live-route-stage{position:relative;overflow:hidden;height:300px;border:1px solid #3478a8;border-radius:15px;background:#dce8ed;touch-action:none;cursor:grab}.live-route-stage:active{cursor:grabbing}.live-route-tiles,.live-route-overlay{position:absolute;inset:0;width:100%;height:100%}.live-route-tiles img{position:absolute;width:256px;height:256px;user-select:none}.live-route-overlay{pointer-events:none}.live-route-halo,.live-route-line{fill:none;stroke-linecap:round;stroke-linejoin:round}.live-route-halo{stroke:#fff;opacity:.92}.live-route-line{stroke:#0677ff;filter:drop-shadow(0 0 3px #fff)}.live-route-stop{fill:#fff;stroke:#075da7;stroke-width:1.4}.live-route-start{fill:#19a660;stroke:#fff;stroke-width:2}.live-route-end{fill:#e74343;stroke:#fff;stroke-width:2}.live-route-controls{position:absolute;top:9px;right:9px;display:grid;overflow:hidden;border:1px solid #8aa2ae;border-radius:8px;background:#fff;box-shadow:0 2px 7px #0004}.live-route-zoom{display:grid;width:37px;height:37px;place-items:center;border:0;border-bottom:1px solid #cbd5da;background:#fff;color:#173443;font-size:25px;font-weight:900;cursor:pointer}.live-route-zoom:last-child{border-bottom:0}.live-route-credit{position:absolute;right:5px;bottom:4px;padding:2px 4px;border-radius:4px;background:#ffffffe6;color:#344b56;font-size:9px}.route-map-empty{margin:0;padding:18px;color:#b8d0df;text-align:center}@media(min-width:580px){.live-route-stage{height:380px}}';document.head.append(style);
  window.IzmailRouteMap={mount};
})();
