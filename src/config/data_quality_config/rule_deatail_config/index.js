const fs = require("fs");
const path = require("path");

/**
 * Load all rule files inside a directory and its subdirectories.
 * Each JSON file becomes a key-value pair:
 *   { TableName: { ...rules } }
 */
function loadRuleDirectory(dirPath) {
    let mergedRules = {};

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Merge recursively
            mergedRules = {
                ...mergedRules,
                ...loadRuleDirectory(fullPath)
            };
        } else if (item.endsWith(".json")) {
            const fileContent = JSON.parse(fs.readFileSync(fullPath, "utf8"));
            const tableName = path.basename(item, ".json"); // Remove .json

            mergedRules[tableName] = fileContent;
        }
    }

    return mergedRules;
}

/**
 * Load all DB rules under rule_detail_config
 */
function loadAllRules() {
    const baseDir = path.join(__dirname);

    const DB1_config = path.join(baseDir, "DB1_rule_detail_config");
    const DB2_config = path.join(baseDir, "DB2_rule_detail_config");

    let allRules = {};

    if (fs.existsSync(DB1_config)) {
        allRules = {
            ...allRules,
            ...loadRuleDirectory(DB1_config)
        };
    }

    if (fs.existsSync(DB2_config)) {
        allRules = {
            ...allRules,
            ...loadRuleDirectory(DB2_config)
        };
    }

    return allRules;
}

module.exports = loadAllRules();
