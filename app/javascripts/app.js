// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

import "bootstrap/dist/css/bootstrap.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import myWallet_artifacts from '../../build/contracts/MyWallet.json'

// MyWallet is our usable abstraction, which we'll use through the code below.
var MyWallet = contract(myWallet_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    MyWallet.setProvider(web3.currentProvider);

    // dirty hack for web3@1.0.0 support for localhost testrpc
    // see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
    if (typeof MyWallet.currentProvider.sendAsync !== "function") {
      MyWallet.currentProvider.sendAsync = function() {
        return MyWallet.currentProvider.send.apply(MyWallet.currentProvider, arguments);
      };
    }

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      // show all addresses given by testrpc
      document.getElementById("addresses").innerHTML = accounts.join("<br>");

      App.basicInfoUpdate();
      // App.listenToEventsPolling();
      App.listenToEventAndPrintIt();

    });
  },

  basicInfoUpdate: function() {
    MyWallet.deployed().then(function(instance){
      document.getElementById("walletAddress").innerHTML = instance.address;
      web3.eth.getBalance(instance.address).then(function(result){
        document.getElementById("walletEther").innerHTML   = web3.utils.fromWei( result, "ether");
      });
    });
  },

  submitEtherToWallet: function() {
    MyWallet.deployed().then(function(instance){
      // using `return` is a must - otherwise, you can't use the promise's `then()` on the next line
      return instance.sendTransaction({from: account, to: instance.address, value: web3.utils.toWei(1, 'ether')});
    }).then(function(result){
      // this callback only get called when the transaction is mined
      App.basicInfoUpdate();
      // App.listenToEventsPolling();
    });
  },

  submitTransaction: function() {
    var _to     = document.getElementById("to").value;
    var _amount = parseInt( document.getElementById("amount").value );
    var _reason = document.getElementById("reason").value;
    MyWallet.deployed().then(function(instance){
      // using `return` is a must - otherwise, you can't use the promise's `then()` on the next line
      // return instance.spendMoney(_to, web3.utils.toWei(_amount, 'finney'), _reason, {from: accounts[0], gas: 500000});

      // uncomment line below and comment line on top to test the `proposalReceived` event inside the UI
      return instance.spendMoney(_to, web3.utils.toWei(_amount, 'finney'), _reason, {from: accounts[1], gas: 500000});
    }).then(function(result){
      console.log(result);
      App.basicInfoUpdate();
    }).catch(function(err){
      console.error(err);
    });
  },

  // polling means we keep asking server `do you new events now? do you new events now?`
  // it's not like pub/sub in WebSocket
  // if you look closer at the `testrpc` window, you will notice a lot of `eth_getFilterChanges` calls
  listenToEventsPolling: function() {
    MyWallet.deployed().then(function(instance){
      instance.receivedFunds({},{fromBlock:0, toBlock:'latest'}).watch(function(_error, _event){
        // append to DOM
        console.log(_event);
        document.getElementById("fundEvents").innerHTML += JSON.stringify(_event);
      });
      instance.proposalReceived({},{fromBlock:0, toBlock:'latest'}).watch(function(_error, _event){
        // append to DOM
        document.getElementById("proposalEvents").innerHTML += JSON.stringify(_event);
      });
    });
  },

  listenToEventAndPrintIt: function() {
    MyWallet.deployed().then(function(instance){
      return instance.receivedFunds({},{fromBlock:0, toBlock:'latest'});
    })
    .then(function(result){
      return result.options.topics;
    })
    .then(function(topicArray){
      web3.eth.subscribe('logs', {fromBlock: 0, topics: []}, function(error, result){
        if (error) {
          console.log(error);
        } else {
          console.log(result);
        }
      }).on('data', function(log){
        console.log('subscribe', log);
      });
    });
  },

  confirmTransaction: function() {
    // todo
  },

};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected.");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    // window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
    window.web3 = new Web3( new Web3.providers.WebsocketProvider('ws://0.0.0.0:8546') );
  }

  App.start();
});
