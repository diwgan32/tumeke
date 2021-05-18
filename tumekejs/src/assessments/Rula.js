import config from '../../config/rula.json';
import cloneDeep from 'lodash/cloneDeep';
import { getSchemaFromComponentValues } from './RulaReba';

export class Rula {
  computeRula = () => {
    const wrist = this.getRiskComponentValue("Wrist", "Score")
    const upper_arm = this.getRiskComponentValue("Upper Arm", "Score") + 
      this.getRiskComponentValue("Upper Arm", "Abducted") + 
      this.getRiskComponentValue("Upper Arm", "ShoulderRaised")
    const lower_arm = this.getRiskComponentValue("Lower Arm", "Score") +
      this.getRiskComponentValue("Lower Arm", "Midline")
    const table_a_score = Rula.rulaTableA[wrist][upper_arm - 1][lower_arm - 1]

    const trunk_score = this.getRiskComponentValue("Trunk", "Score") +
      this.getRiskComponentValue("Trunk", "Twist") +
      this.getRiskComponentValue("Trunk", "SideBend")
    const leg_score = 1
    const neck_score = this.getRiskComponentValue("Neck", "Score") + 
      this.getRiskComponentValue("Neck", "Twist") +
      this.getRiskComponentValue("Neck", "SideBend")
    const table_b_score = Rula.rulaTableB[trunk_score][leg_score][neck_score - 1]


    const finalArm = Math.min(
      this.additionalInputs['Muscle Use']['Arm'] +
        this.additionalInputs['Force']['Arm'] +
        table_a_score,
      8,
    );
    const finalLeg = Math.min(
      this.additionalInputs['Muscle Use']['Leg'] +
        this.additionalInputs['Force']['Leg'] +
        table_b_score,
      7,
    );

    this.assessmentResult = {
      ...this.assessmentResult,
      ...this.getRiskScoreInfo(
        "Overall",
        Rula.rulaTable[finalLeg][finalArm - 1]
      )
    };

    this.assessmentResult['Components'] = {};
    this.assessmentResult['Components']['Trunk'] = 
      this.getRiskScoreInfo("Trunk", trunk_score);
    this.assessmentResult['Components']['Upper Arm'] =
      this.getRiskScoreInfo("Upper Arm", upper_arm);
    this.assessmentResult['Components']['Lower Arm'] = 
      this.getRiskScoreInfo("Lower Arm", lower_arm);
    this.assessmentResult['Components']['Neck'] = 
      this.getRiskScoreInfo("Neck", neck_score);
  };

  getRiskScoreInfo = (bodyPart, score) => {
    return {
      "Score": score,
      "Color": config.BodyPartScores[bodyPart][score]["Color"],
      "ShortText": config.BodyPartScores[bodyPart][score]["ShortText"],
      "TranslateText": config.BodyPartScores[bodyPart][score]["TranslateText"]
    }
  }

  updateAdditionalInfo = (bodyGroup, info, newValue) => {
    this.additionalInputs[bodyGroup][info] = newValue;
    this.computeRula();
  };

  updateRiskComponents = (bodyGroup, type, newValue) => {
    this.riskComponents[bodyGroup][type] = newValue;
    this.computeRula();
  };

  constructor(oldObject) {
    this.initialized = true;
    if (oldObject == null) {
      this.assessmentResult = {};
      this.riskComponents = {};
      this.additionalInputs = {};
      this.highestRiskTime = 0;
      return;
    }
    this.assessmentResult = cloneDeep(oldObject.assessmentResult);
    this.additionalInputs = cloneDeep(oldObject.additionalInputs);
    this.riskComponents = cloneDeep(oldObject.riskComponents);
    this.highestRiskFrame = cloneDeep(oldObject.highestRiskFrame);
    this.warningsExist = cloneDeep(this.doWarningsExist(oldObject.riskComponents));
    this.computeRula();
  }

