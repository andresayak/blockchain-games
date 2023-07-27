import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { Alert, Col, Row, Table } from "reactstrap";
import { ConfigType } from "../redux/reducers/systemReducer";
import { PageTitle } from "../components/PageTitle";
import { useParams } from "react-router-dom";
import { ethers } from "ethers/lib.esm";
import { Page404 } from "./errors/Page404";
import { GameWrap } from "../components/GameWrap";
import { TokenDataType } from "../types/token";
import { TokenWrap } from "../components/TokenWrap";
import {
  shortenAddress,
  useCall,
  useEthers,
} from "@usedapp/core";
import { Contract } from "@ethersproject/contracts";
import TicTacToeERC20Abi from "../contracts/game0TicTacToe/TicTacToeGame.sol/TicTacToeGame.json";
import axios from "axios";
import { toast } from "react-toastify";
import { PlayTicTacToeModal } from "../components/modals/TicTacToe/PlayTicTacToeModal";
import { CancelGameModal } from "../components/modals/CancelGameModal";
import { TimeoutGameModal } from "../components/modals/TimeoutGameModal";
import { StepTicTacToeModal } from "../components/modals/TicTacToe/StepTicTacToeModal";
import { GameDataType } from "../types/game";
import { FactoryWrap } from "../components/FactoryWrap";
import moment from "moment";
import { allowNetworks } from "../app";
import { Steps } from "../components/modals/TicTacToe/Steps";
import { WrongNetworkModal } from "../components/modals/WrongNetworkModal";
import { utils } from "ethers";

const GAME_STATUS_WAIT = 0;
const GAME_STATUS_PROGRESS = 1;
const GAME_STATUS_FINISHED = 2;
const GAME_STATUS_CANCELED = 3;

const statuses = [
  "Wait player", "Wait step", "Finished", "Canceled",
];
const sides = [
  "NONE", "Player 1", "Player 2",
];


const Timer = (props: {deadline: number, currentTime: number}) => {
  const {deadline} = props;
  const calc = () => Math.max(0, deadline - (Date.now() / 1000));
  const [diff, setDiff] = useState<number>(calc());

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(calc());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if(diff === undefined){
    return <div></div>
  }
  const formatted = moment.utc(diff*1000).format('HH:mm:ss');
  return <div>
    time left:
    <h2>{formatted}</h2>
  </div>
}

