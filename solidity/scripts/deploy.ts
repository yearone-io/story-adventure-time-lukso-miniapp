import hre, { ethers } from 'hardhat';
import { getNetworkAccountsConfig } from '../constants/network';
import { AdventureTime__factory, Storyline__factory } from "../typechain-types";

const network = hre.network.name;
console.log('network: ', network);
const { UP_ADDR_CONTROLLED_BY_EOA } = getNetworkAccountsConfig(network as string);

async function main() {
  const deployer = UP_ADDR_CONTROLLED_BY_EOA;
  console.log("Deploying contracts with account:", deployer);

  // Check network
  const networkName = hre.network.name;
  console.log("Deploying to network:", networkName);
  
  if (networkName !== "luksoTestnet" && networkName !== "luksoMain") {
    throw new Error("This script only supports luksoTestnet or luksoMain networks");
  }

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer);
  console.log("Deployer balance:", ethers.formatEther(balance), "LYX");

  // Deploy AdventureTimeHelpers library
  console.log("Deploying AdventureTimeHelpers...");
  const AdventureTimeHelpersFactory = await ethers.getContractFactory(
    "AdventureTimeHelpers"
  );
  const adventureTimeHelpers = await AdventureTimeHelpersFactory.deploy();
  await adventureTimeHelpers.waitForDeployment();
  const helpersAddress = adventureTimeHelpers.target;
  console.log("AdventureTimeHelpers deployed to:", helpersAddress);

  // Deploy AdventureTime with linked library
  console.log("Deploying AdventureTime...");
  const AdventureTimeFactory = (await ethers.getContractFactory("AdventureTime", {
    libraries: {
      AdventureTimeHelpers: helpersAddress,
    },
  })) as AdventureTime__factory;
  
  const NFT_PROTOCOL_NAME = "AdventureTime";
  const NFT_PROTOCOL_SYMBOL = "AT";
  
  const adventureTime = await AdventureTimeFactory.deploy(
    NFT_PROTOCOL_NAME,
    NFT_PROTOCOL_SYMBOL,
    deployer
  );
  await adventureTime.waitForDeployment();
  const adventureTimeAddress = await adventureTime.getAddress();
  console.log("AdventureTime deployed to:", adventureTimeAddress);

  // Deploy a sample Storyline through AdventureTime.mint
  console.log("Deploying sample Storyline...");
  const STORYLINE_NAME = "Epic Tale";
  const STORYLINE_SYMBOL = "ET";
  const METADATA_URI = ethers.encodeBytes32String("ipfs://metadata");
  const STARTING_PROMPT_URI = ethers.encodeBytes32String("ipfs://prompt");
  const VIBE_MASTER = deployer; // Using deployer as vibeMaster for simplicity
  const IS_FOLLOWER_RESTRICTION_ENABLED = false;
  // Deploy a mock LSP26FollowerSystem (for testing purposes)
  const MockLSP26Factory = await ethers.getContractFactory("MockLSP26FollowerSystem");
  const mockLSP26 = await MockLSP26Factory.deploy();
  await mockLSP26.waitForDeployment();
  const mockLSP26Address = mockLSP26.target;
  console.log("MockLSP26FollowerSystem deployed to:", mockLSP26Address);

  const mintTx = await adventureTime.mint(
    STORYLINE_NAME,
    STORYLINE_SYMBOL,
    VIBE_MASTER,
    IS_FOLLOWER_RESTRICTION_ENABLED,
    METADATA_URI,
    STARTING_PROMPT_URI,
    mockLSP26Address
  );
  const receipt = await mintTx.wait();
  const storylineCreatedEvent = receipt.logs.find(
    (log: any) => log.topics[0] === ethers.id("StorylineCreated(string,address,address)")
  );
  if (!storylineCreatedEvent) {
    throw new Error("StorylineCreated event not found");
  }
  const [, storylineAddress] = ethers.AbiCoder.defaultAbiCoder().decode(
    ["string", "address", "address"],
    storylineCreatedEvent.data
  );
  console.log("Storyline deployed to:", storylineAddress);

  // Log constructor arguments for reference
  console.log("Storyline constructor arguments for verification:");
  console.log(`  Name: ${STORYLINE_NAME}`);
  console.log(`  Symbol: ${STORYLINE_SYMBOL}`);
  console.log(`  Creator (VibeMaster): ${VIBE_MASTER}`);
  console.log(`  Follower Restriction Enabled: ${IS_FOLLOWER_RESTRICTION_ENABLED}`);
  console.log(`  Metadata URI: ${METADATA_URI}`);
  console.log(`  Starting Prompt URI: ${STARTING_PROMPT_URI}`);
  console.log(`  Follower System Contract: ${mockLSP26Address}`);

  // Verify contracts on explorer (if supported)
  if (hre.network.config.chainId) {
    console.log("Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute for explorer to index
    
    try {
      console.log("Verifying AdventureTimeHelpers...");
      await hre.run("verify:verify", {
        address: helpersAddress,
        constructorArguments: [],
      });

      console.log("Verifying AdventureTime...");
      await hre.run("verify:verify", {
        address: adventureTimeAddress,
        constructorArguments: [
          NFT_PROTOCOL_NAME,
          NFT_PROTOCOL_SYMBOL,
          deployer
        ],
        libraries: {
          AdventureTimeHelpers: helpersAddress,
        },
      });

      console.log("Verifying MockLSP26FollowerSystem...");
      await hre.run("verify:verify", {
        address: mockLSP26Address,
        constructorArguments: [],
      });

      console.log("Verifying Storyline...");
      await hre.run("verify:verify", {
        address: storylineAddress,
        constructorArguments: [
          STORYLINE_NAME,
          STORYLINE_SYMBOL,
          VIBE_MASTER,
          IS_FOLLOWER_RESTRICTION_ENABLED,
          METADATA_URI,
          STARTING_PROMPT_URI,
          mockLSP26Address
        ],
      });

      console.log(`
        Verification Note:
        The Storyline contract bytecode has been verified. Future Storyline contracts
        deployed via AdventureTime.mint should have identical bytecode and may be
        automatically recognized by the LUKSO explorer if bytecode matching is supported.
        To fully verify future Storyline contracts, provide their constructor arguments
        using the LUKSO explorer UI or the following command:
        npx hardhat verify --network ${networkName} <storyline_address> \\
          "<storyline_name>" "<storyline_symbol>" "<vibe_master_address>" \\
          <is_follower_restriction_enabled> "<metadata_uri>" "<starting_prompt_uri>" \\
          "<follower_system_contract_address>"
      `);
    } catch (error) {
      console.error("Verification failed:", error);
    }
  }

  console.log("Deployment completed successfully!");
}

// Error handling and execution
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });