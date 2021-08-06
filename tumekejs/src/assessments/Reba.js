import config from '../../config/reba.json';
import cloneDeep from 'lodash/cloneDeep';
import { getSchemaFromComponentValues } from './RulaReba';

export class Reba {
  constructor(oldObject) {
    this.initialized = true;
    if (oldObject == null) {
      this.assessmentResult = {};
      this.riskComponents = {};
      this.additionalInputs = {};
      return;
    }
    this.assessmentResult = cloneDeep(oldObject.assessmentResult);
    this.additionalInputs = cloneDeep(oldObject.additionalInputs);
    this.riskComponents = cloneDeep(oldObject.riskComponents);
    this.highestRiskFrame = cloneDeep(oldObject.highestRiskFrame);
    this.warningsExist = cloneDeep(this.doWarningsExist(oldObject.riskComponents));
    this.computeReba();
  }

  getRiskScoreInfo = (bodyPart, score) => {
    return {
      "Score": score,
      "Color": config.BodyPartScores[bodyPart][score]["Color"],
      "ShortText": config.BodyPartScores[bodyPart][score]["ShortText"],
      "TranslateText": config.BodyPartScores[bodyPart][score]["TranslateText"]
    }
  }

  updateAdditionalInfo = (typeOfInput, bodyGroup, newValue) => {
    this.additionalInputs[typeOfInput][bodyGroup] = newValue;
    this.computeReba();
  };

  updateRiskComponents = (bodyGroup, type, newValue) => {
    this.riskComponents[bodyGroup][type] = newValue;
    this.computeReba();
  };

  computeReba = () => { 
    const neck_score = Math.min(
      this.getRiskComponentValue("Neck", "Score") + 
      this.getRiskComponentValue("Neck", "Twist") +
      this.getRiskComponentValue("Neck", "SideBend"), 
    3)
    const trunk_score = Math.min(
      this.getRiskComponentValue("Trunk", "Score") +
      this.getRiskComponentValue("Trunk", "Twist") +
      this.getRiskComponentValue("Trunk", "SideBend"), 
    5)

    const leg_score = this.getRiskComponentValue("Leg", "Score")

    const table_a_score = Reba.rebaTableA[trunk_score][neck_score][leg_score - 1]

    const wrist = this.getRiskComponentValue("Wrist", "Score") + 
                  this.getRiskComponentValue("Wrist", "Twist")
    const upper_arm = this.getRiskComponentValue("Upper Arm", "Score") + 
      this.getRiskComponentValue("Upper Arm", "Abducted") + 
      this.getRiskComponentValue("Upper Arm", "ShoulderRaised")
    const lower_arm = this.getRiskComponentValue("Lower Arm", "Score")

    const table_b_score = Reba.rebaTableB[upper_arm][lower_arm][wrist - 1] 
   
    const finalTableA = Math.min(table_a_score +
        this.additionalInputs['Force']['Load'] + 
        this.additionalInputs['Force']['ForceBuildup'], 
      12
    );
    
    const finalTableB = Math.min(table_b_score +
      this.additionalInputs['Misc']['CouplingScore'], 
      12
    );
    
    this.assessmentResult = {
      ...this.assessmentResult, ...this.getRiskScoreInfo(
        "Overall",

        Reba.rebaTableFinal[finalTableA][finalTableB - 1] + 
        this.additionalInputs["Misc"]["BodyPartHeldStatic"] +
        this.additionalInputs["Misc"]["RepeatedSmallActions"] +
        this.additionalInputs["Misc"]["RapidPostureChange"]
      )
    };

    this.assessmentResult["Components"] = {}
    this.assessmentResult['Components']['Trunk'] = this.getRiskScoreInfo(
      "Trunk",
      trunk_score
    );

    this.assessmentResult['Components']['Upper Arm'] = 
      this.getRiskScoreInfo('Upper Arm', upper_arm);
    this.assessmentResult['Components']['Lower Arm'] = 
      this.getRiskScoreInfo('Lower Arm', lower_arm);
    this.assessmentResult['Components']['Neck'] =
      this.getRiskScoreInfo("Neck", neck_score);
    this.assessmentResult['Components']['Leg'] =
      this.getRiskScoreInfo("Leg", leg_score);
    this.assessmentResult['Components']['Wrist'] =
      this.getRiskScoreInfo("Wrist", wrist);
  }

