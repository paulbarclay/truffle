import { Web3Shim, Web3ShimOptions } from "./web3-shim";
import { BlockType } from "./interface-adapter/types";
import { Provider } from "@truffle/provider";

export interface Web3InterfaceAdapterOptions extends Web3ShimOptions {}

export class Web3InterfaceAdapter {
  public web3: Web3Shim;
  constructor(options?: Web3InterfaceAdapterOptions) {
    this.web3 = new Web3Shim(options);
  }

  public getNetworkId() {
    return this.web3.eth.net.getId();
  }

  public getBlock(block: BlockType) {
    return this.web3.eth.getBlock(block);
  }

  public setProvider(provider: Provider) {
    return this.web3.setProvider(provider);
  }

  public getTransaction(tx: string) {
    return this.web3.eth.getTransaction(tx);
  }

  public getTransactionReceipt(tx: string) {
    return this.web3.eth.getTransactionReceipt(tx);
  }

  public getBalance(address: string) {
    return this.web3.eth.getBalance(address);
  }
}
