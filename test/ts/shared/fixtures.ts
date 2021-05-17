import {
	TToken,
	StakePoolCreator,
	StakePoolEpochRewardCreator,
	StakePoolController,
	FireBirdFactoryMock,
	TTokenFactory,
	StakePoolCreatorFactory,
	StakePoolEpochRewardCreatorFactory,
	StakePoolControllerFactory,
	FireBirdFactoryMockFactory,

} from "../../../typechain";
import {SignerWithAddress} from "hardhat-deploy-ethers/dist/src/signer-with-address";
import {toWei} from "./utilities";
import {deployments} from 'hardhat';


const overrides = {}


interface StakePoolFixture {
	stakeToken: TToken,
	stakePoolCreator: StakePoolCreator,
	stakePoolEpochRewardCreator: StakePoolEpochRewardCreator,
	stakePoolController: StakePoolController,
	fireBirdFactoryMock: FireBirdFactoryMock,
}

export async function stakePoolFixture(signer: SignerWithAddress): Promise<StakePoolFixture> {
	return await deployments.createFixture(async () => {
		const stakeToken = await new TTokenFactory(signer).deploy("Test", "TEST", toWei(100000));
		const stakePoolCreator = await new StakePoolCreatorFactory(signer).deploy();
		const stakePoolEpochRewardCreator = await new StakePoolEpochRewardCreatorFactory(signer).deploy();
		const stakePoolController = await new StakePoolControllerFactory(signer).deploy();
		const fireBirdFactoryMock = await new FireBirdFactoryMockFactory(signer).deploy();
		await stakePoolController.initialize(fireBirdFactoryMock.address);
		return {
			stakeToken,
			stakePoolCreator,
			stakePoolEpochRewardCreator,
			stakePoolController,
			fireBirdFactoryMock,
		}
	})()
}
