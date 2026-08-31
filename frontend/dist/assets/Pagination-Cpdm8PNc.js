import{j as e}from"./query-BnUCzTLM.js";import{c as i,B as c}from"./index-CPqAsLbs.js";/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=i("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=i("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function f({page:s,limit:n,total:t,onPageChange:r}){const a=Math.max(1,Math.ceil(t/n));if(a<=1)return null;const o=t===0?0:(s-1)*n+1,x=Math.min(s*n,t);return e.jsxs("div",{className:"mt-4 flex items-center justify-between",children:[e.jsxs("p",{className:"text-xs text-text-secondary",children:["Showing ",o,"–",x," of ",t]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(c,{variant:"secondary",size:"sm",onClick:()=>r(s-1),disabled:s<=1,"aria-label":"Previous page",children:e.jsx(h,{className:"h-4 w-4"})}),e.jsxs("span",{className:"text-xs text-text-secondary",children:["Page ",s," of ",a]}),e.jsx(c,{variant:"secondary",size:"sm",onClick:()=>r(s+1),disabled:s>=a,"aria-label":"Next page",children:e.jsx(l,{className:"h-4 w-4"})})]})]})}export{f as P};
