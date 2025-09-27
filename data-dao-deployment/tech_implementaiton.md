# Technical Implementation

## CreateDatacoin Helper Contract

The `CreateDatacoin` contract is a lightweight helper that orchestrates creation and initial configuration of a DataCoin via the `IDataCoinFactory`. It does not itself implement token logic; instead it:

- Discovers allowed lock (collateral) tokens and their configs
- Pulls the required lock asset from the caller
- Approves and forwards it to the factory
- Triggers deterministic deployment (via salt) of a new DataCoin + associated liquidity/pool
- Stores references to the freshly created token and pool
- (Optionally) can be granted a MINTER role to mint additional supply later

### Key State

- `dataCoinFactory`: External factory implementing `createDataCoin` and config queries
- `dataCoin`: Cached interface to the newly created DataCoin (set after creation)
- `pool`: Address of the liquidity / staking / AMM pool returned by factory

### Functions

#### getApprovedLockTokenAndConfig()

Reads the list of factory-approved lock tokens and their `AssetConfig` (e.g. min lock, caps, fee params). Useful for frontends to present eligible collateral choices before creation.

#### createDataCoin()

Hard‑coded example parameters (name, symbol, allocations) showing the full flow:

1. Reads min lock amount for a chosen `lockToken`
2. Pulls `lockAmount` from `msg.sender` (caller must have approved this helper)
3. Approves the factory
4. Calls `createDataCoin(...)` on the factory with allocation basis points:
   - `creatorAllocationBps = 1000` (10% with vesting)
   - `contributorsAllocationBps = 6000` (60%)
   - `liquidityAllocationBps = 3000` (30%)
5. Factory returns `(coinAddress, poolAddress)` which are cached
6. A `salt` (timestamp + sender) enables deterministic-ish deployment pattern (CREATE2 inside factory, if implemented)

Assumptions (enforced by factory, not here):

- Sum of allocation BPS == 10000
- Lock token is whitelisted
- Min lock amount satisfied
- Vesting schedule applied to creator allocation

#### mintDataCoin(address to, uint256 amount)

Pass‑through to `dataCoin.mint`. This contract must have been granted MINTER role by the DataCoin (factory or admin flow). No access control here—intentionally simple; production usage should wrap with auth or remove this function.

### Data Monetization Flow

1. Creator selects an approved lock token (e.g. LSDC) and approves this helper for `lockAmount`
2. Calls `createDataCoin()`
3. Factory mints & allocates initial supply according to economic design:
   - Creator vested tranche (aligns long-term stewardship)
   - Contributor pool (reward oracle / curators / validators)
   - Liquidity allocation (bootstraps trading & price discovery)
4. Pool address enables:
   - Liquidity provisioning
   - Market-driven valuation of the dataset
5. Contributors earn newly minted or allocated tokens as they submit or curate data
6. Token value appreciation + secondary market liquidity = monetization path
7. Optional: Future revenue (e.g. data access fees) can be routed to pool or a rewards module and distributed to token holders / stakers.

### Security / Operational Considerations

- Hard-coded parameters: For production, expose as function inputs (name, symbol, allocations, lock token).
- No reentrancy guard: Acceptable here since only standard ERC20 calls + external factory. Ensure factory is trusted.
- `mintDataCoin` is unrestricted: Remove or gate with onlyOwner / role to prevent abuse.
- Reliance on `block.timestamp` for salt: Acceptable for uniqueness; not for randomness.
- Must verify factory implementation for:
  - Allocation correctness
  - Vesting enforcement
  - Liquidity initialization safety
  - Access control of minting / admin privileges

### Suggested Improvements

- Add events: `DataCoinCreated(creator, dataCoin, pool, lockToken, lockAmount)`
- Parameterize inputs
- Access control on mint
- Return addresses from `createDataCoin` for immediate chaining
- Add view helper for computed total initial supply & allocation breakdown

### Example Frontend Sequence (Pseudo)

1. `tokens, configs = getApprovedLockTokenAndConfig()`
2. pick `lockToken`
3. `min = factory.getMinLockAmount(lockToken)`
4. user approves `CreateDatacoin` for `min`
5. call `createDataCoin()`
6. read `dataCoin()`, `pool()`

This contract keeps creation UX minimal while delegating complex token + liquidity logic to a single audited factory.
