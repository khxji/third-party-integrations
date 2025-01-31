import Stripe from "stripe";
import { HandlerReturn } from "../../../utils";
import { CtlxClientType } from "../../../utils/client";
import { upsertUser } from '../../../utils/userActions';

export async function handleCustomerCreated({ event, client }: { event: Stripe.CustomerCreatedEvent, client: CtlxClientType }): HandlerReturn {
    const email = event.data.object.email;
    const CustomerCreatedEventId = event.data.object.id;
    if (!email) {
        throw Error(`Customer email not found in customer created event  ${CustomerCreatedEventId}.`);
    }
    const userName = event.data.object.name;
    if (!userName) {
        throw Error(`Customer username not found in customer created event  ${CustomerCreatedEventId}.`);
    }
    const userId = await upsertUser(email, userName, client);
    return { message: "User upserted successfully.", data: { userId }, status: 201 };


}