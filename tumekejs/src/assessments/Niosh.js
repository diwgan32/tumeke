import config from '../../config/niosh.json'

import {
  strToArr,
  interp
} from "./NioshUtils"

const {
  HeightConstantsStandard,
  constants,
  Units,
  CouplingStatus,
  DurationStatus
} = config;

const {
  FM_FREQUENCIES,
  FM_SHORT_DURATION,
  FM_MODERATE_DURATION,
  FM_LONG_DURATION,
  FM_SHORT_DURATION_VERTICAL_CUTOFF,
  FM_MODERATE_DURATION_VERTICAL_CUTOFF,
  FM_LONG_DURATION_VERTICAL_CUTOFF
} = constants;

export class Niosh {
  constructor(oldObject) {
    this.initialized = true;
    if (oldObject == null) {
      this.assessmentResult = {};
      this.riskComponents = {};
      this.additionalInputs = this.getAdditionalInputs();
      return;
    }
    this.assessmentResult = oldObject.assessmentResult;
    this.additionalInputs = oldObject.additionalInputs;
    this.riskComponents = oldObject.riskComponents;
    this.nioshMetadata = oldObject.nioshMetadata;

    this.computeAssessment();
  }

  getAdditionalInputs = () => {
    const inputs = {
      "subjectHeight" : 6.0,
      "averageLoad": -1,
      "units": Units.STANDARD,
      "coupling" : CouplingStatus["GOOD"]["Number"], // NIOSH coupling score
      "shortRest": -1.0, // rest in between lifts, in seconds. If rest < 0 then
                         // we attempt to estimate it from the video
      "liftingDuration": DurationStatus["MODERATE"]["Number"] // Length of a single lifting session, bucketed
    }
    return inputs
  }

  getAdditionalInput = (info) => {
    if (info === "subjectHeight") {
      return this.lengthConvert(this.additionalInputs['subjectHeight'])
    }
    if (info === "averageLoad") {
      return this.weightConvert(this.additionalInputs['averageLoad'])
    }
    return this.additionalInputs[info];
  }

  getAssessmentResult = (info) => {
    if (info === "rwl") {
      if (this.additionalInputs["units"] === Units.METRIC) {
        return Number(this.assessmentResult[info]) * .453;
      }
    }
    
    return this.assessmentResult[info];
  }

  getRiskComponent = (liftNum, info) => {
    if (info === "asymmetryAngle") {
      return parseFloat(Number(this.riskComponents[liftNum]["asymmetryAngle"]).toFixed(2))
    }
    return parseFloat(Number(this.lengthConvert(this.riskComponents[liftNum][info])).toFixed(2));
  }

  lengthConvert = (val) => {
    if (this.additionalInputs["units"] == Units.STANDARD) {
      return val;
    }

    if (this.additionalInputs["units"] == Units.METRIC) {
      return .3048 * val;
    }
  }

  weightConvert = (val) => {
    if (this.additionalInputs["units"] == Units.STANDARD) {
      return val;
    }

    if (this.additionalInputs["units"] == Units.METRIC) {
      return .453 * val;
    }
  }

  updateAdditionalInfo = (typeOfInput, bodyGroup, newValue) => {
    if (this.additionalInputs["units"] == Units.METRIC) {
      if (typeOfInput === "averageLoad") {
        this.additionalInputs["averageLoad"] = (1/.453) * newValue;
      } else {
        this.additionalInputs[typeOfInput] = newValue;
      }
    } else {
      this.additionalInputs[typeOfInput] = newValue;
    }
    this.computeAssessment();
  };

  updateRiskComponents = (typeOfInput, bodyGroup, newValue) => {
    if (this.additionalInputs["units"] == Units.METRIC) {
      if (bodyGroup === "asymmetryAngle") {
        this.riskComponents[typeOfInput]["asymmetryAngle"] = newValue;
      } else {
        this.riskComponents[typeOfInput][bodyGroup] = (1/.3048) * newValue; 
      }
      
    } else {
      this.riskComponents[typeOfInput][bodyGroup] = newValue;
    }
    this.computeAssessment();
  };

  updateRiskComponents = (typeOfInput, bodyGroup, newValue) => {
    if (this.additionalInputs["units"] == Units.METRIC) {
      if (bodyGroup === "asymmetryAngle") {
        this.riskComponents[typeOfInput]["asymmetryAngle"] = newValue;
      } else {
        this.riskComponents[typeOfInput][bodyGroup] = (1/.3048) * newValue; 
      }
      
    } else {
      this.riskComponents[typeOfInput][bodyGroup] = newValue;
    }
    this.computeAssessment();
  };

  interpolateFreqTable = (frequency, table, cutoff) => {
    if (frequency < 0) {
      throw "Frequency cannot be negative"
    }
    if (frequency >= cutoff) {
      return 0.0
    }
    for (let i = 1; i < FM_FREQUENCIES.length; i++) {
      if (frequency >= FM_FREQUENCIES[i-1] && frequency <= FM_FREQUENCIES[i]) {
        // TODO: Carry over interp
        return interp(frequency, FM_FREQUENCIES[i-1], FM_FREQUENCIES[i], table[i-1], table[i])
      }
    }
    return 0.0
  }

