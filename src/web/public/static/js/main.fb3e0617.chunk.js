(this["webpackJsonprole-assign-ui"]=this["webpackJsonprole-assign-ui"]||[]).push([[0],{25:function(e,t,n){},34:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),i=n(8),c=n.n(i),s=(n(25),n(19)),l=n(7),o=n(16),u=n(5),d=n(35),h=n(36),j=n(1);function p(e){var t=Object(a.useState)(""),n=Object(u.a)(t,2),r=n[0],i=n[1],c=Object(a.useState)(""),s=Object(u.a)(c,2),l=s[0],o=s[1],p=Object(a.useState)("exact"),x=Object(u.a)(p,2),b=x[0],g=x[1],m=Object(a.useState)("all"),y=Object(u.a)(m,2),O=y[0],f=y[1],v=["VPA/Software Engineering","MAT/Mathematics Computer Science","MAT/Mathematics","ENG/Mechanical & Mechatronics","ENG/Electrical and Computer","ENG/Engineering","ENG/Chemical","ENG/Architecture","ENG/MGMT Management Sciences","ENG/Systems Design","SCI/Science","SCI/Science Pharmacy","ENG/Civil & Environmental","ENV/Environment","Alumni","ART/Arts Accounting and Finance","ART/Arts"].sort();return Object(j.jsxs)(d.a,{style:{width:"80%",maxWidth:"850px",margin:"auto",padding:"10px"},children:[Object(j.jsx)(d.a.Title,{style:{paddingLeft:"20px",marginBottom:"0px",marginTop:"4px"},children:"Add New Rule"}),Object(j.jsxs)(d.a.Body,{children:[Object(j.jsxs)("p",{children:["Fill out field to create a new role assignment rule. To assign multiple roles, separate them with a comma. For example, if I wanted to assign the ",Object(j.jsx)("code",{children:"SE"})," and ",Object(j.jsx)("code",{children:"ENG"})," role to someone, I would put ",Object(j.jsx)("code",{children:"SE,ENG"}),' in the field. Note that year comparison only fully works for classes with their 1A term in 2021 or later. Classes starting in 2020 can assign for lower years but can\'t distingush between upper years and equal years. Classes starting in 2019 should only rely on the "in any year" option.']}),Object(j.jsx)("hr",{}),Object(j.jsx)("div",{className:"ruleText",children:Object(j.jsxs)("h6",{children:[Object(j.jsxs)("span",{children:["I want to assign the role(s)\xa0",Object(j.jsx)("input",{type:"text",value:r,onChange:function(e){return i(e.target.value)}})]}),Object(j.jsxs)("span",{children:["\xa0to users who's department/program\xa0",Object(j.jsxs)("select",{value:b,onChange:function(e){return g(e.target.value)},children:[Object(j.jsx)("option",{value:"exact",children:"is exactly"}),Object(j.jsx)("option",{value:"begins",children:"begins with"}),Object(j.jsx)("option",{value:"contains",children:"contains"}),Object(j.jsx)("option",{value:"anything",children:"is anything"})]})]}),"anything"!==b&&Object(j.jsxs)("span",{children:["\xa0the value of\xa0",Object(j.jsx)("input",{type:"text",list:"programs",value:l,onChange:function(e){return o(e.target.value)},style:{width:"250px"}}),Object(j.jsx)("datalist",{id:"programs",children:v.map((function(e){return Object(j.jsx)("option",{value:e},e)}))})]}),Object(j.jsxs)("span",{children:["\xa0who are\xa0",Object(j.jsxs)("select",{value:O,onChange:function(e){return f(e.target.value)},children:[Object(j.jsx)("option",{value:"all",children:"in any year"}),Object(j.jsx)("option",{value:"equal",children:"in the same year"}),Object(j.jsx)("option",{value:"upper",children:"upper years"}),Object(j.jsx)("option",{value:"lower",children:"lower years"})]}),"\xa0relative to my year."]})]})}),r&&(l||"anything"===b)?Object(j.jsx)(h.a,{type:"submit",onClick:function(){e.addRule({roles:r.split(",").map((function(e){return e.trim()})),department:"anything"!==b?l:"any",match:b,year:O}),i(""),o("")},children:"Add Rule"}):Object(j.jsx)(h.a,{type:"submit",disabled:!0,children:"Add Rule"})]})]})}function x(e){return Object(j.jsx)(d.a,{style:{marginTop:"4px"},children:Object(j.jsxs)(d.a.Body,{style:{lineHeight:"32px"},children:["#",e.index+1,": Assign the role(s)",(t=e.rule.roles,t.map((function(e){return b(e)}))),"to users who's department ",Object(j.jsx)("b",{children:g(e.rule.match)}),"anything"!==e.rule.match&&b(e.rule.department),"who are ",Object(j.jsx)("b",{children:m(e.rule.year)}),"."]})},e.rule.key);var t}function b(e){return Object(j.jsx)("span",{style:{border:"2px solid grey",padding:"1px",marginLeft:"4px",marginRight:"4px",whiteSpace:"nowrap"},children:e})}function g(e){return"exact"===e?"is exactly":"begins"===e?"begins with":"contains"===e?"contains":"anything"===e?"is anything ":"INVALID MATCH TYPE"}function m(e){return"all"===e?"in any year":"equal"===e?"in the same year":"upper"===e?"upper years":"lower"===e?"lower years":"INVALID YEAR TYPE"}var y=n(11);n(27);var O=function(){var e=Object(a.useState)([]),t=Object(u.a)(e,2),n=t[0],r=t[1],i=Object(a.useState)(2021),c=Object(u.a)(i,2),b=c[0],g=c[1],m=Object(a.useState)(""),O=Object(u.a)(m,2),f=O[0],v=O[1],w=Object(a.useState)(-1),T=Object(u.a)(w,2),S=T[0],C=T[1];function E(){var e={baseYear:b,rules:n.map((function(e,t){var n=Object(l.a)({},e);return delete n.key,n}))};return JSON.stringify(e)}return Object(j.jsxs)("div",{className:"App",style:{marginTop:"20px"},children:[Object(j.jsx)(p,{addRule:function(e){e.key="rule"+String(n.length),r([].concat(Object(o.a)(n),[e]))}}),Object(j.jsxs)(d.a,{style:{width:"80%",maxWidth:"850px",margin:"auto",padding:"10px",marginTop:"20px"},children:[Object(j.jsx)(d.a.Title,{style:{paddingLeft:"20px",marginBottom:"0px",marginTop:"4px"},children:"Rules"}),Object(j.jsxs)(d.a.Body,{children:["The first rule that matches a user will apply, starting from rule #1. I'd recommend including a catch-all rule so that users who have an edge case department (or a department you didn't think of) can still verify. For example, departments might look weird for users currently on a co-op term that are working for UWaterloo.",Object(j.jsx)("br",{}),Object(j.jsx)("hr",{}),Object(j.jsx)(y.a,{onDragEnd:function(e){if(e.destination){var t=Array.from(n),a=t.splice(e.source.index,1),i=Object(u.a)(a,1)[0];t.splice(e.destination.index,0,i),r(t)}},children:Object(j.jsx)(y.c,{droppableId:"rules",children:function(e){return Object(j.jsxs)("div",Object(l.a)(Object(l.a)({},e.droppableProps),{},{ref:e.innerRef,children:[n.map((function(e,t){return Object(j.jsx)(y.b,{draggableId:e.key,index:t,children:function(n){return Object(j.jsx)("div",Object(l.a)(Object(l.a)(Object(l.a)({ref:n.innerRef},n.draggableProps),n.dragHandleProps),{},{children:Object(j.jsx)(x,{rule:e,index:t})}))}},e.key)})),e.placeholder]}))}})}),Object(j.jsxs)("h6",{style:{marginTop:"12px"},children:["Delete a Rule:\xa0",Object(j.jsxs)("select",{value:S,onChange:function(e){return C(e.target.value)},children:[Object(j.jsx)("option",{value:"-1",children:"Select Rule"}),n.map((function(e,t){return Object(j.jsxs)("option",{value:t,children:["Rule ",t+1]})}))]}),Object(j.jsx)(h.a,{variant:"danger",size:"sm",style:{marginLeft:"8px"},onClick:function(){console.log(S),S>=0&&S<n.length&&r(n.filter((function(e,t){return t!==Number(S)})))},children:"Delete"})]})]})]}),Object(j.jsxs)(d.a,{style:{width:"80%",maxWidth:"850px",margin:"auto",padding:"10px",marginTop:"20px"},children:[Object(j.jsx)(d.a.Title,{style:{paddingLeft:"20px",marginBottom:"0px",marginTop:"4px"},children:"Export"}),Object(j.jsxs)(d.a.Body,{children:[Object(j.jsxs)("p",{children:["Copy and paste the entire selection into Discord. If your server uses a prefix besides ",Object(j.jsx)("code",{children:"$"}),", you'll have to replace the first character with your prefix."]}),Object(j.jsxs)("p",{children:["Year of 1A Term: ",Object(j.jsx)("input",{type:"text",value:b,onChange:function(e){return g(Number(e.target.value.replace(/[^0-9]/g,"")))}})]}),Object(j.jsx)("textarea",{value:"$verifyrules "+E(),style:{userSelect:"text",width:"100%",height:"200px"},readOnly:!0}),"Characters: ",E().length+13,"/2000 (Discord has a 2000 character limit - you won't be able to import anything above that)"]})]}),Object(j.jsxs)(d.a,{style:{width:"80%",maxWidth:"850px",margin:"auto",padding:"10px",marginTop:"20px"},children:[Object(j.jsx)(d.a.Title,{style:{paddingLeft:"20px",marginBottom:"0px",marginTop:"4px"},children:"Import"}),Object(j.jsxs)(d.a.Body,{children:[Object(j.jsxs)("p",{children:["Import an existing set of rules to edit. This will append new rules, and won't overwrite what you already have. You can get the current ruleset by using the ",Object(j.jsx)("code",{children:"$verifyrules"})," command. If nothing happens, the imported ruleset is invalid; please make sure you copy and pasted it exactly."]}),Object(j.jsx)("textarea",{value:f,style:{userSelect:"text",width:"100%",height:"200px"},onChange:function(e){return v(e.target.value)}}),Object(j.jsx)(h.a,{type:"submit",onClick:function(){try{var e,t=JSON.parse(f),a=[],i=Object(s.a)(null===t||void 0===t?void 0:t.rules);try{for(i.s();!(e=i.n()).done;){var c,l=e.value;if(console.log(l),(null===(c=l.roles)||void 0===c?void 0:c.length)>0&&l.department&&l.match&&l.year){var u={};u.roles=l.roles,u.department=l.department,u.match=l.match,u.year=l.year,u.key="rule"+String(n.length+a.length),a.push(u)}}}catch(d){i.e(d)}finally{i.f()}r([].concat(Object(o.a)(n),a)),g(Number(t.baseYear))}catch(h){console.log(h)}},children:"Import"})]})]})]})},f=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,37)).then((function(t){var n=t.getCLS,a=t.getFID,r=t.getFCP,i=t.getLCP,c=t.getTTFB;n(e),a(e),r(e),i(e),c(e)}))};c.a.render(Object(j.jsx)(r.a.StrictMode,{children:Object(j.jsx)(O,{})}),document.getElementById("root")),f()}},[[34,1,2]]]);
//# sourceMappingURL=main.fb3e0617.chunk.js.map