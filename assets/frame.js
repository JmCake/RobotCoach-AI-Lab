// Only same-origin parent messages are accepted. Height follows content, not viewport.
const height=()=>parent.postMessage({type:'robotcoach:height',height:Math.ceil(document.body.getBoundingClientRect().height)},location.origin);
new ResizeObserver(height).observe(document.body);
window.addEventListener('load',height);
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='robotcoach:visibility'&&typeof e.data.hidden==='boolean')document.dispatchEvent(new CustomEvent('coursevisibility',{detail:e.data.hidden}));});
