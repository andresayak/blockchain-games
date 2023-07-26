import { Chain, shortenTransactionHash, useLogs } from "@usedapp/core";
import { Table } from "reactstrap";
import React from "react";
import { Contract } from "@ethersproject/contracts";
import TicTacToeERC20Abi from "../../../contracts/TicTacToeERC20.sol/TicTacToeERC20.json";

type PropType = {
  gameAddress: string;
  chain: Chain | undefined;
}
export const Steps = (props: PropType) => {
  const {gameAddress, chain} = props;

  return null;/*
  const logs = useLogs({
    contract: new Contract(gameAddress, TicTacToeERC20Abi.abi),
    event: "GameStep",
    args: [],
  });

  return <Table>
    <thead>
    <tr>
      <th>
        Block
      </th>
      <th>
        Tx
      </th>
      <th>
        Side
      </th>
      <th>
        Cell
      </th>
    </tr>
    </thead>
    <tbody>
    {logs && logs.value && logs.value.map((log, index) => <tr key={index}>
      <td>
        {log.blockNumber}
      </td>
      <td>
        <a
          href={chain ? chain.getExplorerTransactionLink(log.transactionHash) : ""}>{shortenTransactionHash(log.transactionHash)}</a>
      </td>
      <td>
        Player{log.data.side}
      </td>
      <td>
        {log.data.row} x {log.data.col}
      </td>
    </tr>)}
    </tbody>
  </Table>;*/
}
