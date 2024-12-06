import { Application, createFederation, Endpoints, exportJwk, generateCryptoKeyPair, importJwk, MemoryKvStore } from "@fedify/fedify";

const SERVER_DOMAIN = process.env.SERVER_DOMAIN;
// The instance actor is required for object lookups for some Mastodon servers
// More info: https://seb.jambor.dev/posts/understanding-activitypub-part-4-threads/#the-instance-actor
export const INSTANCE_ACTOR = SERVER_DOMAIN ?? 'username';
const ORIGIN = `https://${SERVER_DOMAIN}/`;

// Temp KV store for development
const kv = new MemoryKvStore();

export const federation = createFederation<void>({
  // For production, a more persistent KV store should be used
  kv,
  signatureTimeWindow: { minutes: 5 },
});

export const context = federation.createContext(new URL(ORIGIN));

// Allow the remote server to fetch this server's instance actor
federation.setActorDispatcher("/users/{identifier}", async (context, identifier) => {
    if (identifier != INSTANCE_ACTOR) {
      return null;
    }

    const keyPairs = await context.getActorKeyPairs(identifier);
    const publicKey = keyPairs[0]?.cryptographicKey ?? undefined;

    return new Application({
      id: context.getActorUri(identifier),
      name: "Instance Actor",
      summary: "This is the server's instance actor.",
      preferredUsername: identifier,
      url: new URL("/", context.url),
      inbox: context.getInboxUri(identifier),
      endpoints: new Endpoints({
        sharedInbox: context.getInboxUri(),
      }),
      publicKey,
      assertionMethods: keyPairs.map((keyPair) => keyPair.multikey),
    });
  })
  // Set the key pairs dispatcher to generate and store the key pair for the instance actor
  .setKeyPairsDispatcher(async (context, identifier) => {
    // The only user we have is the instance actor
    if (identifier != INSTANCE_ACTOR) {
      return [];
    }

    const entry = await kv.get<{
      privateKey: JsonWebKey;
      publicKey: JsonWebKey;
    }>([identifier]);

    if (entry == null || entry.privateKey == null) {
      // Generate a new key pair at the first time:
      const { privateKey, publicKey } = await generateCryptoKeyPair(
        "RSASSA-PKCS1-v1_5"
      );
      // Store the generated key pair to the Deno KV database in JWK format:
      await kv.set([identifier], {
        privateKey: await exportJwk(privateKey),
        publicKey: await exportJwk(publicKey),
      });

      return [{ privateKey, publicKey }];
    } else {
      // Load the key pair from the KV database:
      const privateKey = await importJwk(entry.privateKey, "private");
      const publicKey = await importJwk(entry.publicKey, "public");

      return [{ privateKey, publicKey }];
    }
  });

// Even though this is basically a read-only server
// We still must supply an inbox listener for the remote server to send us objects
federation.setInboxListeners("/users/{identifier}/inbox", "/inbox")
