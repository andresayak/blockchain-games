import { useContractFunction, useEthers } from "@usedapp/core";
import React, { useCallback, useMemo, useState } from "react";
import { Contract } from "ethers";
import TicTacToeERC20 from "../../contracts/game0TicTacToe/TicTacToeGame.sol/TicTacToeGame.json";
import { toast } from "react-toastify";
import { Button } from "reactstrap";
import { GameDataType } from "../../types/game";

export const PlayGameButton = (props: {
  callback: () => void;
  game: GameDataType, disabled: boolean
}) => {
  const { callback, game, disabled } = props;
  const { library } = useEthers();
  const [loading, setLoading] = useState<boolean>(false);
  const contract = new Contract(game.address, TicTacToeERC20.abi);
  const { state, send, events } = useContractFunction(contract, "start");
  const [attems, setAttems] = useState<number>(0);

  useMemo(() => {
    if (state.status == "Exception")
      if (state.errorMessage)
        toast.error(state.errorMessage);
    if (state.status == "Success" && events) {
      toast.success("Game Started! ");
      callback();
    }
  }, [state.status, attems, events]);

  const createGame = useCallback(
    async (...args: any[]) => {
      await send();
    },
    [library, game, state.status, attems, events],
  );

  if (state.status == "Success") {
    return <Button color="primary" size={"lg"} block className="mr-1" disabled={true}>Finished</Button>;
  }

  return <Button
    color="primary" size={"lg"} block className="mr-1"
    disabled={state.status == "Mining" || disabled || loading} onClick={createGame}>
    {state.status == "Mining" ? "Mining..." : "Confirm"}
  </Button>;
};
