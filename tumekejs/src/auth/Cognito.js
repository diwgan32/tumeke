import 'cross-fetch/polyfill'
import * as AmazonCognitoIdentity from "amazon-cognito-identity-js";
import AsyncStorage from '@react-native-community/async-storage';
// import moment from 'moment';
import subMinutes from 'date-fns/subMinutes';
import addMinutes from 'date-fns/addMinutes';

const VIRGIL_URL_LENGTH = 28
var EXPIRE_TIME_MINS = 5;
const BUFFER_TIME = 2;
var AWS_REGION = "us-east-1"

// dev
const COGNITO_CONFIG = {
  UserPoolId : "",
  ClientId : "",
};

var CognitoUserPool = null;
//AmazonCognitoIdentity.config.region = awsRegion;
var userPool = null;
var currentUser = null;

const initializeUserPools = (poolId, clientId, expireTime) => {
  COGNITO_CONFIG.UserPoolId = poolId;
  COGNITO_CONFIG.ClientId = clientId;
  if (expireTime !== undefined) {
    EXPIRE_TIME_MINS = expireTime;
  }
  console.log("[initializeUserPools]", clientId);
  CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
  userPool = new AmazonCognitoIdentity.CognitoUserPool(COGNITO_CONFIG);
}

const authDetails = (email,password) => new AmazonCognitoIdentity.AuthenticationDetails({
    Username : email,
    Password : password,
  })

const cognitoUser = (email) => new AmazonCognitoIdentity.CognitoUser(
    {Username : email, Pool : userPool}
  )

// callback to promise prob a better way
const cognitoAuthUser = (email,password) => new Promise ((resolve,reject) =>
{
  const callbkfn = {
    onSuccess: function (result) {
      resolve(result)
    },
    onFailure: function(err) {
      reject(err)
    },
    mfaRequired: function(codeDeliveryDetails, codeDeliveryDestination) {
      let destination = "unknown"
      if ("CODE_DELIVERY_DESTINATION" in codeDeliveryDestination) {
        destination = codeDeliveryDestination["CODE_DELIVERY_DESTINATION"];
      }
      resolve({
        "message": "mfa",
        "destination": destination
      })
    }
  }
  currentUser = cognitoUser(email);
  currentUser.authenticateUser(authDetails(email,password),callbkfn)
});

const hasCurrentUser = () => {
  return currentUser !== null;
}

const cognitoSendVerificationcode = (email, verificationCode) => new Promise ((resolve,reject) =>
{
  const callbkfn = {
    onSuccess: function (result) {
      resolve(result)
    },
    onFailure: function(err) {
        reject(err)
    }
  }
  currentUser.sendMFACode(verificationCode, callbkfn);
})

const cognitoInitiateForgotPassword = (email) => new Promise((resolve, reject) => {
  cognitoUser(email).forgotPassword({
    onSuccess: function(data) {
      resolve(data);
      console.log("Successfully initiated password reset");
    },
    onFailure: function(err) {
      reject(err);
    },
  })
})


const cognitoConfirmPasswordReset = (email, verificationCode, newPassword) => new Promise((resolve, reject) => {
  cognitoUser(email).confirmPassword(verificationCode, newPassword, {
    onSuccess() {
      resolve("Done");
      console.log('Password confirmed!');
    },
    onFailure(err) {
      reject(err);
      console.log('Password not confirmed!');
    },
  });
})

// callback to promise prob a better way
const cognitoChangePasswordWeb = (email,oldPassword,newPassword) => new Promise ((resolve,reject) =>
  {
  var cognitoUser = userPool.getCurrentUser();
  if (!cognitoUser || cognitoUser === null) {
    reject(err);
  }
    // Continue with steps in Use case 16
  cognitoUser.getSession(function(err, session) {
    if (err) {
      console.log("Get session error")
      reject(err);
      return;
    }
    
    cognitoUser.changePassword(oldPassword, newPassword, function (err, result) {
      if(err){
        reject(err)
      } else{
        resolve(result.user)
      }
    })

  });
});