const Component = ({ configs }: { configs: ConfigType }) => {
  const { account, chainId } = useEthers();
  const { gameAddress, chainId: needChainId } = useParams();
  const [errors, setErrors] = useState<any>({});
  const [gameData, setGameData] = useState<GameDataType>();
  if (!gameAddress || !ethers.utils.isAddress(gameAddress)) {
    return <Page404 />;
  }
  const fetchData = ()=>{
    axios.get("/api/explore/" + chainId + "/details/" + gameAddress).then(({ data }: {
      data: { game: GameDataType }
    }) => {
      console.log('set', data.game, chainId);
      setGameData(data.game);
    }).catch((reason) => {
      toast.error(reason.message);
    });
  };

  useEffect(() => {
    const sse = new EventSource('/api/explore/'+chainId+'/sse',
      { withCredentials: true });
    function getRealtimeData(data:any) {
      console.log('data', data);
      // process the data here,
      // then pass it to state to be rendered
    }
    sse.onmessage = e => getRealtimeData(JSON.parse(e.data));
    sse.onerror = () => {
      // error log here

      sse.close();
    }
    return () => {
      sse.close();
    };
  }, [chainId, gameAddress]);

  const result = useCall(gameAddress && {
    contract: new Contract(gameAddress, TicTacToeERC20Abi.abi),
    method: "factory",
    args: [],
  });

  console.log('result', result?.value);

  useMemo(() => {
    if (chainId) {
      fetchData();
    }else{
      setGameData(undefined);
    }
  }, [
    account, chainId, gameAddress,
  ]);

  const chain = allowNetworks.find((chain)=>chain.chainId == chainId);
  const needChain = allowNetworks.find((chain)=>chain.chainId == Number(needChainId));
  return <>
    <div className="mt-5 py-5">
      <div className="mb-5">
        <PageTitle title={'Blockchain Game Details'}/>
        <h5>{gameAddress}</h5>
        {!!needChain && <WrongNetworkModal isOpen={(!chain || chain.chainId!==needChain.chainId)} chains={[needChain]}/>}
      </div>
      {gameData === null && result?.value && <>
        <div>
          <dl className="row">
            <dt className="col-sm-3">Status</dt>
            <dd className="col-sm-9">
              Indexing...
            </dd>
          </dl>
        </div>
      </>}
      {!!(account && chainId && chain && gameData) &&
        <>
          <div className="mb-3">
            {!!gameData.factoryAddress && <FactoryWrap
              account={account} factoryAddress={gameData.factoryAddress} errors={errors} setErrors={setErrors}
              children={(factoryData) => {
                console.log('factoryData', factoryData);

                return <GameWrap
                  errors={errors} setErrors={setErrors} gameAddress={gameData.address} children={(gameStatusData) => {
                  console.log("gameStatusData", gameStatusData);
                  const deadline = gameStatusData.lastStepTime + parseInt(gameData.params.timeoutTime);
                  return <TokenWrap
                    tokenAddress={gameData.tokenAddress} account={account} setErrors={setErrors}
                    spenderAddress={gameAddress} children={(tokenData: TokenDataType) => {
                      console.log('balance', tokenData.balance, gameData.params.coins);
                    return <Row>
                      <Col sm={6}>
                        <dl className="row">
                          <dt className="col-sm-3">Type</dt>
                          <dd className="col-sm-9">Tic Tac Toe</dd>
                        </dl>
                        <dl className="row">
                          <dt className="col-sm-3">Player1</dt>
                          <dd className="col-sm-9">
                            <a
                              href={chain ? chain.getExplorerAddressLink(gameData?.creatorAddress) : ""}>{shortenAddress(gameData.creatorAddress)}</a>
                          </dd>
                        </dl>
                        {gameStatusData?.status != GAME_STATUS_WAIT ? <>
                          <dl className="row">
                            <dt className="col-sm-3">Player2</dt>
                            <dd className="col-sm-9">
                              <a
                                href={chain ? chain.getExplorerAddressLink(gameStatusData.player2) : ""}>{shortenAddress(gameStatusData.player2)}</a>
                            </dd>
                          </dl>
                        </> : null}
                        <dl className="row">
                          <dt className="col-sm-3">Bet</dt>
                          <dd className="col-sm-9">
                            {ethers.utils.formatUnits(gameData.params.coins, tokenData.decimals)}{" "}
                            <a
                              href={chain ? chain.getExplorerAddressLink(tokenData.address) : ""}>{tokenData.name} ({tokenData.symbol})</a>
                          </dd>
                        </dl>
                        <dl className="row">
                          <dt className="col-sm-3">Timeout</dt>
                          <dd className="col-sm-9">{gameData.params.timeoutTime} sec.</dd>
                        </dl>
                        <dl className="row">
                          <dt className="col-sm-3">Size</dt>
                          <dd className="col-sm-9">{gameData.params.size} x {gameData.params.size}</dd>
                        </dl>
                      </Col>
                      <Col sm={6}>
                        <dl className="row">
                          <dt className="col-sm-3">Status</dt>
                          <dd className="col-sm-9">
                            {statuses[gameStatusData.status]}
                            {gameStatusData?.status != GAME_STATUS_WAIT ? <>{" "}
                              Player{gameStatusData?.currentTurn}
                            </> : null}
                          </dd>
                        </dl>
                        {gameStatusData.status == GAME_STATUS_WAIT ? <>
                        <span className="me-2">
                          <PlayTicTacToeModal account={account} chainId={chainId} configs={configs} game={gameData} />
                        </span>
                            {gameData?.creatorAddress == account ? <CancelGameModal gameAddress={gameAddress} /> : null}
                          </>
                          : null}
                        {gameStatusData.status == GAME_STATUS_PROGRESS?<>
                          <Timer deadline={deadline} currentTime={factoryData.currentTime}/>
                        </>:null}
                        {gameStatusData.status == GAME_STATUS_PROGRESS && deadline < factoryData.currentTime ? <>
                          {gameData?.creatorAddress == account ? <TimeoutGameModal gameAddress={gameAddress} /> : null}
                        </> : null}
                        {gameStatusData.status == GAME_STATUS_PROGRESS && deadline > factoryData.currentTime ? <>
                          <StepTicTacToeModal gameAddress={gameAddress} />
                        </>:null}
                      </Col>
                    </Row>;
                  }} />;
                }} />;
              }} />}
          </div>
          <div className="mb-3">
            <h3>Steps</h3>
            <Steps chain={chain} gameAddress={gameAddress}/>
          </div>
        </>}
    </div>
  </>;
};

const Connected = connect((store: any) => ({
  configs: store.system.configs,
}), {})(Component);

export const GamePage = (props: any) => {
  console.log("props", props);
  return <Connected {...props} />;
};
