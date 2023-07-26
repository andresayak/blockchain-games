import React from "react";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import { Chain } from "@usedapp/core";

type PropType = {
  isOpen: boolean;
  chains: Chain[];
}
export function WrongNetworkModal(props: PropType) {
  const {isOpen, chains} = props;
  const labels = chains.map(chain=>chain.chainName).join(', ');
  return (
    <div>
      <Modal isOpen={isOpen}>
        <ModalHeader>Wrong network</ModalHeader>
        <ModalBody>
          Please use {labels}.
        </ModalBody>
      </Modal>
    </div>
  );
}
