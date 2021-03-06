// ETH/USD 1 Jul 2018 12:54 AEDT from CMC and ethgasstation.info
var ethPriceUSD = 451.71;
var defaultGasPrice = web3.toWei(17, "gwei");

// -----------------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------------
var accounts = [];
var accountNames = {};

addAccount(eth.accounts[0], "Account #0 - Miner");
addAccount(eth.accounts[1], "Account #1 - Contract Owner/Admin");
addAccount(eth.accounts[2], "Account #2 - Property Owner 1");
addAccount(eth.accounts[3], "Account #3 - Property Owner 2");
addAccount(eth.accounts[4], "Account #4 - Renter 1");
addAccount(eth.accounts[5], "Account #5 - Renter 2");
addAccount(eth.accounts[6], "Account #6 - Airdrop");
addAccount(eth.accounts[7], "Account #7 - Exchange");
addAccount(eth.accounts[8], "Account #8");
addAccount(eth.accounts[9], "Account #9");
addAccount(eth.accounts[10], "Account #10");
addAccount(eth.accounts[11], "Account #11");

var minerAccount = eth.accounts[0];
var contractOwnerAccount = eth.accounts[1];
var owner1Account = eth.accounts[2];
var owner2Account = eth.accounts[3];
var renter1Account = eth.accounts[4];
var renter2Account = eth.accounts[5];
var airdropAccount = eth.accounts[6];
var exchangeAccount = eth.accounts[7];
var account8 = eth.accounts[8];
var account9 = eth.accounts[9];
var account10 = eth.accounts[10];
var account11 = eth.accounts[11];

var baseBlock = eth.blockNumber;

function unlockAccounts(password) {
  for (var i = 0; i < eth.accounts.length && i < accounts.length; i++) {
    personal.unlockAccount(eth.accounts[i], password, 100000);
    if (i > 0 && eth.getBalance(eth.accounts[i]) == 0) {
      personal.sendTransaction({from: eth.accounts[0], to: eth.accounts[i], value: web3.toWei(1000000, "ether")});
    }
  }
  while (txpool.status.pending > 0) {
  }
  baseBlock = eth.blockNumber;
}

function addAccount(account, accountName) {
  accounts.push(account);
  accountNames[account] = accountName;
}


// -----------------------------------------------------------------------------
// Token Contract
// -----------------------------------------------------------------------------
var tokenContractAddress = null;
var tokenContractAbi = null;

function addTokenContractAddressAndAbi(address, tokenAbi) {
  tokenContractAddress = address;
  tokenContractAbi = tokenAbi;
}


// -----------------------------------------------------------------------------
// Account ETH and token balances
// -----------------------------------------------------------------------------
function printBalances() {
  var token = tokenContractAddress == null || tokenContractAbi == null ? null : web3.eth.contract(tokenContractAbi).at(tokenContractAddress);
  var decimals = token == null ? 18 : token.decimals();
  var i = 0;
  var totalTokenBalance = new BigNumber(0);
  console.log("RESULT:  # Account                                             EtherBalanceChange                          Token Name");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  accounts.forEach(function(e) {
    var etherBalanceBaseBlock = eth.getBalance(e, baseBlock);
    var etherBalance = web3.fromWei(eth.getBalance(e).minus(etherBalanceBaseBlock), "ether");
    var tokenBalance = token == null ? new BigNumber(0) : token.balanceOf(e).shift(-decimals);
    totalTokenBalance = totalTokenBalance.add(tokenBalance);
    console.log("RESULT: " + pad2(i) + " " + e  + " " + pad(etherBalance) + " " + padToken(tokenBalance, decimals) + " " + accountNames[e]);
    i++;
  });
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT:                                                                           " + padToken(totalTokenBalance, decimals) + " Total Token Balances");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT: ");
}

function pad2(s) {
  var o = s.toFixed(0);
  while (o.length < 2) {
    o = " " + o;
  }
  return o;
}

function pad(s) {
  var o = s.toFixed(18);
  while (o.length < 27) {
    o = " " + o;
  }
  return o;
}

function padToken(s, decimals) {
  var o = s.toFixed(decimals);
  var l = parseInt(decimals)+12;
  while (o.length < l) {
    o = " " + o;
  }
  return o;
}


