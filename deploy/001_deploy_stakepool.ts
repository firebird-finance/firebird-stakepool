import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals} from "../test/ts/shared/utilities";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy, execute, get, save} = deployments;
	const {deployer, governance, proxyAdmin, feeToken, fireBirdFactory} = await getNamedAccounts();
	const protocolFeeRemover = await get('ProtocolFeeRemover')
	const stakePoolControllerImpl = await deploy("StakePoolControllerImpl", {
		contract: 'StakePoolController',
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [],
		log: true,
	});
	console.log("proxyAdmin", proxyAdmin)
	const factoryProxy = await deploy("StakePoolControllerProxy", {
		contract: "AdminUpgradeabilityProxy",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [
			stakePoolControllerImpl.address,
			proxyAdmin,
			"0x",
		],
		log: true,
	})

	if (factoryProxy.newlyDeployed) {
		const stakePoolController = stakePoolControllerImpl
		stakePoolController.address = factoryProxy.address
		await save("StakePoolController", stakePoolController)
		await execute("StakePoolController", {
				from: deployer,
				log: true,
			}, "initialize",
			fireBirdFactory
		)

		await execute("StakePoolController", {from: deployer, log: true}, "setFeeCollector", protocolFeeRemover.address);
		await execute("StakePoolController", {from: deployer, log: true}, "setFeeToken", feeToken);
		await execute("StakePoolController", {from: deployer, log: true}, "setFeeAmount", expandDecimals(10, 18));
		await execute("StakePoolController", {from: deployer, log: true}, "setExtraFeeRate", 5000);
	}
	const stakePoolCreator = await deploy("StakePoolCreator", {
		contract: "StakePoolCreator",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [],
		log: true,
	});
	if (factoryProxy.newlyDeployed || stakePoolCreator.newlyDeployed) {
		await execute("StakePoolController", {from: deployer, log: true}, "addStakePoolCreator", stakePoolCreator.address);
	}

	const stakePoolEpochRewardCreator = await deploy("StakePoolEpochRewardCreator", {
		contract: "StakePoolEpochRewardCreator",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [],
		log: true,
	});
	if (stakePoolEpochRewardCreator.newlyDeployed) {
		await execute("StakePoolController", {
			from: deployer,
			log: true
		}, "addStakePoolCreator", stakePoolEpochRewardCreator.address);
	}
	await execute("StakePoolController", {from: deployer, log: true}, "setGovernance", governance);

};


export default func;
func.dependencies = ["factory"];
func.tags = ["stakepool"];
