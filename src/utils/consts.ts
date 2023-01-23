const ROOT_DIR = "assets/";
const DLV_CODE_DIR = "code/dlv/";
const FULL_PATH = ROOT_DIR+DLV_CODE_DIR;
const COOKBOOK_EXTENSION_FILE = ".txt";


export const PATH_TO_JSON_DICTIONARY ={
    CONSTANTS: ROOT_DIR+"constants.json",
	AGGREGATES: ROOT_DIR+"aggregates.json",
	BUILTINS: ROOT_DIR+"builtins.json"
};

export const DYNAMIC_PREDICATE_REGEXS = {
	FULL_REGEX: /(\w+\s*\(\s*\w+(?:\s*,\s*\w+\s*)*\s*\))\s*(?::-|\||\.|,)/g,
	AUX_REGEX: /(\w+)\s*\(/g

};

export const DYNAMIC_TERMS_REGEXS = {
	FULL_REGEX:/\w+\s*\(\s*\w+(?:\s*,\s*\w+\s*)*\s*\)\s*(?::-|\||\.|,)/g
};

export const PATH_TO_COOKBOOK_EXAMPLES = {
	ADVANCED_KNAPSACK_PROBLEM : FULL_PATH + "ADVANCED_KNAPSACK_PROBLEM"+COOKBOOK_EXTENSION_FILE,
	KNAPSACK_PROBLEM: FULL_PATH + "KNAPSACK_PROBLEM" + COOKBOOK_EXTENSION_FILE,
	THREE_COLORABILITY: FULL_PATH + "3_COLORABILITY" + COOKBOOK_EXTENSION_FILE,
	HAMILTON_PATH : FULL_PATH + "HAMILTON_PATH" + COOKBOOK_EXTENSION_FILE,
	MINIMUM_SPANNING_TREE: FULL_PATH + "MINIMUM_SPANNING_TREE" + COOKBOOK_EXTENSION_FILE,
	SEATING: FULL_PATH + "SEATING" + COOKBOOK_EXTENSION_FILE,
	STRATEGIC_COMPANIES: FULL_PATH + "STRATEGIC_COMPANIES" + COOKBOOK_EXTENSION_FILE,
	VERTEX_COVER: FULL_PATH + "VERTEX_COVER" + COOKBOOK_EXTENSION_FILE
};

