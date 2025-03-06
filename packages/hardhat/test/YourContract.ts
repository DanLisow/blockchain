import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YourContract", function () {
  let yourContract: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const YourContract = await ethers.getContractFactory("YourContract");
    yourContract = await YourContract.deploy();
    await yourContract.waitForDeployment();
  });

  it("Should set the correct owner", async function () {
    expect(await yourContract.owner()).to.equal(owner.address);
  });

  it("Should allow the owner to add candidates", async function () {
    await yourContract.addCandidate("Candidate 1");

    const candidate = await yourContract.getCandidate(0);

    expect(candidate[0]).to.equal("Candidate 1");
    expect(candidate[1]).to.equal(0);
  });

  it("Should revert if a non-owner tries to add a candidate", async function () {
    await expect(yourContract.connect(addr1).addCandidate("Not allowed")).to.be.revertedWith(
      "Only owner can call this function.",
    );
  });

  it("Should allow a user to vote for a valid candidate", async function () {
    await yourContract.addCandidate("Candidate A");
    await yourContract.addCandidate("Candidate B");

    // Адрес addr1 голосует за кандидата 0
    await yourContract.connect(addr1).vote(0);

    // Проверяем, что у кандидата 0 теперь 1 голос
    const candidate0 = await yourContract.getCandidate(0);
    expect(candidate0[1]).to.equal(1);

    // Проверяем, что addr1 помечен как проголосовавший
    expect(await yourContract.hasVoted(addr1.address)).to.equal(true);
  });

  it("Should revert if a user tries to vote twice", async function () {
    await yourContract.addCandidate("Candidate A");
    // Адрес addr1 голосует
    await yourContract.connect(addr1).vote(0);

    await expect(yourContract.connect(addr1).vote(0)).to.be.revertedWith("You have already voted.");
  });

  it("Should revert if candidate index is invalid", async function () {
    await expect(yourContract.connect(addr1).vote(0)).to.be.revertedWith("Invalid candidate index.");
  });

  it("Should correctly determine the winner", async function () {
    // Добавляем двух кандидатов
    await yourContract.addCandidate("Candidate A");
    await yourContract.addCandidate("Candidate B");

    // addr1 и addr2 голосуют за "Candidate A" (индекс 0)
    await yourContract.connect(addr1).vote(0);
    await yourContract.connect(addr2).vote(0);

    // owner голосует за "Candidate B" (индекс 1)
    await yourContract.vote(1);

    // Получаем победителя
    const [winnerName, winnerVoteCount] = await yourContract.getWinner();

    expect(winnerName).to.equal("Candidate A");
    expect(winnerVoteCount).to.equal(2); // У А – 2 голоса
  });
});
