import { useContractFunction, useEthers } from "@usedapp/core";
import React, { useCallback, useMemo, useState } from "react";
import { utils, BigNumber, Contract } from "ethers";
import { toast } from "react-toastify";
import { Button } from "reactstrap";
import { LogDescription } from "ethers/lib/utils";

function serialize(obj: {
  timeoutTime: number;
  tokenAddress: string;
  coins: BigNumber;
  size: number;
}) {
  const timeoutTimeBytes = utils.hexZeroPad(utils.hexlify(obj.timeoutTime),  2);
  const tokenAddressBytes = utils.arrayify(obj.tokenAddress);
  const coinsBytes = utils.hexZeroPad(BigNumber.from(obj.coins).toHexString(),  32);
  const sizeBytes = utils.hexZeroPad(utils.hexlify(obj.size), 1);

  return utils.concat([timeoutTimeBytes, tokenAddressBytes, coinsBytes, sizeBytes]);
}

const FactoryAbi = [
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "createGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "game",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "GameCreated",
    "type": "event"
  },
];

export const CreateGameButton = (props: {
  callback: (event: LogDescription) => void;
  values: {
    timeout: string;
    tokenAddress: string;
    amount: string;
    size: string;
  };
  amountBN: BigNumber;
  disabled: boolean;
  contractAddress: string;
}) => {
  const { callback, values, disabled, amountBN, contractAddress } = props;
  const { library, account, chainId } = useEthers();
  const contract = new Contract(contractAddress, FactoryAbi);
  const { state, send, events } = useContractFunction(contract, "createGame");
  const [attems, setAttems] = useState<number>(0);

  useMemo(() => {
    if (state.status == "Exception")
      if (state.errorMessage)
        toast.error(state.errorMessage);
    if (state.status == "Success" && events) {
      toast.success("Game successfully created!");
      const event = events.find((event)=>event.name=='GameCreated');
      if(event)
        callback(event);
    }
  }, [state.status, attems, events]);

  console.log('state', state);
  const createGame = useCallback(
    async (...args: any[]) => {
      const bytes = serialize({
        timeoutTime: parseInt(values.timeout),
        tokenAddress: values.tokenAddress,
        coins: amountBN,
        size: parseInt(values.size)
      });
      await send(bytes);
    },
    [library, values, amountBN, state.status, attems, events],
  );

  if (state.status == "Success") {
    return <Button color="primary" size={"lg"} block className="mr-1" disabled={true}>Finished</Button>;
  }

  return <Button
    color="primary" size={"lg"} block className="mr-1"
    disabled={state.status == "Mining" || disabled} onClick={createGame}>
    {state.status == "Mining" ? "Mining..." : "Confirm"}
  </Button>;
};
