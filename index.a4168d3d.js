!function(e,t,r,o,n){var s="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},a="function"==typeof s[o]&&s[o],l=a.cache||{},i="undefined"!=typeof module&&"function"==typeof module.require&&module.require.bind(module);function u(t,r){if(!l[t]){if(!e[t]){var n="function"==typeof s[o]&&s[o];if(!r&&n)return n(t,!0);if(a)return a(t,!0);if(i&&"string"==typeof t)return i(t);var d=Error("Cannot find module '"+t+"'");throw d.code="MODULE_NOT_FOUND",d}f.resolve=function(r){var o=e[t][1][r];return null!=o?o:r},f.cache={};var c=l[t]=new u.Module(t);e[t][0].call(c.exports,f,c,c.exports,this)}return l[t].exports;function f(e){var t=f.resolve(e);return!1===t?{}:u(t)}}u.isParcelRequire=!0,u.Module=function(e){this.id=e,this.bundle=u,this.exports={}},u.modules=e,u.cache=l,u.parent=a,u.register=function(t,r){e[t]=[function(e,t){t.exports=r},{}]},Object.defineProperty(u,"root",{get:function(){return s[o]}}),s[o]=u;for(var d=0;d<t.length;d++)u(t[d]);if(r){var c=u(r);"object"==typeof exports&&"undefined"!=typeof module?module.exports=c:"function"==typeof define&&define.amd&&define(function(){return c})}}({dB2Fs:[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"startup",()=>p);var n=e("leaflet"),s=e("../build"),a=e("./map"),l=e("./nostr"),i=e("./nostr/keys"),u=e("./nostr/relays"),d=e("./onboarding"),c=e("./welcome"),f=e("./nostr/nip5");let p=async()=>{let e=await (0,i.hasPrivateKey)();document.getElementById("help").onclick=e=>{e.preventDefault(),(0,a.hackSidePanelOpen)()};let t=document.getElementById("build-id");null!==t&&(t.textContent=s.BUILD_SHA||"local");let r=n.DomUtil.get("loggedIn"),o=n.DomUtil.get("loggedOut");if(e){(0,f.validateNip5)(),n.DomUtil.addClass(r,"show"),n.DomUtil.addClass(o,"hide"),document.getElementById("signout").onclick=async()=>{await (0,i.unsetPrivateKey)(),globalThis.location.reload()};let e=await (0,i.getNpubPublicKey)(),t=await (0,i.getNsecPrivateKey)(),s=globalThis.document.getElementById("npubPublicKey"),a=document.createElement("a");a.href=`https://njump.me/${e}`,a.target="_blank",a.innerText=e,s.appendChild(a),globalThis.document.getElementById("nsecPrivateKey").innerText=t}else n.DomUtil.addClass(r,"hide"),n.DomUtil.addClass(o,"show"),document.getElementById("signup").onclick=()=>{(0,d.startUserOnboarding)(),(0,a.hackSidePanelClosed)()};let p=document.getElementById("relays"),m=JSON.stringify(await (0,l.getRelays)());p.value=m;let y=document.getElementById("relays_submit");y.onclick=async e=>{e.preventDefault(),y.setAttribute("disabled","disabled");let t=p.value;try{let e=JSON.parse(t);if(!Array.isArray(e)){y.removeAttribute("disabled"),globalThis.alert("Invalid relays submitted. Please try again.");return}let r=0===e.length?(0,u.getDefaultRelays)():e;await (0,l.setRelays)({relays:r}),globalThis.alert("Relays saved."),globalThis.document.location.reload()}catch(e){y.removeAttribute("disabled"),globalThis.alert(`#vRuf1N Error saving relays
${e.toString()}`)}},(0,c.startWelcomeSequence)()};p()},{leaflet:"fJCTE","../build":"9Tstj","./map":"89CD3","./nostr":"batwW","./nostr/keys":"8qDuN","./nostr/relays":"esJOU","./onboarding":"35kbs","./welcome":"epjYR","./nostr/nip5":"5uBnK","@parcel/transformer-js/src/esmodule-helpers.js":"k3151"}],"9Tstj":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"BUILD_SHA",()=>n);let n="c52c3b76366767054281182750513d2113a4d669"},{"@parcel/transformer-js/src/esmodule-helpers.js":"k3151"}],epjYR:[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"startWelcomeSequence",()=>i);var n=e("sweetalert2"),s=o.interopDefault(n),a=e("./nostr/keys"),l=e("./utils");let i=async()=>{if(!await (0,a.hasPrivateKey)()){if(!await (0,l.confirmYesNo)("Notes is an experimental feature using an open developed protocol called NOSTR. Continue?")){await (0,s.default).fire({text:"This will become more user friendly in the future. Feel free to come back anytime. Now we'll take you back to the main trustroots site."}),globalThis.location.href="http://www.trustroots.org/search";return}(0,s.default).fire({text:"Great. Browse map to see other people's notes and right click (or long press on mobile) to add your own note. "})}}},{sweetalert2:"d7K5G","./nostr/keys":"8qDuN","./utils":"i8jxn","@parcel/transformer-js/src/esmodule-helpers.js":"k3151"}],"5uBnK":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"validateNip5",()=>i);var n=e("../constants"),s=e("../router"),a=e("../utils"),l=e("./keys");let i=async()=>{try{let e=(0,s.getTrustrootsUsernameFromLocation)();if(e.length<3){(0,a.alert)("Sorry, you need to click to this page from trustroots.org. Without doing that, this site won't work properly. Please go to www.trustroots.org and click the Notes link to come back here. #wBjsEe","You need to click from trustroots");return}let t=await fetch(`${n.TRUSTROOTS_NIP5_URL}?name=${e}`),r=await t.json(),o=r.names?.[e],i=await (0,l.getPublicKey)();o!==i&&(0,a.alert)("Your key doesn't match trustroots. Posting to the map will not work. Please sign out and sign in again with the nsec key that matches your trustroots npub key. #H9bEe2","Fatal error")}catch(e){(0,a.alert)(e,"Unexpected error")}}},{"../constants":"7NbOs","../router":"9sDGW","../utils":"i8jxn","./keys":"8qDuN","@parcel/transformer-js/src/esmodule-helpers.js":"k3151"}]},["dB2Fs"],"dB2Fs","parcelRequire31ee");
//# sourceMappingURL=index.a4168d3d.js.map