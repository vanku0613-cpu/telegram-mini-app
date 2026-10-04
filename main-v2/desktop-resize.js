(function(){
  'use strict';
  var app=document.getElementById('app');
  var handle=document.getElementById('desktopResizeHandle');
  var desktop=window.matchMedia('(min-width:700px) and (hover:hover) and (pointer:fine)');
  if(!app||!handle||!desktop.matches)return;

  var drag=null;
  function viewportHeight(){
    var value=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stable-viewport-height'));
    return Number.isFinite(value)&&value>0?value:window.innerHeight;
  }
  function onMove(event){
    if(!drag||event.pointerId!==drag.pointerId)return;
    var maxWidth=Math.max(0,window.innerWidth-12);
    var maxHeight=Math.max(0,viewportHeight()-8);
    var minWidth=Math.min(340,maxWidth);
    var minHeight=Math.min(520,maxHeight);
    app.style.width=Math.min(maxWidth,Math.max(minWidth,drag.width+event.clientX-drag.x))+'px';
    app.style.height=Math.min(maxHeight,Math.max(minHeight,drag.height+event.clientY-drag.y))+'px';
  }
  function onEnd(event){
    if(!drag||event.pointerId!==drag.pointerId)return;
    drag=null;
    handle.removeEventListener('pointermove',onMove);
    handle.removeEventListener('pointerup',onEnd);
    handle.removeEventListener('pointercancel',onEnd);
  }
  handle.addEventListener('pointerdown',function(event){
    if(event.button!==0)return;
    var bounds=app.getBoundingClientRect();
    drag={pointerId:event.pointerId,x:event.clientX,y:event.clientY,width:bounds.width,height:bounds.height};
    handle.setPointerCapture(event.pointerId);
    handle.addEventListener('pointermove',onMove);
    handle.addEventListener('pointerup',onEnd);
    handle.addEventListener('pointercancel',onEnd);
    event.preventDefault();
  });
})();
