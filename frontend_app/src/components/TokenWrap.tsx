import React from "react";
import { Contract, utils } from "ethers";
import { useCalls, useContractCalls } from "@usedapp/core";
import ERC20 from "../contracts/ERC20.sol/ERC20.json";
import { TokenDataType } from "../types/token";

export const TokenWrap = (props: {
  children: (tokenData: TokenDataType) => React.ReactElement
  setErrors?: (errors: any) => void;
  account: string; tokenAddress: string;
  spenderAddress: string
}) => {
  const { spenderAddress, account, children, tokenAddress, setErrors } = props;
  try {
    const contract = new Contract(tokenAddress, ERC20.abi);
    const result = useCalls([{
      contract: new Contract(tokenAddress, ERC20.abi),
      method: "balanceOf",
      args: [account],
    }, {
      contract,
      method: "decimals",
      args: [],
    }, {
      contract,
      method: "symbol",
      args: [],
    }, {
      contract,
      method: "allowance",
      args: [account, spenderAddress],
    }, {
      contract,
      method: "name",
      args: [],
    }]) ?? [];
    if (result && result.every((item) => item && !item.error)
    ) {
      const [
        tokenBalanceBN, tokenDecimals, tokenSymbol,
        tokenAllowanceBN, name,
      ] = result.map((item) => item ? item.value[0] : undefined);
      return children({
        address: tokenAddress,
        balance: utils.formatUnits(tokenBalanceBN, tokenDecimals),
        decimals: tokenDecimals,
        symbol: tokenSymbol,
        allowanceBN: tokenAllowanceBN,
        name,
      });
    }
  } catch (e) {
    console.log("TokenWrap ERROR", e);
    if (setErrors) {
      if (e && e.toString().match(/call revert exception/)) {
        setErrors({ tokenAddress: ["Invalid token address"] });
      }
    }
  }
  return null;
};