// -----------------------------------------------------------------------------
// Transaction status
// -----------------------------------------------------------------------------
function printTxData(name, txId) {
  var tx = eth.getTransaction(txId);
  var txReceipt = eth.getTransactionReceipt(txId);
  var gasPrice = tx.gasPrice;
  var gasCostETH = tx.gasPrice.mul(txReceipt.gasUsed).div(1e18);
  var gasCostUSD = gasCostETH.mul(ethPriceUSD);
  var block = eth.getBlock(txReceipt.blockNumber);
  console.log("RESULT: " + name + " status=" + txReceipt.status + (txReceipt.status == 0 ? " Failure" : " Success") + " gas=" + tx.gas +
    " gasUsed=" + txReceipt.gasUsed + " costETH=" + gasCostETH + " costUSD=" + gasCostUSD +
    " @ ETH/USD=" + ethPriceUSD + " gasPrice=" + web3.fromWei(gasPrice, "gwei") + " gwei block=" +
    txReceipt.blockNumber + " txIx=" + tx.transactionIndex + " txId=" + txId +
    " @ " + block.timestamp + " " + new Date(block.timestamp * 1000).toUTCString());
}

function assertEtherBalance(account, expectedBalance) {
  var etherBalance = web3.fromWei(eth.getBalance(account), "ether");
  if (etherBalance == expectedBalance) {
    console.log("RESULT: OK " + account + " has expected balance " + expectedBalance);
  } else {
    console.log("RESULT: FAILURE " + account + " has balance " + etherBalance + " <> expected " + expectedBalance);
  }
}

function failIfTxStatusError(tx, msg) {
  var status = eth.getTransactionReceipt(tx).status;
  if (status == 0) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfTxStatusError(tx, msg) {
  var status = eth.getTransactionReceipt(tx).status;
  if (status == 1) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function gasEqualsGasUsed(tx) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  return (gas == gasUsed);
}

function failIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: PASS " + msg);
    return 1;
  } else {
    console.log("RESULT: FAIL " + msg);
    return 0;
  }
}

function failIfGasEqualsGasUsedOrContractAddressNull(contractAddress, tx, msg) {
  if (contractAddress == null) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    var gas = eth.getTransaction(tx).gas;
    var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
    if (gas == gasUsed) {
      console.log("RESULT: FAIL " + msg);
      return 0;
    } else {
      console.log("RESULT: PASS " + msg);
      return 1;
    }
  }
}


//-----------------------------------------------------------------------------
// Wait one block
//-----------------------------------------------------------------------------
function waitOneBlock(oldCurrentBlock) {
  while (eth.blockNumber <= oldCurrentBlock) {
  }
  console.log("RESULT: Waited one block");
  console.log("RESULT: ");
  return eth.blockNumber;
}


