import * as db from 'tumeke-database';
import { cognitoAuthUser, asyncStoreIdToken } from 'tumeke-database/Cognito';
import { virgilIdGenerator } from "./utils";
import AsyncStorage from '@react-native-community/async-storage';

let EThree = null;
let PrivateKeyAlreadyExistsError = null;
var eThree = null;
var groupChat = null;
let source = "web";

export function InitializeVirgilLibrary(EThree_remote) {
	EThree = EThree_remote;
}

export function InitializeMobileRequirements(PrivateKeyAlreadyExistsError_remote) {
	PrivateKeyAlreadyExistsError = PrivateKeyAlreadyExistsError_remote;
	source = "mobile";
}

// Assumes that device already authenticated w cognito
export async function initializeVirgil(virgilId, initializeFunction = undefined) {
	const getToken = async () => {
		return await db.getVirgilJwt(virgilId);
	}

	if (initializeFunction === undefined) {
		initializeFunction = () => getToken().then(result => result.virgil_token);
	}
	try {
		if (source === "mobile") {
	        eThree = await EThree.initialize(initializeFunction, { AsyncStorage });
	    } else {
	        eThree = await EThree.initialize(initializeFunction);
	    }
		console.log("Successfully initialized virgil")
	} catch (err) {
		console.log("Virgil error: " + err);
	}
}

export function isVirgilInitialized() {
	return eThree !== null && groupChat !== null;
}

export async function logoutVirgil() {
	if (!eThree) return;
	try {
		// TODO Comment this out
		await eThree.cleanup();
	} catch (err) {
		console.log("Error cleaning up " + err)
	}
	eThree = null;
}

export async function createNewUserVirgil(password) {
	if (await eThree.hasLocalPrivateKey()) {
		await eThree.cleanup();
	}
	try {
		await eThree.register();
		await eThree.backupPrivateKey(password);
		console.log("Done")
	} catch (err) {
		console.log("Error: " + err);
	}
}

export async function createVirgilGroupWithSelf(uid, groupId) {
	console.log("Creating group with self: " + uid)
	const participants = await eThree.findUsers([uid]);
	console.log("Got user card")
	groupChat = await eThree.createGroup(groupId, participants);
	console.log("Group done")
	return;
}

export async function encryptMessage(message) {
	return await groupChat.encrypt(message);
}

export async function decryptMessage(message, messageCreatorUID) {
	const messageSender = await eThree.findUsers(messageCreatorUID);
	return await groupChat.decrypt(message, messageSender);
}

async function addUserToGroup(uid) {
	console.log('finding users: ' + uid)
	const newParticipant = await eThree.findUsers(uid);
	console.log('adding to groupchat: ' + JSON.stringify(newParticipant))
	try {
		await groupChat.add(newParticipant);
	} catch (e) {
		// this is the error for when user is already in group.
		// if they are not, then throw error
		if (!(String(e).startsWith("KeyknoxClientError"))) {
			throw "Add user to group error"
		}
	}
}

export async function canResetPassword(virgilId) {
	try {
		await initializeVirgil(virgilId);
		console.log("Successfully initialized virgil")
	} catch (err) {
		console.log("Virgil error: " + err);
		return false;
	}
	try {
		await restorePrivateKey("");
	} catch (e) {
		console.log("Virgil error: " + e);
		return false;
	}
	return true;

}

export async function resetPassword(newPassword) {
	// Expects `canResetFunction` to already have been called
	// Just checking here to make sure. 
	if (!eThree) {
		const ret = await canResetPassword();
		if (!ret) {
			throw "Cannot reset password"
		}
	}
	
	await eThree.resetPrivateKeyBackup();
	await eThree.backupPrivateKey(newPassword);
}

export async function acceptUserIntoCompanyVirgilHelper(uid) {
	await addUserToGroup(uid);
}

export async function joinGroup(userObj, companyObj) {
	if (userObj.role === "requesting") return;
	const { virgil_id, company_admin_virgil_id } = companyObj
	const card = await eThree.findUsers(company_admin_virgil_id);
	groupChat = await eThree.loadGroup(companyObj.virgil_id, card);
}

export async function decryptAESKeys(userObj, companyObj) {
	const { company_admin_virgil_id, aes_key } = companyObj;
	let decryptedObj = {}
	for (var key of Object.keys(aes_key)) {
		decryptedObj[key] = await decryptMessage(aes_key[key], company_admin_virgil_id)
	}
	return decryptedObj;
}

export async function changePassword(oldPassword, newPassword) {
	await eThree.changePassword(oldPassword, newPassword);
}

async function hasLocalPrivateKeyWrapper() {
	try {
        return (await eThree.hasLocalPrivateKey());
    } catch {
        await eThree.keyEntryStorage.storage.clear();
        eThree.keyLoader.cachedPrivateKey = null;
        return (await eThree.hasLocalPrivateKey());
    }
}

export async function restorePrivateKey(password) {
    // inside try catch for Virgil bug in iOS
    const hasLocalKey = await hasLocalPrivateKeyWrapper();
    if (hasLocalKey) return;
    try {
      	await eThree.restorePrivateKey(password);
    } catch (e) {
    	if (PrivateKeyAlreadyExistsError === null) {
    		throw e;
    	}
		if (e instanceof PrivateKeyAlreadyExistsError) {
			await eThree.cleanup();
		} else {
			await eThree.keyEntryStorage.storage.clear();
			eThree.keyLoader.cachedPrivateKey = null;
		} 
      	await eThree.restorePrivateKey(password);
    }
}

export async function initiateResetPasswordFlow(email) {
	const encoded_email = encodeURIComponent(email);
	const userObj = await db.getUserVirgilId(encoded_email);
	const virgilId = userObj.virgilId;
	const ableToReset = await canResetPassword(virgilId);
	if (!ableToReset) {
		const ret = await db.resetPasswordHelper(encoded_email);
		return ret.code;
	}
	await db.initiateResetUserPassword(encoded_email);
	return "INITIATED_RESET";
}

export async function initiateResetPasswordCognito(email) {
	const encoded_email = encodeURIComponent(email);
	await db.initiateResetUserPassword(encoded_email);
}

const cognitologinWithEmailPasswordAsync = async (email, password) =>
    await cognitoAuthUser(email,password)
        .then(authUser => authUser)
        .catch(error => error);

export async function confirmPasswordReset(email, confirmCode, newPassword, resetAccount=false) {
	const encoded_email = encodeURIComponent(email);
	const ret = await db.confirmResetUserPassword(
		encoded_email,
		confirmCode,
		newPassword,
		resetAccount
	)
	if (resetAccount) {
		// Set state to requesting and reset virgil account
		// Somehow need to log back into cognito before all that 
		// can be done however
		const cognitoUser = await cognitologinWithEmailPasswordAsync(email, newPassword);
		const idToken = cognitoUser.getIdToken().getJwtToken()
		await asyncStoreIdToken(idToken);
        await initializeVirgil(ret["virgilId"]);
        await createNewUserVirgil(newPassword)
	} else {
		// If not resetting account then change password on Virgil
		await resetPassword(newPassword);
	}

}


export {
	eThree
}
