let ListDAOs: Record<string, string> = {
  kongswap: "ormnc-tiaaa-aaaaq-aadyq-cai",
  icp: "qoctq-giaaa-aaaaa-aaaea-cai",
  golddao: "tw2vt-hqaaa-aaaaq-aab6a-cai",
};

/**
 * Search for a DAO by keyword and return its canister ID
 * @param keyword The search term to look for in DAO names
 * @returns The canister ID of the matching DAO or a default value if not found
 */
export function searchDAOs(keyword: string): string | null {
  const searchTerm = keyword.toLowerCase();

  // First try for exact match
  for (const [daoName, canisterId] of Object.entries(ListDAOs)) {
    if (daoName.toLowerCase() === searchTerm) {
      return canisterId; // Return exact match immediately
    }
  }

  // If no exact match, look for partial match
  for (const [daoName, canisterId] of Object.entries(ListDAOs)) {
    if (daoName.toLowerCase().includes(searchTerm)) {
      return canisterId; // Return first partial match
    }
  }

  return null;
}
