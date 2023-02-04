import axios from 'axios';
import { 
  cognitoRefreshTokenWeb,
  asyncGetIdToken
} from '../auth/Cognito';
import AsyncStorage from '@react-native-community/async-storage';
// import moment from 'moment';

export var TUMEKE_API = "";
export var PLATFORM = "web";
export var logoutCallback = undefined;

const noAuthEndpoints = [
  "doesEmailExist", "doesCompanyExist", "getUserVirgilId", "getVirgilJwt",
  "initiateResetUserPassword", "resetPasswordHelper", "confirmResetUserPassword",
  "checkSSO", "getCognitoFromCode", "getAsyncUploadInfo", "asyncUploadFinished",
  "externalGetVideoDoc", "externalGetVideoManifest", "externalGetVideoSlice",
  "externalDownloadVideoRequest"
]

// Axios Auth Interceptor
axios.interceptors.request.use(async function (config) {
  const url = config.url;
  const arr = url.split("/");
  // Do not add auth for amazonaws endpoints, and any
  // of the non-auth endpoints on our server (list above)
  const isNonAuthEndpoint = 
    arr.length < 4 || noAuthEndpoints.includes(arr[3]) ||
    arr[2].includes("amazonaws")
  if (!isNonAuthEndpoint) {
    let id_token = await asyncGetIdToken(PLATFORM, logoutCallback);
    if (id_token == undefined) {
      throw new axios.Cancel('Logging out due to inactivity. Try logging in again');
    }
    config.headers.Authorization = id_token;
  }
  
  config.headers["Access-Control-Allow-Origin"] = "*"
  axios.defaults.crossDomain = true
  return config;
});

export const setAPIEndpoint = (api) => {
  TUMEKE_API = api;
}

export const setCallback = (platform, callback) => {
  PLATFORM = platform;
  logoutCallback = callback;
}

export const checkLoginStatus = async () => {
  return (await axios.get(`${TUMEKE_API}/checkLoginStatus`)).data
}

export const submitJointAngleComputeJob = async (body, axiosConfig) => {
  return (await axios.post(`${TUMEKE_API}/submitJointAngleComputeJob/video`, body, axiosConfig)).data;
}

export const requestFileUpload = async (body) => {
  return (await axios.post(`${TUMEKE_API}/requestFileUpload`, body)).data;
}

export const requestAsyncFileUpload = async (body) => {
  return (await axios.post(`${TUMEKE_API}/requestAsyncFileUpload`, body)).data;
}

export const getAsyncUploadInfo = async (job_id) => {
  return (await axios.get(`${TUMEKE_API}/getAsyncUploadInfo/${job_id}`)).data;
}

export const uploadFinished = async (video_id, uploadData) => {
  return (await axios.post(`${TUMEKE_API}/uploadFinished/${video_id}`, uploadData)).data;
}

export const asyncUploadFinished = async (video_id, uploadData) => {
  return (await axios.post(`${TUMEKE_API}/asyncUploadFinished/${video_id}`, uploadData)).data;
}

export const submitNewPosture = async (body) => {
  return (await axios.post(`${TUMEKE_API}/submitNewPosture`, body)).data;
}

/// Crud

export const createCompany = async ({name,aes_key,meta_data,virgil_id,consultancy}) =>
  (await axios.post(`${TUMEKE_API}/createCompany`,{name,aes_key,meta_data,virgil_id,consultancy})).data

export const createUser = async ({name,email,password,virgil_id}) =>
  axios.post(`${TUMEKE_API}/createUser`,{name,email,password,virgil_id})

export const createGroup = async (name) => (await axios.post(`${TUMEKE_API}/createGroup/${name}`)).data

export const addFeedback = async (user_id, text, type) => {
  return (await axios.post(`${TUMEKE_API}/addFeedback/${user_id}`, {
    text, type
  })).data
}
/// cRud

// user's own company
export const getCompany = async () => (await axios.get(`${TUMEKE_API}/getCompany`)).data

