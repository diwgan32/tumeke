import { Rula, Reba, RulaConfig, RebaConfig } from '../'

export const getChartDataHelper = (frequencyTable) => {
	let s = 0;
	let percentages = {};
	for (const score in frequencyTable) {
		s += frequencyTable[score];
	}
	if (s == 0) s = 1;
	for (const score in frequencyTable) {
		percentages[score] = Math.floor((frequencyTable[score]/s) * 10000)/100.0;
	}
	if ("-1" in percentages) {
		percentages["Not Identified"] = percentages["-1"];
		delete percentages["-1"];
	}
	return percentages;
}

export const getChartDataForVideo = (videoData, type, detailedView=true) => {
	const subjectId = "0";
	const videoId = videoData.key;
	const assessmentType = videoData.assessmentType;
	let frequencyTable;
	if (type === "Overall") {
		frequencyTable = videoData.summaryStats[subjectId].riskFrequency;
	} else {
		frequencyTable = videoData.summaryStats[subjectId].componentFrequency[type]["Combined"];
	}
	let processedFreqTable = {};
	let colors = {};
	let config = assessmentType === 1 ? RulaConfig.BodyPartScores : RebaConfig.BodyPartScores;
	if (!detailedView) {
		for (const score in frequencyTable) {
			if (score == "-1") {
				processedFreqTable["-1"] = frequencyTable["-1"];
				colors["Not Identified"] = '#6c7b8a';
				continue;
			}
			const key = config[type][parseInt(score)]["ShortText"];
			if (key in processedFreqTable) {
				processedFreqTable[key] += frequencyTable[score];
			} else {
				processedFreqTable[key] = frequencyTable[score];
				colors[key] = config[type][parseInt(score)]["Color"];
			}
		}
	} else {
		processedFreqTable = frequencyTable;
		for (const score in processedFreqTable) {
			let s = parseInt(score);
			if (s in config[type]) {
				colors[score] = config[type][s]["Color"];
			} else {
				colors["Not Identified"] = '#6c7b8a';
			}
		}
	}

	const data = getChartDataHelper(processedFreqTable);

	return {
		videoId: videoId,
		data: data,
		colors: colors
	}
}

export const equalizeFreqHelper = (chartTables) => {
	let maxEntries = 0;
	for (let i = 0; i < chartTables.length; i++) {
		const entries1 = Object.keys(chartTables[i].data);
		for (let j = i; j < chartTables.length; j++) {
			if (i == j) {
				continue
			}
			const entries2 = Object.keys(chartTables[j].data);

			let present = entries1.filter((e) => {
				return !entries2.includes(e);
			})

			for (let k = 0; k < present.length; k++) {
				chartTables[j].data[present[k]] = 0.0;
			}

			present = entries2.filter((e) => {
				return !entries1.includes(e);
			})

			for (let k = 0; k < present.length; k++) {
				chartTables[i].data[present[k]] = 0.0;
			}
		}
	}
	return chartTables;
}

const isSummaryStatsInvalid = (videoData) => {
	const subjectId = "0";
	return (!("summaryStats" in videoData) ||
		!videoData.summaryStats ||
		videoData.summaryStats === {} ||
		!videoData.summaryStats[subjectId] ||
		videoData.summaryStats[subjectId] === {});
}

export const getChartData = (videoDatas, type, detailedView) => {
	const subjectId = "0";
	if (type !== "Overall") {
		let maxNumEntry = 0;
		for (let i = 0; i < videoDatas.length; i++) {
			if (isSummaryStatsInvalid(videoDatas[i]) ||
				!("componentFrequency" in videoDatas[i].summaryStats[subjectId]) ||
				!(type in videoDatas[i].summaryStats[subjectId].componentFrequency)) {
				return [];
			}
		}

		return equalizeFreqHelper(videoDatas.map( (videoData) => {
			return getChartDataForVideo(
				videoData,
				type,
				detailedView
			)
		}));
	}

	for (let i = 0; i < videoDatas.length; i++) {
		if (isSummaryStatsInvalid(videoDatas[i])) {
			return [];
		}
		
	}

	return equalizeFreqHelper(videoDatas.map( (videoData) => {
		return getChartDataForVideo(
			videoData,
			type,
			detailedView
		)
	}));
}

// videoDatas is an array of data objs from our server
export const getCompareObject = (videoDatas, detailedView=true) => {
	const compareObject = {};
	const subjectId = "";
	compareObject["Overall"] = getChartData(videoDatas, "Overall", detailedView);
	compareObject["Leg"] = getChartData(videoDatas, "Leg", detailedView);
	compareObject["Lower Arm"] = getChartData(videoDatas, "Lower Arm", detailedView);
	compareObject["Upper Arm"] = getChartData(videoDatas, "Upper Arm", detailedView);
	compareObject["Neck"] = getChartData(videoDatas, "Neck", detailedView);
	compareObject["Trunk"] = getChartData(videoDatas, "Trunk", detailedView);
	compareObject["Wrist"] = getChartData(videoDatas, "Wrist", detailedView);
	return compareObject;
}