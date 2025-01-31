import Stripe from "stripe";
import { HandlerReturn } from "../../../utils";
import { CtlxClientType } from "../../../utils/client";
import { getSubscriptionId, SUBCRIPTION_ID_KEY } from "../utils/getSubscriptionId";
import { insertUser } from '../../../utils/userActions';
import { createLicense } from "../../../utils/licenseActions";

export async function handleCheckoutSessionFlow({ event, productId, client }: { event: Stripe.CheckoutSessionCompletedEvent, productId: string, client: CtlxClientType }): HandlerReturn {
    const email = event.data.object.customer_email ?? event.data.object.customer_details?.email;
    const checkoutSessionId = event.data.object.id;
    if (!email) {
        throw Error(`Customer email not found in checkout session ${checkoutSessionId}.`);
    }
    const userName = event.data.object.customer_details?.name ?? `Stripe Checkout ${checkoutSessionId}`;
    const userId = await insertUser(email, userName, client);
    const subscriptionId = getSubscriptionId(event.data.object.subscription);

    const body =  {
            productId: productId,
            userId: userId,
            metadata: [
                {
                    key: SUBCRIPTION_ID_KEY,
                    value: subscriptionId,
                    viewPermissions: []
                },

            ]
        }

   return await createLicense(client,body)
}