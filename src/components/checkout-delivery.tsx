"use client";
import {useState} from "react";
import {ArrowRight, CreditCard, Plus} from "lucide-react";
type Address={id:string;full_name:string;line1:string;line2:string|null;city:string;state:string;postal_code:string;country_code:string;is_default:boolean};
export default function CheckoutDelivery({addresses,subtotal}:{addresses:Address[];subtotal:number}){
 const [addressId,setAddressId]=useState(addresses.find(a=>a.is_default)?.id??addresses[0]?.id??"");
 const [shippingMethod,setShippingMethod]=useState("standard");
 const [paymentMethod,setPaymentMethod]=useState<"stripe"|"demo">("stripe");
 const [sending,setSending]=useState(false);
 const shipping=shippingMethod==="express"?12:0;
 return <form action="/api/checkout/place" method="POST" onSubmit={()=>setSending(true)} className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
  <div className="space-y-7">
   <section className="rounded-3xl border border-zinc-200 bg-white p-7 sm:p-9">
    <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">Shipping Address</h2><a href="/checkout" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600"><Plus className="h-4 w-4" aria-hidden />Add address</a></div>
    <div className="mt-6 space-y-3">{addresses.map(a=><label key={a.id} className={`flex cursor-pointer gap-4 rounded-2xl border p-5 ${addressId===a.id?"border-orange-500 bg-orange-50":"border-zinc-200"}`}>
     <input type="radio" name="addressId" value={a.id} checked={addressId===a.id} onChange={()=>setAddressId(a.id)} required className="accent-orange-600"/>
     <span className="text-sm leading-6"><strong className="block">{a.full_name}</strong>{a.line1}{a.line2?`, ${a.line2}`:""}<br/>{a.city}, {a.state} {a.postal_code}<br/>{a.country_code}</span>
    </label>)}</div>
   </section>
   <section className="rounded-3xl border border-zinc-200 bg-white p-7 sm:p-9"><h2 className="text-2xl font-black">Delivery Method</h2>
    <div className="mt-6 space-y-3">{[{id:"standard",name:"Standard",cost:"Free"},{id:"express",name:"Express",cost:"$12.00"}].map(m=><label key={m.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-5 ${shippingMethod===m.id?"border-orange-500 bg-orange-50":"border-zinc-200"}`}>
     <span className="flex items-center gap-3"><input type="radio" name="shippingMethod" value={m.id} checked={shippingMethod===m.id} onChange={()=>setShippingMethod(m.id)} className="accent-orange-600"/><strong>{m.name}</strong></span><span>{m.cost}</span>
    </label>)}</div>
   </section>
  </div>
  <aside className="rounded-3xl border border-zinc-200 bg-white p-7 lg:sticky lg:top-8"><h2 className="text-2xl font-black">Order Summary</h2>
   <div className="mt-6 flex justify-between"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
   <div className="mt-4 flex justify-between"><span>Shipping</span><strong>${shipping.toFixed(2)}</strong></div>
   <div className="mt-6 flex justify-between border-t pt-6 text-xl font-black"><span>Demo total</span><span>${(subtotal+shipping).toFixed(2)}</span></div>
   <p className="mt-3 text-xs text-zinc-500">The server recalculates the actual total. Test-mode tax is $0.</p>
   <h3 className="mt-8 mb-3 font-bold">Payment Method</h3>
   <div className="space-y-3">{[{id:"stripe",name:"Pay with Stripe",desc:"Test card payment"},{id:"demo",name:"Place Demo Order",desc:"No payment collected"}].map(m=><label key={m.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${paymentMethod===m.id?"border-orange-500 bg-orange-50":"border-zinc-200"}`}>
    <input type="radio" name="paymentMethod" value={m.id} checked={paymentMethod===m.id} onChange={()=>setPaymentMethod(m.id as "stripe"|"demo")} className="accent-orange-600"/>
    <span><strong className="block text-sm">{m.name}</strong><small className="text-zinc-500">{m.desc}</small></span>
   </label>)}</div>
   <button type="submit" disabled={sending||!addressId} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-4 font-bold text-white hover:bg-orange-600 disabled:opacity-40">{sending?"Processing...":paymentMethod==="stripe"?<><CreditCard className="h-4 w-4" aria-hidden />Pay ${(subtotal+shipping).toFixed(2)} with Stripe</>:<><ArrowRight className="h-4 w-4" aria-hidden />Place Demo Order</>}</button>
   <p className="mt-4 text-center text-xs leading-5 text-zinc-500">Stripe operates in test mode. A pending order reserves inventory; closing Stripe will not release it until expiration or reconciliation.</p>
  </aside>
 </form>;
}
