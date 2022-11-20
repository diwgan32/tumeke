import * as db from './Database';
import axios from 'axios';

// etags: [{eTag, partNum}, ...]
export const getParts = (uploadId, eTags) => {
    let parts = []
   
    for (let i = 0; i < eTags.length; i++) {
        parts.append(eTags[i])
    }

    return partString + "]";
}

const requestCreateJob = async (config) => {
    const body = new FormData();
    body.append('assessmentType', config.assessmentType);
    body.append('assessmentMetadata', JSON.stringify(config.assessmentMetadata));
    body.append('videoName', config.videoName);
    body.append('clipSegments', JSON.stringify(config.clipSegments));
    body.append("deviceToken", config.deviceToken);
    body.append("privacyMetadata", JSON.stringify(config.privacyMetadata));
    body.append("assessmentType", config.assessmentType);
    body.append("ext", config.ext);
    body.append("filesize", config.filesize);
    body.append("platform", config.platform);
    body.append("chunksize", config.chunksize);
    body.append('uid', config.auth.uid);
    body.append('aesKeys', JSON.stringify(config.auth.aesKeys));
    body.append('metadata', JSON.stringify(config.metadata));
    let responseJson = null;
    responseJson = await db.requestFileUpload(body);
    return responseJson;
}

const requestAsyncCreateJob = async (config) => {
    const body = new FormData();
    body.append('assessmentType', config.assessmentType);
    body.append('assessmentMetadata', JSON.stringify(config.assessmentMetadata));
    body.append('videoName', config.videoName);
    body.append("privacyMetadata", JSON.stringify(config.privacyMetadata));
    body.append("assessmentType", config.assessmentType);
    body.append("platform", config.platform);
    body.append('uid', config.auth.uid);
    body.append('aesKeys', JSON.stringify(config.auth.aesKeys));
    body.append('metadata', JSON.stringify(config.metadata));
    body.append('customInstructions', config.customInstructions);
    let responseJson = null;
    responseJson = await db.requestAsyncFileUpload(body);
    return responseJson;
}

/* Function that submits job using requestFIleUpload API */
/* 
    config: {
        ext, // Extension of file to upload
        assessmentMetadata,
        videoName, // Name of inspection
        deviceToken, // Device token for notification purposes. Optional
        privacyMetadata: {
            blurFace,
            blurBackground
        },
        filesize, // Size of file to upload
        platform, // 'web', 'ios', or 'android',
        clipSegments, // Clips to crop to
        auth: {
            uid,
            aesKeys
        },
    }
*/
export const submitJob = async (config, file, uploadCallback) => {
    const responseJson = await requestCreateJob({
        ...config,
        // Ensure only 1 chunk
        chunksize: config.filesize
    });

    let axiosConfig = {
      headers: {
        "Content-Type": file.type
      },
      onUploadProgress: uploadCallback
    };

    const uploadResponse = await axios.put(responseJson["urls"][0], file, axiosConfig);
    const headers = uploadResponse.headers;
    const etag = headers["etag"];
    const parts = [{ETag: etag, PartNumber: 1}]

    await db.uploadFinished(responseJson['job_id'], {parts: parts, uploadId: responseJson["uploadId"]});
    return responseJson;
}

/* Function that submits request to create new posture for existing assessment API */
/* 
    config: {
        aesKeys,
        assessmentId,
        videoId,
        uid,
        postureTime, // The time to add new posture on
        personId
    }
*/
export const submitNewPosture = async (config, uploadCallback) => {
    const body = new FormData();
    body.append("personId", config.personId);
    body.append("postureTime", config.postureTime);
    body.append("videoId", config.videoId);
    body.append("assessmentId", config.assessmentId);
    body.append('uid', config.uid);
    body.append('aesKeys', JSON.stringify(config.aesKeys));
    let responseJson = await db.submitNewPosture(body);
    return responseJson;
}


/* Function that submits job using requestAsyncFileUpload API. 
   The intent is to create a request to upload a file that can
   be passed to a third party to actually execute the upload */
/* 
    config: {
        assessmentMetadata,
        videoName, // Name of inspection
        deviceToken, // Device token for notification purposes. Optional
        privacyMetadata: {
            blurFace,
            blurBackground
        },
        platform, // 'web', 'ios', or 'android',
        auth: {
            uid,
            aesKeys
        },
        customInstructions // custom text to display to the uploader
    }
*/
export const submitAsyncJob = async (config, file, uploadCallback) => {
    const responseJson = await requestAsyncCreateJob(config);
    return responseJson;
}

/* Function that uploads file for a job created using the 
   requestAsyncFileUpload API. This is meant to be used by
   a 3rd party to actually upload a file to S3

    config: {
        clipSegments,
        ext,
        platform, // 'web', 'ios', or 'android',
        videoId,
        uploadId,
        smallKey // the key that this job refers to on client side
    }
*/
export const uploadAsyncJob = async (url, config, file, uploadCallback) => {
    let axiosConfig = {
      headers: {
        "Content-Type": file.type
      },
      onUploadProgress: uploadCallback
    };

    const uploadResponse = await axios.put(url, file, axiosConfig);
    const headers = uploadResponse.headers;
    const etag = headers["etag"];
    const parts = [{ETag: etag, PartNumber: 1}]

    let ret = await db.asyncUploadFinished(
        config['videoId'], 
        {parts: parts, uploadId: config["uploadId"], assessmentMetadata: config}
    );
    return ret;
}
