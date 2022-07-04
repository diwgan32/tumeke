import { RulaConfig, RebaConfig, HandStrainConfig, HandStrain } from '../';
import { computeRangesHelper } from "../assessments/NioshUtils";

const getImprovementObj = (config, videoData, selectedPosture, bodyPartId, range) => {
    const posture = videoData.posture_assessments[selectedPosture];
    const riskAssessment = posture.riskAssessment;
    const oldAssessmentObj = new HandStrain(riskAssessment);
    let newAssessmentObj = null;
    let improvementObj = {};

    // Assign min value for bodypart + type
    const minValue = config.ComponentValues[bodyPartId].Base;
    // const minValue = 1; // TODO(znoland): get min value for component
    const assessmentType = videoData['data'].assessmentType;
    // Get new RULA or REBA object
    newAssessmentObj = new HandStrain(oldAssessmentObj);
    newAssessmentObj.updateRiskComponents(bodyPartId, "", minValue);
    const multiplierName = config.ComponentValues[bodyPartId].Multiplier;
    /* Determine score card type:
     *   1. Overall risk
     *   2. General reduction (does not have a body part risk)
     *   3. Body part risk
     */
    //TODO(znoland): come up with other recommendations for warnings without a score impact
    const oldScore = oldAssessmentObj.assessmentResult["OverallScore"]["Score"];
    const newScore = newAssessmentObj.assessmentResult["OverallScore"]["Score"];
    console.log("Score", oldScore, newScore);
    improvementObj["overall-risk-reduction"] = Math.abs(Math.round((newScore / oldScore - 1) * 100))
    improvementObj["original-component-value"] = riskAssessment.riskComponents[bodyPartId];
    if (newScore < oldScore) {
      improvementObj['type'] = 'overall';
      improvementObj['translateType'] = 'breakdown.overall';
      improvementObj['old-risk-text'] = oldAssessmentObj.assessmentResult["OverallScore"]["ShortText"];
      improvementObj['old-risk-translate-text'] = oldAssessmentObj.assessmentResult["OverallScore"]["TranslateText"];
      improvementObj['old-risk-score'] = oldAssessmentObj.assessmentResult["OverallScore"]["Score"];
      improvementObj['new-risk-text'] = newAssessmentObj.assessmentResult["OverallScore"]["ShortText"];
      improvementObj['new-risk-translate-text'] = newAssessmentObj.assessmentResult["TranslateText"];
      improvementObj['new-risk-score'] = newAssessmentObj.assessmentResult["OverallScore"]["Score"];
    } else if (!(bodyPartId in newAssessmentObj.riskComponents)) {
      // return (<div>No component score</div>);
      return;
    } else if (
      newAssessmentObj.assessmentResult[multiplierName]["Score"] < oldAssessmentObj.assessmentResult[multiplierName]["Score"]
    ) {
      improvementObj['type'] = config.ComponentValues[bodyPartId]["ShortLabel"];
      improvementObj['translateType'] = 'rulareba.'+bodyPartId.toLowerCase().split(' ').join('')+'.name';
      improvementObj['old-risk-text'] = oldAssessmentObj.assessmentResult[multiplierName]["ShortText"];
      improvementObj['old-risk-translate-text'] = oldAssessmentObj.assessmentResult[multiplierName]["TranslateText"];
      improvementObj['old-risk-score'] = oldAssessmentObj.assessmentResult[multiplierName]["Score"];
      improvementObj['new-risk-text'] = newAssessmentObj.assessmentResult[multiplierName]["ShortText"];
      improvementObj['new-risk-translate-text'] = newAssessmentObj.assessmentResult[multiplierName]["TranslateText"];
      improvementObj['new-risk-score'] = newAssessmentObj.assessmentResult[multiplierName]["Score"];
    }

    improvementObj['risk-reduction-perc'] = (
      String(Math.abs(Math.round((improvementObj['new-risk-score'] / improvementObj['old-risk-score'] - 1) * 100))) + '%'
    );
    return improvementObj;
  }

const getComponentId = (config, videoData, selectedPosture, bodyPartId, componentObj) => {
  const posture = videoData.posture_assessments[selectedPosture];
  const riskAssessment = posture.riskAssessment;
  if (bodyPartId === "resultLeft" || bodyPartId === "resultRight") {
    return undefined;
  }
  const range = computeRangesHelper(componentObj, riskAssessment.riskComponents[bodyPartId]);
  return range;
}

const getRiskComponent = (config, videoData, selectedPosture, bodyPartId, componentObj) => {
  const range = getComponentId(config, videoData, selectedPosture, bodyPartId, componentObj);
  const improvementObj = getImprovementObj(config, videoData, selectedPosture, bodyPartId, range);
  const componentText = config.ComponentValues[bodyPartId][range]["Text"]
  const componentWarning = config.ComponentValues[bodyPartId][range]["Warning"]
  if (componentWarning === "" ||
      !componentWarning ||
      componentWarning === null) {
      return {};
  }
  const componentTranslateText = undefined;
  const componentTranslateWarning = undefined;
  const componentImage = "bodyParts/wrist.png";
  const severityColor = config.ComponentValues[bodyPartId][range]["Color"];
  const label = config.ComponentValues[bodyPartId]["label"];
  const translateLabel = undefined;
  if (improvementObj === undefined) {
    return {};
  }
  return {
    componentText: componentText,
    componentWarning: componentWarning,
    componentTranslateText: componentTranslateText,
    componentTranslateWarning: componentTranslateWarning,
    componentImage: componentImage,
    severityColor: severityColor,
    label: label,
    translateLabel: translateLabel,
    bodyPartId: bodyPartId,
    bodyPartTranslateId: undefined,
    id: bodyPartId + "-" + label,
    improvementObj: improvementObj,
    componentValue: improvementObj["original-component-value"]
  } 
  
}

const getConfig = (videoData) => {
    return HandStrainConfig;
}

export const getRecommendations = (videoData, selectedPosture) => {
  const arr = [];
  const assessmentType = videoData['data'].assessmentType;
  const config = getConfig(videoData);
  const bodyParts = Object.keys(config.ComponentValues);
  for (let i = 0; i < bodyParts.length; i++) {
    const bodyPartId = bodyParts[i];
    const bodyPartObj = config.ComponentValues[bodyPartId];
    const typesOfInfo = Object.keys(bodyPartObj);
    
    const componentObj = bodyPartObj;
    const rec = getRiskComponent(
      config, videoData, selectedPosture, bodyPartId, componentObj
    );
    console.log(rec);
    if (rec.hasOwnProperty("componentText")) {
      arr.push(rec);
    }
    
  }
  return arr.sort((a, b) => {
    return b.improvementObj["overall-risk-reduction"]
           - a.improvementObj["overall-risk-reduction"]
  });
};