export const getCompanyByName = async (name) => (await axios.get(`${TUMEKE_API}/getCompanyByName/${name}`)).data

export const getCompanyById = async (company_id) => (await axios.get(`${TUMEKE_API}/getCompanyById/${company_id}`)).data

export const getVideoDoc = async (id) => (await axios.get(`${TUMEKE_API}/getVideoDoc/${id}`)).data

export const getVideosByUserId = async (user_id) => (await axios.get(`${TUMEKE_API}/getVideosByUserId`)).data

export const loginUser = async () => (await axios.get(`${TUMEKE_API}/loginUser`)).data

export const getUserById = async (id) => (await axios.get(`${TUMEKE_API}/getUser/${id}`)).data

export const getUserByCognitoId = async (cognito_id) => (await axios.get(`${TUMEKE_API}/getUserByCognitoId`,{cognito_id})).data

export const getGroup = async (group_id) => (await axios.get(`${TUMEKE_API}/getGroup/${group_id}`)).data

export const getAllUserVideos = async (filter_object,
    assessments_by_field_param,
    date_granularity_param,
    client_timezone,
    page_size,
    page_offset,
    search) => 

  (await axios.post(`${TUMEKE_API}/getAllUserVideos`, {filter_object, assessments_by_field_param, date_granularity_param, client_timezone, page_size, page_offset, search})).data

export const doesEmailExist = async(encoded_email) => (await axios.get(`${TUMEKE_API}/doesEmailExist/${encoded_email}`)).data

export const checkSSO = async(encoded_email, redirect) => (await axios.post(`${TUMEKE_API}/checkSSO/${encoded_email}`, { redirect })).data

export const getCognitoFromCode = async(code, redirect, email) => (await axios.post(`${TUMEKE_API}/getCognitoFromCode`, { code, redirect, email })).data

export const doesCompanyNameExist = async(encoded_company_name) => (await axios.get(`${TUMEKE_API}/doesCompanyExist/${encoded_company_name}`)).data

// groups the user belongs to
export const getUsersGroups = async () => (await axios.get(`${TUMEKE_API}/getUsersGroups`)).data

// groups the user's company owns
export const getGroupsByCompany = async () => (await axios.get(`${TUMEKE_API}/getGroupsByCompany`)).data

export const getRequestingUsers = async () => (await axios.get(`${TUMEKE_API}/getRequestingUsers`)).data

export const getVirgilJwt = async (virgil_id) =>
  (await axios.get(`${TUMEKE_API}/getVirgilJwt/${virgil_id}`)).data

export const getUserVirgilId = async (encoded_email) => 
  (await axios.get(`${TUMEKE_API}/getUserVirgilId/${encoded_email}`)).data

export const checkAccountStatus = async (encoded_email) =>
    (await axios.get(`${TUMEKE_API}/checkAccountStatus/${encoded_email}`)).data

export const getCompanysGroups = async () => (await axios.get(`${TUMEKE_API}/getCompanysGroups`)).data

export const getProcessedVideo = async (job_id) => (await axios.get(`${TUMEKE_API}/getProcessedVideo/${job_id}`)).data

export const getJobJointData = async (job_id) => (await axios.get(`${TUMEKE_API}/getJobJointData/${job_id}`)).data

export const getJobJointDataWeb = async (job_id) => (await axios.get(`${TUMEKE_API}/getJobJointDataWeb/${job_id}`)).data

export const getJobResult = async (job_id) => (await axios.get(`${TUMEKE_API}/getJobResult/${job_id}`)).data

export const getClientDepartmentCards = async (company_id, returnType) => 
  (await axios.post(`${TUMEKE_API}/getClientDepartmentCards/${company_id}`, {returnType: returnType})).data

export const getClientDeptObject = async (client_dept_option_id) => (await axios.get(`${TUMEKE_API}/getClientDeptObject/${client_dept_option_id}`)).data

// Dashboard Queries
export const getDashboardFilters = async () => (await axios.get(`${TUMEKE_API}/getDashboardFilters`)).data

export const getDashboardData = async (
    filter_object,
    assessments_by_field_param,
    dateGranularityParam,
    clientTimezone
) => (await axios.post(
        `${TUMEKE_API}/getDashboardData`,
        {
          filter_object: filter_object,
          assessments_by_field_param: assessments_by_field_param,
          date_granularity_param: dateGranularityParam,
          client_timezone: clientTimezone
        }
    )
).data

// Compare queries
export const getVideoComparisonData = async (
    video_list
) => (await axios.post(
        `${TUMEKE_API}/getVideoComparisonData`,
        {
            videos: video_list
        }
    )
).data

/// crUd
export const joinCompanyRequest = async (id) => (await axios.post(`${TUMEKE_API}/joinCompanyRequest/${id}`)).data

export const addUserToGroup = async ({user_id, group_id}) =>
  axios.post(`${TUMEKE_API}/addUserToGroup`,{user_id, group_id})

export const requestUserCompanyJoin = async (id) => (await axios.post(`${TUMEKE_API}/requestUserCompanyJoin/${id}`))

export const acceptUserCompanyJoin = async (user_id) => axios.post(`${TUMEKE_API}/acceptUserCompanyJoin/${user_id}`)

export const denyUserCompanyJoin = async (user_id) => axios.post(`${TUMEKE_API}/denyUserCompanyJoin/${user_id}`)

export const updateAdditionalVideoInfo = async ({video_id, assessment_id, posture_id, new_info, new_metadata}) =>
  axios.post(`${TUMEKE_API}/updateAdditionalVideoInfo/${video_id}/${assessment_id}/${posture_id}`,{new_info, new_metadata})

export const setVideoMetadata = async (video_id, field_id, option_id) => {
  return (await axios.post(`${TUMEKE_API}/setVideoMetadata`,{video_id, field_id, option_id})).data
};

export const migrateFirebaseIdtoCognito = async (email) => {
  return await axios.post(`${TUMEKE_API}/migrateFirebaseIdtoCognito`,{email: email})
};

export const externalGetVideoDoc = async (short_key) => {
  return (await axios.get(`${TUMEKE_API}/externalGetVideoDoc/${short_key}`)).data
};

export const getThumbnail = async (video_id) => {
  return (await axios.get(`${TUMEKE_API}/getThumbnail/${video_id}`)).data
};

export const getPostureThumbnail = async (video_id, frame_num) => {
  return (await axios.get(`${TUMEKE_API}/getPostureThumbnail/${video_id}/${frame_num}`)).data
};

export const getVideoManifest = async (video_id) => {
  return (await axios.get(`${TUMEKE_API}/getVideoManifest/${video_id}`)).data
}

export const externalGetVideoManifest = async (short_key) => {
  return (await axios.get(`${TUMEKE_API}/externalGetVideoManifest/${short_key}`)).data
}

export const getVideoJointData = async (video_id, chunk) => {
  return (await axios.get(`${TUMEKE_API}/getVideoJointData/${video_id}/${chunk}`)).data
}

export const getVideoSlice = async (video_id, res, slice) => {
  return (await axios.get(`${TUMEKE_API}/getVideoSlice/${video_id}/${res}/${slice}`)).data
}

export const externalGetVideoSlice = async (short_key, res, slice) => {
  return (await axios.get(`${TUMEKE_API}/externalGetVideoSlice/${short_key}/${res}/${slice}`)).data
}

export const getAllVideoSlices = async (video_id, res) => {
  return (await axios.get(`${TUMEKE_API}/getAllVideoSlices/${video_id}/${res}`)).data
}

export const generateReport = async (videoId, assessmentId, subjectId) => {
  const uid = "fixme";
  return (await axios.post(`${TUMEKE_API}/generateReport/${videoId}/${assessmentId}`, {uid, subjectId})).data;
}

