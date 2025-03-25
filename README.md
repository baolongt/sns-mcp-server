# mcp-sns-server MCP Server

A Model Context Protocol server for interacting with DAOs on the Internet Computer

<a href="https://glama.ai/mcp/servers/@baolongt/sns-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@baolongt/sns-mcp-server/badge" alt="SNS Server MCP server" />
</a>

This is a TypeScript-based MCP server that implements an interface to Service Nervous System (SNS) DAOs. It demonstrates core MCP concepts by providing tools to interact with decentralized autonomous organizations.

[Demo](https://www.youtube.com/watch?v=Ljg0ee-8UFM)

## Setup

add your seed phrase to env file

```
cp .env.example .env
```

## Features

### Tools

- `list_proposals` - List all proposals for a specific DAO

  - Takes DAO name as parameter
  - Returns list of proposals from the specified DAO

- `list_votable_neurons` - List all votable neurons for a user in a DAO

  - Takes DAO name and principal ID as parameters
  - Returns neurons that can vote on proposals

- `get_system_parameters` - List all configuration parameters for a DAO

  - Takes DAO name as parameter
  - Returns system parameters for the specified DAO

- `wallet` - Get the user's wallet information

  - Returns the principal ID of the current wallet

- `vote_proposal` - Vote on a proposal
  - Takes DAO name, principal ID, neuron ID, proposal ID, and vote preference
  - Allows voting yes, no, or unspecified on proposals
  - Registers vote with the DAO governance system

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-sns-server": {
      "command": "/path/to/mcp-sns-server/build/index.js"
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.