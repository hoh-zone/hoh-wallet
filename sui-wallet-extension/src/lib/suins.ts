import { suiClient } from './sui';

export interface SuiNSName {
  name: string;
  address: string;
  avatar?: string;
}

export class SuiNSService {
  /**
   * 检查输入是否是 SuiNS 域名格式
   * 支持格式: example.sui 或 @example
   */
  isSuiNSName(input: string): boolean {
    const trimmed = input.trim();
    // 支持 example.sui 或 @example 格式
    return /^[a-zA-Z0-9-]+\.sui$/i.test(trimmed) || /^@[a-zA-Z0-9-]+$/i.test(trimmed);
  }

  /**
   * 规范化 SuiNS 域名
   * 将 @example 转换为 example.sui
   */
  normalizeName(name: string): string {
    const trimmed = name.trim().toLowerCase();
    // 如果以 @ 开头，去掉 @ 并添加 .sui 后缀
    if (trimmed.startsWith('@')) {
      return trimmed.slice(1) + '.sui';
    }
    return trimmed;
  }

  /**
   * 将 SuiNS 域名解析为地址
   */
  async resolveName(name: string): Promise<string | null> {
    try {
      // 规范化域名（处理 @ 格式）
      const normalizedName = this.normalizeName(name);
      
      const address = await suiClient.resolveNameServiceAddress({
        name: normalizedName,
      });

      return address;
    } catch (error) {
      console.error('Failed to resolve SuiNS name:', error);
      return null;
    }
  }

  /**
   * 反向解析：根据地址查找绑定的域名
   */
  async reverseLookup(address: string): Promise<SuiNSName | null> {
    try {
      const normalizedAddress = address.trim().toLowerCase();
      
      const result = await suiClient.resolveNameServiceNames({
        address: normalizedAddress,
        limit: 1,
      });

      if (result && result.data && result.data.length > 0) {
        return {
          name: result.data[0],
          address: normalizedAddress,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to reverse lookup SuiNS name:', error);
      return null;
    }
  }

  /**
   * 批量反向解析地址列表
   */
  async batchReverseLookup(addresses: string[]): Promise<Map<string, SuiNSName>> {
    const results = new Map<string, SuiNSName>();
    
    await Promise.all(
      addresses.map(async (address) => {
        const name = await this.reverseLookup(address);
        if (name) {
          results.set(address.toLowerCase(), name);
        }
      })
    );

    return results;
  }
}

export const suiNS = new SuiNSService();
