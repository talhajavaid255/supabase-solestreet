import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {startStripeCheckout} from "@/lib/stripe/start-checkout";
export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(request:NextRequest){
  const origin=process.env.APP_URL;
  if(!origin || new URL(origin).origin!==origin) return NextResponse.json({error:"Invalid APP_URL"},{status:500});
  if(request.headers.get("origin")!==origin) return NextResponse.json({error:"Invalid origin"},{status:403});
  const form=await request.formData();
  const addressId=form.get("addressId"),shippingMethod=form.get("shippingMethod"),paymentMethod=form.get("paymentMethod");
  if(typeof addressId!=="string" || !uuid.test(addressId) || !["standard","express"].includes(String(shippingMethod)) || !["demo","stripe"].includes(String(paymentMethod))) {
    return NextResponse.json({error:"Invalid checkout selection"},{status:400});
  }
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError || !user) return NextResponse.redirect(new URL("/login",origin),303);
  // Atomic database RPC owns address, price, inventory, order, cart clearing.
  const {data:orderId,error}=await supabase.rpc("place_demo_order",{p_address_id:addressId,p_shipping_method:shippingMethod});
  if(error || !orderId) return NextResponse.json({error:error?.message??"Could not place order"},{status:409});
  if(paymentMethod==="demo") return NextResponse.redirect(new URL(`/checkout/confirmation/${orderId}`,origin),303);
  try {
    const url=await startStripeCheckout(String(orderId),user.id,user.email);
    return NextResponse.redirect(url,303);
  } catch(e) {
    console.error("Order created but Stripe start failed; customer must resolve existing order",orderId,e);
    return NextResponse.redirect(new URL(`/account/orders/${orderId}?stripe_start=failed`,origin),303);
  }
}
