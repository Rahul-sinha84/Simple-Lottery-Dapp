import { useState, useEffect } from "react";
import {
  checkMetamaskStatus,
  connectMetamask,
  firstFunc,
  listenToEvents,
  contractAddress
} from "../components/configureMetamask";

const Main = () => {
  const [metamaskConnected, setMetamaskConnected] = useState(false);
  const [contractInfo, setContractInfo] = useState({
    minAmount: null,
    contractBalance: null,
    owner: "",
  });
  const [contract, setContract] = useState();
  const [amountDonated, setAmountDonated] = useState(null);
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentNetworkId, setCurrentNetworkId] = useState("");
  const [amount, setAmount] = useState("");
  const [load, setLoad] = useState(false);

  //default
  useEffect(() => {
    firstFunc(
      setContract,
      setCurrentAccount,
      setCurrentNetworkId,
      setMetamaskConnected
    );
    checkMetamaskStatus(
      setMetamaskConnected,
      setCurrentAccount,
      setCurrentNetworkId
    );
  }, []);

  // for updating contract info-
  useEffect(() => {
    getContractData();
    // for listening of events
    // listenToEvents(contract);
  }, [currentAccount, contract, load]);

  const getContractData = async () => {
    if (contract) {
      let minAmount = await contract.minAmount();
      minAmount = parseInt(minAmount._hex, 16);
      let contractBalance = await contract.contractBalance();
      contractBalance = parseInt(contractBalance._hex, 16);
      const owner = await contract.getOwner();
      const _contractInfo = { contractBalance, minAmount, owner };
      setContractInfo(_contractInfo);
      console.log(currentAccount, "current account");
      let _amountDonated = await contract.getDonatedAmount(currentAccount);
      _amountDonated = parseInt(_amountDonated._hex, 16);
      setAmountDonated(_amountDonated);
    }
  };

  const handleDonate = async () => {
    if (!amount) {
      return alert("Fill text value !!");
    }
    if (!contract) {
      return alert("Contract not connected !!");
    }
    // await window.ethereum.request({ method: "eth_requestAccounts" });
    const tx = await contract.donate(currentAccount, parseInt(amount), {
      value: amount,
    });
    await tx.wait();
    setLoad(!load);
  };

  const declareWinner = async () => {
    if (!contract) {
      return alert("Contract not connected !!");
    }

    const randomVal = Math.floor(Math.random() * 100);
    const tx = await contract.declareWinner(randomVal);
    tx.wait();
    setLoad(!load);
  };

  return (
    <div>
      <button onClick={() => connectMetamask(setMetamaskConnected)}>
        Connect Metamask
      </button>
      {`${metamaskConnected}`}
      {currentAccount}
      <br />
      {`Current network id: ${currentNetworkId}`}
      <br />
      <h3>Contract Info</h3>
      <span>Contract address: {contractAddress}</span>
      <br />
      Balance: <b>{contractInfo.contractBalance}</b>
      <br />
      Min donation amount: <b>{contractInfo.minAmount}</b>
      <br />
      Amount Donated by {currentAccount}: {amountDonated}
      <hr />
      <input
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
        }}
        type="number"
      />
      <button onClick={handleDonate}>Donate</button>
      <hr />
      {contractInfo.owner === currentAccount && (
        <button onClick={declareWinner}>Declare Winner</button>
      )}
    </div>
  );
};

export default Main;
