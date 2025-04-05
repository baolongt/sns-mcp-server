import { DelegationChain, DelegationIdentity } from "@dfinity/identity";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { toBase64 } from "@slide-computer/signer";
import * as bip39 from "bip39";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generates a random principal using BIP39 mnemonic
 */
function generateRandomPrincipal() {
  // Generate a random BIP39 mnemonic (24 words by default)
  const mnemonic = bip39.generateMnemonic();

  // Generate a random seed from the mnemonic
  const seed = bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);

  const identity = Secp256k1KeyIdentity.generate(seed);

  return { mnemonic, identity };
}

/**
 * Reconstructs an identity from an existing mnemonic phrase
 * @param mnemonic The BIP39 mnemonic seed phrase to recover from
 */
function recoverFromMnemonic(mnemonic: string) {
  try {
    const seed = bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);

    const identity = Secp256k1KeyIdentity.generate(seed);
    return identity;
  } catch (error) {
    console.error("Failed to recover identity from mnemonic:", error);
    throw error;
  }
}

export const initWallet = () => {
  // Get seed phrase from environment variable
  const seedPhrase = process.env.SEED_PHRASE;

  if (!seedPhrase) {
    throw new Error("Missing SEED_PHRASE environment variable");
  }

  try {
    // Recover identity using the seed phrase
    const identity = recoverFromMnemonic(seedPhrase);
    return identity;
  } catch (error) {
    console.error("Failed to initialize wallet:", error);
    throw error;
  }
};