  getRiskComponentValue = (bodyPart, componentId) => {
    if (!this.riskComponents.hasOwnProperty(bodyPart)) {
      return 0;
    }
    if (!this.riskComponents[bodyPart].hasOwnProperty(componentId)) {
      return 0;
    }
    if (this.riskComponents[bodyPart][componentId] === -1) {
      return Reba.Schema[bodyPart][componentId]
    }
    return this.riskComponents[bodyPart][componentId]
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
}

function returnDefaultValueIfNan(val, def) {
  if (val === -1) {
    return def;
  }
  return val;
}


Reba.getRiskScoresFromLevel = (level) => {
  let l = [];
  for (let score in config.BodyPartScores["Overall"]) {
    if (config.BodyPartScores["Overall"][score]["ShortText"].toLowerCase() === level.toLowerCase()) {
      l.push(parseInt(score));
    }
  }
  return l;
}

Reba.Schema = getSchemaFromComponentValues(config.ComponentValues)

Reba.rebaTableFinal = {};
Reba.rebaTableFinal[1] = [1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 7];
Reba.rebaTableFinal[2] = [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8];
Reba.rebaTableFinal[3] = [2, 3, 3, 3, 4, 5, 6, 7, 7, 8, 8, 8];
Reba.rebaTableFinal[4] = [3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9];
Reba.rebaTableFinal[5] = [4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 9];
Reba.rebaTableFinal[6] = [6, 6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 10];
Reba.rebaTableFinal[7] = [7, 7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11];
Reba.rebaTableFinal[8] = [8, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 11];
Reba.rebaTableFinal[9] = [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12];
Reba.rebaTableFinal[10] = [10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12];
Reba.rebaTableFinal[11] = [11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12];
Reba.rebaTableFinal[12] = [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];


Reba.rebaTableA = {}
Reba.rebaTableA[1] = {}
Reba.rebaTableA[1][1] = [1, 2, 3, 4]
Reba.rebaTableA[1][2] = [1, 2, 3, 4]
Reba.rebaTableA[1][3] = [1, 2, 3, 4]

Reba.rebaTableA[2] = {}
Reba.rebaTableA[2][1] = [2, 3, 4, 5]
Reba.rebaTableA[2][2] = [3, 4, 5, 6]
Reba.rebaTableA[2][3] = [4, 5, 6, 7]

Reba.rebaTableA[3] = {}
Reba.rebaTableA[3][1] = [2, 4, 5, 6]
Reba.rebaTableA[3][2] = [4, 5, 6, 7]
Reba.rebaTableA[3][3] = [5, 6, 7, 8]

Reba.rebaTableA[4] = {}
Reba.rebaTableA[4][1] = [3, 5, 6, 7]
Reba.rebaTableA[4][2] = [5, 6, 7, 8]
Reba.rebaTableA[4][3] = [6, 7, 8, 9]

Reba.rebaTableA[5] = {}
Reba.rebaTableA[5][1] = [4, 6, 7, 8]
Reba.rebaTableA[5][2] = [6, 7, 8, 9]
Reba.rebaTableA[5][3] = [7, 8, 9, 10]

Reba.rebaTableB = {};
Reba.rebaTableB[1] = {}
Reba.rebaTableB[2] = {}
Reba.rebaTableB[3] = {}
Reba.rebaTableB[4] = {}
Reba.rebaTableB[5] = {}
Reba.rebaTableB[6] = {}

Reba.rebaTableB[1][1] = [1, 2, 2]
Reba.rebaTableB[1][2] = [1, 2, 3]

Reba.rebaTableB[2][1] = [1, 2, 3]
Reba.rebaTableB[2][2] = [2, 3, 4]

Reba.rebaTableB[3][1] = [3, 4, 5]
Reba.rebaTableB[3][2] = [4, 5, 5]

Reba.rebaTableB[4][1] = [4, 5, 5]
Reba.rebaTableB[4][2] = [5, 6, 7]

Reba.rebaTableB[5][1] = [6, 7, 8]
Reba.rebaTableB[5][2] = [7, 8, 8]

Reba.rebaTableB[6][1] = [7, 8, 8]
Reba.rebaTableB[6][2] = [8, 9, 9]
