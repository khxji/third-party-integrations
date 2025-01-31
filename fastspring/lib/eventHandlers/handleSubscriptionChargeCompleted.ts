import { SUBSCRIPTION_ID_EMPTY } from "../../../stripe/lib/utils/getSubscriptionId.js";
import { CtlxClientType } from "../../../utils/client.js";
import { getLicenseId } from "../../../utils/licenseActions.js";
import { HandlerReturn } from "../../../utils";
import { SUBSCRIPTION_ID_METADATA_KEY } from "../utils/getCustomAttributes.js";

export async function handleSubscriptionChargeCompleted(
  client: CtlxClientType,
  subscriptionChargeCompletedEvent: any
): HandlerReturn {
  const subscriptionChargeCompletedData = subscriptionChargeCompletedEvent.data;
  // logic to renew a license
  if (
    subscriptionChargeCompletedData.status === "successful" &&
    subscriptionChargeCompletedData.order.items.length > 0
  ) {
    const subscriptionId = subscriptionChargeCompletedData.subscription.id;
    const licenseId = await getLicenseId(client, subscriptionId, SUBSCRIPTION_ID_METADATA_KEY);
    const license = await client.POST("/v3/licenses/{id}/renew", {
      params: {
        path: {
          id: licenseId,
        },
      },
    });
    if (license.error) {
      throw Error(
        `Renewal of license with licenseId: ${licenseId} failed with error: ${license.error.code} ${license.error.message}.`
      );
    }
    if (license.data?.suspended) {
      const license = await client.PATCH("/v3/licenses/{id}", {
        params: {
          path: {
            id: licenseId,
          },
        },
        body: {
          suspended: false,
        },
      });
      if (license.error) {
        throw Error(
          `Lifting of the suspended state of license with licenseId: ${licenseId} after renewal failed with error: ${license.error.code} ${license.error.message}.  `
        );
      }
    }
    return {
      message: "License renewed successfully.",
      data: { license: license.data },
      status: 200,
    };
  } else {
    throw Error(
      `Could not process the subscription.charge.completed webhook event with Id ${subscriptionChargeCompletedEvent.id} `
    );
  }
}