export const downloadVideoRequest = async (videoId, aesKeys) => {
  return (await axios.post(`${TUMEKE_API}/downloadVideoRequest/${videoId}`, { aesKeys })).data;
}

export const externalDownloadVideoRequest = async (videoId, aesKeys, email) => {
  return (await axios.post(`${TUMEKE_API}/externalDownloadVideoRequest/${videoId}`, { aesKeys, email })).data;
}

export const generateViewOnlyLink = async (videoId, aesKeys, ttl) => {
  return (await axios.post(`${TUMEKE_API}/generateViewOnlyLink/${videoId}`, {aesKeys, ttl})).data;
}

export const getAssessmentOverTime = async (videoId, subjectId) => {
  return (await axios.get(`${TUMEKE_API}/getAssessmentOverTime/${videoId}/${subjectId}`)).data;
}

export const updateRiskComponents = async ({video_id, assessment_id, person_id, new_info}) =>
  axios.post(`${TUMEKE_API}/updateRiskComponents/${video_id}/${assessment_id}/${person_id}`,{new_info})

export const addCompanyMetadataOption = async (field_id, option_name, parent_option_id) => {
  return (await axios.post(`${TUMEKE_API}/addCompanyMetadataOption`,{field_id, option_name, parent_option_id})).data
}

export const editCompanyMetadataOption = async (option_id, option_name) => {
  return (await axios.post(`${TUMEKE_API}/editCompanyMetadataOption`,{option_id, option_name})).data
}

export const updateVideoNotes = async (video_id, assessmentId, notes, notesKey) => {
  return (await axios.post(`${TUMEKE_API}/updateVideoNotes/${video_id}/${assessmentId}`,{notes, notesKey})).data
}

export const rerunAssessmentFull = async (job_id) => (await axios.post(`${TUMEKE_API}/rerunAssessmentFull/${job_id}`)).data

export const updateVideoName = async (video_id, name) => {
  return (await axios.post(`${TUMEKE_API}/updateVideoName/${video_id}/`,{name})).data
}

export const updateAssessmentName = async (video_id, assessment_id, name) => {
    return (await axios.post(`${TUMEKE_API}/updateAssessmentName/${video_id}/${assessment_id}/`,{name})).data
}

export const initiateResetUserPassword = async (encoded_email) => {
  return (await axios.post(`${TUMEKE_API}/initiateResetUserPassword/${encoded_email}`)).data
}

export const resetPasswordHelper = async (encoded_email) => {
  return (await axios.post(`${TUMEKE_API}/resetPasswordHelper/${encoded_email}`)).data
}

export const confirmResetUserPassword = async (encoded_email, confirmation_code, new_password, reset_user=false) => {
  return (await axios.post(`${TUMEKE_API}/confirmResetUserPassword/${encoded_email}`,
    {confirmation_code, new_password, reset_user})).data
}

export const setUserRole = async (user_id, role) => {
  return (await axios.post(`${TUMEKE_API}/setUserRole/${user_id}`, { role })).data
}

/// cruD

export const deleteNotification = async (notif_id) => {
  return (await axios.delete(`${TUMEKE_API}/deleteNotification/${notif_id}`))
}

export const deleteVideo = async (id) => axios.delete(`${TUMEKE_API}/deleteVideo/${id}`)

export const deletePosture = async (id) => axios.delete(`${TUMEKE_API}/deletePosture/${id}`)

export const deleteGroup = async (id) => axios.delete(`${TUMEKE_API}/deleteGroup/${id}`)

export const deleteCompanyMetadataOption = async (option_id) => {
  return (await axios.delete(`${TUMEKE_API}/deleteCompanyMetadataOption/${option_id}`)).data
}

export const removeUserFromGroup = async ({user_id, group_id}) => {
  return (await axios.delete(`${TUMEKE_API}/removeUserFromGroup/${user_id}/${group_id}`)).data
}

export const deleteTempPassword = async (user_id) => axios.delete(`${TUMEKE_API}/deleteTempPassword/${user_id}`)