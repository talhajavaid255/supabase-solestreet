import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {startStripeCheckout} from "@/lib/stripe/start-checkout";
export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(req:NextRequest){
 const origin=process.env.APP_URL;
 if(!origin || req.headers.get("origin")!==origin) return NextResponse.json({error:"Invalid origin"},{status:403});
 const form=await req.formData();const orderId=form.get("orderId");
 if(typeof orderId!=="string"||!uuid.test(orderId)) return NextResponse.json({error:"Invalid order ID"},{status:400});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user) return NextResponse.redirect(new URL("/login",origin),303);
 try {return NextResponse.redirect(await startStripeCheckout(orderId,user.id,user.email),303);}
 catch(e){console.error("Stripe start failed",e);return NextResponse.redirect(new URL(`/account/orders/${orderId}?stripe_start=failed`,origin),303);}
}
