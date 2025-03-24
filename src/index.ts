#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { snsClient } from "./sns-utils.js";
import { initWallet } from "./wallet.js";
import { searchDAOs } from "./mockDB.js";
import { SnsVote } from "@dfinity/sns";

function hexStringToByteArray(hexString: string): number[] {
  const result = [];
  for (let i = 0; i < hexString.length; i += 2) {
    const hexByte = hexString.substring(i, i + 2);
    const byte = parseInt(hexByte, 16);
    result.push(byte);
  }
  return result;
}

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: "mcp-sns-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_proposals",
        description: "List all proposals",
        inputSchema: {
          type: "object",
          properties: {
            daoName: {
              type: "string",
              description: "DAO name",
            },
          },
          required: ["daoName"],
        },
      },
      {
        name: "list_votable_neurons",
        description: "List all votable neurons",
        inputSchema: {
          type: "object",
          properties: {
            daoName: {
              type: "string",
              description: "DAO name",
            },
            principalId: {
              type: "string",
              description: "Principal ID",
            },
          },
          required: ["principalId"],
        },
      },
      {
        name: "list_votable_neurons",
        description:
          "List all votable neurons, e8s is decimals number of token 1_0000_0000 es8 meaning 1 token",
        inputSchema: {
          type: "object",
          properties: {
            daoName: {
              type: "string",
              description: "DAO name",
            },
            principalId: {
              type: "string",
              description: "Principal ID",
            },
          },
          required: ["daoName", "principalId"],
        },
      },
      {
        name: "get_system_parameters",
        description: "List all configuration parameters",
        inputSchema: {
          type: "object",
          properties: {
            daoName: {
              type: "string",
              description: "DAO name",
            },
          },
          required: ["daoName"],
        },
      },
      {
        name: "wallet",
        description: "get my wallet",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "vote_proposal",
        description: "vote on a proposal",
        inputSchema: {
          type: "object",
          properties: {
            daoName: {
              type: "string",
              description: "DAO name",
            },
            principalId: {
              type: "string",
              description: "Principal ID",
            },
            neuronId: {
              type: "string",
              description: "Neuron ID",
            },
            proposalId: {
              type: "string",
              description: "Proposal ID",
            },
            vote: {
              type: "string",
              description: "Vote (yes, no, unspecified)",
            },
          },
          required: [
            "daoName",
            "principalId",
            "neuronId",
            "proposalId",
            "vote",
          ],
        },
      },
    ],
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "list_proposals": {
      const daoName = String(request.params.arguments?.daoName);
      if (!daoName) {
        throw new Error("daoName is required");
      }
      let canister_id = searchDAOs(daoName);

      if (canister_id) {
        const proposals = await snsClient.listProposals(canister_id);

        return proposals;
      }

      return {
        content: [
          {
            type: "text",
            text: `No proposals found for DAO: ${daoName}`,
          },
        ],
      };
    }

    case "list_votable_neurons": {
      const principalId = String(request.params.arguments?.principalId);

      const daoName = String(request.params.arguments?.daoName);
      if (!daoName) {
        throw new Error("daoName is required");
      }
      let rootCanisterId = searchDAOs(daoName);

      if (!rootCanisterId || !principalId) {
        throw new Error("rootCanisterId and principalId are required");
      }

      return await snsClient.listVotableNeurons(rootCanisterId, principalId);
    }

    case "get_system_parameters": {
      const principalId = String(request.params.arguments?.principalId);

      const daoName = String(request.params.arguments?.daoName);
      if (!daoName) {
        throw new Error("daoName is required");
      }
      let rootCanisterId = searchDAOs(daoName);

      if (!rootCanisterId || !principalId) {
        throw new Error("rootCanisterId and principalId are required");
      }

      return await snsClient.getSystemParams(rootCanisterId);
    }

    case "vote_proposal": {
      const principalId = String(request.params.arguments?.principalId);
      const neuronId = String(request.params.arguments?.neuronId);
      const proposalId = String(request.params.arguments?.proposalId);
      const voteString = String(request.params.arguments?.vote).toLowerCase();
      const daoName = String(request.params.arguments?.daoName);

      if (!daoName) {
        throw new Error("daoName is required");
      }
      let rootCanisterId = searchDAOs(daoName);

      if (
        !rootCanisterId ||
        !principalId ||
        !neuronId ||
        !proposalId ||
        !voteString
      ) {
        throw new Error(
          "rootCanisterId, principalId, neuronId, proposalId, and vote are required"
        );
      }

      // Convert string vote to SnsVote enum
      let vote;
      switch (voteString) {
        case "yes":
          vote = SnsVote.Yes;
          break;
        case "no":
          vote = SnsVote.No;
          break;
        case "unspecified":
          vote = SnsVote.Unspecified;
          break;
        default:
          throw new Error("Vote must be 'yes', 'no', or 'unspecified'");
      }

      return await snsClient.registerVote(
        rootCanisterId,
        hexStringToByteArray(neuronId),
        proposalId,
        vote
      );
    }

    case "wallet": {
      let idenitty = initWallet();
      return {
        content: [
          {
            type: "text",
            text: `Wallet: ${idenitty.getPrincipal().toText()}`,
          },
        ],
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
