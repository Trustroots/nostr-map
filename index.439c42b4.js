var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},t={},a={},l=e.parcelRequire31ee;null==l&&((l=function(e){if(e in t)return t[e].exports;if(e in a){var l=a[e];delete a[e];var o={id:e,exports:{}};return t[e]=o,l.call(o.exports,o,o.exports),o.exports}var i=new Error("Cannot find module '"+e+"'");throw i.code="MODULE_NOT_FOUND",i}).register=function(e,t){a[e]=t},e.parcelRequire31ee=l);var o=l("8JYDX"),i=l("F1Hgz"),n=l("lsWS8"),s=l("8JDfT");const r=({location:e=globalThis.document.location}={})=>{const{hash:t}=e,a=t.split("=");if("string"==typeof a[1]){const e=a[1];return encodeURIComponent(e)}return""};(async()=>{const e=await(0,n.hasPrivateKey)(),t=o.DomUtil.get("loggedIn"),a=o.DomUtil.get("loggedOut");if(e){o.DomUtil.addClass(t,"show"),o.DomUtil.addClass(a,"hide");const e=await(0,n.getPublicKey)(),l=await(0,n.getNpubPublicKey)(),i=await(0,n.getNsecPrivateKey)();globalThis.document.getElementById("npubPublicKey").innerText=l;globalThis.document.getElementById("nsecPrivateKey").innerText=i;const d=document.getElementById("profile_name"),u=document.getElementById("profile_about"),c=await(0,s.subscribeAndGetProfile)({publicKey:e});d.value=c.name,u.value=c.about;const b=document.getElementById("profile_submit");b.onclick=async e=>{e.preventDefault(),b.setAttribute("disabled","disabled");const t=d.value,a=u.value,l=r();try{await(0,s.setProfile)({name:t,about:a,trustrootsUsername:l}),globalThis.alert("Your profile was updated."),globalThis.document.location.reload()}catch{globalThis.alert("There was an error. Please try again."),b.removeAttribute("disabled")}}}else{o.DomUtil.addClass(t,"hide"),o.DomUtil.addClass(a,"show");const e=document.getElementById("signup_submit");e.onclick=async t=>{t.preventDefault(),e.setAttribute("disabled","disabled");const a=document.getElementById("signup_name").value,o=document.getElementById("signup_about").value;try{await(0,n.createPrivateKey)();const e=r();(0,s.setProfile)({name:a,about:o,trustrootsUsername:e}).then((()=>{globalThis.alert("Your account was created."),globalThis.document.location.reload()}))}catch{l.removeAttribute("disabled")}};const l=document.getElementById("signin_submit");l.onclick=async t=>{t.preventDefault(),e.setAttribute("disabled","disabled");const a=document.getElementById("signin_privateKey").value;try{(0,n.setPrivateKey)({privateKey:a}),globalThis.alert("You were signed in successfully."),globalThis.document.location.reload()}catch{l.removeAttribute("disabled")}}}const l=document.getElementById("relays"),d=await(0,i.getRelays)(),u=JSON.stringify(d);l.value=u;const c=document.getElementById("relays_submit");c.onclick=async e=>{e.preventDefault(),c.setAttribute("disabled","disabled");const t=l.value;try{const e=JSON.parse(t);if(!Array.isArray(e)||0===e.length)return c.removeAttribute("disabled"),void globalThis.alert("Invalid relays submitted. Please try again.");await(0,i.setRelays)({relays:e}),globalThis.alert("Relays saved."),globalThis.document.location.reload()}catch(e){c.removeAttribute("disabled"),globalThis.alert(`#vRuf1N Error saving relays\n${e.toString()}`)}}})();
//# sourceMappingURL=index.439c42b4.js.map
