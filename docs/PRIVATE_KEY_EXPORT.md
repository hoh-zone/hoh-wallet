# 私钥导出功能说明

## 已修复：使用真实的私钥导出

### 修复内容

之前导出私钥时使用的是错误的格式转换，现在已修复为使用**真实的私钥**。

### 实现方式

```typescript
// 派生密钥对（使用与walletStore相同的方法）
const keypair = Ed25519Keypair.deriveKeypair(mnemonic, wallet.derivationPath);

// 导出真实的私钥
const secretKey = keypair.getSecretKey();
```

### 私钥格式

导出的私钥格式为：
```
suiprivkey1<base58_encoded_key>
```

例如：
```
suiprivkey1qp90pfdt0qw6lcfvvhp2zndtwhhplmqc0etsvsy03xljqqaezfc4ypkt0pd
```

### 验证

运行以下命令验证私钥导出：

```bash
cd sui-wallet-extension
node -e "
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const bip39 = require('bip39');

// 生成测试助记词
const mnemonic = bip39.generateMnemonic();

// 派生密钥
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

// 获取私钥
const secretKey = keypair.getSecretKey();
const address = keypair.getPublicKey().toSuiAddress();

console.log('Private Key:', secretKey);
console.log('Address:', address);
console.log('');
console.log('这是真实的私钥，格式为Base58编码，带suiprivkey1前缀');
"
```

### 使用说明

1. **钱包内导出**：
   - 进入"钱包管理"页面
   - 点击要导出的钱包的钥匙图标
   - 输入钱包密码
   - 复制显示的私钥

2. **导入到其他钱包**：
   - 这个私钥格式是Sui钱包的标准格式
   - 可以直接导入到Sui Wallet、Suiet、Aftermath等任何支持Sui的钱包
   - 导入后可以完全控制该地址的所有资产

3. **安全性**：
   - 私钥是控制钱包资产的唯一凭证
   - 请妥善保管，切勿泄露
   - 任何拥有此私钥的人都可以控制你的钱包

### 技术细节

- **加密算法**: Ed25519
- **派生路径**: BIP-44 (Sui: m/44'/784'/0'/0'/0')
- **私钥格式**: Base58编码，带 `suiprivkey1` 前缀
- **密钥长度**: 70个字符（Base58编码的32字节私钥）

### 与其他钱包的兼容性

此私钥格式与以下钱包兼容：
- Sui Wallet (官方钱包)
- Suiet
- Aftermath
- Poltergeist
- 其他支持Sui EVM的钱包