const cognitoChangePasswordRN = (email,oldPassword,newPassword) => new Promise ((resolve,reject) =>
  {
    userPool.storage.sync(function(err, result) {
      if (err) {
        console.log("Sync error")
        // Something wrong with getting current session
        reject(err);
      } else if (result === 'SUCCESS') {
        var cognitoUser = userPool.getCurrentUser();

        if (!cognitoUser || cognitoUser === null) {
          reject(err);
          return;
        }
          // Continue with steps in Use case 16
        cognitoUser.getSession(function(err, session) {
          if (err) {
            console.log("Get session error")
            reject(err);
            return;
          }
          
          cognitoUser.changePassword(oldPassword, newPassword, function (err, result) {
            if(err){
              reject(err)
            } else{
              resolve(result.user)
            }
          })

        });
      }
    });
  })


const cognitoRefreshTokenRN = () => new Promise((resolve, reject) => 
  {
    userPool.storage.sync(function(err, result) {
      if (err) {
        console.log("Sync error")
        // Something wrong with getting current session
        reject(err);
      } else if (result === 'SUCCESS') {
        var cognitoUser = userPool.getCurrentUser();

        if (!cognitoUser || cognitoUser === null) {
          reject(err);
          return;
        }
          // Continue with steps in Use case 16
        cognitoUser.getSession(function(err, session) {
          if (err) {
            console.log("Get session error")
            reject(err);
            return;
          }
          var refresh_token = session.getRefreshToken().token;
          var token = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refresh_token })

          if (session.isValid()) {
            resolve(session)
            return;
          }

          cognitoUser.refreshSession(token, function (err, session) {
            if (err) {
              console.log("Refresh error")
              reject(err);
              return;
            }
            var idToken = session.getIdToken().getJwtToken();
            resolve(session)
          })

        });
      }
    });
  })

const cognitoForceRefreshTokenRN = () => new Promise((resolve, reject) => 
  {
    userPool.storage.sync(function(err, result) {
      if (err) {
        console.log("Sync error")
        // Something wrong with getting current session
        reject(err);
      } else if (result === 'SUCCESS') {
        var cognitoUser = userPool.getCurrentUser();

        if (!cognitoUser || cognitoUser === null) {
          reject(err);
          return;
        }
          // Continue with steps in Use case 16
        cognitoUser.getSession(function(err, session) {
          if (err) {
            console.log("Get session error")
            reject(err);
            return;
          }
          var refresh_token = session.getRefreshToken().token;
          var token = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refresh_token })
          cognitoUser.refreshSession(token, function (err, session) {
            if (err) {
              console.log("Refresh error")
              reject(err);
              return;
            }
            resolve(session)
          })

        });
      }
    });
  })

const cognitoForceRefreshTokenWeb = () => new Promise((resolve, reject) => 
  {
    var cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser || cognitoUser === null) {
      reject("No user found");
    }
      // Continue with steps in Use case 16
    cognitoUser.getSession(function(err, session) {
      if (err) {
        console.log("Get session error")
        reject(err);
        return;
      }
      var refresh_token = session.getRefreshToken().token;
      var token = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refresh_token })

      cognitoUser.refreshSession(token, function (err, session) {
        if (err) {
          console.log("Refresh error")
          reject(err);
          return;
        }
        var idToken = session.getIdToken().getJwtToken();
        resolve(session)
      })

    });
  })

const cognitoRefreshTokenWeb = () => new Promise((resolve, reject) => 
  {
    var cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser || cognitoUser === null) {
      reject(err);
    }
      // Continue with steps in Use case 16
    cognitoUser.getSession(function(err, session) {
      if (err) {
        console.log("Get session error")
        reject(err);
        return;
      }
      var refresh_token = session.getRefreshToken().token;
      var token = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refresh_token })

      if (session.isValid()) {
        resolve(session)
      }

      cognitoUser.refreshSession(token, function (err, session) {
        if (err) {
          console.log("Refresh error")
          reject(err);
          return;
        }
        var idToken = session.getIdToken().getJwtToken();
        resolve(session)
      })

    });
  })