  doWarningsExist = (riskComponentsOldObject) => {
    let warnings = false
    for(const key of Object.keys(riskComponentsOldObject)) {
      if (typeof riskComponentsOldObject[key] === "object") {
        warnings |= this.doWarningsExist(riskComponentsOldObject[key])
      } else if (riskComponentsOldObject[key] === -1) {
        warnings = true
      }
    }
    return warnings
  }


  getRiskComponentValue = (bodyPart, componentId) => {
    if (!this.riskComponents.hasOwnProperty(bodyPart)) {
      return 0;
    }
    if (!this.riskComponents[bodyPart].hasOwnProperty(componentId)) {
      return 0;
    }
    if (this.riskComponents[bodyPart][componentId] === -1) {
      return Rula.Schema[bodyPart][componentId]
    }
    return this.riskComponents[bodyPart][componentId]
  }
}

Rula.getRiskScoresFromLevel = (level) => {
  let l = [];
  for (let score in config.BodyPartScores["Overall"]) {
    if (config.BodyPartScores["Overall"][score]["ShortText"].toLowerCase() === level.toLowerCase()) {
      l.push(parseInt(score));
    }
  }
  return l;
}

Rula.Schema = getSchemaFromComponentValues(config.ComponentValues)

//wrist, upper_arm - 1, lower_arm - 1
Rula.rulaTableA = {}
Rula.rulaTableA[1] = [[1, 2, 2], [2, 3, 3], [3, 3, 4], [4, 4, 4], [5, 5, 6], [7, 8, 9]]
Rula.rulaTableA[2] = [[2, 2, 3], [3, 3, 4], [4, 4, 4], [4, 4, 4], [5, 6, 6], [7, 8, 9]]
Rula.rulaTableA[3] = [[2, 3, 3], [3, 3, 4], [4, 4, 4], [4, 4, 5], [5, 6, 7], [7, 8, 9]]
Rula.rulaTableA[4] = [[3, 3, 4], [4, 4, 5], [5, 5, 5], [5, 5, 6], [6, 7, 7], [8, 9, 9]]

//[Trunk, leg, neck - 1]
Rula.rulaTableB = {}
Rula.rulaTableB[1] = {}
Rula.rulaTableB[2] = {}
Rula.rulaTableB[3] = {}
Rula.rulaTableB[4] = {}
Rula.rulaTableB[5] = {}
Rula.rulaTableB[6] = {}

Rula.rulaTableB[1][1] = [1, 2, 3, 5, 7, 8]
Rula.rulaTableB[1][2] = [3, 3, 3, 5, 7, 8]
Rula.rulaTableB[2][1] = [2, 2, 3, 5, 7, 8]
Rula.rulaTableB[2][2] = [3, 3, 4, 6, 7, 8]
Rula.rulaTableB[3][1] = [3, 4, 4, 6, 7, 8]
Rula.rulaTableB[3][2] = [4, 5, 5, 7, 8, 8]
Rula.rulaTableB[4][1] = [5, 5, 5, 7, 8, 8]
Rula.rulaTableB[4][2] = [5, 5, 6, 7, 8, 9]
Rula.rulaTableB[5][1] = [6, 6, 6, 7, 8, 9]
Rula.rulaTableB[5][2] = [6, 7, 7, 7, 8, 9]
Rula.rulaTableB[6][1] = [7, 7, 7, 8, 8, 9]
Rula.rulaTableB[6][2] = [7, 7, 7, 8, 8, 9]

Rula.rulaTable = {};
Rula.rulaTable[1] = [1, 2, 3, 3, 4, 4, 5, 5];
Rula.rulaTable[2] = [2, 2, 3, 3, 4, 4, 5, 5];
Rula.rulaTable[3] = [3, 3, 3, 3, 4, 5, 6, 6];
Rula.rulaTable[4] = [3, 4, 4, 4, 5, 6, 6, 7];
Rula.rulaTable[5] = [4, 4, 4, 5, 6, 6, 7, 7];
Rula.rulaTable[6] = [5, 5, 5, 6, 7, 7, 7, 7];
Rula.rulaTable[7] = [5, 5, 6, 6, 7, 7, 7, 7];