  computeFreqHelper = (verticalStart, liftDuration) => {
    const frequency = 1.0/((liftDuration + this.additionalInputs["shortRest"])/60)
    if (this.additionalInputs["liftingDuration"] == DurationStatus["SHORT"]["Number"]) {
      const cutoff = verticalStart < 30 ? FM_SHORT_DURATION_VERTICAL_CUTOFF : 15
      const fm = this.interpolateFreqTable(frequency, FM_SHORT_DURATION, cutoff)
      return fm
    }

    if (this.additionalInputs["liftingDuration"] == DurationStatus["MODERATE"]["Number"]) {
      const cutoff = verticalStart < 30 ? FM_MODERATE_DURATION_VERTICAL_CUTOFF : 15
      const fm = this.interpolateFreqTable(frequency, FM_MODERATE_DURATION, cutoff)
      return fm
    }

    if (this.additionalInputs["liftingDuration"] == DurationStatus["LONG"]["Number"]) {
      const cutoff = verticalStart < 30 ? FM_LONG_DURATION_VERTICAL_CUTOFF : 15
      const fm = this.interpolateFreqTable(frequency, FM_LONG_DURATION, cutoff)
      return fm
    }
  }

  computeLiftDurationHelper = () => {
    let duration = 0
    for (let i = 0; i < this.nioshMetadata["numLifts"]; i++) {
      duration += this.nioshMetadata["startEnd"][String(i)][1] -
                  this.nioshMetadata["startEnd"][String(i)][0]
    }
    return duration/this.nioshMetadata["numLifts"]
  }

  computeLiftRestHelper = () => {
    if (this.nioshMetadata["numLifts"] == 1) {
      return 0;
    }
        
    let rest = 0
    for (let i = 1; i < this.nioshMetadata["numLifts"]; i++) {
      let time = this.nioshMetadata["startEnd"][String(i)][0] -
                 this.nioshMetadata["startEnd"][String(i-1)][1]
      if (time < 0) {
        throw "Lift i starts before lift i-1"
      }
          
      rest += time
    }
    return rest/(this.nioshMetadata["numLifts"] - 1)
  }

  computeCouplingHelper = (v) => {
    if (v < 30) {
      if (this.additionalInputs["coupling"] == CouplingStatus["GOOD"]["Number"]) {
        return 1.0
      }
      if (this.additionalInputs["coupling"] == CouplingStatus["FAIR"]["Number"]) {
        return .95
      }
      if (this.additionalInputs["coupling"] == CouplingStatus["POOR"]["Number"]) {
        return .90
      }
    } else {
      if (this.additionalInputs["coupling"] == CouplingStatus["GOOD"]["Number"]) {
        return 1.0
      }
      if (this.additionalInputs["coupling"] == CouplingStatus["FAIR"]["Number"]) {
        return 1.0
      }
      if (this.additionalInputs["coupling"] == CouplingStatus["POOR"]["Number"]) {
        return .90
      }
    }
  }

  getRiskScoreInfo = (component, score) => {
    const range = this.computeRange(config.ComponentValues, component, score);
    return {
      Score: score,
      Color: config.ComponentValues[component][range]["Color"],
      Text: config.ComponentValues[component][range]["Text"],
      ShortText: config.ComponentValues[component][range]["ShortText"]
    };
  }

  computeRange = (map, component, score) => {
    for (const key in map[component]) {
      const array = strToArr(key);
      
      if (isNaN(array[0]) && score <= array[1]) {
        return key;
      }
      if (isNaN(array[1]) && score >= array[0]) {
        return key;
      }

      if (score >= array[0] && score < array[1]) {
        return key;
      }
    }
    throw "No range found: " + component
  }

  computeAssessment = () => {
    let lc = 51
    let rwl = 0
    let h = 0
    let v = 0
    let d = 0
    let a = 0
    for (let i = 0; i < this.nioshMetadata["numLifts"]; i++) {
      const id = String(i)

      h += Math.max(this.riskComponents[id]["horizontalStart"] * 12.0, 10.0)
      v += this.riskComponents[id]["verticalStart"] * 12.0
      const d_temp = Math.abs(this.riskComponents[id]["verticalStart"] - this.riskComponents[id]["verticalEnd"]) * 12
      d += Math.min(Math.max(10, d_temp), 70)
      a += this.riskComponents[id]["asymmetryAngle"]
      if (a > 135) {
        // TODO handle this
      }
    }

    a = a/this.nioshMetadata['numLifts']
    v = v/this.nioshMetadata['numLifts']
    h = h/this.nioshMetadata['numLifts']
    d = d/this.nioshMetadata['numLifts']

    let vm = Math.min(Math.max(1 - .0075 * Math.abs(v - 30), 0.0), 1.0)
    let hm = Math.min(Math.max(10.0/h, 0.0), 1.0)
    let dm = Math.min(Math.max(.82 + (1.8/d), 0.0), 1.0)
    let am = Math.min(Math.max(1 - .0032*a, 0.0), 1.0)
    
    const duration = this.computeLiftDurationHelper()

    if (this.additionalInputs["shortRest"] < 0 &&
        this.nioshMetadata["numLifts"] > 1) {
      this.additionalInputs["shortRest"] = this.computeLiftRestHelper()
    }

    let fm = this.computeFreqHelper(v, duration)
    let cm = this.computeCouplingHelper(v)
    rwl = lc * hm * vm * dm * am * fm * cm
    this.assessmentResult["rwl"] = rwl
    if (rwl == 0 || this.additionalInputs["averageLoad"] < 0) {
      this.assessmentResult["li"] = this.getRiskScoreInfo("li", -1)
    } else {
      this.assessmentResult["li"] = this.getRiskScoreInfo("li", this.additionalInputs["averageLoad"]/rwl)
    }
    
    this.assessmentResult["fm"] = this.getRiskScoreInfo("fm", fm)
    this.assessmentResult["am"] = this.getRiskScoreInfo("am", am)
    this.assessmentResult["dm"] = this.getRiskScoreInfo("dm", dm)
    this.assessmentResult["hm"] = this.getRiskScoreInfo("hm", hm)
    this.assessmentResult["vm"] = this.getRiskScoreInfo("vm", vm)
  }
}
     