// callback to promise prob a better way
const cognitoRegisterUser = (email,password,virgil_id) => new Promise ((resolve,reject) =>
  {
    if (virgil_id === undefined) {
      throw "Undefined virgilId"
    }
    const attributeList = []
    var virgil_dict = {
      Name: 'custom:virgil_id',
      Value: virgil_id,
    };
    const virgilIdCognito = new AmazonCognitoIdentity.CognitoUserAttribute(virgil_dict);

    attributeList.push(virgilIdCognito)
    userPool.signUp(email, password, attributeList, null, function(err,result) {
      console.log(err,result)
      if(err){
        reject(err)
      } else{
        resolve(result.user)
      }
    })
  });

// Cognito utils
const asyncStore = async (key,val) => await AsyncStorage.setItem(key, val)

const asyncStoreIdToken = async (id_token) => {
    const token = {
        token: id_token,
        expirationDate: addMinutes(new Date(), EXPIRE_TIME_MINS).toString(),
        // expirationDate: moment().add(EXPIRE_TIME_MINS, 'minutes').toString(),
    }
    await AsyncStorage.setItem("id_token", JSON.stringify(token));
}

const logOutHelper = () => {
  localStorage.removeItem('userObj');
  localStorage.removeItem('companyObj');
  localStorage.removeItem('id_token');
  window.location.href = "/user/login";
}

const refreshTokenHelper = async (platform, callback) => {
    try {
      let cognitoUser;
      if (platform === "web") {
        cognitoUser = await cognitoForceRefreshTokenWeb();
      } else {
        cognitoUser = await cognitoForceRefreshTokenRN();
      }
      let id_token = cognitoUser.getIdToken().getJwtToken()
      await asyncStoreIdToken(id_token);
      return true
    } catch (e) {
      console.log(e)
      if (callback) {
        callback();
      } else {
        logOutHelper();
      }
      return false;
    }
    return false;
}

// Platform either "web" or "rn"
const asyncGetIdToken = async (platform, callback) => {
  let token;
  try {
    token = JSON.parse(await AsyncStorage.getItem('id_token'))
  } catch (e) {
    if (callback) {
      callback();
    } else {
      logOutHelper();
    }
    
    return;
  }

  const expr = token["expirationDate"];
  if (new Date().getTime() >= subMinutes(new Date(expr).getTime(), BUFFER_TIME)) {
    // if (moment() >= moment(expr).subtract(BUFFER_TIME, 'minutes')) {
    await refreshTokenHelper(platform, callback);
  }
  return JSON.parse(await AsyncStorage.getItem('id_token'))['token']
}

const setUserSession = (serverObj) => {
  const cognitoIdToken = new AmazonCognitoIdentity.CognitoIdToken({
    IdToken: serverObj.id_token,
  });
  const cognitoAccessToken = new AmazonCognitoIdentity.CognitoAccessToken({
    AccessToken: serverObj.access_token,
  });
  const cognitoRefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({
    RefreshToken: serverObj.refresh_token,
  });
  const username = cognitoIdToken.payload.email; // or what you use as username, e.g. email
  const user = cognitoUser(username);
  const cognitoUserRet = new AmazonCognitoIdentity.CognitoUserSession({
    AccessToken: cognitoAccessToken,
    IdToken: cognitoIdToken,
    RefreshToken: cognitoRefreshToken,
  });
  user.setSignInUserSession(cognitoUserRet);
  return cognitoUserRet;
}

const cognitoSignoutUser = () => {
  var cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  } 
}

export {
   cognitoAuthUser,
   cognitoRegisterUser,
   cognitoChangePasswordWeb,
   cognitoChangePasswordRN,
   cognitoRefreshTokenWeb,
   cognitoRefreshTokenRN,
   COGNITO_CONFIG,
   initializeUserPools,
   asyncGetIdToken,
   refreshTokenHelper,
   asyncStoreIdToken,
   asyncStore,
   cognitoInitiateForgotPassword,
   cognitoConfirmPasswordReset,
   cognitoSendVerificationcode,
   hasCurrentUser,
   setUserSession,
   cognitoSignoutUser
};
