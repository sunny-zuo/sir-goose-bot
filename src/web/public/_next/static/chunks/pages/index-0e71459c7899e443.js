(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{5301:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return n(1355)}])},1355:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return J}});var r=n(5893),s=n(9008),a=n(6727),i=n(5506),l=n(9065),o=n(5675),c=n(1664),u=[{name:"Rule Builder",href:"#",current:!0}];function d(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return t.filter(Boolean).join(" ")}function m(){return(0,r.jsx)(a.pJ,{as:"nav",className:"bg-gray-800",children:function(e){var t=e.open;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("div",{className:"mx-auto max-w-7xl px-2 sm:px-6 lg:px-8",children:(0,r.jsxs)("div",{className:"relative flex h-16 items-center justify-between",children:[(0,r.jsx)("div",{className:"absolute inset-y-0 left-0 flex items-center sm:hidden",children:(0,r.jsxs)(a.pJ.Button,{className:"inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white",children:[(0,r.jsx)("span",{className:"sr-only",children:"Open main menu"}),t?(0,r.jsx)(i.Z,{className:"block h-6 w-6","aria-hidden":"true"}):(0,r.jsx)(l.Z,{className:"block h-6 w-6","aria-hidden":"true"})]})}),(0,r.jsxs)("div",{className:"flex flex-1 items-center justify-center sm:items-stretch sm:justify-start",children:[(0,r.jsxs)("div",{className:"flex flex-shrink-0 items-center",children:[(0,r.jsx)("div",{className:"-mt-8 block h-8 w-auto lg:hidden",children:(0,r.jsx)(c.default,{href:"/",passHref:!0,children:(0,r.jsx)("a",{children:(0,r.jsx)(o.default,{src:"https://sunnyzuo.com/assets/goose.png",alt:"Sir Goose",height:64,width:64,loader:function(e){return e.src}})})})}),(0,r.jsx)("div",{className:"-mt-8 hidden h-8 w-auto lg:block",children:(0,r.jsx)(c.default,{href:"/",passHref:!0,children:(0,r.jsx)("a",{children:(0,r.jsx)(o.default,{src:"https://sunnyzuo.com/assets/goose-long.png",alt:"Sir Goose",height:64,width:200,loader:function(e){return e.src}})})})})]}),(0,r.jsx)("div",{className:"hidden sm:ml-6 sm:block",children:(0,r.jsx)("div",{className:"flex space-x-4",children:u.map((function(e){return(0,r.jsx)("a",{href:e.href,className:d(e.current?"bg-gray-900 text-white":"text-gray-300 hover:bg-gray-700 hover:text-white","rounded-md px-3 py-2 text-sm font-medium"),"aria-current":e.current?"page":void 0,children:e.name},e.name)}))})})]})]})}),(0,r.jsx)(a.pJ.Panel,{className:"sm:hidden",children:(0,r.jsx)("div",{className:"space-y-1 px-2 pt-2 pb-3",children:u.map((function(e){return(0,r.jsx)(a.pJ.Button,{as:"a",href:e.href,className:d(e.current?"bg-gray-900 text-white":"text-gray-300 hover:bg-gray-700 hover:text-white","block rounded-md px-3 py-2 text-base font-medium"),"aria-current":e.current?"page":void 0,children:e.name},e.name)}))})})]})}})}var h=n(9014),x=n(2366),f=n(197),p=n(219),g=n(7294),y=n(8945),b=n(7051),v=n(2358),j=n(9748);function w(e){switch(e.yearMatch){case"equal":return"during the year ".concat(e.year);case"upper":return"before the year ".concat(e.year);case"lower":return"after the year ".concat(e.year);case"all":return"during any year";default:return"INVALID RULE"}}function N(e){switch(e.match){case"exact":return"is exactly ".concat(e.department);case"begins":return"begins with ".concat(e.department);case"contains":return"contains ".concat(e.department);case"anything":return"is anything";default:return"INVALID RULE"}}function k(e){var t=e.rule,n=e.pos,s=e.max,a=e.moveUp,i=e.moveDown,l=e.deleteRule,o=e.openRuleEditor;return(0,r.jsxs)("div",{className:"".concat(n%2===0?"bg-gray-50":"bg-white"," px-4 py-5 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6"),children:[(0,r.jsxs)("dt",{className:"mt-0.5 text-sm font-medium text-gray-500 sm:col-span-2",children:["Rule #",n+1]}),(0,r.jsxs)("dd",{className:"mt-1 text-sm text-gray-900 sm:col-span-8 sm:mt-0",children:["Assign the ",t.roles.length>1?"roles":"role"," ",t.roles.map((function(e,t){return n=e,s=t,(0,r.jsxs)("span",{className:"mx-0.5 mb-0.5 inline-block whitespace-nowrap rounded-lg bg-discord py-0.5 px-2 text-sm text-white",children:[(0,r.jsx)("span",{className:"mr-2 inline-block h-3 w-3 rounded-full bg-white"}),n]},s);var n,s}))," to users whose department"," ",(0,r.jsx)("span",{className:"font-semibold",children:N(t)}),", started ",(0,r.jsx)("span",{className:"font-semibold",children:w(t)}),", and stop processing more rules."]},"ruleText"),(0,r.jsxs)("div",{className:"flex flex-row-reverse items-center sm:col-span-2",children:[(0,r.jsx)(y.Z,{className:"ml-3 h-5 w-5 cursor-pointer text-indigo-600 hover:text-indigo-400",onClick:function(){return l(n)}}),(0,r.jsx)(b.Z,{className:"ml-3 h-5 w-5 cursor-pointer text-indigo-600 hover:text-indigo-400",onClick:function(){return o(n)}}),(0,r.jsx)(v.Z,{className:s===n?"ml-3 h-5 w-5 cursor-not-allowed text-gray-400":"ml-3 h-5 w-5 cursor-pointer text-indigo-600 hover:text-indigo-400",onClick:function(){return i(n)}}),(0,r.jsx)(j.Z,{className:0===n?"ml-3 h-5 w-5 cursor-not-allowed text-gray-400":"ml-3 h-5 w-5 cursor-pointer text-indigo-600 hover:text-indigo-400",onClick:function(){return a(n)}})]})]})}function S(e){var t=e.open,n=e.setOpen,s=e.setOpenCreate,i=e.setOpenImport,l=(0,g.useRef)(null);return(0,r.jsx)(a.uT,{show:t,as:g.Fragment,enter:"ease-out duration-300",enterFrom:"opacity-0",enterTo:"opacity-100",leave:"ease-in duration-200",leaveFrom:"opacity-100",leaveTo:"opacity-0",children:(0,r.jsxs)(a.Vq,{as:"div",className:"fixed inset-0 z-10 overflow-y-auto",initialFocus:l,open:t,onClose:function(){return n(!1)},children:[(0,r.jsx)(a.Vq.Overlay,{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"}),(0,r.jsxs)("div",{className:"flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0",children:[(0,r.jsx)("span",{className:"hidden sm:inline-block sm:h-screen sm:align-middle","aria-hidden":"true",children:"\u200b"}),(0,r.jsxs)("div",{className:"relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle",children:[(0,r.jsxs)("div",{className:"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4",children:[(0,r.jsx)(a.Vq.Title,{as:"h3",className:"text-xl font-bold leading-6 text-gray-900",children:"How do verification rules work?"}),(0,r.jsxs)(a.Vq.Description,{as:"div",children:[(0,r.jsxs)("p",{className:"text-m mt-2 text-gray-700",children:["When a user verifies on your server, Sir Goose gets two attributes from them: their University of Waterloo"," ",(0,r.jsx)("span",{className:"font-semibold",children:"department"}),", and the ",(0,r.jsx)("span",{className:"font-semibold",children:"year"})," their UWaterloo account was created. You can use this info to decide what roles to assign users based on their department and year by creating verification rules."]}),(0,r.jsxs)("p",{className:"text-m mt-4 text-gray-700",children:["You can configure rules to match exact departments/years, or use comparison operators to capture multiple departments/years with a single rule. For example, in the SE 2025 server, we assign the"," ",(0,r.jsxs)("span",{className:"rounded-lg bg-discord py-0.5 px-2 text-sm text-white",children:[(0,r.jsx)("span",{className:"mr-2 inline-block h-3 w-3 rounded-full bg-white"}),"Upper-Year (SE)"]})," ","role to users whose department is ",(0,r.jsx)("span",{className:"text-black",children:"VPA/Software Engineering"})," and entrance year is"," ",(0,r.jsx)("span",{className:"text-black",children:"earlier than 2020"}),"."]}),(0,r.jsxs)("p",{className:"text-m mt-4 text-gray-700",children:["One important thing to keep in mind is that the first rule that a user matches is applied, starting from the top. Thus,"," ",(0,r.jsx)("span",{className:"font-semibold",children:"rule order matters"}),"."]}),(0,r.jsxs)("p",{className:"text-m mt-4 text-gray-700",children:["Get started by"," ",(0,r.jsx)("span",{className:"cursor-pointer text-indigo-700",onClick:function(){n(!1),s(!0)},children:"creating your first rule"}),", or"," ",(0,r.jsx)("span",{className:"cursor-pointer text-indigo-700",onClick:function(){n(!1),i(!0)},children:"by importing a sample ruleset"}),"!"]})]})]}),(0,r.jsx)("div",{className:"bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6",children:(0,r.jsx)("button",{type:"button",className:"inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm",onClick:function(){return n(!1)},ref:l,children:"Got it!"})})]})]})]})})}var C=n(4343),E=n(9422),O=n(6441);function A(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function T(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function R(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},r=Object.keys(n);"function"===typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable})))),r.forEach((function(t){T(e,t,n[t])}))}return e}function F(e){return function(e){if(Array.isArray(e))return A(e)}(e)||function(e){if("undefined"!==typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,t){if(!e)return;if("string"===typeof e)return A(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(n);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return A(e,t)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var M=["ART/Arts","ART/Arts Accounting and Finance","Alumni","ENG/Architectural Engineering","ENG/Chemical","ENG/Civil & Environmental","ENG/Electrical and Computer","ENG/Engineering","ENG/MGMT Management Sciences","ENG/Mechanical & Mechatronics","ENG/Systems Design","ENV/Environment","HLTH/Faculty of Health","MAT/Mathematics","MAT/Mathematics Computer Science","SCI/Science","SCI/Science Pharmacy","VPA/Software Engineering","CUSTOM/BME 26","CUSTOM/CivE 26","CUSTOM/MECH 26","CUSTOM/TRON 26","CUSTOM/SE"].sort(),V={anything:"Any",exact:"Exact",begins:"Begins With",contains:"Contains"},I={all:"All",equal:"Equal",lower:"After",upper:"Before"};function q(e){var t=function(){return 0!==j.length&&((0!==z.length||"anything"===q)&&("all"===G||0!==P.length&&!isNaN(Number(P))))},n=function(){if(t()){var e=function(){var e={roles:j,department:"anything"===q?"any":z,match:q,yearMatch:G};return"all"!==G&&(e.year=Number(P)),e}(),n=F(o);n[null!==u&&void 0!==u?u:n.length]=e,c(n),l(!1)}},s=function(){0!==S.length&&(w(F(j).concat([S])),A(""))},i=e.open,l=e.setOpen,o=e.rules,c=e.setRules,u=e.pos,d=void 0!==u&&0<=u&&u<o.length,m=(0,g.useState)(null),h=m[0],x=m[1],f=(0,g.useState)(null),y=f[0],b=f[1],v=(0,g.useState)([]),j=v[0],w=v[1],N=(0,g.useRef)(null),k=(0,g.useState)(""),S=k[0],A=k[1],T=(0,g.useState)("anything"),q=T[0],U=T[1],Z=(0,g.useState)("all"),G=Z[0],B=Z[1],D=(0,g.useState)(""),P=D[0],_=D[1],J=(0,g.useState)(""),z=J[0],L=J[1],Y=(0,g.useState)(""),H=Y[0],Q=Y[1],W=""===H?M:M.filter((function(e){return e.toLowerCase().includes(H.toLowerCase())})),$=(0,O.D)(h,y,{placement:"bottom-start"}),X=$.styles,K=$.attributes,ee=$.forceUpdate;return(0,g.useEffect)((function(){var e,t,n,r,s,a,l;i&&(w(null!==(s=null===(e=o[u])||void 0===e?void 0:e.roles)&&void 0!==s?s:[]),A(""),U(null!==(a=null===(t=o[u])||void 0===t?void 0:t.match)&&void 0!==a?a:"anything"),L(o[u]&&"any"!==o[u].department?o[u].department:""),B(null!==(l=null===(n=o[u])||void 0===n?void 0:n.yearMatch)&&void 0!==l?l:"all"),_((null===(r=o[u])||void 0===r?void 0:r.year)?String(o[u].year):""),Q(""))}),[u,o,i]),(0,g.useEffect)((function(){ee&&ee()}),[j,ee]),(0,r.jsx)(a.uT,{show:i,as:g.Fragment,enter:"ease-out duration-300",enterFrom:"opacity-0",enterTo:"opacity-100",leave:"ease-in duration-200",leaveFrom:"opacity-100",leaveTo:"opacity-0",children:(0,r.jsxs)(a.Vq,{as:"div",className:"fixed inset-0 z-10 overflow-y-auto",open:i,onClose:function(){return l(!1)},children:[(0,r.jsx)(a.Vq.Overlay,{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"}),(0,r.jsxs)("div",{className:"flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0 ",children:[(0,r.jsx)("span",{className:"hidden sm:inline-block sm:h-screen sm:align-middle","aria-hidden":"true",children:"\u200b"}),(0,r.jsxs)("div",{className:"relative inline-block transform rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle",children:[(0,r.jsxs)("div",{className:"rounded-t-lg bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4",children:[(0,r.jsxs)(a.Vq.Title,{as:"h3",className:"text-xl font-bold leading-6 text-gray-900",children:[d?"Edit":"Create"," Verification Rule"]}),(0,r.jsxs)(a.Vq.Description,{as:"div",className:"mt-4",children:[(0,r.jsxs)("div",{className:"grid grid-cols-12",children:[(0,r.jsx)("h5",{className:"col-span-4 flex font-semibold text-gray-900",children:"Roles To Assign:"}),(0,r.jsxs)("div",{className:"col-span-8",children:[j.map((function(e,t){return n=e,s=t,(0,r.jsxs)("span",{className:"group mx-0.5 inline-block select-none whitespace-nowrap rounded-lg bg-discord py-0.5 px-2 text-sm text-white",children:[(0,r.jsx)("span",{className:"mr-2 inline-block h-3 w-3 rounded-full bg-white text-center leading-3 text-gray-800",children:(0,r.jsx)("span",{className:"text-md -mt-[0.0625rem] inline-block cursor-pointer align-top text-red-500 group-hover:inline-block sm:hidden",onClick:function(){return w(j.filter((function(e,t){return t!==s})))},children:"\xd7"})}),n]},s);var n,s})),(0,r.jsxs)(a.J2,{as:"div",className:"relative inline-block",children:[(0,r.jsx)("div",{children:(0,r.jsx)(a.J2.Button,{className:"align-top",ref:x,children:(0,r.jsx)(p.Z,{className:"mx-1.5 mt-1 h-5 w-5 cursor-pointer text-indigo-700 hover:text-indigo-500"})})}),(0,r.jsx)(a.J2.Panel,R({ref:b,style:R({zIndex:10},X.popper)},K.popper,{children:(0,r.jsx)(a.uT,{as:g.Fragment,beforeEnter:function(){return null!==ee&&ee()},afterEnter:function(){var e;return null===(e=N.current)||void 0===e?void 0:e.focus()},enter:"transition ease-out duration-100",enterFrom:"transform opacity-0 scale-95",enterTo:"transform opacity-100 scale-100",leave:"transition ease-in duration-75",leaveFrom:"transform opacity-100 scale-100",leaveTo:"transform opacity-0 scale-95",children:(0,r.jsxs)("div",{className:"m-1.5 w-64 divide-y divide-gray-100 rounded-md bg-white p-1.5 shadow-lg ring-1 ring-black ring-opacity-10 focus:outline-none",children:[(0,r.jsx)("input",{className:"inline-block w-[13rem] flex-1 overflow-y-visible rounded-md border-white pl-1 ring-white focus:outline-none",placeholder:"Role Name",value:S,onChange:function(e){return A(e.target.value)},onKeyUp:function(e){return"Enter"===e.key&&s()},ref:N}),(0,r.jsx)(a.J2.Button,{className:"ml-2 h-6 w-6 align-top",children:(0,r.jsx)(C.Z,{className:"relative h-6 w-6 cursor-pointer text-green-600 hover:text-green-400",onClick:s})})]})})}))]})]})]}),(0,r.jsxs)("div",{className:"mt-4 grid grid-cols-12",children:[(0,r.jsx)("h5",{className:"col-span-4 mt-2 flex font-semibold text-gray-900",children:"Department Match:"}),(0,r.jsx)("div",{className:"col-span-8",children:(0,r.jsx)("div",{className:"relative w-80",children:(0,r.jsx)(a.Ri,{value:q,onChange:U,children:(0,r.jsxs)("div",{className:"relative mt-1",children:[(0,r.jsxs)(a.Ri.Button,{className:"relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",children:[(0,r.jsx)("span",{className:"block truncate",children:V[q]}),(0,r.jsx)("span",{className:"pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2",children:(0,r.jsx)(E.Z,{className:"h-5 w-5 text-gray-400","aria-hidden":"true"})})]}),(0,r.jsx)(a.uT,{as:g.Fragment,leave:"transition ease-in duration-100",leaveFrom:"opacity-100",leaveTo:"opacity-0",children:(0,r.jsx)(a.Ri.Options,{className:"absolute z-20 mt-1 max-h-60 w-full overflow-visible rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",children:Object.keys(V).map((function(e,t){return(0,r.jsx)(a.Ri.Option,{className:function(e){var t=e.active;return"relative cursor-default select-none py-2 pl-10 pr-4 ".concat(t?"bg-teal-600 text-white":"text-gray-900")},value:e,children:function(t){var n=t.selected,s=t.active;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("span",{className:"block truncate ".concat(n?"font-medium":"font-normal"),children:V[e]}),n?(0,r.jsx)("span",{className:"absolute inset-y-0 left-0 flex items-center pl-3 ".concat(s?"text-white":"text-teal-600"),children:(0,r.jsx)(C.Z,{className:"h-5 w-5","aria-hidden":"true"})}):null]})}},t)}))})})]})})})})]}),(0,r.jsxs)("div",{className:"mt-2 grid grid-cols-12 ".concat("anything"===q?"hidden":"inline-block"),children:[(0,r.jsx)("h5",{className:"col-span-4 mt-2 flex font-semibold text-gray-900",children:"Department:"}),(0,r.jsx)("div",{className:"col-span-8",children:(0,r.jsx)(a.hQ,{value:z,onChange:function(e){M.includes(e)||M.push(e),L(e)},children:(0,r.jsxs)("div",{className:"relative mt-1 w-80",children:[(0,r.jsxs)("div",{className:"relative w-full cursor-default overflow-hidden rounded-lg border border-gray-300 bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm",children:[(0,r.jsx)(a.hQ.Input,{className:"w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:outline-none focus:ring-0",onChange:function(e){return Q(e.target.value)}}),(0,r.jsx)(a.hQ.Button,{className:"absolute inset-y-0 right-0 flex items-center pr-2",children:(0,r.jsx)(E.Z,{className:"h-5 w-5 text-gray-400","aria-hidden":"true"})})]}),(0,r.jsx)(a.uT,{as:g.Fragment,leave:"transition ease-in duration-100",leaveFrom:"opacity-100",leaveTo:"opacity-0",afterLeave:function(){return Q("")},children:(0,r.jsxs)(a.hQ.Options,{className:"absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",children:[W.map((function(e){return(0,r.jsx)(a.hQ.Option,{className:function(e){var t=e.active;return"relative cursor-default select-none py-2 pl-10 pr-4 ".concat(t?"bg-teal-600 text-white":"text-gray-900")},value:e,children:function(t){var n=t.selected,s=t.active;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("span",{className:"block truncate ".concat(n?"font-medium":"font-normal"),children:e}),n?(0,r.jsx)("span",{className:"absolute inset-y-0 left-0 flex items-center pl-3 ".concat(s?"text-white":"text-teal-600"),children:(0,r.jsx)(C.Z,{className:"h-5 w-5","aria-hidden":"true"})}):null]})}},e)})),""!==H&&!W.includes(H)&&(0,r.jsx)(a.hQ.Option,{className:function(e){var t=e.active;return"relative cursor-default select-none py-2 pl-10 pr-4 ".concat(t?"bg-teal-600 text-white":"text-gray-900")},value:H,children:function(e){var t=e.selected,n=e.active;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("span",{className:"block truncate",children:['Create "',H,'"']}),t?(0,r.jsx)("span",{className:"absolute inset-y-0 left-0 flex items-center pl-3 ".concat(n?"text-white":"text-teal-600"),children:(0,r.jsx)(C.Z,{className:"h-5 w-5","aria-hidden":"true"})}):null]})}},H)]})})]})})})]}),(0,r.jsxs)("div",{className:"mt-2 grid grid-cols-12",children:[(0,r.jsx)("h5",{className:"col-span-4 mt-2 flex font-semibold text-gray-900",children:"Year Match:"}),(0,r.jsx)("div",{className:"col-span-8",children:(0,r.jsx)("div",{className:"relative w-80",children:(0,r.jsx)(a.Ri,{value:G,onChange:B,children:(0,r.jsxs)("div",{className:"relative mt-1",children:[(0,r.jsxs)(a.Ri.Button,{className:"relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",children:[(0,r.jsx)("span",{className:"block truncate",children:I[G]}),(0,r.jsx)("span",{className:"pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2",children:(0,r.jsx)(E.Z,{className:"h-5 w-5 text-gray-400","aria-hidden":"true"})})]}),(0,r.jsx)(a.uT,{as:g.Fragment,leave:"transition ease-in duration-100",leaveFrom:"opacity-100",leaveTo:"opacity-0",children:(0,r.jsx)(a.Ri.Options,{className:"absolute z-10 mt-1 max-h-60 w-full overflow-visible rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",children:Object.keys(I).map((function(e,t){return(0,r.jsx)(a.Ri.Option,{className:function(e){var t=e.active;return"relative cursor-default select-none py-2 pl-10 pr-4 ".concat(t?"bg-teal-600 text-white":"text-gray-900")},value:e,children:function(t){var n=t.selected,s=t.active;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("span",{className:"block truncate ".concat(n?"font-medium":"font-normal"),children:I[e]}),n?(0,r.jsx)("span",{className:"absolute inset-y-0 left-0 flex items-center pl-3 ".concat(s?"text-white":"text-teal-600"),children:(0,r.jsx)(C.Z,{className:"h-5 w-5","aria-hidden":"true"})}):null]})}},t)}))})})]})})})})]}),(0,r.jsxs)("div",{className:"mt-2 grid grid-cols-12 ".concat("all"===G?"hidden":"inline-block"),children:[(0,r.jsx)("h5",{className:"col-span-4 mt-2 flex font-semibold text-gray-900",children:"Entrance Year:"}),(0,r.jsx)("div",{className:"col-span-8",children:(0,r.jsx)("div",{className:"relative w-80",children:(0,r.jsx)("input",{type:"number",className:"relative mt-1 w-full rounded-md border border-gray-300 py-2 pl-3 shadow-md [appearance:textfield] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",placeholder:"ex: 2021",value:P,onChange:function(e){return _(e.target.value)}})})})]})]})]}),(0,r.jsxs)("div",{className:"rounded-b-lg bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6",children:[(0,r.jsx)("button",{type:"button",className:"inline-flex w-full justify-center rounded-md border bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75 sm:ml-3 sm:w-auto sm:text-sm",onClick:function(){return n()},disabled:!t(),children:d?"Update Rule":"Create Rule"}),(0,r.jsx)("button",{type:"button",className:"inline-flex w-full justify-center rounded-md border border-gray-400 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm",onClick:function(){return l(!1)},children:"Cancel"})]})]})]})]})})}function U(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function Z(e){return function(e){if(Array.isArray(e))return U(e)}(e)||function(e){if("undefined"!==typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,t){if(!e)return;if("string"===typeof e)return U(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(n);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return U(e,t)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function G(e){var t=function(){try{var e=JSON.parse(c);if(!e.rules||!Array.isArray(e.rules))return!1;var t=!0,n=!1,r=void 0;try{for(var s,a=e.rules[Symbol.iterator]();!(t=(s=a.next()).done);t=!0){var i=s.value;if(!i.match||!i.roles||!Array.isArray(i.roles)||0===i.roles.length)return!1;if(!i.roles.every((function(e){return"string"===typeof e})))return!1;if("anything"!==i.match&&!i.department)return!1;if("all"!==i.yearMatch&&(!i.year||isNaN(Number(i.year))))return!1}}catch(l){n=!0,r=l}finally{try{t||null==a.return||a.return()}finally{if(n)throw r}}return!0}catch(o){return!1}},n=e.open,s=e.setOpen,i=e.rules,l=e.setRules,o=(0,g.useState)(""),c=o[0],u=o[1],d=(0,g.useRef)(null);return(0,r.jsx)(a.uT,{show:n,as:g.Fragment,enter:"ease-out duration-300",enterFrom:"opacity-0",enterTo:"opacity-100",leave:"ease-in duration-200",leaveFrom:"opacity-100",leaveTo:"opacity-0",children:(0,r.jsxs)(a.Vq,{as:"div",className:"fixed inset-0 z-10 overflow-y-auto",initialFocus:d,open:n,onClose:function(){return s(!1)},children:[(0,r.jsx)(a.Vq.Overlay,{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"}),(0,r.jsxs)("div",{className:"flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0",children:[(0,r.jsx)("span",{className:"hidden sm:inline-block sm:h-screen sm:align-middle","aria-hidden":"true",children:"\u200b"}),(0,r.jsxs)("div",{className:"relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle",children:[(0,r.jsxs)("div",{className:"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4",children:[(0,r.jsx)(a.Vq.Title,{as:"h3",className:"text-xl font-bold leading-6 text-gray-900",children:"Import Verification Rules"}),(0,r.jsxs)(a.Vq.Description,{as:"div",children:[(0,r.jsxs)("p",{className:"text-m mt-2 text-gray-700",children:["You can import an existing ruleset to make changes to. Use the ",(0,r.jsx)("code",{children:"/verifyrules"})," command to export your existing ruleset, and paste the output here. You can also"," ",(0,r.jsx)("span",{onClick:function(){return u('{"v":2,"rules":[{"roles":["SE"],"department":"VPA/Software Engineering","match":"exact","yearMatch":"equal","year":2020},{"roles":["Upper-Year (SE)"],"department":"VPA/Software Engineering","match":"exact","yearMatch":"upper","year":2020},{"roles":["Lower-Year (SE)"],"department":"VPA/Software Engineering","match":"exact","yearMatch":"lower","year":2020},{"roles":["Non-SE"],"department":"any","match":"anything","yearMatch":"all"}]}')},className:"cursor-pointer text-indigo-700",children:"click here"})," ","to import a sample ruleset."]}),(0,r.jsx)("label",{htmlFor:"import",className:"mt-2 block text-sm font-medium text-gray-700",children:"Ruleset:"}),(0,r.jsx)("div",{className:"mt-1",children:(0,r.jsx)("textarea",{id:"import",name:"import",rows:6,className:"mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",ref:d,value:c,onChange:function(e){return u(e.target.value)}})})]})]}),(0,r.jsxs)("div",{className:"bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6",children:[(0,r.jsx)("button",{type:"button",className:"inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75 sm:ml-3 sm:w-auto sm:text-sm",onClick:function(){return function(){if(t())try{var e=Z(i),n=JSON.parse(c),r=!0,a=!1,o=void 0;try{for(var d,m=n.rules[Symbol.iterator]();!(r=(d=m.next()).done);r=!0){var h=d.value,x={roles:h.roles,department:"anything"!==h.match?h.department:"any",match:h.match,yearMatch:h.yearMatch};"all"!==h.yearMatch&&(x.year=Number(h.year)),e.push(x)}}catch(f){a=!0,o=f}finally{try{r||null==m.return||m.return()}finally{if(a)throw o}}u(""),l(e),s(!1)}catch(p){}}()},disabled:!t(),children:"Import"}),(0,r.jsx)("button",{type:"button",className:"inline-flex w-full justify-center rounded-md border border-gray-400 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm",onClick:function(){s(!1)},children:"Cancel"})]})]})]})]})})}function B(e){var t=e.open,n=e.setOpen,s=e.rules,i=(0,g.useRef)(null);return(0,r.jsx)(a.uT,{show:t,as:g.Fragment,enter:"ease-out duration-300",enterFrom:"opacity-0",enterTo:"opacity-100",leave:"ease-in duration-200",leaveFrom:"opacity-100",leaveTo:"opacity-0",children:(0,r.jsxs)(a.Vq,{as:"div",className:"fixed inset-0 z-10 overflow-y-auto",initialFocus:i,open:t,onClose:function(){return n(!1)},children:[(0,r.jsx)(a.Vq.Overlay,{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"}),(0,r.jsxs)("div",{className:"flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0",children:[(0,r.jsx)("span",{className:"hidden sm:inline-block sm:h-screen sm:align-middle","aria-hidden":"true",children:"\u200b"}),(0,r.jsxs)("div",{className:"relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle",children:[(0,r.jsxs)("div",{className:"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4",children:[(0,r.jsx)(a.Vq.Title,{as:"h3",className:"text-xl font-bold leading-6 text-gray-900",children:"Export Verification Rules"}),(0,r.jsxs)(a.Vq.Description,{as:"div",children:[(0,r.jsxs)("p",{className:"text-m mt-2 text-gray-700",children:["Export your ruleset to save a copy or to import on Discord using the ",(0,r.jsx)("code",{children:"/verifyrules"})," command."]}),(0,r.jsx)("label",{htmlFor:"export",className:"mt-2 block text-sm font-medium text-gray-700",children:"Ruleset:"}),(0,r.jsx)("div",{className:"mt-1",children:(0,r.jsx)("textarea",{id:"export",name:"export",rows:6,className:"mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",value:JSON.stringify({v:2,rules:s}),onFocus:function(e){return e.target.select()},readOnly:!0})})]})]}),(0,r.jsx)("div",{className:"bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6",children:(0,r.jsx)("button",{type:"button",className:"inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75 sm:ml-3 sm:w-auto sm:text-sm",onClick:function(){return n(!1)},ref:i,children:"Got it!"})})]})]})]})})}function D(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function P(e){return function(e){if(Array.isArray(e))return D(e)}(e)||function(e){if("undefined"!==typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,t){if(!e)return;if("string"===typeof e)return D(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(n);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return D(e,t)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function _(){var e=function(e){e<1||i.length<=e||l(P(i.slice(0,e-1)).concat([i[e],i[e-1]],P(i.slice(e+1))))},t=function(e){e<0||i.length<=e+1||l(P(i.slice(0,e)).concat([i[e+1],i[e]],P(i.slice(e+2))))},n=function(e){var t=P(i);t.splice(e,1),l(t)},s=function(e){F(e),A(!0)},a=(0,g.useState)([]),i=a[0],l=a[1],o=(0,g.useState)(!1),c=o[0],u=o[1],d=(0,g.useState)(!1),m=d[0],y=d[1],b=(0,g.useState)(!1),v=b[0],j=b[1],w=(0,g.useState)(!1),N=w[0],C=w[1],E=(0,g.useState)(!1),O=E[0],A=E[1],T=(0,g.useState)(i.length),R=T[0],F=T[1];return(0,r.jsxs)("div",{children:[(0,r.jsx)("header",{className:"bg-white shadow ",children:(0,r.jsxs)("div",{className:"mx-auto max-w-6xl py-6 px-4 lg:flex lg:items-center lg:justify-between ",children:[(0,r.jsx)("div",{className:"min-w-0 flex-1",children:(0,r.jsx)("h2",{className:"text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl",children:"Verification Rule Builder"})}),(0,r.jsxs)("div",{className:"mt-5 flex lg:mt-0 lg:ml-4",children:[(0,r.jsx)("span",{className:"ml-1 hidden sm:ml-3 sm:block",children:(0,r.jsxs)("button",{type:"button",className:"inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",onClick:function(){return u(!0)},children:[(0,r.jsx)(h.Z,{className:"-ml-1 mr-2 h-5 w-5"}),(0,r.jsx)("span",{className:"-mt-0.5",children:"Help"})]})}),(0,r.jsx)("span",{className:"ml-1 sm:ml-3",children:(0,r.jsxs)("button",{type:"button",className:"inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",onClick:function(){return y(!0)},children:[(0,r.jsx)(x.Z,{className:"-ml-1 mr-2 h-5 w-5"}),(0,r.jsx)("span",{className:"-mt-0.5",children:"Import"})]})}),(0,r.jsx)("span",{className:"ml-1 sm:ml-3",children:(0,r.jsxs)("button",{type:"button",className:"inline-flex items-center rounded-md border border-transparent bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",onClick:function(){return j(!0)},children:[(0,r.jsx)(f.Z,{className:"-ml-1 mr-2 h-5 w-5"}),(0,r.jsx)("span",{className:"-mt-0.5",children:"Export"})]})}),(0,r.jsx)("span",{className:"ml-1 sm:ml-3",children:(0,r.jsxs)("button",{type:"button",className:"inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",onClick:function(){return C(!0)},children:[(0,r.jsx)(p.Z,{className:"-ml-1 mr-2 h-5 w-5"}),(0,r.jsx)("span",{className:"-mt-0.5",children:"Add Rule"})]})})]})]})}),(0,r.jsxs)("div",{className:"mx-auto max-w-6xl py-6 px-4 lg:flex lg:items-center lg:justify-between ",children:[(0,r.jsx)(S,{open:c,setOpen:u,setOpenCreate:C,setOpenImport:y}),(0,r.jsx)(G,{open:m,setOpen:y,rules:i,setRules:l}),(0,r.jsx)(B,{open:v,setOpen:j,rules:i}),(0,r.jsx)(q,{open:N,setOpen:C,rules:i,setRules:l,pos:i.length}),(0,r.jsx)(q,{open:O,setOpen:A,rules:i,setRules:l,pos:R}),(0,r.jsxs)("div",{className:"w-full overflow-hidden bg-white shadow sm:rounded-lg",children:[(0,r.jsx)("div",{className:"border-t border-gray-200",children:i.map((function(a,l){return(0,r.jsx)(k,{rule:a,pos:l,max:i.length-1,moveUp:e,moveDown:t,deleteRule:n,openRuleEditor:s},"rule-card-".concat(l))}))}),0===i.length&&(0,r.jsxs)("h3",{className:"block w-full p-4 text-center text-gray-700",children:["There's nothing here..."," ",(0,r.jsx)("span",{className:"cursor-pointer text-indigo-700",onClick:function(){return C(!0)},children:"Create a new rule"})," ","or"," ",(0,r.jsx)("span",{className:"cursor-pointer text-indigo-700",onClick:function(){return y(!0)},children:"import a ruleset!"})]})]})]})]})}var J=function(){return(0,r.jsxs)("div",{children:[(0,r.jsx)(s.default,{children:(0,r.jsx)("title",{children:"Sir Goose | Rule Builder"})}),(0,r.jsx)(m,{}),(0,r.jsx)(_,{})]})}}},function(e){e.O(0,[156,774,888,179],(function(){return t=5301,e(e.s=t);var t}));var t=e.O();_N_E=t}]);