import { suiClientManager } from './sui';

export interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  collection: string;
  type: string;
}

export class NFTService {
  private cache: NFT[] = [];
  private cacheTimeout: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute

  async getNFTs(address: string): Promise<NFT[]> {
    // Check cache
    if (this.cache.length > 0 && Date.now() < this.cacheTimeout) {
      return this.cache;
    }

    try {
      const client = suiClientManager.getClient();

      // Get all objects owned by the address
      const objects = await client.getOwnedObjects({
        owner: address,
        options: {
          showType: true,
          showDisplay: true,
          showContent: true,
        },
      });

      const nfts: NFT[] = [];

      for (const object of objects.data) {
        // Filter for NFT-like objects (objects with display fields)
        if (object.data?.display) {
          const display = object.data.display.data as any;
          const nft: NFT = {
            id: object.data?.objectId || '',
            name: display?.name || 'Unknown NFT',
            description: display?.description || '',
            imageUrl: display?.image_url || display?.image || '',
            collection: display?.collection_name || 'Unknown Collection',
            type: object.data?.type || '',
          };
          nfts.push(nft);
        }
      }

      this.cache = nfts;
      this.cacheTimeout = Date.now() + this.CACHE_DURATION;

      return nfts;
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache = [];
    this.cacheTimeout = 0;
  }
}

export const nftService = new NFTService();