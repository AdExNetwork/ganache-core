import EthereumJsBlock from "ethereumjs-block";
import Manager from "./manager";
import Tag from "../things/tags";
import { LevelUp } from "levelup";
import Blockchain from "../blockchain";
import {Quantity, Data} from "@ganache/utils/src/things/json-rpc";
import Transaction from "../things/transaction";
import {decode as rlpDecode} from "rlp";
import Common from "ethereumjs-common";

const EMPTY_BUFFER = Buffer.from([]);

export default class BlockManager extends Manager<Block> {
  /**
   * The earliest block
   */
  public earliest: Block;

  /**
   * The latest block
   */
  public latest: Block;

  /**
   * The next block
   */
  public pending: Block;

  constructor(blockchain: Blockchain, base: LevelUp) {
    super(blockchain, base, Block);

    blockchain.on("open", () => {
      // TODO: get the last key, set as "earliest"
      // TODO: get the first last key, set as "latest"
    });
  }

  /**
   * Gets or creates the next block (which might be the *pending* block). Uses the values in the optional `header` object to create the block
   * @param header The values to set on the block's header. These typically come from the parent block.
   */
  next(header?: {}) {
    if (!this.pending) {
      this.pending = this.createBlock(header);
    }
    return this.pending;
  }

  /**
   * Creates a Block object with the specified header values
   * @param header
   */
  createBlock(header: {}): Block {
    const block = new Block(null, this);
    // TODO: make better
    Object.assign(block.value.header, header);
    return block;
  }

  async getNumberFromHash(hash: string | Buffer | Tag): Promise<Buffer> {
    return this.base.get(Data.from(hash).toBuffer()) as Promise<Buffer>;
  }

  async getByHash(hash: string | Buffer | Tag): Promise<Block> {
    const number = await this.getNumberFromHash(hash);
    return super.get(number);
  }

  async getRaw(tagOrBlockNumber: string | Buffer | Tag) {
    if (typeof tagOrBlockNumber === "string") {
      const tag = Tag.normalize(tagOrBlockNumber as Tag);
      switch (tag) {
        case Tag.LATEST:
          tagOrBlockNumber = this.latest.value.header.number;
          if (tagOrBlockNumber.length === 0){
            tagOrBlockNumber = Buffer.from([0]);
          }
        case void 0:
        case null:
          // the key is probably a hex string, let nature takes its course.
          break;
        case Tag.PENDING:
          tagOrBlockNumber = this.pending.value.header.number;
        case Tag.EARLIEST:
          tagOrBlockNumber = this.earliest.value.header.number;
        default:
          // this probably can't happen. but if someone passed something like
          // `toString` in as a block tag and it got this far... maybe we'd
          // get here...
          throw new Error(`Invalid block Tag: ${tagOrBlockNumber}`);
      }
    }
    return super.getRaw(tagOrBlockNumber);
  }

  async get(tagOrBlockNumber: string | Buffer | Tag): Promise<Block> {
    if (typeof tagOrBlockNumber === "string") {
      const tag = Tag.normalize(tagOrBlockNumber as Tag);
      switch (tag) {
        case Tag.LATEST:
          return this.latest;
        case void 0:
        case null:
          // the key is probably a hex string, let nature takes its course.
          break;
        case Tag.PENDING:
          return this.pending;
        case Tag.EARLIEST:
          return this.earliest;
        default:
          // this probably can't happen. but if someone passed something like
          // `toString` in as a block tag and it got this far... maybe we'd
          // get here...
          throw new Error(`Invalid block Tag: ${tagOrBlockNumber}`);
      }
    }

    return super.get(tagOrBlockNumber);
  }

  /**
   * Writes the block object to the underlying database.
   * @param block
   */
  async putBlock(block: Block) {
    const blockValue = block.value;
    const header = blockValue.header;
    let key = header.number;
    // ensure we can store Block #0 as key "00", not ""
    if (EMPTY_BUFFER.equals(key)) {
      key = Buffer.from([0]);
    }
    const secondaryKey = header.hash();
    const value = blockValue.serialize(true);
    await Promise.all([super.set(secondaryKey, key), super.set(key, value)]);
    return block;
  }
}

export class Block {
  public readonly manager: BlockManager;
  public readonly value: EthereumJsBlock;
  constructor(raw: Buffer, manager: BlockManager) {
    const common = {common: new Common("mainnet", "istanbul")};
    if (raw) {
      const data = (rlpDecode(raw) as any) as [Buffer[], Buffer[], Buffer[]];
      this.value = new EthereumJsBlock({header: data[0], uncleHeaders: data[2]}, common);
      const rawTransactions = data[1];

      // parse transactions so we can use our own transaction class
      for (let i = 0; i < rawTransactions.length; i++) {
        const tx = new Transaction(rawTransactions[i]);
        this.value.transactions.push(tx);
      }
    } else {
      this.value = new EthereumJsBlock(null, common);
    }

    this.manager = manager;
  }

  getTxFn = (include = false): ((tx: Transaction) => {[key: string]: string} | Data) => {
    if (include) {
      return (tx: Transaction) => tx.toJSON(this);
    } else {
      return (tx: Transaction) => Data.from(tx.hash());
    }
  };

  toJSON(includeFullTransactions = false) {
    const header = this.value.header;
    return {
      number: Quantity.from(header.number),
      hash: Data.from(this.value.hash()),
      parentHash: Data.from(header.parentHash),
      mixHash: Data.from(header.mixHash),
      nonce: Data.from(header.nonce, 16),
      sha3Uncles: Data.from(header.uncleHash),
      logsBloom: Data.from(header.bloom),
      transactionsRoot: Data.from(header.transactionsTrie),
      stateRoot: Data.from(header.stateRoot),
      receiptsRoot: Data.from(header.receiptTrie),
      miner: Data.from(header.coinbase),
      difficulty: Quantity.from(header.difficulty),
      totalDifficulty: Quantity.from(header.difficulty), // TODO: Figure out what to do here.
      extraData: Data.from(header.extraData),
      size: Quantity.from(1000), // TODO: Do something better here
      gasLimit: Quantity.from(header.gasLimit),
      gasUsed: Quantity.from(header.gasUsed),
      timestamp: Quantity.from(header.timestamp),
      transactions: this.value.transactions.map(this.getTxFn(includeFullTransactions)),
      uncles: [] as string[] // this.value.uncleHeaders.map(function(uncleHash) {return to.hex(uncleHash)})
    };
  }
}
