import _ from 'lodash';
import config from '../../config/handstrain.json'
import {
  strToArr,
  interp,
  computeRangesHelper
} from "./NioshUtils"

export class HandStrain {
  constructor(oldObject) {
    this.initialized = true;
    if (oldObject == null) {
      this.assessmentResult = {};
      this.riskComponents = {};
      this.additionalInputs = this.getAdditionalInputs();
      return;
    }
    this.assessmentResult = _.cloneDeep(oldObject.assessmentResult);
    this.additionalInputs = _.cloneDeep(oldObject.additionalInputs);
    this.riskComponents = _.cloneDeep(oldObject.riskComponents);

    this.computeAssessment();
  }

  getAdditionalInputs = () => {
    let inputs = {
        "borgScale": 2,
        "taskDuration" : 1
    };
    return inputs;
  }


  getIntensityMultiplier = (borg) => {
    let borgPerc = borg/10.0;
    if (borgPerc <= .4) {
      return 30*borgPerc**3 - 15.6*borgPerc**2 + 13*borgPerc + .4;
    }
    return 36*borgPerc**3 - 33.3*borgPerc**2 + 24.77*borgPerc - 1.86;
  }
        

  getEffortMultiplier = (efforts) => {
    if (efforts <= 90) {
      return .1 + .25 * efforts
    }
    return .00334 * efforts**1.96;
  }
        

  getDurationMultiplier = (duration) => {
    if (duration <= 60) {
      return .45 + .31 * duration
    }
    return 19.17 * Math.log(duration) - 59.44;
  }

  getFlexionMultiplier = (angle) => {
    return 1.2 * Math.exp(.009 * angle) - .2;
  }

  getExtensionMultiplier = (angle) => {
    if (angle <= 30) {
      return 1.0;
    }
    return 1.0 + .00028 * (angle - 30)**2;
  }

  getWorkdayMultiplier = (workday) => {
    if (workday < .05) {
        return .2;
    }
    return .042 * workday + .09 * Math.log(workday) + .477;
  }

  getRiskScoreInfo = (component, score) => {
    const range = this.computeRange(config.ResultValues, component, score);
    return {
      Score: score,
      Color: config.ResultValues[component][range]["Color"],
      Text: config.ResultValues[component][range]["Text"],
      ShortText: config.ResultValues[component][range]["ShortText"]
    };
  }

  getRiskComponent = (info) => {
    return parseFloat(Number(this.riskComponents[info]).toFixed(2))
  }

  getAdditionalInput = (info) => {
    return this.additionalInputs[info];
  }

  getAssessmentResult = (info) => {
    return this.assessmentResult[info];
  }

  updateAdditionalInfo = (typeOfInput, bodyGroup, newValue) => {
    this.additionalInputs[typeOfInput] = newValue;
    this.computeAssessment();
  };

  computeRange = (map, component, score) => {
    const ret = computeRangesHelper(map[component], score);
    if (ret == undefined) {
      throw "No range found " + component;
    }
    return ret;
  }

  updateRiskComponents = (typeOfInput, bodyGroup, newValue) => {
    this.riskComponents[typeOfInput] = newValue;
    this.computeAssessment();
  };

  computeAssessment = () => {
    let postureMultiplierLeft = 1.0;
    if (this.riskComponents["flexionAngleLeft"] > this.riskComponents["extensionAngleLeft"]) {
      postureMultiplierLeft = this.getFlexionMultiplier(this.riskComponents["flexionAngleLeft"])
    } else {
      postureMultiplierLeft = this.getExtensionMultiplier(this.riskComponents["extensionAngleLeft"])
    }
    let postureMultiplierRight = 1.0;
    if (this.riskComponents["flexionAngleRight"] > this.riskComponents["extensionAngleRight"]) {
      postureMultiplierRight = this.getFlexionMultiplier(this.riskComponents["flexionAngleRight"])
    } else {
      postureMultiplierRight = this.getExtensionMultiplier(this.riskComponents["extensionAngleRight"])
    }

    
    this.assessmentResult["resultLeft"] = 
        this.getRiskScoreInfo("resultLeft", this.getIntensityMultiplier(this.additionalInputs["borgScale"]) * 
        this.getEffortMultiplier(this.riskComponents["effortsLeft"]) * 
        this.getDurationMultiplier(this.riskComponents["durationPerExertionLeft"]) * 
        postureMultiplierLeft * 
        this.getWorkdayMultiplier(this.additionalInputs["taskDuration"])) 

    this.assessmentResult["resultRight"] = 
        this.getRiskScoreInfo("resultRight", this.getIntensityMultiplier(this.additionalInputs["borgScale"]) * 
        this.getEffortMultiplier(this.riskComponents["effortsRight"]) * 
        this.getDurationMultiplier(this.riskComponents["durationPerExertionRight"]) * 
        postureMultiplierRight * 
        this.getWorkdayMultiplier(this.additionalInputs["taskDuration"]))

    this.assessmentResult["im"] = this.getRiskScoreInfo("im", this.getIntensityMultiplier(this.additionalInputs["borgScale"]));
    this.assessmentResult["eml"] = this.getRiskScoreInfo("eml", this.getEffortMultiplier(this.riskComponents["effortsLeft"]));
    this.assessmentResult["dml"] = this.getRiskScoreInfo("dml", this.getDurationMultiplier(this.riskComponents["durationPerExertionLeft"]));
    this.assessmentResult["pml"] = this.getRiskScoreInfo("pml", postureMultiplierLeft);
    this.assessmentResult["wm"] = this.getRiskScoreInfo("wm", this.getWorkdayMultiplier(this.additionalInputs["taskDuration"]));

    this.assessmentResult["emr"] = this.getRiskScoreInfo("emr", this.getEffortMultiplier(this.riskComponents["effortsRight"]));
    this.assessmentResult["dmr"] = this.getRiskScoreInfo("dmr", this.getDurationMultiplier(this.riskComponents["durationPerExertionRight"]));
    this.assessmentResult["pmr"] = this.getRiskScoreInfo("pmr", postureMultiplierRight);
  }
}
     