# staking-protocol

## contracts (Foundry)

`contracts/` 是 staking protocol 的 Solidity 子工程（单池、单 token 的最小版本骨架）。

### 目录结构

```text
contracts/
  foundry.toml
  remappings.txt
  src/
    MockERC20.sol
    StakingPool.sol
  test/
  script/
  lib/
    openzeppelin-contracts/
```

### 说明

- `MockERC20.sol`：测试代币，可同时作为 staking token 和 reward token。
- `StakingPool.sol`：第一版合约骨架，仅实现 `constructor` 与 `getUserInfo`，其余接口保留 TODO。
- OpenZeppelin 依赖通过 `contracts/lib/openzeppelin-contracts` 引入。

### Faucet（本地 demo）

为普通测试用户领取 staking token，可部署 `TokenFaucet`：

```bash
cd contracts
STAKING_TOKEN=<staking_token_address> \
forge script script/DeployFaucet.s.sol:DeployFaucet \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <deployer_private_key> \
  --broadcast
```

前端配置 `VITE_FAUCET_ADDRESS` 后，用户可点击 `Claim Faucet` 领取固定额度代币。

### 本地使用

安装 Foundry 后执行：

```bash
cd contracts
forge build
```
