// Helper function to get short address for plain text (6 chars prefix + ... + 4 chars suffix)
export const getShortAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to get formatted address parts for colored display
export const getAddressParts = (address: string): { prefix: string; suffix: string } | null => {
  if (!address || address.length < 12) return null;

  return {
    prefix: address.slice(0, 6),
    suffix: address.slice(-6)
  };
};