//-----------------------------------------------------------------------------
// Pause for {x} seconds
//-----------------------------------------------------------------------------
function pause(message, addSeconds) {
  var time = new Date((parseInt(new Date().getTime()/1000) + addSeconds) * 1000);
  console.log("RESULT: Pausing '" + message + "' for " + addSeconds + "s=" + time + " now=" + new Date());
  while ((new Date()).getTime() <= time.getTime()) {
  }
  console.log("RESULT: Paused '" + message + "' for " + addSeconds + "s=" + time + " now=" + new Date());
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
//Wait until some unixTime + additional seconds
//-----------------------------------------------------------------------------
function waitUntil(message, unixTime, addSeconds) {
  var t = parseInt(unixTime) + parseInt(addSeconds) + parseInt(1);
  var time = new Date(t * 1000);
  console.log("RESULT: Waiting until '" + message + "' at " + unixTime + "+" + addSeconds + "s=" + time + " now=" + new Date());
  while ((new Date()).getTime() <= time.getTime()) {
  }
  console.log("RESULT: Waited until '" + message + "' at at " + unixTime + "+" + addSeconds + "s=" + time + " now=" + new Date());
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
//Wait until some block
//-----------------------------------------------------------------------------
function waitUntilBlock(message, block, addBlocks) {
  var b = parseInt(block) + parseInt(addBlocks);
  console.log("RESULT: Waiting until '" + message + "' #" + block + "+" + addBlocks + "=#" + b + " currentBlock=" + eth.blockNumber);
  while (eth.blockNumber <= b) {
  }
  console.log("RESULT: Waited until '" + message + "' #" + block + "+" + addBlocks + "=#" + b + " currentBlock=" + eth.blockNumber);
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
// Token Contract
//-----------------------------------------------------------------------------
var tokenFromBlock = 0;
function printTokenContractDetails() {
  console.log("RESULT: tokenContractAddress=" + tokenContractAddress);
  if (tokenContractAddress != null && tokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    var decimals = contract.decimals();
    console.log("RESULT: token.owner=" + contract.owner());
    console.log("RESULT: token.newOwner=" + contract.newOwner());
    console.log("RESULT: token.symbol=" + contract.symbol());
    console.log("RESULT: token.name=" + contract.name());
    console.log("RESULT: token.decimals=" + decimals);
    console.log("RESULT: token.totalSupply=" + contract.totalSupply().shift(-decimals));
    // console.log("RESULT: token.transferable=" + contract.transferable());
    // console.log("RESULT: token.mintable=" + contract.mintable());
    // console.log("RESULT: token.minter=" + contract.minter());

    var latestBlock = eth.blockNumber;
    var i;

    var approvalEvents = contract.Approval({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvents.watch(function (error, result) {
      console.log("RESULT: Approval " + i++ + " #" + result.blockNumber + " owner=" + result.args.owner +
        " spender=" + result.args.spender + " tokens=" + result.args.tokens.shift(-decimals));
    });
    approvalEvents.stopWatching();

    var transferEvents = contract.Transfer({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvents.watch(function (error, result) {
      console.log("RESULT: Transfer " + i++ + " #" + result.blockNumber + ": from=" + result.args.from + " to=" + result.args.to +
        " tokens=" + result.args.tokens.shift(-decimals));
    });
    transferEvents.stopWatching();

    tokenFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// Club Contract
// -----------------------------------------------------------------------------
var clubContractAddress = null;
var clubContractAbi = null;

function addClubContractAddressAndAbi(address, clubAbi) {
  clubContractAddress = address;
  clubContractAbi = clubAbi;
}

function displaySplit(data) {
  var eth1 = data[0];
  var eth2 = data[1];
  var eth3 = data[2];
  var refund = data[3];
  var total = eth1.add(eth2).add(eth3).add(refund);
  return "[eth1=" + eth1.shift(-18) + "; eth2=" + eth2.shift(-18) + "; eth3=" + eth3.shift(-18) + "; refund=" + refund.shift(-18)  + "; total=" + total.shift(-18) + "]";
}

var clubFromBlock = 0;
function printClubContractDetails() {
  console.log("RESULT: clubContractAddress=" + clubContractAddress);
  if (clubContractAddress != null && clubContractAbi != null) {
    var contract = eth.contract(clubContractAbi).at(clubContractAddress);
    console.log("RESULT: club.token=" + contract.token());
    console.log("RESULT: club.initialised=" + contract.initialised());
    console.log("RESULT: club.numberOfMembers=" + contract.numberOfMembers());
    console.log("RESULT: club.getMembers=" + JSON.stringify(contract.getMembers()));
    var i;
    for (i = 0; i < contract.numberOfMembers(); i++) {
      var member = contract.getMemberByIndex(i);
      var data = contract.getMemberData(member);
      console.log("RESULT: club.member[" + i + "]=" + member + " [" + data[0] + ", " + data[1] + ", '" + data[2] + "']");
    }
    console.log("RESULT: club.numberOfProposals=" + contract.numberOfProposals());
    for (i = 0; i < contract.numberOfProposals(); i++) {
      console.log("RESULT: club.getProposal[" + i + "]=" + JSON.stringify(contract.getProposal(i)));
    }
    console.log("RESULT: club.quorum=" + contract.quorum() + "%");
    console.log("RESULT: club.quorumDecayPerWeek=" + contract.quorumDecayPerWeek() + "%");
    console.log("RESULT: club.requiredMajority=" + contract.requiredMajority() + "%");

    var now = new Date()/1000;
    var line = "";
    for (i = 0; i < 10; i++) {
      var date = parseInt(now) + 60 * 60 * 24 * 7 * i;
      line = line + i + "w=" + contract.getQuorum(now, date) + "% ";
    }
    console.log("RESULT: club.getQuorum(now, * weeks)=" + line);

    var latestBlock = eth.blockNumber;

    var newProposalEvents = contract.NewProposal({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    newProposalEvents.watch(function (error, result) {
      console.log("RESULT: NewProposal " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
      var proposal = contract.getProposal(result.args.proposalId);
      console.log("RESULT: - proposal=" + JSON.stringify(proposal));
    });
    newProposalEvents.stopWatching();

    var votedEvents = contract.Voted({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    votedEvents.watch(function (error, result) {
      console.log("RESULT: Voted " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    votedEvents.stopWatching();

    var voteResultEvents = contract.VoteResult({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    voteResultEvents.watch(function (error, result) {
      console.log("RESULT: VoteResult " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    voteResultEvents.stopWatching();

    var memberAddedEvents = contract.MemberAdded({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    memberAddedEvents.watch(function (error, result) {
      console.log("RESULT: MemberAdded " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    memberAddedEvents.stopWatching();

    var memberRemovedEvents = contract.MemberRemoved({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    memberRemovedEvents.watch(function (error, result) {
      console.log("RESULT: MemberRemoved " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    memberRemovedEvents.stopWatching();

    var memberNameUpdatedEvents = contract.MemberNameUpdated({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    memberNameUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: MemberNameUpdated " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    memberNameUpdatedEvents.stopWatching();

    var tokenUpdatedEvents = contract.TokenUpdated({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    tokenUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: TokenUpdated " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    tokenUpdatedEvents.stopWatching();

    var tokensForNewMembersUpdatedEvents = contract.TokensForNewMembersUpdated({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    tokensForNewMembersUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: TokensForNewMembersUpdated " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    tokensForNewMembersUpdatedEvents.stopWatching();

    var etherDepositedEvents = contract.EtherDeposited({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    etherDepositedEvents.watch(function (error, result) {
      console.log("RESULT: EtherDeposited " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    etherDepositedEvents.stopWatching();

    var etherTransferredEvents = contract.EtherTransferred({}, { fromBlock: clubFromBlock, toBlock: latestBlock });
    i = 0;
    etherTransferredEvents.watch(function (error, result) {
      console.log("RESULT: EtherTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    etherTransferredEvents.stopWatching();

    clubFromBlock = latestBlock + 1;
  }
}

function getVotingStatus() {
  console.log("RESULT: Votes open = " + club.getVotingStatus(1)[0] +
    " | Quorum reached = " + club.getVotingStatus(1)[1] +
    " | Required majority = " + club.getVotingStatus(1)[2] +
    " | Yes percent = " + club.getVotingStatus(1)[3]);
    // " | Total yes votes required = " + club.getVotingStatus(1)[4] +
    // " | Yes votes = " + club.getVotingStatus(1)[5]);
}

// -----------------------------------------------------------------------------
// ClubFactory Contract
// -----------------------------------------------------------------------------
var clubFactoryContractAddress = null;
var clubFactoryContractAbi = null;

function addClubFactoryContractAddressAndAbi(address, clubFactoryAbi) {
  clubFactoryContractAddress = address;
  clubFactoryContractAbi = clubFactoryAbi;
}

var clubFactoryFromBlock = 0;

function getClubAndTokenListing() {
  var clubs = [];
  var tokens = [];
  console.log("RESULT: clubFactoryContractAddress=" + clubFactoryContractAddress);
  if (clubFactoryContractAddress != null && clubFactoryContractAbi != null) {
    var contract = eth.contract(clubFactoryContractAbi).at(clubFactoryContractAddress);

    var latestBlock = eth.blockNumber;
    var i;

    var clubListingEvents = contract.ClubEthListing({}, { fromBlock: clubFactoryFromBlock, toBlock: latestBlock });
    i = 0;
    clubListingEvents.watch(function (error, result) {
      console.log("RESULT: get ClubEthListing " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
      clubs.push(result.args.clubAddress);
      tokens.push(result.args.tokenAddress);
    });
    clubListingEvents.stopWatching();
  }
  return [clubs, tokens];
}

function printClubFactoryContractDetails() {
  console.log("RESULT: clubFactoryContractAddress=" + clubFactoryContractAddress);
  if (clubFactoryContractAddress != null && clubFactoryContractAbi != null) {
    var contract = eth.contract(clubFactoryContractAbi).at(clubFactoryContractAddress);
    console.log("RESULT: clubFactory.owner=" + contract.owner());
    console.log("RESULT: clubFactory.newOwner=" + contract.newOwner());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: clubFactoryFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var clubEthListingEvents = contract.ClubEthListing({}, { fromBlock: clubFactoryFromBlock, toBlock: latestBlock });
    i = 0;
    clubEthListingEvents.watch(function (error, result) {
      console.log("RESULT: ClubEthListing " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    clubEthListingEvents.stopWatching();

    clubFactoryFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// Generate Summary JSON
// -----------------------------------------------------------------------------
function generateSummaryJSON() {
  console.log("JSONSUMMARY: {");
  if (crowdsaleContractAddress != null && crowdsaleContractAbi != null) {
    var contract = eth.contract(crowdsaleContractAbi).at(crowdsaleContractAddress);
    var blockNumber = eth.blockNumber;
    var timestamp = eth.getBlock(blockNumber).timestamp;
    console.log("JSONSUMMARY:   \"blockNumber\": " + blockNumber + ",");
    console.log("JSONSUMMARY:   \"blockTimestamp\": " + timestamp + ",");
    console.log("JSONSUMMARY:   \"blockTimestampString\": \"" + new Date(timestamp * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleContractAddress\": \"" + crowdsaleContractAddress + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleContractOwnerAddress\": \"" + contract.owner() + "\",");
    console.log("JSONSUMMARY:   \"tokenContractAddress\": \"" + contract.bttsToken() + "\",");
    console.log("JSONSUMMARY:   \"tokenContractDecimals\": " + contract.TOKEN_DECIMALS() + ",");
    console.log("JSONSUMMARY:   \"crowdsaleWalletAddress\": \"" + contract.wallet() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleTeamWalletAddress\": \"" + contract.teamWallet() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleTeamPercent\": " + contract.TEAM_PERCENT_GZE() + ",");
    console.log("JSONSUMMARY:   \"bonusListContractAddress\": \"" + contract.bonusList() + "\",");
    console.log("JSONSUMMARY:   \"tier1Bonus\": " + contract.TIER1_BONUS() + ",");
    console.log("JSONSUMMARY:   \"tier2Bonus\": " + contract.TIER2_BONUS() + ",");
    console.log("JSONSUMMARY:   \"tier3Bonus\": " + contract.TIER3_BONUS() + ",");
    var startDate = contract.START_DATE();
    // BK TODO - Remove for production
    startDate = 1512921600;
    var endDate = contract.endDate();
    // BK TODO - Remove for production
    endDate = 1513872000;
    console.log("JSONSUMMARY:   \"crowdsaleStart\": " + startDate + ",");
    console.log("JSONSUMMARY:   \"crowdsaleStartString\": \"" + new Date(startDate * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleEnd\": " + endDate + ",");
    console.log("JSONSUMMARY:   \"crowdsaleEndString\": \"" + new Date(endDate * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"usdPerEther\": " + contract.usdPerKEther().shift(-3) + ",");
    console.log("JSONSUMMARY:   \"usdPerGze\": " + contract.USD_CENT_PER_GZE().shift(-2) + ",");
    console.log("JSONSUMMARY:   \"gzePerEth\": " + contract.gzePerEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"capInUsd\": " + contract.CAP_USD() + ",");
    console.log("JSONSUMMARY:   \"capInEth\": " + contract.capEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"minimumContributionEth\": " + contract.MIN_CONTRIBUTION_ETH().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"contributedEth\": " + contract.contributedEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"contributedUsd\": " + contract.contributedUsd() + ",");
    console.log("JSONSUMMARY:   \"generatedGze\": " + contract.generatedGze().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"lockedAccountThresholdUsd\": " + contract.lockedAccountThresholdUsd() + ",");
    console.log("JSONSUMMARY:   \"lockedAccountThresholdEth\": " + contract.lockedAccountThresholdEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"precommitmentAdjusted\": " + contract.precommitmentAdjusted() + ",");
    console.log("JSONSUMMARY:   \"finalised\": " + contract.finalised());
  }
  console.log("JSONSUMMARY: }");
}

// -----------------------------------------------------------------------------
// Hashing functions
// -----------------------------------------------------------------------------
function padLeft0(s, n) {
  var result = s.toString();
  while (result.length < n) {
    result = "0" + result;
  }
  return result;
}

function bytes4ToHex(bytes4) {
  if (bytes4.substring(0, 2) == "0x") {
    return padLeft0(bytes4.substring(2, 10), 8);
  } else {
    return padLeft0(bytes4.substring(0, 8), 8);
  }
}

function addressToHex(address) {
  if (address.substring(0, 2) == "0x") {
    return padLeft0(address.substring(2, 42).toLowerCase(), 40);
  } else {
    return padLeft0(address.substring(0, 40).toLowerCase(), 40);
  }
}

function uint256ToHex(number) {
  var bigNumber = new BigNumber(number).toString(16);
  if (bigNumber.substring(0, 2) == "0x") {
    return padLeft0(bigNumber.substring(2, 66).toLowerCase(), 64);
  } else {
    return padLeft0(bigNumber.substring(0, 64).toLowerCase(), 64);
  }
}

function stringToHex(s) {
  return web3.toHex(s).substring(2);
}

// timestamp to string
function timestampToStr(timestamp) {
  timestamp1 = new Date(timestamp*1000);
  dateStr = timestamp1.toLocaleString();
  return dateStr;
}

function printPropertyType(n) {
    switch (parseInt(n, 10)) {
      case 0:
          propertyType = "House";
          break;
      case 1:
          propertyType = "Apartment and unit";
          break;
      case 2:
          propertyType = "Townhouse";
          break;
      case 3:
          propertyType = "Villa";
          break;
      case 4:
          propertyType = "Acreage";
          break;
      case 5:
          propertyType = "Block of units";
          break;
      case 6:
          propertyType = "Retirement living";
    }
    return propertyType;
}

function hexToInt(hash) {
    return new BigNumber(hash.substring(2), 16)
}


// -----------------------------------------------------------------------------
// Uhood Contract
// -----------------------------------------------------------------------------
var propertyTokenAddress = null;
var propertyTokenAbi = null;
var uhoodFromBlock = 0;
var decimals = 18;

function printPropertyTokenContractDetails() {
  // console.log("RESULT: uhoodAddress=" + uhoodAddress);
  if (propertyTokenAddress != null && propertyTokenAbi != null) {
    var uhood = eth.contract(propertyTokenAbi).at(propertyTokenAddress);
    // console.log("RESULT: uhood.tokensToAddNewProperties=" + uhood.tokensToAddNewProperties());
    // console.log("RESULT: uhood.tokenAddress=" + uhood.tokenAddress());
    var i;
    for (i = 0; i < propertyToken.numberOfProperties(); i++) {
      var property = propertyToken.getPropertyByIndex(i);
      var data = propertyToken.getPropertyData(property);
      console.log("RESULT: propertyToken.properties[" + i + "]=" + property + " owned by: " + propertyToken.ownerOf(hexToInt(property)) + " [" + data[0] + ", "  + data[1] + ", '" +
        data[2] + "', '" + data[3] + "', '" + printPropertyType(data[4]) + "', " + data[5] + ", " + data[6] + ", " + data[7] + ", '" +
        data[8]  + "', '" + timestampToStr(data[9])  + "', " + data[10].shift(-decimals) + ", " + data[11] + "]");        
    }

    var latestBlock = eth.blockNumber;

    // var newPropertyEvents = uhood.PropertyAdded({}, { fromBlock: uhoodFromBlock, toBlock: latestBlock });
    // i = 0;
    // newPropertyEvents.watch(function (error, result) {
    //   console.log("RESULT: PropertyAdded " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    //   var property = uhood.getPropertyData(result.args., );
    //   console.log("RESULT: - proposal=" + JSON.stringify(proposal));
    // });
    // newProposalEvents.stopWatching();
    // clubFromBlock = latestBlock + 1;
  }
}

function getBalanceOfRental(account, tokenId, start, end) {
  var rentalTokenCount = 0;
  var minRentTime = 1*24*60*60;
  for (var time = start; time < end; time = time + minRentTime) {
    if (propertyToken.ownerOfRental(tokenId, time) == account) {
      rentalTokenCount++;
    }
  }
  return rentalTokenCount;
}

function getBalanceOfRentalApproval(account, tokenId, start, end) {
  var rentalTokenApprovalCount = 0;
  var minRentTime = 1*24*60*60;
  for (var time = start; time < end; time = time + minRentTime) {
    if (propertyToken.approvedOfRental(tokenId, time) == account) {
      rentalTokenApprovalCount++;
    }
  }
  return rentalTokenApprovalCount;
}
