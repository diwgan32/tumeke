import { Rula } from "./assessments/Rula";
import { Reba } from "./assessments/Reba";
import { Niosh } from "./assessments/Niosh";
import { HandStrain } from "./assessments/HandStrain";

import RulaConfig from "../config/rula.json";
import RebaConfig from "../config/reba.json";
import NioshConfig from "../config/niosh.json";
import HandStrainConfig from "../config/handstrain.json";

import {
	getCompareObject
} from "./utils/compare";

import {
	getRecommendations
} from "./utils/recommendations";

export {
	Rula,
	Reba,
	Niosh,
	HandStrain,
	RulaConfig,
	RebaConfig,
	NioshConfig,
	HandStrainConfig,
	getCompareObject,
	getRecommendations,
}