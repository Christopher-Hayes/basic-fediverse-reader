import {
  Federation,
} from "@fedify/fedify";
import { federation, } from "@/util/federation";
import { getXForwardedRequest } from "x-forwarded-fetch";

function integrateFederation<TContextData>(
  federation: Federation<TContextData>,
  contextDataFactory: (request: Request) => TContextData | Promise<TContextData>
) {
  return async (request: Request) => {
    const forwardedRequest = await getXForwardedRequest(request);
    const contextData = await contextDataFactory(forwardedRequest);

    return await federation.fetch(forwardedRequest, {
      contextData,
      onNotFound: () => {
        return new Response("Not found", { status: 404 }); // unused
      },
      onNotAcceptable: () => {
        return new Response("Not acceptable", {
          status: 406,
          headers: {
            "Content-Type": "text/plain",
            Vary: "Accept",
          },
        });
      },
    });
  };
}

const requestHandler = integrateFederation(federation, () => {});

export {
  requestHandler as DELETE,
  requestHandler as GET,
  requestHandler as PATCH,
  requestHandler as POST,
  requestHandler as PUT,
};
