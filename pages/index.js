import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Artifacts from "../artifacts/contracts/Lottery.sol/Lottery.json";
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const Main = () => {
  const [signer, setSigner] = useState(null);
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
    firstFunc();
    checkMetamaskStatus();
  }, []);

  // for updating contract info-
  useEffect(() => {
    getContractData(signer);
    listenToEvents();
  }, [signer, currentAccount, contract, load]);

  const firstFunc = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const _signer = await provider.getSigner();
    const _currentNetworkId = window.ethereum.networkVersion;
    setCurrentNetworkId(_currentNetworkId);
    setSigner(_signer);
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      setCurrentAccount(accounts[0]);
      setMetamaskConnected(true);
    } else {
      setMetamaskConnected(false);
    }
    await initialiseContract(_signer);
  };

  const checkMetamaskStatus = () => {
    const accountChanged = (accounts) => {
      setCurrentAccount(accounts[0]);
      console.log(accounts[0], "account changed");
      if (!accounts.length) {
        setMetamaskConnected(false);
      }
    };
    const disconnectAccount = () => {
      setCurrentAccount("");
      console.log("disconnected account");
      setMetamaskConnected(false);
    };
    const connected = async () => {
      const changedAccounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(changedAccounts[0]);
      console.log("connected");
      setMetamaskConnected(true);
    };
    const chainChainged = (chain) => {
      const _currentNetworkId = parseInt(chain, 16);
      setCurrentNetworkId(_currentNetworkId);
    };
    window.ethereum.on("disconnect", disconnectAccount);
    window.ethereum.on("accountsChanged", accountChanged);
    window.ethereum.on("connect", connected);
    window.ethereum.on("chainChanged", chainChainged);
    return () => {
      window.ethereum.off("disconnect", disconnectAccount);
      window.ethereum.off("accountsChanged", accountChanged);
      window.ethereum.off("connect", connected);
      window.ethereum.off("chainChanged", chainChainged);
    };
  };

  const connectMetamask = async () => {
    await window.ethereum
      .request({ method: "eth_requestAccounts" })
      .then((_) => setMetamaskConnected(true))
      .catch((err) => {
        console.log(err);
        setMetamaskConnected(false);
      });
  };

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

  const initialiseContract = async (_signer) => {
    const _contract = new ethers.Contract(
      contractAddress,
      Artifacts.abi,
      _signer
    );
    setContract(_contract);
    getContractData();
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

  const listenToEvents = async () => {
    const winnerDeclaration = (winner, amount, msg) => {
      alert(
        `${winner} is the winner, ${amount} has been send to their account !!`
      );
    };

    const donatedAmount = (from, amount, msg) => {
      alert(`${from} donated ${amount} !!`);
    };

    if (contract) {
      contract.on("WinnerDeclaration", winnerDeclaration);
      contract.on("DonationSuccessful", donatedAmount);

      return () => {
        contract.off("WinnerDeclaration", winnerDeclaration);
        contract.off("DonationSuccessful", donatedAmount);
      };
    }
  };

  return (
    <div>
      <button onClick={connectMetamask}>Connect Metamask</button>
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
