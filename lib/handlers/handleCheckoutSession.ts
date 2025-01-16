import Stripe from "stripe";
import { HandlerReturn } from "..";
import { CtlxClientType } from "../client";
import { getSubscriptionId, SUBCRIPTION_ID_KEY } from "../utils/getSubscriptionId";
import { insertUser } from '../utils/userActions';

export async function handleCheckoutSessionFlow({ event, productId, client }: { event: Stripe.CheckoutSessionCompletedEvent, productId: string, client: CtlxClientType }): HandlerReturn {
    const email = event.data.object.customer_email ?? event.data.object.customer_details?.email;
    const checkoutSessionId = event.data.object.id;
    if (!email) {
        throw Error(`Customer email not found in checkout session ${checkoutSessionId}.`);
    }
    const userName = event.data.object.customer_details?.name ?? `Stripe Checkout ${checkoutSessionId}`;
    const userId = await insertUser(email, userName, client);
    const subscriptionId = getSubscriptionId(event.data.object.subscription);

    const license = await client.POST('/v3/licenses', {
        body: {
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
    })

    if (license.error) {
        throw Error(`License creation failed with error: ${license.error.code} ${license.error.message}. User with ID ${userId} has been created.`);
    }

    return { message: "License created successfully.", data: { license: license.data }, status: 201 };
}