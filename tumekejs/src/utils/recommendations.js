import { RulaConfig, RebaConfig, Rula, Reba } from '../';

const getImprovementObj = (config, videoData, selectedPosture, bodyPartId, componentId) => {
    const posture = videoData.postures[selectedPosture];
    const riskAssessment = posture.riskAssessment;
    const oldAssessmentObj = riskAssessment;
    let newAssessmentObj = null;
    let improvementObj = {};

    // Assign min value for bodypart + type
    const minValue = config.ComponentValues[bodyPartId][componentId].Base;
    // const minValue = 1; // TODO(znoland): get min value for component
    const assessmentType = videoData.assessmentType;
    // Get new RULA or REBA object
    if (assessmentType === 1) {
      newAssessmentObj = new Rula(oldAssessmentObj)
    } else if (assessmentType === 2) {
      newAssessmentObj = new Reba(oldAssessmentObj)
    }
    newAssessmentObj.updateRiskComponents(bodyPartId, componentId, minValue);

    /* Determine score card type:
     *   1. Overall risk
     *   2. General reduction (does not have a body part risk)
     *   3. Body part risk
     */
    //TODO(znoland): come up with other recommendations for warnings without a score impact

    const oldScore = oldAssessmentObj.assessmentResult["Score"];
    const newScore = newAssessmentObj.assessmentResult["Score"];
    improvementObj["overall-risk-reduction"] = Math.abs(Math.round((newScore / oldScore - 1) * 100))
    if (newAssessmentObj.assessmentResult["Score"] < oldAssessmentObj.assessmentResult["Score"]) {
      improvementObj['type'] = 'overall';
      improvementObj['translateType'] = 'breakdown.overall';
      improvementObj['old-risk-text'] = oldAssessmentObj.assessmentResult["ShortText"];
      improvementObj['old-risk-translate-text'] = oldAssessmentObj.assessmentResult["TranslateText"];
      improvementObj['old-risk-score'] = oldAssessmentObj.assessmentResult["Score"];
      improvementObj['new-risk-text'] = newAssessmentObj.assessmentResult["ShortText"];
      improvementObj['new-risk-translate-text'] = newAssessmentObj.assessmentResult["TranslateText"];
      improvementObj['new-risk-score'] = newAssessmentObj.assessmentResult["Score"];
    } else if (!(bodyPartId in newAssessmentObj.assessmentResult.Components)) {
      // return (<div>No component score</div>);
      return;
    } else if (
      newAssessmentObj.assessmentResult.Components[bodyPartId]["Score"] < oldAssessmentObj.assessmentResult.Components[bodyPartId]["Score"]
    ) {
      improvementObj['type'] = bodyPartId;
      improvementObj['translateType'] = 'rulareba.'+bodyPartId.toLowerCase().split(' ').join('')+'.name';
      improvementObj['old-risk-text'] = oldAssessmentObj.assessmentResult.Components[bodyPartId]["ShortText"];
      improvementObj['old-risk-translate-text'] = oldAssessmentObj.assessmentResult.Components[bodyPartId]["TranslateText"];
      improvementObj['old-risk-score'] = oldAssessmentObj.assessmentResult.Components[bodyPartId]["Score"];
      improvementObj['new-risk-text'] = newAssessmentObj.assessmentResult.Components[bodyPartId]["ShortText"];
      improvementObj['new-risk-translate-text'] = newAssessmentObj.assessmentResult.Components[bodyPartId]["TranslateText"];
      improvementObj['new-risk-score'] = newAssessmentObj.assessmentResult.Components[bodyPartId]["Score"];
    } else if (
      newAssessmentObj.assessmentResult.Components[bodyPartId]["Score"] === oldAssessmentObj.assessmentResult.Components[bodyPartId]["Score"]
    ) {
      // return(<div>No change in body part score</div>)
      return;
    }

    improvementObj['risk-reduction-perc'] = (
      String(Math.abs(Math.round((improvementObj['new-risk-score'] / improvementObj['old-risk-score'] - 1) * 100))) + '%'
    );
    return improvementObj;
  }

const getRiskComponent = (config, videoData, selectedPosture, bodyPartId, componentId, componentObj) => {
  const label = componentObj.label;
  const translateLabel = componentObj.TranslateLabel;
  const posture = videoData.postures[selectedPosture];
  const riskAssessment = posture.riskAssessment;
  const assessmentType = videoData.assessmentType;
  let assessmentObj;
  if (assessmentType === 1) {
    assessmentObj = new Rula(riskAssessment)
  } else if (assessmentType === 2) {
    assessmentObj = new Reba(riskAssessment)
  }

  const componentIndex = riskAssessment.riskComponents[bodyPartId][componentId];
  const bodyPartImage = config.ComponentValues[bodyPartId].Image;
  let severityColor = '#6c7b8a';
  if (componentIndex === -1 || componentIndex === undefined) {
      return {};
  }
  const componentText = config.ComponentValues[bodyPartId][componentId]
    [String(componentIndex)]["Text"];
  const componentTranslateText = config.ComponentValues[bodyPartId][componentId]
    [String(componentIndex)]["TranslateText"];
  const componentWarning = config.ComponentValues[bodyPartId][componentId]
    [String(componentIndex)]["Warning"];
  const componentTranslateWarning = config.ComponentValues[bodyPartId][componentId]
    [String(componentIndex)]["TranslateWarning"];

  if (componentWarning === "" ||
      !componentWarning ||
      componentWarning === null) {
      return {};
  }

  const improvementObj = getImprovementObj(config, videoData, selectedPosture, bodyPartId, componentId);
  if (!improvementObj) {
    return {};
  }
  const score = assessmentObj.assessmentResult["Components"][bodyPartId]["Score"];

  severityColor = config.BodyPartScores[bodyPartId][score]["Color"]
  return {
    componentText: componentText,
    componentWarning: componentWarning,
    componentTranslateText: componentTranslateText,
    componentTranslateWarning: componentTranslateWarning,
    componentImage: bodyPartImage,
    severityColor: severityColor,
    label: label,
    translateLabel: translateLabel,
    bodyPartId: bodyPartId,
    bodyPartTranslateId:
      "rulareba."+bodyPartId.toLowerCase().split(' ').join('')+".name",
    id: bodyPartId + "-" + componentId,
    improvementObj: improvementObj
  } 
}

const getConfig = (videoData) => {
    const config = videoData.assessmentType == 1 ? RulaConfig : RebaConfig;
    return config;
}

export const getRecommendations = (videoData, selectedPosture) => {
  const arr = [];
  const assessmentType = videoData.assessmentType;
  const config = getConfig(videoData);
  const bodyParts = Object.keys(config.ComponentValues);
  for (let i = 0; i < bodyParts.length; i++) {
    const bodyPartId = bodyParts[i];
    const bodyPartObj = config.ComponentValues[bodyPartId];
    const typesOfInfo = Object.keys(bodyPartObj);
    for (let j = 0; j < typesOfInfo.length; j++) {
      const componentId = typesOfInfo[j];
      const componentObj = bodyPartObj[componentId];
      const rec = getRiskComponent(
        config, videoData, selectedPosture, bodyPartId, componentId, componentObj
      );
      if (rec.hasOwnProperty("componentText")) {
        arr.push(rec);
      }
    }
  }
  return arr.sort((a, b) => {
    return b.improvementObj["overall-risk-reduction"]
           - a.improvementObj["overall-risk-reduction"]
  });
};