import { EThree_browser } from '@virgilsecurity/e3kit-browser';
import { EThree_mobile } from '@virgilsecurity/e3kit-native'
import * as db from 'tumeke-database';

let EThree = null;
var eThree = null;
var groupChat = null;
let source = "web";

function setSource() {
	if (typeof document != 'undefined') {
	    // I'm on the web!
	    EThree = EThree_browser;
	    source = "web"
	}
	else if (typeof navigator != 'undefined' && navigator.product == 'ReactNative') {
	  	EThree = EThree_mobile;
	  	source = "mobile";
	}
}

setSource();

// Assumes that device already authenticated w cognito
export async function initializeVirgil() {
	const getToken = db.virgilJwt;
	const initializeFunction = () => getToken().then(result => result.virgil_token);
	try {
		eThree = await EThree.initialize(initializeFunction)
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
		
		//await eThree.cleanup();
	} catch (err) {
		console.log("Error cleaning up " + err)
	}
	eThree = null;
}

export async function createNewUserVirgil(password) {
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
	const getToken = async () => {
		return await db.getVirgilJwt(virgilId);
	}
	const initializeFunction = () => getToken().then(result => result.virgil_token);
	try {
		eThree = await EThree.initialize(initializeFunction)
		console.log("Successfully initialized virgil")
	} catch (err) {
		console.log("Virgil error: " + err);
		return false;
	}
	try {
		await getVirgilPrivateKey("", false);
	} catch (e) {
		console.log("Virgil error: " + e);
		return false;
	}
	return true;

}

export async function resetPassword(newPassword) {
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

export async function getVirgilPrivateKey(keyPassword, createNewAccount) {
	const hasLocalKey = await eThree.hasLocalPrivateKey()
	if (!hasLocalKey) {
		try {
			await eThree.restorePrivateKey(keyPassword);
		} catch (err) {
			if (createNewAccount) {
				createNewUserVirgil(keyPassword)
			} else {
				console.log("key password: " + keyPassword);
				throw new Error("No local key exists")
			}

		}
	}
}

export {
	eThree
};
