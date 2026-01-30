import { suiClientManager } from './sui';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export interface Validator {
  address: string;
  name: string;
  apy: string;
  stakedAmount: string;
  commissionRate: number;
  nextEpochCommissionRate: number;
  atRiskOfBeingChurned: boolean;
}

export interface StakedSui {
  id: string;
  principal: string;
  stakeRequestEpoch: number;
  reward: string;
  estimatedReward: string;
  status: string;
  validatorAddress?: string;
}

export interface StakingPosition {
  id: string;
  coinType: string;
  symbol: string;
  stakedAmount: string;
  rewards: string;
  apy: string;
  stakeStartTimestamp: number;
  validatorAddress?: string;
  validatorName?: string;
  status?: string;
}

export class StakingService {
  private static instance: StakingService;
  private stakingCache: Map<string, StakingPosition[]> = new Map();
  private validatorsCache: Validator[] | null = null;
  private validatorsCacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  private constructor() {}

  static getInstance(): StakingService {
    if (!StakingService.instance) {
      StakingService.instance = new StakingService();
    }
    return StakingService.instance;
  }

  /**
   * Get all validators from Sui network
   */
  async getValidators(): Promise<Validator[]> {
    const now = Date.now();
    
    // Return cached validators if still valid
    if (this.validatorsCache && now - this.validatorsCacheTimestamp < this.CACHE_DURATION) {
      return this.validatorsCache;
    }

    try {
      const client = suiClientManager.getClient();
      const systemState = await client.getLatestSuiSystemState();
      
      const validators = systemState.activeValidators.map(validator => {
        // Calculate approximate APY (simplified, actual APY varies)
        const apy = '3.5'; // Default APY for Sui staking
        
        return {
          address: validator.suiAddress,
          name: validator.name || validator.suiAddress.slice(0, 8) + '...',
          apy,
          stakedAmount: this.formatMist(BigInt(validator.stakingPoolSuiBalance)),
          commissionRate: Number(validator.commissionRate) / 100,
          nextEpochCommissionRate: Number(validator.nextEpochCommissionRate) / 100,
          atRiskOfBeingChurned: false,
        };
      });

      // Sort by staked amount descending (popular validators first)
      validators.sort((a, b) => parseFloat(b.stakedAmount) - parseFloat(a.stakedAmount));
      
      this.validatorsCache = validators;
      this.validatorsCacheTimestamp = now;
      
      return validators;
    } catch (error) {
      console.error('Failed to get validators:', error);
      return [];
    }
  }

  /**
   * Get staked SUI for an address
   */
  async getStakingPositions(address: string): Promise<StakingPosition[]> {
    const cacheKey = `staking_${address}`;
    const cached = this.stakingCache.get(cacheKey);
    
    // Check cache
    if (cached && (Date.now() - cached[0].stakeStartTimestamp < this.CACHE_DURATION)) {
      return cached;
    }

    try {
      const client = suiClientManager.getClient();
      const systemState = await client.getLatestSuiSystemState();
      
      // Get staked SUI using getStakes
      const stakes = await client.getStakes({
        owner: address,
      });

      const positions: StakingPosition[] = [];

      // Get validator addresses for reference
      const validators = await this.getValidators();
      const validatorMap = new Map(validators.map(v => [v.address, v]));

      for (const stake of stakes) {
        const stakeData = stake as any;
        const validator = validatorMap.get(stakeData.validatorAddress);
        const apy = validator?.apy || '0.00';
        const stakeStartEpoch = Number(stakeData.stakeRequestEpoch || 0);
        const estimatedReward = stakeData.estimatedReward || '0';
        const currentEpoch = Number(systemState.epoch);
        
        positions.push({
          id: stakeData.stakedSuiId || stakeData.id,
          coinType: '0x2::sui::SUI',
          symbol: 'SUI',
          stakedAmount: this.formatMist(BigInt(stakeData.principal || '0')),
          rewards: this.formatMist(BigInt(estimatedReward)),
          apy,
          stakeStartTimestamp: Date.now() - (currentEpoch - stakeStartEpoch) * 24 * 60 * 60 * 1000,
          validatorAddress: stakeData.validatorAddress,
          validatorName: validator?.name || 'Unknown',
          status: 'Active',
        });
      }

      this.stakingCache.set(cacheKey, positions);
      return positions;
    } catch (error) {
      console.error('Failed to get staking positions:', error);
      return [];
    }
  }

  /**
   * Get available staking pools (validators)
   */
  async getAvailableStakingPools(_address: string, _balances: any[]): Promise<StakingPosition[]> {
    try {
      const validators = await this.getValidators();
      
      return validators.map(validator => ({
        id: validator.address,
        coinType: '0x2::sui::SUI',
        symbol: 'SUI',
        stakedAmount: '0',
        rewards: '0',
        apy: validator.apy,
        stakeStartTimestamp: 0,
        validatorAddress: validator.address,
        validatorName: validator.name,
      }));
    } catch (error) {
      console.error('Failed to get staking pools:', error);
      return [];
    }
  }

  /**
   * Stake SUI to a validator
   */
  async stake(
    _coinType: string,
    amount: number,
    validatorAddress: string,
    keypair: Ed25519Keypair
  ): Promise<string> {
    try {
      const client = suiClientManager.getClient();
      
      // Create transaction
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [amount * 1_000_000_000]); // Convert SUI to MIST
      
      tx.moveCall({
        target: '0x3::sui_system::request_add_stake',
        arguments: [coin, tx.pure.address(validatorAddress)],
      });

      // Sign and execute transaction
      const result = await client.signAndExecuteTransaction({
        signer: keypair as any,
        transaction: tx,
      });

      return result.digest;
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  /**
   * Request unstake
   */
  async unstake(
    stakeId: string,
    _amount: number,
    keypair: Ed25519Keypair
  ): Promise<string> {
    try {
      const client = suiClientManager.getClient();
      
      // Create transaction to request withdraw
      const tx = new Transaction();
      
      tx.moveCall({
        target: '0x3::sui_system::request_withdraw_stake',
        arguments: [tx.object(stakeId)],
      });

      // Sign and execute transaction
      const result = await client.signAndExecuteTransaction({
        signer: keypair as any,
        transaction: tx,
      });

      return result.digest;
    } catch (error) {
      console.error('Unstaking failed:', error);
      throw error;
    }
  }

  /**
   * Claim rewards by unstaking and restaking
   */
  async claimRewards(
    stakeId: string,
    keypair: Ed25519Keypair,
    validatorAddress: string
  ): Promise<string> {
    try {
      const client = suiClientManager.getClient();
      
      // Create transaction to withdraw and restake
      const tx = new Transaction();
      
      // Withdraw staked SUI
      const [withdrawnCoin] = tx.moveCall({
        target: '0x3::sui_system::request_withdraw_stake',
        arguments: [tx.object(stakeId)],
      });

      // Restake with rewards
      tx.moveCall({
        target: '0x3::sui_system::request_add_stake',
        arguments: [withdrawnCoin, tx.pure.address(validatorAddress)],
      });

      // Sign and execute transaction
      const result = await client.signAndExecuteTransaction({
        signer: keypair as any,
        transaction: tx,
      });

      return result.digest;
    } catch (error) {
      console.error('Claiming rewards failed:', error);
      throw error;
    }
  }

  /**
   * Format MIST to SUI
   */
  private formatMist(mist: bigint): string {
    return (Number(mist) / 1_000_000_000).toFixed(4);
  }
}

export const stakingService = StakingService.getInstance();

