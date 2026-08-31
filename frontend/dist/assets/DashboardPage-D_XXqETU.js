import{j as e}from"./query-BnUCzTLM.js";import{P as b,C as j,a as g,b as k,c as A}from"./Card-EKC7z1gf.js";import{S as t}from"./StatCard-sZ1IEU-b.js";import{S as p}from"./StatusBadge-k2ixnCod.js";import{c as i,S as M,U as N,E as S}from"./index-BzGSVnYf.js";import{u as w}from"./useStaffQueries-BOU8Tad5.js";import{s as L,r as C}from"./statusMeta-DclJ_CRT.js";import{i as x,f as T}from"./date-jkKg_cw_.js";import{L as E}from"./vendor-BlmEpT2w.js";/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=i("ArrowDownToLine",[["path",{d:"M12 17V3",key:"1cwfxf"}],["path",{d:"m6 11 6 6 6-6",key:"12ii2o"}],["path",{d:"M19 21H5",key:"150jfl"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=i("ArrowUpFromLine",[["path",{d:"m18 9-6-6-6 6",key:"kcunyi"}],["path",{d:"M12 3v14",key:"7cf3v8"}],["path",{d:"M5 21h14",key:"11awu3"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=i("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=i("OctagonAlert",[["path",{d:"M12 16h.01",key:"1drbdi"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z",key:"1fd625"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=i("PackageCheck",[["path",{d:"m16 16 2 2 4-4",key:"gfu2re"}],["path",{d:"M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",key:"e7tb2h"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["line",{x1:"12",x2:"12",y1:"22",y2:"12",key:"a4e8g8"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=i("Wrench",[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",key:"cbrjhi"}]]);function Q(){const{data:o,isLoading:s,isError:l,error:n,refetch:r}=w();return e.jsx(M,{isLoading:s,isError:l,error:n,onRetry:r,loadingLabel:"Loading dashboard…",children:o&&e.jsx(H,{data:o})})}function H({data:o}){const{station:s,inventory:l,recentRentals:n}=o,r=L[s.status],y=n.filter(a=>x(a.createdAt)),v=n.filter(a=>a.completedAt&&x(a.completedAt)),d=n.filter(a=>a.status==="OVERDUE").length;return e.jsxs("div",{children:[e.jsx(b,{title:`${s.name}`,description:`Station ${s.code} · ${s.openingTime}–${s.closingTime}`,action:e.jsx(p,{label:r.label,tone:r.tone})}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5",children:[e.jsx(t,{label:"Available",value:l.AVAILABLE,icon:U,tone:"available"}),e.jsx(t,{label:"Rented",value:l.RENTED,icon:N}),e.jsx(t,{label:"Maintenance",value:l.MAINTENANCE,icon:V}),e.jsx(t,{label:"Missing",value:l.MISSING,icon:f,tone:"unavailable"}),e.jsx(t,{label:"Lost",value:l.LOST,icon:f,tone:"unavailable"})]}),e.jsxs("div",{className:"mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3",children:[e.jsx(t,{label:"Today's rentals",value:y.length,icon:D}),e.jsx(t,{label:"Today's returns",value:v.length,icon:R}),e.jsx(t,{label:"Overdue alerts",value:d,icon:I,tone:d>0?"unavailable":"default"})]}),e.jsxs(j,{className:"mt-6",children:[e.jsxs(g,{className:"flex items-center justify-between",children:[e.jsx(k,{children:"Recent activity"}),e.jsx(E,{to:"/staff/rentals",className:"text-xs font-medium text-brand-dark hover:underline",children:"View all active rentals"})]}),e.jsx(A,{className:"p-0",children:n.length===0?e.jsx(S,{title:"No recent activity",description:"Active and overdue rentals at this station will show up here."}):e.jsx("div",{className:"divide-y divide-border",children:n.map(a=>{var m,u,h;const c=C[a.status];return e.jsxs("div",{className:"flex items-center justify-between gap-4 px-5 py-3",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsxs("p",{className:"truncate text-sm font-medium text-text-primary",children:[((m=a.umbrella)==null?void 0:m.publicCode)??"Umbrella"," · ",((u=a.student)==null?void 0:u.name)??"Student"]}),e.jsxs("p",{className:"mt-0.5 text-xs text-text-secondary",children:[(h=a.student)==null?void 0:h.lpuId," · Rented ",T(a.createdAt)]})]}),e.jsx(p,{label:c.label,tone:c.tone})]},a.id)})})})]})]})}export{Q as default};
