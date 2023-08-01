import React, { useCallback, useState } from "react";
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useEthers } from "@usedapp/core";
import { BigNumber } from "ethers";
import { ConfigType } from "../../../redux/reducers/systemReducer";
import { ApproveToken } from "../../buttons/ApproveToken";
import { CreateGameForm } from "./CreateGameForm";
import { TokenDataType } from "../../../types/token";
import { TokenWrap } from "../../TokenWrap";
import { CreateGameButton } from "../../buttons/CreateGameButton";
import { createBN } from "../../../helpers/createBN";
import { LogDescription } from "ethers/lib/utils";
import { useNavigate } from "react-router-dom";
import { TokenList } from "../../TokenList";

type PropType = {
  account: string;
  chainId: number;
  configs: ConfigType;
  children: (onClick: () => void) => React.ReactElement;
}

export function CreateTicTacToeModal(props: PropType) {
  const { configs, account, children, chainId } = props;
  const navigate = useNavigate();

  const [modal, setModal] = useState(false);
  const [allowanceBN, setAllowance] = useState<BigNumber>(BigNumber.from(0));
  const [errors, setErrors] = useState<any>({});
  const defaultValues = {
    amount: "1",
    tokenAddress: "",
    timeout: "60",
    size: "3",
    agree: false,
  };
  const [values, setValues] = useState<any>(defaultValues);
  const onChange = (col: string, value: string) => {
    setValues({ ...values, [col]: value });
    setErrors({ ...errors, [col]: undefined });
  };
  const toggle = () => {
    setModal(!modal);
    if (modal) {
      setValues(defaultValues);
    }
  };
  const updateAllowance = useCallback((value: BigNumber)=>{
    //setAllowance(value);
  }, []);
  const amountBN = createBN(values.amount, values.decimals);
  const factoryAddress = configs.FACTORY_ADDRESS_0;
  return (
    <>
      {children(toggle)}
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader>Creating a Tic Tac Toe Game</ModalHeader>
        {!factoryAddress ?
          <ModalBody><Alert color="warning">Factory address not set for this game</Alert></ModalBody>
          : null}
        {!!values.tokenAddress ? <TokenWrap
          tokenAddress={values.tokenAddress} account={account} setErrors={setErrors}
          spenderAddress={factoryAddress} children={(tokenData?: TokenDataType) => {
          const currentAllowanceBN = !tokenData || allowanceBN.gt(tokenData.allowanceBN) ? allowanceBN : tokenData.allowanceBN;
          if (!tokenData) {
            return <></>;
          }
          return <>
            <div className="border-bottom p-3">
              <div className="d-flex">
                <div className="flex-fill">
                  <div className="h4 mb-0">{tokenData.name} ({tokenData.symbol})</div>
                  <div>{tokenData.address}</div>
                </div>
                <div>
                  <a className="small" onClick={() => onChange("tokenAddress", "")}>Edit</a>
                </div>
              </div>
            </div>
            <ModalBody>
              <CreateGameForm onChange={onChange} values={values} errors={errors} tokenData={tokenData} />
            </ModalBody>
            <ModalFooter>
              {tokenData && <>
                <ApproveToken
                  disabled={!values.agree}
                  allowanceBN={currentAllowanceBN}
                  tokenAddress={values.tokenAddress}
                  spenderAddress={factoryAddress}
                  amountBN={amountBN}
                  callback={updateAllowance} />
                <CreateGameButton
                  disabled={!values.agree || currentAllowanceBN.lt(amountBN)}
                  contractAddress={factoryAddress}
                  callback={(event: LogDescription) => {
                    console.log('event', event);
                    const gameAddress = event.args.game;
                    toggle();
                    navigate("/game/" + chainId + "/" + gameAddress);
                  }}
                  amountBN={amountBN}
                  values={values} />
              </>}
              <Button color="light" onClick={toggle} block>Cancel</Button>
            </ModalFooter></>;
        }} /> : <TokenList
          account={account} chainId={chainId}
          selectToken={(tokenAddress) => onChange("tokenAddress", tokenAddress)} spenderAddress={factoryAddress} />}
      </Modal>
    </>
  );
}
