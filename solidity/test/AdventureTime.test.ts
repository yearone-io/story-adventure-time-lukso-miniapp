import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { LSP4DataKeys } from "@lukso/lsp4-contracts";
import {
  AdventureTime__factory,
  Storyline__factory,
  MockLSP26FollowerSystem__factory,
  AdventureTimeHelpers__factory,
  AdventureTime,
  Storyline,
  MockLSP26FollowerSystem,
  AdventureTimeHelpers,
} from "../typechain-types";
import ERC725, { decodeValueType, ERC725JSONSchema } from "@erc725/erc725.js";

describe("AdventureTime Contracts", function () {
  let owner: HardhatEthersSigner;
  let vibeMaster: HardhatEthersSigner;
  let contributor1: HardhatEthersSigner;
  let contributor2: HardhatEthersSigner;
  let adventureTime: AdventureTime;
  let storyline: Storyline;
  let mockLSP26: MockLSP26FollowerSystem;
  let adventureTimeHelpers: AdventureTimeHelpers;

  const NFT_PROTOCOL_NAME: string = "AdventureTime";
  const NFT_PROTOCOL_SYMBOL: string = "AT";
  const STORYLINE_NAME: string = "Epic Tale";
  const STORYLINE_SYMBOL: string = "ET";
  const METADATA_URI: string = ethers.encodeBytes32String("ipfs://metadata");
  const STARTING_PROMPT_URI: string = ethers.encodeBytes32String("ipfs://prompt");

  beforeEach(async function () {
    [owner, vibeMaster, contributor1, contributor2] = await ethers.getSigners();

    // Deploy mock LSP26FollowerSystem
    const MockLSP26Factory = (await ethers.getContractFactory(
      "MockLSP26FollowerSystem"
    )) as MockLSP26FollowerSystem__factory;
    mockLSP26 = await MockLSP26Factory.deploy();
    await mockLSP26.waitForDeployment();

    // Deploy AdventureTimeHelpers library
    const AdventureTimeHelpersFactory = (await ethers.getContractFactory(
      "AdventureTimeHelpers"
    )) as AdventureTimeHelpers__factory;
    adventureTimeHelpers = await AdventureTimeHelpersFactory.deploy();
    await adventureTimeHelpers.waitForDeployment();

    // Deploy AdventureTime with linked AdventureTimeHelpers library
    const AdventureTimeFactory = (await ethers.getContractFactory("AdventureTime", {
      libraries: {
        AdventureTimeHelpers: await adventureTimeHelpers.getAddress(),
      },
    })) as AdventureTime__factory;
    adventureTime = await AdventureTimeFactory.deploy(
      NFT_PROTOCOL_NAME,
      NFT_PROTOCOL_SYMBOL,
      owner.address
    );
    await adventureTime.waitForDeployment();

    // Deploy Storyline through AdventureTime.mint
    const tx = await adventureTime.connect(vibeMaster).mint(
      STORYLINE_NAME,
      STORYLINE_SYMBOL,
      vibeMaster.address,
      false,
      METADATA_URI,
      STARTING_PROMPT_URI,
      await mockLSP26.getAddress()
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id("StorylineCreated(string,address,address)")
    );
    const [, storylineAddress]: [string, string] = ethers.AbiCoder.defaultAbiCoder().decode(
      ["string", "address", "address"],
      event.data
    );

    // Attach to the deployed Storyline contract
    storyline = Storyline__factory.connect(storylineAddress, owner);
  });

  describe("AdventureTime", function () {
    it("should deploy with correct parameters", async function () {
      const rawName = await adventureTime.getData(LSP4DataKeys.LSP4TokenName);
      const rawSymbol = await adventureTime.getData(LSP4DataKeys.LSP4TokenSymbol);
      expect(decodeValueType("string", rawName)).to.equal(NFT_PROTOCOL_NAME);
      expect(decodeValueType("string", rawSymbol)).to.equal(NFT_PROTOCOL_SYMBOL);
      expect(await adventureTime.owner()).to.equal(owner.address);
    });

    it("should mint a new Storyline and emit StorylineCreated event", async function () {
      const tx = await adventureTime.connect(vibeMaster).mint(
        STORYLINE_NAME,
        STORYLINE_SYMBOL,
        vibeMaster.address,
        false,
        METADATA_URI,
        STARTING_PROMPT_URI,
        await mockLSP26.getAddress()
      );
      const receipt = await tx.wait();

      await expect(tx).to.emit(adventureTime, "StorylineCreated");

      const event = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("StorylineCreated(string,address,address)")
      );
      const [storyName, storylineAddress, eventVibeMaster] = ethers.AbiCoder.defaultAbiCoder().decode(
        ["string", "address", "address"],
        event.data
      );

      expect(storyName).to.equal(STORYLINE_NAME);
      expect(ethers.isAddress(storylineAddress)).to.be.true;
      expect(eventVibeMaster).to.equal(vibeMaster.address);

      const tokenIds: string[] = await adventureTime.tokenIdsOf(vibeMaster.address);
      const totalSupply: number = Number((await adventureTime.totalSupply()).toString());
      expect(tokenIds.length).to.equal(totalSupply);
      // it's 2 because we mint a storyline in the "beforeEach"
      expect(totalSupply).to.equal(2);
    });

    it("should correctly set creator metadata", async function () {
      const creatorStatus: string = await adventureTime.getData(LSP4DataKeys['LSP4CreatorsMap'] + owner.address.replace("0x", ""));
      expect(creatorStatus).to.equal("0x0000000000000000000000000000000000000000");
      const creatorsLength: string = await adventureTime.getData(LSP4DataKeys['LSP4Creators[]'].length);
      expect(creatorsLength).to.equal("0x00000000000000000000000000000001");
    });
  });

  describe("AdventureTimeHelpers", function () {
    it("should deploy a new Storyline contract", async function () {
      const tx = await adventureTime.connect(vibeMaster).mint(
        STORYLINE_NAME,
        STORYLINE_SYMBOL,
        vibeMaster.address,
        false,
        METADATA_URI,
        STARTING_PROMPT_URI,
        await mockLSP26.getAddress()
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("StorylineCreated(string,address,address)")
      );
      const [, storylineAddress]: [string, string] = ethers.AbiCoder.defaultAbiCoder().decode(
        ["string", "address", "address"],
        event.data
      );
      const deployedStoryline: Storyline = Storyline__factory.connect(storylineAddress, owner);
      const rawName = await deployedStoryline.getData(LSP4DataKeys.LSP4TokenName);
      const rawSymbol = await deployedStoryline.getData(LSP4DataKeys.LSP4TokenSymbol);

      expect(decodeValueType("string", rawName)).to.equal(STORYLINE_NAME);
      expect(decodeValueType("string", rawSymbol)).to.equal(STORYLINE_SYMBOL);
      expect(await deployedStoryline.owner()).to.equal(vibeMaster.address);
    });
  });

  describe("Storyline", function () {
    it("should deploy with correct parameters and mint initial prompt", async function () {
      const rawName = await storyline.getData(LSP4DataKeys.LSP4TokenName);
      const rawSymbol = await storyline.getData(LSP4DataKeys.LSP4TokenSymbol);
      expect(decodeValueType("string", rawName)).to.equal(STORYLINE_NAME);
      expect(decodeValueType("string", rawSymbol)).to.equal(STORYLINE_SYMBOL);
      expect(await storyline.owner()).to.equal(vibeMaster.address);
      expect(await storyline.isMintingEnabled()).to.equal(true);
      expect(await storyline.isFollowerRestrictionEnabled()).to.equal(false);
      expect(await storyline.lsp26FollowerSystem()).to.equal(await mockLSP26.getAddress());
      const tokenIds: string[] = await storyline.tokenIdsOf(vibeMaster.address);
      expect(tokenIds.length).to.equal(1);
      expect(tokenIds[0]).to.equal(ethers.toBeHex(1, 32));
    });

    it("should set owner to vibeMaster who minted the Storyline", async function () {
      expect(await storyline.owner()).to.equal(vibeMaster.address);
      // Verify vibeMaster can call onlyOwner functions
      await storyline.connect(vibeMaster).disableMinting();
      expect(await storyline.isMintingEnabled()).to.equal(false);
    });

    it("should mint new prompt when minting is enabled", async function () {
      await storyline.connect(contributor1).mint(METADATA_URI);
      const tokenIds: string[] = await storyline.tokenIdsOf(contributor1.address);
      expect(tokenIds.length).to.equal(1);
      expect(tokenIds[0]).to.equal(ethers.toBeHex(2, 32));
      const totalSupply: number = Number(await storyline.totalSupply());
      expect(totalSupply).to.equal(2);
    });

    it("should revert minting when disabled", async function () {
      await storyline.connect(vibeMaster).disableMinting();
      await expect(storyline.connect(contributor1).mint(METADATA_URI)).to.be.revertedWithCustomError(storyline, "StoryHasBeenFinalized");
    });

    it("should enforce follower restriction when enabled", async function () {
      // Deploy a new Storyline with follower restriction enabled
      const tx = await adventureTime.connect(vibeMaster).mint(
        STORYLINE_NAME,
        STORYLINE_SYMBOL,
        vibeMaster.address,
        true,
        METADATA_URI,
        STARTING_PROMPT_URI,
        await mockLSP26.getAddress()
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("StorylineCreated(string,address,address)")
      );
      const [, storylineAddress]: [string, string] = ethers.AbiCoder.defaultAbiCoder().decode(
        ["string", "address", "address"],
        event.data
      );
      const restrictedStoryline = Storyline__factory.connect(storylineAddress, owner);

      // Contributor1 is not following vibeMaster
      await expect(restrictedStoryline.connect(contributor1).mint(METADATA_URI)).to.be.revertedWithCustomError(
        restrictedStoryline,
        "ContributorNotAllowedByVibeMaster"
      );

      // Set contributor1 as following vibeMaster
      await mockLSP26.setFollowing(vibeMaster.address, contributor1.address, true);

      // Should now succeed
      await restrictedStoryline.connect(contributor1).mint(METADATA_URI);
      const tokenIds: string[] = await restrictedStoryline.tokenIdsOf(contributor1.address);
      expect(tokenIds.length).to.equal(1);
    });

    it("should allow owner to burn token", async function () {
      await storyline.connect(contributor1).mint(METADATA_URI);
      const tokenIds: string[] = await storyline.tokenIdsOf(contributor1.address);

      await storyline.connect(vibeMaster).burnToken(tokenIds[0]);
      const updatedTokenIds: string[] = await storyline.tokenIdsOf(contributor1.address);
      expect(updatedTokenIds.length).to.equal(0);
    });

    it("should revert burn attempt by non-owner", async function () {
      await storyline.connect(contributor1).mint(METADATA_URI);
      const tokenIds: string[] = await storyline.tokenIdsOf(contributor1.address);

      await expect(storyline.connect(contributor2).burnToken(tokenIds[0])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should correctly set prompt creator metadata", async function () {
      await storyline.connect(contributor1).mint(METADATA_URI);
      const tokenIds: string[] = await storyline.tokenIdsOf(contributor1.address);
      
      const creatorStatus: string = await storyline.getDataForTokenId(
        tokenIds[0],
        LSP4DataKeys['LSP4CreatorsMap'] + contributor1.address.replace("0x", "")
      );
      expect(creatorStatus).to.equal("0x0000000000000000000000000000000000000000");
      const creatorsLength: string = await storyline.getDataForTokenId(
        tokenIds[0],
        LSP4DataKeys['LSP4Creators[]'].length
      );
      expect(creatorsLength).to.equal("0x00000000000000000000000000000001");
    });

    it("should allow owner to update LSP26 address", async function () {
      const newLSP26Factory = (await ethers.getContractFactory(
        "MockLSP26FollowerSystem"
      )) as MockLSP26FollowerSystem__factory;
      const newLSP26 = await newLSP26Factory.deploy();
      await newLSP26.waitForDeployment();

      await storyline.connect(vibeMaster).setLSP26Address(await newLSP26.getAddress());
      expect(await storyline.lsp26FollowerSystem()).to.equal(await newLSP26.getAddress());
    });

    it("should revert setLSP26Address attempt by non-owner", async function () {
      const newLSP26Factory = (await ethers.getContractFactory(
        "MockLSP26FollowerSystem"
      )) as MockLSP26FollowerSystem__factory;
      const newLSP26 = await newLSP26Factory.deploy();
      await newLSP26.waitForDeployment();

      await expect(
        storyline.connect(contributor1).setLSP26Address(await newLSP26.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});