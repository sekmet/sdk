import documentLoader from './vc/document-loader';
import vcjs from 'vc-js';
import {Ed25519KeyPair, suites} from 'jsonld-signatures';
import Secp256k1KeyPair from 'secp256k1-key-pair';
import {EcdsaSepc256k1Signature2019} from './vc/signatures';

const {Ed25519Signature2018} = suites;



//TODO: discuss whether we still want to allow usage of the signing functionality outside of credentials created with
// our VerifiableCredential class.
/**
 * Get signature suite from a keyDoc
 * @param {object} keyDoc - key document containing `id`, `controller`, `type`, `privateKeyBase58` and `publicKeyBase58`
 * @returns {EcdsaSepc256k1Signature2019|Ed25519Signature2018} - signature suite.
 */
export function getSuiteFromKeyDoc(keyDoc) {
  switch(keyDoc.type) {
  case 'EcdsaSecp256k1VerificationKey2019':
    return new EcdsaSepc256k1Signature2019({key: new Secp256k1KeyPair(keyDoc)});
  case 'Ed25519VerificationKey2018':
    return new Ed25519Signature2018({key: new Ed25519KeyPair(keyDoc)});
  default:
    throw new Error(`Unknown key type ${keyDoc.type}.`);
  }
}

/**
 * Issue a Verifiable credential
 * @param {object} keyDoc - key document containing `id`, `controller`, `type`, `privateKeyBase58` and `publicKeyBase58`
 * @param {object} credential - Credential to be signed.
 * @return {object} The signed credential object.
 */
export async function issueCredential(keyDoc, credential) {
  const suite = getSuiteFromKeyDoc(keyDoc);
  // The following code (including `issue` method) will modify the passed credential so clone it.
  const cred = {...credential};
  cred.issuer = keyDoc.controller;
  return await vcjs.issue({
    suite,
    credential: cred
  });
}

/**
 * Verify a Verifiable Credential
 * @param {object} credential - verifiable credential to be verified.
 * @param {object} resolver - Resolver for DIDs.
 * @return {object} verification result.
 */
export async function verifyCredential(credential, resolver) {
  return await vcjs.verifyCredential({
    credential,
    suite: [new Ed25519Signature2018(), new EcdsaSepc256k1Signature2019()],
    documentLoader: documentLoader(resolver)
  });
}

/**
 * Create an unsigned Verifiable Presentation
 * @param {object|Array<object>} credential - verifiable credential (or an array of them) to be bundled as a presentation.
 * @param {string} id - optional verifiable presentation id to use
 * @param {string} holder - optional presentation holder url
 * @return {object} verifiable presentation.
 */
export function createPresentation(verifiableCredential, id, holder) {
  return vcjs.createPresentation({
    verifiableCredential,
    id,
    holder
  });
}

/**
 * Sign a Verifiable Presentation
 * @param {object} presentation - the one to be signed
 * @param {object} keyDoc - key document containing `id`, `controller`, `type`, `privateKeyBase58` and `publicKeyBase58`
 * @param {string} challenge - proof challenge Required.
 * @param {string} domain - proof domain (optional)
 * @return {Promise<{VerifiablePresentation}>} A VerifiablePresentation with a proof.
 */
export async function signPresentation(presentation, keyDoc, challenge, domain) {
  // TODO: support other purposes than the default of "authentication"
  const suite = getSuiteFromKeyDoc(keyDoc);
  return await vcjs.signPresentation({
    presentation,
    suite,
    domain,
    challenge
  });
}

/**
 * Verify a Verifiable Presentation
 * @param {object} presentation - verifiable credential to be verified.
 * @param {string} challenge - proof challenge Required.
 * @param {string} domain - proof domain (optional)
 * @param {object} resolver - Resolver to resolve the issuer DID (optional)
 * @return {object} verification result.
 */
export async function verifyPresentation(presentation, challenge, domain, resolver) {
  // TODO: support other purposes than the default of "authentication"
  return await vcjs.verify({
    presentation,
    suite: [new Ed25519Signature2018(), new EcdsaSepc256k1Signature2019()],
    challenge,
    domain,
    documentLoader: documentLoader(resolver)
  });
}


/**
 * Return true if the given value is a string.
 * @param value
 * @returns {boolean}
 */
export function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

/**
 * Return true if a value is an object
 * @param value
 * @returns {boolean}
 */
export function isObject(value) {
  return value && typeof value === 'object' && value.constructor === Object;
}
