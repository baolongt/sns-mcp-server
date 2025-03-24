import { initSnsWrapper, SnsVote } from "@dfinity/sns";
import { HttpAgent, Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { safeParseJSON } from "./helper.js";
import { initWallet } from "./wallet.js";

/**
 * SnsClient class for interacting with the SNS canister
 */
export class SnsClient {
  private readonly agent: HttpAgent;

  /**
   * Create a new SnsClient
   * @param host The IC host to connect to (defaults to mainnet)
   */
  constructor(identity?: Identity) {
    this.agent = HttpAgent.createSync({ host: "https://ic0.app", identity });
  }

  /**
   * Get an SNS wrapper instance for a specific canister
   * @param canisterId The root canister ID of the SNS to interact with
   * @returns The SNS wrapper instance
   */
  private async getSnsWrapper(canisterId: string) {
    return await initSnsWrapper({
      rootOptions: {
        canisterId: Principal.fromText(canisterId),
      },
      agent: this.agent,
    });
  }

  /**
   * List proposals for a specific SNS
   * @param canisterId The root canister ID of the SNS
   * @param limit Maximum number of proposals to fetch
   * @returns Formatted response with proposal data
   */
  async listProposals(canisterId: string, limit: number = 100) {
    try {
      const snsWrapper = await this.getSnsWrapper(canisterId);

      // Fetch proposals from the SNS
      const listProposalsRes = await snsWrapper.listProposals({
        limit,
      });

      // Get the proposal list
      const proposalList = listProposalsRes.proposals;

      // Return the proposals as a formatted JSON string
      return {
        content: [
          {
            type: "text",
            text: `proposals: ${safeParseJSON(proposalList)}`,
          },
        ],
      };
    } catch (error) {
      // Return an error message if the fetch fails
      return {
        content: [
          {
            type: "text",
            text: `Error fetching proposals: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
      };
    }
  }

  /**
   * List voteable neurons for a specific SNS
   * @param rootCanisterId The root canister ID of the SNS
   * @param principalId The principal ID to check neurons for
   * @returns Formatted response with neuron data
   */
  async listVotableNeurons(rootCanisterId: string, principalId: string) {
    try {
      const snsWrapper = await this.getSnsWrapper(rootCanisterId);

      const neurons = await snsWrapper.listNeurons({
        principal: Principal.fromText(principalId),
      });

      const governanceParams = await snsWrapper.nervousSystemParameters({});

      return {
        content: [
          {
            type: "text",
            text: `
            System configuration: ${safeParseJSON(governanceParams)}
            Neuron list: ${safeParseJSON(neurons)}

            If neuron is dissolved it mean it is not active anymore, the neuron can vote if neuron_minimum_dissolve_delay_to_vote_seconds < now - dissolve_timestamp
            if neurons is not included in ballot, it means it is not voteable

            `,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching neurons: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
      };
    }
  }

  async getSystemParams(rootCanisterId: string) {
    try {
      const snsWrapper = await this.getSnsWrapper(rootCanisterId);

      const governanceParams = await snsWrapper.nervousSystemParameters({});

      return {
        content: [
          {
            type: "text",
            text: `Governance parameters: ${safeParseJSON(governanceParams)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching governance parameters: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
      };
    }
  }

  async registerVote(
    rootCanisterId: string,
    neuronId: number[],
    proposalId: string,
    vote: SnsVote
  ) {
    const snsWrapper = await this.getSnsWrapper(rootCanisterId);

    try {
      const registerVoteRes = await snsWrapper.registerVote({
        neuronId: {
          id: neuronId,
        },
        proposalId: {
          id: BigInt(proposalId),
        },
        vote,
      });

      return {
        content: [
          {
            type: "text",
            text: `Vote registered: ${safeParseJSON(registerVoteRes)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error registering vote: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
      };
    }
  }
}

export const snsClient = new SnsClient(initWallet());
