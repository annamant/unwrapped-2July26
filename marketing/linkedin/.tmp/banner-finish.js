(async()=>{
  if(!window.__BANNER_PARTS||window.__BANNER_PARTS.length<6) return {ok:false, n:(window.__BANNER_PARTS||[]).length};
  const b64=window.__BANNER_PARTS.join("");
  const bin=atob(b64); const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  const file=new File([bytes],"Unwrapped-LinkedIn-Banner-1584x396.png",{type:"image/png"});
  const inputs=[...document.querySelectorAll("input[type=file]")];
  const input=inputs.find(i=>((i.getAttribute("aria-label")||"")+(i.name||"")).toLowerCase().includes("upload")||(i.accept||"").includes("image"))||inputs[inputs.length-1];
  if(!input) return {ok:false,count:inputs.length};
  const dt=new DataTransfer(); dt.items.add(file); input.files=dt.files;
  input.dispatchEvent(new Event("input",{bubbles:true}));
  input.dispatchEvent(new Event("change",{bubbles:true}));
  return {ok:true,size:file.size,files:input.files.length};
})()