const rules = require('./rules');
const transforms = require('./transforms');
const logger = require('../logger');
const path = require('path');
const rulesConfig = require(path.join(__dirname, '..', 'config', 'data_quality_config', 'rule_deatail_config', "index.js"));

// hàm này xác định xem record có lỗi hay không, và transform dữ liệu nếu cần thiết 
function processRecord(tableName, record) {
    const tableConfig = rulesConfig[tableName];
    let errors = [];
    const output = { ...record };
    if (!tableConfig) {
        logger.error(`Bảng ${tableName} không có trong ruleConfig.json`);
        return { isValid: false, errors: ['missing_table_config'], output };
    }

    for (const colName in record) {
        const colConfig = tableConfig[colName] || {};
        const ruleList = Array.isArray(colConfig.rules) ? colConfig.rules : [];
        const transformMap = colConfig.transform || {};
        const failedRules = [];

        ruleList.forEach(ruleEntry => {
            const { name: ruleName, args } = parseRuleEntry(ruleEntry);
            if (!ruleName) {
                logger.error(`Empty rule entry for ${tableName}.${colName}, skipping`);
                return;
            }

            const ruleFn = rules[ruleName];
            if (typeof ruleFn !== 'function') {
                logger.error(`Rule "${ruleName}" chưa được định nghĩa (bảng ${tableName}, cột ${colName})`);
                failedRules.push(ruleName);
                errors.push(`${colName} failed ${ruleName}${args.length ? `:${args.join(',')}` : ''}`);
                return;
            }
            try {
                // Normalise result to boolean (some rule fns may return truthy/falsey)
                const isRulePass = !!ruleFn(record[colName], ...args);
                if (!isRulePass) {
                    failedRules.push(ruleName);
                    errors.push(`${colName} failed ${ruleName}${args.length ? `:${args.join(',')}` : ''}`);
                    logger.info(`Rule failed: ${tableName}.${colName} -> ${ruleName}${args.length ? `:${args.join(',')}` : ''}`);
                }
            } catch (err) {
                logger.error(`Lỗi khi chạy rule ${ruleName} cho ${tableName}.${colName}: ${err.message}`);
                failedRules.push(ruleName);
                errors.push(`${colName} failed ${ruleName}${args.length ? `:${args.join(',')}` : ''}`);
            }
        })


        // attempt transforms for failed rules
        // for (const failedRule of failedRules) {
        //     const transformFnName = transformMap[failedRule];
        //     if (!transformFnName) continue;

        //     // transforms are organized per-table in transforms module
        //     const tf = transforms[tableName]?.[transformFnName] || transforms[transformFnName];
        //     if (typeof tf !== 'function') {
        //         logger.error(`Transform "${transformFnName}" không tồn tại cho bảng ${tableName} (cột ${colName})`);
        //         continue;
        //     }

        //     try {
        //         const res = tf(record[colName]);
        //         if (res && res.status) {
        //             output[colName] = res.output;
        //             // remove related error entries
        //             for (let i = errors.length - 1; i >= 0; i--) {
        //                 if (errors[i] === `${colName} failed ${failedRule}`) errors.splice(i, 1);
        //             }
        //             logger.debug(`Transform ${transformFnName} khôi phục ${tableName}.${colName}`);
        //         } else {
        //             logger.debug(`Transform ${transformFnName} không khôi phục được ${tableName}.${colName}`);
        //         }
        //     } catch (err) {
        //         logger.error(`Lỗi transform ${transformFnName} cho ${tableName}.${colName}: ${err.message}`);
        //     }
        // }
    }

    logger.info(`Kết quả xử lý bản ghi: table=${tableName}, valid=${errors.length === 0}`);
    return { isValid: errors.length === 0, errors, output };
}

function parseRuleEntry(rule) {
    if (typeof rule === 'string') {
        if (!rule) return { name: '', args: [] };
        const idx = rule.indexOf(':');
        if (idx === -1) return { name: rule.trim(), args: [] };
        const name = rule.slice(0, idx).trim();
        const argStr = rule.slice(idx + 1).trim();
        const args = argStr.length ? argStr.split(',').map(s => {
            const n = Number(s);
            return Number.isNaN(n) ? s : n;
        }) : [];
        return { name, args };
    }
    if (typeof rule === 'object' && rule !== null) {
        const name = rule.name || rule.rule || '';
        const args = Array.isArray(rule.args) ? rule.args : (rule.arg !== undefined ? [rule.arg] : []);
        return { name, args };
    }
    return { name: String(rule), args: [] };
}
module.exports = { processRecord };